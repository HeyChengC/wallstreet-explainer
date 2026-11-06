# -*- coding: utf-8 -*-
"""editorial.json 校验：配置、立场、来源和事实的引用、日期、引用字段、虚构标记。

  python scripts/check_editorial.py <片子目录>/editorial.json [--json]

退出码：0 = 通过（可能有警告）／1 = 有错误／2 = 只有警告
所以流程里写成 `... || exit 1` 的写法会漏掉警告，要按"1 才停、2 打印出来继续"处理。

它查的是结构和可追踪性——每条事实有来源、每个引用指向存在的 id、立场和地区对得上、
未证实的有归因、虚构模式有标记。它不判断政治观点对不对，也不替你核实来源说了什么。
"""
import json, re, sys
from datetime import date

REGION_STANCE = {
    'general': {'neutral', 'custom'},
    'taiwan': {'neutral', 'green-leaning', 'blue-leaning', 'custom'},
    'hongkong': {'neutral', 'establishment-leaning', 'pan-democratic-leaning', 'custom'},
}
STYLES = {'objective', 'traffic', 'outrage', 'adversarial'}
EMOTION = {0, 1, 2, 3}
PROFANITY = {'none', 'mild', 'bleeped'}
CONTENT = {'factual', 'fiction'}
KINDS = {'fact', 'quote', 'analysis', 'unverified', 'fiction'}
SOURCE_TYPES = {'gov-press', 'legislature', 'press', 'social', 'pdf', 'user-provided', 'synthetic'}
# 虚构/合成材料：factual 模式下不许拿它们当事实依据
FICTIONISH = {'synthetic'}
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
# 带时间的完整 ISO 8601（允许 Z / ±HH:MM），2026-11-01garbage 这种解析不过
ISO_DT_RE = re.compile(r'^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$')


def is_date(s):
    if not isinstance(s, str) or not DATE_RE.match(s):
        return False
    try:
        date.fromisoformat(s)
        return True
    except ValueError:
        return False


def is_iso_datetime(s):
    """要么是 2026-11-06，要么是带时区的完整 ISO 时间。2026-11-01garbage 一律拒绝。"""
    if not isinstance(s, str):
        return False
    if is_date(s):
        return True
    if not ISO_DT_RE.match(s):
        return False
    from datetime import datetime
    try:
        datetime.fromisoformat(s.replace('Z', '+00:00'))
        return True
    except ValueError:
        return False


def check_film_claims(film_path, claim_ids):
    """镜头表里的 claimIds / sourceIds 必须指向 editorial.json 里真实存在的 id。

    film.js 是 JS，不执行它，只在源码里抓 `claimIds:[...]` / `sourceIds:[...]` 的字面量。
    抓不到数组（写成变量、拼接）就返回 None，表示"没法自动查，得人工核对"——不假装查过。
    """
    import os, re
    if not os.path.exists(film_path):
        return None
    try:
        src = open(film_path, 'r', encoding='utf-8').read()
    except OSError:
        return None
    found = []
    for m in re.finditer(r'(claimIds|sourceIds)\s*:\s*\[([^\]]*)\]', src):
        key, body = m.group(1), m.group(2)
        ids = re.findall(r"['\"]([^'\"]+)['\"]", body)
        for i in ids:
            found.append((key, i, src[:m.start()].count('\n') + 1))
    if not found:
        return None
    return found


