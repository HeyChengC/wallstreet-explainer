# -*- coding: utf-8 -*-
"""真人口播 → timeline.json：口播本身就是配音，画面全部挂在她说的字上。
  python host_timeline.py <口播视频> <script.json> <timeline.json> [--asr 已有的识别结果.json] [--tail 0.8]
script.json 的 lines 写她实际说的话（字幕就用这一份，数字照屏幕上要显示的写：'10月' '7%'），一句一个 id。
做法：faster-whisper 逐词识别（library/models/faster-whisper-small）→ 逐字和 script 的正文对齐（difflib）→ 没对上的字按前后对上的字插值。
识别错的字（同音字）不影响：时间按位置对齐，字幕用 script 的写法。对不上的比例太高会报出来，那就是 script 和她说的不一样。"""
import sys, json, subprocess, difflib, re, os
sys.stdout.reconfigure(encoding='utf-8')
a = sys.argv
vid, sp, out = a[1], a[2], a[3]
asr_path = a[a.index('--asr') + 1] if '--asr' in a else None
TAIL = float(a[a.index('--tail') + 1]) if '--tail' in a else 0.8   # 她说完以后多留几秒（画面停在最后一帧，配乐收尾）
PUN = set('，。？！：；、,.?!:;…—“”"\'（）() ')
def asr(path):
    import numpy as np
    from faster_whisper import WhisperModel
    M = os.environ.get('WHISPER_DIR', 'library/models/faster-whisper-small')
    try: m = WhisperModel(M, device='cuda', compute_type='float16')
    except Exception: m = WhisperModel(M, device='cpu', compute_type='int8', cpu_threads=max(1, (os.cpu_count() or 4) - 2))
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    S = json.load(open(sp, encoding='utf-8'))
    # 不能把稿子原文当 initial_prompt：whisper 会以为这些话已经说过，前面整段跳过只吐最后一句。
    # 只给一句中性提示，同音字错了不要紧（按位置对齐，字幕用 script 的写法）
    prompt = '以下是普通话的句子。'
    segs, _ = m.transcribe(np.frombuffer(pcm, np.float32), language='zh', word_timestamps=True, beam_size=8, condition_on_previous_text=False, initial_prompt=prompt)
    return [{'start': s.start, 'end': s.end, 'text': s.text, 'words': [[w.word, w.start, w.end, w.probability] for w in s.words]} for s in segs]
R = json.load(open(asr_path, encoding='utf-8')) if asr_path else asr(vid)
print('识别出来的（和 script.json 核对她说的字）：\n  ' + '\n  '.join(x['text'].strip() for x in R))
# 识别结果摊成"一个字一个时刻"
hc = []
for s in R:
    for w in s['words']:
        txt = [c for c in w[0].strip() if c not in PUN]
        if not txt: continue
        n = len(txt); d = (w[2] - w[1]) / n
        for i, c in enumerate(txt): hc.append((c, w[1] + i * d, w[1] + (i + 1) * d))
S = json.load(open(sp, encoding='utf-8'))
mine = []   # (line index, char index in line text)
for li, l in enumerate(S['lines']):
    for ci, c in enumerate(l['text']):
        if c not in PUN: mine.append((li, ci, c))
sm = difflib.SequenceMatcher(None, [m[2] for m in mine], [h[0] for h in hc], autojunk=False)
T = [None] * len(mine); E = [None] * len(mine); hit = 0
for blk in sm.get_matching_blocks():
    for k in range(blk.size): T[blk.a + k] = hc[blk.b + k][1]; E[blk.a + k] = hc[blk.b + k][2]; hit += 1
# 没对上的：在两个对上的字之间均匀插值
idx = [i for i, t in enumerate(T) if t is not None]
if not idx: sys.exit('一个字都没对上：script.json 是不是这条口播的文案？')
for i in range(len(T)):
    if T[i] is not None: continue
    lo = max([j for j in idx if j < i], default=None); hi = min([j for j in idx if j > i], default=None)
    if lo is None: T[i] = max(0, T[hi] - (hi - i) * .2)
    elif hi is None: T[i] = E[lo] + (i - lo - 1) * .2
    else: T[i] = E[lo] + (T[hi] - E[lo]) * (i - lo) / (hi - lo)
    E[i] = T[i] + .18
rate = hit / len(mine)
print(f'对上 {hit}/{len(mine)} 个字（{rate:.0%}）')
if rate < .8: print('！对上的不到八成：script.json 的字和她说的差得多，时刻会不准。对照下面的识别结果改 script：\n  ' + ' / '.join(s['text'] for s in R))
dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vid]))
beats = []; k = 0
for li, l in enumerate(S['lines']):
    chars = []; ks = []
    for ci, c in enumerate(l['text']):
        if c in PUN: chars.append([c, None])
        else: chars.append([c, round(T[k], 3)]); ks.append(k); k += 1
    # 标点的时刻 = 前一个字说完
    for i, ch in enumerate(chars):
        if ch[1] is None:
            prev = [x[1] for x in chars[:i] if x[1] is not None]; nxt = [x[1] for x in chars[i:] if x[1] is not None]
            ch[1] = round(prev[-1] + .2 if prev else (nxt[0] if nxt else 0), 3)
    beats.append({'id': l['id'], 'text': l['text'], 'start': round(T[ks[0]], 3), 'end': round(E[ks[-1]], 3), 'wav': None, 'chars': chars})
tl = {'fps': 30, 'duration': round(max(dur, beats[-1]['end'] + TAIL), 3), 'pre': 0, 'title': None, 'beats': beats, 'inserts': [], 'host': {'src': vid.replace(chr(92), '/'), 'offset': 0}}
json.dump(tl, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for b in beats: print(f"{b['id']:5s} {b['start']:6.2f}–{b['end']:6.2f}  {b['text']}")
print('片长', tl['duration'])
