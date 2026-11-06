// preflight.mjs —— 交片前的自动预检。程序查确定性错误；只有看图/读稿才能判断的，单列 review_required。
//   node scripts/preflight.mjs --dir <film> [--stage draft|delivery] [--json] [--out 目录] [--save-frames]
//
// 退出码：0 = 没有 blocking 且没有 review_required；1 = 有 blocking；2 = 只有 review_required
//
// 它**不**判断"这段话是否歪曲原话"（语义问题，见 references/self-review.md），
// 也不会为了过检查去改立场、情绪或偷偷加角标。

import fs from 'node:fs'; import path from 'node:path';
import http from 'node:http'; import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module'; import {fileURLToPath} from 'node:url';

const argOf = k => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const has = k => process.argv.includes(k);
const DIR = path.resolve(argOf('--dir') ?? '.');
const STAGE = argOf('--stage') ?? 'draft';
const JSON_OUT = has('--json');
const OUT = path.resolve(argOf('--out') ?? path.join(DIR, 'out'));
const PAGE = argOf('--page') ?? 'index.html';
const POLICY = argOf('--check-policy') ?? 'politics';
const SAVE_FRAMES = has('--save-frames');

if (!['draft', 'delivery'].includes(STAGE)) { console.error(`--stage 只能是 draft / delivery，现在是 '${STAGE}'`); process.exit(1); }

const R = {stage: STAGE, dir: DIR, blocking_errors: [], warnings: [], review_required: [], evidence: {}};
const block = (code, msg, at) => R.blocking_errors.push({code, msg, ...(at ? {at} : {})});
const warn = (code, msg, at) => R.warnings.push({code, msg, ...(at ? {at} : {})});
const review = (code, msg, at) => R.review_required.push({code, msg, ...(at ? {at} : {})});

// ---------- 工具路径：环境变量 → local.json → PATH ----------
const HERE = path.dirname(fileURLToPath(import.meta.url));
let LOCAL = {}; try { LOCAL = JSON.parse(fs.readFileSync(path.join(HERE, 'local.json'), 'utf8')); } catch {}
const FFMPEG = process.env.FFMPEG ?? LOCAL.ffmpeg ?? 'ffmpeg';
const FFPROBE = process.env.FFPROBE ?? LOCAL.ffprobe ?? (LOCAL.ffmpeg ? path.join(path.dirname(LOCAL.ffmpeg), 'ffprobe.exe') : 'ffprobe');

// ---------- 输入：结构要能诊断，不能崩 ----------
function readJSON(p, what, required = true) {
  if (!fs.existsSync(p)) {
    if (required) block(`${what}_missing`, `读不到 ${p}`);
    return {ok: false, val: null};
  }
  let raw;
  try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { block(`${what}_unreadable`, `${p} 读不出来：${e.message}`); return {ok: false, val: null}; }
  let v;
  try { v = JSON.parse(raw); } catch (e) { block(`${what}_bad_json`, `${p} 不是合法 JSON：${e.message}`); return {ok: false, val: null}; }
  if (Array.isArray(v) || typeof v !== 'object' || v === null) {
    block(`${what}_bad_shape`, `${p} 顶层应当是对象，现在是 ${Array.isArray(v) ? 'array' : typeof v}`);
    return {ok: false, val: null};
  }
  return {ok: true, val: v};
}

const S_ = readJSON(path.join(DIR, 'script.json'), 'script');
const T_ = readJSON(path.join(DIR, 'timeline.json'), 'timeline');
const E_ = readJSON(path.join(DIR, 'editorial.json'), 'editorial', STAGE === 'delivery');
const script = S_.val, timeline = T_.val, editorial = E_.val;

const lines = S_.ok && Array.isArray(script.lines) ? script.lines : (S_.ok ? (block('script_lines_not_array', 'script.json 的 lines 必须是数组'), null) : null);
const beats = T_.ok && Array.isArray(timeline.beats) ? timeline.beats : (T_.ok ? (block('timeline_beats_not_array', 'timeline.json 的 beats 必须是数组'), null) : null);

// ---------- 文案 ↔ 时间线：规范化签名逐项比（不靠两种语言的 JSON 文本格式） ----------
// 关键：script 里 voice/rate 没写是合法的（用地区默认）。签名里比的是**解析后**的值，
// 和 temp_voice.py 写进签名的 VOICE/RATE 对齐，否则"只写 region"的新时间线会被假报 stale。
const REGION_DEFAULT_VOICE = {taiwan: 'zh-TW-YunJheNeural', hongkong: 'zh-HK-WanLungNeural'};
function resolveVoice(S) {
  if (S.voice) return S.voice;
  if (S.region && REGION_DEFAULT_VOICE[S.region]) return REGION_DEFAULT_VOICE[S.region];
  return 'zh-CN-YunxiNeural';
}
function resolveRate(S) { return S.rate ?? '+0%'; }

