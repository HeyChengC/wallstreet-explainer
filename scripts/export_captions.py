# -*- coding: utf-8 -*-
"""字幕导出：script.json 的语义分段 + timeline.json 的逐字时刻 → SRT / VTT / captions.json

  python scripts/export_captions.py <片子目录> [--lang zh-TW|zh-HK] [--json]

数据源（只认这一个）：
  script.json 的每条 line 可以带 caption_segments：
    [{"start_char":0, "end_char":8, "text":"完整短語", "lines":["第一行","第二行"]}]
  下标按 **Unicode 字符**（码点），start 含、end 不含。

  没有 caption_segments 时：按标点做**保守草稿**，标 draft / review_required。
  没有标点的长句**不硬切**（整句保留 + 要求重新分段）。

时间：
  每段 start = 这一段第一个字符在 timeline 里的时刻；
  每段 end   = 下一段第一字符的时刻；最后一段用这句的 beat.end。
  原声插段（timeline.inserts[].parts）用它自己的 sub 与真实 start/end，不被旁白覆盖。

退出码：0 = 干净；1 = 有必须修的结构错误；2 = 只有需要复核的（如缺 caption_segments）
**不自动"修"计划**：区间越界、漏字、重叠、倒序都直接报错，由执行模型改计划后重跑。
"""
import json, re, sys
from pathlib import Path

LANG_DEFAULT = {'taiwan': 'zh-TW', 'hongkong': 'zh-HK'}
SPLIT_AFTER = '，、；：？！,;:?!'
MAX_CHARS = 18
MIN_DUR = 0.7
TWO_LINE_MAX = 2

# 这些词被切开，即使语法没问题也是错的（只做提醒，判断仍由模型做）
PROTECTED = ['跨局處會議', '記者會', '兒少福利促進會', '蔣萬安', '沈伯洋', '百分之七',
             '專案會議', '分層負責', '治安會報', '道安會報', '公安會報', '公館圓環']


def ts(t, srt=False):
    """总毫秒整数再 divmod，避免 59.9999 → 00:00:60,000 这类进位错误。"""
    if t is None or t != t or t < 0:      # None / NaN / 负数
        raise ValueError(f'非法时间 {t!r}')
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    sep = ',' if srt else '.'
    return f'{h:02d}:{m:02d}:{s:02d}{sep}{ms:03d}'


def strip_tail(s):
    return re.sub(r'[，、；：,;:]\s*$', '', s).strip()


def norm(s):
    """比对用：去掉所有空白和排版换行，句末标点允许不同。"""
    return re.sub(r'\s', '', s or '')


def draft_segments(text):
    if len(text) <= MAX_CHARS:
        return [{'start_char': 0, 'end_char': len(text), 'text': text}], False
    segs, cur, start = [], '', 0
    for i, ch in enumerate(text):
        cur += ch
        if ch in SPLIT_AFTER:
            segs.append({'start_char': start, 'end_char': i + 1, 'text': cur})
            start = i + 1; cur = ''
    if cur:
        segs.append({'start_char': start, 'end_char': len(text), 'text': cur})
    if len(segs) <= 1:
        return [{'start_char': 0, 'end_char': len(text), 'text': text}], True
    merged, buf = [], None
    for s in segs:
        if buf is None:
            buf = dict(s); continue
        if len(buf['text']) + len(s['text']) <= MAX_CHARS:
            buf['text'] += s['text']; buf['end_char'] = s['end_char']
        else:
            merged.append(buf); buf = dict(s)
    if buf:
        merged.append(buf)
    return merged, any(len(m['text']) > MAX_CHARS for m in merged)


def char_time(beat, idx):
    chars = beat.get('chars') or []
    if not chars:
        return beat['start']
    i = max(0, min(idx, len(chars) - 1))
    return chars[i][1]


