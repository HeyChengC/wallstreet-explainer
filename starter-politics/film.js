// film.js —— 时政片的起点（new_film.mjs <目录> --politics 建出来的就是这个）
// 一镜一个场景，写 says / until / enter，时刻一律 '@句id:词'。
// 时政多两样：claimIds（这镜讲 editorial.json 里的哪几条事实）、K.politics.badges（来源角标）。
// 检查：python scripts/check_editorial.py editorial.json
//       node scripts/render.mjs --dir . --check-policy politics --check
window.ready=(async()=>{
const F=await FB.init({
 counts:['assets/clips/counts.json'],
 cuts:[],
 fonts:KIT.FONTS,
});
const K=await KIT.use(F);

// 来源角标：念到哪段挂哪段的出处。换成你自己核实过的来源。
// 这里用本地虚构材料的名字，是因为起点自带的 editorial.json 就是虚构样例。
K.politics.badges([
 {from:'@b06', until:'@b08', source:'本地測試材料（虛構）', nature:'fiction'},
 {from:'@b11', until:'@b12', source:'本片判斷', nature:'analysis'},
]);
// 这条起点是虚构样例，所以开着常驻标记。换成真实题材时改成 false 或删掉这一行，
// 同时把 editorial.json 的 content_mode 改成 factual、sources 换成真实来源。
K.politics.fiction(true,'虛構演繹 · 人物與情節均為虛構');

await K.film([
 // 0 钩子：一句话把这个缺口摆出来
 {scene:'statement', until:'@b02', says:'方案提到收费，却没给费率和日期，这是全片要追问的缺口', claimIds:['c1'],
  lines:['提了收費','沒給價格'], brow:'某市 · 過海隧道', tone:'navy'},

 // 1 数字：提到了几次，给了几个数字
 {scene:'number', until:'@b03', says:'方案四次提到收费，但一个费率、一个起始日都没有', claimIds:['c1'],
  value:'0', brow:'方案給出的費率與起始日', en:'RATES OR START DATES',
  sub:{label:'提到「收費」', value:'4', at:'@b02:四次'}, tone:'navy'},

 // 2 账本：事实是科目怎么列，判断是"这意味着开关装好了"
 {scene:'verdict', until:'@b06', says:'账面上维护支出列在收费收入项下；把它读成开关已装好是判断', claimIds:['c2'], sourceIds:['s2'],
  judgment:'開關裝在帳本裡', nature:'analysis',
  support:['中期預算：維護支出列在收費收入項下','方案 4 次提到收費，0 個費率'],
  tone:'navy'},

 // 3 事件骨架：节点各挂各的 cue
 {scene:'event-timeline', until:'@b11', says:'这条线的节点：发布、记者会、议会要求、十二月的观察点', claimIds:['c1','c3'],
  title:'怎麼走到今天', en:'HOW IT GOT HERE',
  events:[
   {date:'2026-09-16', who:'主管部門', title:'發布方案：4 次提收費，0 個費率', at:'@b06'},
   {date:'2026-10-02', who:'主管部門', title:'記者會：分階段推進', at:'@b08'},
   {date:'2026-10-20', who:'議會交通委員會', title:'要求三個月內交出測算', at:'@b09'},
   {date:'2026-12', who:'待觀察', title:'政策簡報會不會出現測算數字', at:'@b10', pending:true},
  ]},

 // 4 判断落点：判断 + 证据 + 条件 + 观察点
 {scene:'verdict', says:'我的判断：这一轮不会立刻收费，但开关已经装好，十二月是观察点', claimIds:['c4'],
  judgment:'這一輪不收，開關已經裝好', nature:'analysis', style:'objective',
  support:['方案未列時間表','帳本已掛收入項','議會要求交測算'],
  counter:{text:'若財政壓力緩解，測算可能繼續往後拖', at:'@b11'},
  watch:{text:'十二月的政策簡報', at:'@b12'},
  tone:'navy'},
]);
return K.go();
})();