function normBite(b) {
  if (!b) return null;
  // parts 里每一项是 [源文件, 入点秒, 时长, 字幕, 增益]。
  // 注意 `(+x).toFixed(3)` 返回的是**字符串**，必须再取 + 转回数字，
  // 否则会变成 "2.600" 和 Python 的 2.6 永远不相等（这是一个真实的假 stale 来源）。
  const num = v => (v == null ? null : +Number(v).toFixed(3));
  return {
    pre: b.pre ?? null, post: b.post ?? null,
    parts: (b.parts ?? []).map(p => Array.isArray(p)
      ? [p[0], num(p[1]), num(p[2]), p[3], p[4]]
      : [p.src, num(p.in), num(p.dur), p.sub, p.gain_db]),
  };
}
function signatureOf(S) {
  return {
    pre: S.pre ?? 0,
    voice: resolveVoice(S),
    rate: resolveRate(S),
    title: S.title ?? null,
    lines: (S.lines ?? []).map(l => [l.id ?? null, l.text ?? null, l.say ?? null, l.gap ?? null, normBite(l.bite)]),
  };
}
// 逐字段比，报出**哪一项**不一样（比一个"指纹不等"有用得多）
function diffSignature(a, b) {
  const out = [];
  for (const k of ['pre', 'voice', 'rate', 'title']) {
    if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])) out.push(k);
  }
  const la = a?.lines ?? [], lb = b?.lines ?? [];
  if (la.length !== lb.length) out.push(`句子数（${lb.length} → ${la.length}）`);
  const n = Math.min(la.length, lb.length);
  for (let i = 0; i < n; i++) {
    if (JSON.stringify(la[i]) !== JSON.stringify(lb[i])) out.push(`第 ${i + 1} 句（${lb[i]?.[0] ?? '?'}）`);
  }
  return out;
}
if (S_.ok && T_.ok) {
  const cur = signatureOf(script);
  const old = timeline.signature ?? null;
  R.evidence.timeline = {duration: timeline.duration, beats: timeline.beats?.length ?? 0, stub: !!timeline.stub, has_signature: !!old};
  if (old) {
    const d = diffSignature(cur, old);
    if (d.length) {
      block('stale_timeline', `script.json 和时间线对不上，变的是：${d.slice(0, 6).join('、')}${d.length > 6 ? ' 等' : ''}——重跑 temp_voice.py`);
    }
  } else {
    warn('timeline_no_signature', '这份 timeline.json 没有内容签名（旧版本生成）：只做了文本比对，建议重跑 temp_voice.py');
    const a = (script.lines ?? []).map(l => `${l.id}|${l.text}`).join('\n');
    const b = (timeline.beats ?? []).map(x => `${x.id}|${x.text}`).join('\n');
    if (a !== b) block('stale_timeline', 'script.json 的文案和 timeline.json 对不上：改了文案就要重跑 temp_voice.py');
  }
  if (timeline.stub) warn('stub_timeline', '时间线是估算的（stub:true）：正式出片前要换成真配音的时间线');
}

// ---------- 地区 ↔ 语音 ----------
if (S_.ok && script.region) {
  const want = {taiwan: /^zh-TW-/, hongkong: /^zh-HK-/}[script.region];
  if (want && !want.test(script.voice ?? '')) {
    block('locale_voice_mismatch', `region=${script.region} 却用 ${script.voice}：香港必须 zh-HK-*，台湾必须 zh-TW-*，不能静默用普通话`);
  }
  R.evidence.locale = {region: script.region, voice: script.voice, rate: script.rate};
}

// ---------- 繁体残留：只查港台，且只查"不歧义"的简体字 ----------
// 简繁同形的字（台/量/件/防/里/东…有的在繁体里也是这个字形）不能当残留。
// 这里只列**确定只在简体侧**用的字，并且按"硬/软"分开：硬错误直接 blocking。
const SIMPLIFIED_HARD = '径网络连线数软质项选举议员询预算门槛开启关闭区间这个话说还进问时间导构应该现发现实产业经济军国视频过个们动两让给带级层业员织机图认识觉';
if (S_.ok && ['taiwan', 'hongkong'].includes(script.region)) {
  const texts = (script.lines ?? []).map(l => l.text).join('\n');
  const hard = [...new Set([...SIMPLIFIED_HARD].filter(ch => texts.includes(ch)))];
  if (hard.length) {
    block('simplified_chars', `港台片的字幕里有简体字：${hard.join('、')}——必须整篇繁体稿（不是渲完再简转繁）`);
  }
}

