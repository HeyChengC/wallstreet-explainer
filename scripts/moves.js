// moves.js —— 手法库：一个手法 = 一个动作怎么动（时长、方向、前后层、模糊）。不是镜头，不是模板。
// 画面里的人、字、颜色、位置全部由这条片自己传进来，这里不给默认画面。
// 什么时候用、什么时候不适配：references/motion.md 的手法清单。意思对得上才用；对不上，或者要大改参数才塞得进去，就在 film.js 里手写。
// 载入顺序：stage25d.js → film_base.js → moves.js → film.js。用法：const M=MV;
// 每次调用都要写 why：这一下在说什么（"换一个人来说：黄仁勋 → Altman"）。render.mjs --moves 会列出全片用了哪些手法、有没有连着用、和上一条片像不像。
//
// 三类返回值：
//   转场（pushSwap / pushThrough / blurToBase / frameFill）：返回整帧 HTML，from 是上一镜（函数，画它最后一刻），to 是这一镜（函数）。
//   包一层（layFlat / standUp / whipIn / popWindow / montage）：把你给的画面按这一刻的动作包起来，返回 HTML。
//   给数值（bgSwap / megaFlip / cardFocus / roll）：只返回位置、透明度、虚化这些数，画面你自己画。
(()=>{
const {C,IO,lerp,mbF}=S25;
const E=x=>1-(1-C(x))**3;
const full='position:absolute;inset:0';
const f3=v=>v.toFixed(3),f1=v=>v.toFixed(1),f4=v=>v.toFixed(4);

// ---------- 用量登记（render.mjs --moves 读） ----------
const LOG=[],seen=new Set(),nowhy=new Set();let quiet=0;
function use(name,o){
 if(quiet)return;
 const s=window.FB?.cur??{shot:-1,t:0},key=s.shot+'|'+name;
 if(seen.has(key))return;seen.add(key);
 LOG.push({shot:s.shot,t:+s.t.toFixed(2),move:name,why:o.why??''});
 if(!o.why&&!nowhy.has(name)){nowhy.add(name);console.warn(`[moves] ${name} 没写 why：这一下在说什么？说不出来就别用这个手法`);}
}
// 画别的镜头的某一刻（上一镜的末态、冻住的背景）：里面用到的手法不算这一镜的用量
function still(fn,t){quiet++;try{return fn(t);}finally{quiet--;}}

// ---------- 转场：返回整帧 ----------

// 横推换人：整组（底 + 字 + 人）横推出画，新的一组从另一边推进来，两组带方向模糊。说的是"换一个人、换一件事"。
// o: t0 开始, d 时长(.42), dir -1 往左推 / 1 往右推, from(t) 上一组（画 t0 前一刻）, to(t,{moving}) 新一组
function pushSwap(t,o){
 const d=o.d??.42,dir=o.dir??-1;
 if(t>=o.t0+d)return o.to(t,{moving:false});
 use('pushSwap',o);
 const W=(window.STAGE?.w??1920)*dir,k=IO((t-o.t0)/d),kp=IO((t-1/30-o.t0)/d),dx=W*k,mbv=mbF(dx-W*kp,0),fl=mbv?`filter:${mbv}`:'';
 return `<div style="${full};transform:translateX(${f1(dx)}px);${fl}">${still(o.from,o.t0-.01)}</div>`+
  `<div style="${full};transform:translateX(${f1(dx-W)}px);${fl}">${o.to(t,{moving:true})}</div>`;
}

// 推过镜头：上一镜最后一帧放大、虚掉、淡出，盖在新一镜上。说的是"冲进下一个世界"，用在换舞台、又没有东西能带过去的时候。
// o: t0, d(.3), from(t), to(t), s 放大到(1.6), blur(14), at [x,y] 放大中心（对准要冲进去的那个东西）, zi(80)
function pushThrough(t,o){
 const d=o.d??.3,z=C((t-o.t0)/d);let h=o.to(t);
 if(z>=1)return h;
 use('pushThrough',o);
 const org=o.at?`transform-origin:${o.at[0]}px ${o.at[1]}px;`:'';
 return h+`<div style="${full};${org}transform:scale(${f3(lerp(1,o.s??1.6,E(z)))});filter:blur(${f1(z*(o.blur??14))}px);opacity:${1-z};z-index:${o.zi??80}">${still(o.from,o.t0-.01)}</div>`;
}

// 上一镜虚化当底：上一镜最后一帧在 d 秒里虚掉、压暗，退成新一镜出现的那一刻。用在两个世界之间、又没有对象可带的时候。
// o: t0, d(.45), from(t), to(t), blur(26), br 压暗到(.4), zi(80)
function blurToBase(t,o){
 const d=o.d??.45,z=C((t-o.t0)/d);let h=o.to(t);
 if(z>=1)return h;
 use('blurToBase',o);
 return h+`<div style="${full};z-index:${o.zi??80};opacity:${f3(1-z)};filter:blur(${f1(z*(o.blur??26))}px) brightness(${f3(lerp(1,o.br??.4,z))})">${still(o.from,o.t0-.01)}</div>`;
}

// 画框推满屏：画框里的那份东西推到满屏，接着就是下一镜。推近的是同一份东西，不换成一张相似的图。
// o: t0 开始推, t1 推满（下一镜的画面从这里接手）, from(t) 画框所在的上一镜, box [cx,cy,w] 画框起始位置（16:9）,
//    frame(t,[cx,cy,w],{bw,r,blur}) 画这个画框, to(t) 推满以后的画面, settle 推满后从多大收到 1(1.08), sd 收的时长(.35), bw(6) r(12) 画框起始边宽和圆角, blur 中途最虚(5)
function frameFill(t,o){
 if(t>=o.t1){const x=E((t-o.t1)/(o.sd??.35)),s=lerp(o.settle??1.08,1,x);
  return x>=1?o.to(t):`<div style="${full};transform:scale(${f4(s)})">${o.to(t)}</div>`;}
 use('frameFill',o);
 const k=IO((t-o.t0)/(o.t1-o.t0)),[cx,cy,w]=o.box;
 return `<div style="${full};opacity:${f3(1-k)}">${still(o.from,o.t0-.01)}</div>`+
  o.frame(t,[lerp(cx,960,k),lerp(cy,540,k),lerp(w,1940,k)],{bw:lerp(o.bw??6,0,k),r:lerp(o.r??12,0,k),blur:Math.sin(k*Math.PI)*(o.blur??5)});
}

// ---------- 包一层：返回 HTML ----------

// 证据小卡、反应窗：从相关的地方（箭头、圆盘、画框）撑开成一个窗口，背景压暗；看完缩回原处，背景没有离场。
// 不要切成全屏打断上一镜的那张图。
// o: t0 撑开, t1 开始缩回, d(.35) 撑开时长, dout(.3) 缩回时长, from [x,y,w,h] 起点（圆盘就写外接方框，配 r0=半径）,
//    to [x,y,w,h] 窗口, html 窗口里的东西, r0/r1 起止圆角(12/12), border(6px #f4f1ea, 写 'none' 不要边),
//    dim 背景压到多暗(.5), under(t) 给了就把背景冻成这一帧再压暗虚化（blur 像素），不给就只叠一层黑, fade 窗口淡入的快慢(3)
function popWindow(t,o){
 const a=E((t-o.t0)/(o.d??.35)),z=E((t-o.t1)/(o.dout??.3)),k=a*(1-z);
 let h='';
 if(o.under)h+=`<div style="${full};filter:brightness(${f3(lerp(1,o.dim??.5,k))}) blur(${f1(k*(o.blur??0))}px)">${still(o.under,o.t0-.01)}</div>`;
 if(k<=.01)return h;
 use('popWindow',o);
 const [x0,y0,w0,h0]=o.from,[x1,y1,w1,h1]=o.to;
 if(!o.under)h+=`<div style="${full};background:#000;opacity:${f3((1-(o.dim??.5))*k)};z-index:70"></div>`;
 const bd=o.border==='none'?'':`border:${o.border??'6px solid #f4f1ea'};`;
 return h+`<div style="position:absolute;left:${f1(lerp(x0,x1,k))}px;top:${f1(lerp(y0,y1,k))}px;width:${f1(lerp(w0,w1,k))}px;height:${f1(lerp(h0,h1,k))}px;${bd}border-radius:${f1(lerp(o.r0??12,o.r1??12,k))}px;overflow:hidden;box-shadow:0 30px 80px #000c;opacity:${C(k*(o.fade??3))};z-index:75">${o.html}</div>`;
}

// 平面倒成桌面：前面的东西讲完了、还要留作背景时，整层转到透视平面上、下沉、压暗；新主角接着从下面立起来（standUp）。
// o: t0, d(.7), html 要倒下去的那一层（一般是上一镜冻住的画面）, rx 倒到多少度(62), drop 下沉(330), s [起,止] 放大(1.06→1.25), br 压暗到(.28), persp(1500), origin 透视中心('50% 20%')
function layFlat(t,o){
 const k=IO((t-o.t0)/(o.d??.7));
 if(k>0)use('layFlat',o);
 const [s0,s1]=o.s??[1.06,1.25];
 return `<div style="position:absolute;inset:0;perspective:${o.persp??1500}px;perspective-origin:${o.origin??'50% 20%'}"><div style="${full};transform:translateY(${f1(k*(o.drop??330))}px) rotateX(${(k*(o.rx??62)).toFixed(2)}deg) scale(${f4(lerp(s0,s1,k))});transform-origin:50% 100%;filter:brightness(${f3(lerp(1,o.br??.28,k))})">${o.html}</div></div>`+
  `<div style="${full};background:radial-gradient(ellipse at 50% 40%,#0000 30%,#000c 100%);opacity:${f3(k)}"></div>`;
}
// 立起来：新主角从下面立起来（跟在 layFlat 后面，或者从桌面上站起来）。
// o: t0, d(.5), rect [x,y,w,h], html, rise 从多低(520), tilt 起始后仰(24°), end 停下时的倾角(3°), persp(2200)
function standUp(t,o){
 const q=E((t-o.t0)/(o.d??.5)),[x,y,w,h]=o.rect;
 if(q>0)use('standUp',o);
 return `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:translateY(${f1(lerp(o.rise??520,0,q))}px) perspective(${o.persp??2200}px) rotateX(${lerp(o.tilt??24,o.end??3,q).toFixed(2)}deg);transform-origin:50% 100%;opacity:${f3(C(q*2))}">${o.html}</div>`;
}

// 甩进来：画框、卡片从画外甩到位，带方向模糊。说的是"又来了一样东西"，两样东西要同时停在屏上时用。
// o: t0, d(.32), dir -1 从左 / 1 从右（竖向用 axis:'y'）, dist 从多远(1500), html。返回 {k,html}：k 是到位的进度，配套的线、标签可以跟着它淡入
function whipIn(t,o){
 if(t<o.t0)return {k:0,html:''};
 use('whipIn',o);
 const d=o.d??.32,dist=(o.dist??1500)*(o.dir??1),m=E((t-o.t0)/d),mp=E((t-1/30-o.t0)/d);
 const v=lerp(dist,0,m),vp=lerp(dist,0,mp),y=o.axis==='y',mbv=y?mbF(0,v-vp):mbF(v-vp,0);
 return {k:m,html:`<div style="${full};transform:translate${y?'Y':'X'}(${f1(v)}px);${mbv?`filter:${mbv}`:''}">${o.html}</div>`};
}

// 钉住一个东西、底下换实拍：前景（片名、那个数、圆盘徽章）不动，底下的实拍压暗去色，step 秒一换。说的是"这件事 = 这些画面"。
// 前景必须有一个视线落点；没有落点就不要这么快地换实拍。
// o: t0, clips [实拍名…], step(.42), br/sat/bl 压暗去色略虚, s0 起始放大(1.04), drift 每秒放大(.012)
function montage(t,o){
 use('montage',o);
 const k=t-o.t0,step=o.step??.42,cl=o.clips,i=Math.floor(Math.max(0,k)/step),n=cl[i%cl.length],u=k-i*step;
 const src=FB.fr(n,(Math.floor(i/cl.length)*9)%Math.max(1,FB.CL[n]-14)+1+u*30);
 return `<div style="${full};transform:scale(${f4((o.s0??1.04)+(o.drift??.012)*k)})">${S25.demote(src,o)}</div>`;
}

// ---------- 给数值：画面自己画 ----------

// 人身后换背景：说到关键词那一刻，实拍原片换成同一个人的抠像压在新底上（位置一模一样，看不出接缝），再挪到构图位置、放大。
// 说的是"话题换到另一个世界，人还是那个人"。抠像要从没有切点的实拍里逐帧抠（matte.py）。
// o: t0 换的那一刻, delay 换完停多久再挪(.05), d 挪过去的时长(.6), ax/ay 原片里的对齐点(960/1080), to {x,y,sc} 构图位置, from {x,y,sc} 原片在画面里的位置（默认全屏原位）
// 返回 S25.cutP 的参数 {x,y,ax,ay,sc,track}；在 t0 之前画实拍，t0 之后画新底 + cutP(名,帧,返回值)
function bgSwap(t,o){
 if(t>=o.t0)use('bgSwap',o);
 const pk=IO((t-o.t0-(o.delay??.05))/(o.d??.6)),ax=o.ax??960,ay=o.ay??1080,f=o.from??{x:ax,y:ay,sc:1};
 return {x:lerp(f.x,o.to.x,pk),y:lerp(f.y,o.to.y,pk),ax,ay,sc:lerp(f.sc??1,o.to.sc,pk),track:Math.max(1e-3,pk),pk};
}

// 巨字随话翻：同一个人、同一个底，字换一句。旧字往下滑出，新字从上面落下。说的是"同一个人，换一个说法"。
// o: t0 开始翻, d(.24), dist 滑多远(150)。返回 {out:{o,dy}, in:{o,dy}, k}：旧字用 out，新字用 in
function megaFlip(t,o){
 const k=E((t-o.t0)/(o.d??.24)),dist=o.dist??150;
 if(k>0)use('megaFlip',o);
 return {k,out:{o:1-k,dy:k*dist},in:{o:k,dy:(1-k)*-dist}};
}

// 卡片在人旁边冒出来，焦点移过去：说到"他说的这样东西"时，人旁边冒一张小卡；身后的巨字同时虚掉、压暗。大字和小卡同框，大小对比自己说话。
// 镜头往卡片那边挪一点：在 camPath 里加一次移动，时刻对上 t0。
// o: t0 焦点开始移, d(.6) 移的时长, delay 卡片晚多少出来(.2), cd 卡片淡入(.3), rise 卡片上移(20), dim 巨字压到(.5), blur 巨字虚到(7), pulse 卡片在这个时刻轻轻一跳（可选）
// 返回 {big:{o,b}, card:{o,dy,s}}：big.o 乘到巨字透明度上，card.dy 加到卡片的 top 上
function cardFocus(t,o){
 const foc=IO((t-o.t0)/(o.d??.6)),dl=o.delay??.2,q=t>=o.t0+dl?E((t-o.t0-dl)/(o.cd??.3)):0;
 if(foc>0)use('cardFocus',o);
 const pul=o.pulse!=null?1+.05*Math.sin(C((t-o.pulse)/.3)*Math.PI):1;
 return {big:{o:lerp(1,o.dim??.5,foc),b:foc*(o.blur??7)},card:{o:q,dy:lerp(o.rise??20,0,q),s:pul},foc};
}

// 累加滚数：只在"累加、越来越多"本身就是意思的时候用（几家加起来、按年累计），一条片最多一两次。
// 从第一笔开始，话说到那个数时正好停；显示时写满位、按十亿取整（S25.fmtB）。
// o: t0, t1 停在哪一刻（cue 那个数）, from 第一笔, to 总数, ease 曲线（默认先快后慢）, k 直接给进度（跟着曲线画的时候）
function roll(t,o){
 const k=o.k??C((t-o.t0)/(o.t1-o.t0));
 if(k>0)use('roll',o);
 return lerp(o.from??0,o.to,(o.ease??E)(k));
}

window.MV={pushSwap,pushThrough,blurToBase,frameFill,popWindow,layFlat,standUp,whipIn,montage,bgSwap,megaFlip,cardFocus,roll,still,LOG};
})();
