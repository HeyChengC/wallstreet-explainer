// 第二批 12 个组件的样张（无人版）：每个组件一镜，内容用英伟达和黄金两条片里核过的数。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS,subMax:12});
const K=await KIT.use(F);
await KIT_VERT.use(K,{skin:'dark',brand:''});
KIT_VPRO.theme({accent:'#8a86ee',bg:'assets/img/hq_raw.jpg'});
await K.film([
 {scene:'vp-ask', until:'@b02', says:'抛问题', lines:['黄金为什么','反而跌']},
 {scene:'vp-bars', until:'@b03', says:'几个数比大小', title:'单季<em>营收</em>', brow:'英伟达 · 亿美元', unit:'亿美元',
  items:[{label:'去年同期',value:'570'},{label:'上季',value:'1010'},{label:'本季',value:'1158',hl:true}]},
 {scene:'vp-versus', until:'@b04', says:'两样东西对比', title:'拿着哪个<em>划算</em>', brow:'一年能拿多少',
  left:{name:'黄金',value:'0%',sub:'不生利息'}, right:{name:'美债',value:'4.9%',sub:'每年稳拿'}, win:{side:'right'}},
 {scene:'vp-chain', until:'@b05', says:'因果链', title:'一环<em>扣一环</em>',
  items:[{title:'打仗推高油价',value:'$104',sub:'国际油价'},{title:'通胀压不住',value:'3.6%',sub:'美国通胀'},{title:'美联储加息',sub:'9月加过一次'}]},
 {scene:'vp-list', until:'@b06', says:'几条要点', title:'董事会的<em>三句话</em>',
  items:[{text:'一致接受辞职',mark:'ok'},{text:'无意让他复职',mark:'no',hl:true},{text:'业务照常推进',sub:'单季营收 1158 亿美元',mark:'ok'}]},
 {scene:'vp-line', until:'@b07', says:'走势', title:'金价<em>走势</em>', unit:'美元/盎司', down:true, source:'示意数据，只用来看版式',
  data:[3900,3960,4100,4300,4480,4700,4950,5180,5318,5200,5050,4800,4620,4500,4380,4210,4100,3990,3920,3899],
  marks:[{i:8,text:'1月最高 $5,318'},{i:-1,text:'一年多来最低'}]},
 {scene:'vp-photo', until:'@b08', says:'一张图当主角', img:'assets/img/hq_raw.jpg', title:'英伟达<em>总部</em>', brow:'加州 · 圣克拉拉',
  tags:['董事会在这里开的会','11月17日'], source:'照片：Coolcaesar / CC BY-SA 4.0'},
 {scene:'vp-quote', until:'@b09', says:'一句引语', brow:'辞职后首次公开发声', lines:['若符合公司利益','<em>愿意重返CEO岗位</em>'], name:'黄仁勋', tag:'英伟达创始人', img:'assets/img/huang_raw.jpg'},
 {scene:'vp-timeline', until:'@b10', says:'时间线', title:'这<em>一周</em>',
  items:[{date:'11月12日',text:'黄仁勋辞职'},{date:'11月17日',text:'董事长：无意让他复职',hl:true},{date:'11月18日',text:'他说愿意回来'}]},
 {scene:'vp-share', until:'@b11', says:'占比', title:'市场<em>怎么押</em>', value:'75%', label:'押 12 月再加息', note:'CME FedWatch'},
 {scene:'vp-rank', until:'@b12', says:'排行', title:'谁<em>替他说话</em>', brow:'示意，只用来看版式',
  items:[{name:'阿克曼',value:'3条',hl:true},{name:'赵长鹏',value:'2条'},{name:'其他人',value:'1条'}]},
 {scene:'vp-chapter', says:'分段', no:'02', title:'钱照赚', en:'BUSINESS AS USUAL'},
]);
return K.go();
})();
