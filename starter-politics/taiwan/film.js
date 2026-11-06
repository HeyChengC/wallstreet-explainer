// 台湾本地版起点（new_film.mjs <目录> --region taiwan 建出来的就是这个）
// 三件事一建就位：繁体正文、zh-TW 男声、无角标（overlays:none）。
// 换题材时改 script.json 和这里的三镜；出处记进 editorial.json（不上屏）。
window.ready=(async()=>{
 const F=await FB.init({counts:['assets/clips/counts.json'],cuts:[],fonts:KIT.FONTS,subMax:12});
 const K=await KIT.use(F);
 // 地区主题：字体栈换成 Noto Sans TC Black 900 + 繁体用词表
 await K.regional('taiwan');
 // 无角标：来源、性质、虚构、研究一律不上屏（出处留在 editorial.json）
 K.politics.display('no-badges');

 await K.film([
  // 0 钩子：一句问法 + 大头 + 巨字（第一帧就有字）
  {scene:'local-hero', until:'@b02', says:'一句话就能洗版？先把这个问号立起来',
   headline:'一句話洗版？', sub:'政見呢？',
   fill:'#ffffff', accent:'#ffd60a', headlineSize:150, subSize:88,
   headlineX:520, headlineY:520, subRot:-2.5,
   burst:true, sticker:'?',
   bgC1:'#c8231a', bgC2:'#3a0b02', tone:'charcoal'},

  // 1 对照：好剪 ≠ 做得到
  {scene:'local-hero', until:'@b04', says:'好剪不等于做得到，这是判断',
   headline:'好剪 ≠ 做得到', sub:'聽起來好聽，不等於做得到',
   fill:'#ffffff', accent:'#ffd60a', headlineSize:138, subSize:78,
   headlineX:560, headlineY:520,
   burst:true,
   bgC1:'#1a3f8a', bgC2:'#080c18', tone:'charcoal'},

  // 2 三个词：拆招看这三样
  {scene:'local-quote-card', says:'要拆招就看三样：财源、期程、权责',
   text:'財源　期程　權責', hl:'期程', who:'拆招就看這三樣',
   size:146, tone:'charcoal'},
 ]);
 return K.go();
})();
