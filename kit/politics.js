// politics.js —— 时政评论的扩展（载入顺序：scenes.js → scenes_plus.js → host.js → politics.js）
// 三样东西，都是财经片里没有的：
//   1. 三个场景：stance-matrix（同题多方立场）、event-timeline（事件节点 + 待观察）、verdict（判断 + 证据 + 条件 + 下一步）
//   2. 固定来源／性质角标：挂在 frame 层，不随镜头缩放，不压字幕（K.go 里读 KIT.politics.badgeAt(t)）
//   3. 颜色只是辅助：每一处都带文字标签（事实 / 原话 / 分析 / 未证实 / 虚构演绎），不让观众靠颜色猜
// 用不用这套由片子决定：film.js 里写 KIT.politics.badges([...])；不写就没有角标，其余和上游一模一样。
(()=>{
const K=KIT,{C,IO,E,lerp,f1,f3,col,mixc,alpha,fit,camSeq,bignum,brow,appear,label,textW,fitPx,FAM,SAFE,fx,unitHTML,num}=K;
const {L}=S25;
const A=v=>v==null?[]:Array.isArray(v)?v:[v];

// =====================================================================================
// 性质标签：事实 / 原话 / 分析 / 未证实 / 虚构演绎
// 文字永远在，颜色只是第二层（看不了色、截成黑白的观众也不丢信息）
// =====================================================================================
const NATURE={
 fact:{zh:'事实',en:'FACT',c:'#9fb6d6'},
 quote:{zh:'原话',en:'QUOTE',c:'#8fc3e8'},
 analysis:{zh:'分析',en:'ANALYSIS',c:'#e0c07a'},
 unverified:{zh:'未证实',en:'UNVERIFIED',c:'#e8965a'},
 fiction:{zh:'虚构演绎',en:'FICTION',c:'#b98fe0'}};
const natureOf=k=>NATURE[k]??null;

K.politics={NATURE,natureOf};

// ---------- 固定角标 ----------
// K.politics.badges([{from:'@b02', until:'@b05', source:'中央社 · 11/06', nature:'fact'}])
// 时间写 cue 字符串（和镜头表一样），也可以直接写秒数。不写 from 就从 0 开始，不写 until 就到片尾。
// 必须在 KIT.use(F) 拿到的 K 上调（那才有绑好的时间线）；cue 写错直接抛错，不静默退化成"从 0 秒出现"。
// 这些角标不在 K.film 的镜头表里，--check 的 cue 检查覆盖不到，所以这里自己抛。
let BADGES=[], TIMER=null;
// kit.js 的 use() 建好 timer 后调这个把 T 交给扩展
K.politics._bind=T=>{TIMER=T;};
const resolveT=(v,what)=>{
 if(v==null)return null;
 if(typeof v==='number')return v;
 if(typeof v!=='string'||v[0]!=='@')throw Error(`${what}：时刻要写成 '@b05'、'@b05:关键词' 或秒数，现在是 ${JSON.stringify(v)}`);
 if(!TIMER)throw Error(`${what}：时间线还没绑好（K.politics.badges 要在 const K=await KIT.use(F) 之后调）`);
 return TIMER(v);   // cue 写错由 timer 自己抛（"句子 b05 不存在"、"b05 里找不到某个词"）
};
K.politics.badges=list=>{
 BADGES=[];
 for(const b of A(list)){
  if(!b)continue;
  const from=b.from==null?0:resolveT(b.from,'来源角标 from');
  const until=b.until==null?Infinity:resolveT(b.until,'来源角标 until');
  if(until<=from)throw Error(`来源角标 ${b.source??b.nature??''}：until（${b.until}）要晚于 from（${b.from}）`);
  BADGES.push({...b,from,until});
 }
 return K;
};
// 全片常驻的虚构标记（content_mode:'fiction' 必须开）：右上角一直挂着，不随镜头动。
// text 要和 editorial.json 的 config.fiction_marker 一致；render --check-policy politics 会核对。
K.politics.fiction=(on,text)=>{FICTION=on!==false;if(text)FICTION_TEXT=String(text);return K;};
K.politics._fictionState=()=>({on:FICTION,text:FICTION_TEXT});
let FICTION=false, FICTION_TEXT='虛構演繹 · 人物與情節均為虛構';
// 某一时刻要显示的角标（帧层调用；只读，不改状态）
// 显示模式（K.politics.display）：
//   'full'          全部显示：来源 / 性质 / 虚构标记（默认，公开成片用）
//   'no-badges'     全关：来源、性质、虚构标记都不上屏，出处留 editorial.json（私人研究预览）
// 两种模式都**不影响** editorial.json 的校验：事实与分析的区分始终记在文件里。
K.politics.display=mode=>{
 if(!['full','no-badges'].includes(mode))throw Error(`K.politics.display 只有 full / no-badges，现在是 '${mode}'`);
 DISPLAY=mode;return K;
};
let DISPLAY='full';
K.politics._display=()=>DISPLAY;
K.politics.badgeAt=t=>{
 if(DISPLAY==='no-badges')return '';
 let out='',fic=FICTION;
 for(const b of BADGES){
  if(t<b.from||t>=b.until)continue;
  if(b.nature==='fiction')fic=true;
  const n=natureOf(b.nature);
  const kind=n?`<span class="pol-k" style="--kc:${n.c}">${n.zh}</span>`:'';
  const src=b.source?`<span class="pol-s">${b.source}</span>`:'';
  const pre=b.prefix?`<span class="pol-p">${b.prefix}</span>`:'';
  if(kind||src||pre)out+=`<div class="pol-badge${b.at==='right'?' pol-r':''}">${pre}${kind}${src}</div>`;
 }
 // 虚构演绎：全片常驻，右上角，不被别的角标挤掉
 if(fic)out+=`<div class="pol-fic">虛構演繹 · 人物與情節均為虛構</div>`;
 return out;
};

// ---------- 场景 1：stance-matrix（同题多方立场） ----------
// 同一件事，几方各自怎么说：主体明确、观点一句话、依据另一行；念到谁亮谁，其余压暗。
// 这不是"几位嘉宾同台"，画面里没有主持人也没有对话气泡——它是把公开表态摊开对照。
K.scene('stance-matrix',{
 says:'同一件事，这几方各自公开说了什么：谁、什么观点、拿什么当依据',
 use:'一个议题有两到四个明确主体在做公开表态（政党、政府、团体、当事各方），要点出分歧在哪',
 avoid:'只有一方（用 quote / statement）；各方说的不是同一件事（拆成两镜）；要逐项比数据（用 compare / bars）',
 need:['sides'],
 help:{topic:"顶上那句同题：'包機直航该不该现在开放'",topicEn:'同题下面的英文小字（可省）',
  sides:"[{name:'市議會交通委員會', short:'交通委員會', tag:'立法機關', color:'amber', view:'一句观点', basis:'依据：哪份文件、哪次发言', at:'@b05:委員會'}]：2–4 方，at 念到谁就亮谁；名字太长就写 short（卡上显示 short，name 留出处清单和首次全称）",
  quote:'true = 观点是原话摘录（会加引号，角标按原话）',note:'底下一条小字说明（可省）',tone:"底色（默认 navy）"},
 defaults:{tone:'navy'},minDur:2.4,
 beats:p=>A(p.sides).length,
 check(p,c){
  const ss=A(p.sides);
  if(ss.length<2)c.warn(`${c.tag}只有 ${ss.length} 方：立场对照至少两方，一方用 quote`);
  if(ss.length>4)c.warn(`${c.tag}有 ${ss.length} 方：一屏最多四列，超过就拆成两镜`);
  for(const s of ss){if(String(s.view??'').length>34)c.warn(`${c.tag}「${s.name}」的观点 ${String(s.view).length} 字：压到 30 字以内，依据放 basis`);}
 },
 make(p,c){
  const ss=A(p.sides).map((s,i)=>({...s,t:c.at(s.at)??c.t0+.25+i*.55,cl:col(s.color??'steel')}));
  const n=ss.length,G=n>=4?34:n===3?46:64;
  // 卡片区：y 200–770（角标在 800，字幕带 900 以下）。三方以上窄一点，两方宽一点。
  const W=Math.min(500,Math.floor((1620-(n-1)*G)/n)),H=560,Y=485;
  const tot=n*W+(n-1)*G,x0=960-tot/2+W/2;
  // 长镜头不推：这个场景一条常常二十秒以上，camSeq 的 drift 会累积成大幅推近
  const cam=camSeq([{t:c.t0,cam:{x:960,y:520,s:.985}},{t:c.t0+.3,cam:{x:960,y:520,s:1},d:1}],0);
  return t=>{
   const cc=cam(t),cp=cam(t-1/30);
   let cur=-1;ss.forEach((s,i)=>{if(t>=s.t)cur=i;});
   let h='';
   const tp=p.topic?brow({x:960,y:126,zh:p.topic,en:p.topicEn},{o:C((t-c.t0)/.35)}) :'';
   ss.forEach((s,i)=>{
    const on=i===cur,dim=cur<0?1:(on?1:.6),a=appear(t,s.t,.3,20),x=x0+i*(W+G);
    if(a.o<=0)return;
    const q=p.quote?'“':'';
    h+=`<div class="pol-side${on?' on':''}" style="left:${f1(x-W/2)}px;top:${f1(Y-H/2)}px;width:${W}px;height:${H}px;--pc:${s.cl};${fx({o:a.o,dy:a.dy,br:dim,sat:on?1:.72},'translate(0,0)')}">`+
     `<div class="pol-bar"></div>`+
     `<div class="pol-head"><div class="pol-name" style="font-size:${f1(Math.min(52,W*.118))}px">${s.short??s.name??''}</div>`+
     (s.tag?`<div class="pol-tag">${s.tag}</div>`:'')+`</div>`+
     `<div class="pol-view" style="font-size:${f1(Math.min(42,W*.092))}px">${q}${s.view??''}${q}</div>`+
     (s.basis?`<div class="pol-basis"><b>依据</b>${s.basis}</div>`:'')+
     `</div>`;
    // 亮起的那一方，卡片底部一条进度光带
    if(on){const k=E(C((t-s.t)/.5));h+=`<div class="pol-lit" style="left:${f1(x-W/2)}px;top:${f1(Y+H/2+14)}px;width:${f1(W*k)}px;--pc:${s.cl}"></div>`;}
   });
   if(p.note)h+=`<div class="pol-note" style="left:960px;top:${f1(Y+H/2+82)}px;opacity:${f3(C((t-c.t0)/.4))}">${p.note}</div>`;
   return c.bg(t,cc,cp,{tone:p.tone})+L(cc,cp,.5,tp)+L(cc,cp,1,h);
  };
 }
});

// ---------- 场景 2：event-timeline（事件节点 + 待观察） ----------
// 横轴上一个日期一个节点，节点下面一张卡：主体 + 发生了什么（+ 关联的原话句 id）。
// 念到哪个节点，哪个节点亮；最后一个可以是 pending（虚线圆 + "待观察"），代表还没发生、接下来要看的事。
K.scene('event-timeline',{
 says:'这件事按时间怎么一步步走到今天：哪天、谁、做了什么；最后那个还没发生的是什么',
 use:'两到五个关键节点按时间排；结尾要把"下一步看什么"立成待观察节点',
 avoid:'只有两个日期（用 bars / change）；要讲因果链而不是时序（用 chain / flow）',
 need:['events'],
 help:{events:"[{date:'2026-09-16',title:'行政長官發表施政報告',who:'特區政府',at:'@b03',pending:false}]：2–5 个，按时间排",
  title:'左上角眉题（可省）',en:'眉题英文小字（可省）',axis:'轴上的小字（默认什么都不写）',tone:"底色（默认 navy）"},
 defaults:{tone:'navy'},minDur:2.4,
 beats:p=>A(p.events).length,
 check(p,c){
  const es=A(p.events);
  if(es.length<2)c.warn(`${c.tag}只有 ${es.length} 个节点：时间线至少两个，一个用 statement`);
  if(es.length>5)c.warn(`${c.tag}有 ${es.length} 个节点：一屏最多五个，其余并进相邻节点`);
  const ds=es.map(e=>String(e.date??''));
  if(ds.some(d=>!/^\d{4}[-/.]\d{1,2}([-/.]\d{1,2})?$/.test(d)))c.warn(`${c.tag}日期要写成 2026-09-16 这样的绝对日期（"上周""近日"观众对不上时间轴）`);
  if(ds.slice().sort().join('|')!==ds.join('|'))c.warn(`${c.tag}节点不是按时间排的：时间轴的 left→right 必须是先→后`);
 },
 make(p,c){
  const es=A(p.events).map((e,i)=>({...e,t:c.at(e.at)??c.t0+.3+i*.6}));
  const n=es.length;
  // 按槽位排：每个节点占一格，卡片不大于格子，这样 n 个卡片在数学上不可能重叠
  const SLOT0=140, SLOT1=1780, slotW=(SLOT1-SLOT0)/n;
  const X=i=>SLOT0+slotW*(i+.5);
  const CW=Math.min(340,Math.floor(slotW-20)), Y=470;
  const cam=camSeq([{t:c.t0,cam:{x:960,y:520,s:.985}},{t:c.t0+.3,cam:{x:960,y:520,s:1},d:1}],0);
  return t=>{
   const cc=cam(t),cp=cam(t-1/30);
   let cur=-1;es.forEach((e,i)=>{if(t>=e.t)cur=i;});
   let h='';
   // 轴：一条淡线，已经走过的段落逐段亮（不用全局进度算，避免段间长度不等时错位）
   h+=`<div class="pol-axis" style="left:${f1(SLOT0)}px;top:${Y}px;width:${f1(SLOT1-SLOT0)}px"></div>`;
   for(let i=1;i<n;i++){
    if(t<es[i].t)continue;
    const k=E(C((t-es[i].t)/.45));
    h+=`<div class="pol-axis-on" style="left:${f1(X(i-1))}px;top:${Y}px;width:${f1((X(i)-X(i-1))*k)}px"></div>`;
   }
   es.forEach((e,i)=>{
    const on=i===cur,pend=!!e.pending,a=appear(t,e.t,.3,16),x=X(i);
    // 日期在轴上方，居中于节点
    h+=`<div class="pol-date${pend?' pend':''}" style="left:${f1(x)}px;top:${Y-74}px;opacity:${f3(a.o)};transform:translate(-50%,0)">${e.date??''}${pend?' · 待观察':''}</div>`;
    // 节点
    h+=`<div class="pol-dot${on?' on':''}${pend?' pend':''}" style="left:${f1(x)}px;top:${Y}px;opacity:${f3(a.o)}"></div>`;
    if(a.o<=0)return;
    // 卡片在轴下方，居中于本槽位（宽度已保证小于槽宽）
    const xw=x-CW/2,yy=Y+58;
    h+=`<div class="pol-ev${on?' on':''}${pend?' pend':''}" style="left:${f1(xw)}px;top:${f1(yy)}px;width:${CW}px;--pc:${pend?'#8f8ad8':col(e.color??'steel')};${fx({o:a.o*(on||cur<0?1:.7),dy:a.dy},'translate(0,0)')}">`+
     (e.who?`<div class="pol-ev-w">${e.who}</div>`:'')+
     `<div class="pol-ev-t" style="font-size:${f1(Math.min(29,CW*.086))}px">${e.title??''}</div>`+
     (e.note?`<div class="pol-ev-n">${e.note}</div>`:'')+
     `</div>`;
   });
   const tp=p.title?brow({x:200,y:118,zh:p.title,en:p.en,anchor:'l'},{o:C((t-c.t0)/.35)}):'';
   return c.bg(t,cc,cp,{tone:p.tone})+L(cc,cp,.5,tp)+L(cc,cp,1,h);
  };
 }
});

// ---------- 场景 3：verdict（判断 + 证据 + 条件 + 下一步） ----------
// 评论的落点：把判断说清、把支撑它的证据列出来、主动给出一个反证或条件、最后留一个可验证的观察指标。
// 四种风格在这里的差别是字号和取舍：objective 会强调"条件"，outrage / adversarial 会把判断放大、条件缩到一行。
K.scene('verdict',{
 says:'我的判断是什么、凭什么、什么情况下这个判断会错、接下来看什么',
 use:'一段论证的落点；也是整条的结尾（比 statement 多证据、条件和观察指标）',
 avoid:'只想压一句金句（用 statement）；证据还没讲完（先把证据讲完再来）',
 need:['judgment'],
 help:{judgment:"'這一輪不會立刻鬆綁'：一句判断（20 字以内）",
  support:"['公報全文沒出現時間表', {text:'兩次質詢都回到同一個理由', at:'@b12:兩次'}]：2–3 条证据；字符串=按默认节奏出来，对象=念到 at 那一刻才出来（要逐字对齐就写 at）",
  counter:"'如果下季度物價回落，時間表可能提前'，或 {text:'…', at:'@b13:如果'}：一个条件或反证（可省，但建议留）",
  watch:"'下一個觀察點：12 月的政策簡報'，或 {text:'…', at:'@b14'}：下一步看什么（可省）",
  nature:"'analysis'（默认）/ 'fact'：判断的性质标签",stance:"'neutral' / 'green' / 'blue' / 'establishment' / 'pan-dem'：只影响标注措辞，不改事实",
  style:"'objective' / 'traffic' / 'outrage' / 'adversarial'：影响大小和强调（默认 objective）",tone:"底色（默认 navy）"},
 defaults:{tone:'navy',style:'objective'},minDur:2.6,
 // 落点数：证据 + 条件 + 观察点（agent 侧只用来判断"这一镜够不够长"，实际时刻在 make 里解析）
 beats:p=>A(p.support).length+(p.counter?1:0)+(p.watch?1:0),
 check(p,c){
  if(String(p.judgment).length>24)c.warn(`${c.tag}判断 ${String(p.judgment).length} 字：一句判断压到 20 字以内，长的拆到取证那几镜`);
  const sp=A(p.support);if(!sp.length)c.warn(`${c.tag}没有 support：verdict 要给支撑判断的证据，光有判断就是喊口号`);
  if(sp.length>3)c.warn(`${c.tag}有 ${sp.length} 条证据：一屏最多三条，其余并成一句`);
 },
 make(p,c){
  const loud=p.style==='outrage'||p.style==='adversarial';
  const js=Math.min(...[fitPx(String(p.judgment),'han',loud?116:104,1560,.05)]);
  // 每一项都可以是字符串（默认节奏）或 {text, at}（按 cue 出）。at 写了就严格用 cue，不再算默认秒数。
  const timed=(v,i,base)=>{const o=typeof v==='object'&&v?{text:v.text,at:v.at}:{text:v,at:null};
   return {...o,t:o.at!=null?c.at(o.at):base(i)};};
  const sup=A(p.support).map((s,i)=>timed(s,i,i=>c.t0+.4+i*.45));
  const cT=p.counter!=null?timed(p.counter,0,()=>c.t0+.5+sup.length*.45).t:null;
  const cText=p.counter!=null?(typeof p.counter==='object'?p.counter.text:p.counter):null;
  const wT=p.watch!=null?timed(p.watch,0,()=>c.t0+.7+sup.length*.45+(p.counter?.35:0)).t:null;
  const wText=p.watch!=null?(typeof p.watch==='object'?p.watch.text:p.watch):null;
  // 纵向节奏（1080 坐标系，字幕带从 900 起）：
  //   判断 300 → 性质标签 396 → 证据卡 500–660 → 条件 730 → 观察点 812
  const JY=300, TAGY=JY+js*.86, SY=500, SH=158, CONDY=730, WATCHY=812;
  const cam=camSeq([{t:c.t0,cam:{x:960,y:470,s:loud?1.01:.97}},{t:c.t0+.3,cam:{x:960,y:470,s:1},d:1}],0);
  return t=>{
   const cc=cam(t),cp=cam(t-1/30);
   let h='';
   // 判断
   const a0=appear(t,c.t0+.05,.35,18);
   h+=`<div class="pol-judge" style="left:960px;top:${JY}px;font-size:${f1(js)}px;${fx({o:a0.o,dy:a0.dy},'translate(-50%,-50%)')}">${p.judgment}</div>`;
   // 性质标签：判断是分析还是事实，写在判断下面一行，不靠颜色
   const nd=natureOf(p.nature??'analysis');
   if(nd)h+=`<div class="pol-jtag" style="left:960px;top:${f1(TAGY)}px;--kc:${nd.c};opacity:${f3(appear(t,c.t0+.25,.3,0).o)}"><span class="pol-k" style="--kc:${nd.c}">${nd.zh}</span></div>`;
   // 证据：一行排开，依次冒出来
   const n=sup.length,G=36,W=n>=3?430:500,tot=n*W+(n-1)*G,x0=960-tot/2;
   sup.forEach((s,i)=>{
    const a=appear(t,s.t,.28,14);if(a.o<=0)return;
    const on=t>=(sup[i+1]?.t??Infinity);
    h+=`<div class="pol-sup" style="left:${f1(x0+i*(W+G))}px;top:${SY}px;width:${W}px;height:${SH}px;--pc:${on?'#dfe6f2':'#9aa3b4'};${fx({o:a.o,dy:a.dy},'translate(0,0)')}"><b>${String(i+1).padStart(2,'0')}</b><span style="font-size:${f1(Math.min(32,W*.072))}px">${s.text}</span></div>`;
   });
   // 条件 / 反证
   if(cT!=null){const a=appear(t,cT,.3,12);
    if(a.o>0)h+=`<div class="pol-cond" style="left:960px;top:${CONDY}px;opacity:${f3(a.o)};transform:translateX(-50%) translateY(${f1(a.dy)}px)"><b>条件是</b>${cText}</div>`;}
   // 下一步看什么：一条横线 + 字，作为整条的出口
   if(wT!=null){const a=appear(t,wT,.3,12),k2=E(C((t-wT)/.5));
    if(a.o>0)h+=`<div class="pol-watch" style="left:960px;top:${WATCHY}px;opacity:${f3(a.o)}"><i style="width:${f1(120*k2)}px"></i><span>${wText}</span></div>`;}
   return c.bg(t,cc,cp,{tone:p.tone})+L(cc,cp,1,h);
  };
 }
});

// ---------- 样式（只作用于 .pol-*，不碰上游的 .k-*） ----------
const css=`
.pol-badge{position:absolute;left:${SAFE.x0}px;top:812px;display:flex;align-items:center;gap:12px;z-index:90;pointer-events:none;
 font:26px ${FAM.ui};color:#cfd5df;background:rgba(8,11,16,.62);border-radius:6px;padding:5px 14px 6px;box-shadow:0 0 0 1px rgba(255,255,255,.09)}
.pol-badge.pol-r{left:auto;right:${100}px;top:96px}
.pol-k{font:24px ${FAM.ui};letter-spacing:.14em;color:var(--kc);border:1.5px solid var(--kc);border-radius:4px;padding:1px 8px 2px}
.pol-s{font:24px ${FAM.ui};letter-spacing:.03em;color:#c3cad6}
.pol-p{font:24px ${FAM.ui};color:#98a1b0}
.pol-fic{position:absolute;right:100px;top:56px;z-index:91;font:26px ${FAM.ui};letter-spacing:.12em;color:#d8c6f2;
 background:rgba(46,20,64,.72);border:1.5px solid #b98fe0;border-radius:6px;padding:6px 16px 7px}
.pol-side{position:absolute;border-radius:14px;overflow:hidden;background:linear-gradient(168deg,rgba(255,255,255,.085),rgba(255,255,255,.03));
 box-shadow:0 0 0 1.5px rgba(255,255,255,.13),0 24px 60px rgba(0,0,0,.52);padding:0 26px;box-sizing:border-box}
.pol-side.on{box-shadow:0 0 0 2px color-mix(in srgb,var(--pc) 72%,#fff 12%),0 0 60px color-mix(in srgb,var(--pc) 34%,transparent),0 24px 60px rgba(0,0,0,.55)}
.pol-side .pol-bar{position:absolute;left:0;top:0;width:100%;height:7px;background:var(--pc);opacity:.85}
.pol-head{position:absolute;left:26px;right:26px;top:38px}
.pol-name{font-family:${FAM.han};color:#fff;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pol-tag{display:inline-block;margin-top:10px;font:22px ${FAM.ui};letter-spacing:.16em;color:#cfd6e2;background:rgba(255,255,255,.12);border-radius:4px;padding:3px 10px 4px}
.pol-view{position:absolute;left:26px;right:26px;top:190px;font-family:${FAM.han};line-height:1.52;color:#f3f5f9}
.pol-basis{position:absolute;left:26px;right:26px;bottom:24px;font:25px/1.45 ${FAM.ui};color:#aeb6c4;border-top:1px solid rgba(255,255,255,.14);padding-top:13px}
.pol-basis b{display:block;font:20px ${FAM.ui};letter-spacing:.2em;color:var(--pc);margin-bottom:5px}
.pol-lit{position:absolute;height:3px;border-radius:2px;background:linear-gradient(90deg,var(--pc),color-mix(in srgb,var(--pc) 30%,transparent))}
.pol-note{transform:translateX(-50%);font:26px ${FAM.ui};color:#8f97a6;letter-spacing:.06em;white-space:nowrap}
.pol-axis{position:absolute;height:2px;background:rgba(255,255,255,.16)}
.pol-axis-on{position:absolute;height:3px;margin-top:-.5px;background:linear-gradient(90deg,rgba(232,207,134,.35),#e8cf86);box-shadow:0 0 14px rgba(232,207,134,.5)}
.pol-date{position:absolute;font:32px ${FAM.num};letter-spacing:.08em;color:#e6dcc0;white-space:nowrap}
.pol-date.pend{color:#b0a8ea}
.pol-dot{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#0d1119;box-shadow:0 0 0 3px rgba(232,207,134,.85),0 0 22px rgba(232,207,134,.45)}
.pol-dot.on{background:#f4e4b0;box-shadow:0 0 0 4px rgba(232,207,134,.95),0 0 34px rgba(232,207,134,.8)}
.pol-dot.pend{background:#0d1119;box-shadow:0 0 0 3px rgba(150,142,220,.9);border:2px dashed #9d95e0}
.pol-ev{position:absolute;border-radius:10px;padding:18px 22px 20px;background:rgba(255,255,255,.06);box-shadow:0 0 0 1.5px rgba(255,255,255,.1);border-left:4px solid var(--pc)}
.pol-ev.on{background:rgba(255,255,255,.12);box-shadow:0 0 0 1.5px rgba(255,255,255,.24),0 16px 44px rgba(0,0,0,.5)}
.pol-ev.pend{border-left-style:dashed;background:rgba(120,110,200,.1)}
.pol-ev-w{font:22px ${FAM.ui};letter-spacing:.12em;color:#9fa8b8;margin-bottom:8px}
.pol-ev-t{font-family:${FAM.han};line-height:1.45;color:#eef1f6}
.pol-ev-n{margin-top:8px;font:22px ${FAM.ui};color:#9ea7b6}
.pol-judge{position:absolute;font-family:${FAM.han};color:#fff;letter-spacing:.03em;white-space:nowrap;text-shadow:0 6px 30px rgba(0,0,0,.7)}
.pol-jtag{position:absolute;transform:translateX(-50%);display:flex;justify-content:center}
.pol-sup{position:absolute;min-height:150px;border-radius:10px;padding:16px 20px 18px;box-sizing:border-box;background:rgba(255,255,255,.055);box-shadow:0 0 0 1.5px rgba(255,255,255,.1)}
.pol-sup b{display:block;font:22px ${FAM.num};letter-spacing:.14em;color:var(--pc);margin-bottom:8px}
.pol-sup span{font-family:${FAM.han};line-height:1.42;color:#e9edf4}
.pol-cond{position:absolute;transform:translateX(-50%);font:34px ${FAM.han};color:#f0dca0;white-space:nowrap}
.pol-cond b{font:26px ${FAM.ui};letter-spacing:.18em;color:#a9975f;margin-right:14px}
.pol-watch{position:absolute;transform:translateX(-50%);display:flex;align-items:center;gap:16px;font:28px ${FAM.ui};color:#9fb6d6;letter-spacing:.06em;white-space:nowrap}
.pol-watch i{display:block;height:2px;background:linear-gradient(90deg,rgba(159,182,214,0),#9fb6d6)}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
})();
