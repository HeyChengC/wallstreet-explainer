// 台湾版封面：台北市長辯論，金句怎麼搶聲量
// 人物：沈伯洋（源畫面來自 TVBS 官方公開片 js1T-FUwWI4 的 6:30 段落）
// 和香港版区分：红黄撞色（不是深蓝）、主冲突词用红白粗字、字更横。
window.COVER_READY=(async()=>{
 KIT.regional('taiwan');
 await document.fonts.ready;

 const K=KIT;
 const cover=K.cover({
  people:[{
   img:'assets/img/tw-shen-clean.png',  // 已裁掉底部残片，734×790，ar≈0.929
   imgW:734, imgH:790,
   x:1300, y:60, h:1010,
   rim:'#ffffff',
  }],
  lines:[
   {text:'金句很滿', x:400, y:236, size:104, fill:'#ffffff', stroke:7, shadow:9, rot:-2.0},
   // 主冲突词：红底白字，最抓眼
   {text:'政見呢？', x:420, y:452, size:184, fill:'#ffffff', stroke:8, shadow:12, rot:-2.5},
   {text:'一句話洗版', x:430, y:654, size:126, fill:'#ffd60a', stroke:8, shadow:11, rot:1.4},
  ],
  stickers:[
   K.sticker(1,0,{text:'?', x:1740, y:180, size:210, color:'#ff3b30', stroke:10}),
  ],
  // 红黄撞色：橙红→深红，配金黄色放射线（和 HK 的深红爆裂区分开）
  c1:'#e8451c', c2:'#3a0b02',
  burst:K.burst(1,0,{r:700,spikes:26,color:'#ffb300',color2:'#ff3b30',o:.5,cy:500}),
 });

 const st=document.querySelector('#stage');
 st.innerHTML=cover();
 await Promise.all([...st.querySelectorAll('img')].map(im=>im.decode().catch(()=>{})));
 await document.fonts.ready;
 st.insertAdjacentHTML('beforeend',`<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 52%,rgba(30,6,2,.62) 100%);pointer-events:none"></div>`);
 return true;
})();
