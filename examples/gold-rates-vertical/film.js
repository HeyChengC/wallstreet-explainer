// 打仗了，黄金为什么反而跌（竖屏版 1080×1920，28.8 秒，真人口播）。导演表 ../shots.md
// 口播是 2026-11-02 那条 16:9 原片裁进竖屏；声音用原片的 mix_master.wav，所以每镜都卡在她原来说话的字上。
// 五段：她讲 0–4.3 / 证据 4.3–8.3 / 她讲 8.3–10.7 / 证据 10.7–17.2 / 她讲 17.2–20.1 / 证据 20.1–24.2 / 她讲 24.2–28.8
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS,subMax:12});
const K=await KIT.use(F);
await KIT_VERT.use(K,{skin:'dark',pattern:'gold',brand:'橙C',host:{name:'host',fps:30,faceY:330,bright:1.18}});

await K.film([
 {scene:'v-host', until:'@b02', says:'她开口：大黄最近有事',
  zoom:1.0, name:'今天聊黄金', nameAt:'@b01:最'},

 {scene:'v-host-bubbles', until:'@b03', says:'大家都信的那句老话：乱世买黄金',
  zoom:1.15, items:[{text:'乱世买黄金', mark:'？', at:'@b02:乱'}]},

 {scene:'v-clip', until:'@b03:黄', says:'这次是真在打仗',
  clip:'smoke', from:.5, title:'这次<em>真在打</em>', tags:[{text:'油价冲上 $104', at:'@b03:打'}], source:'新闻实拍'},

 {scene:'v-line', until:'@b04', says:'金价从一月最高点一路掉回一年多前',
  title:'金价走势', data:'assets/data/gold.json', unit:'美元/盎司', drawTo:'@b03:一',
  marks:[{i:103, text:'1月最高 $5,318'},{i:-1, text:'一年多来最低', at:'@b03:最'}], source:'COMEX 黄金期货日收盘价'},

 {scene:'v-host-num', until:'@b05', says:'光十月就跌了快 7%',
  value:'-6.9%', label:'10月跌幅', color:'red', roll:true, at:'@b04:跌'},

 {scene:'v-title', until:'@b06', says:'答案就一个词：利率', hero:true,
  lines:['问题出在','<em>利率</em>'], en:'INTEREST RATE', pic:'assets/img/rate.jpg', at:['@b05','@b05:利']},

 {scene:'v-chain', until:'@b07:1', says:'打仗怎么走到利率：油价 → 通胀 → 加息',
  title:'一环扣一环', items:[{title:'打仗推高油价', value:'$104', sub:'国际油价', img:'assets/img/ill_oil.jpg', color:'red', at:'@b06'},{title:'通胀压不住', value:'3.6%', sub:'美国通胀', img:'assets/img/ill_cart.jpg', color:'teal', at:'@b06:通'},{title:'美联储加息', sub:'9月加过一次', img:'assets/img/ill_fed.jpg', at:'@b07'}]},

 {scene:'v-doc', until:'@b08', says:'12 月还要加：市场押 75%',
  img:'assets/img/doc_cnbc.png', brow:'CNBC 报道', title:'市场怎么押',
  hl:[{x:.04,y:.35,w:.875,h:.1,at:'@b07:1+0.3'},{x:.046,y:.455,w:.462,h:.1,at:'@b07:可'}], zh:{text:'12 月再加息：<em>75%</em> 概率', at:'@b07:还'}},

 {scene:'v-host-cards', until:'@b10', says:'黄金没利息，美债一年 4.9%，利率越高黄金越吃亏',
  zoom:1.1, items:[{title:'黄金', value:'0%', sub:'不生利息', color:'gold', at:'@b08'},{title:'美债', value:'4.9%', sub:'每年稳拿', color:'green', at:'@b09'}]},

 {scene:'v-clip', until:'@b10:急', says:'还有一个推手：美股大跌',
  clip:'nyse', title:'还有一个<em>推手</em>', tags:[{text:'纽约证券交易所', at:'@b10:美'}], source:'纽交所实拍'},

 {scene:'v-doc', until:'@b11', says:'急用钱的先卖最好卖的黄金，原文就这么写',
  img:'assets/img/doc_kitco.png', brow:'Kitco 报道', title:'原文怎么写',
  hl:[{x:.68,y:.06,w:.285,h:.108,at:'@b10:急'},{x:.025,y:.16,w:.31,h:.108,at:'@b10:先'}], zh:{text:'美股大跌，<em>触发抛售</em>', at:'@b10:最'}},

 {scene:'v-host-words', says:'回到开头那句话：下次先看一眼利率',
  zoom:[{at:'@b11',s:1.0},{at:'@b11:你',s:1.2}], words:[{text:'先看一眼', at:'@b11:先'},{text:'利率', at:'@b11:利', hl:true}]},
]);
return K.go();
})();
