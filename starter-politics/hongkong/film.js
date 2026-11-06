// 香港本地版起点（new_film.mjs <目录> --region hongkong 建出来的就是这个）
// 三件事一建就位：**书面粤语**正文、zh-HK 男声、无角标（overlays:none）。
// 粤语是写出来的，不是把繁体普通话读成粤语音；改文案时保持粤字（唔/嘅/咗/佢/啲/喺）。
window.ready=(async()=>{
 const F=await FB.init({counts:['assets/clips/counts.json'],cuts:[],fonts:KIT.FONTS,subMax:12});
 const K=await KIT.use(F);
 // 地区主题：字体栈换成 Noto Sans HK Black 900 + 粤语用词表
 await K.regional('hongkong');
 // 无角标：来源、性质、虚构、研究一律不上屏（出处留在 editorial.json）
 K.politics.display('no-badges');

 await K.film([
  // 0 钩子：粤语问句直接砸上去
  {scene:'local-hero', until:'@b02', says:'讲了这么久，为什么又押后？',
   headline:'又押後？', sub:'講咗咁耐',
   fill:'#ffd60a', accent:'#ffffff', headlineSize:210, subSize:104,
   headlineX:470, headlineY:600, subRot:-3,
   burst:true, sticker:'?',
   bgC1:'#d63c12', bgC2:'#2a0c06', tone:'charcoal'},

  // 1 官方说法（原话，不上角标；出处进 editorial.json）
  {scene:'local-quote-card', until:'@b04', says:'政府的说法是配套不够，这句话要原样摆出来',
   text:'社會準備未夠　回收配套仲要加', hl:'配套', who:'政府說法',
   size:112, tone:'charcoal'},

  // 2 落点：尽力是一回事，交代清楚是另一回事
  {scene:'local-hero', says:'尽力是一回事，交代清楚是另一回事',
   headline:'盡力≠交代', sub:'局方自己條數都要講清',
   fill:'#ffd60a', accent:'#ffffff', headlineSize:158, subSize:78,
   headlineX:500, headlineY:520,
   burst:true, bgC1:'#c8231a', bgC2:'#2a0b02', tone:'charcoal'},
 ]);
 return K.go();
})();
