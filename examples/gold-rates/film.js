// 打仗了，黄金为什么反而跌（28 秒，真人口播）。t = 口播的 t。
// 主线：一个反常（打仗了金价却跌）→ 那条金价线 → 一个词（利率）→ 为什么（链条、不生息）→ 还有一个推手（美股）→ 回到开头那句话。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS});
const K=await KIT.use(F);
await KIT_HOST.use(K,{faceY:330});
const gold=await fetch('assets/data/gold.json').then(r=>r.json());
// 墙上的两张照片：开头那句"乱世买黄金"，结尾原样回来。挨着她的头发，头发压在照片前面
const WAR={img:'assets/img/smoke.jpg',label:'乱世',x:440,y:300,w:560,h:376};
const GOLD={img:'assets/img/goldbars.jpg',label:'黄金',x:1490,y:300,w:560,h:376};

await K.film([
 // 第一句：近景开口，说到"黄金"跳到中景，黄金挂上墙
 {scene:'host',until:'@b02',says:'她开口：黄金最近怎么样',zoom:[{at:0,s:1.16},{at:'@b01:黄',s:1}],
  items:[{...GOLD,at:'@b01:黄'}]},
 // "乱世"挂到另一边；"可这次"冲进乱世那张照片，照片推满屏变成实拍
 {scene:'host',until:'@b03:这-0.1',says:'大家都信的那句话：乱世买黄金',
  items:[{...GOLD,at:0},{...WAR,at:'@b02:乱',fill:{clip:'smoke'}}]},
 {scene:'footage',until:'@b03:黄+0.05',host:'pip',pipIn:'fade',says:'这次真的在打仗',clip:'smoke',from:.5,push:[1,1.05]},
 {scene:'line',until:'@b05',host:'pip',says:'可金价从一月的最高点一路跌回了一年多前',data:gold,title:'黄金价格 · 美元/盎司',en:'GOLD · USD / OZ',
  draw:{at:'@b03:黄+0.05',until:'@b03:最'},
  marks:[{at:'@b03:反',date:'max',text:'1月 历史最高',value:'$5,318'}],
  level:{at:'@b03:最',text:'一年多来最低'},
  focus:{at:'@b04:光',from:'2026-10-01',value:'-6.9%',brow:'光 10 月'}},
 // 一个词：她从圆窗长回全屏，身后换世界
 {scene:'host',until:'@b06',enter:'grow',says:'答案就一个词：利率',swap:{at:'@b05:问+0.1',words:['利','率'],brow:'问题出在',en:'INTEREST RATES'}},
 // 链条：她缩进竖窗，板子上一环一环亮
 {scene:'chain',until:'@b07:联-0.3',host:'window',says:'打仗怎么走到利率：油价 → 通胀 → 利率',
  items:[{title:'打仗',img:'assets/img/smoke.jpg',at:'@b06:打'},
         {title:'油价',value:'$104',color:'amber',at:'@b06:油'},
         {title:'通胀',value:'3.6%',color:'brick',at:'@b06:通'},
         {title:'利率',value:'↑',color:'navy',at:'@b06:住'}]},
 {scene:'footage',until:'@b07:1',host:'window',says:'美联储 9 月真加了息：主席本人',clip:'warsh',push:[1,1.04]},
 {scene:'article',until:'@b08',host:'pip',says:'12 月还要加：市场押 75%',img:'assets/img/cnbc.png',hl:[641.2,412.7,303.5,18],zoom:'@b07:1',hlAt:'@b07:1+0.35'},
 // 不生息：回到房间，黄金挂左边，国债利息挂右边，一比
 {scene:'host',until:'@b10:加-0.2',enter:'grow',says:'黄金不生息：利率越高，拿着越吃亏',
  items:[{...GOLD,x:440,label:'黄金：没利息',at:'@b08:黄',gray:'@b09:吃'},
         {at:'@b09:利',vlabel:'美国 10 年国债',value:'4.9%',color:'#1f6b45',x:1490,y:280,w:500,h:300}]},
 {scene:'footage',until:'@b10:着',host:'pip',says:'再加上美股大跌',clip:'nyse',push:[1,1.05]},
 {scene:'article',until:'@b11',host:'pip',says:'急用钱，先卖最好卖的黄金：原文写的就是这个',img:'assets/img/kitco.png',hl:[[1036.6,139,272.7,41],[410,178,289.5,41]],zoomS:1.9,zoom:'@b10:着+0.05',hlAt:'@b10:着+0.5'},
 // 回到开头那句话：两张照片原样回来；"你先"跳近景；"看一眼利率"身后换世界（和中间那一下是同一个答案）
 {scene:'host',enter:'grow',says:'回到开头那句话：下次先看一眼利率',
  items:[{...WAR,at:'@b11:乱'},{...GOLD,at:'@b11:黄'}],
  zoom:[{at:'@b11:先-0.1',s:1.14}],
  swap:{at:'@b11:看',words:['利','率']}},
]);
return K.go();
})();
