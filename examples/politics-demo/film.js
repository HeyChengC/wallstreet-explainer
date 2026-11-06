// film.js —— 时政评论示例（虚构海岚市，全程"虚构演绎"标记）
// 这个例子演示：三个时政场景、固定来源角标、事实/原话/分析分开标注、按 cue 逐点高亮。
// 素材全是自绘图形和本地虚构白皮书，没有任何真实新闻截图；因此 badges 里标的是本地合成资料，
// 不是真实媒体名——真做片时换成你核实过的来源。
window.ready=(async()=>{
const F=await FB.init({
 counts:['assets/clips/counts.json'],
 cuts:[],
 fonts:KIT.FONTS,
});
const K=await KIT.use(F);

// 虚构演绎：全片右上角常驻（content_mode:'fiction' 必须开，文字要与 editorial.json 的 fiction_marker 一致）
K.politics.fiction(true,'虛構演繹 · 人物與情節均為虛構');

// 来源角标：每一段只挂这一段真正在讲的那个来源和性质。
// 时间写 cue，跟着配音走；换来源就换一条，不做"全程一个大来源"。
K.politics.badges([
 {from:'@b07', until:'@b10', source:'海嵐交通白皮書（虛構）', nature:'fiction'},
 {from:'@b09', until:'@b10', source:'海嵐觀察 · 逐頁核對（虛構）', nature:'fiction'},
 {from:'@b10', until:'@b11', source:'交通局記者會（虛構）', nature:'fiction'},
 {from:'@b11', until:'@b13', source:'交通委員會決議（虛構）', nature:'fiction'},
 {from:'@b18', until:'@b21', source:'本片判斷', nature:'analysis'},
]);

await K.film([
 // 0 钩子：把最反常的事实先摆出来（不是"没提收费"，是"提了四次、一个数字没有"）
 {scene:'statement', until:'@b02', says:'方案四次提到收费，却没给费率与日期，这是全片要追问的缺口', claimIds:['c1'],
  lines:['提了收費','沒給價格'], brow:'海嵐 · 過海隧道', tone:'navy'},

 // 1 把缺口变成一个数：提到了，但一个数字都没有
 {scene:'number', until:'@b03', says:'方案四次提到收费，但没有一个费率、没有一个起始日', claimIds:['c1'],
  value:'0', brow:'白皮書給出的費率與收費起始日', en:'RATES OR START DATES',
  sub:{label:'提到「收費」', value:'4', at:'@b02:四次'}, tone:'navy'},

 // 2 双方第一回合
 {scene:'stance-matrix', until:'@b05', says:'交通局说另行公布，议会说另行公布等于不公布', claimIds:['c3','c4'],
  topic:'「另行公布」是什麼意思', topicEn:'PUBLISHED SEPARATELY',
  sides:[
   {name:'交通局', tag:'行政部門', color:'steel', view:'收費方案另行公布', basis:'記者會發言', at:'@b03'},
   {name:'市議會交通委員會', short:'交通委員會', tag:'立法機關', color:'amber', view:'另行公布，等於不公布', basis:'委員會公開回應', at:'@b04'},
  ]},

 // 3 账本：事实是"科目怎么列"，判断是"这意味着开关装好了"
 {scene:'verdict', until:'@b07', says:'账面上隧道维护支出列在通行费收入项下；把这读成开关已经装好是判断，不是事实', claimIds:['c2'],
  judgment:'開關裝在帳本裡', nature:'analysis',
  support:['中期預算：維護支出列在通行費收入項下','白皮書 4 次提到收費，0 個費率'],
  tone:'navy'},

 // 4 事件骨架：四个节点，各挂各的 cue（念到哪天亮哪天）
 {scene:'event-timeline', until:'@b13', says:'这条线的四个节点：白皮书、记者会、议会要求、十二月的观察点', claimIds:['c1','c3','c4'],
  title:'怎麼走到今天', en:'HOW IT GOT HERE',
  events:[
   {date:'2026-09-16', who:'市政府', title:'發布白皮書：4 次提收費，0 個費率', at:'@b07'},
   {date:'2026-10-02', who:'交通局', title:'記者會：分階段推進', at:'@b10'},
   {date:'2026-10-20', who:'交通委員會', title:'要求三個月內交出測算', at:'@b11'},
   {date:'2026-12', who:'待觀察', title:'政策簡報會不會出現測算數字', at:'@b12', pending:true},
  ]},

 // 5 三方分歧摊开（原先的独立 quote 镜并入这一镜，避免同一句证据讲两遍）
 {scene:'stance-matrix', until:'@b18', says:'同一件事，交通局、交通委员会、市民团体各自的说法和依据', claimIds:['c3','c4','c5'],
  topic:'分歧在哪裡', topicEn:'WHERE THEY SPLIT',
  sides:[
   {name:'交通局', tag:'行政部門', color:'steel', view:'這是程序安排，不是隱瞞', basis:'記者會發言（虛構）', at:'@b14'},
   {name:'市議會交通委員會', short:'交通委員會', tag:'立法機關', color:'amber', view:'先交測算全文，再談', basis:'委員會決議（虛構）', at:'@b15'},
   {name:'海嵐觀察', tag:'市民團體', color:'teal', view:'通過後收費成技術調整，不再經議會', basis:'逐頁核對（虛構）', at:'@b16'},
  ]},

 // 6 把分歧收成一句
 {scene:'statement', until:'@b19', says:'三方的分歧不在收不收费，而在谁来决定收费', claimIds:['c5'],
  lines:['不是收不收','是誰來決定'], brow:'分歧的形狀', tone:'navy'},

 // 7 判断落点
 {scene:'verdict', says:'我的判断：这一轮不会立刻收费，但开关已经装好，十二月是观察点', claimIds:['c6'], sourceIds:['s1'],
  judgment:'這一輪不收，開關已經裝好', nature:'analysis', style:'objective',
  support:['方案未列時間表','帳本已掛收入項','議會要求交測算'],
  counter:{text:'若財政壓力緩解，測算可能繼續往後拖', at:'@b19'},
  watch:{text:'十二月的政策簡報', at:'@b20'},
  tone:'navy'},
]);
return K.go();
})();

