// 竖屏模板示例片：不带口播的 23 个场景各用一次。照着抄写法；素材全是占位图（assets/kit/ph/），新片换成真的。
// 带口播的 6 个场景（v-host、v-host-cards、v-host-num、v-host-words、v-host-bubbles、v-host-sides）要口播帧，写法看 kit/VERTICAL.md。
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS,subMax:12});
const K=await KIT.use(F);
await KIT_VERT.use(K,{skin:'dark',pattern:'chart',brand:'竖屏示例'});
const PH='assets/kit/ph/';

await K.film([
 {scene:'v-title', until:'@d02', says:'抛出反常的事：打仗了金价反而跌',
  lines:['打仗了','黄金<em>反而跌</em>？'], brow:'一句话问题', at:['@d01','@d01:黄金']},

 {scene:'v-clip', until:'@d03', says:'现场长这样：油轮冒烟，金价往下',
  img:PH+'site.jpg', title:'中东还在<em>打</em>', brow:'现场',
  tags:[{text:'油轮还在冒烟', at:'@d02:油轮'},{text:'金价掉头往下', at:'@d02:金价'}], source:'占位图'},

 {scene:'v-full', until:'@d04', says:'华尔街都在盯这件事',
  img:PH+'city.jpg', title:'华尔街\n都在看', tags:[{text:'纽约', at:'@d03:华尔街'}]},

 {scene:'v-chapter', until:'@d05', says:'换话题：先讲跌了多少',
  no:'01', title:'跌了多少', sub:'先看数'},

 {scene:'v-move', until:'@d06', says:'一个月从 4186 掉到 3898',
  title:'金价', label:'美元 / 盎司', from:'4186', to:'3898', at:'@d05:月底', delta:'-6.9%', color:'red'},

 {scene:'v-number', until:'@d07', says:'一个月跌了快 7%',
  value:'6.9%', brow:'10 月跌幅', label:'一个月跌掉的', color:'red', roll:true},

 {scene:'v-line', until:'@d08', says:'走势：一月见顶，十月跳水',
  title:'金价走势', points:[['25/9',3592],['10',3890],['11',4150],['12',4480],['26/1',5318],['2',5010],['3',4760],['4',4620],['5',4700],['6',4540],['7',4420],['8',4350],['9',4187],['10',3899]],
  marks:[{i:4,text:'1 月见顶', at:'@d07:一月'},{i:-1,text:'10 月跳水', at:'@d07:十月'}], unit:'美元', source:'示意数据'},

 {scene:'v-doc', until:'@d09', says:'外媒原文：一年多来最低',
  img:PH+'news_a.jpg', brow:'外媒报道', title:'原文怎么写', hl:[{x:.06,y:.3,w:.7,h:.1,at:'@d08:一年'}], zh:{text:'一年多来<em>最低</em>', at:'@d08:最低'}},

 {scene:'v-stack', until:'@d10', says:'到处都在报同一件事',
  title:'全网都在报', items:[{img:PH+'news_b.jpg', at:'@d09'},{img:PH+'news_c.jpg', at:'@d09:两条'},{title:'金价创一年多新低，市场押注美联储 12 月再加息', source:'财经快讯', at:'@d09:三条'}]},

 {scene:'v-meme', until:'@d11', says:'网友的反应：看不懂',
  img:PH+'crowd.jpg', title:'网友：？？？', caption:'说好的乱世买黄金呢'},

 {scene:'v-quiz', until:'@d12', says:'让观众先猜：问题出在哪',
  q:'问题出在哪？', options:['战争','美元','利率'], answer:2, at:'@d11:利率'},

 {scene:'v-list', until:'@d13', says:'排除法：不是战争、不是美元，是利率',
  title:'到底<em>怪谁</em>', items:[{text:'战争', mark:'no', at:'@d12'},{text:'美元', mark:'no', at:'@d12:不是美元'},{text:'利率', mark:'ok', hl:true, at:'@d12:是利率'}], answer:{text:'问题出在利率', at:'@d12:利率'}},

 {scene:'v-chain', until:'@d14', says:'因果链：打仗 → 油价 → 通胀 → 加息',
  title:'一环扣一环', items:[{title:'打仗推高油价', color:'red', at:'@d13'},{title:'通胀压不住', color:'steel', at:'@d13:通胀'},{title:'只能加息', at:'@d13:只能'}]},

 {scene:'v-data', until:'@d15', says:'三个数：油价、通胀、美债利率',
  title:'三个数', rows:[{label:'油价', value:'$104', at:'@d14'},{label:'通胀', value:'3.6%', at:'@d14:通胀'},{label:'美债利率', value:'4.9%', hl:true, at:'@d14:美债'}]},

 {scene:'v-vs', until:'@d16', says:'黄金没利息，美债有 4.9%',
  title:'钱放哪', left:{title:'黄金', value:'0%', sub:'不生利息', color:'gold'}, right:{title:'美债', value:'4.9%', sub:'每年稳拿', color:'navy', at:'@d15:美债'}, verdict:{text:'利率越高，黄金越吃亏', at:'@d15:四点九'}},

 {scene:'v-table', until:'@d17', says:'三样东西横着比',
  title:'放一起比', cols:['','黄金','美债','美股'], rows:[['利息','没有','4.9%','看分红'],['风险','中','低','高'],['好卖','最好卖','好卖','好卖']], rowAt:['@d16:利息','@d16:风险','@d16:好不好卖'], hlCol:1},

 {scene:'v-bars', until:'@d18', says:'谁跌得多（示意）',
  title:'10 月谁跌得多', items:[{label:'黄金', value:'-6.9%', hl:true, at:'@d17:黄金'},{label:'美股', value:'-5.2%', at:'@d17:美股'},{label:'原油', value:'+8%', at:'@d17:还是'}], source:'示意数据'},

 {scene:'v-pie', until:'@d19', says:'急用钱时先卖什么（示意）',
  title:'先卖什么', items:[{label:'黄金', value:45},{label:'美债', value:30},{label:'股票', value:25}], center:'急用钱', source:'示意数据'},

 {scene:'v-sum', until:'@d20', says:'算一笔账：少赚的利息加跌价',
  title:'100 万黄金', items:[{label:'少赚利息', value:'4.9万', at:'@d19:少赚'},{label:'跌价', value:'6.9万', at:'@d19:再加'}], total:{label:'一共亏', value:'11.8万', at:'@d19:跌价'}},

 {scene:'v-brand', until:'@d21', says:'谁决定利率',
  title:'谁说了算', items:[{name:'美联储', sub:'加不加息', color:'navy', keep:true},{name:'财政部', sub:'发多少债', color:'steel'},{name:'华尔街', sub:'押哪边', color:'charcoal'}], dimAt:'@d20:这几家'},

 {scene:'v-phone', until:'@d22', says:'行情软件里满屏下跌',
  img:PH+'app.jpg', title:'打开软件', scroll:.6, tags:[{text:'黄金 -6.9%', at:'@d21:满屏'},{text:'全是绿的', at:'@d21:绿'}]},

 {scene:'v-collage', until:'@d23', says:'金条、油轮、交易所是连着的',
  title:'一根线上', items:[{img:PH+'chip.jpg', label:'金条', at:'@d22'},{img:PH+'site.jpg', label:'油轮', at:'@d22:油轮'},{img:PH+'stage.jpg', label:'交易所', at:'@d22:交易所'}]},

 {scene:'v-quote', until:'@d24', says:'有人预计 12 月还要加息',
  text:'十二月\n<em>可能还要加</em>', who:'市场预期', role:'利率期货：75% 概率', photo:PH+'face_a.jpg', brow:'引语', skin:'paper'},

 {scene:'v-number', says:'记住 4.9 这个数',
  value:'4.9%', brow:'美债利率', label:'黄金的对手', skin:'paper'},
]);
return K.go();
})();
