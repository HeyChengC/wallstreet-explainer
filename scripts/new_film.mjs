// 一条命令建片子（模板档）：页面 + 底座 + 模板库 + 纹理 + 字体 + 估出来的时间线，建完就能 render.mjs --stills。
//   node scripts/new_film.mjs <片子目录>            新片：film.js 是带注释的镜头表起点，script.json 是三句示例
//   node scripts/new_film.mjs <片子目录> --demo     示例片：每个场景用一次（kit/demo/），看模板长什么样、照着抄写法
//   node scripts/new_film.mjs <片子目录> --demo2    示例片二：后加的 11 个场景各用一次（kit/demo2/）
//   node scripts/new_film.mjs <片子目录> --sync     老片子：只把 lib/ 和 assets/kit/ 更新到 skill 的最新版（film.js、素材不动）
//   node scripts/new_film.mjs <片子目录> --politics 时政片：多拷 lib/politics.js，film.js 用 kit/politics-demo 的起点
// 字体不拷：fonts/ 是指向字体目录的联接，联接建不了才拷。字体目录写在 scripts/local.json 的 fonts_dir（没写就用 skill 里的 fonts/）。
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';
import {stub} from './timeline_stub.mjs';

const SK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), dst = args.find(a => !a.startsWith('--')), DEMO2 = args.includes('--demo2'), DEMO = DEMO2 || args.includes('--demo'), SYNC = args.includes('--sync');
// --region taiwan|hongkong：港台本地版起点（字体、语音、繁体/粤语正文、无角标、封面脚手架）
const REGION = (() => { const i = args.indexOf('--region'); return i >= 0 ? args[i + 1] : null; })();
if (REGION && !['taiwan', 'hongkong'].includes(REGION)) { console.error(`--region 只能是 taiwan / hongkong，现在是 '${REGION}'`); process.exit(1); }
const LOCAL = !!REGION;
// --region 隐含 --politics（本地版都是时政片）。POL 在 REGION 之后算，不靠 args.push 影响已算好的值。
const POL = args.includes('--politics') || LOCAL;
if (!dst) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(0, 6).join('\n')); process.exit(1); }
const D = path.resolve(dst);
let local = {}; try { local = JSON.parse(fs.readFileSync(path.join(SK, 'scripts/local.json'), 'utf8')); } catch {}
const FONTS = path.resolve(local.fonts_dir ?? path.join(SK, 'fonts'));
const LIB = ['scripts/stage25d.js', 'scripts/film_base.js', 'scripts/moves.js', 'kit/kit.js', 'kit/scenes.js', 'kit/scenes_plus.js', 'kit/host.js', 'kit/politics.js', 'kit/regional.js', 'kit/local_native.js', 'kit/kit.css'];
const cp = (a, b) => { fs.mkdirSync(path.dirname(b), {recursive: true}); fs.copyFileSync(a, b); };

function copyLib() {
  for (const f of LIB) cp(path.join(SK, f), path.join(D, 'lib', path.basename(f)));
  for (const f of ['fabric.jpg', 'grain.png', 'worldmap.png']) cp(path.join(SK, 'kit/assets', f), path.join(D, 'assets/kit', f));
  for (const f of fs.readdirSync(path.join(SK, 'kit/assets/ph'))) cp(path.join(SK, 'kit/assets/ph', f), path.join(D, 'assets/kit/ph', f));
}
function linkFonts() {
  const to = path.join(D, 'fonts');
  if (fs.existsSync(to)) return;
  if (!fs.existsSync(FONTS)) { console.warn(`没找到字体目录 ${FONTS}：会退到系统字体（Noto Sans SC / 微软雅黑），样子不对。在 scripts/local.json 里写 fonts_dir，字体清单见 README`); return; }
  try { fs.symlinkSync(FONTS, to, 'junction'); }
  catch { fs.mkdirSync(to); for (const f of fs.readdirSync(FONTS)) if (/\.(ttf|otf|woff2?)$/i.test(f)) fs.copyFileSync(path.join(FONTS, f), path.join(to, f)); }
}

