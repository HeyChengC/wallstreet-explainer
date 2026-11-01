// film.js —— 这条片的镜头表。一镜一个对象：选一个场景（kit/README.md 查），填这一镜的内容。
// 先写导演表（每一镜：屏上是什么、观众多懂了什么、接住上一镜的什么），再按导演表填这张表。
// 每一镜都要写：
//   scene  场景名（下面的例子：number / discs / person …，全部见 kit/README.md）
//   until  这一镜到哪一刻结束：'@b02'（下一句开口）、'@b02:英伟达'（念到这个词）。最后一镜不写 = 到片尾
//   says   这一镜让观众多懂了什么（一句话；说不出来就重想这一镜）
//   enter  可选，这一镜怎么接上一镜：'cut'（默认）/'push'（横推换人）/'through'（推过镜头）/'blur'/'flat'（上一镜倒成桌面）/'whip'
// 时刻一律写 '@句id:词'，不写秒数：换了配音全片自动跟着走。
// 写完：node <skill>/scripts/render.mjs --dir . --check（查表）→ --sheet（看图）→ --video --h 720（看动起来）
window.ready=(async()=>{
const F=await FB.init({
 counts:['assets/clips/counts.json'],   // footage.py extract 写的实拍帧数；没有实拍也留着（空的 {}）
 cuts:[],                               // matte.py 抠的实拍人像序列名（手写镜头用 S25.cutP；模板档的 person 用透明 PNG）
 fonts:KIT.FONTS,
});
const K=await KIT.use(F);
const PH='assets/kit/ph/';              // 占位素材：先跑通，成片之前全部换掉（--check 会提醒）

await K.film([
 {scene:'number', until:'@b02', says:'先抛出最反常的那个数',
  value:'$7250亿', brow:'这个数是什么', en:'WHAT IT IS'},

 {scene:'discs', until:'@b03', says:'这个数是谁的',
  items:[
   {id:'a', name:'公司甲', en:'Company A', color:'blue', at:'@b02:谁'},
   {id:'b', name:'公司乙', en:'Company B', color:'green', at:'@b02:多大'},
  ]},

 {scene:'title', says:'回到问题，给一句判断',
  title:'这条片的问题', en:'THE QUESTION', items:[PH+'servers.jpg', PH+'site.jpg', PH+'city.jpg']},
]);
return K.go();
})();
