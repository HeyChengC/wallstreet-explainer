// 没有配音时先估一个时间线：script.json → timeline.json（和 temp_voice.py 同一个格式），画面先挂在估出来的字上。
// 配好音以后跑 temp_voice.py 覆盖它就行：镜头表里写的是 '@句id:词'，不写秒数，所以不用改。
//   node scripts/timeline_stub.mjs <片子目录>/script.json
// 估法：中文每字约 0.235 秒（edge-tts 云希原速，"二〇一九"的〇也算汉字），数字 0.17，英文字母 0.075，逗号停 0.2，句号停 0.28；句间按 gap。
import fs from 'node:fs'; import path from 'node:path'; import {fileURLToPath} from 'node:url';

const per = ch => /[㐀-鿿〇]/.test(ch) ? .235 : /[0-9]/.test(ch) ? .17 : /[A-Za-z]/.test(ch) ? .075
  : /[，、：；,:;]/.test(ch) ? .2 : /[。！？!?…]/.test(ch) ? .28 : /\s/.test(ch) ? .06 : .1;

export function stub(S) {
  let t = .15 + (S.pre ?? 0); const beats = [], inserts = []; let title = null;
  for (const ln of S.lines ?? []) {
    if (!ln.id || !ln.text) throw Error(`script.json 的每一句都要有 id 和 text：${JSON.stringify(ln)}`);
    const chars = []; let x = 0;
    for (const ch of ln.text) { chars.push([ch, +(t + x).toFixed(4)]); x += per(ch); }
    beats.push({id: ln.id, text: ln.text, start: +t.toFixed(4), end: +(t + x).toFixed(4), wav: null, chars});
    t += x + (ln.gap ?? .35);
    if (ln.bite) {
      const bt = ln.bite; t += (bt.pre ?? .15) - (ln.gap ?? .35); const t0 = t, parts = [];
      for (const [src, a, l, sub, g] of bt.parts) { parts.push({src, in: a, dur: l, gain_db: g, start: +t.toFixed(4), end: +(t + l).toFixed(4), sub}); t += l; }
      inserts.push({id: `bite_${ln.id}`, after: ln.id, start: +t0.toFixed(4), end: +t.toFixed(4), parts}); t += bt.post ?? .4;
    }
    if (S.title?.after === ln.id) { title = {start: +t.toFixed(4), end: +(t + S.title.len).toFixed(4)}; t += S.title.len; }
  }
  return {fps: 30, duration: +(t + .95).toFixed(4), pre: S.pre ?? 0, title, beats, inserts, stub: true};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sp = process.argv[2];
  if (!sp) { console.log('用法：node scripts/timeline_stub.mjs <片子目录>/script.json'); process.exit(1); }
  const S = JSON.parse(fs.readFileSync(sp, 'utf8')), tl = stub(S), out = path.join(path.dirname(path.resolve(sp)), 'timeline.json');
  if (fs.existsSync(out) && !JSON.parse(fs.readFileSync(out, 'utf8')).stub && !process.argv.includes('--force')) {
    console.log(`${out} 是配音出的正式时间线，不覆盖（要覆盖加 --force）`); process.exit(1);
  }
  fs.writeFileSync(out, JSON.stringify(tl, null, 1));
  for (const b of tl.beats) console.log(`${b.id.padEnd(6)} ${b.start.toFixed(2).padStart(6)}–${b.end.toFixed(2).padEnd(6)} ${b.text.slice(0, 30)}`);
  console.log(`估出来的时间线（没有配音）：总长 ${tl.duration} 秒 → ${out}`);
}
