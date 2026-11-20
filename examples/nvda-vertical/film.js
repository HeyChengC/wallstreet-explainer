// 《英伟达拒绝老黄回归》竖屏真人口播（1080×1920，28.7 秒），用 kit/vpro.js 的组件写的镜头表。导演表 shots.md。
// 口播是用户给的竖屏原片（720×1280），先裁成画面区的比例再放大到 1080×1574，所以景别 1.0 正好铺满。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS,subMax:12});
const K=await KIT.use(F);
await KIT_VERT.use(K,{skin:'dark',pattern:'chart',brand:'',host:{name:'host',fps:30,w:1080,h:1574,faceY:488,cx:515}});
KIT_VPRO.theme({accent:'#8a86ee'});   // 强调色取自她的紫灰开衫
await K.film([
 {scene:'vp-words', until:'@b02', says:'英伟达又出事了，而且是反转',
  zoom:[{at:'@b01',s:1.0},{at:'@b01:又',s:1.13}], en:'PLOT TWIST',
  props:[{kind:'obj', img:'assets/img/cut/chip.png', at:'@b01:英', x:-120, y:742, w:470, rot:-10, layer:'back'}],
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
  zoom:[{at:'@b04',s:1.12},{at:'@b04:泼',s:1.27}],
  stamp:{text:'不买账', at:'@b04:不'}, drop:{text:'泼冷水', at:'@b04:泼'},
  props:[{kind:'pour', img:'assets/img/cut/bucket.png', at:'@b04:泼', x:560, y:420, w:600, hide:62, layer:'back'}]},
 {scene:'vp-paper', until:'@b06', says:'这话是董事长在财报会上亲口说的',
  img:'assets/img/snap/d_eeo2.png', mast:'经济观察网', mastSub:'EEO.COM.CN', brow:'财报电话会 · 11月17日', title:'董事长<em>亲口说</em>',
  hl:[{x:.1474,y:.2898,w:.5043,h:.0841,at:'@b05:董'}], tag:{text:'董事长 哈维·琼斯', at:'@b05:直'}},
 {scene:'vp-verdict', until:'@b07', says:'结论：不让回', hero:true,
  lines:['董事会拍板','不让回'], bg:'assets/img/hq_raw.jpg', cut:'assets/img/cut/huang.png', at:['@b06','@b06:无'],
  en:'THE BOARD SAYS NO', sub:'英伟达董事长 · 11月17日财报电话会',
  note:{label:'董事长原话', text:'无意让他<em>恢复CEO职务</em>'},
  props:[{kind:'hammer', img:'assets/img/cut/gavel.png', at:'@b06:拍', x:1010, y:880, w:640, block:'assets/img/cut/block.png', bw:380, ar:.431}]},
 {scene:'vp-voices', until:'@b08', says:'有大人物替他说话，也没用',
  zoom:[{at:'@b07',s:1.12},{at:'@b07:铁',s:1.24}],
  items:[{img:'assets/img/ackman.jpg', name:'阿克曼', tag:'潘兴广场创始人', say:'错上加错', at:'@b07:圈'},
         {img:'assets/img/cz.jpg', name:'赵长鹏', tag:'币安创始人', say:'是个错误', at:'@b07:声'}],
  deny:{at:'@b07:铁'}, bar:{text:'立规矩', en:'RULES', at:'@b07:立'}},
 {scene:'vp-number', says:'人走了，钱照赚：单季营收 1158 亿美元',
  zoom:1.0, value:'1158', unit:'亿美元', label:'单季营收 · 同比', pct:'+103%', at:'@b08:炸',
  props:[{kind:'bills', img:'assets/img/bill100.jpg', at:'@b08:印', layer:'behind'},{kind:'bills', img:'assets/img/bill100.jpg', at:'@b08:印', big:true}]},
]);
return K.go();
})();
