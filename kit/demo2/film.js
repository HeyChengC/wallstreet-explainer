// 模板示例片二：后加的 11 个场景各用一次（equation change quote profile statement headlines compare stats agenda device map）。
// 用来看模板长什么样、照着学镜头表的写法；不要照着它的镜头顺序做新片。
// 素材全是 assets/kit/ph/ 里的占位图（face_*.jpg 是头像照片的占位）。四家投入、市值、估值取自《AI到底有多烧钱》第六版文案；对比的两家公司、标题墙、App 界面是示例。
window.ready=(async()=>{
const F=await FB.init({fonts:KIT.FONTS});
const K=await KIT.use(F);
const PH='assets/kit/ph/';

await K.film([
 // ---------- 开头钩子：算一笔账，一项项出来，结果金色、下面画线 ----------
 {scene:'equation', until:'@e01', says:'一年七千多亿，摊到每天将近二十亿',
  brow:'四家 · 2026 AI 资本开支', en:'BIG FOUR · AI CAPEX',
  terms:[{value:'$7250亿', label:'一年'}, {op:'÷'}, {value:'365', label:'天', at:'@e00:每一天'}, {op:'≈'}, {value:'$20亿', label:'每天', at:'@e00:将近'}]},

 // ---------- 目录：念到哪一章亮哪一章（长片在钩子后面列目录） ----------
 {scene:'agenda', until:'@e02', says:'这条片要讲四件事',
  title:'AI 这笔钱，分四段讲', items:['钱从哪来','钱去哪了','谁在赚钱','能不能赚回来'],
  at:['@e01:钱从哪来','@e01:钱去哪了','@e01:谁在赚钱','@e01:能不能']},

 // ---------- 示意地图：念到哪里镜头飞到哪里，航线画出来 ----------
 {scene:'map', until:'@e03:创始人', enter:'through', says:'一颗芯片要跨三个地方才造得出来',
  nodes:[
   {id:'ca', lon:-121.96, lat:37.35, label:'加州 · 设计', at:'@e02:加州'},
   {id:'hc', lon:120.97, lat:24.8, label:'新竹 · 制造', at:'@e02:新竹'},
   {id:'nl', lon:5.4, lat:51.41, label:'荷兰 · 光刻机'},
  ],
  links:[{from:'ca', to:'hc', text:'设计图'}, {from:'nl', to:'hc', text:'光刻机'}],
  steps:[{at:'@e02:新竹', link:'ca>hc'}, {at:'@e02:荷兰', show:'nl', link:'nl>hc', focus:'all'}, {at:'@e03', focus:'ca'}]},

 // ---------- 人物第一次出场：抠像 + 名字 + 身份 + 三条要紧的事 ----------
 {scene:'profile', until:'@e04', says:'设计芯片的是英伟达，掌舵的是黄仁勋',
  name:'黄仁勋', en:'Jensen Huang', title:'英伟达创始人、CEO', img:PH+'person.png', color:'nvidia',
  facts:[{text:'1993 年和两位朋友创立英伟达', at:'@e03:一九九三'}, {text:'从游戏显卡做起', at:'@e03:游戏显卡'}, {text:'当了三十多年 CEO', at:'@e03:三十多年'}]},

 // ---------- 原话：照片圆盘 + 一句话，关键几个字刷金 ----------
 {scene:'quote', until:'@e05', says:'他自己说：买得越多，省得越多',
  text:'买得越多，省得越多。', hl:'省得越多', hlAt:'@e04:省得',
  who:{name:'黄仁勋', title:'英伟达 CEO', photo:PH+'face_a.jpg', color:'nvidia'},
  orig:'The more you buy, the more you save.', source:'2023 年台北电脑展主题演讲'},

 // ---------- 从多少变成多少：旧的灰、箭头画过去、新的金色 ----------
 {scene:'change', until:'@e06', enter:'blur', says:'两年里英伟达市值涨了七成多',
  brow:'英伟达 · 市值', en:'NVIDIA · MARKET CAP',
  from:{value:'$3万亿', label:'2024 年'}, to:{value:'$5.2万亿', label:'2026 年', at:'@e05:五万'}, mult:'×1.7'},

 // ---------- 几个数一字排开：念到哪个哪个出来 ----------
 {scene:'stats', until:'@e07', says:'投入、估值、市值放在一起看',
  items:[{label:'四家一年投入', value:'$7250亿', at:'@e06:四家'}, {label:'OpenAI 估值', value:'$8520亿', at:'@e06:OpenAI'}, {label:'英伟达市值', value:'$5.2万亿', at:'@e06:英伟达'}]},

 // ---------- 两边对比：一行行比下去，赢的一边亮（示例数据） ----------
 {scene:'compare', until:'@e08', enter:'whip', says:'甲赚得多，乙长得快（示例数据）',
  brow:'示例数据 · 不是真实公司',
  left:{title:'公司甲', color:'green'}, right:{title:'公司乙', color:'red'},
  rows:[{label:'营收', left:'$600亿', right:'$250亿', win:'left', at:'@e07:营收'},
   {label:'利润率', left:'55%', right:'10%', win:'left', at:'@e07:利润率'},
   {label:'增速', left:'20%', right:'60%', win:'right', at:'@e07:增速'}]},

 // ---------- 标题墙：齐刷刷出来，再只亮起最要紧的一句 ----------
 {scene:'headlines', until:'@e09', says:'说法很多，要紧的只有一句：什么时候赚回来',
  items:[
   {src:'示例 · 资讯', date:'10-02', title:'AI 芯片还要排多久的队'},
   {src:'示例 · 评论', date:'10-05', title:'数据中心的电从哪里来'},
   {src:'示例 · 资讯', date:'10-08', title:'大模型价格战打到了几分钱'},
   {src:'示例 · 问答', date:'10-11', title:'这钱什么时候能赚回来？'},
   {src:'示例 · 视频', date:'10-13', title:'一年砸七千亿，到底值不值'},
   {src:'示例 · 资讯', date:'10-16', title:'算力租金还在涨'},
   {src:'示例 · 讨论', date:'10-20', title:'AI 应用到底谁在用'},
   {src:'示例 · 资讯', date:'10-24', title:'各家都说明年还要加码'},
  ],
  pick:{i:3, at:'@e08:最要紧'}, mark:'什么时候能赚回来'},

 // ---------- 产品界面：装进手机外框，推近到要看的那一块 ----------
 {scene:'device', until:'@e10', enter:'through', says:'钱要从应用里赚回来：看有没有人掏钱',
  img:PH+'app.jpg', hl:[48,1150,984,250], zoom:'@e09:愿不愿意', label:'掏钱的人（示意）'},

 // ---------- 金句：一两行大字，关键词刷金 ----------
 {scene:'statement', says:'结论：卖铲子的最赚钱',
  brow:'说到底', lines:['卖铲子的','最赚钱'], hl:['最赚钱'], at:['@e10:卖铲子','@e10:最赚钱'],
  items:[PH+'site.jpg', PH+'servers.jpg', PH+'chip.jpg']},
]);
return K.go();
})();