if (SYNC) {
  if (!fs.existsSync(path.join(D, 'index.html'))) { console.error(`${D} 不是片子目录（没有 index.html）`); process.exit(1); }
  copyLib(); linkFonts();
  console.log(`已更新 ${D}\\lib 和 assets\\kit 到 skill 的最新版。先 --stills 看几帧，确认老镜头没有变样。`);
  // --sync 不动 index.html（那是用户的片子入口，可能被改过），所以新加的 lib 不会自动生效
  const html = fs.readFileSync(path.join(D, 'index.html'), 'utf8');
  if (!html.includes('politics.js')) {
    console.log(`注意：${D}\\index.html 没有引用 lib/politics.js。要用时政场景（stance-matrix / event-timeline / verdict）和来源角标，`
      + `在 <script src="lib/host.js"></script> 后面手动加一行：<script src="lib/politics.js"></script>`);
  }
  process.exit(0);
}
if (fs.existsSync(D) && fs.readdirSync(D).length) { console.error(`目标已存在且不是空的：${D}`); process.exit(1); }
fs.mkdirSync(D, {recursive: true});
// 起点目录：--region 直接用两地自己的 starter（真繁体/粤语正文 + K.regional + no-badges）
const src = LOCAL ? path.join(SK, 'starter-politics', REGION)
  : path.join(SK, DEMO2 ? 'kit/demo2' : DEMO ? 'kit/demo' : POL ? 'starter-politics' : 'starter');
cp(path.join(SK, 'starter/index.html'), path.join(D, 'index.html'));
// 字幕样式：两地各一份（900 字重 + 黑描边 + paint-order），不是上游的 60px 500
if (LOCAL) {
  cp(path.join(SK, 'starter-politics', `film.${REGION}.css`), path.join(D, 'film.css'));
} else {
  cp(path.join(SK, 'starter/film.css'), path.join(D, 'film.css'));
}
cp(path.join(src, 'film.js'), path.join(D, 'film.js'));
cp(path.join(src, 'script.json'), path.join(D, 'script.json'));
// 时政起点多两样：事实底稿和它引用的本地材料（随 starter-politics 一起拷）
if (POL) {
  cp(path.join(src, 'editorial.json'), path.join(D, 'editorial.json'));
  const docs = path.join(src, 'assets', 'docs');
  if (fs.existsSync(docs)) for (const f of fs.readdirSync(docs)) cp(path.join(docs, f), path.join(D, 'assets', 'docs', f));
}
// --region：语音已经在 starter 的 script.json 里写死成该地区，这里只做校验，不改写
if (LOCAL) {
  const S = JSON.parse(fs.readFileSync(path.join(D, 'script.json'), 'utf8'));
  const want = REGION === 'hongkong' ? /^zh-HK-/ : /^zh-TW-/;
  if (!want.test(S.voice ?? '')) {
    console.error(`起点脚本的 voice 是 ${S.voice}，不符合 ${REGION}（要 ${REGION === 'hongkong' ? 'zh-HK-*' : 'zh-TW-*'}）`);
    process.exit(1);
  }
  console.log(`  语音：${S.voice}（${REGION}）；台词是本地正文（${REGION === 'hongkong' ? '书面粤语' : '台湾国语'}），改 text 后重跑 temp_voice.py`);
}
copyLib(); linkFonts();
for (const d of ['assets/img', 'assets/clips', 'assets/cut', 'voice', 'out']) fs.mkdirSync(path.join(D, d), {recursive: true});
if (POL) fs.mkdirSync(path.join(D, 'assets', 'docs'), {recursive: true});
fs.writeFileSync(path.join(D, 'assets/clips/counts.json'), '{}');
const tl = stub(JSON.parse(fs.readFileSync(path.join(D, 'script.json'), 'utf8')));
fs.writeFileSync(path.join(D, 'timeline.json'), JSON.stringify(tl, null, 1));
const R = path.join(SK, 'scripts/render.mjs'), TS = path.join(SK, 'scripts/timeline_stub.mjs');
console.log(`建好了：${D}（估出来的时间线 ${tl.duration} 秒，还没有配音）`);
if (POL) console.log('  时政起点：film.js 已带 K.politics 角标和 verdict/event-timeline 示例；先看 editorial.json（虚构样例）');
console.log('下一步：');
const steps = DEMO ? [] : [
  `写 script.json（文案，一句一个 id，写法见 kit/README.md「文案 script.json」）`,
  `node "${TS}" "${path.join(D, 'script.json')}"    重算时间线（每改一次 script.json 就重跑一次）`,
  `写 film.js（每镜先想 says，再从 kit/README.md 的表里选场景）`];
steps.push(`node "${R}" --dir "${D}" --check            查镜头表（几秒钟，不渲染），改到零错误`,
  `node "${R}" --dir "${D}" --sheet            每镜三帧拼一张图（out/sheet.png），自己先看一遍`,
  `node "${R}" --dir "${D}" --video --h 720    渲 720p 预览（没声音）`);
steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
if (DEMO) console.log('  示例片的写法在 film.js，每个场景的参数见 kit/README.md');
console.log(`注意：fonts\\ 是指向字体目录的联接。删这个片子目录前先拆联接（只删联接，不删字体）：node -e "require('fs').rmdirSync(process.argv[1])" "${path.join(D, 'fonts')}"，再删目录。`);