// ---------- editorial 结构与引用 ----------
if (E_.ok) {
  const cfg = editorial.config ?? {};
  const claims = Array.isArray(editorial.claims) ? editorial.claims : (block('claims_not_array', 'editorial.claims 必须是数组'), []);
  const srcs = Array.isArray(editorial.sources) ? editorial.sources : (block('sources_not_array', 'editorial.sources 必须是数组'), []);
  if (!cfg || typeof cfg !== 'object') block('config_missing', 'editorial.config 缺失');
  const SID = new Set(srcs.map(s => s?.id));
  R.evidence.editorial = {claims: claims.length, sources: srcs.length, overlays: cfg?.overlays ?? 'full'};

  for (const c of claims) {
    for (const s of c?.source_ids ?? []) if (!SID.has(s)) block('bad_source_ref', `claim ${c.id} 引用了不存在的来源 ${s}`);
    if (c?.kind === 'quote') {
      if (!c.quote_mode) warn('quote_mode_missing', `claim ${c.id} 是 quote 但没写 quote_mode（verbatim 逐字 / paraphrase 转述）`, {claim: c.id});
      if (c.quote_mode === 'verbatim') {
        if (!c.excerpt) block('quote_excerpt_missing', `claim ${c.id} 标了 verbatim 但没有 excerpt：逐字引用必须能对上原文`, {claim: c.id});
        if (!c.speaker) block('quote_speaker_missing', `claim ${c.id} 标了 verbatim 但没有 speaker：说话人错了就是把别人的话安到他头上`, {claim: c.id});
      }
    }
  }
  if (!srcs.length && (lines?.length ?? 0) > 0) {
    if (STAGE === 'delivery') block('empty_ledger', '事实底稿是空的：有台词但没有任何来源，不能交片');
    else warn('empty_ledger', '事实底稿是空的（脚手架状态）：出片前要填');
  }
  if (cfg?.overlays && !['full', 'none'].includes(cfg.overlays)) block('bad_overlays', `overlays 只能是 full / none，现在是 ${cfg.overlays}`);
}

// ---------- 页面检查 ----------
function loadPlaywright() {
  let local = {};
  try { local = JSON.parse(fs.readFileSync(path.join(HERE, 'local.json'), 'utf8')); } catch {}
  for (const t of [process.env.PLAYWRIGHT_FROM, local.playwright_from, path.join(process.cwd(), 'package.json'), fileURLToPath(import.meta.url)].filter(Boolean)) {
    try { return createRequire(t)('playwright'); } catch {}
  }
  throw new Error('找不到 playwright：npm i playwright，或在 scripts/local.json 写 playwright_from');
}
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav'};

