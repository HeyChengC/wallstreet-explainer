// 台湾版：台北市長辯論，金句怎麼搶聲量（開頭 18 秒）
// 动效：slam 砸入 + impact-shake + 爆裂/问号；无角标（overlays:none）
// 素材：tw-face.jpg / tw-clean.jpg 已裁掉 TVBS 台标、右竖栏、倒计时、底部身份栏（只留人脸与肩）。
// 巨字在第一帧就出现（drawAt 不写 = 镜头开头 +0.02 秒）。
// subMax 12：繁体 900 字重 80px，一行 12 字在手机上也读得清。
window.ready=(async()=>{
 const F=await FB.init({counts:['assets/clips/counts.json'],cuts:[],fonts:KIT.FONTS,subMax:12});
 const K=await KIT.use(F);
 await K.regional('taiwan');
 K.politics.display('no-badges');

 await K.film([
  // 0 钩子：红黄对撞底 + 大头 + 巨字第一帧就到
  {scene:'local-hero', until:'@b02', says:'一句话就能洗版？先把这个问号立起来', claimIds:['c1'], sourceIds:['s1'],
   headline:'一句話洗版？', sub:'政見呢？',
   img:'assets/img/tw-shen-clean.png', imgW:734, imgH:790,
   personX:1330, personY:80, personH:1000, rim:'#fff',
   fill:'#ffffff', accent:'#ffd60a', kicker:'台北市長辯論',
   headlineX:520, headlineSize:150, subSize:88, subRot:-2.5,
   burst:true, sticker:'?', shakeAt:'@b01:洗版',
   bgC1:'#c8231a', bgC2:'#3a0b02', tone:'charcoal'},

  // 1 真实原片：他确实说了什么（干净裁切，无台标）
  {scene:'footage', until:'@b03', says:'他在辩论台上说的原话就在这，画面归因原片', claimIds:['c1'],
   img:'assets/img/tw-clean.jpg', push:[1.02,1.1], focus:[960,380], tone:'charcoal'},

  // 2 大字对照：好剪 ≠ 做得到
  {scene:'local-hero', until:'@b05', says:'好剪不等于做得到，这是全片的判断', claimIds:['c2'],
   headline:'好剪 ≠ 做得到', sub:'聽起來好聽，不等於做得到',
   img:'assets/img/tw-shen-clean.png', imgW:734, imgH:790,
   personX:1460, personY:130, personH:940, rim:'#ffd60a',
   fill:'#ffffff', accent:'#ffd60a', headlineSize:138, subSize:78,
   headlineX:560, headlineY:520,
   burst:true, shakeAt:'@b04:政見',
   bgC1:'#1a3f8a', bgC2:'#080c18', tone:'charcoal'},

  // 3 三个词：财源、期程、权责（背后是干净原片，不是带台标的全图）
  {scene:'local-quote-card', until:'@b07', says:'要拆招就看三样：财源、期程、权责', claimIds:['c2'],
   text:'財源　期程　權責', hl:'期程', who:'拆招就看這三樣',
   img:'assets/img/tw-clean.jpg', size:146, tone:'charcoal'},

  // 4 收尾落点
  {scene:'local-hero', says:'关键不是声量，是谁把市政说清楚', claimIds:['c2'], sourceIds:['s1'],
   headline:'誰講清楚', sub:'不是誰聲量最大',
   img:'assets/img/tw-shen-clean.png', imgW:734, imgH:790,
   personX:1400, personY:110, personH:980, rim:'#ffd60a',
   fill:'#ffd60a', accent:'#ffffff', kicker:'關鍵是這個',
   headlineX:520, headlineSize:170, subSize:86,
   burst:true, bgC1:'#c8231a', bgC2:'#2a0b02', tone:'charcoal'},
 ]);
 return K.go();
})();