def check_segments(segs, text, bid, errors, warns):
    """结构检查。**不修**，有问题就记错误。"""
    out = []
    prev_end = 0
    for i, s in enumerate(segs):
        tag = f'{bid} 第 {i+1} 段'
        try:
            a, b = int(s['start_char']), int(s['end_char'])
        except (KeyError, TypeError, ValueError):
            errors.append(f'{tag}：start_char/end_char 必须是整数，现在是 {s.get("start_char")!r}/{s.get("end_char")!r}')
            continue
        if a >= b:
            errors.append(f'{tag}：区间非法（start {a} ≥ end {b}）——零长或倒序')
            continue
        if a < 0 or b > len(text):
            errors.append(f'{tag}：区间 {a}-{b} 越界（句子长 {len(text)}）')
            continue
        if a > prev_end:
            errors.append(f'{bid} 在第 {i}/{i+1} 段之间漏了 {a - prev_end} 个字（{prev_end}→{a}）')
        elif a < prev_end:
            errors.append(f'{tag}：和上一段重叠（上一段到 {prev_end}，这一段从 {a} 开始）')
        # 文字必须和原文对得上（允许去空白、允许句末标点差异）
        claimed = norm(s.get('text'))
        actual = norm(text[a:b])
        if claimed and claimed not in (actual, norm(strip_tail(actual))):
            errors.append(f'{tag} 的文字和原文 {a}-{b} 对不上：「{claimed}」≠「{actual}」（以原文为准，不要改字幕文字）')
        # lines：最多两行，拼起来应当等于 text
        lines = s.get('lines')
        if lines is not None:
            if not isinstance(lines, list) or not all(isinstance(x, str) for x in lines):
                errors.append(f'{tag}：lines 必须是字符串数组')
            elif len(lines) > TWO_LINE_MAX:
                errors.append(f'{tag}：lines 有 {len(lines)} 行，最多 {TWO_LINE_MAX} 行')
            elif norm(''.join(lines)) != norm(s.get('text')):
                errors.append(f'{tag}：lines 拼起来和 text 不一致（「{norm("".join(lines))}」≠「{norm(s.get("text"))}」）')
        # 保护词被切开
        for w in PROTECTED:
            if w in text and w not in s.get('text', ''):
                # 只在"这个词真的跨在这段边界上"时提醒
                iw = text.find(w)
                if iw < a < iw + len(w) or iw < b < iw + len(w):
                    warns.append(f'{tag} 把「{w}」切断了（{a}-{b}）：固定词/人名不该从中间断')
        out.append({'start_char': a, 'end_char': b, 'text': text[a:b],
                    'lines': lines, 'beat_id': bid})
        prev_end = b
    if out and out[0]['start_char'] != 0:
        errors.append(f'{bid}：第一段从第 {out[0]["start_char"]} 个字开始，不是 0——句子开头漏了')
    if out and out[-1]['end_char'] != len(text):
        errors.append(f'{bid}：最后一段到第 {out[-1]["end_char"]} 个字，句子长 {len(text)}——结尾漏了')
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    as_json = '--json' in sys.argv
    if not args:
        print(__doc__)
        return 1
    D = Path(args[0]).resolve()
    SP, TP = D / 'script.json', D / 'timeline.json'
    for p in (SP, TP):
        if not p.exists():
            print(f'缺 {p.name}：{D}')
            return 1

    def load(p):
        try:
            v = json.loads(p.read_text('utf-8'))
        except json.JSONDecodeError as e:
            raise SystemExit(f'{p.name} 不是合法 JSON：第 {e.lineno} 行第 {e.colno} 列 {e.msg}')
        if not isinstance(v, dict):
            raise SystemExit(f'{p.name} 顶层必须是对象，现在是 {type(v).__name__}')
        return v

    S, T = load(SP), load(TP)
    if not isinstance(S.get('lines'), list):
        raise SystemExit('script.json 的 lines 必须是数组')
    if not isinstance(T.get('beats'), list):
        raise SystemExit('timeline.json 的 beats 必须是数组')

    lang = None
    for i, a in enumerate(sys.argv):
        if a == '--lang' and i + 1 < len(sys.argv):
            lang = sys.argv[i + 1]
    lang = lang or LANG_DEFAULT.get(S.get('region', ''), 'zh-CN')

    errors, warns, cues = [], [], []
    review_needed = []
    beats = {b.get('id'): b for b in T['beats']}
    total = T.get('duration', 0)

    # 脚本与时间线是否同步（不一致就别导出旧字幕）
    for ln in S['lines']:
        bt = beats.get(ln.get('id'))
        if bt and (bt.get('text') or '') != (ln.get('text') or ''):
            errors.append(f"{ln.get('id')}：script.json 的文案和时间线里的不一样——先重跑 temp_voice.py，别拿旧时间线导字幕")
            break

    for ln in S['lines']:
        bid = ln.get('id')
        bt = beats.get(bid)
        if not bt:
            errors.append(f'{bid} 在 timeline 里没有对应句子——先重跑 temp_voice.py')
            continue
        text = bt.get('text') or ln.get('text') or ''
        segs = ln.get('caption_segments')
        if segs:
            if not isinstance(segs, list):
                errors.append(f'{bid}：caption_segments 必须是数组')
                continue
            checked = check_segments(segs, text, bid, errors, warns)
            review_needed.append(bid)   # 有计划的句子也建议执行模型读一遍断句
        else:
            draft, nr = draft_segments(text)
            review_needed.append(bid)
            warns.append(f'{bid} 没有 caption_segments：用标点做了草稿' + ('（无标点长句未切，必须重分）' if nr else ''))
            checked = [{'start_char': s['start_char'], 'end_char': s['end_char'],
                        'text': text[s['start_char']:s['end_char']], 'lines': s.get('lines'), 'beat_id': bid}
                       for s in draft]

        for i, s in enumerate(checked):
            start = char_time(bt, s['start_char'])
            end = char_time(bt, checked[i + 1]['start_char']) if i + 1 < len(checked) else bt['end']
            if end <= start:
                errors.append(f"{bid} 第 {i+1} 段时间倒序/零长：{start}→{end}")
                continue
            cues.append({'beat_id': bid, 'start': round(start, 3), 'end': round(end, 3),
                         'text': strip_tail(s['text']), 'lines': s.get('lines'),
                         'chars': [s['start_char'], s['end_char']],
                         'draft': not bool(ln.get('caption_segments'))})

    # 原声插段
    for ins in T.get('inserts', []):
        for p in ins.get('parts', []):
            sub = p.get('sub')
            if not sub:
                errors.append(f"原声段 {ins.get('id')} 有一段没有 sub 字幕——原声必须有对应字幕")
                continue
            cues.append({'beat_id': ins.get('id'), 'start': round(p['start'], 3), 'end': round(p['end'], 3),
                         'text': sub, 'kind': 'soundbite', 'draft': False})

    cues.sort(key=lambda c: c['start'])
    for i in range(len(cues) - 1):
        if cues[i]['end'] > cues[i + 1]['start'] + 0.02:
            errors.append(f"字幕重叠：{cues[i]['beat_id']}（到 {cues[i]['end']}s）和 {cues[i+1]['beat_id']}（从 {cues[i+1]['start']}s）")
    if total and cues and cues[-1]['end'] > total + 0.05:
        errors.append(f"最后一条字幕到 {cues[-1]['end']}s，超过片长 {total}s")
    for c in cues:
        if c['end'] - c['start'] < MIN_DUR * 0.6:
            warns.append(f"{c['beat_id']} 这一段只有 {c['end']-c['start']:.2f}s，可能看不清（{c['text'][:14]}）")

    # 只有没有 blocking 错误才写文件——写了就是"可以用"的信号
    written = False
    if not errors:
        def body(fmt):
            out = ['WEBVTT', ''] if fmt == 'vtt' else []
            for i, c in enumerate(cues, 1):
                if fmt == 'srt':
                    out.append(f'{i}')
                txt = '\n'.join(c['lines']) if c.get('lines') else c['text']
                out.append(f"{ts(c['start'], fmt=='srt')} --> {ts(c['end'], fmt=='srt')}")
                out.append(txt)
                out.append('')
            return '\n'.join(out)

        (D / f'captions.{lang}.srt').write_text(body('srt'), 'utf-8')
        (D / f'captions.{lang}.vtt').write_text(body('vtt'), 'utf-8')
        meta = {'language': lang, 'region': S.get('region'), 'count': len(cues),
                'draft': any(c.get('draft') for c in cues),
                'review_required': sorted(set(review_needed)),
                'cues': cues, 'warnings': warns}
        (D / 'captions.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1), 'utf-8')
        written = True

    code = 1 if errors else (2 if review_needed else 0)
    if as_json:
        print(json.dumps({'ok': not errors, 'written': written, 'language': lang,
                          'cues': len(cues), 'errors': errors, 'warnings': warns,
                          'review_required': sorted(set(review_needed)), 'exit': code},
                         ensure_ascii=False, indent=1))
    else:
        print(f'{lang}：{len(cues)} 条' + (f' → captions.{lang}.srt / .vtt / captions.json' if written else '（有错误，未写出文件）'))
        for e in errors:
            print(f'  [必须修] {e}')
        for w in warns[:10]:
            print(f'  [提醒] {w}')
        if len(warns) > 10:
            print(f'  …还有 {len(warns)-10} 条提醒')
        if review_needed:
            print(f'  [要复核] {len(set(review_needed))} 句的断句：{", ".join(sorted(set(review_needed))[:8])}…')
        print(f'退出码 {code}：{code == 0 and "干净" or code == 1 and "有必须修的" or "只有要复核的"}')
    return code


if __name__ == '__main__':
    try:
        sys.exit(main())
    except SystemExit:
        raise
    except Exception as e:
        print(f'导出失败：{e}')
        sys.exit(1)
