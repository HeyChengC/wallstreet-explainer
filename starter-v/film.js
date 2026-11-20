// film.js —— 竖屏片（1080×1920）的镜头表。一镜一个对象：选一个 v- 开头的场景（kit/VERTICAL.md 查），填这一镜的内容。
// 先写导演表（每一镜：屏上是什么、观众多懂了什么、接住上一镜的什么），再按导演表填这张表。
// 每一镜都要写：
//   scene  场景名（v-host / v-clip / v-list …，全部见 kit/VERTICAL.md 的"这句话在说什么 → 用哪个场景"）
//   until  这一镜到哪一刻结束：'@b02'（下一句开口）、'@b02:利率'（念到这个词）。最后一镜不写 = 到片尾
//   says   这一镜让观众多懂了什么（一句话；说不出来就重想这一镜）
// 竖屏的接法只有硬切：不写 enter。东西一句出一样（items 里写 at:'@b03:词'，不写就自动均匀排开），出来了就留着。
// 时刻一律写 '@句id:词'，不写秒数。文案一个分句不超过 14 个字（竖屏字幕一行放不下，--check 会提醒）。
// 写完：node <skill>/scripts/render.mjs --dir . --check（查表）→ --sheet（看图）→ --video --h 720（720×1280 预览）
window.ready=(async()=>{
const F=await FB.init({
 counts:['assets/clips/counts.json'],   // 实拍、口播的帧数登记；没有也留着（空的 {}）
 fonts:KIT.FONTS,
 subMax:12,                             // 竖屏字幕一行 12 个字，多了按逗号拆
});
const K=await KIT.use(F);
await KIT_VERT.use(K,{
 skin:'dark',                           // 'dark' 深蓝织物 + 金数字（财经）/ 'paper' 灰紫底 + 米白卡 + 绿重点（生活、消费）；单镜可以写 skin 换
 brand:'',                              // 黑条上沿的小栏目名，不要就留空
 // host:{name:'host',fps:30},          // 有真人口播时打开：assets/clips/host/0001.jpg…（16:9 原片按帧抽），counts.json 里登记帧数；有抠像（assets/cut/host/）才能用 v-host-num
});
KIT_VPRO.theme({accent:'#8a86ee', bg:'assets/kit/ph/city.jpg'});   // 强调色：python scripts/pick_accent.py <她的一帧或主图> 挑；bg：没有她的镜头默认垫的图
const PH='assets/kit/ph/';              // 占位素材：先跑通，成片之前全部换掉（--check 会提醒）

await K.film([
 {scene:'vp-words', until:'@b02', says:'先抛出最反常的那件事',
  words:[{text:'这条片的', at:'@b01:第'},{text:'问题', at:'@b01:抛', fx:'flip'}]},   // vp- 开头的是精装组件，新片默认用它们（kit/VERTICAL.md 最前面）

 {scene:'v-clip', until:'@b03', says:'这件事长什么样',
  img:PH+'city.jpg', title:'先看<em>现场</em>', tags:[{text:'第一个事实', at:'@b02:谁'},{text:'第二个事实', at:'@b02:多大'}]},

 {scene:'v-list', says:'回到问题，给一句判断',
  title:'为什么？', items:['第一个原因','第二个原因'], answer:'一句话答案'},
]);
return K.go();
})();