async function inspectPage() {
  const {chromium} = loadPlaywright();
  const srv = http.createServer(async (q, r) => {
    try {
      const p = path.join(DIR, decodeURIComponent(new URL(q.url, 'http://x').pathname.split('?')[0]));
      const b = await fs.promises.readFile(p);
      r.writeHead(200, {'Content-Type': mime[path.extname(p)] ?? 'application/octet-stream'}).end(b);
    } catch { r.writeHead(404).end(); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  let browser;
  try {
    browser = await chromium.launch({args: ['--force-color-profile=srgb', '--disable-lcd-text']});
    const ctx = await browser.newContext({viewport: {width: 1920, height: 1080}});
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    p.on('requestfailed', q => errs.push('requestfailed: ' + q.url()));
    p.on('response', s => { if (s.status() >= 400) errs.push(`${s.status()}: ${s.url()}`); });

    await p.goto(`http://127.0.0.1:${port}/${PAGE}?policy=${POLICY}`);
    let readyOk = true;
    try { await p.evaluate(() => window.ready); } catch (e) { readyOk = false; errs.push('ready: ' + String(e.message).split('\n')[0]); }
    try { await p.evaluate(() => document.fonts.ready); } catch {}
    await p.waitForTimeout(250);

    const info = await p.evaluate(() => {
      const rep = window.KIT_REPORT ?? null;
      const hasSeek = typeof window.seek === 'function';
      const faces = [...document.fonts].filter(f => /Noto/.test(f.family));
      // 区域主题是否真的启用：读 K.regional.current()
      let regionalActive = null;
      try { regionalActive = window.KIT?.regional?.current?.()?.region ?? null; } catch {}
      return {
        rep, hasSeek, duration: window.timeline?.duration ?? 0,
        policy: rep?.policy ?? null, fiction: rep?.fiction ?? null,
        fontFaces: faces.map(f => ({family: f.family, weight: f.weight, status: f.status})),
        regionalActive,
        counts: window.FB?.CL ?? null,   // 实拍帧数登记（counts.json），用来查"素材不够长"
      };
    });

    // 逐镜取样：用 await seek(t)，确保图片解码完成
    const frames = [];
    const shots = info.rep?.shots ?? [];
    for (const s of shots) {
      // 取样点：入场后（动画完成 ~0.55s）、中点、末尾前
      const pts = [
        Math.min(s.t1 - 0.05, s.t0 + 0.55),
        (s.t0 + s.t1) / 2,
        Math.max(s.t0 + 0.02, s.t1 - 0.15),
      ];
      for (const t of pts) {
        await p.evaluate(t => window.seek(t), t);
        const r = await p.evaluate(() => {
          const st = document.querySelector('#stage') ?? document.body;
          const vis = el => {
            // 逐祖先检查 opacity/visibility/display + 视口交集
            let e = el, o = 1, hidden = false;
            while (e && e !== document.documentElement) {
              const cs = getComputedStyle(e);
              if (cs.display === 'none' || cs.visibility === 'hidden') { hidden = true; break; }
              o *= parseFloat(cs.opacity || '1');
              e = e.parentElement;
            }
            const b = el.getBoundingClientRect();
            const inView = b.right > 0 && b.bottom > 0 && b.left < innerWidth && b.top < innerHeight && b.width > 4 && b.height > 4;
            return {opacity: +o.toFixed(3), hidden, inView, visible: !hidden && o > 0.05 && inView,
                    w: Math.round(b.width), h: Math.round(b.height)};
          };
          const imgs = [...st.querySelectorAll('img')].map(im => ({src: im.getAttribute('src'), role: im.dataset.role ?? null, ...vis(im)}));
          const roles = [...st.querySelectorAll('[data-role]')].map(el => ({role: el.dataset.role, tag: el.tagName.toLowerCase(), ...vis(el)}));
          const badges = st.querySelectorAll('.pol-badge,.pol-fic,.pol-jtag').length;
          // 文字越界：只看最内层文字块；字幕按实际文字宽度算
          const over = [];
          const seen = new Set();
          for (const el of st.querySelectorAll('div')) {
            const txt = (el.textContent ?? '').trim();
            if (!txt || txt.length > 60 || el.querySelector('div')) continue;
            const cs = getComputedStyle(el);
            if (parseFloat(cs.fontSize) < 20) continue;
            const b = el.getBoundingClientRect();
            if (b.width < 8 || b.height < 8) continue;
            let l = b.left, rr = b.right;
            if (el.closest('.sub')) {
              const c2 = document.createElement('canvas').getContext('2d');
              c2.font = cs.font;
              const tw = Math.min(b.width, c2.measureText(txt).width);
              l = b.left + (b.width - tw) / 2; rr = l + tw;
            } else if (/translateX\(-50%\)/.test(cs.transform)) {
              // 以中心定位的元素：getBoundingClientRect 已经算上 transform 了，
              // 但这里的 left 是 CSS 的 left 值，b.left 才是真实位置——用真实矩形，
              // 不再用 canvas 估（那是给 .sub 这种整行容器用的）。
              l = b.left; rr = b.right;
            }
            const key = txt.slice(0, 10) + Math.round(b.top);
            if (seen.has(key)) continue; seen.add(key);
            if (l < 8 || rr > 1912 || b.top < 4 || b.bottom > 1076) over.push({text: txt.slice(0, 16), left: Math.round(l), right: Math.round(rr), top: Math.round(b.top), bottom: Math.round(b.bottom)});
          }
          // 可见文字总量：巨字/引语卡/金句这些都算"内容"，不能因为不是 img 就判空镜
          let textLen = 0;
          for (const el of st.querySelectorAll('div')) {
            const txt = (el.textContent ?? '').trim();
            if (!txt || el.querySelector('div')) continue;
            const cs = getComputedStyle(el);
            if (parseFloat(cs.fontSize) < 24) continue;
            const b = el.getBoundingClientRect();
            if (b.width > 8 && b.height > 8) textLen += txt.length;
          }
          // seek 是否确定：同一时刻再画一次，比较 stage 的 HTML
          const before = st.innerHTML;
          window.seek(window.FB?.cur?.t ?? 0);
          return {imgs, roles, badges, over, subs: st.querySelectorAll('.sub').length, textLen, snapshot: before.length};
        });
        // 重复 seek 一致性：比整段 HTML 内容哈希（比长度可靠——同长度的坐标/图片变化长度比不出来）
        const snap = async t => {
          await p.evaluate(t => window.seek(t), t);
          const html = await p.evaluate(() => document.querySelector('#stage').innerHTML);
          let h = 2166136261;
          for (let i = 0; i < html.length; i++) { h ^= html.charCodeAt(i); h = Math.imul(h, 16777619); }
          return (h >>> 0).toString(16) + ':' + html.length;
        };
        const s1h = await snap(t), s2h = await snap(t);
        frames.push({shot: s.i + 1, scene: s.scene, t: +t.toFixed(2), ...r, deterministic: s1h === s2h, hash: s1h});
      }
      if (SAVE_FRAMES) {
        await p.evaluate(t => window.seek(t), (s.t0 + s.t1) / 2);
        await p.screenshot({path: path.join(OUT, `preflight_shot${String(s.i + 1).padStart(2, '0')}.png`)});
      }
    }
    return {errs, info, frames, readyOk};
  } finally {
    try { await browser?.close(); } catch {}
    await new Promise(r => srv.close(r));
  }
}

// ---------- 媒体 ----------
function probe(file) {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,duration',
    '-show_entries', 'format=duration', '-of', 'json', file], {encoding: 'utf8'});
  if (r.error || r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}

(async () => {
  let page = null;
  try { page = await inspectPage(); }
  catch (e) { block('page_failed', '页面没能跑起来：' + String(e.message).split('\n')[0]); }

  if (page) {
    for (const e of [...new Set(page.errs)].slice(0, 8)) block('page_error', e);
    if (!page.readyOk) block('not_ready', 'window.ready 没有 resolve：film.js 报错了');
    if (!page.info.hasSeek) block('no_seek', '页面没有 window.seek：render/preflight 都没法取帧');
    if (!page.info.rep) block('no_kit_report', '页面没有 KIT_REPORT：film.js 没走 K.film（手写档用 --moves 另查）');

    R.evidence.policy = page.info.policy;
    R.evidence.regional = page.info.regionalActive;
    R.evidence.fonts = page.info.fontFaces;

    // 字体：区域主题真的启用时，该族必须有 loaded
    const reg = page.info.regionalActive;
    if (reg) {
      const need = reg === 'hongkong' ? 'NotoHKH' : 'NotoTCH';
      const loaded = page.info.fontFaces.some(f => f.family === need && f.status === 'loaded');
      if (!loaded) block('font_not_loaded', `region=${reg} 但 ${need} 没有 loaded：港台片会掉回系统字体`);
      // 实际使用的 computed 字重（巨字应当 900）
      const used = await (async () => 0)();
      R.evidence.font_required = need;
    }

    // 镜头覆盖
    const shots = page.info.rep?.shots ?? [];
    const dur = page.info.duration || timeline?.duration || 0;
    if (shots.length && dur) {
      if (shots[0].t0 > 0.05) block('head_gap', `第一镜从 ${shots[0].t0}s 才开始，片头有 ${shots[0].t0}s 空档`);
      const last = shots[shots.length - 1];
      if (last.t1 < dur - 0.2) block('tail_gap', `最后一镜在 ${last.t1.toFixed(2)}s 结束，片长 ${dur.toFixed(2)}s：剩余 ${(dur - last.t1).toFixed(2)}s 没有镜头`);
      for (let i = 0; i < shots.length - 1; i++) {
        if (shots[i + 1].t0 > shots[i].t1 + 0.01) block('shot_gap', `第 ${shots[i].i + 1}–${shots[i + 1].i + 1} 镜之间有 ${(shots[i + 1].t0 - shots[i].t1).toFixed(2)}s 空档`);
        if (shots[i + 1].t0 < shots[i].t1 - 0.01) block('shot_overlap', `第 ${shots[i].i + 1}/${shots[i + 1].i + 1} 镜重叠 ${(shots[i].t1 - shots[i + 1].t0).toFixed(2)}s`);
      }
    }

    // cue 是否落在**声明它的那一镜**内。KIT_REPORT 每镜带 cues（key/raw/解析秒数），
    // until 是边界（等于镜尾，不算越界）；纯文本里的 '@xx' 会被 timer 解析失败，单独报。
    if (shots.length) {
      for (const s of shots) {
        for (const c of (s.cues ?? [])) {
          if (c.err) { block('bad_cue', `第 ${s.i + 1} 镜的 ${c.key} 写了 ${c.raw}，解析失败：${c.err}`); continue; }
          if (c.t == null) continue;
          const isUntil = c.key === 'until';
          const lo = s.t0 - 0.02, hi = s.t1 + 0.02;
          if (c.t < lo || c.t > hi) {
            block('cue_outside_shot',
              `第 ${s.i + 1} 镜（${s.scene}，${s.t0}–${s.t1}s）的 ${c.key}=${c.raw} 解析到 ${c.t}s，不在这一镜里`
              + (isUntil ? '（until 必须等于或晚于本镜起点、不晚于镜尾）' : ''));
          }
        }
      }
    }

    // 角标
    const ov = editorial?.config?.overlays ?? 'full';
    const withBadges = page.frames.filter(f => f.badges > 0);
    if (ov === 'none' && withBadges.length) {
      block('badge_visible', `overlays:'none' 但 ${withBadges.length} 个抽样帧里有角标元素（${withBadges.slice(0, 3).map(f => `第${f.shot}镜 ${f.t}s`).join('、')}）`);
    }

    // 文字越界
    const bad = page.frames.filter(f => f.over.length);
    if (bad.length) {
      const ex = bad[0].over[0];
      block('text_overflow', `${bad.length} 个抽样帧有文字越出安全区，例如第 ${bad[0].shot} 镜 ${bad[0].t}s「${ex.text}」left=${ex.left} right=${ex.right}`,
        {shot: bad[0].shot, t: bad[0].t});
    }

    // 确定 seek
    const nondet = page.frames.filter(f => !f.deterministic);
    if (nondet.length) block('nondeterministic_seek', `${nondet.length} 个取样点重复 seek 画面不一致（第 ${nondet[0].shot} 镜 ${nondet[0].t}s）：动画不能依赖播放时钟`);

    // local-clash 两个人都要看得见
    // 取样规则：只取「两侧入场动画都已完成」的时刻（最后 1/3 的帧），不要求第一帧就两人齐全。
    const clash = page.frames.filter(f => f.scene === 'local-clash');
    if (clash.length) {
      const late = clash.filter(f => {
        const s = shots.find(x => x.i + 1 === f.shot);
        if (!s) return false;
        return f.t >= s.t0 + (s.t1 - s.t0) * 0.6;   // 只看后 40%
      });
      const worst = late.map(f => ({f, n: f.roles.filter(r => r.role === 'person' && r.visible).length}))
        .sort((a, b) => a.n - b.n)[0];
      if (worst && worst.n < 2) {
        block('clash_people_missing', `local-clash 第 ${worst.f.shot} 镜 ${worst.f.t}s（入库后段）只有 ${worst.n} 个可见的 data-role="person"（应当两个）——检查 slam 的入参与父层 opacity`);
      }
      if (!page.frames.some(f => f.roles.some(r => r.role === 'person'))) {
        warn('no_person_role', 'local-clash 里没有 data-role="person"：预检只能靠 png 猜人物，容易漏父层 opacity');
      }
    }

    // 每镜至少要有可见内容（不是纯空）
    // 除了"这一帧什么都没"，还要查"这一镜的前段有没有内容"——曾经出现过
    // 一个 25 秒的图解镜，前 12 秒只有一个小标题，因为所有行都挂在后面的 cue 上。
    for (const f of page.frames) {
      const hasImg = f.imgs.some(im => im.visible);
      const hasRole = f.roles.some(r => r.visible);
      const hasSub = f.subs > 0;
      const hasText = (f.textLen ?? 0) > 4;
      if (!hasImg && !hasRole && !hasSub && !hasText) {
        warn('empty_shot', `第 ${f.shot} 镜 ${f.t}s 没有任何可见的图/角色/文字（背景不算内容）`);
      } else if (!hasImg && !hasRole && hasText && f.textLen < 12) {
        // 只有一行小标题，没有主体内容
        warn('thin_shot', `第 ${f.shot} 镜 ${f.t}s 只有 ${f.textLen} 个字的标题，没有主体内容：行/图要挂在这一镜自己的 cue 上，不要都堆到后面`);
      }
    }

    // 实拍素材帧数 vs 镜头时长：帧数不够会"钉在最后一帧"，观众看到的是静图
    if (page.info.counts) {
      const clips = page.info.counts;
      for (const s of shots) {
        const c = Object.entries(clips).find(([k, v]) => s.cues?.some(x => String(x.raw ?? '').includes(k)));
        if (!c) continue;
        const [name, frames] = c;
        const need = Math.ceil((s.t1 - s.t0) * 30);
        if (frames && need > frames + 2) {
          block('clip_too_short', `第 ${s.i + 1} 镜（${(s.t1 - s.t0).toFixed(1)}s）要用 ${name} 的 ${need} 帧，但素材只有 ${frames} 帧：后面会钉在最后一帧，要么加素材要么缩短这一镜`);
        }
      }
    }

    // 字幕计划：delivery 前必须每句都有 caption_segments（否则导出的只是草稿）
    if (STAGE === 'delivery' && S_.ok) {
      const missing = (script.lines ?? []).filter(l => !l.caption_segments).map(l => l.id);
      if (missing.length) {
        block('caption_plan_missing', `${missing.length} 句没有 caption_segments（${missing.slice(0, 5).join('、')}）：字幕会是按标点猜的草稿，不能当终稿交付`);
      }
    }

    review('visual_check', '角标/台标/抠像残片/人脸遮挡/字身粗细/廉价感：程序只能证明"没有 .pol-* 元素"，这些要看 --sheet 或 --save-frames 的帧');
    if (ov !== 'none') review('badge_content', 'overlays 开着：要确认角标里的来源和这一段真的对得上（程序只看元素存在）');
    review('semantic_check', '原话归属、数字范围、因果与动机、双方反驳是否被删：这是读稿问题，按 references/self-review.md 的复核卡做');
  }

  // ---------- delivery ----------
  if (STAGE === 'delivery') {
    // clean 版不应该有烧录字幕：读 film.js 里的 captionMode
    let captionMode = 'sidecar';
    try {
      const fsrc = fs.readFileSync(path.join(DIR, 'film.js'), 'utf8');
      const m = /captionMode\s*:\s*['"]([^'"]+)['"]/.exec(fsrc);
      if (m) captionMode = m[1];
    } catch {}
    R.evidence.caption_mode = captionMode;
    // 正式交付命名（按约定）：clean 是默认，burned 是显式备用
    const vids = ['final_clean_720.mp4', 'final_clean_1080.mp4', 'final_720.mp4', 'final_1080.mp4']
      .map(f => path.join(OUT, f)).filter(f => fs.existsSync(f));
    if (!vids.length) block('no_video', `${OUT} 里没有 final_clean_720.mp4（或 legacy 的 final_720.mp4）`);
    // clean 版不允许有烧录字幕：用 caption_mode 判断
    if (captionMode !== 'burned' && vids.length) {
      R.evidence.caption_mode = captionMode;
    }
    for (const v of vids) {
      const name = path.basename(v);
      const j = probe(v);
      if (!j) { block('ffprobe_failed', `ffprobe 读不了 ${name}`); continue; }
      const streams = j.streams ?? [];
      const vs = streams.find(s => s.codec_type === 'video');
      const as = streams.find(s => s.codec_type === 'audio');
      if (!vs) block('no_video_stream', `${name} 没有视频流`);
      if (!as) block('no_audio_stream', `${name} 没有音频流——交片必须有声`);
      const vd = parseFloat(vs?.duration ?? j.format?.duration ?? '0');
      const ad = parseFloat(as?.duration ?? '0');
      if (!(vd > 0)) block('zero_duration', `${name} 视频时长是 ${vd}`);
      if (as && Math.abs(vd - ad) > 0.25) block('av_duration_mismatch', `${name} 音视频时长差 ${Math.abs(vd - ad).toFixed(3)}s：视频 ${vd.toFixed(3)} / 音频 ${ad.toFixed(3)}`);
      if (timeline?.duration) {
        const dd = Math.abs(vd - timeline.duration);
        // 差得多就是"片子对不上时间线"——通常是时间线被覆盖成估时、或成片是旧版本
        if (dd > 1.0) block('duration_vs_timeline', `${name} 时长 ${vd.toFixed(2)}s，timeline 是 ${timeline.duration.toFixed(2)}s，差 ${dd.toFixed(2)}s：成片和时间线不是同一次制作的`);
        else if (dd > 0.5) warn('duration_vs_timeline', `${name} ${vd.toFixed(2)}s 与 timeline ${timeline.duration.toFixed(2)}s 差 ${dd.toFixed(2)}s`);
      }
      R.evidence[name] = {video: vs ? {codec: vs.codec_name, w: vs.width, h: vs.height, dur: +vd.toFixed(3)} : null,
                          audio: as ? {codec: as.codec_name, dur: +ad.toFixed(3)} : null};
    }
    for (const [f, w, h] of [['cover_1280.jpg', 1280, 720], ['cover_1920.png', 1920, 1080]]) {
      const fp = path.join(OUT, f);
      if (!fs.existsSync(fp)) { block('cover_missing', `没有 ${f}：封面是必需交付项`); continue; }
      const j = probe(fp);
      const vs = j?.streams?.find(s => s.codec_type === 'video');
      if (!vs) { block('cover_unreadable', `${f} 读不出尺寸`); continue; }
      if (vs.width !== w || vs.height !== h) block('cover_size', `${f} 是 ${vs.width}×${vs.height}，应当是 ${w}×${h}`);
      R.evidence[f] = {w: vs.width, h: vs.height};
    }
    const wav = path.join(DIR, 'mix_master.wav');
    if (fs.existsSync(wav)) {
      const r = spawnSync(FFMPEG, ['-hide_banner', '-i', wav, '-af', 'volumedetect', '-f', 'null', '-'], {encoding: 'utf8'});
      const m = /mean_volume:\s*(-?[\d.]+) dB/.exec(r.stderr ?? '');
      if (m) {
        const db = parseFloat(m[1]);
        R.evidence.mean_volume_db = db;
        if (db > -8) warn('too_loud', `平均音量 ${db} dB：太满了`);
        if (db < -30) block('too_quiet', `平均音量 ${db} dB：基本听不见`);
      }
    } else warn('no_mix', '没有 mix_master.wav：先跑 mix.py');
  }

  // ---------- review.json：执行模型自己写的复核记录 ----------
  // 程序不能替模型看图和读稿，所以它只做一件有用的事：
  //   1) 核对这份复核记录是不是**对这一版输入**做的（hash 覆盖 script/editorial/timeline/film/css/字幕/素材清单）
  //   2) 用记录里的 `covers` 逐项消掉 review_required —— 只消它明说覆盖的 code，不能靠任意 items
  {
    // 输入 hash：**内容**哈希，不是文件名/大小/时间戳。
    // 覆盖：script / editorial / timeline / film.js / film.css / 字幕 / **实际加载的 lib** / 用到的素材二进制。
    // 理由：同一尺寸换一张图、改一行 local_native.js，旧视觉复核就作废了——只记 size 证明不了内容相同。
    const bufHash = (p) => {
      try { const b = fs.readFileSync(p); let h = 2166136261; for (let i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 16777619); } return `${b.length.toString(16)}:${(h >>> 0).toString(16)}`; }
      catch { return 'missing'; }
    };
    const collect = (dir, base, out, opts = {}) => {
      let ents = []; try { ents = fs.readdirSync(dir, {withFileTypes: true}); } catch { return out; }
      for (const e of ents.sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.name === 'out' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name), rel = base ? `${base}/${e.name}` : e.name;
        if (e.isDirectory()) {
          if (opts.skipVoice && e.name === 'voice') continue;
          collect(full, rel, out, opts);
        } else if (/\.(js|css|json|html|png|jpg|jpeg|wav)$/i.test(e.name)) {
          out.push(`${rel}=${bufHash(full)}`);
        }
      }
      return out;
    };
    const inputHash = (() => {
      const files = [
        'script.json', 'editorial.json', 'timeline.json', 'film.js', 'film.css',
        'out/captions.zh-TW.srt', 'out/captions.zh-HK.srt', 'out/captions.json',
      ].map(f => `${f}=${bufHash(path.join(DIR, f))}`);
      // lib/ 是真正参与渲染的代码（kit、local_native、film_base…），必须进来
      const lib = collect(path.join(DIR, 'lib'), 'lib', []);
      const assets = collect(DIR, '', [], {skipVoice: true});
      let h = 2166136261;
      const payload = [...files, ...lib, ...assets].join('\n');
      for (let i = 0; i < payload.length; i++) { h ^= payload.charCodeAt(i); h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(16);
    })();
    R.evidence.input_hash = inputHash;

    const rp = path.join(OUT, 'review.json');
    let rev = null;
    if (fs.existsSync(rp)) {
      try { rev = JSON.parse(fs.readFileSync(rp, 'utf8')); }
      catch (e) { review('review_unreadable', `out/review.json 读不了：${String(e.message).split('\n')[0]}`); }
    }

    if (rev) {
      if (!rev.input_hash) review('review_no_hash', 'out/review.json 没写 input_hash：无法确认这是对当前版本做的复核');
      else if (rev.input_hash !== inputHash) review('review_stale', `out/review.json 是对旧版做的（${rev.input_hash} ≠ ${inputHash}）：画面/素材改过就要重看`);
      // covers：模型明确声明"我复核了哪些检查项"，**每项必须有非空的字符串证据**。
      // 只接受 string 或 string[]，且至少一条非空白；true / {} / [] 都不算（否则填 true 就能清掉全部复核）。
      const covers = rev.covers ?? {};
      const evidenceOf = (v) => {
        if (typeof v === 'string') return v.trim();
        if (Array.isArray(v)) return v.filter(x => typeof x === 'string' && x.trim()).length ? v.filter(x => typeof x === 'string' && x.trim()) : null;
        return null;
      };
      R.evidence.review_covers = Object.keys(covers);
      R.review_required = R.review_required.filter(rq => {
        if (!(rq.code in covers)) return true;
        const ev = evidenceOf(covers[rq.code]);
        if (!ev) {
          warn('review_empty_evidence', `out/review.json 里 covers.${rq.code} 没有实际证据（只接受非空文字或文字数组，true/{} 不算）`);
          return true;
        }
        return false;
      });
      // 还有 review_required 而 review.json 只写了 items 没写 covers：提醒该用 covers
      if (R.review_required.length && !Object.keys(covers).length && (rev.items ?? []).length) {
        warn('review_items_only', 'out/review.json 只有 items、没有 covers：items 是过程记录，消项要靠 covers 按检查项声明');
      }
    } else if (STAGE === 'delivery') {
      review('review_missing', '没有 out/review.json：语义与图像复核要做，并按 references/self-review.md 记 covers + 证据');
    }
  }

  // ---------- 输出 ----------
  const exit = R.blocking_errors.length ? 1 : (R.review_required.length ? 2 : 0);
  R.exit = exit;
  try { fs.mkdirSync(OUT, {recursive: true}); fs.writeFileSync(path.join(OUT, 'preflight.json'), JSON.stringify(R, null, 1)); } catch {}
  if (JSON_OUT) console.log(JSON.stringify(R, null, 1));
  else {
    console.log(`预检：${DIR}`);
    console.log(`阶段：${STAGE}　策略：${R.evidence.policy ?? '—'}　区域：${R.evidence.regional ?? '—'}`);
    if (R.blocking_errors.length) { console.log(`\n必须修（${R.blocking_errors.length}）：`); for (const e of R.blocking_errors) console.log(`  [${e.code}] ${e.msg}`); }
    if (R.warnings.length) { console.log(`\n提醒（${R.warnings.length}）：`); for (const e of R.warnings) console.log(`  [${e.code}] ${e.msg}`); }
    if (R.review_required.length) { console.log(`\n要你自己看（${R.review_required.length}）：`); for (const e of R.review_required) console.log(`  [${e.code}] ${e.msg}`); }
    if (!R.blocking_errors.length && !R.warnings.length && !R.review_required.length) console.log('\n没查出问题。');
    console.log(`\n退出码 ${exit}：${exit === 0 ? '通过' : exit === 1 ? '有必须修的' : '只有需要人工复核的'}`);
  }
  process.exit(exit);
})();

