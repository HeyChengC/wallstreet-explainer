// 台湾政论动态升级版：高密度分镜 + 恒动运镜推进 + 光速打脸红印章
window.ready=(async()=>{
 const F=await FB.init({counts:[assets/clips/counts.json],cuts:[],fonts:KIT.FONTS,subMax:12});
 const K=await KIT.use(F);
 await K.regional(taiwan);
 K.politics.display(no-badges);

 await K.film([
  // 0 第一幕 爆点突袭：大头 + 恒动慢推 + 冲击大字
  {scene:pol-hero, until:@b02, says:开场质问破题：辩论全网洗版，这不是鬼扯是什么？！, claimIds:[c1], sourceIds:[s1],
   headline:這不是鬼扯？！, sub:全網瘋狂洗版！,
   img:assets/img/tw-shen-clean.png, imgW:734, imgH:790,
   personX:1320, personY:80, personH:1000,
   fill:#ffd60a, subSize:86, headlineSize:152,
   shakeAt:@b01:洗版, shakeAmp:18,
   bgC1:#b81414, bgC2:#2a0505},

  // 1 第二幕 现场原片咬合：镜头大比例向面部推近（持续推进，消灭死帧）
  {scene:footage, until:@b03, says:现场原片抓包：给观众看他在辩论台上到底怎么讲, claimIds:[c1],
   img:assets/img/tw-clean.jpg, push:[1.0, 1.14], focus:[960, 420], tone:charcoal},

  // 2 第二幕 快速跳剪特写：转折抓包
  {scene:pol-hero, until:@b04, says:义正辞严的背后，台下都在看笑话, claimIds:[c1],
   headline:看破手腳！, sub:台上義正辭嚴，台下看笑話,
   img:assets/img/tw-shen-clean.png, imgW:734, imgH:790,
   personX:1380, personY:100, personH:960,
   fill:#ffffff, headlineSize:140, subSize:76,
   shakeAt:@b03:笑話, bgC1:#1e3a8a, bgC2:#0b132b},

  // 3 第三幕 打脸对撞：当年承诺 vs 如今现实，重重砸下【自打臉】红印章！
  {scene:pol-slap, until:@b06, says:当年的承诺与如今的空白对撞，回力镖光速打脸, claimIds:[c2],
   pastTitle:當初喊得震天響, past:「公開透明，把麥克風交給市民」,
   nowTitle:現在政見書一翻開, now:財源期程全是空白！,
   stampText:自打臉, stampAt:@b05:空白},

  // 4 第四幕 灵魂考问：收尾绝杀，镜头步步逼近
  {scene:pol-hero, says:收尾绝杀：不是声量大就会做事，你到底拿什么交代市民？！, claimIds:[c2], sourceIds:[s1],
   headline:拿什麼交代？！, sub:講得再嗆，不等於會做事,
   img:assets/img/tw-shen-clean.png, imgW:734, imgH:790,
   personX:1300, personY:80, personH:1020,
   fill:#ffd60a, headlineSize:156, subSize:84,
   shakeAt:@b07:交代, bgC1:#9e1414, bgC2:#1c0404}
 ]);
 return K.go();
})();
