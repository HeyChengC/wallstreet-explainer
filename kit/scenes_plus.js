// scenes_plus.js —— 真人口播版新加的场景（载入顺序：scenes.js → scenes_plus.js → host.js）
(()=>{
const K=KIT,{C,IO,E,lerp,f1,f3,col,mixc,alpha,fit,camSeq,bignum,brow,appear}=K;
const {L}=S25;
const A=v=>v==null?[]:Array.isArray(v)?v:[v];

// =====================================================================================
// line：一条真实的价格走势（日线），深色舞台上一条亮线 + 下面一片渐变（小Lin说日元那条图的做法）
// 线跟着话画出来；mark 钉在某一天；level 从最后一个点往回拉一条虚线，碰到"上一次这么低"的那天（= 一年多来最低）；
// focus 镜头推到一段（10 月），这一段变红，旁边立一个大数
// =====================================================================================
K.scene('line',{
 says:'一样东西的价格这一年怎么走的：涨到哪、跌回哪、最近这一段跌了多少',
 use:'有真实的日线数据（金价、油价、汇率、股价）；话里说的是"走势"本身（反而跌、跌回一年前、一个月跌了 7%）',
 avoid:'只有几个年份的数（用 chart / bars）；没有出处的数据',
 need:['data'],
 help:{data:"{points:[['2025-09-02',3592.2],…]} 或者 assets/data/xx.json 的内容（film.js 里先 fetch）",title:"左上角眉题：'黄金价格 · 美元/盎司'",en:"眉题下的英文小字：'GOLD · USD / OZ'",
  color:"线的颜色（默认 gold）",from:"从哪天开始画（'2025-09-01'）",draw:"{at, until}：线从左画到右的时间（默认这一镜开头 1.6 秒）",
  marks:"[{at, date:'2026-01-29'|'max'|'last', text:'历史最高', value:'$5,318'}]：钉在某一天的小牌",
  level:"{at, text:'一年多来最低'}：从最后一个点往回拉一条虚线，停在上一次这么低的那天",
  focus:"{at, from:'2026-10-01', value:'-6.9%', brow:'10月 · 金价'}：镜头推到这一段，线变红，旁边立大数",intro:"开场先贴近线的起点、边画边拉远看整年（默认）；'none' 不要",unit:"y 轴单位前缀（默认 '$'）",source:'数据出处（只写进 brief，不上屏）'},
 minDur:2,
 beats:p=>A(p.marks).length+(p.level?1:0)+(p.focus?1:0),
 make(p,c){
  const pts=(p.data.points??p.data).filter(q=>!p.from||q[0]>=p.from),N=pts.length,vs=pts.map(q=>q[1]);
  const lo=Math.min(...vs),hi=Math.max(...vs),pad=(hi-lo)*.12,y0=lo-pad,y1=hi+pad*.6;
  const X0=250,X1=1690,Y0=210,Y1=800,X=i=>X0+(X1-X0)*i/(N-1),Y=v=>Y1-(Y1-Y0)*(v-y0)/(y1-y0);
  const color=col(p.color??'gold'),lc=p.color?color:'#f3d27a';
  const T=c.at,dA=T(p.draw?.at)??c.t0+.05,dB=T(p.draw?.until)??dA+1.6;
  const idx=d=>d==='max'?vs.indexOf(hi):d==='last'||d==null?N-1:Math.max(0,pts.findIndex(q=>q[0]>=d));
  const marks=A(p.marks).map(m=>({...m,i:idx(m.date),t:T(m.at)??dB}));
  const lv=p.level?{...p.level,t:T(p.level.at)??dB+.2}:null;
  if(lv){const v=vs[N-1];let j=N-2;while(j>0&&vs[j]>v)j--;lv.j=j;}
  const fo=p.focus?{...p.focus,t:T(p.focus.at),i0:idx(p.focus.from),i1:idx(p.focus.to)}:null;
  // 机位：先看整年 → focus 推到那一段（框住那一段 + 右边的大数）
  // 开场：先贴近线的起点，线往右画的时候拉远看整年（拉远 = "整体是这样"）；p.intro:'none' 不要这一下
  const keys=p.intro==='none'?[{t:c.t0,cam:{x:960,y:520,s:1}}]:[{t:c.t0,cam:{x:X0+420,y:Y(vs[0])-40,s:1.32}},{t:dA+.35,cam:{x:960,y:520,s:1},d:Math.max(.9,(dB-dA)*.75)}];
  if(fo){const xs=[X(fo.i0),X(fo.i1)],ys=vs.slice(fo.i0,fo.i1+1).map(Y);keys.push({t:fo.t,cam:fit([xs[0]-700,Math.min(...ys)-90,xs[1]+150,Y(vs[N-1])+330],{pad:30,max:2.1}),d:1});}
  const cam=camSeq(keys,.018);
  const grid=(()=>{let h='';const step=Math.pow(10,Math.floor(Math.log10((y1-y0)/4))),st=[1,2,5].map(k=>k*step).find(s=>(y1-y0)/s<=6)??step*10;
   for(let v=Math.ceil(y0/st)*st;v<y1;v+=st)h+=`<line x1="${X0}" x2="${X1+30}" y1="${f1(Y(v))}" y2="${f1(Y(v))}" stroke="#ffffff14" stroke-dasharray="4 8"/><text x="${X1+46}" y="${f1(Y(v)+8)}" fill="#ffffff55" font-family="Num,'Bebas Neue'" font-size="34">${p.unit??'$'}${v.toLocaleString('en-US')}</text>`;
   let lastM='';pts.forEach((q,i)=>{const m=q[0].slice(0,7);if(m!==lastM){lastM=m;const mm=+m.slice(5);if(mm%3===1||i===0)h+=`<text x="${f1(X(i))}" y="${Y1+46}" fill="#ffffff66" font-family="Mi,MiSans" font-size="30" text-anchor="middle">${mm===1?m.slice(0,4)+'.':''}${mm}月</text><line x1="${f1(X(i))}" x2="${f1(X(i))}" y1="${Y1}" y2="${Y1+12}" stroke="#ffffff33"/>`;}});
   return h;})();
  const pathTo=(i0,i1,k)=>{let d='';const n=Math.floor(k);for(let i=i0;i<=Math.min(i1,n);i++)d+=(i===i0?'M':'L')+f1(X(i))+' '+f1(Y(vs[i]))+' ';
   if(k<i1&&n>=i0&&n+1<=i1){const fr=k-n;d+='L'+f1(lerp(X(n),X(n+1),fr))+' '+f1(lerp(Y(vs[n]),Y(vs[n+1]),fr));}return d;};
  return t=>{
   const cc=cam(t),cp=cam(t-1/30),k=(N-1)*E(C((t-dA)/(dB-dA)));
   const head=[lerp(X(Math.floor(k)),X(Math.min(N-1,Math.floor(k)+1)),k%1),lerp(Y(vs[Math.floor(k)]),Y(vs[Math.min(N-1,Math.floor(k)+1)]),k%1)];
   const fk=fo?E(C((t-fo.t-.25)/.5)):0;
   const line=pathTo(0,N-1,k),area=k>0?line+` L${f1(head[0])} ${Y1} L${X0} ${Y1} Z`:'';
   let svg=`<svg class="k-full" width="1920" height="1080" style="overflow:visible"><defs><linearGradient id="lg_a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${lc}" stop-opacity=".5"/><stop offset="1" stop-color="${lc}" stop-opacity="0"/></linearGradient></defs>${grid}`;
   svg+=`<path d="${area}" fill="url(#lg_a)"/><path d="${line}" fill="none" stroke="${lc}" stroke-width="6" stroke-linejoin="round" style="filter:drop-shadow(0 0 8px ${alpha(lc,.6)})"/>`;
   if(fo&&fk>0)svg+=`<path d="${pathTo(fo.i0,fo.i1,fo.i1)}" fill="none" stroke="#ff5a5f" stroke-width="6.5" stroke-linejoin="round" style="opacity:${f3(fk)};filter:drop-shadow(0 0 10px #ff5a5f99)"/>`;
   if(k<N-1.01)svg+=`<circle cx="${f1(head[0])}" cy="${f1(head[1])}" r="8" fill="#fff" style="filter:drop-shadow(0 0 10px ${lc})"/>`;
   else{const pu=.5+.5*Math.sin((t-dB)*6);svg+=`<circle cx="${f1(X(N-1))}" cy="${f1(Y(vs[N-1]))}" r="${f1(9+pu*4)}" fill="${fo&&fk>0?'#ff5a5f':lc}" stroke="#fff" stroke-width="3"/>`;}
   if(lv&&t>=lv.t){const e=E(C((t-lv.t)/.6)),xa=X(N-1),xb=lerp(xa,X(lv.j),e),yy=Y(vs[N-1]);
    svg+=`<line x1="${f1(xa)}" x2="${f1(xb)}" y1="${f1(yy)}" y2="${f1(yy)}" stroke="#fff" stroke-width="2.5" stroke-dasharray="10 9" opacity=".8"/>`;
    if(e>.95)svg+=`<circle cx="${f1(X(lv.j))}" cy="${f1(yy)}" r="7" fill="#fff" opacity="${f3(C((t-lv.t-.6)/.2))}"/>`;}
   svg+='</svg>';
   let tags='';
   for(const m of marks){if(t<m.t)continue;const q=appear(t,m.t),x=X(m.i),y=Y(vs[m.i]),up=m.below?1:-1;
    tags+=`<div class="k-tag" style="left:${f1(x+34)}px;top:${f1(y-34)}px;font-size:58px;${K.fx({o:q.o*(1-fk),dy:q.dy},'translate(0,0)')}">${m.text?`<small>${m.text}</small>`:''}${m.value?K.unitHTML(K.num(m.value)):''}</div><div style="position:absolute;left:${f1(x-9)}px;top:${f1(y-9)}px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 0 12px ${lc};opacity:${f3(q.o*(1-fk))}"></div>`;}
   if(lv&&t>=lv.t+.5&&lv.text){const q=appear(t,lv.t+.5);tags+=`<div class="k-label" style="left:${f1((X(N-1)+X(lv.j))/2)}px;top:${f1(Y(vs[N-1])+64)}px;font-size:54px;${K.fx({o:q.o*(1-fk),dy:q.dy})}">${lv.text}</div>`;}
   if(fo&&fk>0){const bx=X(fo.i0)-40,by=Y(vs[N-1])+200;
    tags+=bignum({x:bx,y:by,value:fo.value,size:190,anchor:'r',color:'red'},{o:fk,dy:(1-fk)*16});
    if(fo.brow)tags+=brow({x:bx,y:by-170,zh:fo.brow,en:fo.en,anchor:'r',size:40},{o:fk});}
   const ttl=p.title?brow({x:X0,y:120,zh:p.title,en:p.en,anchor:'l'},{o:C((t-c.t0)/.3)*(1-fk*.7)}):'';
   return c.bg(t,cc,cp)+L(cc,cp,1,svg+tags+ttl,{mbMax:8,zbMax:1.5});
  };
 }
});

// =====================================================================================
// chain：一条因果链，几张卡一字排开，念到哪张亮哪张（前面的退一步），箭头跟着画出来
// 镜头基本不动（只慢推），适合放进 host:'window' 的板子里：一句话里连着说三四环，镜头追着跑会糊
// =====================================================================================
K.scene('chain',{
 says:'一件事怎么一环扣一环推到下一件：打仗 → 油价 → 通胀 → 利率',
 use:'一句话里连着说三四个"所以"；每一环有一个画面或一个数',
 avoid:'环和环之间不是因果（并列用 stats / discs）；超过 4 环',
 need:['items'],
 help:{items:"[{at, title:'油价', img|value:'$104', sub:'10月30日', color}]：一环一张卡，at 念到它的时候亮起",arrow:'箭头上的字（可选，每段一样）'},
 minDur:1.2,
 beats:p=>A(p.items).length,
 make(p,c){
  const its=A(p.items).map((q,i)=>({...q,t:c.at(q.at)??c.t0+.2+i*.5})),n=its.length,W=n>=4?390:470,H=n>=4?560:520,G=n>=4?80:110;
  const tot=n*W+(n-1)*G,x0=960-tot/2+W/2,y=500;
  return t=>{
   const cc={x:960,y:520,s:1+.012*(t-c.t0)},cp={...cc,s:1+.012*(t-1/30-c.t0)};
   let cur=-1;its.forEach((q,i)=>{if(t>=q.t)cur=i;});
   let h='';
   its.forEach((q,i)=>{if(t<q.t)return;const a=appear(t,q.t,.25,18),x=x0+i*(W+G),on=i===cur,dim=on?1:.72;
    const cl=col(q.color??'steel');
    const media=q.img?`<img src="${q.img}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`:'';
    const v=q.value?`<div class="ch-v" style="top:${q.img?'30%':'26%'}">${K.unitHTML(K.num(q.value))}</div>`:'';
    h+=`<div class="ch-card${q.img?' img':''}" style="left:${f1(x-W/2)}px;top:${f1(y-H/2)}px;width:${W}px;height:${f1(H)}px;--c:${cl};${K.fx({o:a.o,dy:a.dy,br:dim,sc:on?1.04:1},'translate(0,0)')}">${media}${v}<div class="ch-t">${q.title}</div>${q.sub?`<div class="ch-s">${q.sub}</div>`:''}</div>`;
    if(i>0){const k=E(C((t-q.t+.15)/.3)),ax=x-W/2-G+14,aw=(G-28)*k;
     h+=`<svg style="position:absolute;left:${f1(ax)}px;top:${f1(y-22)}px;overflow:visible" width="${G}" height="44"><path d="M0 22 H${f1(Math.max(0,aw-14))}" stroke="#f3d27a" stroke-width="6" stroke-linecap="round"/>${k>.9?`<path d="M${f1(aw-22)} 8 L${f1(aw)} 22 L${f1(aw-22)} 36" fill="none" stroke="#f3d27a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`:''}</svg>`;}
   });
   return c.bg(t,cc,cp)+L(cc,cp,1,h);
  };
 }
});
const css=`.ch-card{position:absolute;border-radius:16px;overflow:hidden;background:linear-gradient(160deg,color-mix(in srgb,var(--c) 70%,#fff 8%),color-mix(in srgb,var(--c) 55%,#000 45%));box-shadow:0 0 0 2px rgba(255,255,255,.18),0 30px 70px rgba(0,0,0,.7)}
.ch-card.img::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.78))}
.ch-card .ch-t{position:absolute;left:0;right:0;bottom:22px;z-index:2;text-align:center;font:64px Shu,'Alimama ShuHeiTi',sans-serif;letter-spacing:8px;color:#fff;text-shadow:0 3px 12px #000a}
.ch-card .ch-v{position:absolute;left:0;right:0;top:20%;text-align:center;font:150px Num,'Bebas Neue',sans-serif;line-height:1;background:linear-gradient(180deg,#fffef2,#fff3b5 60%,#efdc7a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 10px #0008)}
.ch-card .ch-v .c{font-size:.45em;vertical-align:.9em}.ch-card .ch-v .u{font:.32em Shu,sans-serif}
.ch-card .ch-s{position:absolute;left:0;right:0;top:12px;text-align:center;font:24px Mi,sans-serif;letter-spacing:3px;color:#ffffffa0}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
})();
