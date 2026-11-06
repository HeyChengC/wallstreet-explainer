// 香港版封面：2024 垃圾徵費押後
// 官员身份按官方原页 alt：左 卓永興（政務司副司長）、右 謝展寰（環境及生態局局長）
// 封面不读 timeline，只等字体和图片。
// 三行主标题放在左侧 40% 文字区，人物在右；每行 4–5 字，字身粗、描边在字后。
window.COVER_READY=(async()=>{
 KIT.regional('hongkong');
 await document.fonts.ready;

 const K=KIT;
 const cover=K.cover({
  people:[{
   img:'assets/img/hk-two.png',   // 已裁到人物实际范围，2707×1643，ar≈1.648
   imgW:2707, imgH:1643,
   x:1330, y:40, h:1040,
   rim:'#ffffff',
  }],
  lines:[
   // x 是行中心。左侧文字区 ≈ 60–800，中心取 430；黄行最宽，单独再小一点保证不出边。
   {text:'垃圾徵費', x:430, y:246, size:100, fill:'#ffffff', stroke:7, shadow:9, rot:-2.0},
   {text:'講咗咁耐', x:440, y:452, size:160, fill:'#ffffff', stroke:9, shadow:12, rot:-2.0},
   {text:'又押後？', x:470, y:650, size:178, fill:'#ffd60a', stroke:10, shadow:13, rot:1.6},
  ],
  stickers:[
   K.sticker(1,0,{text:'?', x:1790, y:200, size:200, color:'#ff3b30', stroke:10}),
  ],
  c1:'#d63c12', c2:'#2a0c06',
  burst:K.burst(1,0,{r:720,spikes:22,color:'#b3120a',color2:'#ff9f0a',o:.46,cy:520}),
 });

 const st=document.querySelector('#stage');
 st.innerHTML=cover();
 await Promise.all([...st.querySelectorAll('img')].map(im=>im.decode().catch(()=>{})));
 await document.fonts.ready;
 st.insertAdjacentHTML('beforeend',`<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(12,6,4,.65) 100%);pointer-events:none"></div>`);
 return true;
})();
