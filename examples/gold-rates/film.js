// 打仗了，黄金为什么反而跌（28 秒，真人口播）。t = 口播的 t。
// 主线：一个反常（打仗了金价却跌）→ 那条金价线 → 一个词（利率）→ 为什么（链条、不生息）→ 还有一个推手（美股）→ 回到开头那句话。
// v4（2026-11-05，用户："参考小lin说的节奏就行 不用改特效 而是节奏不对"）：特效全按 v2，只重排她换样子的时机。
//   五段：她讲 0–4.9 / 证据 4.9–17.2（圆窗一直不动，底下换五刀）/ 她讲 17.2–20.6 / 证据 20.6–24.2 / 她讲 24.2–28.8。
//   她的窗口只在段落门上挪 4 次（v2 是 7 次，最短一段 1.3 秒）。导演表 ../shots_v4.md；v2 镜头表 film_v2.js，v3 film_v3.js。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS});
const K=await KIT.use(F);
await KIT_HOST.use(K,{faceY:330,fps:30,calm:false})   // 帧目录是 30fps 抽的；片子按口播原片 24fps 渲染，按时间取帧正好是原片每一帧。calm:false = v2 的缩进、长出、慢漂原样
const gold=await fetch('assets/data/gold.json').then(r=>r.json());
// 墙上的两张照片：开头那句"乱世买黄金"，结尾原样回来。挨着她的头发，头发压在照片前面
const WAR={img:'assets/img/smoke.jpg',label:'乱世',x:440,y:300,w:560,h:376};
const GOLD={img:'assets/img/goldbars.jpg',label:'黄金',x:1490,y:300,w:560,h:376};
// "利率"整屏巨字：和结尾她身后换世界同一个样子（舞台、巨字从 1.12 倍长到 1、推 2%），只是她在左下圆窗里说。字往右挪，给圆窗让位
const {f1,f3,E,col,mixc,stage}=KIT;
const RATE=(t,c)=>{
 const g=E((t-c.t0)/.3),s=1+.02*E((t-c.t0)/.5),cl=col('gold'),m=[mixc('#ffffff',cl,.12),mixc('#ffffff',cl,.42)];
 const hx=1010,gap=24,top=190,size=560,sc=S25.lerp(1.12,1,g);
 const words=S25.mega('利',{x:hx-gap,y:top,size,anchor:'r',m,s:sc,o:g})+S25.mega('率',{x:hx+gap,y:top,size,anchor:'l',m,s:sc,o:g});
 const bw=`<div class="s25brow" style="left:${f1(hx-gap-KIT.megaW('利',size)+16)}px;top:${f1(top+size*.62)}px;opacity:${f3(g)}"><b>问题出在</b><i>INTEREST RATES</i></div>`;
 return `<div class="k-full" style="transform:scale(${f3(s)});transform-origin:50% 45%">${stage({tone:'navy',glow:'#c9a25a',gx:'50%',gy:'38%',go:.3})}${words}${bw}</div><div class="k-full" style="z-index:12;background:radial-gradient(ellipse 60% 70% at 50% 45%,transparent 50%,#000a)"></div>`;
};

await K.film([
 // 一 她讲：开口，黄金、乱世两张照片挂上墙
 {scene:'host',until:'@b02',says:'她开口：黄金最近怎么样',
  items:[{...GOLD,at:'@b01:黄'}]},
 {scene:'host',until:'@b03:这-0.1',says:'大家都信的那句话：乱世买黄金',
  items:[{...GOLD,at:0},{...WAR,at:'@b02:乱'}]},
 // 二 证据：她缩进左下圆窗，一直到 17 秒不挪；底下换五刀（战火、金价线、利率、链条、原文）
 {scene:'footage',until:'@b03:黄+0.05',host:'pip',says:'这次真的在打仗',clip:'smoke',from:.5,push:[1,1.05]},
 {scene:'line',until:'@b05',host:'pip',says:'可金价从一月的最高点一路跌回了一年多前',data:gold,title:'黄金价格 · 美元/盎司',en:'GOLD · USD / OZ',
  draw:{at:'@b03:黄+0.05',until:'@b03:最'},
  marks:[{at:'@b03:反',date:'max',text:'1月 历史最高',value:'$5,318'}],
  level:{at:'@b03:最',text:'一年多来最低'},
  focus:{at:'@b04:光',from:'2026-10-01',value:'-6.9%',brow:'光 10 月'}},
 {scene:'custom',until:'@b06',host:'pip',says:'答案就一个词：利率（整屏巨字，她在圆窗里说）',render:RATE},
 {scene:'chain',until:'@b07:1',host:'pip',x0:400,gap:64,says:'打仗怎么走到利率：油价 → 通胀 → 利率',
  items:[{title:'打仗',img:'assets/img/smoke.jpg',at:'@b06:打'},
         {title:'油价',value:'$104',color:'amber',at:'@b06:油'},
         {title:'通胀',value:'3.6%',color:'brick',at:'@b06:通'},
         {title:'利率',value:'↑',color:'navy',at:'@b06:住'}]},
 {scene:'article',until:'@b08',host:'pip',says:'12 月还要加：市场押 75%',img:'assets/img/cnbc.png',hl:[641.2,412.7,303.5,18],zoom:'@b07:1',hlAt:'@b07:1+0.35'},
 // 三 她讲：长回全屏，黄金挂左边，国债利息挂右边，一比
 {scene:'host',until:'@b10:加-0.2',enter:'grow',says:'黄金不生息：利率越高，拿着越吃亏',
  items:[{...GOLD,x:440,label:'黄金：没利息',at:'@b08:黄',gray:'@b09:吃'},
         {at:'@b09:利',vlabel:'美国 10 年国债',value:'4.9%',color:'#1f6b45',x:1490,y:280,w:500,h:300}]},
 // 四 证据：缩进圆窗，美股、原文两刀，圆窗不动
 {scene:'footage',until:'@b10:着',host:'pip',says:'再加上美股大跌',clip:'nyse',push:[1,1.05]},
 {scene:'article',until:'@b11',host:'pip',says:'急用钱，先卖最好卖的黄金：原文写的就是这个',img:'assets/img/kitco.png',hl:[[1036.6,139,272.7,41],[410,178,289.5,41]],zoomS:1.9,zoom:'@b10:着+0.05',hlAt:'@b10:着+0.5'},
 // 五 她讲：回到开头那句话，两张照片原样回来；"看一眼利率"身后换世界（和第 5 镜同一个"利率"）
 {scene:'host',enter:'grow',says:'回到开头那句话：下次先看一眼利率',
  items:[{...WAR,at:'@b11:乱'},{...GOLD,at:'@b11:黄'}],
  swap:{at:'@b11:看',words:['利','率']}},
]);
return K.go();
})();
