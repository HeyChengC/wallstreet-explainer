// 《英伟达拒绝老黄回归》竖屏无人版（没有真人出镜，配音是豆包 TTS）。和真人口播版同一份文案、同一套 vpro 组件，底从她的实拍换成图。
// 导演表 ../shots.md。2026-11-20。
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
KIT_VPRO.theme({accent:'#8a86ee'});   // 和真人口播版同一个强调色（那一版取自她的开衫），两条片是一套

await K.film([
 {scene:'vp-words', until:'@b02', says:'英伟达又出事了，而且是反转',
  bg:'assets/img/hq_raw.jpg', en:'PLOT TWIST', y:760,
  props:[{kind:'obj', img:'assets/img/cut/chip.png', at:'@b01', x:170, y:800, w:740, rot:-8, layer:'back'}],
  words:[{text:'英伟达', at:'@b01:英', col:'white'},{text:'又反转了', at:'@b01:又', col:'accent', fx:'flip'}]},
 {scene:'vp-newspile', until:'@b03', says:'上周的事：老黄辞职，到处都在报',
  bg:'assets/img/huang_raw.jpg', brow:'上周 · 11月12日',
  items:[{img:'assets/img/snap3/c1.png', pic:'assets/img/huang_raw.jpg', pos:'50% 24%', at:'@b02'},
         {img:'assets/img/snap3/c2.png', at:'@b02:因'},
         {img:'assets/img/snap3/c3.png', pic:'assets/img/hq_raw.jpg', pos:'50% 40%', at:'@b02:突'}],
  stamp:{text:'辞职', en:'RESIGNED', at:'@b02:辞'}},
 {scene:'vp-person', until:'@b04', says:'他自己想回来',
  cut:'assets/img/cut/huang.png', bg:'assets/img/huang_raw.jpg', brow:'黄仁勋 · 辞职后首次公开发声',
  name:'黄仁勋', sub:'昨天 · 公开发文', quote:'若符合公司利益，愿意重返CEO岗位', cardOut:'@b03:暗',
  lines:['愿意重返','CEO岗位'], at:['@b03:愿','@b03:重'],
  source:'照片：Anders Eidesvik / CC BY-SA 4.0'},
 {scene:'vp-reject', until:'@b05', says:'转折：董事会不答应',
  bg:'assets/img/hq_raw.jpg',
  stamp:{text:'不买账', at:'@b04:不'}, drop:{text:'泼冷水', at:'@b04:泼'},
  props:[{kind:'pour', img:'assets/img/cut/bucket.png', at:'@b04:泼', x:500, y:120, w:620, hide:62, layer:'back'}]},
 {scene:'vp-paper', until:'@b06', says:'这话是董事长在财报会上亲口说的',
  img:'assets/img/snap/d_eeo2.png', mast:'经济观察网', mastSub:'EEO.COM.CN', brow:'财报电话会 · 11月17日', title:'董事长<em>亲口说</em>',
  hl:[{x:.1474,y:.2898,w:.5043,h:.0841,at:'@b05:董'}], tag:{text:'董事长 哈维·琼斯', at:'@b05:直'}},
 {scene:'vp-verdict', until:'@b07', says:'结论：不让回', hero:true,
  lines:['董事会拍板','不让回'], bg:'assets/img/hq_raw.jpg', cut:'assets/img/cut/huang.png', at:['@b06','@b06:无'],
  en:'THE BOARD SAYS NO', sub:'英伟达董事长 · 11月17日财报电话会',
  note:{label:'董事长原话', text:'无意让他<em>恢复CEO职务</em>'},
  props:[{kind:'hammer', img:'assets/img/cut/gavel.png', at:'@b06:拍', x:1010, y:880, w:640, block:'assets/img/cut/block.png', bw:380, ar:.431}]},
 {scene:'vp-voices', until:'@b08', says:'有大人物替他说话，也没用',
  bg:'assets/img/hq_raw.jpg',
  props:[{kind:'obj', img:'assets/img/cut/huang.png', at:'@b07', x:300, y:520, w:480, rot:0, layer:'back'}],
  items:[{img:'assets/img/ackman.jpg', name:'阿克曼', tag:'潘兴广场创始人', say:'错上加错', at:'@b07:圈'},
         {img:'assets/img/cz.jpg', name:'赵长鹏', tag:'币安创始人', say:'是个错误', at:'@b07:声'}],
  deny:{at:'@b07:铁'}, bar:{text:'立规矩', en:'RULES', at:'@b07:立'}},
 {scene:'vp-number', says:'人走了，钱照赚：单季营收 1158 亿美元',
  bg:'assets/img/hq_raw.jpg', value:'1158', unit:'亿美元', label:'单季营收 · 同比', pct:'+103%', at:'@b08:炸',
  props:[{kind:'bills', img:'assets/img/bill100.jpg', at:'@b08:印', y:1400, layer:'back'},{kind:'bills', img:'assets/img/bill100.jpg', at:'@b08:印', big:true}]},
]);
return K.go();
})();
