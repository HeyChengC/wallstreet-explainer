# -*- coding: utf-8 -*-
"""临时配音 + 时间线：script.json → voice/<id>.wav + timeline.json（画面全部挂在这份时间线的字上）

配音一律：切首尾静音、原速（不用 atempo 事后加速——切掉静音后再加速会很急促）。句间停顿只由 gap 决定。
默认用 edge-tts 出临时配音，它自带逐词时间，不用识别就能给每个字一个时刻。
有正式配音（任何 TTS、克隆音色或真人录音，存成 voice/<id>.final.wav）时自动换上，并用 --asr 重新逐字对齐。

script.json 例：
{
  "voice": "zh-CN-YunxiNeural", "rate": "+0%", "pre": 0.3,
  "title": {"after": "s01", "len": 1.7},
  "lines": [
    {"id": "s01", "text": "今年，光是谷歌、微软、亚马逊、Meta 这四家……", "gap": 0.35},
    {"id": "s10b", "text": "难怪黄仁勋总爱说这句：", "gap": 0.5,
     "bite": {"pre": 0.15, "post": 0.4, "parts": [["footage/jensen.m4a", 101.60, 1.95, "买得越多，省得越多", 2.5]]}}
  ]
}
- say：只给 TTS 读的写法（数字、英文怎么念），不改屏上的 text
- bite：这句之后插一段原声，parts = [源文件, 入点秒, 时长, 中文字幕, 增益dB]；源文件相对 script.json
- pre：开头先空多久再开口（开头快闪垫在下面）；title：哪句后面留片名的时间

  python temp_voice.py film/script.json            # 缺的句子用 edge-tts 补，已有的不重做
  python temp_voice.py film/script.json --redo     # 全部重做临时配音
  python temp_voice.py film/script.json --asr      # 用 faster-whisper 给所有句子逐字对齐（换成正式配音后用）
"""
import asyncio, difflib, json, subprocess, sys
from pathlib import Path

SP = Path(sys.argv[1]).resolve(); D = SP.parent
S = json.loads(SP.read_text('utf-8'))
REDO, ASR = '--redo' in sys.argv, '--asr' in sys.argv

# ---------- 地区感知的音色 ----------
# script.json 里可以写 "region": "taiwan" / "hongkong"，也可以只写 "voice"。
# 优先用显式 voice；没写 voice 但有 region 时用该地区的默认男声。
# **拒绝错配**：region=hongkong 却给了 zh-CN / zh-TW 音色 → 直接报错，不静默生成普通话配音。
REGION_DEFAULT = {
    'taiwan': 'zh-TW-YunJheNeural',
    'hongkong': 'zh-HK-WanLungNeural',
}
REGION_PREFIX = {'taiwan': 'zh-TW-', 'hongkong': 'zh-HK-'}

REGION = S.get('region')
VOICE = S.get('voice')
RATE = S.get('rate', '+0%')

if REGION and REGION not in REGION_DEFAULT:
    print(f'script.json 的 region 只能是 {list(REGION_DEFAULT)}，现在是 {REGION!r}')
    sys.exit(1)

if REGION and not VOICE:
    VOICE = REGION_DEFAULT[REGION]
    print(f'region={REGION} 没写 voice，用默认音色 {VOICE}')

if not VOICE:
    VOICE = 'zh-CN-YunxiNeural'

# 错配检查：香港片不许用 zh-CN / zh-TW；台湾片不许用 zh-CN / zh-HK
if REGION:
    want = REGION_PREFIX[REGION]
    if not VOICE.startswith(want):
        other = {'taiwan': '（不能用普通话或粤语音色读台湾国语稿）',
                 'hongkong': '（不能用普通话或台湾国语读粤语稿——那是另一种语言，不是口音差异）'}[REGION]
        print(f'音色错配：region={REGION} 要求 {want}* 的音色，现在是 {VOICE}{other}')
        print(f'  该地区的默认音色是 {REGION_DEFAULT[REGION]}；确定要用别的，就改 script.json 的 voice。')
        sys.exit(1)

(D / 'voice').mkdir(exist_ok=True)
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03"


def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)]))


def lead_silence(f):
    """切掉的开头静音有多长（逐字时间要减掉它）"""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'silencedetect=n=-45dB:d=0.02', '-f', 'null', '-'], capture_output=True, text=True).stderr
    for ln in out.splitlines():
        if 'silence_end' in ln and 'silence_start: 0' in out.split('silence_end')[0][-60:]:
            return max(0.0, float(ln.split('silence_end:')[1].split('|')[0]) - .03)
    return 0.0


async def edge(text, mp3):
    import edge_tts
    words = []
    com = edge_tts.Communicate(text, VOICE, rate=RATE, boundary='WordBoundary')
    with open(mp3, 'wb') as fp:
        async for ch in com.stream():
            if ch['type'] == 'audio': fp.write(ch['data'])
            elif ch['type'] == 'WordBoundary': words.append([ch['text'], ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7])
    return words


