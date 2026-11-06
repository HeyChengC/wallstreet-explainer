// film_base.js —— 每条片都一样的底座（不是镜头）：读时间线、按字取时刻、实拍取帧、镜头登记、按时刻找镜头、字幕、预加载。
// 载入顺序：stage25d.js → film_base.js → moves.js → film.js。画面一律在 film.js 里按这条片自己现写。
// 用法（film.js）：
//   window.ready=(async()=>{
//     const F=await FB.init({counts:['assets/clips/counts.json'],cuts:['jensen'],preload:['stage_navy.jpg'],fonts:['60px Shu','60px Num']});
//     const {cue,B,fr,clipSrc,shot}=F;
//     shot(0,B('b02'),t=>`...这一镜的画面...`);
//     ...
//     return F.go({frame:h=>`<div style="position:absolute;inset:0">${h}</div>`});   // frame 可选：给整帧统一包一层（调色、颗粒）
//   })();
// 时刻一律写成 cue(句id,'词')，不写死秒数；同一个 t 永远画出同一帧。
(()=>{
const C=x=>Math.max(0,Math.min(1,x));
const lat=s=>s.replace(/([A-Za-z0-9][A-Za-z0-9 .,$%-]*[A-Za-z0-9]|[A-Za-z0-9])/g,'<span class="lat">$1</span>');

async function init(o={}){
 const A=o.assets??'assets/';
 const T=await fetch(o.timeline??'timeline.json').then(r=>r.json());
 const stage=document.querySelector(o.stage??'#stage');
 const fit=()=>stage.style.transform=`scale(${Math.min(innerWidth/1920,innerHeight/1080)})`;addEventListener('resize',fit);fit();

 // 时间线：B(句) 开口、BE(句) 说完、cue(句,'词') 那个字的时刻；INS 原声插段
 const BT=Object.fromEntries(T.beats.map(b=>[b.id,b]));
 const need=id=>{if(!BT[id])throw Error(`timeline.json 里没有句子 ${id}`);return BT[id];};
 const B=id=>need(id).start,BE=id=>need(id).end;
 const cue=(id,s)=>{const b=need(id),i=b.text.indexOf(s);if(i<0)throw Error(`${id} 里找不到「${s}」`);return b.chars[i][1];};
 const INS=Object.fromEntries((T.inserts||[]).map(i=>[i.id,i]));

 // 实拍帧序列（footage.py extract 写的 counts.json）；没登记的片段直接报错，不出黑屏
 const CL={};
 for(const p of o.counts??[])Object.assign(CL,await fetch(p).then(r=>{if(!r.ok)throw Error('读不到 '+p);return r.json();}));
 const fr=(n,f)=>{if(!CL[n])throw Error(`实拍 ${n} 没有登记帧数（counts.json）`);return `${A}clips/${n}/${String(Math.max(1,Math.min(CL[n],Math.round(f)))).padStart(4,'0')}.jpg`;};
 const clipSrc=(n,t,t0,rate=1)=>fr(n,Math.floor(Math.max(0,t-t0)*30*rate)+1);

 // 抠像（matte.py + matte_clean.py 写的 box.json），之后用 S25.cutP
 if(o.cuts?.length)await S25.loadCuts(o.cuts,A+'cut/');
 await Promise.all((o.preload??[]).map(n=>new Promise(r=>{const im=new Image();im.onload=im.onerror=r;im.src=A+n;})));
 await Promise.all((o.fonts??[]).map(f=>document.fonts.load(f)));

 // 字幕：一句超过 maxLen 个字就拆短语，卡着字的时刻替换；原声插段用它自己的中文字幕
 // 拆法：先按逗号/问号/冒号切；**没有标点的长句也按字数硬切**（本地版本字幕短，一行放不下 18 字）。
 // subMax 可由 film.js 传（港台版 8–15），subLines=1 表示单行。
 const maxLen=o.subMax??20;
 const SUBS=T.beats.map(b=>({start:b.start,end:b.end+.15,text:b.text,id:b.id}));
 for(const i of T.inserts||[])for(const p of i.parts)SUBS.push({start:p.start,end:p.end,text:p.sub,id:null});
 SUBS.sort((a,b)=>a.start-b.start);for(let i=0;i<SUBS.length-1;i++)SUBS[i].end=Math.min(SUBS[i].end,SUBS[i+1].start);
 function chunksOf(text,max){
  if(text.length<=max)return [{text,at:0}];
  // 1) 先按标点切
  const segs=[];let buf='';
  for(const ch of text){
   buf+=ch;
   if(/[，、：；？！,;:?!]/.test(ch)){segs.push(buf);buf='';}
  }
  if(buf)segs.push(buf);
  // 2) 每段再按 max 硬切（无标点长句也要拆；优先在空格处断，不切断英文单词）
  const out=[];
  for(const s of segs){
   if(s.length<=max){out.push(s);continue;}
   let rest=s;
   while(rest.length>max){
    let cut=max;
    const win=rest.slice(Math.max(1,max-4),Math.min(rest.length,max+4));
    const sp=win.lastIndexOf(' ');
    if(sp>=0)cut=Math.max(1,max-4)+sp+1;
    out.push(rest.slice(0,cut));rest=rest.slice(cut);
   }
   if(rest)out.push(rest);
  }
  // 3) 记每块在这句里的起始字序号（用来挂时刻）
  let acc=0;
  return out.map(t=>{const r={text:t,at:acc};acc+=t.length;return r;});
 }
 const CH={};
 function subText(s,t){
  if(s.text.length<=maxLen||!s.id)return s.text.replace(/[。]$/,'');
  const chunks=CH[s.id]??(CH[s.id]=chunksOf(s.text,maxLen));
  const bb=BT[s.id];let idx=0;
  for(let i=0;i<chunks.length;i++){if(t>=bb.chars[Math.min(chunks[i].at,bb.chars.length-1)][1]-.05)idx=i;}
  return chunks[idx].text.replace(/[，。：、；？！,;:?!]$/,'');
 }
 const subAt=t=>{const s=SUBS.find(x=>t>=x.start&&t<x.end);return s?{text:s.text,html:`<div class="sub">${lat(subText(s,t))}</div>`}:null};

 // 镜头登记：shot(起, 止, t=>这一帧的 HTML)
 const shots=[];const shot=(t0,t1,f)=>{shots.push({t0,t1,f});return f;};

 function go(g={}){
  // 镜头之间不能有空档或重叠（空档那一段会落到最后一镜上，画面跳）
  const ss=[...shots].sort((a,b)=>a.t0-b.t0),eps=1e-3;
  if(!ss.length)console.error('film.js 一个镜头都没有登记');
  else{if(ss[0].t0>eps)console.error(`0–${ss[0].t0.toFixed(2)} 秒没有镜头`);
   for(let i=0;i<ss.length-1;i++){const a=ss[i],b=ss[i+1];
    if(b.t0>a.t1+eps)console.error(`镜头之间有空档：${a.t1.toFixed(2)}–${b.t0.toFixed(2)}`);
    if(b.t0<a.t1-eps)console.error(`镜头重叠：${b.t0.toFixed(2)} 开始的镜头和上一镜（到 ${a.t1.toFixed(2)}）叠在一起`);}
   if(ss.at(-1).t1<T.duration-eps)console.error(`最后一镜在 ${ss.at(-1).t1.toFixed(2)} 结束，片长 ${T.duration}`);}
  const frame=g.frame??(h=>h),defs=g.defs??S25.DEFS;
  window.timeline=T;window.duration=T.duration;
  // dry=true：只算一遍这一帧（render.mjs --moves 用），不写进页面、不等图片
  window.seek=async(t,dry=false)=>{
   t=Math.max(0,Math.min(T.duration-1/300,t));
   const i=shots.findIndex(x=>t>=x.t0&&t<x.t1),k=i<0?shots.length-1:i,s=shots[k];
   FB.cur={shot:k,t};
   let h=s.f(t);const sub=subAt(t);if(sub)h+=sub.html;
   if(dry)return {time:t,shot:k};
   stage.innerHTML=defs+frame(h);
   await Promise.all([...document.images].map(im=>im.decode().catch(()=>{})));await document.fonts.ready;
   return {time:t,shot:k,sub:sub?.text??''};
  };
  return window.seek(0);
 }

 const F={T,A,stage,C,B,BE,cue,INS,CL,fr,clipSrc,shot,shots,go,subAt};
 Object.assign(FB,{T,A,fr,clipSrc,CL,shots});
 return F;
}
window.FB={init,cur:{shot:0,t:0}};
})();
