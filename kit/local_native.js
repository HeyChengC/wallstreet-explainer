// local_native.js —— 港台本地自媒体的画面词汇（封面 + 正片场景）
// 载入顺序：… → politics.js → regional.js → local_native.js → film.js
//
// 和上游模板的区别：上游是"干净的财经图表"，这里是"人臉是主角、字是貼紙、動作是砸上去的"。
// 但技术要求和上游一样严格：同一个 t 永远画出同一帧，不依赖 CSS 动画和播放时钟。
//
// 三样东西：
//   1. K.cover({...})   → 封面（1280×720 / 1920×1080），人物透明抠像 + 粗描边巨字 + 爆裂背景
//   2. 三个场景          → local-hero（大头+巨字slabs）、local-clash（人物对撞）、local-quote-card（原话大字卡）
//   3. 动效工具          → slam / shake / burst / sticker，都是 t 的函数
(()=>{
const KIT=window.KIT;
if(!KIT)throw Error('local_native.js 要在 kit.js 之后加载');
const K=KIT;

const {C,IO,E,lerp,f1,f3,col,mixc,alpha,fitPx,FAM,SAFE}=KIT;
const {L}=S25;
const A=v=>v==null?[]:Array.isArray(v)?v:[v];

// =====================================================================================
// 动效工具：全部是 t 的纯函数，可重复 seek
// =====================================================================================

// slam：砸进来。0.78 → 1.12 → 1.00，6–10 帧。
// t0 是落地那一刻；返回 {sc, o, dy} 给 fx() 用
function slam(t,t0,o={}){
 const d=o.dur??.28,from=o.from??.78,over=o.over??1.12;
 const k=(t-t0)/d;
 if(k<=0)return {sc:from,o:0,dy:0};
 if(k>=1)return {sc:1,o:1,dy:0};
 // 0→0.55：冲到 over；0.55→1：回落到 1
 const a=C(k/.55),b=C((k-.55)/.45);
 const sc=a<1?lerp(from,over,E(a)):lerp(over,1,E(b));
 return {sc,o:C(k/.18),dy:0};
}

// shake：震动。只震构图，字幕不跟着晃。
function shake(t,t0,o={}){
 const d=o.dur??.16,amp=o.amp??12;
 if(t<t0||t>t0+d)return [0,0];
 const k=(t-t0)/d,f=o.freq??34;
 // 衰减 + 交替位移
 const decay=1-E(k),ang=k*f*Math.PI*2;
 return [Math.sin(ang)*amp*decay,Math.cos(ang*1.37)*amp*.7*decay];
}

// burst：漫画爆裂/放射线。返回一段 SVG。
function burst(t,t0,o={}){
 const k=C((t-t0)/(o.dur??.22));
 if(k<=0)return '';
 const sc=lerp(o.from??.4,1,E(k)),op=C((t-t0)/.1);
 const cx=o.x??960,cy=o.y??470,r=(o.r??520)*sc,spikes=o.spikes??16,col1=o.color??'#ff3b30',col2=o.color2??'#ffd60a';
 let d='';
 for(let i=0;i<spikes*2;i++){
  const ang=(i/(spikes*2))*Math.PI*2-Math.PI/2;
  const rr=i%2===0?r:r*.56;
  d+=(i?'L':'M')+f1(cx+Math.cos(ang)*rr)+' '+f1(cy+Math.sin(ang)*rr)+' ';
 }
 d+='Z';
 return `<svg class="k-full" width="1920" height="1080" style="overflow:visible;opacity:${f3(op*(o.o??.9))}"><path d="${d}" fill="${col1}" stroke="${col2}" stroke-width="6" style="filter:drop-shadow(0 0 28px ${alpha(col1,.6)})"/></svg>`;
}

// sticker：贴纸（惊叹号/问号/怒气符），弹进来后停住
function sticker(t,t0,o={}){
 const a=slam(t,t0,{dur:.22,from:.4,over:1.18});
 if(a.o<=0)return '';
 const rot=o.rot??-8;
 return `<div style="position:absolute;left:${f1(o.x??1600)}px;top:${f1(o.y??180)}px;font:${o.size??190}px ${FAM.num};color:${o.color??'#ffd60a'};-webkit-text-stroke:${o.stroke??10}px #000;text-shadow:0 6px 0 #000,0 0 30px ${alpha(o.color??'#ffd60a',.55)};transform:translate(-50%,-50%) rotate(${rot}deg) scale(${f3(a.sc)});opacity:${f3(a.o)}">${o.text??'!'}</div>`;
}

// 描边巨字：白/黄/红填色 + 黑描边 + 硬偏移阴影（本地自媒体的标志性做法）
// 关键技术点：
//   -webkit-text-stroke 是**居中描边**，会吃掉一半字身。字重本来就 900 时，粗描边会把字压成"细骨架裹黑边"。
//   paint-order:stroke fill 让描边画在填色**后面**，填色完整保留。
//   Chrome 对 -webkit-text-stroke 支持 paint-order:stroke fill，这里同时用它 + 合理描边宽度。
function heavyText(text,o={}){
 const size=o.size??150,fill=o.fill??'#fff',stroke=o.stroke??8,shadow=o.shadow??10;
 const lh=o.lh??1.08;
 return `<div style="font:900 ${size}px ${o.family??FAM.han};line-height:${lh};letter-spacing:${o.ls??'-0.01em'};`+
  `color:${fill};-webkit-text-stroke:${stroke}px ${o.strokeColor??'#000'};paint-order:stroke fill;`+
  `text-shadow:${shadow}px ${shadow}px 0 ${o.shadowColor??'#000'},0 0 ${o.glow??0}px ${alpha(fill,.6)};`+
  `white-space:pre;${o.style??''}">${text}</div>`;
}

// =====================================================================================
// 封面：K.cover({...})
//   人物透明抠像（PNG）+ 粗描边巨字 + 相关背景 + 一两个漫画符号
//   输出是一个 HTML 字符串，用 render.mjs 的 --cover 模式截成 cover_1280.jpg
// =====================================================================================
K.cover=function(p){
 const W=p.w??1920,H=p.h??1080;
 const people=A(p.people);        // [{img, x, y, h, rim, flip}]  透明 PNG，h=人的高度
 const lines=A(p.lines);          // [{text, size, fill, stroke, y, rot}]  2–3 行巨字
 const bg=p.bg;                   // 背景图（实拍/议场/大楼），没有就用色调
 return function renderCover(){
  let h='';
  // ---------- 背景 ----------
  if(bg){
   // 背景：铺满 + 轻微放大 + 压暗/加饱和，避免和人物抢
   h+=`<div style="position:absolute;inset:0;background:url(${bg}) center/cover;`+
    `filter:brightness(${p.bgBr??.72}) saturate(${p.bgSat??1.15}) blur(${p.bgBlur??0}px);transform:scale(${p.bgZoom??1.04})"></div>`;
   // 底部渐变，保证字压得住
   h+=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent 28%,${alpha(p.baseColor??'#0a0d14',p.baseO??.86)} 68%)"></div>`;
  }else{
   h+=`<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 38%,${p.c1??'#8a1c12'},${p.c2??'#12060a'} 72%)"></div>`;
  }
  // ---------- 爆裂/放射线：在人物**后面**一层，不能盖住脸 ----------
  if(p.burst)h+=p.burst;
  // ---------- 人物（在爆裂之上、字之下） ----------
  // q.x 是**人物中心**的 x：需要知道图的宽高比才能算左边界。
  // q.imgW/q.imgH 可以从 p.imageSizes 传（推荐），没有就按 3:4 估——宁可略窄，不要头脸出屏。
  for(const q of people){
   const ph=q.h??900;
   const ar=q.ar??(q.imgW&&q.imgH?q.imgW/q.imgH:(p.imageSizes?.[q.img]??.75));
   const pw=ph*ar;
   const left=(q.x??960)-pw/2;
   // 描边用多层 drop-shadow 做外扩；没有 rim 时只加投影
   const filt=q.rim
    ? `drop-shadow(0 0 2px ${q.rim}) drop-shadow(2px 0 0 ${q.rim}) drop-shadow(-2px 0 0 ${q.rim}) drop-shadow(0 2px 0 ${q.rim}) drop-shadow(0 -2px 0 ${q.rim}) drop-shadow(0 16px 36px rgba(0,0,0,.72))`
    : `drop-shadow(0 16px 36px rgba(0,0,0,.72))`;
   const style=`position:absolute;left:${f1(left)}px;top:${f1(q.y??180)}px;width:${f1(pw)}px;height:${f1(ph)}px;`+
    (q.flip?'transform:scaleX(-1);':'')+`filter:${filt};`;
   h+=`<img src="${q.img}" style="${style}">`;
  }
  // ---------- 巨字 ----------
  for(const ln of lines){
   const size=ln.size??140;
   h+=`<div style="position:absolute;left:${f1(ln.x??960)}px;top:${f1(ln.y??700)}px;transform:translate(-50%,-50%) rotate(${ln.rot??0}deg);">`+
    heavyText(ln.text,{size,fill:ln.fill??'#fff',stroke:ln.stroke??12,shadow:ln.shadow??10,
     family:ln.family,glow:ln.glow??0,ls:ln.ls})+`</div>`;
  }
  // ---------- 贴纸/符号 ----------
  for(const s of A(p.stickers))h+=s.startsWith('<')?s:sticker(1,0,{...s});
  // ---------- 角标/台标：**一律不画**（private-study，overlays:none） ----------
  return h;
 };
};

// 封面渲染入口（render.mjs --cover 调）
K.coverHTML=(p)=>{
 const r=K.cover(p);
 return `<div style="position:absolute;inset:0;overflow:hidden">${r()}</div>`;
};

// =====================================================================================
// 场景 1：local-hero —— 大头 + 巨字 slabs
//   人（透明抠像或实拍画框）+ 一行到两行巨字，巨字边缘压到人身上
// =====================================================================================
K.scene('local-hero',{
 says:'把这个人放到画面正中，一行粗字压在他身上：这一镜要让观众先看到人，再看到那句话',
 use:'开场钩子、观点落点、人物第一次出现；需要"人 + 一句狠话"的镜头',
 avoid:'没有人物素材（用 statement）；要并列两方（用 local-clash）',
 need:['headline'],
 help:{headline:"'這他媽叫交代嗎'：巨字（8–12 字最好）",sub:"'第二行'：副字（可省，4–10 字）",
  img:'人物透明抠像 PNG（assets/img/xxx.png）',clip:'实拍帧序列名（和 img 二选一）',
  imgW:'抠像图的实际像素宽（和 imgH 一起，用来算居中）',imgH:'抠像图的实际像素高',
  personH:'人在画面里多高（默认 980）',personX:'人的**中心** x（默认 1120，偏右留字位）',personY:'人的顶（默认 120）',
  rim:"描边色（'#fff' / '#ffd60a'）",fill:"字的填色",accent:"副字的颜色（默认 '#ffd60a'）",
  kicker:'（已停用：角落小字等于角标，写了也不画；主题放进 headline）',
  burst:"true = 背景放射线",sticker:"'?': 加一个问号贴纸",
  headlineX:'巨字的中心 x（默认 560）',headlineY:'巨字的中心 y（默认 560）',
  headlineSize:'巨字号（默认 168）',subSize:'副字号（默认 108）',
  headlineRot:'巨字倾斜角度（度）',subRot:'副字倾斜角度（度）',
  stroke:'描边宽度（默认 14）',shadow:'硬阴影偏移（默认 12）',glow:'外发光（默认 24）',
  shakeAt:'哪一刻震一下（cue）',shakeAmp:'震动幅度（像素，默认 16）',
  stickerX:'贴纸 x',stickerY:'贴纸 y',stickerSize:'贴纸字号',stickerColor:'贴纸颜色',
  drawAt:'字什么时候砸进来（cue，默认这一镜开头 +0.15 秒）',
  bgC1:'这一镜的底色中心色（默认不写，用 tone）',bgC2:'底色外圈色',
  tone:"底色（没有 img/clip 时用）"},
 defaults:{tone:'charcoal'},minDur:1.2,
 beats:p=>(p.shakeAt?1:0)+(p.sticker?1:0),
 check(p,c){if(KIT.vw(String(p.headline))>13)c.warn(`${c.tag}头一句 ${KIT.vw(String(p.headline))} 个字：压到 12 字以内更抓眼`);},
 make(p,c){
  const tSlam=c.at(p.drawAt)??c.t0+.02, tShake=p.shakeAt?c.at(p.shakeAt):null;
  const px=p.personX??1120,py=p.personY??120,ph=p.personH??980;
  const ar=p.imgW&&p.imgH?p.imgW/p.imgH:(p.img?p.imgAr??.75:1);
  return t=>{
   let sh=[0,0];
   if(tShake!=null)sh=shake(t,tShake,{amp:p.shakeAmp??16});
   const cam={x:960+sh[0],y:470+sh[1],s:1.02};
   const cp={...cam,s:1.02};
   let h='';
   // 1) 背景爆裂**先画**：它在人物后面，不能盖脸
   if(p.burst)h+=burst(t,tSlam,{r:640,spikes:18,color:'#e01f1f',color2:'#ff9f0a',o:.75});
   // 2) 人
   if(p.img){
    const pw=ph*ar;
    h+=`<img data-role="person" src="${p.img}" style="position:absolute;left:${f1(px-pw/2)}px;top:${f1(py)}px;width:${f1(pw)}px;height:${f1(ph)}px;`+
     (p.rim?`filter:drop-shadow(3px 0 0 ${p.rim}) drop-shadow(-3px 0 0 ${p.rim}) drop-shadow(0 3px 0 ${p.rim}) drop-shadow(0 -3px 0 ${p.rim}) drop-shadow(0 20px 44px rgba(0,0,0,.72));`:'filter:drop-shadow(0 20px 44px rgba(0,0,0,.72));')+`">`;
   }
   else if(p.clip)h+=`<img src="${FB.fr(p.clip,Math.floor(Math.max(0,t-c.t0)*30)+1)}" style="position:absolute;left:${f1(px-620)}px;top:${f1(py)}px;width:1240px;height:${f1(ph)}px;object-fit:cover;object-position:50% 22%;filter:contrast(1.06) saturate(1.08) drop-shadow(0 20px 44px rgba(0,0,0,.6))">`;
   // 3) 顶部小字：**不做**。左上/右上常驻的小字就是角标，用户要求和 overlays:none 一致。
   //    主题信息放进巨字本身（正文大标题），不放角落。
   // 4) 巨字（在人物之上，可以压到他身上）
   // 文字区：x ∈ [40, p.textRight ?? 980]。字号按文字区宽度自动收，保证不出边。
   const textRight=p.textRight??980;
   const textW=Math.max(240,textRight-40);
   const hSize=Math.min(p.headlineSize??168,fitPx(String(p.headline),'han',p.headlineSize??168,textW,.02));
   const sSize=p.sub?Math.min(p.subSize??96,fitPx(String(p.sub),'han',p.subSize??96,textW,.02)):null;
   const s1=slam(t,tSlam,{dur:.3,from:.72,over:1.14});
   const lx=p.headlineX??Math.min(560,40+textW/2);
   h+=`<div style="position:absolute;left:${f1(lx)}px;top:${f1(p.headlineY??520)}px;transform:translate(-50%,-50%) rotate(${p.headlineRot??-2.5}deg) scale(${f3(s1.sc)});opacity:${f3(s1.o)}">`+
    heavyText(String(p.headline),{size:hSize,fill:p.fill??'#fff',stroke:p.stroke??9,shadow:p.shadow??12,glow:p.glow??24})+'</div>';
   // 副字：往上放（默认在巨字**上方**），不和字幕抢
   if(p.sub){const s2=slam(t,tSlam+.18,{dur:.28,from:.8,over:1.12});
    h+=`<div style="position:absolute;left:${f1(lx)}px;top:${f1((p.headlineY??520)-hSize*.86)}px;transform:translate(-50%,-50%) rotate(${p.subRot??1.5}deg) scale(${f3(s2.sc)});opacity:${f3(s2.o)}">`+
     heavyText(String(p.sub),{size:sSize,fill:p.accent??'#ffd60a',stroke:p.stroke??8,shadow:p.shadow??10,glow:p.glow??18})+'</div>';}
   // 5) 贴纸
   if(p.sticker)h+=sticker(t,tSlam+.3,{text:p.sticker,x:p.stickerX??1700,y:p.stickerY??250,size:p.stickerSize??230,color:p.stickerColor??'#ffd60a'});
   // 底色：写了 bgC1/bgC2 就画一块红黄撞色底，否则用 tone
   const bgOut=(p.bgC1||p.bgC2)
    ? `<div class="k-full" style="background:radial-gradient(ellipse at 50% 42%,${p.bgC1??'#c8231a'},${p.bgC2??'#2a0b02'} 78%)"></div>`
    : c.bg(t,cam,cp,{tone:p.tone});
   return bgOut+L(cam,cp,1,h);
  };
 }
});

// =====================================================================================
// 场景 2：local-clash —— 人物对撞
//   两个大头左右对撞，中间一个冲突词/问号；念到谁谁放大。
// =====================================================================================
K.scene('local-clash',{
 says:'这两个人（这两方）撞在一起：各自一句短话，中间的词说明他们争的是什么',
 use:'两方对立、争论、对照；封面式的对撞镜头',
 avoid:'三方以上（用 stance-matrix）；只有一方（用 local-hero）',
 need:['left','right'],
 help:{left:"{img|clip, name:'沈伯洋', line:'一句短话', rim}",
  right:"{img|clip, name:'蔣萬安', line:'一句短话', rim}",
  clash:"中间的冲突词：'誰講清？' / '對撞'", clashColor:"中间字的颜色（默认 '#ffd60a'）",
  at:"左边先出、右边后出的时刻数组 ['@b02','@b04']（可省）",tone:'底色'},
 defaults:{tone:'charcoal'},minDur:2,
 beats:p=>A(p.at).length+1,
 make(p,c){
  const ats=A(p.at).map(a=>c.at(a));
  // side 必须同时拿到「当前帧 t」和「这一边该出现的时刻」——只传一个必然算错 slam 的进度
  const side=(q,dir,t,enterT)=>{
   const a=slam(t,enterT,{dur:.3,from:.7,over:1.13});
   const cx=dir<0?430:1490;
   // 人物在 y 500 附近，短话压在人物胸口/下方但不进字幕带（936 起）
   const lineY=p.lineY??760, nameY=p.nameY??828;
   let h=`<div data-role="${dir<0?'person-left':'person-right'}" style="position:absolute;left:${f1(cx)}px;top:520px;transform:translate(-50%,-50%) scale(${f3(a.sc)});opacity:${f3(a.o)}">`;
   if(q.img)h+=`<img data-role="person" src="${q.img}" style="height:${f1(q.h??600)}px;`+
    (q.rim?`filter:drop-shadow(3px 0 0 ${q.rim}) drop-shadow(-3px 0 0 ${q.rim}) drop-shadow(0 3px 0 ${q.rim}) drop-shadow(0 -3px 0 ${q.rim}) drop-shadow(0 18px 40px rgba(0,0,0,.7));`:'filter:drop-shadow(0 18px 40px rgba(0,0,0,.7));')+`">`;
   else if(q.clip)h+=`<img src="${FB.fr(q.clip,1+Math.floor(Math.max(0,t-c.t0)*30))}" style="width:${f1(q.w??500)}px;height:${f1(q.h??600)}px;object-fit:cover;object-position:50% 20%;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.7)">`;
   h+='</div>';
   // 短话（在人物下方，但整个块在字幕带之上）
   h+=`<div style="position:absolute;left:${f1(cx)}px;top:${f1(lineY)}px;transform:translate(-50%,-50%) scale(${f3(a.sc)});opacity:${f3(a.o)}">`+
    heavyText(String(q.line??''),{size:q.lineSize??72,fill:q.lineFill??'#fff',stroke:10})+'</div>';
   if(q.name)h+=`<div style="position:absolute;left:${f1(cx)}px;top:${f1(nameY)}px;transform:translate(-50%,-50%);font:700 42px ${FAM.han};color:#cfd6e2;opacity:${f3(a.o)}">${q.name}</div>`;
   return h;
  };
  return t=>{
   let sh=[0,0];
   const hitT=ats[1]??c.t0+.6;
   if(t>=hitT)sh=shake(t,hitT,{amp:14,freq:26});
   const cam={x:960+sh[0],y:520+sh[1],s:1.02},cp={...cam,s:1.02};
   let h='';
   h+=side(p.left,-1,t,ats[0]??c.t0+.1);
   h+=side(p.right,1,t,ats[1]??c.t0+.55);
   // 中间冲突词
   if(p.clash){const a=slam(t,hitT,{dur:.3,from:.5,over:1.2});
    h+=`<div style="position:absolute;left:960px;top:520px;transform:translate(-50%,-50%) rotate(-6deg) scale(${f3(a.sc)});opacity:${f3(a.o)}">`+
     heavyText(String(p.clash),{size:p.clashSize??132,fill:p.clashColor??'#ffd60a',stroke:14,glow:30})+'</div>';}
   if(p.sticker)h+=sticker(t,hitT+.1,{text:p.sticker,x:1560,y:640,size:210,color:'#ff3b30'});
   return c.bg(t,cam,cp,{tone:p.tone})+L(cam,cp,1,h);
  };
 }
});

// =====================================================================================
// 场景 3：local-quote-card —— 原话大字卡
//   把一句原话（或文件里的一句）做成"贴纸大字"，背后是原文截图/实拍，重点词刷色。
// =====================================================================================
K.scene('local-quote-card',{
 says:'这句话是原话/原文，不是我的转述：把这句话放大到看不清背景的程度，重点词变色',
 use:'引用官方答问、记者会、文件原文；需要观众记住"原话就是这么说的"',
 avoid:'只是想强调一个词（用 local-hero）；话很长（拆成两三张卡）',
 need:['text'],
 help:{text:"'社會準備未夠，回收配套仲要加'：原话（16–24 字最好）",hl:"['配套']：要变色的词",
  img:"背景（原文截图/实拍）",source:"出处（不上屏，只写进 brief）",who:'谁说的（可省，会显示在下面小字）',
  hlColor:"变色颜色（默认 '#ffd60a'）",tone:'底色'},
 defaults:{tone:'charcoal'},minDur:1.6,
 beats:p=>(p.hl?1:0),
 make(p,c){
  const tIn=c.t0+.12,tHl=c.at(p.hlAt)??c.t0+c.d*.45;
  return t=>{
   const a=slam(t,tIn,{dur:.28,from:.84,over:1.1});
   const k=lerp(0,1,C((t-tHl)/.3));
   const hlColor=p.hlColor??'#ffd60a';
   let h='';
   if(p.img)h+=`<div style="position:absolute;inset:0;background:url(${p.img}) center/cover;filter:brightness(.34) saturate(.9) blur(3px)"></div>`;
   // 引号
   h+=`<div style="position:absolute;left:150px;top:180px;font:900 300px ${FAM.han};color:${alpha('#ffffff',.12)};line-height:1">“</div>`;
   // 原话：按 16 字左右断行
   const txt=String(p.text),chars=[...txt];
   const perLine=p.perLine??12,lines=[];
   for(let i=0;i<chars.length;i+=perLine)lines.push(chars.slice(i,i+perLine).join(''));
   const size=Math.min(...lines.map(l=>fitPx(l,'han',p.size??132,1500,.04)));
   const lh=size*1.34,y0=520-(lines.length-1)*lh/2;
   let bodyHtml='';
   lines.forEach((ln,i)=>{
    let html;
    if(k>0&&p.hl){html=ln.split(String(p.hl)).join(`<span style="color:${hlColor};-webkit-text-stroke:${p.stroke??12}px #000">${p.hl}</span>`);}
    else html=ln;
    bodyHtml+=`<div style="position:absolute;left:960px;top:${f1(y0+i*lh)}px;transform:translate(-50%,-50%) scale(${f3(a.sc)});opacity:${f3(a.o)}">`+
     heavyText(html,{size,fill:'#fff',stroke:p.stroke??12,shadow:10,glow:0})+'</div>';
   });
   h+=bodyHtml;
   if(p.who)h+=`<div style="position:absolute;left:960px;top:${f1(y0+lines.length*lh+70)}px;transform:translate(-50%,-50%);font:900 46px ${FAM.han};color:#cfd6e2;-webkit-text-stroke:4px #000;opacity:${f3(a.o)}">—— ${p.who}</div>`;
   const cam={x:960,y:520,s:1.03},cp={...cam,s:1.03};
   return c.bg(t,cam,cp,{tone:p.tone})+L(cam,cp,1,h);
  };
 }
});

// 导出给 film.js 直接用（封面、动效）
Object.assign(K,{slam,shake,burst,sticker,heavyText});
})();