def char_times(caption, words):
    """把逐词时间对到屏上文字的每个字；对不上的字（标点、写法不同的数字）按前后插值"""
    seq = []
    for w, s, e in words:
        w = w.strip()
        for i, ch in enumerate(w): seq.append((ch, s + (e - s) * i / max(1, len(w))))
    a, b = list(caption), [c for c, _ in seq]; tm = [None] * len(a)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): tm[blk.a + k] = seq[blk.b + k][1]
    known = [i for i, x in enumerate(tm) if x is not None]
    for i in range(len(tm)):
        if tm[i] is None:
            p = max([k for k in known if k < i], default=None); n = min([k for k in known if k > i], default=None)
            tm[i] = (0 if p is None and n is None else (tm[n] - .12 * (n - i)) if p is None else (tm[p] + .12 * (i - p)) if n is None
                     else tm[p] + (tm[n] - tm[p]) * (i - p) / (n - p))
    for i in range(1, len(tm)): tm[i] = max(tm[i], tm[i - 1])
    return [max(0.0, x) for x in tm]


whisper = None
def asr_words(wav):
    global whisper
    if whisper is None:
        from faster_whisper import WhisperModel
        try: whisper = WhisperModel('large-v3', device='cuda', compute_type='float16')
        except Exception: whisper = WhisperModel('large-v3', device='cpu', compute_type='int8')
    segs, _ = whisper.transcribe(str(wav), language='zh', word_timestamps=True)
    return [[w.word, float(w.start), float(w.end)] for s in segs for w in s.words]


t = .15 + S.get('pre', 0.0); beats, inserts, title = [], [], None
meta_p = D / 'voice' / 'words.json'; meta = json.loads(meta_p.read_text('utf-8')) if meta_p.exists() else {}
for ln in S['lines']:
    lid, text = ln['id'], ln['text']; wav = D / 'voice' / f'{lid}.wav'; final = D / 'voice' / f'{lid}.final.wav'
    src_key = f"{ln.get('say', text)}|{VOICE}|{RATE}|{final.exists()}"
    if REDO or not wav.exists() or meta.get(lid, {}).get('key') != src_key:
        if final.exists():                       # 正式配音：只切静音，不变速
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(final), '-af', f'{TRIM},areverse,{TRIM},areverse', '-ar', '48000', '-ac', '1', str(wav)], check=True)
            words = asr_words(wav)
        else:                                    # 临时配音：edge-tts
            mp3 = D / 'voice' / f'{lid}.edge.mp3'; words = asyncio.run(edge(ln.get('say', text), mp3))
            lead = lead_silence(mp3)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp3), '-af', f'{TRIM},areverse,{TRIM},areverse', '-ar', '48000', '-ac', '1', str(wav)], check=True)
            words = [[w, s - lead, e - lead] for w, s, e in words]
        meta[lid] = {'key': src_key, 'words': words}
    elif ASR:
        meta[lid]['words'] = asr_words(wav)
    d = dur(wav); tm = char_times(text, meta[lid]['words'])
    beats.append({'id': lid, 'text': text, 'start': round(t, 4), 'end': round(t + d, 4), 'wav': f'voice/{lid}.wav',
                  'chars': [[c, round(t + x, 4)] for c, x in zip(text, tm)]})
    t += d + ln.get('gap', .35)
    if 'bite' in ln:                              # 这句后面插原声
        bt = ln['bite']; t += bt.get('pre', .15) - ln.get('gap', .35); t0 = t; parts = []
        for src, a, l, sub, g in bt['parts']:
            parts.append({'src': src, 'in': a, 'dur': l, 'gain_db': g, 'start': round(t, 4), 'end': round(t + l, 4), 'sub': sub}); t += l
        inserts.append({'id': f'bite_{lid}', 'after': lid, 'start': round(t0, 4), 'end': round(t, 4), 'parts': parts}); t += bt.get('post', .4)
    if S.get('title', {}).get('after') == lid:
        title = {'start': round(t, 4), 'end': round(t + S['title']['len'], 4)}; t += S['title']['len']
meta_p.write_text(json.dumps(meta, ensure_ascii=False, indent=1), 'utf-8')
tl = {'fps': 30, 'duration': round(t + .95, 4), 'pre': S.get('pre', 0.0), 'title': title, 'beats': beats, 'inserts': inserts}
(D / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), 'utf-8')
for b in beats: print(f"{b['id']:6s} {b['start']:7.2f}–{b['end']:6.2f}  {b['text'][:28]}")
for i in inserts: print(f"{i['id']:6s} {i['start']:7.2f}–{i['end']:6.2f}  原声 {len(i['parts'])} 段")
print('总长', tl['duration'], '秒；片名', title)
