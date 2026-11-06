// 逐帧渲染：页面暴露 window.ready（Promise）和 window.seek(t)（画出 t 秒那一帧），Playwright 截图，ffmpeg 编码。
// 放在片子目录外也行：--dir 指向含 index.html + timeline.json 的目录（默认当前目录）。
//   node render.mjs --dir film --stills 0.5,3.2,10       # 看帧（out/still_*.png）
//   node render.mjs --dir film --video --h 720            # 预览整片（out/visual_720.mp4，无声）
//   node render.mjs --dir film --video --h 720 --range 0:18   # 只渲一段（out/visual_720_range.mp4）
//   node render.mjs --dir film --video --h 1080           # 成片画面
//   node render.mjs --dir film --moves [--prev 上一条/out/moves.json]   # 手法用量：每镜用了哪些手法、有没有连着用、和上一条片像不像（out/moves.json）
//   node render.mjs --dir film --check                    # 模板档：查镜头表（每镜的场景、时长、says、提醒），几秒钟，不渲染
//   node render.mjs --dir film --sheet                    # 每一镜的开头、中间、末尾三帧拼一张图（out/sheet.png），交片前自己先看
//   --page index2.html 换一个入口页；--out 目录 换输出目录（默认 <dir>/out）
// 页面要求：seek 是确定的（同一个 t 永远画出同一帧，不依赖播放时间、不用 CSS 动画），并且 await 图片解码与字体。
// ffmpeg：PATH 里的 ffmpeg，或环境变量 FFMPEG，或 scripts/local.json 的 ffmpeg。没装 Playwright 自带的 Chromium 时自动改用本机 Edge。
import fs from 'node:fs/promises'; import path from 'node:path'; import http from 'node:http';
import {spawn} from 'node:child_process'; import {once} from 'node:events';
import {createRequire} from 'node:module'; import fsSync from 'node:fs'; import {fileURLToPath} from 'node:url';
import {stub} from './timeline_stub.mjs';

