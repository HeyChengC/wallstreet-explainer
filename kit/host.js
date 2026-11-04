// host.js —— 真人口播层：主持人是这条片的"地面"，观众每离开她一会儿就回到她身边（学自小Lin说，refs/2026-11-02_YouTube_小Lin说口播/分析.md）。
// 载入顺序：… kit.js → scenes.js → host.js → film.js。口播就是配音：时间线由 scripts/host_timeline.py 从口播里逐字对齐，片子的 t = 口播的 t。
// 素材：assets/clips/host/0001.jpg…（30fps，footage 抽帧）+ assets/cut/host/0001.png…（matte.py + matte_clean.py 逐帧抠像，同尺寸）。
//
// 她在画面里的七种样子（从重到轻），在镜头表里这样写：
//   1 房间全屏          {scene:'host'}                                 她在自己房间里讲；zoom 写景别跳
//   2 东西进她的房间    {scene:'host', items:[…]}                      照片、价签、卡片挂在她身后的墙上（她的头发、肩膀压在它们前面）
//   3 身后换世界        {scene:'host', swap:{at, words:['利','率']}}    说到关键词那一刻，房间换成舞台，巨字夹在她和底之间
//   4 和图形并排        任何场景加 host:'window'                        图形缩进左边的板子，她在右边竖窗里（从房间缩进去）
//   5 角上圆窗          任何场景加 host:'pip'                           全屏实拍/图形时她缩成左下角一个圆，跨过底下几刀不动
//   6 完全没有她        不写 host                                      最多 3–4 秒就回来，或者先变成圆窗
//   回到房间            {scene:'host', enter:'grow'}（从圆窗/竖窗长回全屏）或 enter:'drop'（上一镜的图形往下掉，露出一直在后面的她）
(()=>{
const {C,IO,lerp,L}=S25,{f1,f3,E,col,mixc,alpha,stage,brow:browK,appear,label}=KIT;
const A=v=>v==null?[]:Array.isArray(v)?v:[v];
const HOST={name:'host',fps:30,frames:0,box:null};
// 片子的 t → 第几帧（口播从 0 秒开始，和时间线同一个钟）
const fi=t=>Math.max(1,Math.min(HOST.frames,Math.floor(t*HOST.fps+1e-6)+1));
const roomSrc=t=>`assets/clips/${HOST.name}/${String(fi(t)).padStart(4,'0')}.jpg`;
const cutSrc=t=>`assets/cut/${HOST.name}/${String(fi(t)).padStart(4,'0')}.png`;
// 头肩中心（matte_clean.py 写的 cx，按帧）：圆窗、竖窗跟着她
const headX=t=>HOST.box?.cx?.[fi(t)-1]??960;
const FACE={y:330};   // 她脸的中心在原片里大概的高度（1080 坐标）：host.face 可以改

// ---------- 房间：原片按机位 {x,y,s} 放大（x,y = 原片里落在画面中心的点）。东西挂在墙上、她的抠像压在最上面，三者用同一个机位，不会错位 ----------
function roomHTML(t,cam,o={}){
 const s=cam.s,tx=960-cam.x*s,ty=540-cam.y*s;
 const tr=`transform-origin:0 0;transform:translate(${f1(tx)}px,${f1(ty)}px) scale(${f3(s)})`;
 const back=o.back??`<img src="${roomSrc(t)}" style="position:absolute;left:0;top:0;width:1920px;height:1080px">`;
 const mid=o.mid??'';
 const cut=(o.cut??!!mid)?`<img src="${cutSrc(t)}" style="position:absolute;left:0;top:0;width:1920px;height:1080px">`:'';
 return `<div class="k-full" style="overflow:hidden"><div style="position:absolute;left:0;top:0;width:1920px;height:1080px;${tr}">${back}${mid}${cut}</div></div>`;
}
// 景别：口播原片只有一个机位，在剪辑里裁出几档；换档是硬切（跳一下），不推不拉。档位之间慢漂（每秒 0.4%），人一直在动，画面不会死
// zoom:[{at, s, x}]：s 放大倍数（1 = 原片），x 往左/右让位（-1..1，正数 = 人往左挪、右边空出来）
function zoomCam(zs,t0){
 const keys=[{t:-1e9,s:1,x:0},...zs].sort((a,b)=>a.t-b.t);
 return t=>{let k=keys[0];for(const z of keys)if(t>=z.t)k=z;const s=(k.s??1)*(1+.004*Math.max(0,t-Math.max(t0,k.t)));
  const room=(1-1/s)*960,x=960+C(Math.abs(k.x??0))*room*Math.sign(k.x??0),y=540-(1-1/s)*540*(k.y??.35);
  return {x,y,s};};
}

// ---------- 挂在墙上的东西（在她身后）：照片 / 实拍画框、价签小卡 ----------
// {at, img|clip|html, label, value, x, y, w, h, rot, out}：坐标是原片 1920×1080 里的位置（墙上那块空地），镜头跳景别时跟着房间走
function wallItem(it,t,o={}){
 const k=C((t-it.t)/.28),e=E(k),ko=it.tout!=null?C((t-it.tout)/.25):0;if(k<=0||ko>=1)return '';
 const w=it.w??470,h=it.h??(it.value&&!it.img&&!it.clip?230:320),rot=it.rot??(it.side==='r'?1.6:-1.6);
 const op=e*(1-ko),dy=(1-e)*18+ko*10,gray=it.grayAt!=null&&t>=it.grayAt?C((t-it.grayAt)/.3):0;
 const media=it.html??(it.img||it.clip?`<img src="${it.clip?KIT_HOST.clipSrc(it.clip,t,it.t,it.from):it.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover${it.pos?`;object-position:${it.pos}`:''}">`:'');
 const val=it.value?`<div class="h-val">${it.vlabel?`<small>${it.vlabel}</small>`:''}${KIT.unitHTML(KIT.num(it.value))}</div>`:'';
 // 房间是暖光：墙上的东西压一点暖、一点暗，边上投一块软影，像真挂在那面墙上
 return `<div class="h-wall${it.img||it.clip||it.html?' pic':' tag'}" style="left:${f1(it.x-w/2)}px;top:${f1(it.y-h/2)}px;width:${w}px;height:${h}px;transform:translateY(${f1(dy)}px) rotate(${rot}deg);opacity:${f3(op)};filter:sepia(.12) brightness(${f3(.9-gray*.35)}) saturate(${f3(1-gray*.85)})${it.color?`;--c:${col(it.color)}`:''}">${media}${val}${it.label?`<div class="h-lab">${it.label}</div>`:''}${it.no&&t>=it.no?`<div class="h-no" style="opacity:${f3(C((t-it.no)/.18))}"></div>`:''}</div>`;
}

// ---------- 圆窗 / 竖窗的位置 ----------
const PIP={cx:215,cy:792,d:292};                     // 左下角（字幕在中间那一行，左边让给她）
const WIN={x:1372,y:150,w:476,h:684,r:16};             // 右边竖窗
const PANEL={x:72,y:150,w:1216,h:684,r:16};            // 左边图形板（16:9 的画面缩进来）
// 一个"窗"：box={x,y,w,h,r}，里面是房间原片；c 是原片里落在窗中心的点，s 是原片放大倍数
function winHTML(t,box,o={}){
 const s=o.s,cx=o.c[0],cy=o.c[1],l=box.w/2-cx*s,tp=box.h/2-cy*s;
 return `<div class="h-win${o.ring===false?'':' ring'}" style="left:${f1(box.x)}px;top:${f1(box.y)}px;width:${f1(box.w)}px;height:${f1(box.h)}px;border-radius:${f1(box.r)}px;${o.style??''}"><img src="${roomSrc(t)}" style="position:absolute;left:${f1(l)}px;top:${f1(tp)}px;width:${f1(1920*s)}px;height:${f1(1080*s)}px"></div>`;
}
// 一整帧画面（上一镜/这一镜的样子：墙上的东西、换了的世界）按同样的映射放进框里：缩进去、长出来时框里就是真正的样子，不会到头再跳
function lookIn(box,v,html,o={}){
 const l=box.w/2-v.c[0]*v.s,tp=box.h/2-v.c[1]*v.s;
 return `<div class="h-win${o.ring?' ring':''}" style="left:${f1(box.x)}px;top:${f1(box.y)}px;width:${f1(box.w)}px;height:${f1(box.h)}px;border-radius:${f1(box.r)}px"><div style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;transform:translate(${f1(l)}px,${f1(tp)}px) scale(${f3(v.s)})">${html}</div></div>`;
}
const pipView=t=>{const d=PIP.d,s=d/760;return {box:{x:PIP.cx-d/2,y:PIP.cy-d/2,w:d,h:d,r:d/2},c:[headX(t),FACE.y+60],s};};
const winView=t=>{const s=WIN.h/1080*1.12;return {box:{...WIN},c:[headX(t)+10,FACE.y+215],s};};
const fullView=()=>({box:{x:0,y:0,w:1920,h:1080,r:0},c:[960,540],s:1});
// 两个"窗"之间插值（她从全屏缩进圆窗、从竖窗长回全屏）：框、圆角、原片放大倍数、落在中心的点一起走
function morph(a,b,e){
 const bx={x:lerp(a.box.x,b.box.x,e),y:lerp(a.box.y,b.box.y,e),w:lerp(a.box.w,b.box.w,e),h:lerp(a.box.h,b.box.h,e),r:lerp(a.box.r,b.box.r,e)};
 return {box:bx,c:[lerp(a.c[0],b.c[0],e),lerp(a.c[1],b.c[1],e)],s:Math.exp(lerp(Math.log(a.s),Math.log(b.s),e))};
}

// ---------- 绑定到 K ----------
async function use(K,o={}){
 HOST.name=o.name??'host';
 const F=K.F;
 HOST.frames=F.CL[HOST.name]??0;if(!HOST.frames)throw Error(`口播帧没有登记：assets/clips/counts.json 里要有 "${HOST.name}": 帧数（footage.py extract 或 ffmpeg 抽 30fps）`);
 try{HOST.box=await fetch(`assets/cut/${HOST.name}/box.json`).then(r=>r.json());}catch{HOST.box=null;}
 if(!HOST.box)console.warn('[host] 没有抠像（assets/cut/host/box.json）：挂墙上的东西、身后换世界都要抠像，先跑 matte.py + matte_clean.py');
 if(o.faceY)FACE.y=o.faceY;
 window.KIT_HOST.clipSrc=F.clipSrc;
 // 每一镜加 host:'pip' / 'window'：把那一镜的画面包一层
 const film0=K.film;
 K.film=async list=>{
  const out=await film0(list);
  for(let i=0;i<out.length;i++){
   const s=out[i],form=s.p.host;if(!form)continue;
   if(!['pip','window'].includes(form))throw Error(`第 ${i+1} 镜：host 只能写 'pip' 或 'window'（全屏口播用 scene:'host'）`);
   const prev=out[i-1],pf=s.p.pipIn==='fade'?null:prev?.p.host??(prev?.scene==='host'?'room':null);
   const base=s.f,t0=s.t0;
   const f=form==='pip'?pipWrap(base,t0,pf,prev):winWrap(base,t0,pf,prev?.f);
   s.f=f;const sh=F.shots.find(x=>x.t0===s.t0);if(sh)sh.f=f;
  }
  // 提醒：完全没有她的时间
  let run=0,last=0;for(const s of out){const has=s.scene==='host'||s.p.host;if(has){run=0;}else{run+=s.t1-s.t0;if(run>4.5)K.warns.push(`${s.t1.toFixed(1)} 秒前有 ${run.toFixed(1)} 秒完全没有她：参考片没有她的一段只有 2.5–4.5 秒，加 host:'pip' 或回到房间`);}last=s.t1;}
  return out;
 };
 // 圆窗：底下是这一镜自己的画面。上一镜是房间：她从全屏缩进圆里（0.5 秒）；上一镜已经有圆窗：圆不动（跨刀的那根线）；其他：淡入
 function pipWrap(base,t0,pf,prev){
  const prevF=prev?.f;
  return t=>{
   const u=t-t0;let h=base(t);
   if(pf==='room'&&u<.5){const e=IO(u/.5),v=morph(fullView(),pipView(t),e),k=C(u/.32);
    return h+`<div class="k-full" style="z-index:70">${winHTML(t,v.box,{s:v.s,c:v.c,ring:e>.15})}</div>`+(k<1?`<div class="k-full" style="z-index:71;opacity:${f3(1-k)}">${lookIn(v.box,v,MV.still(prevF,t))}</div>`:'');}
   if(pf==='window'&&u<.45){const e=IO(u/.45),v=morph(winView(t),pipView(t),e);return h+`<div class="k-full" style="z-index:70">${winHTML(t,v.box,{s:v.s,c:v.c})}</div>`;}
   const v=pipView(t),k=pf==='pip'?1:C(u/.3);
   return h+`<div class="k-full" style="z-index:70;opacity:${f3(k)}">${winHTML(t,v.box,{s:v.s,c:v.c})}</div>`;
  };
 }
 // 竖窗：这一镜的画面缩进左边的板子（像一块屏幕），她在右边竖窗里。上一镜是房间：她从全屏缩进竖窗，板子从左边滑进来
 function winWrap(base,t0,pf,prevF){
  const P=PANEL,sc=P.w/1920;
  return t=>{
   const u=t-t0,pk=pf==='window'?1:E(C((u-.12)/.42)),v=pf==='room'&&u<.5?morph(fullView(),winView(t),IO(u/.5)):pf==='pip'&&u<.45?morph(pipView(t),winView(t),IO(u/.45)):winView(t);
   const k=C(u/.32),from=pf==='room'&&k<1&&prevF?`<div class="k-full" style="z-index:71;opacity:${f3(1-k)}">${lookIn(v.box,v,MV.still(prevF,t))}</div>`:'';
   const panel=`<div class="h-panel" style="left:${f1(P.x)}px;top:${f1(P.y)}px;width:${P.w}px;height:${P.h}px;border-radius:${P.r}px;opacity:${f3(pk)};transform:translateX(${f1((1-pk)*-90)}px)"><div style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0;transform:scale(${f3(sc)})">${base(t)}</div></div>`;
   return `<div class="k-full">${stage({tone:'navy'})}</div><div class="k-full" style="background:radial-gradient(ellipse at 50% 50%,transparent 40%,#0008)"></div>${panel}<div class="k-full" style="z-index:70">${winHTML(t,v.box,{s:v.s,c:v.c})}</div>${from}`;
  };
 }
 return K;
}

// ---------- 场景：host（她在房间里：全屏 / 东西挂墙上 / 身后换世界） ----------
KIT.scene('host',{
 says:'她自己在讲：开场、每一段的问题和答案、态度、转折',
 use:'她在讲道理、表态、提问的时候；东西挂到她身后的墙上（items）= 她拿出来给你看；最重要的那个词用 swap 身后换世界（一条片一两次）',
 avoid:'一段数字、关系、证据要细看（用图形场景 + host:\'window\' 或 \'pip\'）',
 help:{zoom:"[{at:'@b03:可', s:1.18, x:.3}]：景别跳（硬切）。s 放大倍数（原片 = 1，最多 1.35），x 人往左(+)/右(-)让位 0..1。参考片 6–8 秒跳一档，跳在句子转折处",
  items:"[{at:'@b02:乱世', img:'assets/img/war.jpg', label:'乱世', x:330, y:260, w:420, h:280}]：挂在她身后墙上的照片（img / clip 实拍 / html）或价签（value、vlabel）。x,y 是原片里墙上空地的中心；out 什么时候摘下；gray 变灰；no 打叉；fill:{clip:'smoke'} 这一镜最后 0.5 秒镜头冲进这张照片、照片推满屏变成实拍（下一镜写同一段实拍的 footage，from:0.5，pipIn:'fade'）",
  swap:"{at:'@b05:利率', words:['利','率'], color:'gold', brow:'问题出在', en:'INTEREST RATES'}：那一刻房间换成舞台，巨字夹在她和底之间；同一镜里她不动，景别不变",
  enter:"'grow'：从上一镜的圆窗 / 竖窗长回全屏；'drop'：上一镜的画面往下掉，露出一直在后面的她；不写 = 硬切"},
 minDur:1,
 beats:p=>A(p.items).length+A(p.zoom).length+(p.swap?1:0),
 make(p,c){
  const T=c.at,zoomK=zoomCam(A(p.zoom).map(z=>({...z,t:T(z.at)??c.t0})),c.t0);
  const items=A(p.items).map((it,i)=>({...it,t:T(it.at)??c.t0+.3+i*.6,tout:it.out!=null?T(it.out):null,grayAt:it.gray!=null?T(it.gray):null,no:it.no!=null?T(it.no):null,side:it.side??(it.x<960?'l':'r'),
   fillD:it.fill?.d??.5,fillT:it.fill?c.t1-(it.fill.d??.5):null}));
  const sw=p.swap?{...p.swap,t:T(p.swap.at)??c.t0}:null;
  if(sw&&!HOST.box)c.warn('swap 要她的抠像（assets/cut/host/），没有就只换不了背景');
  const color=col(sw?.color??'gold');
  return t=>{
   let cam=zoomK(t);
   const mid=items.map(it=>wallItem(it,t)).join('');
   let back;
   if(sw&&t>=sw.t){
    // 身后换世界：舞台（暖色的光对着她的主光）+ 巨字（0.3 秒从 1.12 倍长到 1，夹在人和底之间）
    const g=E((t-sw.t)/.3),ws=A(sw.words),size=sw.size??560,hx=headX(t),gap=sw.gap??310,top=sw.top??190;
    const gm=[mixc('#ffffff',color,.12),mixc('#ffffff',color,.42)];
    let mg='';if(ws.length===1)mg=S25.mega(ws[0],{x:hx,y:top,size,anchor:'c',m:gm,s:lerp(1.12,1,g),o:g});
    else mg=S25.mega(ws[0],{x:hx-gap,y:top,size,anchor:'r',m:gm,s:lerp(1.12,1,g),o:g})+S25.mega(ws[1],{x:hx+gap,y:top,size,anchor:'l',m:gm,s:lerp(1.12,1,g),o:g});
    const bw=sw.brow?`<div class="s25brow" style="left:${f1(hx-gap-K2.megaW(ws[0]??'',size)+16)}px;top:${f1(top+size*.62)}px;opacity:${f3(g)}"><b>${sw.brow}</b>${sw.en?`<i>${sw.en}</i>`:''}</div>`:'';
    back=`<div style="position:absolute;left:-480px;top:-270px;width:2880px;height:1620px">${stage({tone:'navy',glow:sw.glow??'#c9a25a',gx:'50%',gy:'38%',go:.3})}</div>${mg}${bw}`;
    // 换的那一帧推一下（参考片：换背景时机位没动，只是字从小长大；这里加 2% 的推，让"换"这一下有重量）
    cam={...cam,s:cam.s*(1+.02*E((t-sw.t)/.5))};
    return roomHTML(t,cam,{back,mid:' ',cut:true})+`<div class="k-full" style="z-index:12;background:radial-gradient(ellipse 60% 70% at 50% 45%,transparent 50%,#000a)"></div>`;
   }
   const fl=items.find(it=>it.fillT!=null&&t>=it.fillT);
   if(fl){
    // 镜头往那张照片冲过去（房间跟着推、虚掉），照片从墙上的位置长到满屏，边框退掉、摆正，里面换成实拍
    const u=C((t-fl.fillT)/fl.fillD),e=IO(u),w=fl.w??470,h=fl.h??320;
    const camF={x:lerp(cam.x,fl.x,e*.6),y:lerp(cam.y,fl.y,e*.6),s:cam.s*(1+.5*e)};
    const sx=(fl.x-camF.x)*camF.s+960,sy=(fl.y-camF.y)*camF.s+540,sw2=w*camF.s,sh2=h*camF.s;
    const bx=lerp(sx-sw2/2,0,e),by=lerp(sy-sh2/2,0,e),bw=lerp(sw2,1920,e),bh=lerp(sh2,1080,e),rot=lerp(fl.rot??(fl.side==='r'?1.6:-1.6),0,e);
    const src=fl.fill.clip?KIT_HOST.clipSrc(fl.fill.clip,t,fl.fillT):fl.img;
    const vel=(IO(C((t+1/30-fl.fillT)/fl.fillD))-e)*1920;
    return `<div class="k-full" style="filter:blur(${f1(e*10)}px) brightness(${f3(1-e*.5)})">${roomHTML(t,camF,{mid:items.filter(x=>x!==fl).map(it=>wallItem(it,t)).join('')})}</div>`+
     `<div class="h-wall pic" style="z-index:60;left:${f1(bx)}px;top:${f1(by)}px;width:${f1(bw)}px;height:${f1(bh)}px;transform:rotate(${f3(rot)}deg);border-width:${f1(7*(1-e))}px;border-radius:${f1(6*(1-e))}px;filter:sepia(${f3(.12*(1-e))}) brightness(${f3(lerp(.9,1,e))})${vel>40?` blur(${f1(Math.min(6,vel/60))}px)`:''}"><img src="${src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></div>`;
   }
   return roomHTML(t,cam,{mid});
  };
 }
});
const K2=KIT;

// enter:'grow' / 'drop'：在 K.film 里接上一镜（kit.js 的 wrapEnter 不认识这两个，这里先把它们换成 cut，再自己包）
const film1=KIT.use;
KIT.use=async F=>{
 const K=await film1(F);
 const film0=K.film;
 K.film=async list=>{
  const ent=list.map(sp=>sp&&['grow','drop'].includes(sp.enter)?sp.enter:null);
  const out=await film0(list.map((sp,i)=>ent[i]?{...sp,enter:'cut'}:sp));
  out.forEach((s,i)=>{if(!ent[i])return;s.enter=ent[i];const prev=out[i-1];if(!prev)return;
   if(s.scene!=='host')throw Error(`第 ${i+1} 镜：enter:'${ent[i]}' 只给 scene:'host'（回到她的房间）用`);
   const base=s.f,t0=s.t0,pf=prev.p.host,pfun=prev.f;
   s.f=ent[i]==='grow'?t=>{const u=t-t0;if(u>=.5||!pf)return base(t);
     const e=IO(u/.5),from=pf==='window'?winView(t):pipView(t),v=morph(from,fullView(),e);
     return `<div class="k-full">${MV.still(pfun,t0-.01)}</div><div class="k-full" style="z-index:70">${lookIn(v.box,v,base(t),{ring:e<.85})}</div>`;}
    :t=>{const u=t-t0;if(u>=.42)return base(t);
     // 上一镜整张往下掉（带竖向运动模糊），她的房间一直在后面。里面那层裁到画面大小：舞台、原文页都比画面大，不裁就从上面露出来
     const e=C(u/.42)**2.2,dy=e*1150,v=(C((u+1/30)/.42)**2.2-e)*1150;
     return base(t)+`<div class="k-full" style="z-index:80;transform:translateY(${f1(dy)}px);filter:${S25.mbF(0,v,14)}drop-shadow(0 -20px 40px #0009)"><div class="k-full" style="overflow:hidden">${MV.still(pfun,t0-.01)}</div></div>`;};
   const sh=F.shots.find(x=>x.t0===s.t0);if(sh)sh.f=s.f;});
  return out;
 };
 return K;
};

const css=`.h-wall{position:absolute;box-shadow:14px 22px 40px rgba(0,0,0,.55),0 2px 6px rgba(0,0,0,.4);transform-origin:50% 0}
.h-wall.pic{border:7px solid #efe8da;border-radius:6px;background:#111;overflow:hidden}
.h-wall.tag{border-radius:12px;background:linear-gradient(180deg,#fbf6ea,#e9e0cc);border:1.5px solid #fff8}
.h-wall .h-lab{position:absolute;left:0;right:0;bottom:-2px;padding:10px 0 8px;text-align:center;font:44px Shu,'Alimama ShuHeiTi',sans-serif;letter-spacing:6px;color:#fff;background:linear-gradient(180deg,transparent,rgba(0,0,0,.72));text-shadow:0 2px 8px #000}
.h-wall.tag .h-lab{position:absolute;top:18px;bottom:auto;background:none;color:#5b4a2c;text-shadow:none;font-size:36px}
.h-wall .h-val{position:absolute;left:0;right:0;bottom:26px;text-align:center;font:96px Num,'Bebas Neue',sans-serif;color:var(--c,#2b2418);line-height:1}
.h-wall .h-val .c{font-size:.5em;vertical-align:.55em;margin-right:4px}.h-wall .h-val .u{font:.36em Shu,sans-serif;margin-left:4px}
.h-wall .h-val small{display:block;font:28px Shu,sans-serif;letter-spacing:4px;color:#7a6a4c;margin-bottom:6px}
.h-wall .h-no{position:absolute;inset:0;background:linear-gradient(45deg,transparent 47%,#d6333d 47%,#d6333d 53%,transparent 53%),linear-gradient(-45deg,transparent 47%,#d6333d 47%,#d6333d 53%,transparent 53%);background-size:46% 46%;background-position:50% 50%;background-repeat:no-repeat;filter:drop-shadow(0 2px 4px #0008)}
.h-win{position:absolute;overflow:hidden;background:#111;box-shadow:0 24px 60px rgba(0,0,0,.75)}
.h-win.ring{box-shadow:0 0 0 4px #f4f1ea,0 24px 60px rgba(0,0,0,.75)}
.h-panel{position:absolute;overflow:hidden;background:#0b1019;box-shadow:0 0 0 1.5px rgba(255,255,255,.16),0 30px 80px rgba(0,0,0,.8)}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
window.KIT_HOST={use,lookIn,HOST,roomSrc,cutSrc,headX,roomHTML,winHTML,morph,pipView,winView,fullView,PIP,WIN,PANEL,FACE,wallItem};
})();