def check(doc, script_beats=None, base_dir=None, film_claims=None, source_ids=None):
    """返回 (errors, warnings)。每条是 (位置, 说明)。

    script_beats：片子里 script.json 的句子 id 集合。给了就按它校验 beat_ids（推荐，CLI 会自动读同目录的 script.json）。
    base_dir：片子目录，用来检查 user-provided 的 local_path 文件是否真的存在。
    """
    E, W = [], []
    err = lambda p, m: E.append((p, m))
    warn = lambda p, m: W.append((p, m))

    if not isinstance(doc, dict):
        return [('editorial.json', '整个文件应该是一个 JSON 对象')], []

    # ---------- config ----------
    cfg = doc.get('config')
    if not isinstance(cfg, dict):
        err('config', '缺 config 对象：region / stance / styles / emotion / profanity / content_mode 都要写')
        cfg = {}
    region = cfg.get('region', 'general')
    if region not in REGION_STANCE:
        err('config.region', f'只能是 {" / ".join(REGION_STANCE)}，现在是 {region!r}')
    stance = cfg.get('stance', 'neutral')
    allowed = REGION_STANCE.get(region, {'neutral', 'custom'})
    if stance not in allowed:
        err('config.stance', f'地区是 {region} 时 stance 只能是 {sorted(allowed)}，现在是 {stance!r}'
                             f'（香港不用台湾的蓝绿值，反之亦然）')
    if stance == 'custom' and not str(cfg.get('stance_note') or '').strip():
        err('config.stance_note', "stance:'custom' 时必须写 stance_note（你的判断重点是什么）")

    styles = cfg.get('styles')
    if not isinstance(styles, list) or not styles:
        err('config.styles', '缺 styles 数组：第一项是主风格（objective / traffic / outrage / adversarial）')
    else:
        for i, s in enumerate(styles):
            if s not in STYLES:
                err(f'config.styles[{i}]', f'只能是 {sorted(STYLES)}，现在是 {s!r}')

    if 'emotion' in cfg and cfg['emotion'] not in EMOTION:
        err('config.emotion', f'只能是 0 / 1 / 2 / 3，现在是 {cfg["emotion"]!r}')
    if 'profanity' in cfg and cfg['profanity'] not in PROFANITY:
        err('config.profanity', f'只能是 {sorted(PROFANITY)}，现在是 {cfg["profanity"]!r}')
    mode = cfg.get('content_mode', 'factual')
    if mode not in CONTENT:
        err('config.content_mode', f'只能是 factual / fiction，现在是 {mode!r}')
    if 'as_of' in cfg and cfg['as_of'] is not None:
        a = str(cfg['as_of'])
        if not is_iso_datetime(a):
            err('config.as_of', f'要写成带时区的完整 ISO 时间 2026-11-06T14:00:00+08:00，现在是 {a!r}')

    # ---------- sources ----------
    srcs = doc.get('sources')
    SID = {}
    if not isinstance(srcs, list):
        err('sources', '缺 sources 数组（可以是空的，但要有这个字段）')
        srcs = []
    for i, s in enumerate(srcs):
        p = f'sources[{i}]'
        if not isinstance(s, dict):
            err(p, '每条来源是一个对象')
            continue
        sid = s.get('id')
        if not sid:
            err(p, '缺 id（claims 用它引用）')
        elif sid in SID:
            err(p, f'id 重复：{sid}')
        else:
            SID[sid] = s
        if s.get('source_type') not in SOURCE_TYPES:
            err(f'{p}.source_type', f'只能是 {sorted(SOURCE_TYPES)}，现在是 {s.get("source_type")!r}')
        # 未知发布日期 = 警告，不是错误：时政资料常有查不到日期的情况，别卡住出片
        pa = s.get('published_at')
        if pa is None:
            warn(f'{p}.published_at', '发布日期未知：可以留 null，但口播里不要说成"今天"；查到了补上')
        elif pa != '' and not is_iso_datetime(str(pa)):
            err(f'{p}.published_at', f'要写成 2026-11-06 或带时区的完整 ISO 时间，现在是 {pa!r}')
        # 出版方和标题是出处的可读部分，不能省
        if not str(s.get('publisher') or '').strip():
            err(f'{p}.publisher', '缺 publisher：谁发布的（媒体名 / 机构名 / "用户提供"）')
        if not str(s.get('title') or '').strip():
            err(f'{p}.title', '缺 title：这份材料的标题')
        if not s.get('accessed_at'):
            err(f'{p}.accessed_at', '缺 accessed_at：什么时候取到的（抓取日期不等于事件日期）')
        elif not is_iso_datetime(str(s['accessed_at'])):
            err(f'{p}.accessed_at', f'要写成 2026-11-06 或带时区的完整 ISO 时间，现在是 {s["accessed_at"]!r}')
        # 本地/合成来源：不要求 https，但必须自己声明
        st = s.get('source_type')
        if st == 'synthetic':
            if not str(s.get('note') or '').strip():
                warn(f'{p}.note', '合成/虚构来源建议在 note 里写清"这是测试材料，不是真实机构"')
        elif st == 'user-provided':
            # 用户自己提供的素材：给真实存在的本地路径，或者给链接；不强迫标成 synthetic
            lp = s.get('local_path') or s.get('url')
            if not str(lp or '').strip():
                err(f'{p}.local_path', 'user-provided 要写 local_path（片子目录里的相对路径）或 url')
            elif base_dir and not str(lp).startswith(('http://', 'https://')):
                import os
                if not os.path.exists(os.path.join(base_dir, str(lp))):
                    err(f'{p}.local_path', f'文件不存在：{lp}（相对片子目录 {base_dir}）')
        elif not str(s.get('url') or '').startswith(('http://', 'https://')):
            err(f'{p}.url', '真实来源要给 http(s) 链接；本地测试材料请把 source_type 写成 synthetic')

    # ---------- claims ----------
    cl = doc.get('claims')
    CID = {}
    if not isinstance(cl, list):
        err('claims', '缺 claims 数组（每条事实/原话/分析/未证实都写一条）')
        cl = []
    for i, c in enumerate(cl):
        p = f'claims[{i}]'
        if not isinstance(c, dict):
            err(p, '每条 claim 是一个对象')
            continue
        cid = c.get('id')
        if not cid:
            err(p, '缺 id（镜头表用 claimIds 引用它）')
        elif cid in CID:
            err(p, f'id 重复：{cid}')
        else:
            CID[cid] = c
        kind = c.get('kind')
        if kind not in KINDS:
            err(f'{p}.kind', f'只能是 {sorted(KINDS)}，现在是 {kind!r}')
        if not str(c.get('text') or '').strip():
            err(f'{p}.text', '缺 text：一句话说清这条 claim 是什么')
        if not isinstance(c.get('beat_ids'), list):
            err(f'{p}.beat_ids', '缺 beat_ids 数组：它对应 script.json 的哪几句（可以为空列表）')
            c['beat_ids'] = []
        # beat_ids 要对得上真实的句子（CLI 会读同目录的 script.json）
        if script_beats is not None:
            for bid in c['beat_ids']:
                if bid not in script_beats:
                    err(f'{p}.beat_ids', f'beat {bid!r} 不在 script.json 里（那里只有 {len(script_beats)} 句：'
                                         f'{", ".join(sorted(script_beats)[:6])}…）')
        if not isinstance(c.get('source_ids'), list):
            err(f'{p}.source_ids', '缺 source_ids 数组（fact / quote / unverified 至少要有一个）')
            c['source_ids'] = []
        for sid in c['source_ids']:
            if sid not in SID:
                err(f'{p}.source_ids', f'引用了不存在的来源 {sid!r}')
        # factual 模式：不许拿虚构/合成材料当事实依据（分析可以引用它做对照，但仍要说明）
        if mode != 'fiction' and kind in ('fact', 'quote', 'unverified'):
            bad = [sid for sid in c['source_ids'] if (SID.get(sid) or {}).get('source_type') in FICTIONISH]
            if bad:
                err(f'{p}.source_ids', f'{kind} 引用了虚构/合成材料 {bad}：'
                                       f'factual 模式的事实必须来自真实来源；要演示请开 content_mode:"fiction"')
        # 事实和原话必须能追到来源；分析和虚构不要求
        if kind in ('fact', 'quote', 'unverified') and not c['source_ids']:
            err(p, f'{kind} 必须有 source_ids：没有来源的事实就是传言')
        if kind == 'quote' and not str(c.get('speaker') or '').strip():
            err(f'{p}.speaker', 'quote 要写 speaker：这是谁说的')
        if kind == 'analysis' and not str(c.get('reasoning') or '').strip():
            err(f'{p}.reasoning', 'analysis 要写 reasoning：凭什么这么判断')
        if kind == 'unverified':
            if not str(c.get('attribution') or '').strip():
                err(f'{p}.attribution', 'unverified 要写 attribution：谁在什么日期说的（"网上有人说"不算）')
            if not c.get('marked_on_screen'):
                err(f'{p}.marked_on_screen', 'unverified 必须标 marked_on_screen:true：口播和画面都要显示"未证实"')
        if kind == 'fiction' and mode != 'fiction':
            err(f'{p}.kind', "标了 fiction 的 claim 要求 config.content_mode:'fiction'")
        ed = c.get('event_date')
        if ed not in (None, '') and not is_date(str(ed)):
            err(f'{p}.event_date', f'事件日期要写成 2026-11-06，现在是 {ed!r}（查不到就留 null，不要编）')

    # ---------- beats 交叉引用 ----------
    # 优先用 script.json（真实句子）；doc 里的 beats 字段是可选的补充，不存在也不影响。
    beats = doc.get('beats')
    if beats is not None and not isinstance(beats, list):
        err('beats', 'beats 要么不写，要么是一个数组')
        beats = None
    if isinstance(beats, list):
        for i, b in enumerate(beats):
            p = f'beats[{i}]'
            if not isinstance(b, dict) or not b.get('id'):
                err(p, '每个 beat 是 {id, ...}')
                continue
            for cid in b.get('claim_ids') or []:
                if cid not in CID:
                    err(f'{p}.claim_ids', f'引用了不存在的 claim {cid!r}')
        # doc.beats 里声明的 id 也要是 script.json 里的真实句子（给了 script_beats 才查）
        if script_beats is not None:
            for b in beats:
                if isinstance(b, dict) and b.get('id') and b['id'] not in script_beats:
                    err(f'beats[{b["id"]}]', f'{b["id"]!r} 不在 script.json 里')

    # ---------- 镜头表里的 claimIds / sourceIds（能从 film.js 抓到字面量才查） ----------
    if film_claims:
        for key, ref, line in film_claims:
            if key == 'claimIds' and ref not in CID:
                err(f'film.js:{line}', f'claimIds 引用了不存在的 claim {ref!r}（editorial.json 里没有）')
            if key == 'sourceIds' and ref not in (source_ids or set()):
                err(f'film.js:{line}', f'sourceIds 引用了不存在的来源 {ref!r}（editorial.json 里没有）')

    # ---------- fiction 模式的总开关 ----------
    # 声明义务：虚构片必须明确说"画面要挂常驻标记"，并且交代标记文字。
    # 这个脚本只查声明与关联（结构），真正的常驻渲染由 render --check-policy politics 的
    # KIT_REPORT.fiction 字段验证（见 scripts/render.mjs 打印的 "虚构标记：全片常驻"）。
    if mode == 'fiction':
        on_screen = cfg.get('fiction_marker')
        if not on_screen:
            err('config.fiction_marker', "content_mode:'fiction' 必须写 fiction_marker（例：'虛構演繹 · 人物與情節均為虛構'），"
                                         '它会被要求全片常驻在画面右上角')
        elif not str(on_screen).strip():
            err('config.fiction_marker', 'fiction_marker 不能是空字符串')
        if not any(isinstance(c, dict) and c.get('kind') == 'fiction' for c in cl):
            err('config.content_mode', "content_mode:'fiction' 但没有任何 kind:'fiction' 的 claim："
                                        '虚构片要把哪些是演绎写清楚（每条也要能追到合成来源或标 beat）')
    elif cfg.get('fiction_marker'):
        warn('config.fiction_marker', 'factual 模式写了 fiction_marker：只有虚构片才挂常驻标记，检查一下 content_mode')
    # ---------- 片子目录里的镜头表 ----------
    return E, W


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    as_json = '--json' in sys.argv
    if not args:
        print(__doc__)
        return 1
    path = args[0]
    try:
        with open(path, 'r', encoding='utf-8') as f:
            doc = json.load(f)
    except FileNotFoundError:
        print(f'找不到 {path}')
        return 1
    except json.JSONDecodeError as e:
        print(f'{path} 不是合法 JSON：第 {e.lineno} 行第 {e.colno} 列 {e.msg}')
        return 1

    # 同目录的 script.json：beat_ids 按真实句子校验（不依赖 editorial 里可选的 beats 字段）
    import os
    base_dir = os.path.dirname(os.path.abspath(path))
    script_beats = None
    notes = []          # 流程提示：--json 时并进 warnings，保证 stdout 只有一段能 json.loads 的 JSON
    sp = os.path.join(base_dir, 'script.json')
    if os.path.exists(sp):
        try:
            with open(sp, 'r', encoding='utf-8') as f:
                S = json.load(f)
            script_beats = {ln['id'] for ln in S.get('lines') or [] if isinstance(ln, dict) and ln.get('id')}
        except (json.JSONDecodeError, OSError) as e:
            notes.append(f'script.json 读不了（{e}）：这次跳过 beat_ids 校验')
    else:
        notes.append('同目录没有 script.json：跳过 beat_ids 校验')

    # 镜头表（同目录 film.js）里的 claimIds / sourceIds 对照 editorial——抓不到字面量就说抓不到，不假装查过
    film_claims = check_film_claims(os.path.join(base_dir, 'film.js'), None)

    # ---------- 跑检查 ----------
    E, W = check(doc, script_beats=script_beats, base_dir=base_dir,
                 film_claims=film_claims,
                 source_ids={s.get('id') for s in (doc.get('sources') or []) if isinstance(s, dict)})
    film_checked = sum(1 for _ in (film_claims or []))
    if film_claims is None:
        notes.append('film.js 里没找到 claimIds / sourceIds 字面量（或没写 film.js）：镜头和事实的对应关系要人工核对')
    elif film_checked:
        notes.append(f'film.js 的 claimIds / sourceIds：{film_checked} 处引用都对得上 editorial.json')
    if as_json:
        W = [('script.json', m) for m in notes] + W
        print(json.dumps({'ok': not E, 'errors': [{'at': a, 'msg': m} for a, m in E],
                          'warnings': [{'at': a, 'msg': m} for a, m in W]}, ensure_ascii=False, indent=1))
    else:
        for a, m in E:
            print(f'[错误] {a}: {m}')
        for m in notes:
            print(f'[提醒] {m}')
        for a, m in W:
            print(f'[提醒] {a}: {m}')
        n_claims = len(doc.get('claims') or [])
        n_src = len(doc.get('sources') or [])
        print(f'\n{path}：{n_claims} 条 claim / {n_src} 条来源'
              + (f'，{len(E)} 处错误' if E else '，没有错误')
              + (f'，{len(W)} 条提醒' if W else ''))
    if E:
        return 1
    return 2 if W else 0


if __name__ == '__main__':
    sys.exit(main())