const arg = k => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const has = k => process.argv.includes(k);
// 检查策略：upstream（默认，财经那套配额）/ politics（时政）。非法值直接报错，不静默退回。
// 页面侧怎么拿到：index.html 里 KIT.use(F) 之前写 KIT.use(F,{policy:new URLSearchParams(location.search).get('policy')}) 也行，
// 但更稳的是 render.mjs 传 query，film.js 不用改（见 POLITICS_BOOT）。
const POLICY = arg('--check-policy') ?? 'upstream';
const POLICIES = ['upstream', 'politics'];
if (!POLICIES.includes(POLICY)) { console.error(`--check-policy 只能是 ${POLICIES.join(' / ')}，现在是 '${POLICY}'`); process.exit(1); }
function loadPlaywright() {
  const here = path.dirname(fileURLToPath(import.meta.url)); let local = {};
  try { local = JSON.parse(fsSync.readFileSync(path.join(here, 'local.json'), 'utf8')); } catch {}
  for (const t of [process.env.PLAYWRIGHT_FROM, local.playwright_from, path.join(process.cwd(), 'package.json'), fileURLToPath(import.meta.url)].filter(Boolean)) {
    try { return createRequire(t)('playwright'); } catch {}
  }
  throw new Error('找不到 playwright：npm i playwright，或在 scripts/local.json 写 playwright_from 指向装了它的 package.json');
}
const {chromium} = loadPlaywright();
let LOCAL = {}; try { LOCAL = JSON.parse(fsSync.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'local.json'), 'utf8')); } catch {}
const FF = process.env.FFMPEG ?? LOCAL.ffmpeg ?? 'ffmpeg';
const here = path.resolve(arg('--dir') ?? '.'), PAGE = arg('--page') ?? 'index.html';
const H = Number(arg('--h') ?? 720), Wd = Math.round(H * 16 / 9), out = arg('--out') ? path.resolve(arg('--out')) : path.join(here, 'out');
await fs.mkdir(out, {recursive: true});
// 封面不需要时间线（封面是第一帧之外另排的版），没有 timeline.json 也能渲
const T = has('--cover') ? {beats: [], duration: 0} : JSON.parse(await fs.readFile(path.join(here, 'timeline.json'), 'utf8'));
// 文案和时间线对不对得上：script.json 改过、timeline.json 没重算时，后面报的"句子里找不到某个词"全是误导（报的是旧句子），先在这里拦住
const TS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'timeline_stub.mjs');
function staleTimeline() {
  const sp = path.join(here, 'script.json'); if (!fsSync.existsSync(sp)) return null;
  let S; try { S = JSON.parse(fsSync.readFileSync(sp, 'utf8')); } catch (e) { return {err: true, msg: `script.json 不是合法的 JSON（${e.message}）：逗号、引号、括号对一下`}; }
  if (T.stub) {
    let E; try { E = stub(S); } catch (e) { return {err: true, msg: e.message}; }
    const sig = t => JSON.stringify([t.pre, t.title, t.beats.map(b => [b.id, b.text, b.start, b.end]), (t.inserts ?? []).map(i => [i.id, i.start, i.end])]);
    if (sig(E) !== sig(T)) return {err: true, msg: `script.json 改过了，timeline.json 还是按旧文案估的：先重跑 node "${TS}" "${sp}"，再查（每改一次 script.json 都要重跑）`};
  } else {
    const a = (S.lines ?? []).map(l => `${l.id}|${l.text}|${l.bite ? 1 : 0}`).join('\n') + `|${S.title?.after ?? ''}`;
    const b = T.beats.map(x => `${x.id}|${x.text}|${(T.inserts ?? []).some(i => i.after === x.id) ? 1 : 0}`).join('\n') + `|${T.title ? (S.title?.after ?? '') : ''}`;
    if (a !== b) return {err: false, msg: 'script.json 的文案（句子、原声插段、片名位置）和配音出的时间线（timeline.json）对不上：改了文案就要重新配音、重出时间线（temp_voice.py，或豆包配音后再对齐）'};
  }
  return null;
}
const STALE = arg('--worker') ? null : staleTimeline();
if (STALE) console.log((STALE.err ? '时间线要先重算：' : '注意：') + STALE.msg);
if (STALE?.err && has('--check')) process.exit(2);
const mime = {'.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.TTF': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2'};
const worker = arg('--worker');
let server, port = Number(arg('--port'));
if (!worker) {
  server = http.createServer(async (q, r) => {
    try { const p = path.join(here, decodeURIComponent(new URL(q.url, 'http://x').pathname)); const b = await fs.readFile(p); r.writeHead(200, {'Content-Type': mime[path.extname(p)] ?? 'application/octet-stream'}).end(b); }
    catch { r.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); port = server.address().port;
}
async function page() {
  const opt = {args: ['--force-color-profile=srgb', '--disable-lcd-text']};
  let b; try { b = await chromium.launch(opt); } catch (e) { b = await chromium.launch({...opt, channel: 'msedge'}).catch(() => { throw e; }); }
  const p = await b.newPage({viewport: {width: Wd, height: H}}); const errs = [], warns = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); else if (m.type() === 'warning' && /^\[(moves|kit)\]/.test(m.text())) warns.push(m.text()); });
  p.on('requestfailed', q => errs.push('请求失败 ' + q.url())); p.on('response', s => { if (s.status() >= 400) errs.push(s.status() + ' ' + s.url()); });
  await p.goto(`http://127.0.0.1:${port}/${PAGE}?policy=${POLICY}`);
  try { await p.evaluate(() => window.ready); }
  catch (e) {
    // Playwright 包的那层（page.evaluate: Error: ……）和代码位置不给人看，只留我们自己写的那句话
    const msg = e.message.replace(/^page\.evaluate:\s*/, '').replace(/^(Uncaught\s+)?(Type|Reference|Syntax|Range)?Error:\s*/, '').split('\n').filter(l => !/^\s+at /.test(l)).slice(0, 30).join('\n');
    const more = [...new Set(errs)].map(m => m.replace(/^(Uncaught\s+)?Error:\s*/, '')).filter(m => !msg.includes(m.split('\n')[0]));
    console.error('页面没跑起来，先改这里：\n' + msg + (more.length ? '\n另外页面还报了：\n- ' + more.slice(0, 8).join('\n- ') : ''));
    await b.close(); process.exit(3);
  }
  return {b, p, errs, warns};
}
if (arg('--stills')) {
  const {b, p, errs, warns} = await page(); const ts = arg('--stills').split(',').map(Number);
  for (const t of ts) { await p.evaluate(t => window.seek(t), t); await p.screenshot({path: path.join(out, `still_${t.toFixed(2)}.png`)}); }
  await b.close(); server.close(); if (errs.length) console.log('页面报错（先修再看帧）：', [...new Set(errs)].slice(0, 8));
  if (warns.length) console.log([...new Set(warns)].join('\n')); console.log('stills', ts.length); process.exit(0);
}
// ---------- 封面：把 film.js 里的 K.cover(...) 渲成图（不经时间线） ----------
//   node render.mjs --dir film --cover [--cover-h 720] [--page index.html]
// film.js 里写：window.COVER = <K.cover({...}) 的返回值>；或 K.coverHTML(...)。
if (has('--cover')) {
  const CH = Number(arg('--cover-h') ?? 720), CW = Math.round(CH * 16 / 9);
  const b = await chromium.launch({args: ['--force-color-profile=srgb', '--disable-lcd-text']});
  // deviceScaleFactor 固定 1：输出像素必须等于 --cover-h 声明的尺寸。
  // 以前用 2 是为了"更清晰"，结果 cover_1280.jpg 实际是 2560×1440——文件名骗人。
  const ctx = await b.newContext({viewport: {width: CW, height: CH}, deviceScaleFactor: 1});
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const srv = http.createServer(async (q, r) => {
    try { const fp = path.join(here, decodeURIComponent(new URL(q.url, 'http://x').pathname.split('?')[0])); const bb = await fs.readFile(fp);
      r.writeHead(200, {'Content-Type': mime[path.extname(fp)] ?? 'application/octet-stream'}).end(bb); }
    catch { r.writeHead(404).end(); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const prt = srv.address().port;
  await p.goto(`http://127.0.0.1:${prt}/${PAGE}?cover=1&policy=${POLICY}`);
  try {
    await p.evaluate(() => window.COVER_READY ?? window.ready);
    // 封面有一层独立的缩放：页面按 1920×1080 设计，这里把 stage 缩到封面尺寸
    await p.evaluate(([w, h]) => {
      const st = document.querySelector('#stage');
      if (st) st.style.transform = `scale(${Math.min(w / 1920, h / 1080)})`;
      document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
    }, [CW, CH]);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(400);
  } catch (e) { console.error('封面页面没跑起来：\n' + e.message.split('\n')[0]); await b.close(); srv.close(); process.exit(3); }
  const suffix = CH >= 1080 ? '1920' : '1280';
  const file = path.join(out, `cover_${suffix}.${CH >= 1080 ? 'png' : 'jpg'}`);
  await p.screenshot({path: file, type: CH >= 1080 ? 'png' : 'jpeg', ...(CH >= 1080 ? {} : {quality: 92})});
  await b.close(); srv.close();
  // 自检：截出来的像素必须等于声明的尺寸，不能靠文件名承诺
  try {
    const raw = fsSync.readFileSync(file);
    let w = 0, h = 0;
    if (raw[0] === 0x89 && raw.toString('ascii', 1, 4) === 'PNG') { w = raw.readUInt32BE(16); h = raw.readUInt32BE(20); }
    else { // JPEG：扫 SOF 段
      let i = 2;
      while (i < raw.length) {
        if (raw[i] !== 0xFF) { i++; continue; }
        const m = raw[i + 1];
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) { h = raw.readUInt16BE(i + 5); w = raw.readUInt16BE(i + 7); break; }
        i += 2 + raw.readUInt16BE(i + 2);
      }
    }
    if (w && h && (w !== CW || h !== CH)) {
      console.log(`注意：写出的 ${path.basename(file)} 是 ${w}×${h}，和声明的 ${CW}×${CH} 不一致`);
      if (errs.length) console.log('页面报错：\n- ' + [...new Set(errs)].slice(0, 6).join('\n- '));
      process.exit(2);
    }
  } catch {}
  if (errs.length) console.log('页面报错：\n- ' + [...new Set(errs)].slice(0, 6).join('\n- '));
  console.log(`${CW}×${CH} → ${file}`);
  process.exit(errs.length ? 2 : 0);
}
// ---------- 模板档：查镜头表（kit.js 的 K.film 登记的） ----------
if (has('--check')) {
  const {b, p, errs} = await page();
  const r = await p.evaluate(() => window.KIT_REPORT ?? null);
  await b.close(); server.close();
  if (errs.length) console.log('页面报错（先修）：\n- ' + [...new Set(errs)].slice(0, 8).join('\n- '));
  if (!r) { console.log('页面里没有镜头表：film.js 没用 K.film（手写的片子用 --moves 查手法）'); process.exit(0); }
  fsSync.writeFileSync(path.join(out, 'check.json'), JSON.stringify(r, null, 1));   // 同一份镜头表和提醒，给别的脚本读（kit/gallery/make.py）
  console.log(`检查策略：${POLICY}${r.policy ? (r.policy === POLICY ? '' : `（页面报的是 ${r.policy}，和命令行不一致，检查一下 film.js 有没有自己传 policy）`) : ''}`);
  if (r.fiction) console.log(!r.fiction.on
    ? '虚构标记：未开启（factual 模式正常；fiction 模式要 K.politics.fiction(true, …)）'
    : r.fiction.suppressed
      ? `虚构标记：已关闭（display:'no-badges'，私人研究预览；出处与真实性类型在 editorial.json 里）`
      : `虚构标记：全片常驻「${r.fiction.text}」${r.fiction.missing?.length ? `，但有 ${r.fiction.missing.length} 处缺` : '，每一镜都验过'}`);
  console.log('镜  时间            时长   场景        接法       says');
  for (const s of r.shots) console.log(`${String(s.i + 1).padStart(2)}  ${s.t0.toFixed(1).padStart(5)}–${s.t1.toFixed(1).padEnd(6)} ${(s.t1 - s.t0).toFixed(1).padStart(4)}s  ${s.scene.padEnd(10)} ${s.enter.padEnd(10)} ${s.says || '（没写）'}`);
  console.log(r.warns.length ? `\n要看一眼（${r.warns.length} 条）：\n- ` + r.warns.join('\n- ') : '\n没有要提醒的。');
  console.log('过了不等于好看：再跑 --sheet 看图。');
  process.exit(errs.length ? 2 : 0);
}
// ---------- 模板档：每一镜开头、中间、末尾三帧拼一张图 ----------
if (has('--sheet')) {
  const {b, p, errs, warns} = await page();
  const shots = await p.evaluate(() => window.KIT_REPORT?.shots ?? (window.FB?.shots ?? []).map((s, i) => ({i, t0: s.t0, t1: s.t1, scene: '', says: ''})));
  const cells = [];
  for (const s of shots) for (const [k, t] of [['开头', Math.min(s.t1 - .05, s.t0 + .35)], ['中间', (s.t0 + s.t1) / 2], ['末尾', Math.max(s.t0, s.t1 - .12)]]) {
    await p.evaluate(t => window.seek(t), t);
    cells.push({i: s.i, k, t, src: 'data:image/jpeg;base64,' + (await p.screenshot({type: 'jpeg', quality: 80})).toString('base64')});
  }
  const esc = x => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const rows = shots.map(s => `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-bottom:1px solid #333"><div style="width:230px;font-size:15px;line-height:1.45"><b style="font-size:20px;color:#fff">${s.i + 1} ${esc(s.scene)}</b><br>${s.t0.toFixed(1)}–${s.t1.toFixed(1)} 秒<br>${esc(s.says)}</div>` +
    cells.filter(c => c.i === s.i).map(c => `<div style="position:relative"><img src="${c.src}" style="width:480px;height:270px;display:block"><span style="position:absolute;left:6px;top:4px;font-size:13px;background:#000a;padding:1px 6px">${c.k} ${c.t.toFixed(2)}</span></div>`).join('') + '</div>').join('');
  const sp = await b.newPage({viewport: {width: 1720, height: 600}});
  await sp.setContent(`<html><body style="margin:0;background:#111;color:#ccc;font-family:'Microsoft YaHei',sans-serif">${rows}</body></html>`, {waitUntil: 'load'});
  await sp.screenshot({path: path.join(out, 'sheet.png'), fullPage: true});
  await b.close(); server.close();
  if (errs.length) console.log('页面报错（先修再看图）：\n- ' + [...new Set(errs)].slice(0, 8).join('\n- '));
  if (warns.length) console.log([...new Set(warns)].join('\n'));
  console.log(`${shots.length} 镜 → ${path.join(out, 'sheet.png')}`); process.exit(0);
}
// ---------- 手法用量（moves.js 记下的） ----------
const TRANS = new Set(['pushSwap', 'pushThrough', 'blurToBase', 'frameFill']);   // 进场的转场
function lcs(a, b) { const d = Array.from({length: a.length + 1}, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] + 1 : Math.max(d[i - 1][j], d[i][j - 1]);
  return d[a.length][b.length]; }
function movesReport({log, shots}) {
  const order = [...shots.keys()].sort((a, b) => shots[a][0] - shots[b][0]), by = new Map();
  for (const e of log) { if (!by.has(e.shot)) by.set(e.shot, []); by.get(e.shot).push(e); }
  for (const es of by.values()) es.sort((a, b) => a.t - b.t);
  const uses = k => by.get(k) ?? [];
  console.log('镜   时间            用了哪些手法（why）');
  order.forEach((k, i) => console.log(`${String(i + 1).padStart(2)}  ${shots[k][0].toFixed(1).padStart(5)}–${shots[k][1].toFixed(1).padEnd(6)}  ${uses(k).length ? uses(k).map(e => `${e.move}（${e.why || '没写 why'}）`).join('；') : '手写'}`));
  const flags = [];
  for (let i = 1; i < order.length; i++) { const a = uses(order[i - 1]).map(e => e.move);
    for (const e of uses(order[i])) if (TRANS.has(e.move) && a.includes(e.move)) flags.push(`第 ${i}、${i + 1} 镜连着用 ${e.move} 进场：同一种接法连用，观众会看出套路`); }
  for (const m of new Set(log.map(e => e.move))) { let r = 0, prev = false;
    for (const k of order) { const on = uses(k).some(e => e.move === m); if (on && !prev) r++; prev = on; }
    if (r >= 3) flags.push(`${m} 用了 ${r} 段：每一处的意思都对得上吗？对不上的改成手写`); }
  const nowhy = log.filter(e => !e.why); if (nowhy.length) flags.push(`${nowhy.length} 处没写 why（${[...new Set(nowhy.map(e => e.move))].join('、')}）：说不出这一下在说什么，就别用`);
  const lib = order.filter(k => by.has(k)).length;
  console.log(`\n${order.length} 镜：${lib} 镜用了手法库，${order.length - lib} 镜全手写`);
  if (order.length >= 8 && lib === order.length) flags.push('没有一镜是手写的：检查有没有为了套手法去改画面');
  const seq = order.flatMap(k => uses(k).map(e => e.move));
  if (arg('--prev')) { const pv = JSON.parse(fsSync.readFileSync(arg('--prev'), 'utf8')).seq ?? [], m = Math.min(seq.length, pv.length), r = m ? lcs(seq, pv) / m : 0;
    console.log(`和上一条片的手法顺序重合 ${(r * 100).toFixed(0)}%`);
    if (m >= 5 && r >= .6) flags.push(`手法顺序和上一条片重合 ${(r * 100).toFixed(0)}%：镜头是不是照着上一条排的？`); }
  fsSync.writeFileSync(path.join(out, 'moves.json'), JSON.stringify({seq, log, shots}, null, 1));
  console.log(flags.length ? '\n要看一眼：\n- ' + flags.join('\n- ') : '\n没有要提醒的。');
  console.log('过了不等于用对：每一处还要对得上那句话的意思。');
}
if (has('--moves')) {
  const {b, p, errs} = await page();
  const r = await p.evaluate(async () => { const T = window.timeline, n = Math.ceil(T.duration * 30);
    for (let f = 0; f < n; f++) await window.seek(f / 30, true);
    return {log: window.MV?.LOG ?? null, shots: (window.FB?.shots ?? []).map(s => [s.t0, s.t1])}; });
  await b.close(); server.close();
  if (errs.length) console.log('页面报错（先修）：', [...new Set(errs)].slice(0, 8));
  if (!r.log) console.log('页面里没有载入 moves.js，没有可查的手法'); else movesReport(r);
  process.exit(0);
}
const fps = T.fps ?? 30, N = Math.ceil(T.duration * fps);
if (worker) {
  const [a, z] = worker.split(':').map(Number); const {b, p, errs} = await page();
  const enc = spawn(FF, ['-v', 'error', '-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0', '-c:v', 'libx264', '-preset', 'medium',
    '-crf', H >= 1080 ? '14' : '18', '-pix_fmt', 'yuv420p', '-r', String(fps), path.join(out, `seg_${H}_${a}.mp4`)], {stdio: ['pipe', 'ignore', 'inherit']});
  for (let f = a; f < z; f++) { await p.evaluate(t => window.seek(t), f / fps); const buf = await p.screenshot({type: 'jpeg', quality: H >= 1080 ? 96 : 92}); if (!enc.stdin.write(buf)) await once(enc.stdin, 'drain'); }
  enc.stdin.end(); await once(enc, 'exit'); await b.close(); if (errs.length) { console.error([...new Set(errs)].slice(0, 5)); process.exit(2); } process.exit(0);
}
if (!has('--video')) { console.log('用 --stills 或 --video'); server.close(); process.exit(1); }
const RG = arg('--range'), F0 = RG ? Math.round(Number(RG.split(':')[0]) * fps) : 0, F1 = RG ? Math.min(N, Math.round(Number(RG.split(':')[1]) * fps)) : N;
const K = Number(arg('--workers') ?? 6), size = Math.ceil((F1 - F0) / K), starts = []; const t0 = Date.now();
await Promise.all(Array.from({length: K}, (_, i) => { const a = F0 + i * size, z = Math.min(F1, a + size); if (a >= z) return null; starts.push(a);
  return new Promise((res, rej) => { const c = spawn(process.execPath, [fileURLToPath(import.meta.url), '--dir', here, '--page', PAGE, '--out', out, '--worker', `${a}:${z}`, '--port', String(port), '--h', String(H), '--check-policy', POLICY], {stdio: 'inherit'}); c.on('exit', x => x === 0 ? res() : rej(new Error('worker ' + a))); }); }));
starts.sort((a, b) => a - b);
await fs.writeFile(path.join(out, `list_${H}.txt`), starts.map(s => `file 'seg_${H}_${s}.mp4'`).join('\n'));
const vout = path.join(out, RG ? `visual_${H}_range.mp4` : `visual_${H}.mp4`);
await new Promise((res, rej) => { const c = spawn(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(out, `list_${H}.txt`), '-c', 'copy', vout], {stdio: 'inherit'}); c.on('exit', x => x === 0 ? res() : rej()); });
server.close(); console.log('rendered', F1 - F0, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's ->', vout);
// 空画面检查：一段画面几乎是纯色（标签没闭合把一镜套进上一镜一起藏了、图片 404、时刻算错都会这样）。
// 《谷歌给苹果的两百亿》1080p 结尾 3.5 秒就是这样空着交出去的：改页面后只看了两张静帧。看不了图也能靠这条提醒发现。
await new Promise(res => {
  const c = spawn(FF, ['-v', 'error', '-i', vout, '-vf', 'scale=64:36', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], {stdio: ['ignore', 'pipe', 'inherit']});
  const bufs = []; c.stdout.on('data', d => bufs.push(d));
  c.on('exit', () => {
    const all = Buffer.concat(bufs), n = 64 * 36, runs = []; let s = -1, f = 0;
    for (; (f + 1) * n <= all.length; f++) {
      let m = 0, q = 0; for (let i = f * n; i < (f + 1) * n; i++) { m += all[i]; q += all[i] * all[i]; }
      m /= n; const blank = Math.sqrt(Math.max(0, q / n - m * m)) < 3;
      if (blank && s < 0) s = f; else if (!blank && s >= 0) { runs.push([s, f]); s = -1; }
    }
    if (s >= 0) runs.push([s, f]);
    const bad = runs.filter(([a, z]) => z - a >= fps * .3).map(([a, z]) => `${((F0 + a) / fps).toFixed(2)}–${((F0 + z) / fps).toFixed(2)} 秒`);
    if (bad.length) console.log(`画面是空的（几乎纯色，什么都没有）：${bad.join('、')}。查这几秒的镜头：是不是被上一镜的容器套住一起藏了（HTML 标签没闭合）、图片路径 404、时刻算错。`);
    res();
  });
});
