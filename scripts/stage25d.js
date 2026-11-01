// stage25d.js —— 2.5D 舞台的小工具（不是镜头模板）：分层相机、运动模糊、景深、抠像跟人、巨字、眉题、实拍退成底。
// 用法：index.html 里先 <script src="stage25d.js"></script> 再载 film.js；film.js 里 const {camPath,L,cams,DEFS,...}=S25;
// 每帧把 S25.DEFS 放进舞台 HTML 最前面（运动模糊要用里面的 SVG 滤镜）。同一个 t 永远算出同一帧。原理见 references/motion.md。
(()=>{
const C=x=>Math.max(0,Math.min(1,x)),IO=x=>{x=C(x);return x<.5?4*x*x*x:1-(-2*x+2)**3/2},lerp=(a,b,k)=>a+(b-a)*k;

// 机位 {x,y,s}：焦平面（z=1）上画面中心对着的点（1920×1080 坐标）、放大倍数。
// 一镜的机位 = 起点 + 若干次移动 [{t,d,to:{x?,y?,s?},e?}]（每次 d 秒，默认两头缓）；两次移动之间按 drift（每秒）慢推，不会定死。
function camPath(t,base,moves=[],drift=.02){
 let from={x:960,y:540,s:1,...base},ts=base.t??0;
 for(const m of moves){
  if(t<m.t)break;
  const dr={...from,s:from.s*(1+drift*Math.max(0,m.t-ts))},to={...dr,...m.to},k=(m.e??IO)((t-m.t)/m.d);
  if(k<1)return {x:lerp(dr.x,to.x,k),y:lerp(dr.y,to.y,k),s:lerp(dr.s,to.s,k)};
  from=to;ts=m.t+m.d;
 }
 return {...from,s:from.s*(1+drift*Math.max(0,t-ts))};
}
const cams=(fn,t)=>[fn(t),fn(t-1/30)];   // 当前机位和上一帧机位（算运动模糊）
// 关键帧机位：keys=[[时刻,{x,y,z…}],…]，两点之间两头缓；最后一个点之后按 after（每秒，如 {z:25}）继续慢推。
// 用在"同一个世界里换机位"：落点就是正在说的那个东西，时刻写成 cue()。
function camKeys(t,keys,after={}){
 if(t<=keys[0][0])return {...keys[0][1]};
 for(let i=0;i<keys.length-1;i++){const [ta,pa]=keys[i],[tb,pb]=keys[i+1];
  if(t<tb){const k=IO((t-ta)/(tb-ta)),o={};for(const n in pa)o[n]=lerp(pa[n],pb[n]??pa[n],k);return o;}}
 const [tl,pl]=keys[keys.length-1],o={...pl};for(const n in after)o[n]=(o[n]??0)+(t-tl)*after[n];return o;
}
// 3D 桌面：东西摆在一张透视平面上（content 里用 absolute 定位，原点在桌面中心），机位 cam={rx,rz,x,y,z}。
// o.plane 桌面本身的 HTML（底纹），o.persp(1500)，o.origin 透视中心('50% 28%')
const desk3d=(cam,content,o={})=>`<div style="position:absolute;inset:0;perspective:${o.persp??1500}px;perspective-origin:${o.origin??'50% 28%'}"><div style="position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d;transform:rotateX(${cam.rx}deg) rotateZ(${cam.rz??0}deg) translate3d(${cam.x??0}px,${cam.y??0}px,${cam.z??0}px)">${o.plane??''}${content}</div></div>`;

// 方向运动模糊：按这一层这一帧在屏幕上挪了多少像素挑一档
const MBK=[3,6,10,16,24,36];
const DEFS=`<svg width="0" height="0" style="position:absolute">${MBK.map(k=>`<filter id="mh${k}" x="-30%" y="-5%" width="160%" height="110%"><feGaussianBlur stdDeviation="${k} 0"/></filter><filter id="mv${k}" x="-5%" y="-30%" width="110%" height="160%"><feGaussianBlur stdDeviation="0 ${k}"/></filter>`).join('')}</svg>`;
const mbF=(vx,vy,mx=99)=>{const a=Math.abs(vx),b=Math.abs(vy),m=Math.min(mx,Math.max(a,b)*.5);if(m<2)return '';const k=MBK.reduce((p,q)=>Math.abs(q-m)<Math.abs(p-m)?q:p);return `url(#${a>=b?'mh':'mv'}${k}) `;};

// 一层：c 当前机位，cp 上一帧机位（null = 不算模糊），z 深度（<1 远、动得少；>1 近、动得多）
// o.blur 景深虚化 px，o.br 亮度，o.o 透明度，o.mb=false 不加运动模糊，o.mbMax 方向模糊最多几 px（点阵地图这类细碎的画面糊多了会拉成横纹），o.zi 叠放顺序
function L(c,cp,z,html,o={}){
 const s=1+(c.s-1)*z,ox=(c.x-960)*z,oy=(c.y-540)*z;let f='',blur=o.blur??0;
 if(cp&&o.mb!==false){const sp=1+(cp.s-1)*z;f=mbF(((cp.x-960)*z-ox)*s,((cp.y-540)*z-oy)*s,o.mbMax);const ds=Math.abs(s-sp)*900;if(ds>2)blur+=Math.min(o.zbMax??4,(ds-2)*.3);}   // 推拉很快时整体略虚（最多 4px，多了糊成一片）
 if(blur>.3)f+=`blur(${blur.toFixed(1)}px) `;
 if(o.br!=null&&Math.abs(o.br-1)>.005)f+=`brightness(${o.br.toFixed(3)}) `;
 return `<div style="position:absolute;inset:0;transform:scale(${s.toFixed(4)}) translate(${(-ox).toFixed(1)}px,${(-oy).toFixed(1)}px);${f?`filter:${f};`:''}${o.o!=null?`opacity:${C(o.o).toFixed(3)};`:''}z-index:${o.zi??Math.round(10+z*10)}">${html}</div>`;
}
// 景深：p 离焦点 f 越远越虚（世界坐标），最多 max px
const dof=(p,f,k=240,max=5)=>Math.min(max,Math.hypot(p[0]-f[0],p[1]-f[1])/k);

// 抠像：S25.loadCuts(['jensen'],'assets/cut/') 先读 box.json（matte.py + matte_clean.py 写的）
const BOX={};
async function loadCuts(names,base){for(const n of names)BOX[n]={...(await fetch(`${base}${n}/box.json`).then(r=>r.json())),base};}
// 源帧（1920×1080）里的 (ax,ay) 落到舞台 (x,y)，放大 sc。track=1：按这一帧头肩的中心对齐（人在原片里走动，画面里钉住不动）；
// track 在 0..1 之间：从 ax 慢慢挪到跟住人（实拍原位 → 构图位置）。rim/rimR：身后同色光晕
function cutP(n,f,o){const b=BOX[n];f=Math.max(1,Math.min(b.frames,Math.round(f)));const sc=o.sc??1;
 const tk=o.track===true?1:(o.track||0),ax=tk&&b.cx?lerp(o.ax??b.cx[f-1],b.cx[f-1],tk):o.ax;
 const left=o.x-(ax-b.x)*sc,top=o.y-(o.ay-b.y)*sc;
 return `<img src="${b.base}${n}/${String(f).padStart(4,'0')}.png" style="position:absolute;left:${left.toFixed(1)}px;top:${top.toFixed(1)}px;width:${(b.w*sc).toFixed(1)}px;height:${(b.h*sc).toFixed(1)}px;filter:contrast(1.04) saturate(.96)${o.rim?` drop-shadow(0 0 ${o.rimR??60}px ${o.rim})`:''}">`;}
const halo=(x,y,r,c,o=1)=>`<div style="position:absolute;left:${x-r}px;top:${y-r}px;width:${2*r}px;height:${2*r}px;border-radius:50%;background:radial-gradient(circle,${c} 0%,${c}00 70%);opacity:${o};mix-blend-mode:screen"></div>`;

// 巨字：数字一种字体、汉字一种字体，渐变里压一层颗粒（印刷质感）。o: x,y(顶),size,anchor('l'|'c'|'r'),m:[中段色,底色],s,o,dy,b,mbv(方向模糊，mbF 的返回值)
// 字体名用 CSS 变量 --s25-num / --s25-han（默认 Num / Shu），颗粒图 --s25-grain
function mega(txt,o){
 const parts=txt.replace(/([0-9.,$−+]+)|([^0-9.,$−+]+)/g,(m,d,h)=>d?`<span class="s25d">${d}</span>`:`<span class="s25h">${h}</span>`);
 const ax=o.anchor==='r'?'100%':o.anchor==='c'?'50%':'0%',tx=o.anchor==='r'?'-100%':o.anchor==='c'?'-50%':'0';
 return `<div class="s25mega" style="left:${o.x}px;top:${o.y}px;font-size:${o.size}px;--m1:${o.m?.[0]??'#f4f1e6'};--m2:${o.m?.[1]??'#b9c2ad'};transform:translate(${tx},${(o.dy??0).toFixed(1)}px) scale(${(o.s??1).toFixed(4)});transform-origin:${ax} 100%;opacity:${C(o.o??1).toFixed(3)};filter:drop-shadow(0 22px 34px #000b)${(o.b??0)>.3?` blur(${o.b.toFixed(1)}px)`:''}${o.mbv?` ${o.mbv}`:''}">${parts}</div>`;}
// 眉题：一行中文 + 可选一行英文小字（一帧最多一组）
const brow=(x,y,zh,en,o={})=>`<div class="s25brow" style="left:${x}px;top:${y}px;opacity:${C(o.o??1).toFixed(3)};transform:translateX(${o.anchor==='c'?'-50%':o.anchor==='r'?'-100%':'0'});text-align:${{c:'center',r:'right'}[o.anchor]??'left'}"><b>${zh}</b>${en?`<i>${en}</i>`:''}</div>`;
// 实拍退成底（字是主角时）：压暗、去色、略虚
const demote=(src,o={})=>`<img src="${src}" style="position:absolute;left:-2%;top:-2%;width:104%;height:104%;object-fit:cover;filter:brightness(${o.br??.36}) saturate(${o.sat??.5}) blur(${o.bl??1.2}px)">`;
// 累加滚数：按十亿取整，后面全是 0
const fmtB=v=>(Math.round(v/1e9)*1e9).toLocaleString('en-US');

const css=`.s25mega{position:absolute;white-space:nowrap;line-height:.8;display:flex;align-items:flex-end}
.s25mega .s25d,.s25mega .s25h{background:var(--s25-grain,none) 0 0/420px,linear-gradient(180deg,#fff 0%,var(--m1) 55%,var(--m2) 100%);background-blend-mode:soft-light;-webkit-background-clip:text;background-clip:text;color:transparent}
.s25mega .s25d{font-family:var(--s25-num,Num)}.s25mega .s25h{font-family:var(--s25-han,Shu);font-size:.6em;margin:0 .03em .05em}
.s25brow{position:absolute;white-space:nowrap}.s25brow b{display:block;font:44px var(--s25-han,Shu);letter-spacing:10px;color:#f1ead2;text-shadow:0 3px 12px #000b}
.s25brow i{display:block;font:600 17px Montserrat,sans-serif;letter-spacing:7px;color:#ffffff8a;margin-top:10px;font-style:normal}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
window.S25={C,IO,lerp,camPath,camKeys,cams,DEFS,mbF,L,dof,desk3d,loadCuts,cutP,halo,mega,brow,demote,fmtB,BOX};
})();
