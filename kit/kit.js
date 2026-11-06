// kit.js —— 模板档的核心：一条片 = 一张镜头表。每镜选一个场景模板（scenes.js），只填这一镜的内容；
// 镜头怎么走、东西怎么出现、前后层、运动模糊、字号颜色，都由模板管。同一个 t 永远画出同一帧。
// 载入顺序：stage25d.js → film_base.js → moves.js → kit.js → scenes.js → film.js（kit.css 放在 <head>）
// 用法（film.js）：
//   window.ready=(async()=>{
//     const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS});
//     const K=await KIT.use(F);
//     await K.film([
//       {scene:'number', until:'@b03', says:'四家加起来一年砸七千多亿', value:'$7250亿', brow:'四家 · 2026 AI 资本开支'},
//       {scene:'discs',  says:'钱流向谁', items:[...], steps:[...]},   // 最后一镜不写 until = 到片尾
//     ]);
//     return K.go();
//   })();
// 时刻一律写成字符串：'@b03'（这句开口）、'@b03:英伟达'（念到这个词）、'@b03:END'（这句说完）、'@b03:英伟达#2'（第二次出现）、
// 可以带偏移 '@b03:英伟达+0.2'；原声插段 '@bite_b10b' / '@bite_b10b:END'；片名 '@title' / '@title:END'。
// 场景清单、参数和例子：kit/README.md。规则：references/rules.md。
(()=>{
const {C,IO,lerp,camPath,L,mbF}=S25;
const E=x=>1-(1-C(x))**3, EI=x=>C(x)**3;
const f1=v=>(+v).toFixed(1),f2=v=>(+v).toFixed(2),f3=v=>(+v).toFixed(3);
const A=v=>v==null?[]:Array.isArray(v)?v:[v];
const SAFE={x0:100,x1:1820,y0:80,y1:870};   // 字幕带 y≥900 不放内容

// ---------- 颜色：名字 → 色值；公司名 → 品牌色（全片同一家同一个颜色） ----------
const COLORS={blue:'#2f6bd1',sky:'#3b8ee0',steel:'#4d6f99',navy:'#22407e',amber:'#d68a1f',orange:'#de6a2c',gold:'#c7a03c',green:'#3c9a3e',lime:'#6fae1e',
 teal:'#1d8b7b',cyan:'#1a9db3',brick:'#b5482f',red:'#c63038',wine:'#7c2230',purple:'#6a3fb3',violet:'#8a52d6',pink:'#cf4f8a',gray:'#6a707b',slate:'#475263',black:'#2a2d33'};
const BRAND={google:'blue',谷歌:'blue',microsoft:'steel',微软:'steel',amazon:'amber',亚马逊:'amber',meta:'blue',nvidia:'green',英伟达:'green',openai:'teal',
 oracle:'brick',甲骨文:'brick',apple:'gray',苹果:'gray',tesla:'red',特斯拉:'red',spacex:'slate',xai:'black',anthropic:'orange',alibaba:'orange',阿里:'orange',阿里巴巴:'orange',
 tencent:'sky',腾讯:'sky',bytedance:'cyan',字节:'cyan',字节跳动:'cyan',huawei:'red',华为:'red',tsmc:'brick',台积电:'brick',amd:'red',intel:'sky',英特尔:'sky',
 broadcom:'red',博通:'red',samsung:'navy',三星:'navy',softbank:'gold',软银:'gold',美联储:'navy',fed:'navy'};
// 舞台底色（中心、四周）。整屏底色只有这三种：navy 默认；charcoal 中性的炭灰；wine 压暗、低饱和的酒红，一条片最多一段（算总账 / 亏钱）。
// 都是同一张斜纹织物染色。公司的品牌色不当整屏底色，只在 person（人身后）染织物；写了别的 tone 按 navy 画，--check 提醒。
const TONE={navy:['#2e3a55','#0b1019'],charcoal:['#36393f','#0b0b0d'],wine:['#5a2f3c','#120a0d']};
const col=c=>{if(!c)return COLORS.steel;if(c[0]==='#'||c.startsWith('rgb'))return c;const k=String(c).toLowerCase();return COLORS[k]??COLORS[BRAND[k]??BRAND[c]]??COLORS.steel;};
const rgb=h=>{h=col(h).replace('#','');if(h.length===3)h=[...h].map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
const mixc=(a,b,k)=>{const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*k).toString(16).padStart(2,'0')).join('');};
const alpha=(c,a)=>`rgba(${rgb(c).join(',')},${a})`;
const shade=c=>{const b=col(c);return `--c:${b};--hi:${mixc(b,'#ffffff',.42)};--lo:${mixc(b,'#000000',.58)};--gl:${alpha(b,.3)}`;};

// ---------- 数字：'$7250亿' '5.2万亿' '€75,000,000,000' '30%' '-2780亿' 725e9 ----------
const UNIT={'万':1e4,'亿':1e8,'万亿':1e12,'千亿':1e11,'百亿':1e10,'十亿':1e9,K:1e3,M:1e6,B:1e9,T:1e12};
function num(v){
 if(v==null)return null;
 if(typeof v==='object'&&'n' in v)return v;
 if(typeof v==='number')return {neg:v<0,cur:'',n:Math.abs(v),unit:'',dec:(String(v).split('.')[1]||'').length,sep:Math.abs(v)>=1e5};
 const m=String(v).trim().match(/^([+\-−]?)([$€¥£₩]?)\s*([\d,]*\.?\d+)\s*(.*)$/);
 if(!m)return {text:String(v)};
 const s=m[3].replace(/,/g,'');
 return {neg:m[1]==='-'||m[1]==='−',cur:m[2],n:+s,unit:m[4].trim(),dec:(s.split('.')[1]||'').length,sep:m[3].includes(',')};
}
// 换成满位数：7250亿 → 725,000,000,000（跳动的位数本身在说"有多大"）
const full=p=>{const k=UNIT[p.unit];return k?{...p,n:p.n*k,unit:'',dec:0,sep:true}:{...p,sep:true};};
function fmtN(p,n=p.n,rolling=false){
 let x=n;if(rolling&&p.sep&&x>=1e10)x=Math.round(x/1e9)*1e9;   // 满位数滚的时候按十亿取整，后面全是 0
 return x.toLocaleString('en-US',{minimumFractionDigits:p.dec,maximumFractionDigits:p.dec,useGrouping:!!p.sep});
}
const numText=(p,n)=>p.text??`${p.neg?'-':''}${p.cur}${fmtN(p,n)}${p.unit}`;
// 大数字的 HTML：o.n 当前值（滚的时候传），o.fixed 每一位等宽（滚的时候不抖）
function numHTML(p,o={}){
 if(p.text)return `<span class="g">${p.text}</span>`;
 const s=fmtN(p,o.n??p.n,o.rolling),dg=[...s].map(ch=>ch===','?`<span class="cm">,</span>`:`<span class="g${o.fixed?' w':''}">${ch}</span>`).join('');
 return `${p.neg?'<span class="g">-</span>':''}${p.cur?`<span class="c">${p.cur}</span>`:''}${dg}${p.unit?`<span class="u">${p.unit}</span>`:''}`;
}
const unitHTML=p=>p.text??`${p.neg?'-':''}${p.cur?`<span class="c">${p.cur}</span>`:''}${fmtN(p)}${p.unit?`<span class="u">${p.unit}</span>`:''}`;

// ---------- 量字宽（字体已载入，结果确定） ----------
const vw=s=>[...String(s??'')].reduce((a,ch)=>a+(/[㐀-鿿　-〿＀-￯]/.test(ch)?1:.55),0);   // 看起来有几个字宽（中文 1，英文数字 0.55）
const cv=document.createElement('canvas').getContext('2d');
const textW=(s,font)=>{cv.font=font;return cv.measureText(String(s)).width;};
const FAM={num:"Num,'Bebas Neue',Bahnschrift,Impact",han:"Shu,'Alimama ShuHeiTi','Noto Sans SC','Microsoft YaHei'",ui:"Mi,MiSans,'Noto Sans SC','Microsoft YaHei'",en:"Mont,Montserrat,'Segoe UI'"};   // 单引号：要塞进 style="..." 里
// 巨字宽度（和 S25.mega 一样拆：数字用 Num、字号 size；汉字用数黑体、0.6 倍）和让它不超过 maxW 的字号
function megaW(txt,size){let w=0;String(txt).replace(/([0-9.,$−+]+)|([^0-9.,$−+]+)/g,(m,d,h)=>{w+=d?textW(d,`${size}px ${FAM.num}`):textW(h,`${size*.6}px ${FAM.han}`)+size*.036;return m;});return w;}
const megaFit=(txt,size,maxW)=>{const w=megaW(txt,size);return w>maxW?Math.floor(size*maxW/w):size;};
// 让一段字不超过 maxW：返回字号
const fitPx=(s,fam,size,maxW,ls=0)=>{const w=textW(s,`${size}px ${FAM[fam]??fam}`)+ls*size*String(s).length;return w>maxW?Math.floor(size*maxW/w):size;};

// ---------- 时刻 ----------
function timer(T){
 const BT=Object.fromEntries(T.beats.map(b=>[b.id,b])),INS=Object.fromEntries((T.inserts||[]).map(i=>[i.id,i]));
 return v=>{
  if(typeof v==='number')return v;
  if(typeof v!=='string'||v[0]!=='@')throw Error(`时刻要写成 '@句id' 或 '@句id:词'，现在是 ${JSON.stringify(v)}`);
  let s=v.slice(1),off=0;const om=s.match(/^(.*?)([+-]\d*\.?\d+)$/);
  if(om&&om[1]&&!om[1].endsWith(':')){off=+om[2];s=om[1];}   // '@b03:-2780' 里的 -2780 是词，不是偏移
  let nth=1;const hm=s.match(/#(\d+)$/);if(hm){nth=+hm[1];s=s.slice(0,-hm[0].length);}
  const i=s.indexOf(':'),id=i<0?s:s.slice(0,i),w=i<0?null:s.slice(i+1);
  if(id==='title'){if(!T.title)throw Error(`timeline.json 里没有片名的位置，用不了 ${v}：script.json 里加 "title":{"after":"片名前那句的 id","len":片名停几秒}，再重跑 timeline_stub.mjs`);return (w==='END'?T.title.end:T.title.start)+off;}
  if(INS[id])return (w==='END'?INS[id].end:INS[id].start)+off;
  const b=BT[id];if(!b)throw Error(`timeline.json 里没有句子 ${id}（${v}）。有的句子：${Object.keys(BT).join(' ')}${/^bite_/.test(id)?'（原声插段写在 script.json 那一句的 bite 里，再重跑 timeline_stub.mjs）':''}`);
  if(w==null||w==='')return b.start+off;if(w==='END')return b.end+off;
  let k=-1;for(let n=0;n<nth;n++){k=b.text.indexOf(w,k+1);if(k<0)break;}
  if(k<0)throw Error(`句子 ${id} 里找不到「${w}」${nth>1?`第 ${nth} 次`:''}（${v}）。timeline.json 里这句是：${b.text}。词要照这句一字不差地抄（念法：'一百三十亿' 不是 '130亿'，'〇' 不是 '零'）`);
  return b.chars[k][1]+off;
 };
}

// ---------- 状态随时间变：set(时刻, 值, 过渡秒数)，at(t) 取值（两头缓） ----------
function track(v0){const ev=[];return {set(t,v,d=.3){ev.push([t,v,d]);ev.sort((a,b)=>a[0]-b[0]);return this;},
 at(t){let v=v0;for(const [te,ve,de] of ev){if(t<te)break;v=de>0?v+(ve-v)*IO((t-te)/de):ve;}return v;},ev};}
// 东西出现：淡入 0.25 秒加十几像素上移（朴素，不弹、不回弹、不打字机）
const appear=(t,ta,d=.25,rise=14)=>{const k=C((t-ta)/d);return {o:k,dy:(1-E(k))*rise,k};};

// ---------- 机位：框住这几样东西（世界坐标的框 [x0,y0,x1,y1]），避开字幕带 ----------
function fit(box,o={}){
 const pad=o.pad??70,w=Math.max(1,box[2]-box[0]+2*pad),h=Math.max(1,box[3]-box[1]+2*pad);
 const aw=SAFE.x1-SAFE.x0,ah=SAFE.y1-SAFE.y0,cyS=o.cy??(SAFE.y0+SAFE.y1)/2;
 const s=Math.max(o.min??.42,Math.min(o.max??2.2,Math.min(aw/w,ah/h)*(o.fill??1)));
 return {x:(box[0]+box[2])/2,y:(box[1]+box[3])/2+(540-cyS)/s,s};
}
const unionBox=bs=>bs.reduce((a,b)=>[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[2],b[2]),Math.max(a[3],b[3])],[1e9,1e9,-1e9,-1e9]);
// 一次换位多长：距离越远、缩放差越大越长，0.55–1.1 秒（参考片 0.5–1 秒）
const moveDur=(a,b)=>Math.max(.55,Math.min(1.1,.5+Math.hypot(a.x-b.x,a.y-b.y)*Math.min(a.s,b.s)/2600+Math.abs(Math.log(b.s/a.s))*.7));
// 关键机位序列 → 每一刻的机位。keys=[{t,cam,d?}]：第一项是起点，后面每一项是一次换位（d 秒，两头缓）。
// 上一次还没走完、下一次就开始时，新的一次从"正在走的那条路"上平滑接过去（位置和速度都连续），不跳、不顿。
// 停下来以后慢慢往里推（drift 每秒，参考片约 3%/秒）。缩放按对数插值，推拉速度均匀。
// 远距离换位（地图上跨大洲、世界舞台的两头）：中途先拉远再推近，像地图软件里"飞过去"，屏幕上走的路不超过一屏多，不会糊成一片。
function camSeq(keys,drift=.02){
 const ks=keys.map((k,i)=>{if(!i)return {...k,d:0,arc:0};
  const a=keys[i-1].cam,b=k.cam,dd=Math.hypot(a.x-b.x,a.y-b.y),arc=k.arc??Math.max(0,(Math.log(a.s)+Math.log(b.s))/2-Math.log(Math.max(.3,1250/Math.max(1,dd))));
  return {...k,arc:arc>.05?arc:0,d:Math.max(.05,k.d??(arc>.05?Math.min(1.6,Math.max(moveDur(a,b),.9+arc*.4)):moveDur(a,b)))};});
 const hold=(k,t0)=>t=>({...k.cam,s:k.cam.s*(1+drift*Math.max(0,t-t0))});
 const at=(i,t)=>{
  const k=ks[i];
  if(i===0)return hold(k,k.t)(t);
  const u=(t-k.t)/k.d;
  if(u>=1)return hold(k,k.t+k.d)(t);
  const a=at(i-1,t),e=k.arc?.5-.5*Math.cos(Math.PI*C(u)):IO(u);
  return {x:lerp(a.x,k.cam.x,e),y:lerp(a.y,k.cam.y,e),s:Math.exp(lerp(Math.log(a.s),Math.log(k.cam.s),e)-k.arc*Math.sin(Math.PI*e))};
 };
 return t=>{let i=ks.length-1;while(i>0&&t<ks[i].t)i--;return at(i,t);};
}

// ---------- 画面零件（都返回 HTML，位置是世界坐标；st 是状态 {o,dy,sc,br,sat,blur}） ----------
function fx(st={},base='translate(-50%,-50%)'){
 const f=[];if(st.br!=null&&Math.abs(st.br-1)>.005)f.push(`brightness(${f3(st.br)})`);if(st.sat!=null&&Math.abs(st.sat-1)>.005)f.push(`saturate(${f3(st.sat)})`);
 if((st.blur??0)>.3)f.push(`blur(${f1(st.blur)}px)`);
 const tr=`${base}${st.dy?` translateY(${f1(st.dy)}px)`:''}${st.dx?` translateX(${f1(st.dx)}px)`:''}${st.sc!=null&&Math.abs(st.sc-1)>.0005?` scale(${f3(st.sc)})`:''}`;
 return `transform:${tr};${f.length?`filter:${f.join(' ')};`:''}${st.o!=null&&st.o<.999?`opacity:${f3(C(st.o))};`:''}`;
}
// 舞台底：斜纹织物染成这一段的底色，中间略亮、四周压暗。
// o.tone 底色（navy / charcoal / wine，别的按 navy）；o.tint 品牌色染织物（person 用）；o.glow 颜色光（默认没有，给了公司名/颜色名才画）；o.gx/o.gy 光的中心
function stage(o={}){
 let a,b;
 if(o.tint){const c=col(o.tint);a=mixc(c,'#04060b',.46);b=mixc(c,'#020306',.9);}
 else [a,b]=TONE[o.tone]??TONE.navy;
 const g=o.glow?col(o.glow):null;
 return `<div class="k-stage" style="--a:${a};--b:${b};--gx:${o.gx??'50%'};--gy:${o.gy??'48%'}${g?`;--g:${alpha(mixc(g,'#ffffff',.3),o.go??.34)}`:''}"><div class="tex"></div>${g?'<div class="glow"></div>':''}${o.rings?'<div class="rings"></div>':''}</div>`;
}
// 照片圆盘：{x,y,r,color,name,en,photo,pos(照片的 object-position),logo(白色单色 logo 图),gray}
// 品牌色实心盘；有 photo 时照片铺满盘、底部压一层品牌色，名字压在盘的下半。lt（文字 logo）不再画，只在没有 name 时当名字用。
// 盘太小（r<72）、名字又放不下时，名字写在盘下面
function disc(o,st={}){
 const r=o.r??120,c=col(o.gray?'#6b707a':o.color),nm=o.name??o.lt??'',small=r<72,inside=!small||vw(nm)<=2.4;
 const s2=o.gray?{...st,sat:0,br:(st.br??1)*.62}:st;
 let h='';
 if(o.photo)h+=`<div class="ph"><img src="${o.photo}"${o.pos?` style="object-position:${o.pos}"`:''}></div>`;
 else if(o.logo)h+=`<img class="lg" src="${o.logo}"${nm?'':' style="top:50%"'}>`;
 if(nm&&inside){
  const ny=o.photo?.75:o.logo?.7:(o.en&&!small?.46:.5);
  const fs=o.photo?fitPx(nm,'han',r*.27,r*1.36,.06):small?fitPx(nm,'han',r*.6,r*1.5,.04):fitPx(nm,'han',r*.34,r*1.5,.06);
  h+=`<div class="nm" style="top:${f1(2*r*ny)}px;font-size:${f1(fs)}px">${nm}</div>`;
  if(o.en&&!o.photo&&!o.logo&&!small)h+=`<div class="en" style="top:${f1(2*r*(ny+.15))}px">${o.en}</div>`;
 }else if(nm)h+=`<div class="out">${nm}${o.en?`<i>${o.en}</i>`:''}</div>`;
 return `<div class="k-disc" style="left:${f1(o.x)}px;top:${f1(o.y)}px;--r:${f1(r)}px;--rim:${f1(Math.max(1.5,r*.022))}px;--c:${c};--hi:${mixc(c,'#ffffff',.12)};--lo:${mixc(c,'#000000',.28)};--sh:${alpha(c,.6)};${fx(s2)}">${h}</div>`;
}
// 卡片（平的品牌色块）：{x,y,w,h,color,title,en,img(底图),flag(小旗图片),value('$500亿')}
function card(o,st){
 const w=o.w??300,h=o.h??150,ts=fitPx(o.title??'','han',o.size??Math.min(52,h*.3),w*.82,.14),v=o.value?num(o.value):null,b=mixc(col(o.gray?'#555a63':o.color),'#2b303a',.18);
 return `<div class="k-card${o.gray?' gray':''}" style="left:${f1(o.x)}px;top:${f1(o.y)}px;width:${w}px;height:${h}px;--c:${mixc(b,'#000000',.14)};--hi:${mixc(b,'#ffffff',.06)};${fx(st)}">${o.img?`<div class="bi" style="background-image:url(${o.img})"></div>`:''}${o.title?`<div class="tt" style="font-size:${ts}px">${o.title}</div>`:''}${o.en?`<div class="en">${o.en}</div>`:''}${o.flag?`<img class="fl" src="${o.flag}">`:''}${v?`<div class="vl" style="font-size:${Math.round(h*.34)}px">${unitHTML(v)}</div>`:''}</div>`;
}
// 价签（盘下面）：{x,y(顶),label,value,size}
const tag=(o,st)=>{const v=num(o.value);return `<div class="k-tag" style="left:${f1(o.x)}px;top:${f1(o.y)}px;font-size:${o.size??46}px;${fx(st,'translate(-50%,0)')}">${o.label?`<small>${o.label}</small>`:''}${unitHTML(v)}</div>`;};
// 小牌（流程图里的金额）：{x,y,value,size,kind:'green'|'red'|'gold'|'dark'}
const pill=(o,st)=>`<div class="k-pill ${o.kind??''}" style="left:${f1(o.x)}px;top:${f1(o.y)}px;font-size:${o.size??40}px;${fx(st)}">${unitHTML(num(o.value))}</div>`;
const MARK={ok:'<svg viewBox="0 0 24 24"><path d="M5 12.5l4.3 4.3L19 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
 no:'<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>'};
const mark=(o,st)=>`<div class="k-mark ${o.kind==='no'?'no':'ok'}" style="left:${f1(o.x)}px;top:${f1(o.y)}px;width:${o.s??56}px;height:${o.s??56}px;${fx(st)}">${MARK[o.kind==='no'?'no':'ok']}</div>`;
const label=(o,st)=>`<div class="k-label" style="left:${f1(o.x)}px;top:${f1(o.y)}px;font-size:${o.size??40}px;${fx(st)}">${o.text}${o.en?`<i>${o.en}</i>`:''}</div>`;
// 大数字：{x,y(中线),value,n(当前值),size,anchor:'c'|'l'|'r',color:'gold'|'red'|'white',maxW}
function bignum(o,st){
 const p=typeof o.value==='object'&&o.value&&'n' in o.value?o.value:num(o.value),size=o.maxW?fitPx(numText(p),'num',o.size??260,o.maxW*.92):o.size??260;
 const ax=o.anchor==='l'?'0':o.anchor==='r'?'-100%':'-50%';
 return `<div class="k-num ${o.color&&o.color!=='gold'?o.color:''}" style="left:${f1(o.x)}px;top:${f1(o.y)}px;font-size:${size}px;transform-origin:${o.anchor==='l'?'0':o.anchor==='r'?'100%':'50%'} 50%;${fx(st,`translate(${ax},-50%)`)}">${numHTML(p,{n:o.n,fixed:o.rolling,rolling:o.rolling})}</div>`;
}
// 眉题：{x,y,zh,en,anchor}
const brow=(o,st)=>{const ax=o.anchor==='l'?'0':o.anchor==='r'?'-100%':'-50%';
 return `<div class="k-brow" style="left:${f1(o.x)}px;top:${f1(o.y)}px;text-align:${{l:'left',r:'right'}[o.anchor]??'center'};${fx(st,`translate(${ax},0)`)}"><b${o.size?` style="font-size:${o.size}px"`:''}>${o.zh}</b>${o.en?`<i>${o.en}</i>`:''}</div>`;};
// 白边画框：{x,y(中心),w,h,src,label}
const frame=(o,st)=>`<div class="k-frame" style="left:${f1(o.x-o.w/2)}px;top:${f1(o.y-o.h/2)}px;width:${f1(o.w)}px;height:${f1(o.h)}px;${o.bw!=null?`border-width:${f1(o.bw)}px;`:''}${o.r!=null?`border-radius:${f1(o.r)}px;`:''}${fx(st,'translate(0,0)')}">${o.html??`<img src="${o.src}"${o.pos?` style="object-position:${o.pos}"`:''}>`}</div>`+
 (o.label?label({x:o.x,y:o.y-o.h/2-46,text:o.label,size:o.lsize??38},{o:st?.o}):'');

// 连线（一组，世界坐标）：e={a:[x,y],b:[x,y],curve,color,style:'dots'|'dash'|'solid',w,k(画出来的进度),flow(流动偏移),arrow,o,pulse(0..1 亮点位置)}
let UID=0;
const qpt=(e,u)=>{const [ax,ay]=e.a,[bx,by]=e.b,[cx,cy]=ctrl(e);return [(1-u)**2*ax+2*(1-u)*u*cx+u*u*bx,(1-u)**2*ay+2*(1-u)*u*cy+u*u*by];};
function ctrl(e){const [ax,ay]=e.a,[bx,by]=e.b,mx=(ax+bx)/2,my=(ay+by)/2,dx=bx-ax,dy=by-ay,c=e.curve??0;return [mx-dy*c,my+dx*c];}
const ECOL={blue:'#8ab6f2',green:'#6bd28f',red:'#f07f8c',gold:'#ecd08a',white:'#f2f2f2',purple:'#b48cf0',teal:'#6fd6c6'};
function edges(es){
 let defs='',body='';
 for(const e of es){
  if((e.k??1)<=0||(e.o??1)<=0)continue;
  const [cx,cy]=ctrl(e),d=`M${f1(e.a[0])} ${f1(e.a[1])} Q${f1(cx)} ${f1(cy)} ${f1(e.b[0])} ${f1(e.b[1])}`,c=ECOL[e.color]??col(e.color??'#d8dde6'),w=e.w??7,id='km'+(++UID);
  const dash=e.style==='solid'?'':e.style==='dash'?`stroke-dasharray:${f1(w*2.6)} ${f1(w*1.7)};`:`stroke-dasharray:0.01 ${f1(w*2.3)};`;
  const k=e.k??1,mk=k<1?` mask="url(#${id})"`:'';
  if(k<1)defs+=`<mask id="${id}" maskUnits="userSpaceOnUse" x="-6000" y="-6000" width="16000" height="16000"><path d="${d}" pathLength="1" stroke="#fff" stroke-width="${w*4}" fill="none" stroke-dasharray="${f3(k)} 2"/></mask>`;
  body+=`<path d="${d}"${mk} fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" style="${dash}stroke-dashoffset:${f1(-(e.flow??0))};opacity:${f3(e.o??1)};filter:drop-shadow(0 0 ${f1(w*.6)}px ${alpha(c,.32)})"/>`;
  if(e.arrow!==false&&k>.85){const [px,py]=qpt(e,.985),[qx,qy]=e.b,a=Math.atan2(qy-py,qx-px)*180/Math.PI,s=w*2.3;
   body+=`<path d="M${f1(-s*1.1)} ${f1(-s)} L${f1(s*.5)} 0 L${f1(-s*1.1)} ${f1(s)} Z" fill="${c}" transform="translate(${f1(qx)} ${f1(qy)}) rotate(${f1(a)})" style="opacity:${f3((e.o??1)*C((k-.85)/.15))}"/>`;}
  if(e.pulse!=null&&e.pulse>0&&e.pulse<1){const [px,py]=qpt(e,e.pulse);body+=`<circle cx="${f1(px)}" cy="${f1(py)}" r="${f1(w*1.9)}" fill="#fff" style="filter:drop-shadow(0 0 ${f1(w*2.5)}px ${c}) drop-shadow(0 0 ${f1(w*5)}px ${c})"/>`;}
  if(e.text&&k>.6){const [px,py]=qpt(e,e.tpos??.5);body+=`<foreignObject x="${f1(px-260)}" y="${f1(py-40)}" width="520" height="80" style="overflow:visible;opacity:${f3(C((k-.6)/.3)*(e.o??1))}"><div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;justify-content:center;align-items:center;height:80px"><span style="font:${e.ts??40}px ${FAM.han};color:#f4efdc;letter-spacing:.08em;background:rgba(10,12,16,.72);padding:6px 18px 4px;border-radius:8px;box-shadow:0 0 0 1.5px ${alpha(c,.7)};white-space:nowrap">${e.text}</span></div></foreignObject>`;}
 }
 return `<svg class="k-full" width="1920" height="1080" style="overflow:visible">${defs?`<defs>${defs}</defs>`:''}${body}</svg>`;
}

// 人像抠图（一张透明 PNG）：自动找头和肩（量图片的透明通道），按 headX/headY 放；h = 人在画面里多高（像素）
const MEAS={};
async function measure(src){
 if(MEAS[src])return MEAS[src];
 const im=await loadImg(src),w=im.naturalWidth,h=im.naturalHeight,k=Math.min(1,400/Math.max(w,h)),cw=Math.max(1,Math.round(w*k)),ch=Math.max(1,Math.round(h*k));
 const c=document.createElement('canvas');c.width=cw;c.height=ch;const g=c.getContext('2d');g.drawImage(im,0,0,cw,ch);
 const a=g.getImageData(0,0,cw,ch).data;let x0=cw,x1=-1,y0=ch,y1=-1;
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(a[(y*cw+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 if(x1<0){MEAS[src]={w,h,box:[0,0,w,h],head:[w/2,h*.2],top:0};return MEAS[src];}
 // 头：外框上面两成里不透明像素的水平中心
 let sx=0,n=0;const yh=y0+(y1-y0)*.2;for(let y=y0;y<=yh;y++)for(let x=x0;x<=x1;x++)if(a[(y*cw+x)*4+3]>40){sx+=x;n++;}
 MEAS[src]={w,h,box:[x0/k,y0/k,(x1+1)/k,(y1+1)/k],head:[(n?sx/n:(x0+x1)/2)/k,(y0+(y1-y0)*.12)/k],top:y0/k};
 return MEAS[src];
}
// person({src,x,y?,h,...}) x = 头的中心落在哪，top = 头顶落在哪（默认 150），h = 人像整张图在画面里的高度
function person(o,st){
 const m=MEAS[o.src];if(!m)throw Error(`人像 ${o.src} 没有量过（K.film 会自动量；手写镜头先 await KIT.measure(src)）`);
 const sc=(o.h??1250)/m.h,left=o.x-m.head[0]*sc,top=(o.top??150)-m.top*sc;
 return `<img src="${o.src}" style="position:absolute;left:${f1(left)}px;top:${f1(top)}px;width:${f1(m.w*sc)}px;height:${f1(m.h*sc)}px;filter:contrast(1.04) saturate(.96)${o.rim?` drop-shadow(0 0 ${o.rimR??50}px ${o.rim})`:''};${fx(st,'translate(0,0)')}">`;
}
const halo=(x,y,r,c,o=.2)=>`<div class="k-halo" style="left:${f1(x-r)}px;top:${f1(y-r)}px;width:${f1(2*r)}px;height:${f1(2*r)}px;background:radial-gradient(circle,${col(c)} 0%,${alpha(col(c),0)} 70%);opacity:${f3(o)}"></div>`;

// 前景浮尘（K.dust）已经去掉：不是原版的东西，前后层用实拍和抠像来做。函数留着（老片子调用不报错），返回空，用了就提醒一次
const hashf=(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);};
let dustWarned=false;
function dust(){if(!dustWarned){dustWarned=true;const m='K.dust（前景浮尘）已经去掉了，现在什么都不画：前后层用实拍和抠像来做';console.warn('[kit] '+m);window.KIT_REPORT?.warns?.push(m);}return '';}
// 地图：worldmap.png（等距圆柱，每度 10 像素）铺在世界里，经纬度 0,0 落在 (960,540)
const MAP={img:'assets/kit/worldmap.png',x:960-1800,y:540-840,w:3600,h:1420};
const lonlat=(lon,lat)=>[960+lon*10,540-lat*10];
// 截图上的框（hl）按多宽的坐标算：snap_news.mjs 截的图是 2 倍像素（3200 宽），它打印的框是网页坐标（1600 宽）；别的截图按图片像素。cssW 可以自己写
const cssScale=(im,cssW)=>im.naturalWidth/(cssW??(im.naturalWidth===3200?1600:im.naturalWidth));

// ---------- 素材 ----------
const IMG={};
function loadImg(src){
 if(!IMG[src])IMG[src]=new Promise((res,rej)=>{const im=new Image();im.onload=()=>im.decode().then(()=>res(im),()=>res(im));im.onerror=()=>rej(Error(`找不到图片 ${src}（路径相对片子目录，比如 assets/img/xx.jpg）`));im.src=src;});
 return IMG[src];
}
// 镜头表里所有图片路径（.jpg/.png/.webp）：先全部载入，缺了直接报错，不出黑屏
// 只走普通对象和数组；'_' 开头的是模板自己存的东西（比如载入好的图片元素），不走进去
function scanImgs(v,out=new Set()){if(typeof v==='string'){if(/\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(v))out.add(v);}else if(Array.isArray(v))v.forEach(x=>scanImgs(x,out));else if(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype)for(const k in v)if(k[0]!=='_')scanImgs(v[k],out);return out;}

// ---------- 场景登记（scenes.js 用） ----------
const SCENES={};
// def = {says,use,avoid 说明; need 必填参数; help 参数说明; defaults; check(p,c); prep(p,c) 异步准备（量图片）; make(p,c) → t=>HTML}
const scene=(name,def)=>{SCENES[name]=def;return def;};

// ---------- 开场的接法：enter ----------
// 'cut' 直接切（默认）· 'push' / 'push-right' 横推换人 · 'through' 推过镜头 · 'blur' 上一镜虚化当底 · 'flat' 上一镜倒成桌面当底
// 'whip' / 'whip-left' 新画面甩进来盖住上一镜 · 'fade' 0.3 秒叠化（少用）
const ENTERS=['cut','push','push-right','through','blur','flat','whip','whip-left','fade'];
function wrapEnter(f,c){
 const e=c.enter,prev=c.prev,t0=c.t0,why=c.p.says??'';
 if(!prev||e==='cut'||e==='flat')return f;
 if(e==='push'||e==='push-right')return t=>MV.pushSwap(t,{t0,d:.42,dir:e==='push'?-1:1,from:prev,to:tt=>f(tt),why});
 if(e==='through')return t=>MV.pushThrough(t,{t0,d:.3,from:prev,to:f,s:c.p.throughScale??1.6,at:c.p.throughAt,why});
 if(e==='blur')return t=>MV.blurToBase(t,{t0,d:.45,from:prev,to:f,why});
 if(e==='fade')return t=>{const k=C((t-t0)/.3);return k>=1?f(t):`<div class="k-full">${MV.still(prev,t0-.01)}</div><div class="k-full" style="opacity:${f3(k)}">${f(t)}</div>`;};
 if(e==='whip'||e==='whip-left')return t=>{if(t>=t0+.34)return f(t);const w=MV.whipIn(t,{t0,d:.32,dir:e==='whip'?1:-1,html:f(t),why});return `<div class="k-full">${MV.still(prev,t0-.01)}</div>${w.html}`;};
 throw Error(`enter 只能是：${ENTERS.join(' / ')}，现在是 ${e}`);
}

// ---------- 绑定一条片 ----------
// o.policy：检查策略。'upstream'（默认）= 财经片那套硬配额；'politics' = 时政片：不沿用镜头占比、滚数、酒红底这类财经审美配额，
// 换成"事实有来源、证据够读懂"的实质检查（见 references/politics-rules.md）。render.mjs --check-policy 传到这儿。
const POLICIES=['upstream','politics'];
async function use(F,o={}){
 // o.policy 优先；没写就读页面 URL 的 ?policy=（render.mjs --check-policy 会带上）。这样 film.js 一个字都不用改。
 const policy=o.policy??(typeof location!=='undefined'&&new URLSearchParams(location.search).get('policy'))??'upstream';
 if(!POLICIES.includes(policy))throw Error(`检查策略只能是 ${POLICIES.join(' / ')}，现在是 '${policy}'`);
 const T=timer(F.T);
 F.stage.style.setProperty('--s25-grain','url(assets/kit/grain.png)');
 await Promise.all(['assets/kit/fabric.jpg','assets/kit/grain.png'].map(s=>loadImg(s).catch(()=>{throw Error(`缺模板库纹理 ${s}：用 scripts/new_film.mjs 建片子，或从 kit/assets 拷到 assets/kit/`);})));
 const K={F,T,warns:[],shots:[],policy};
 // 时政扩展（politics.js 先加载好才有这个钩子）：绑时间线，并把扩展挂到这条片的 K 上（film.js 里写 K.politics.badges）
 if(window.KIT.politics){window.KIT.politics._bind?.(T);K.politics=window.KIT.politics;}
 // 区域主题（regional.js）：港台字体栈、语音参数、字幕用词。
 // regional.js 挂的是可调用函数，已经带 current / voice / words / hanFont，直接取来用。
 if(window.KIT.regional)K.regional=window.KIT.regional;
 const warn=m=>{K.warns.push(m);console.warn('[kit] '+m);};
 // 镜头表里的 '@...' 先全部解析一遍：哪一镜哪一处写错了，一次报出来
 function checkTimes(v,path,errs){
  if(typeof v==='string'&&v[0]==='@'){try{T(v);}catch(e){errs.push(`${path}：${e.message}`);}}
  else if(Array.isArray(v))v.forEach((x,i)=>checkTimes(x,`${path}[${i}]`,errs));
  else if(v&&typeof v==='object')for(const k in v)checkTimes(v[k],`${path}.${k}`,errs);
 }
 // ---------- 参数名查一遍：写错的参数（lable、untill）模板不认识，会被静默丢掉，看不了图的模型根本发现不了 ----------
 // 每个场景只认自己的参数：help、defaults、need 里写了的，加上模板代码里读到的 p.xxx（board 家族的代码在 def.code 里）。
 // 嵌套在 items / nodes / steps 里的字段名，对照模板代码里出现过的所有名字。note 随便写备注，'_' 开头的不查，custom 不查。
 const FREE=['scene','until','says','enter','tone','glow','dust','throughAt','throughScale','note','host','pipIn','claimIds','sourceIds'];   // host：'pip' / 'window'，真人口播层（host.js）；claimIds / sourceIds：时政片关联 editorial.json
 let VOCAB;
 async function vocab(){
  if(VOCAB!==undefined)return VOCAB;
  const urls=[...document.scripts].map(s=>s.src).filter(s=>/\/(stage25d|film_base|moves|kit|scenes|scenes_plus|host|politics|regional)\.js(\?.*)?$/.test(s));
  try{const set=new Set();for(const u of urls){const t=await (await fetch(u)).text();for(const m of t.matchAll(/[A-Za-z_$][\w$]*/g))set.add(m[0]);}VOCAB=urls.length>=2&&set.size>500?set:null;}
  catch{VOCAB=null;}   // 双击直接打开（file://）读不到源码：这一项不查
  return VOCAB;
 }
 const knownOf=def=>def._known??=new Set([...FREE,...Object.keys(def.help??{}),...Object.keys(def.defaults??{}),...(def.need??[]),
  ...[def.make,def.prep,def.check,def.beats,def.flat,...A(def.code)].filter(f=>typeof f==='function').flatMap(f=>[...String(f).matchAll(/\bp\.([A-Za-z_$][\w$]*)/g)].map(m=>m[1]))]);
 const osa=(a,b)=>{const d=[];for(let i=0;i<=a.length;i++){d[i]=[i];for(let j=1;j<=b.length;j++)d[i][j]=i?Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1),i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1]?d[i-2][j-2]+1:1e9):j;}return d[a.length][b.length];};
 const guess=(k,cands)=>{let best=null,bd=1e9;for(const c of cands){if(c===k||c.length<2)continue;const d=osa(k.toLowerCase(),c.toLowerCase())+(c[0]===k[0]?0:.5);if(d<bd){bd=d;best=c;}}return bd<=(k.length<=4?1:2)?best:null;};
 async function checkKeys(list){
  const V=await vocab(),errs=[],warns=[];if(!V)return {errs,warns};
  const fields=[...V].filter(x=>/^[a-z][A-Za-z]*$/.test(x));
  // mark:{c1:'ok'} 这种按节点 id 当键的：键是 id（或者 'a>b' 这种连线名），不是字段名，不查
  const idsOf=(v,s=new Set())=>{if(Array.isArray(v))v.forEach(x=>idsOf(x,s));else if(v&&typeof v==='object'){if(typeof v.id==='string')s.add(v.id);for(const k in v)idsOf(v[k],s);}return s;};
  let ids=new Set();
  const walk=(v,path)=>{
   if(Array.isArray(v))v.forEach((x,i)=>walk(x,`${path}[${i}]`));
   else if(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype)for(const k in v){if(k[0]==='_')continue;
    if(!V.has(k)&&!ids.has(k)&&/^[A-Za-z_$][\w$]*$/.test(k)){const g=guess(k,fields);errs.push(`${path}.${k}：模板里没有 ${k} 这个字段，写了会被丢掉${g?`，是不是 ${g}？`:''}`);}
    walk(v[k],`${path}.${k}`);}
  };
  list.forEach((sp,i)=>{
   const def=SCENES[sp?.scene];if(!def||sp.scene==='custom')return;
   ids=idsOf(sp);
   const known=knownOf(def),tag=`第 ${i+1} 镜（${sp.scene}）`,can=()=>[...known].filter(x=>!FREE.includes(x)&&def.help?.[x]!=null).join('、');
   for(const k in sp){if(k[0]==='_')continue;
    if(!known.has(k)){const g=guess(k,known);
     if(!V.has(k)||g)errs.push(`${tag}：不认识参数 ${k}${g?`，是不是 ${g}？`:''}（${sp.scene} 能写的：${can()}；通用的：until、says、enter、tone、note）`);
     else warns.push(`${tag}：${sp.scene} 不读参数 ${k}，写了也不会画出来（${sp.scene} 能写的：${can()}）`);}
    else walk(sp[k],`${tag}.${k}`);}
  });
  return {errs,warns};
 }
 K.film=async list=>{
  if(!Array.isArray(list)||!list.length)throw Error('K.film([...]) 要一张镜头表（数组，每一镜一个对象）');
  const errs=[];list.forEach((sp,i)=>checkTimes(sp,`第 ${i+1} 镜`,errs));
  const ck=await checkKeys(list);
  if(ck.errs.length)errs.push(...ck.errs);
  if(errs.length)throw Error(`镜头表有 ${errs.length} 处写错了：\n`+errs.join('\n'));
  ck.warns.forEach(warn);
  await Promise.all([...scanImgs(list)].map(loadImg));
  let t0=0;const out=[];
  for(let i=0;i<list.length;i++){
   const sp=list[i],tag=`第 ${i+1} 镜（${sp.scene??'?'}${sp.says?`：${sp.says}`:''}）`,def=SCENES[sp.scene];
   if(!def)throw Error(`${tag}：没有这个场景。能用的：${Object.keys(SCENES).join('、')}`);
   const last=i===list.length-1;
   if(sp.until==null&&!last)throw Error(`${tag}：要写 until（这一镜到哪一刻结束，比如 '@b05'——下一句开口）`);
   const t1=sp.until==null?F.T.duration:T(sp.until);
   if(t1<=t0+.3)throw Error(`${tag}：until ${sp.until} = ${t1.toFixed(2)} 秒，比这一镜开始的 ${t0.toFixed(2)} 秒早，或者短于 0.3 秒`);
   const p={...(def.defaults??{}),...sp};
   for(const k of def.need??[])if(p[k]==null)throw Error(`${tag}：缺参数 ${k}${def.help?.[k]?`（${def.help[k]}）`:''}`);
   const enter=sp.enter??'cut';if(!ENTERS.includes(enter))throw Error(`${tag}：enter 只能是 ${ENTERS.join(' / ')}`);
   const c={i,t0,t1,d:t1-t0,T,K,p,enter,prev:out[i-1]?.f??null,tag,warn:m=>warn(`${tag}：${m}`)};
   c.at=v=>v==null?null:T(v);
   // 画风的硬规矩：写了也照默认画，只提醒
   if(sp.tone!=null&&!TONE[sp.tone])c.warn(`tone:'${sp.tone}' 不再当整屏底色，按 navy 画（底色只有 navy / charcoal / wine；公司颜色写在 color 里）`);
   if(p.glow&&!def.glow)c.warn(`开了 glow（颜色光）：原版只有人物镜头（person）身后有一团品牌色，别的场景开了像零几年的 PPT；确定要就留着`);
   if(sp.dust)c.warn('dust（前景浮尘）已经去掉了，写了也不画：前后层用实拍和抠像来做');
   const enN=[...A(sp.nodes),...A(sp.items),...A(sp.cards),sp.left,sp.right].filter(n=>n&&typeof n==='object'&&n.en).length;
   if(enN)c.warn(`${enN} 个圆盘 / 节点 / 卡片 / 表头写了 en（英文小字）：英文小字只跟着眉题和片名，别处删掉`);
   if(sp.brow&&A(sp.nodes).some(n=>n.type==='num'&&n.brow))c.warn('整张图的 brow 和 num 节点的 brow 同时写了：一帧最多一组眉题');
   if(enter==='flat'&&c.prev&&!(typeof def.flat==='function'?def.flat(p):def.flat))c.warn(`enter:'flat'（上一镜倒成桌面）只给"站在桌面上"的场景用（${Object.keys(SCENES).filter(k=>SCENES[k].flat).join('、')}；title、statement 不带 items 时）；${sp.scene} 铺满画面，会和倒下去的上一镜叠在一起，改用 cut 或 blur`);
   // 背景：enter:'flat' 时是上一镜倒下去的桌面，否则是这一镜自己的舞台
   c.bg=(t,cam,camp,o={})=>enter==='flat'&&c.prev?MV.layFlat(t,{t0:c.t0,d:.7,html:MV.still(c.prev,c.t0-.01),why:sp.says}):L(cam,camp,o.z??.25,o.html??stage(o),{zi:0});   // 底层 z-index:0，写在后面的东西自然盖在上面
   if(def.prep)await def.prep(p,c);
   def.check?.(p,c);
   const f=wrapEnter(def.make(p,c),c);
   F.shot(t0,t1,f);
   out.push({i,scene:sp.scene,t0,t1,says:sp.says??'',enter,f,p});
   t0=t1;
  }
  lint(out);
  K.shots=out;
  // fiction：检查虚构标记是不是真的每一段都在（不是只看 film.js 有没有声明）。
  // 逐镜取开头/中间/末尾三点调 badgeAt，任何一点缺标记就算失败——这是 render --check 能验的那一半。
  // display:'no-badges'（私人研究预览）时角标整体关闭，这里如实报告"已关闭"，不算通过也不算失败。
  let fiction=null;
  if(K.politics){
   const on=K.politics._fictionState?.()??{on:false,text:null};
   const disp=K.politics._display?.()??'full';
   if(on.on&&disp==='no-badges'){
    fiction={on:true,text:on.text,display:disp,suppressed:true,missing:[]};
   }else if(on.on){
    const missing=[];
    for(const s of out){
     for(const tt of [s.t0+.05,(s.t0+s.t1)/2,Math.max(s.t0+.05,s.t1-.12)]){
      const h=K.politics.badgeAt(tt)||'';
      if(!/pol-fic/.test(h)){missing.push(`第 ${s.i+1} 镜 ${tt.toFixed(1)} 秒`);break;}
     }
    }
    fiction={on:true,text:on.text,display:disp,missing};
    if(missing.length)warn(`虚构标记「${on.text}」有 ${missing.length} 处不在画面上（${missing.slice(0,3).join('、')}）：全片每一段都要常驻，不是只在开头`);
   }else fiction={on:false,display:disp};
  }
  // 报告里带每镜的 cue 明细：preflight 靠它判断"这个 cue 是不是落在声明它的那一镜里"，
  // 而不是"落在任意镜头里"。cues 里只记结构信息（哪个 key、原串、解析到第几秒），不上屏。
  const cuesOf=sp=>{
   const out=[];
   const walk=(v,key)=>{
    if(typeof v==='string'&&v[0]==='@'){
     let t=null,err=null;
     try{t=+T(v).toFixed(3);}catch(e){err=e.message;}
     out.push({key,raw:v,t,err});
    }else if(Array.isArray(v))v.forEach((x,i)=>walk(x,`${key}[${i}]`));
    else if(v&&typeof v==='object')for(const k in v)walk(v[k],key?`${key}.${k}`:k);
   };
   walk(sp,'');
   return out;
  };
  window.KIT_REPORT={shots:out.map(s=>({i:s.i,scene:s.scene,t0:+s.t0.toFixed(2),t1:+s.t1.toFixed(2),says:s.says,enter:s.enter,
    cues:(s.p&&cuesOf(s.p))??[]})),
   warns:K.warns,policy,fiction};
  return out;
 };
 // 整片的提醒（不是禁令：每一条答得上"为什么这里就该这样"就留着）
 // 两套策略共用"实质错误"那一半（空镜头、没写 says、占位图、时长）；财经审美配额（真素材占比、滚数、酒红底、同一家公司同色）
 // 只在 upstream 下查，politics 换成"这一镜的事实有没有落在 editorial 里"的检查（由 check_editorial.py 做，这里只看画面侧）。
 function lint(out){
  const dur=F.T.duration,up=policy!=='politics';
  out.forEach((s,i)=>{
   const tag=`第 ${i+1} 镜（${s.scene}）`,d=s.t1-s.t0,def=SCENES[s.scene];
   if(!s.says)warn(`${tag}没写 says：这一镜让观众多懂了什么？说不出来就重想这一镜`);
   if(def.minDur&&d<def.minDur)warn(`${tag}只有 ${d.toFixed(1)} 秒，${s.scene} 至少要 ${def.minDur} 秒观众才看得清`);
   if(d>6.5&&!up&&!s.p.claimIds&&!s.p.sourceIds)warn(`${tag}有 ${d.toFixed(1)} 秒没有落点：时政片里长镜头可以留（主持论证、读证据），但要么挂 claimIds / sourceIds 说明这一镜在讲哪条事实，要么加一两个 step`);
   else if(d>6.5&&up){const beats=def.beats?def.beats(s.p):0;
    if(beats<1)warn(`${tag}有 ${d.toFixed(1)} 秒，中间没有新的落点（steps）：观众会走神，拆成两镜，或者加一两个 step`);}
   if(i>=2&&out[i-1].scene===s.scene&&out[i-2].scene===s.scene)warn(`第 ${i-1}–${i+1} 镜连着三个 ${s.scene}：同一种画面连着出现，观众会腻；能合成一个场景的多个 steps 就合`);
   if(i>=1&&s.enter!=='cut'&&s.enter===out[i-1].enter)warn(`第 ${i}、${i+1} 镜连着用 enter:'${s.enter}'：同一种接法连用，观众会看出套路`);
   if(s.enter.startsWith('push')&&s.scene!=='person')warn(`${tag}用了 push（横推）：横推是"换一个并列的主角来说"（人换人最典型，两镜都是 person 最稳；公司换公司、并列的两件事也算）。这一镜是换主角吗？是就留着，不是就改 cut 或 blur`);
   const ph=[...scanImgs(s.p)].filter(x=>x.includes('assets/kit/ph/'));if(ph.length)warn(`${tag}还在用 ${ph.length} 个占位素材（assets/kit/ph/）：成片之前换成真素材（时政片同样不许留占位图）`);
  });
  if(up){
   const rolls=out.filter(s=>s.p.roll||s.p.total||(s.p.steps??[]).some(x=>x.roll)).length;
   if(rolls>2)warn(`全片有 ${rolls} 处滚数（number.roll、chart.total、board 的 roll）：只在"累加"本身就是意思的时候滚，一条片一两次`);
   const wine=out.filter((s,i)=>s.p.tone==='wine'&&!(i&&out[i-1].p.tone==='wine')).length;
   if(wine>1)warn(`全片有 ${wine} 段酒红底（tone:'wine'）：酒红一条片最多一段，留给"算总账 / 亏钱"那一段，其余用 navy`);
  }else{
   // 时政片：票数 / 席位滚数仍然要有理由——它演的是"一边还在增加"，不是煽情
   const rolls=out.filter(s=>s.p.roll||s.p.total||(s.p.steps??[]).some(x=>x.roll)).length;
   if(rolls>2)warn(`全片有 ${rolls} 处滚数：时政片里滚数只在"票在增加、席次在累加"时用；各路民调的数字不滚（它不是累加）`);
  }
  // 开口要快
  const b0=F.T.beats?.[0];
  if(b0&&b0.start>.5)warn(`第一句 ${b0.start.toFixed(2)} 秒才开口：0.5 秒内就要开口（script.json 的 pre 不超过 0.35）`);
  else if((F.T.pre??0)>.35)warn(`script.json 的 pre 是 ${F.T.pre}：开头留白不超过 0.35 秒`);
  // 真素材要够：原版一半左右的画面是实拍、新闻原文、当事人。只用了占位图（assets/kit/ph/）的镜头不算
  if(up){
   const onlyPh=s=>{const im=[...scanImgs(s.p)];return im.length>0&&im.every(x=>x.includes('assets/kit/ph/'));};
   const real=s=>!onlyPh(s)&&(['footage','montage','frames','popup','person','desk','device'].includes(s.scene)||(s.scene==='article'&&s.p.img)||(['title','statement'].includes(s.scene)&&A(s.p.items).length)||(s.scene==='profile'&&(s.p.img||s.p.photo))||(s.scene==='quote'&&s.p.who?.photo));
   const nr=out.filter(real).length;
   if(out.length>=5&&nr<out.length*.4)warn(`真素材的镜头只有 ${nr}/${out.length}（footage、person、desk、article 截图、montage、frames……；只用了占位图的不算）：少于四成就会"全是图形"，原版一半左右是实拍、原文和当事人`);
  }else{
   // 时政片不数占比（主持长论证、读原文都可能占很久），但证据要有人签：全片至少一镜挂了 sourceIds
   const withSrc=out.filter(s=>A(s.p.sourceIds).length).length;
   if(out.length>=5&&!withSrc)warn(`全片没有一镜写 sourceIds：时政片每一处事实都要能追到 editorial.json 的来源，至少在证据镜上挂 sourceIds`);
  }
  // 同一家公司全片同一个颜色
  if(up){
   const seen={},note=(name,color,i)=>{if(!name||!color)return;const k=String(name).trim(),cc=col(color);((seen[k]??={})[cc]??=[]).push(i+1);};
   out.forEach((s,i)=>{const p=s.p;for(const n of [...A(p.nodes),...A(p.items),...A(p.cards)])if(n&&typeof n==='object')note(n.name??n.title,n.color,i);
    note(p.left?.title,p.left?.color,i);note(p.right?.title,p.right?.color,i);note(p.who?.name,p.who?.color,i);if(s.scene==='profile')note(p.name,p.color,i);});
   for(const k in seen){const cs=Object.keys(seen[k]);if(cs.length>1)warn(`「${k}」在不同镜头里用了 ${cs.length} 种颜色（${cs.map(cc=>`${cc}：第 ${[...new Set(seen[k][cc])].join('、')} 镜`).join('；')}）：同一家公司全片同一个颜色，color 直接写公司名最稳`);}
  }
  const nst=out.filter(s=>s.scene==='statement').length;if(nst>3)warn(`全片 ${nst} 句金句（statement）：一条片两三次，多了就不金了`);
  const nch=out.filter(s=>s.scene==='title'&&s.p.kind==='chapter').length;if(nch>3)warn(`全片 ${nch} 张章节卡：一条片最多三张`);
  const kinds=new Set(out.map(s=>s.scene));
  // 时政片：场景种类是提示不是配额（主持论证和读证据本来就长），只提醒不逼着凑
  if(up){if(dur>40&&kinds.size<4)warn(`全片只用了 ${kinds.size} 种场景（${[...kinds].join('、')}）：画面太单一`);}
  else if(dur>40&&kinds.size<3)warn(`全片只用了 ${kinds.size} 种场景（${[...kinds].join('、')}）：时政片可以比财经片少换花样，但连着都是同一种画面还是会腻`);
  if(out[0]&&out[0].t1>8)warn(`第一镜到 ${out[0].t1.toFixed(1)} 秒才换：开头要快，第一句话说完就进主体`);
 }
 // 整帧外面再包一层：暗角 + 每帧换位置的颗粒 + 时政片的来源/性质角标
 // 角标挂在 frame 层（不在 cam 里），所以镜头推拉摇移它不动；位置在安全区内、字幕带以上；字幕不受影响
 K.go=g=>F.go({...(g??{}),frame:h=>{const f=Math.round((FB.cur.t??0)*30),mark=window.KIT?.politics?.badgeAt?.(FB.cur.t??0)??'';
  return h+`<div class="k-vig" style="z-index:85"></div><div class="k-grain" style="z-index:86;background-position:${(f*137)%360}px ${(f*71)%360}px"></div>`+mark;}});
 return K;
}

window.KIT={use,scene,SCENES,FONTS:['500 60px Mi','600 60px Mi','60px Shu','60px Num','600 30px Mont','italic 600 30px Mont'],POLICIES,
 C,IO,E,EI,lerp,f1,f2,f3,SAFE,COLORS,BRAND,TONE,col,rgb,mixc,alpha,shade,num,full,fmtN,numText,numHTML,unitHTML,textW,fitPx,megaW,megaFit,vw,FAM,timer,track,appear,
 fit,unionBox,moveDur,camSeq,fx,stage,disc,card,tag,pill,mark,label,bignum,brow,frame,edges,qpt,person,halo,measure,loadImg,MEAS,ENTERS,hashf,dust,MAP,lonlat,cssScale};
})();
