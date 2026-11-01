// 模板示例片：每个场景用一次。用来看模板长什么样、照着学镜头表的写法；不要照着它的镜头顺序做新片。
// 素材全是 assets/kit/ph/ 里的占位图（face_*.jpg 是头像照片的占位）；数字取自《AI到底有多烧钱》第六版文案，排行榜和图表的分年数据是示意。
window.ready=(async()=>{
const F=await FB.init({fonts:KIT.FONTS});
const K=await KIT.use(F);
const PH='assets/kit/ph/';

await K.film([
 // ---------- 开头钩子：关键词快闪 ----------
 {scene:'flash', until:'@d01', says:'开头：全网都在说"烧钱"',
  keyword:'烧钱', items:[
   {cat:'资讯 · 2026-10-02', left:'大模型的', right:'竞赛', sum:'示例摘要：几家公司的投入都在涨'},
   {cat:'问答 · 2026-10-05', left:'AI 到底有多', right:'？', sum:'示例摘要：一个开放式的问题'},
   {cat:'视频 · 2026-10-08', left:'数据中心', right:'进入千亿级', sum:'示例摘要：数据中心的规模'},
   {cat:'资讯 · 2026-10-11', left:'不', right:'就会掉队', sum:'示例摘要：公司为什么停不下来'},
   {cat:'讨论 · 2026-10-13', left:'这样', right:'值不值', sum:'示例摘要：大家在争论'},
   {cat:'资讯 · 2026-10-16', left:'算力', right:'没有尽头', sum:'示例摘要：算力需求'},
   {cat:'问答 · 2026-10-20', left:'谁在', right:'谁在赚钱', sum:'示例摘要：钱流向了谁'},
   {cat:'视频 · 2026-10-24', left:'一年', right:'七千亿', sum:'示例摘要：四家的总投入'},
  ]},

 // ---------- 并列几家：圆盘一排，先灰着占位，念到谁亮谁 ----------
 {scene:'discs', until:'@d02', says:'砸钱的是这四家',
  items:[
   {id:'goog', name:'谷歌', color:'google', at:'@d01:谷歌'},
   {id:'msft', name:'微软', color:'microsoft', at:'@d01:微软'},
   {id:'amzn', name:'亚马逊', color:'amazon', at:'@d01:亚马逊'},
   {id:'meta', name:'Meta', color:'meta', at:'@d01:Meta'},
  ],
  steps:[{at:'@d01:这四家', light:'all'}]},

 // ---------- 一个数：上一镜倒成桌面，数立在上面滚到总数 ----------
 {scene:'number', until:'@title', enter:'flat', says:'四家加起来一年 7250 亿',
  value:'$7250亿', brow:'四家 · 2026 AI 资本开支', en:'BIG FOUR · AI CAPEX 2026',
  roll:{from:'$1800亿', at:'@d02:加起来', stop:'@d02:七千'}},

 // ---------- 片名：底下换实拍 ----------
 {scene:'title', until:'@d03', says:'这条片要算这笔账',
  title:'AI到底有多烧钱', brow:'$725,000,000,000', en:'How much is AI burning',
  items:[PH+'servers.jpg', PH+'site.jpg', PH+'city.jpg', PH+'chip.jpg']},

 // ---------- 两样东西并列：画框甩进来，一个数分成两路；最后芯片画框推满屏 ----------
 {scene:'frames', until:'@d04', says:'钱的大头流向芯片和数据中心',
  pin:{value:'$7250亿'},
  items:[{img:PH+'chip.jpg', label:'芯片', at:'@d03:芯片'}, {img:PH+'servers.jpg', label:'数据中心', at:'@d03:数据中心'}],
  fill:{i:0, at:'@d03:END-0.1'}},

 // ---------- 全屏实拍：接住推满屏的画框 ----------
 {scene:'footage', until:'@d04:市值', says:'卖芯片的就是英伟达',
  img:PH+'chip.jpg', settle:true, push:[1,1.05]},

 // ---------- 人站在巨字前面，字随话翻 ----------
 {scene:'person', until:'@d05', says:'英伟达 = 全球市值第一',
  img:PH+'person.png', color:'nvidia', words:['5.2','万亿'], brow:'英伟达 · 市值', en:'NVIDIA · MARKET CAP',
  flip:[{at:'@d04:全世界', words:['全球','第一']}]},

 // ---------- 反差：按真实面积并排 ----------
 {scene:'versus', until:'@d06', enter:'push', says:'OpenAI 估值很高，收入很小',
  items:[
   {id:'val', name:'估值', color:'openai', tag:{label:'OpenAI 估值', value:'$8520亿'}},
   {id:'rev', name:'收入', color:'teal', tag:{label:'今年收入', value:'$360亿'}, at:'@d05:收入'},
  ]},

 // ---------- 出处：原文整页 → 特写 → 荧光笔 ----------
 {scene:'article', until:'@d06:净烧', says:'亏损的数有出处',
  mock:{source:'报道', date:'2026-10-02', title:'OpenAI 预计 2030 年前累计烧钱约 2780 亿美元',
   body:['（示例排版：截不到原文时，用核实过的文字排一页通用样式，不放任何真实网站的标志。）','报道称，这家公司在算力上的投入会继续增加，收入的增长暂时追不上支出。'],
   mark:'2780 亿美元'},
  zoom:'@d06:从今年'},

 // ---------- 白底图表：线跟着话画，累计数跟着滚 ----------
 {scene:'chart', until:'@d07', enter:'flat', says:'到 2030 年累计要亏 2780 亿',
  title:'OpenAI 累计净烧钱（示意）', sub:'Cumulative cash burn',
  x:['2026','2027','2028','2029','2030'], values:[-120,-380,-860,-1600,-2780], unit:'亿',
  draw:{at:'@d06:净烧', until:'@d06:两千七百'}, total:{label:'累计净烧', from:'$0', to:'-$2780亿'}},

 // ---------- 关系网：钱流到哪镜头跟到哪，中间弹出一张证据小卡 ----------
 {scene:'network', until:'@d09', says:'钱在三家之间转了一圈，回到英伟达',
  nodes:[
   {id:'nvda', name:'英伟达', color:'nvidia', photo:PH+'face_a.jpg'},
   {id:'oai', name:'OpenAI', color:'openai', photo:PH+'face_b.jpg'},
   {id:'orcl', name:'甲骨文', color:'oracle', photo:PH+'face_c.jpg'},
  ],
  links:[{from:'nvda', to:'oai', text:'投资'}, {from:'oai', to:'orcl', text:'买算力'}, {from:'orcl', to:'nvda', text:'买芯片'}],
  steps:[
   {at:'@d07', focus:'nvda'},
   {at:'@d07:投钱', link:'nvda>oai', focus:['nvda','oai']},
   {at:'@d07:投钱+0.5', pop:{img:PH+'tv.jpg', from:'nvda>oai', back:'@d07:花钱'}},
   {at:'@d07:花钱', link:'oai>orcl', focus:['oai','orcl']},
   {at:'@d07:拿钱', link:'orcl>nvda', focus:['orcl','nvda']},
   {at:'@d08:转了一圈', focus:'all', loop:['nvda>oai','oai>orcl','orcl>nvda']},
   {at:'@d08:英伟达', focus:'nvda'},
  ]},

 // ---------- 占比：一个环，讲到的那一块亮起来 ----------
 {scene:'share', until:'@d10', says:'英伟达一家占了八成左右',
  title:'全球 AI 芯片', parts:[{label:'英伟达', value:80, color:'nvidia'}, {label:'其他', value:20, color:'slate'}],
  focus:[{at:'@d09:八成', i:0}]},

 // ---------- 时间线：念到哪年镜头推到哪年 ----------
 {scene:'timeline', until:'@d11', says:'三年里钱越砸越多',
  nodes:[
   {id:'y22', year:'2022', title:'ChatGPT 上线', color:'openai', at:'@d10:二〇二二'},
   {id:'y24', year:'2024', title:'英伟达市值破三万亿', color:'nvidia', at:'@d10:二〇二四'},
   {id:'y26', year:'2026', title:'四家砸 7250 亿', color:'red', at:'@d10:今年'},
  ]},

 // ---------- 一群里拎出一个：平铺的卡片，主角放大前移、其余压暗 ----------
 {scene:'cards3d', until:'@d13', says:'各国都在砸钱，最大的是美国',
  cards:[{title:'美国',color:'navy'},{title:'欧盟',color:'blue'},{title:'日本',color:'wine'},{title:'英国',color:'steel'},
   {title:'法国',color:'navy'},{title:'德国',color:'slate'},{title:'韩国',color:'teal'},{title:'印度',color:'amber'}],
  key:0, keyAt:'@d12:还是', text:{zh:'出手最大', at:'@d12:美国'}},

 // ---------- 排行榜：镜头从末尾走到第一名（示例数据） ----------
 {scene:'ranking', until:'@d14', says:'排个队，差距一眼可见（示例数据）',
  title:'示例数据 · 不是真实排名',
  rows:[{name:'公司甲',value:'$1800亿',color:'blue'},{name:'公司乙',value:'$1500亿',color:'steel'},{name:'公司丙',value:'$1200亿',color:'amber'},
   {name:'公司丁',value:'$900亿',color:'teal'},{name:'公司戊',value:'$500亿',color:'brick'},{name:'公司己',value:'$300亿',color:'slate'}],
  climb:'@d13:差距'},

 // ---------- 柱子：长出来时镜头跟着往上，括号沿着差距画出来 ----------
 {scene:'bars', until:'@d15', says:'投入和回报差一大截',
  bars:[{label:'每年砸进去', value:'$7250亿', color:'red', at:'@d14:砸进去'},{label:'收回来的', value:'?', n:900, color:'slate', at:'@d14:收回来'}],
  gap:{at:'@d14:差着', a:1, b:0, text:'差一大截'}},

 // ---------- 流程：一步步亮起，打勾；最后一环灰着 ----------
 {scene:'flow', until:'@d16', says:'链条的最后一环还不知道',
  nodes:[
   {id:'c1', title:'算力', color:'steel', pos:[0,0], at:'@d15:算力'},
   {id:'c2', title:'模型', color:'navy', pos:[1,0], at:'@d15:模型'},
   {id:'c3', title:'应用', color:'teal', pos:[2,0], at:'@d15:应用'},
   {id:'c4', title:'收回钱', color:'red', pos:[3,0], at:'@d15:赚回来'},
  ],
  links:[{from:'c1',to:'c2'},{from:'c2',to:'c3'},{from:'c3',to:'c4'}],
  steps:[{at:'@d15:训出', mark:{c1:'ok'}}, {at:'@d15:做成', mark:{c2:'ok'}}, {at:'@d15:能不能', mark:{c3:'ok'}}, {at:'@d15:没人知道', focus:'c4', gray:'c4'}]},

 // ---------- 新闻摊在桌面上：镜头沿桌面滑过去，抬高看全，念到证据时抬平刷黄 ----------
 {scene:'desk', until:'@d17:追着问', says:'各家还在加码',
  items:[{img:PH+'news_a.jpg', at:'@d16:各家'}, {img:PH+'news_b.jpg', at:'@d16:最近', hl:[176,306,272,80]}, {img:PH+'news_c.jpg', at:'@d16:新闻'}, {img:PH+'news_d.jpg'}],
  all:'@d16:还都', read:{i:1, at:'@d16:加码'}},

 // ---------- 反应窗：上一镜冻住压暗，撑开一个窗口 ----------
 {scene:'popup', until:'@d18', says:'连新闻台都在问',
  img:PH+'tv.jpg', back:'@d17:END'},

 // ---------- 钉住一个数，底下换实拍 ----------
 {scene:'montage', until:'@d19', says:'这七千多亿 = 这些楼和芯片',
  pin:{value:'$7250亿', brow:'一年'}, items:[PH+'site.jpg', PH+'servers.jpg', PH+'chip.jpg', PH+'city.jpg']},

 // ---------- 手写一镜（模板对不上时）：这里是一张简单的结尾卡 ----------
 {scene:'custom', says:'结尾',
  render:(t,c)=>{const q=KIT.appear(t,c.t0+.1,.4,0);return c.bg(t,{x:960,y:540,s:1+.02*(t-c.t0)},null,{tone:'charcoal',glow:false})+KIT.chrome('下期见',{en:'See you next time',size:150,o:q.o});}},
]);
return K.go();
})();
