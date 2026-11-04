# -*- coding: utf-8 -*-
"""混音：timeline.json（配音 + 原声插段；真人口播片是口播原片的声音）+ sfx.json（音效、配乐）→ mix_master.wav（-14 LUFS）

  python mix.py film            # 读 film/timeline.json、film/sfx.json，写 film/mix_master.wav
  python mix.py film --check    # 混完量各段响度：配音、原声、开头

sfx.json：
{
  "dir": "../sfx",                          # 音效文件目录（相对 film/）
  "bed": {"file": "bed.mp3", "gain": -13, "from_pre": true, "lift_title": 1.9},   # 配乐：被人声压低；片名期间抬高
                                            # 也可以 "at": ["s01","？"], "shift": 0.14, "fade_in": 0.12 —— 卡在反转那一下才进
  "events": [
    {"file": "impact_soft.mp3", "at": ["s01", "七千"], "shift": -0.05, "peak": -13, "len": 2.5},   # 卡在某句某个词上
    {"file": "flip.mp3", "t": 0.5, "peak": -20, "len": 0.3}                                      # 或直接写秒
  ]
}
peak：把这个音效的峰值归到多少 dB（不靠猜音量）；len：只用前几秒，末尾 0.25 秒淡出。
原声插段会先抽成 wav 再进混音（在一个大图里直接读带画面的 mp4 会卡死）。

推荐的音效口味（实践中验证过的）：切换用软 whoosh，大数字一声低沉的撞击，快闪用翻书声；不用金币、收银机、卡通音；紧张滴答乐和放映机声被嫌“怪”。
"""
import json, subprocess, sys
from pathlib import Path

D = Path(sys.argv[1]).resolve(); T = json.loads((D / 'timeline.json').read_text('utf-8'))
X = json.loads((D / 'sfx.json').read_text('utf-8')) if (D / 'sfx.json').exists() else {'events': []}
SF = (D / X.get('dir', 'sfx')).resolve(); DUR = T['duration']; PRE = T.get('pre', 0.0)
BT = {b['id']: b for b in T['beats']}


def cue(bid, word):
    b = BT[bid]; k = b['text'].index(word); return b['chars'][k][1]


def peak(f):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True, errors='replace').stderr
    return float(out.split('max_volume:')[1].split('dB')[0])


ins, flt, voice = [], [], []
n = 0
if T.get('host'):
    # 真人口播：口播原片的声音就是人声，从 offset 秒开始整条进（host_timeline.py 写的 timeline.host）
    H = T['host']; ins += ['-i', str((D / H['src']).resolve())]; ms = int(round(H.get('offset', 0) * 1000))
    flt.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,volume={H.get('gain_db', 0)}dB,adelay={ms}|{ms}[v{n}]"); voice.append(f'[v{n}]'); n += 1
else:
    for b in T['beats']:
        ins += ['-i', str(D / b['wav'])]; ms = int(round(b['start'] * 1000))
        flt.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{n}]'); voice.append(f'[v{n}]'); n += 1
bites = D / 'voice' / 'bites'; bites.mkdir(parents=True, exist_ok=True)
for it in T.get('inserts', []):
    for p in it['parts']:
        wav = bites / f"{Path(p['src']).stem}_{p['in']:.2f}_{p['dur']:.2f}.wav"
        if not wav.exists():
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{p['in']:.3f}", '-t', f"{p['dur']:.3f}", '-i', str(D / p['src']), '-vn', '-ac', '2', '-ar', '48000', str(wav)], check=True)
        ins += ['-i', str(wav)]; ms = int(round(p['start'] * 1000))
        flt.append(f"[{n}:a]volume={p.get('gain_db', 0)}dB,afade=t=in:d=0.03,afade=t=out:st={p['dur'] - .08:.3f}:d=0.08,adelay={ms}|{ms}[v{n}]"); voice.append(f'[v{n}]'); n += 1
flt.append(''.join(voice) + f'amix=inputs={len(voice)}:normalize=0,apad=whole_dur={DUR}[voice]')
flt.append('[voice]asplit=2[vmain][vkey]')
sl = []; cache = {}
for k, e in enumerate(X.get('events', [])):
    f = SF / e['file']
    if not f.exists(): print('缺音效', f); continue
    t = cue(*e['at']) if 'at' in e else e['t']; t = max(0, t + e.get('shift', 0))
    if f not in cache: cache[f] = peak(f)
    g = e.get('peak', -20) - cache[f]; ln = e.get('len'); ins += ['-i', str(f)]; ms = int(round(t * 1000))
    tr = f"atrim=0:{ln},afade=t=out:st={max(0, ln - .25)}:d=0.25," if ln else ''
    flt.append(f'[{n}:a]aresample=48000,aformat=channel_layouts=stereo,{tr}volume={g:.2f}dB,adelay={ms}|{ms}[s{k}]'); sl.append(f'[s{k}]'); n += 1
mix = ['[vv]']
flt.append('[vmain]aformat=channel_layouts=stereo,volume=2dB[vv]')
if sl: flt.append(''.join(sl) + f'amix=inputs={len(sl)}:normalize=0[sfx]'); mix.append('[sfx]')
bed = X.get('bed')
if bed:
    # 配乐从哪进：at=[句,词]（+shift）卡在某个字上；否则 from_pre 决定从 pre 还是 0 秒
    off = max(0, cue(*bed['at']) + bed.get('shift', 0)) if 'at' in bed else PRE if bed.get('from_pre', True) else 0.0; L = DUR - off
    ts, te = (T['title']['start'] - off, T['title']['end'] - off) if T.get('title') else (-9, -9)
    up = f"if(between(t,{ts - .3:.2f},{te + .1:.2f}),{bed.get('lift_title', 1.9)},1)"
    ins += ['-stream_loop', '-1', '-i', str(SF / bed['file'])]
    flt.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{L:.3f},volume={bed.get('gain', -13)}dB,volume='{up}':eval=frame,"
               f"afade=t=in:d={bed.get('fade_in', .6)},afade=t=out:st={L - 1.4:.2f}:d=1.4,adelay={int(off * 1000)}|{int(off * 1000)}[m0]"); n += 1
    flt.append('[vkey]aformat=channel_layouts=stereo[key]')
    flt.append('[m0][key]sidechaincompress=threshold=0.06:ratio=3:attack=60:release=450:makeup=1[music]'); mix.append('[music]')
else:
    flt.append('[vkey]anullsink')
flt.append(''.join(mix) + f'amix=inputs={len(mix)}:normalize=0,atrim=0:{DUR},loudnorm=I=-14:TP=-1.5:LRA=11[out]')
out = D / 'mix_master.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(flt), '-map', '[out]', '-ar', '48000', str(out)], check=True)
print('混好', out, f'{DUR:.2f}s，音效 {len(sl)} 个')
if '--check' in sys.argv:
    def lufs(a, d):
        o = subprocess.run(['ffmpeg', '-hide_banner', '-ss', str(a), '-t', str(d), '-i', str(out), '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True, errors='replace').stderr
        return [l for l in o.splitlines() if l.strip().startswith('I:')][-1].strip()
    print('开头 2 秒', lufs(0, 2))
    b = T['beats'][len(T['beats']) // 2]; print('配音', b['id'], lufs(b['start'], b['end'] - b['start']))
    for it in T.get('inserts', []): print('原声', it['id'], lufs(it['start'], it['end'] - it['start']))
    print('原声和配音差在 2 dB 以内算平；开头太轻钩子就弱')
