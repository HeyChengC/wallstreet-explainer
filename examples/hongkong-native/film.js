// 香港版：2024 垃圾徵費押後，邊個交代（開頭 18 秒）
// 动效：slam + impact-shake + 爆裂；无角标（overlays:none）
// 素材：hk-officials-cut.png（抠像，已裁掉讲台与立法会 logo）、hk-presser.jpg（原图，压暗当底）
// 身份：左 卓永興（政務司副司長）、右 謝展寰（環境及生態局局長）
// 年份在口播和正文大标题里讲清楚（2024 事件回看），不做角落年份角标。
window.ready=(async()=>{
 const F=await FB.init({counts:['assets/clips/counts.json'],cuts:[],fonts:KIT.FONTS,subMax:12});
 const K=await KIT.use(F);
 await K.regional('hongkong');
 K.politics.display('no-badges');

 await K.film([
  // 0 钩子：粵語问句直接砸上去
  {scene:'local-hero', until:'@b02', says:'讲了这么久，为什么又押后？先把这句话立起来',
   headline:'又押後？', sub:'講咗咁耐',
   img:'assets/img/hk-two.png', imgW:2707, imgH:1643,
   personX:1280, personY:100, personH:940, rim:'#fff',
   fill:'#ffd60a', accent:'#ffffff', headlineSize:210, subSize:104,
   headlineX:470, headlineY:600, subRot:-3,
   burst:true, sticker:'?', shakeAt:'@b01:押後',
   bgC1:'#d63c12', bgC2:'#2a0c06', tone:'charcoal'},

  // 1 年份与事件：这件事是 2024 的（正文大标题交代，不是角落标签）
  {scene:'local-hero', until:'@b03', says:'先把时间讲清楚：这是 2024 年的垃圾征费，八月一号又押后', claimIds:['c1'],
   headline:'2024年 垃圾徵費', sub:'八月一號 → 又暫緩',
   img:'assets/img/hk-two.png', imgW:2707, imgH:1643,
   personX:1400, personY:130, personH:900, rim:'#ffd60a',
   fill:'#ffffff', accent:'#ffd60a', headlineSize:118, subSize:82,
   headlineX:560, headlineY:470,
   burst:false, bgC1:'#1a1a22', bgC2:'#08080c', tone:'charcoal'},

  // 2 官方说法：配套不够（贴纸跳进来）。背景用 hk-face.jpg —— 已裁掉讲台的立法会 logo
  {scene:'local-quote-card', until:'@b04', says:'政府的说法是配套不够，这句话要原样摆出来', claimIds:['c2'],
   text:'社會準備未夠　回收配套仲要加', hl:'配套', who:'政府說法',
   img:'assets/img/hk-face.jpg', size:112, tone:'charcoal'},

  // 3 街坊要问的：之前啲宣传同准备做成点
  {scene:'local-hero', until:'@b07', says:'街坊要问的是：之前的宣传和准备，到底做成什么样', claimIds:['c3'],
   headline:'之前做咗啲乜？', sub:'宣傳、準備、回收點',
   img:'assets/img/hk-two.png', imgW:2707, imgH:1643,
   personX:1350, personY:110, personH:920, rim:'#fff',
   fill:'#ffffff', accent:'#ffd60a', headlineSize:132, subSize:84,
   headlineX:520, headlineY:500,
   burst:true, shakeAt:'@b05:街坊',
   bgC1:'#c8231a', bgC2:'#2a0b02', tone:'charcoal'},

  // 4 记者追问问责 —— 政府怎么答（原话归因）
  {scene:'local-quote-card', until:'@b09', says:'记者追问问责，政府说局长已经尽心尽力', claimIds:['c4'],
   text:'局長已經盡心盡力', hl:'盡心盡力', who:'政府回應',
   img:'assets/img/hk-face.jpg', size:132, tone:'charcoal'},

  // 5 落点：尽力是一回事，交代清楚是另一回事
  {scene:'local-hero', says:'尽力是一回事，交代清楚是另一回事；局方自己的数也要讲清楚', claimIds:['c5'], sourceIds:['s1'],
   headline:'盡力≠交代', sub:'局方自己條數都要講清',
   img:'assets/img/hk-two.png', imgW:2707, imgH:1643,
   personX:1380, personY:120, personH:930, rim:'#ffd60a',
   fill:'#ffd60a', accent:'#ffffff', headlineSize:158, subSize:78,
   headlineX:500, headlineY:520,
   burst:true, bgC1:'#c8231a', bgC2:'#2a0b02', tone:'charcoal'},
 ]);
 return K.go();
})();

