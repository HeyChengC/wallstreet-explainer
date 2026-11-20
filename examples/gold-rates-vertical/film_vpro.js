// 试片：拿《打仗黄金反而跌》竖屏的口播和素材，只用 skill 里的东西（vpro 组件 + 原有的图表场景）重做一遍。
// 目的：验证 vpro 换一个题目还能不能做出同一档的效果。没有为这条片写任何新场景。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS,subMax:12});
const K=await KIT.use(F);
await KIT_VERT.use(K,{skin:'dark',pattern:'gold',brand:'',host:{name:'host',fps:30,faceY:330,bright:1.18}});
KIT_VPRO.theme({accent:'#ad8aed',bg:'assets/img/rate.jpg'});   // scripts/pick_accent.py 从她的画面里挑的

await K.film([
 {scene:'vp-words', until:'@b03', says:'大家都信的那句老话：乱世买黄金',
  zoom:[{at:'@b01',s:1.0},{at:'@b02',s:1.15}], en:'SAFE HAVEN?',
  props:[{kind:'obj', img:'assets/img/cut/gold.png', at:'@b02:乱', x:-90, y:800, w:520, rot:-9, layer:'back'}],
  words:[{text:'乱世', at:'@b02:乱', col:'white'},{text:'买黄金', at:'@b02:买', col:'accent', fx:'flip'}]},
 {scene:'v-clip', until:'@b03:黄', says:'这次是真在打仗',
  clip:'smoke', from:.5, title:'这次<em>真在打</em>', tags:[{text:'油价冲上 $104', at:'@b03:打'}], source:'新闻实拍'},
 {scene:'v-line', until:'@b04', says:'金价从一月最高点一路掉回一年多前',
  title:'金价走势', data:'assets/data/gold.json', unit:'美元/盎司', drawTo:'@b03:一',
  marks:[{i:103, text:'1月最高 $5,318'},{i:-1, text:'一年多来最低', at:'@b03:最'}], source:'COMEX 黄金期货日收盘价'},
 {scene:'vp-number', until:'@b05', says:'光十月就跌了快 7%',
  zoom:1.0, value:'-6.9%', unit:'', label:'黄金 · 10月跌幅', at:'@b04:跌'},
 {scene:'vp-verdict', until:'@b06', says:'答案就一个词：利率', hero:true,
  lines:['问题出在','利率'], bg:'assets/img/rate.jpg', at:['@b05','@b05:利'], en:'INTEREST RATE'},
 {scene:'v-chain', until:'@b07:1', says:'打仗怎么走到利率：油价 → 通胀 → 加息',
  title:'一环扣一环', items:[{title:'打仗推高油价', value:'$104', sub:'国际油价', img:'assets/img/ill_oil.jpg', color:'red', at:'@b06'},{title:'通胀压不住', value:'3.6%', sub:'美国通胀', img:'assets/img/ill_cart.jpg', color:'teal', at:'@b06:通'},{title:'美联储加息', sub:'9月加过一次', img:'assets/img/ill_fed.jpg', color:'gold', at:'@b07'}]},
 {scene:'vp-paper', until:'@b08', says:'12 月还要加：市场押 75%',
  img:'assets/img/doc_cnbc.png', mast:'CNBC', mastSub:'MARKETS', brow:'市场怎么押', title:'12月<em>还要加</em>',
  hl:[{x:.04,y:.35,w:.875,h:.1,at:'@b07:1+0.3'},{x:.046,y:.455,w:.462,h:.1,at:'@b07:可'}], tag:{text:'再加息概率 75%', at:'@b07:还'}},
 {scene:'vp-reject', until:'@b10', says:'黄金没利息，利率越高拿着越吃亏',
  zoom:[{at:'@b08',s:1.12},{at:'@b09',s:1.26}],
  stamp:{text:'不生利息', at:'@b08:不'}, drop:{text:'越拿越亏', at:'@b09:拿', col:'cool'}},
 {scene:'v-clip', until:'@b10:急', says:'还有一个推手：美股大跌',
  clip:'nyse', title:'还有一个<em>推手</em>', tags:[{text:'纽约证券交易所', at:'@b10:美'}], source:'纽交所实拍'},
 {scene:'vp-paper', until:'@b11', says:'急用钱的先卖最好卖的黄金，原文就这么写',
  img:'assets/img/doc_kitco.png', mast:'KITCO', mastSub:'NEWS', brow:'原文怎么写', title:'先卖<em>最好卖的</em>',
  hl:[{x:.68,y:.06,w:.285,h:.108,at:'@b10:急'},{x:.025,y:.16,w:.31,h:.108,at:'@b10:先'}], zoomTo:1.25},
 {scene:'vp-words', says:'回到开头那句话：下次先看一眼利率',
  zoom:[{at:'@b11',s:1.0},{at:'@b11:你',s:1.2}], words:[{text:'先看一眼', at:'@b11:先', col:'white'},{text:'利率', at:'@b11:利', col:'accent'}]},
]);
return K.go();
})();
