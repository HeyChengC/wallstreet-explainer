// vpro.js —— 竖屏"精装"组件（v2.6，2026-11-20）。载入顺序：vert.js 后面；样式在 vpro.css。
// 来历：《英伟达拒绝老黄回归》竖屏改了九版，用户点头的那一版（examples/nvda-vertical/）。对标小Lin说竖屏片量出来、试出来的五条：
//   1 口播画面保持亮，不压黑          2 强调色从口播画面里取（她的衣服、布景），全片一套颜色、一种卡
//   3 东西做大、敢出框                4 会动的是真东西的抠图或生图道具，不用代码画
//   5 每样东西只做一个有意思的动作，落定后一个像素不动（不弹、不晃、不飘、镜头不顿）
// 二十个组件，有她没她都能用：前 8 个是讲故事的（有口播时她是底），后 12 个是算账、比较、引用、分段的图形镜头（有口播时她在角上的圆头像里）。
// 有口播素材就垫她的实拍，没有（或写 host:false）就垫 bg 那张图。一条片里每个组件最多用一两次，进场别重复。
// 用法：film.js 里 await KIT_VERT.use(K,{…}) 之后写一句 KIT_VPRO.theme({accent:'#8a86ee'})，颜色取自口播画面；然后镜头表里写 scene:'vp-words' 这些。
(()=>{
const {S,W,ZH,A,plain,fitH,fitU,fitN,hostBox,avatar,roomSrc,HOST}=KIT_VERT;
const {hashf}=KIT;
const c01=x=>Math.max(0,Math.min(1,x)),f1=x=>(+x).toFixed(1),f3=x=>(+x).toFixed(3),lerp=(a,b,k)=>a+(b-a)*k;
const oc=k=>1-Math.pow(1-c01(k),3);                                   // 减速
const oe=k=>{k=c01(k);return k>=1?1:1-Math.pow(2,-10*k);};            // 急停（砸）
const ei=k=>c01(k)**2;                                                // 加速（下落）
const io=k=>{k=c01(k);return k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;};   // 推镜头
const tail=(tau,half=.14)=>tau<=0?0:1-Math.pow(.5,tau/half);          // 急冲进来、拖长尾巴（参考片名卡量的：剩余距离每 0.14 秒减半）
const wipe=k=>`clip-path:inset(-20% ${f1(100*(1-k))}% -20% -5%)`;

// ---------- 主题：给一个强调色，其余自己配 ----------
const hex=c=>{const m=/^#([0-9a-f]{6})$/i.exec(c);if(!m)throw Error(`KIT_VPRO.theme：颜色要写成 '#8a86ee' 这样，收到 ${c}`);return [0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16));};
const mix=(a,b,k)=>'#'+hex(a).map((v,i)=>Math.round(lerp(v,hex(b)[i],k)).toString(16).padStart(2,'0')).join('');
const TH={};let PUFF={};
function theme(o={}){
 const a=o.accent??'#8a86ee';
 Object.assign(TH,{accent:a,hi:o.hi??mix(a,'#ffffff',.7),lo:o.lo??mix(a,'#05061c',.58),card1:o.card1??mix(a,'#0b0d2c',.7),card2:o.card2??mix(a,'#05061c',.9),ink:o.ink??'#f4f2ff',
  num1:o.num1??mix(a,'#ffffff',.18),num2:o.num2??mix(a,'#05061c',.5),num3:o.num3??mix(a,'#05061c',.72),up1:o.up1??'#7fe0cc',up2:o.up2??'#2a8f84',cool:o.cool??'#a9c4ff',bg:o.bg??TH.bg??null});
 PUFF={white:['#ffffff',mix('#ffffff',a,.12),mix(a,'#05061c',.55)],accent:[TH.hi,a,TH.lo],cool:[mix(TH.cool,'#ffffff',.8),TH.cool,mix(TH.cool,'#05061c',.55)],gray:['#dfe2e7','#8a8f9a','#474b55']};
 const [r,g,b]=hex(TH.hi);let st=document.getElementById('vp-theme');if(!st){st=document.createElement('style');st.id='vp-theme';document.head.appendChild(st);}
 st.textContent=`:root{--vp-accent:${a};--vp-hi:${TH.hi};--vp-lo:${TH.lo};--vp-card1:${TH.card1};--vp-card2:${TH.card2};--vp-ink:${TH.ink};--vp-line:rgba(${r},${g},${b},.78);--vp-num1:${TH.num1};--vp-num2:${TH.num2};--vp-num3:${TH.num3};--vp-up1:${TH.up1};--vp-up2:${TH.up2}}.v-root{--v-on:${mix(a,'#ffffff',.45)}}`;
 return TH;}
theme();

// ---------- 立体字：鼓起来的面 + 薄厚度 + 外包一圈深色细边，每个字各歪一点，末字更大 ----------
const pch=(ch,col,st='')=>{const c=PUFF[col]??PUFF.white;return `<span class="vp-p" style="--c1:${c[0]};--c2:${c[1]};--e:${c[2]};${st}"><i class="b">${ch}</i><i class="f">${ch}</i></span>`;};
const TILT=[-5,4,-3,6],LIFT=[0,-.06,.05,-.03];
const pword=(text,col,fx,big=true)=>{const cs=[...text];return cs.map((ch,j)=>{const last=big&&j===cs.length-1&&cs.length>1,o=fx?fx(j,cs.length):{};if(o.hide)return `<span style="opacity:0;display:inline-block">${ch}</span>`;
  return pch(ch,o.col??col,`margin:0 ${last?.07:.012}em;transform:${o.pre??''} translateY(${f3(LIFT[j%4]+(o.dy??0))}em) rotate(${f1((last?-7:TILT[j%4])+(o.rot??0))}deg) scale(${f3((last?1.14:1)*(o.sc??1))});opacity:${f3(o.op??1)}`);}).join('');};
const line=(html,y,fs,x=-20,extra='')=>`<div class="vp-word" style="left:${x}px;top:${f1(y)}px;width:${W}px;font-size:${f1(fs)}px;${extra}">${html}</div>`;

// ---------- 底：有她垫她，没她垫图 ----------
const useHost=p=>HOST.on&&p.host!==false;
// 景别只在指定的词上硬切，档位之间不慢推
const zoomS=(p,c)=>{const ks=[{t:-1e9,s:1,x:0},...(typeof p.zoom==='number'?[{t:c.t0,s:p.zoom,x:0}]:A(p.zoom).map(z=>({t:c.at(z.at)??c.t0,s:z.s??1,x:z.x??0})))].sort((a,b)=>a.t-b.t);return t=>{let k=ks[0];for(const z of ks)if(t>=z.t)k=z;return {s:k.s,x:k.x};};};
const BGPOS=['50% 30%','24% 42%','76% 36%','50% 62%','34% 22%'];
const bgOf=p=>p.bg??TH.bg;
const bgPos=(p,c)=>p.bgpos??(p.bg?'50% 30%':BGPOS[Math.floor(hashf(Math.round(c.t0*10),4)*BGPOS.length)]);
const bgHTML=(p,c,t,o={})=>(bgOf(p)?`<div class="v-band" style="top:0;height:${ZH}px;box-shadow:none"><img class="m" src="${bgOf(p)}" style="object-position:${bgPos(p,c)};transform:scale(${f3((o.s??(p.bg?1.1:1.1+.25*hashf(Math.round(c.t0*10),6)))+.012*(t-c.t0))});filter:blur(${o.blur??0}px) brightness(${o.bri??.55}) saturate(.6)"></div>`:'')+'<div class="vp-tint"></div><div class="vp-dots"></div>';
function stage(p,c,zf,t,mid=''){if(useHost(p)){p._hostOn=true;const z=zf(t);return hostBox(t,z.s,z.x,mid)+'<div class="v-botfade"></div>';}return bgHTML(p,c,t)+mid;}
const ava=(p,t,cx=932,cy=196,d=176)=>{if(HOST.on&&p.avatar!==false){p._hostOn=true;return avatar(t,cx,cy,d);}return '';};
const markHost=p=>{if(useHost(p))p._hostOn=true;};
const markAva=p=>{if(HOST.on&&p.avatar!==false)p._hostOn=true;};

// ---------- 道具：一张抠好的图做一个动作，做完就停。任何组件都能挂：props:[{kind,…}] ----------
// obj    {img,at,x,y,w,rot}                从近的那一边滑进来到 (x,y)，长尾巴减速
// pour   {img,at,x,y,w,rot,hide}           从右上滑进来，图的下面 hide% 从上往下露出来（倒水、撒东西）
// hammer {img,at,x,y,w,ar,block,bw,by}     举起—砸在 block 上—收走；img 是槌头在左、柄朝右的横图，(x,y) 是柄尾
// bills  {img,at,n,big}                    一张张从下面喷上来、在空中翻（big:true = 镜头前虚的几张）
// layer：'front'（默认，压在字前）/ 'back'（字后面）/ 'behind'（她身后，要口播抠像）
const hf=(i,s=1)=>{const x=Math.sin(i*127.1+s*311.7)*43758.5453;return x-Math.floor(x);};
const PROP={
 obj(o,c,t){const ta=c.at(o.at)??c.t0+.5,k=tail(t-ta+.12,.16);if(k<=0)return '';const w=o.w??460,x=o.x??-80,y=o.y??780;
  return `<img class="vp-obj" src="${o.img}" style="left:${f1(x-(1-k)*(x<540?720:-720))}px;top:${f1(y)}px;width:${w}px;transform:rotate(${o.rot??-8}deg)">`;},
 pour(o,c,t){const ta=c.at(o.at)??c.t0+1,k=tail(t-ta+.42,.1);if(k<=0)return '';const w=o.w??600,x=o.x??560,y=o.y??420,g=oc((t-ta+.06)/.3);
  return `<img class="vp-obj" src="${o.img}" style="left:${f1(x+(1-k)*760)}px;top:${f1(y-(1-k)*280)}px;width:${w}px;transform:rotate(${o.rot??0}deg);clip-path:inset(0 0 ${f1((o.hide??60)*(1-g))}% 0)">`;},
 hammer(o,c,t){const ts=(c.at(o.at)??c.t0+1)+.1,t0=ts-.62,t1=ts+.16;if(t<t0||t>t1+.3)return '';
  const w=o.w??640,ar=o.ar??.43,px=(o.x??1010)+(1-tail(t-t0,.09))*760+oc((t-t1)/.22)*980,py=o.y??880,bw=o.bw??380;
  const ang=t<ts-.2?lerp(46,66,oc((t-t0-.2)/.2)):t<ts?lerp(66,0,ei((t-(ts-.2))/.2)):0;
  let h=o.block?`<img class="vp-obj" src="${o.block}" style="left:${f1(px-w*.84-bw/2)}px;top:${f1(py+(o.by??w*.13))}px;width:${bw}px">`:'';
  h+=`<img class="vp-obj" src="${o.img}" style="left:${f1(px-w*.96)}px;top:${f1(py-w*ar/2)}px;width:${w}px;transform-origin:96% 48%;transform:rotate(${f1(ang)}deg)">`;
  if(t>=ts&&t-ts<.36){const r=(t-ts)/.36;h+=`<i class="vp-hit" style="left:${f1(px-w*.84-300*r)}px;top:${f1(py+w*.2-70*r)}px;width:${f1(600*r)}px;height:${f1(140*r)}px;opacity:${f3(.7*(1-r))}"></i>`;}
  return h;},
 bills(o,c,t){const ta=c.at(o.at)??c.t0+1,big=!!o.big,n=o.n??(big?5:36),life=1.7;let h='';
  for(let i=0;i<n;i++){const u=t-ta-i*(big?.19:.05);if(u<=0)continue;const cyc=Math.floor(u/life),tau=u-cyc*life,s=i+cyc*17+(big?100:0);
   const a=big?(hf(s,1)<.5?-Math.PI*.62:-Math.PI*.38):-Math.PI*(.2+.6*hf(s,1)),v=(big?1500:1050)+520*hf(s,2),x0=big?(hf(s,1)<.5?150:930):540+160*(hf(s,3)-.5),y0=big?1650:(o.y??1260);
   const x=x0+Math.cos(a)*v*tau*.62,y=y0+Math.sin(a)*v*tau+560*tau*tau,w=big?330:210+70*hf(s,4),op=c01(tau*8)*c01((life-tau)*4);
   h+=`<div class="vp-bill" style="left:${f1(x-w/2)}px;top:${f1(y-w*.21)}px;width:${f1(w)}px;height:${f1(w*.42)}px;background-image:url(${o.img});opacity:${f3(op)};transform:perspective(700px) rotateX(${f1(360*hf(s,5)+tau*(260+240*hf(s,6)))}deg) rotateY(${f1(tau*(140+200*hf(s,7))-60)}deg) rotateZ(${f1(360*hf(s,8)+tau*120)}deg)${big?';filter:blur(5px)':''}"></div>`;}
  return h;},
};
const props=(p,c,t,layer)=>A(p.props).filter(o=>(o.layer??'front')===layer).map(o=>{if(!PROP[o.kind])throw Error(`${c.tag}：props 里的 kind 写了 '${o.kind}'，只有 obj / pour / hammer / bills`);return PROP[o.kind](o,c,t);}).join('');
const PH="会动的道具 [{kind:'obj'|'pour'|'hammer'|'bills', img:'抠好的图', at, x, y, w, layer:'front'|'back'|'behind'}]，一镜最多一样；图用真照片抠（scripts/cut_img.py）或生图（scripts/gen_prop.sh），不用代码画";

// ====== 1 vp-words：关键词卡着字出现在她胸口（没她就在画面中间） ======
S('vp-words',{real:()=>true,minDur:1.2,
 says:'一两个关键词卡着她说的字出现，大、立体、各歪一点；要"翻转"意思的那个词整行翻一下',use:'开场钩子；一句话里有 1–2 个要记住的词',avoid:'整句都打出来（那是字幕的事）；一条片用三次以上',
 need:['words'],help:{words:"[{text:'又反转了', at:'@b01:又', col:'accent'|'white'|'cool', fx:'cut'|'flip'}]，最多两个，每个不超过 5 个字；最后一个最大",en:'词下面一行英文小字',zoom:"景别：数字，或 [{at,s}] 在重音的词上硬切一档",bg:'没有口播时垫的图',y:'词的底边在哪（默认有她 1270、没她 1060；没她时常把词放上面、道具放下面）',props:PH},
 beats:p=>A(p.words).length,
 check(p,c){if(A(p.words).length>2)c.warn('关键词超过 2 个：参考片一次只亮一两个词，多了盖住她');},
 draw(p,c){markHost(p);const zf=zoomS(p,c),ws=A(p.words).map(w=>typeof w==='string'?{text:w}:w),ts=ws.map((w,i)=>c.at(w.at)??c.t0+.6+i*.9),n=ws.length,fss=ws.map((w,i)=>fitH(w.text,i===n-1?252:178,900)),ys=[];
  let y=(p.y??(useHost(p)?1270:1060))-(p.en?64:0);for(let i=n-1;i>=0;i--){y-=fss[i]*1.14;ys[i]=y;}
  return t=>{let h=stage(p,c,zf,t,props(p,c,t,'behind'))+props(p,c,t,'back');
   ws.forEach((w,i)=>{const k=(t-ts[i]+.03)/.24;if(k<=0)return;
    const tf=w.fx==='flip'?`transform-origin:50% 96%;transform:perspective(900px) rotateY(-13deg) rotate(-3deg) rotateX(${f1(-90*(1-oe(k)))}deg)`:`transform:perspective(1200px) rotateY(-13deg) rotateX(5deg) rotate(-3deg) scale(${f3(1+.06*(1-oe(k*2.4)))})`;
    h+=line(pword(w.text,w.col??(i===n-1?'accent':'white')),ys[i],fss[i],i%2?10:-36,tf);});
   if(p.en){const k=oc((t-ts[n-1]-.5)/.36);if(k>0)h+=`<div class="vp-en" style="top:${f1(y+fss.reduce((a,b)=>a+b*1.14,0)+16)}px;${wipe(k)}"><i style="width:${f1(70*k)}px"></i>${p.en}<i style="width:${f1(70*k)}px"></i></div>`;}
   return h+props(p,c,t,'front');};}
});

// ====== 2 vp-newspile：斜桌面上，新闻卡从镜头前飞下去摞起来 ======
S('vp-newspile',{real:()=>true,minDur:1.5,
 says:'一个往后仰的桌面，新闻卡从镜头前一张张飞下去落成一摞，后落的把先落的压暗；最后可以盖一块牌',use:'"到处都在报""一周里出了三件事"',avoid:'每张要细读（改 vp-paper）；超过 4 张',
 need:['items'],help:{items:"[{img:'台标+标题的横条截图（宽:高≈3:1，scripts/snap_news.mjs 截）', pic:'卡下半的图（可不写）', pos:'图的裁切', at}]，2–4 张",bg:'压暗虚化垫底的图（下一镜要出现的人或物最好）',brow:'左上小字',stamp:"{text:'辞职', en:'RESIGNED', at}：最后盖上去的牌",cw:'卡宽，默认 990（比画面略窄，歪着就出框）',tiltX:'桌面后仰多少度，默认 17',props:PH},
 beats:p=>A(p.items).length+(p.stamp?1:0),
 draw(p,c){const its=A(p.items),cw=p.cw??990,sh=cw/3,ph=p.ph??cw*.36,D=.5,ts=its.map((it,i)=>c.at(it.at)??c.t0+.1+i*.9),st=ts.map(x=>Math.max(c.t0,x-D*.6)),ld=st.map(x=>x+D);
  const geo=its.map((it,i)=>{const sd=i%2?1:-1;return {sd,h:sh+(it.pic?ph:0),x:(W-cw)/2+sd*52,y:(p.top??200)+i*(p.step??sh+4),r:-sd*(3.2+2*hashf(i,3)),z:i*40};});
  const sp=p.stamp,tsp=sp?c.at(sp.at)??c.t0+c.d-.8:0;
  markAva(p);return t=>{const th=t-c.t0;let h=bgOf(p)?`<div class="v-band" style="top:0;height:${ZH}px;box-shadow:none"><img class="m" src="${bgOf(p)}" style="object-position:${bgPos(p,c)};transform:scale(${f3(1.16+.012*th)});filter:blur(16px) brightness(.34) saturate(.7)"></div><div class="vp-vig"></div>`:'';
   if(p.brow){const k=oc((th-.1)/.35);if(k>0)h+=`<div class="v-brow" style="left:62px;top:118px;${wipe(k)}">${p.brow}</div>`;}
   h+=props(p,c,t,'back')+`<div class="v-abs" style="left:0;top:0;width:${W}px;height:${ZH}px;perspective:1500px;perspective-origin:50% 36%"><div class="v-abs" style="left:0;top:0;width:${W}px;height:${ZH}px;transform-style:preserve-3d;transform-origin:50% 46%;transform:rotateX(${p.tiltX??17}deg) rotateY(-4deg) rotateZ(-2deg) scale(.99)">`;
   its.forEach((it,i)=>{const g=geo[i],tau=(t-st[i])/D;if(tau<=0)return;const e=oe(tau*1.15),fl=1-e,push=its.reduce((a,_,j)=>j>i?a+oc((t-(ld[j]-.07))/.22):a,0);
    h+=`<div class="vp-nc" style="left:${f1(g.x)}px;top:${f1(g.y)}px;width:${cw}px;height:${f1(g.h)}px;opacity:${f3(c01(tau*8))};transform:translate3d(${f1(g.sd*-420*fl)}px,${f1(-330*fl)}px,${f1(g.z+1050*fl)}px) rotateX(${f1(-34*fl)}deg) rotateZ(${f1(g.r+g.sd*-24*fl)}deg);filter:brightness(${f3(1-Math.min(.34,push*.16))})${fl>.03?` blur(${f1(6*fl)}px)`:''};box-shadow:0 4px 0 #c9cdd3,0 9px 0 #aeb3bb,0 ${f1(lerp(30,120,fl))}px ${f1(lerp(60,170,fl))}px rgba(0,0,0,${f3(lerp(.66,.28,fl))})"><img class="s" src="${it.img}" style="height:${f1(sh)}px">${it.pic?`<div class="p" style="top:${f1(sh)}px;height:${f1(ph)}px"><img src="${it.pic}" style="object-position:${it.pos??'50% 30%'}"></div>`:''}</div>`;});
   h+='</div></div>';
   if(sp&&t>tsp-.02){const k=(t-tsp)/.16;h+=`<div class="vp-stamp" style="left:${sp.x??470}px;top:${sp.y??690}px;opacity:${f3(c01(k*3))};transform:rotate(-13deg) scale(${f3(1+2.1*(1-oe(k)))})"><b>${pword(sp.text,'accent',null,false)}</b>${sp.en?`<u>${sp.en}</u>`:''}</div>`;}
   return h+props(p,c,t,'front')+ava(p,t);};}
});

// ====== 3 vp-person：抠出来的当事人站在前面，引语卡打字，巨字从他身后滑出来 ======
S('vp-person',{real:()=>true,minDur:2,
 says:'抠出来的当事人从下面升起；一张引语卡斜着飞进来、原话一个字一个字打出来；然后卡退场，两行立体巨字从他身后沿斜线滑出来',use:'"某某说……"，那句话里有半句是重点',avoid:'没有能抠的人像；原话超过 20 个字',
 need:['cut','lines'],help:{cut:'抠好的人像（透明 PNG，scripts/cut_img.py）',bg:'垫在最后面压暗虚化的图（常用同一张原图）',name:'引语卡上的名字',sub:'名字旁的小字',quote:'原话（核过出处的），在卡上打字打出来',cardOut:'引语卡退场的时刻',lines:"['愿意重返','CEO岗位']：从他身后滑出来的巨字，最后一行是强调色",at:'两行各自的时刻',brow:'左上小字',source:'照片出处小字',cw:'人像宽，默认 860'},
 beats:p=>1+(p.quote?1:0)+A(p.lines).length,
 async prep(p){const im=new Image();im.src=p.cut;await im.decode();p._ar=im.naturalWidth/im.naturalHeight;},
 draw(p,c){const cwid=p.cw??860,ch=cwid/p._ar,cx=(W-cwid)/2+(p.cx??0),cy=ZH-ch+(p.cy??96),ls=A(p.lines),at=A(p.at),ts=ls.map((_,i)=>c.at(at[i])??c.t0+c.d*.5+i*.5),fss=ls.map(l=>fitH(l,p.size??236,940)),tout=c.at(p.cardOut)??ts[0]-.35,q=[...plain(p.quote??'')],tq0=c.t0+.55,cps=p.cps??13;
  markAva(p);return t=>{const th=t-c.t0;let h=bgHTML(p,c,t,{s:1.22,blur:22,bri:.3});
   if(p.brow){const k=oc((th-.1)/.35);if(k>0)h+=`<div class="v-brow" style="left:62px;top:112px;${wipe(k)}">${p.brow}</div>`;}
   let y=p.top??176;ls.forEach((l,i)=>{const k=tail(t-ts[i],.12);if(k>0)h+=`<div class="vp-word vp-it" style="left:${f1(46+(1-k)*1150)}px;top:${f1(y-(1-k)*150)}px;width:auto;font-size:${fss[i]}px;transform:rotate(-7deg);transform-origin:0 60%;filter:brightness(${f3(.5+.5*c01((t-ts[i])/.4))})">${pword(l,i===ls.length-1?'accent':'white',null,false)}</div>`;y+=fss[i]*1.06;});
   const kc=tail(th-.12,.11),ko=oc((t-tout)/.3);if(p.quote&&kc>0&&ko<1){const nch=Math.max(0,Math.min(q.length,Math.floor((t-tq0)*cps)));
    h+=`<div class="vp-qc" style="left:${f1(52-(1-kc)*760-ko*900)}px;top:${f1(214-ko*60)}px;transform:perspective(1300px) rotateY(${f1(lerp(46,15,kc))}deg) rotateZ(${f1(-3-ko*6)}deg);opacity:${f3(1-ko*.4)}"><div class="hd"><span class="av"><img src="${p.bg??p.cut}" style="${p.bg?'':'transform:none;object-position:50% 12%'}"></span><b>${p.name??''}</b><u>${p.sub??''}</u></div><div class="tx">${q.slice(0,nch).join('')}${nch<q.length?'<i></i>':''}</div></div>`;}
   const kr=tail(th,.16);h+=`<img class="vp-cut" src="${p.cut}" style="left:${f1(cx)}px;top:${f1(cy+(1-kr)*260)}px;width:${cwid}px"><div class="vp-floor"></div>`;
   if(p.source)h+=`<div class="v-cap" style="left:62px;top:1512px">${p.source}</div>`;
   return h+ava(p,t,940,820,164);};}
});

// ====== 4 vp-reject：一个词砸在胸口；下一个词从头顶一个字一个字掉下来 ======
S('vp-reject',{real:()=>true,minDur:1.5,
 says:'一个词砸在她胸口；下一个词是冷色，从头顶一个字一个字掉下来',use:'"不买账""泼冷水""被拒了"这种转折；配一个 pour 道具最好',avoid:'连着两镜用',
 need:['stamp'],help:{stamp:"{text:'不买账', at, col}",drop:"{text:'泼冷水', at, col:'cool'}",zoom:'景别',bg:'没有口播时垫的图',props:PH},
 beats:p=>1+(p.drop?1:0),
 draw(p,c){markHost(p);const zf=zoomS(p,c),s=p.stamp,d=p.drop,t1=c.at(s.at)??c.t0+.8,t2=d?c.at(d.at)??t1+1.2:1e9,fs1=fitH(s.text,244,880),fs2=d?fitH(d.text,204,860):0,base=useHost(p)?1268:1150,y2=base-fs2*1.12,y1=y2-fs1*1.2-56;
  return t=>{let h=stage(p,c,zf,t,props(p,c,t,'behind'))+props(p,c,t,'back');
   if(t>t1-.02){const k=(t-t1)/.16;h+=`<div class="vp-seal" style="top:${f1(y1)}px;font-size:${fs1}px;opacity:${f3(c01(k*3))};transform:rotate(-6deg) scale(${f3(1+1.9*(1-oe(k)))})">${pword(s.text,s.col??'accent',null,false)}</div>`;}
   if(d&&t>t2-.02)h+=line(pword(d.text,d.col??'cool',j=>{const k=(t-t2-j*.085)/.26;if(k<=0)return {hide:1};return {dy:-7.5*(1-ei(k)),rot:(1-ei(k))*(j%2?16:-16),op:c01(k*8)};}),y2,fs2,-10,'transform:rotate(-2deg)');
   return h+props(p,c,t,'front');};}
});

// ====== 5 vp-paper：带报头的原文纸像开门一样转正，推到那一行刷黄，贴上"谁说的" ======
S('vp-paper',{real:()=>true,minDur:1.5,
 says:'一页带报头的原文纸像开门一样从侧面转正；念到那句话时镜头推到那一行、荧光笔刷过去，再贴一张"谁说的"标签',use:'"财报会上说""据某某报道"',avoid:'截图上的字推近了也看不清',
 need:['img'],help:{img:'原文截图（scripts/snap_news.mjs 截，先裁到只剩那一段）',mast:'报头大字（媒体名）',mastSub:'报头小字',title:'上面的标题',brow:'小字',hl:'[{x,y,w,h,at}]：刷黄的地方，占截图宽高的比例；镜头推到第一处',tag:"{text:'董事长 哈维·琼斯', at}",zoomTo:'推近倍数，默认 1.4'},
 beats:p=>A(p.hl).length+(p.tag?1:0),
 async prep(p){const im=new Image();im.src=p.img;await im.decode();p._ar=im.naturalWidth/im.naturalHeight;},
 draw(p,c){const cw=960,x0=60,top=330,mh=p.mast?92:0,ih=cw/p._ar,bh=Math.min(ih,1250-top-mh),hl=A(p.hl),ts=hl.map((b,i)=>c.at(b.at)??c.t0+1+i*.6),zs=p.zoomTo??1.4;
  const f=hl[0],hx=f?(f.x+f.w/2)*cw:cw/2,hy=f?(f.y+f.h/2)*ih:bh/2,tz=(ts[0]??c.t0+1)-.22,tg=p.tag,ttg=tg?c.at(tg.at)??(ts[0]??c.t0+1)+.5:0;
  markAva(p);return t=>{const th=t-c.t0,k=tail(th,.13),m=io((t-tz)/.75),s=lerp(1,zs,m);
   const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),tx=cl((cw/2-hx)*m,cw-hx-(cw-hx)*s,hx*(s-1)),ty=cl((bh*.42-hy)*m,bh-hy-(ih-hy)*s,hy*(s-1));
   let h=p.brow?`<div class="v-brow" style="left:62px;top:150px;${wipe(oc(th/.3))}">${p.brow}</div>`:'';
   if(p.title)h+=`<div class="v-h v-shadow" style="left:60px;top:208px;font-size:${fitH(p.title,88,720)}px;${wipe(oc((th-.1)/.35))}">${p.title}</div>`;
   h+=`<div class="v-abs" style="left:0;top:0;width:${W}px;height:${ZH}px;perspective:1400px;perspective-origin:50% 44%"><div class="vp-pp" style="left:${x0}px;top:${top}px;width:${cw}px;height:${f1(bh+mh)}px;transform-origin:0 50%;transform:rotateY(${f1(lerp(78,9,k)*(1-m))}deg) rotateX(${f1(4*(1-m))}deg) rotateZ(${f1(-1.6*(1-m))}deg);opacity:${f3(c01(th*10))}">${p.mast?`<div class="mast" style="height:${mh}px"><b>${p.mast}</b><u>${p.mastSub??''}</u></div>`:''}<div class="pg" style="top:${mh}px;height:${f1(bh)}px"><div style="position:absolute;left:0;top:0;width:${cw}px;height:${f1(ih)}px;transform-origin:${f1(hx)}px ${f1(hy)}px;transform:translate(${f1(tx)}px,${f1(ty)}px) scale(${f3(s)})"><img src="${p.img}" style="position:absolute;left:0;top:0;width:100%;height:100%">${hl.map((b,i)=>{const g=oc((t-ts[i])/.42);return g<=0?'':`<div class="v-hl" style="left:${f1(b.x*cw-6)}px;top:${f1(b.y*ih)}px;width:${f1((b.w*cw+12)*g)}px;height:${f1(b.h*ih)}px"></div>`;}).join('')}</div></div></div></div>`;
   if(tg&&t>ttg-.02){const kk=oe((t-ttg)/.22);h+=`<div class="vp-tag" style="left:${tg.x??470}px;top:${f1(top+mh+bh-58)}px;transform:rotate(4deg) scale(${f3(kk)})"><i></i>${tg.text}</div>`;}
   return h+ava(p,t);};}
});

// ====== 6 vp-verdict：全片最重的一镜 ======
S('vp-verdict',{minDur:1.2,real:p=>!!(p.bg??TH.bg),
 says:'第一行斜体立体字沿斜线冲进来；（可以先让一个道具演一下，比如法槌）当事人抠像升起，第二行砸在他额前，他变灰下沉；最后一张原话卡从他胸前滑进来',use:'全片的结论，只用一次',avoid:'一行超过 6 个字',
 need:['lines'],help:{lines:"['董事会拍板','不让回']",bg:'底图',cut:'当事人抠像（可不写）',at:'两行的时刻',en:'英文小字',sub:'出处小字',note:"{label:'董事长原话', text:'无意让他<em>恢复CEO职务</em>'}：核过的原话",props:PH},
 beats:p=>A(p.lines).length+(p.note?1:0),
 async prep(p){if(p.cut){const im=new Image();im.src=p.cut;await im.decode();p._ar=im.naturalWidth/im.naturalHeight;}},
 draw(p,c){const ls=A(p.lines),at=A(p.at),ts=ls.map((_,i)=>c.at(at[i])??c.t0+.05+i*1.2),fs0=fitH(ls[0],176,860),fs1=fitH(ls[1]??'',300,800),land=ts[1]+.16,cwid=p.cw??860,chh=p.cut?cwid/p._ar:0,Y0=p.top??(p.cut||p.note?196:470);
  return t=>{const th=t-c.t0,gk=oc((t-land)/.5);
   let h=bgHTML(p,c,t,{s:1.08,bri:.55})+`<div class="vp-brush" style="transform:rotate(-8deg) translateX(${f1(-1300*(1-tail(th,.1)))}px)"></div>`+props(p,c,t,'back');
   const k0=tail(t-ts[0],.12);if(k0>0)h+=`<div class="vp-word vp-it" style="left:${f1(60+(1-k0)*1150)}px;top:${f1(Y0-(1-k0)*160)}px;width:auto;font-size:${fs0}px;transform-origin:0 60%;transform:rotate(-7deg)">${pword(ls[0],'white',null,false)}</div>`;
   if(p.cut&&t>ts[1]-.3){const kr=tail(t-(ts[1]-.3),.09);h+=`<img class="vp-cut" src="${p.cut}" style="left:${f1((W-cwid)/2+70)}px;top:${f1(ZH-chh+(1-kr)*1250+gk*46)}px;width:${cwid}px;filter:grayscale(${f3(gk)}) brightness(${f3(1-.4*gk)})">`;}
   if(ls[1]&&t>ts[1]-.02){const k=(t-ts[1])/.16;h+=`<div class="vp-word vp-it" style="left:54px;top:${f1(Y0+fs0*1.12)}px;width:auto;font-size:${fs1}px;opacity:${f3(c01(k*4))};transform-origin:36% 55%;transform:rotate(-7deg) scale(${f3(1+1.8*(1-oe(k)))})">${pword(ls[1],'accent',null,false)}</div>`;}
   if(p.note){const kt=tail(t-land-.12,.11);if(kt>0)h+=`<div class="vp-note" style="top:${p.noteY??1150}px;transform:rotate(-6deg) translateX(${f1(-1200*(1-kt))}px)"><u>${p.note.label??''}</u><b>${p.note.text}</b></div>`;}
   if(p.en){const k=oc((t-land-.2)/.36);if(k>0)h+=`<div class="v-en" style="left:74px;top:${f1(Y0+fs0*1.12+fs1*1.16+10)}px;font-size:32px;transform:rotate(-7deg);transform-origin:0 50%;${wipe(k)}">${p.en}</div>`;}
   if(t>=land&&t-land<.45){const r=(t-land)/.45;h+=`<i class="vp-shock" style="left:${f1(430-700*r)}px;top:${f1(560-700*r)}px;width:${f1(1400*r)}px;height:${f1(1400*r)}px;opacity:${f3(.5*(1-r))}"></i>`;}
   if(t>=land&&t-land<.18)h+=`<div class="v-abs" style="left:0;top:0;width:${W}px;height:${ZH}px;background:var(--vp-hi);opacity:${f3(.26*(1-(t-land)/.18))}"></div>`;
   if(p.sub)h+=`<div class="v-cap" style="left:62px;top:1512px">${p.sub}</div>`;
   return h+props(p,c,t,'front');};}
});

// ====== 7 vp-voices：圆徽章滚进来各说一句，被一根横杠压下去 ======
S('vp-voices',{real:()=>true,minDur:2,
 says:'两三枚大小不一的圆徽章像硬币一样从两边滚进来，各冒一句话；念到转折时徽章变灰下沉，一根写着结论的横杠从上面落下来',use:'"连某某都替他说话，也没用"；列举几个表态的人',avoid:'超过 3 枚；每人的话超过 6 个字',
 need:['items'],help:{items:"[{img, name, tag:'身份', say:'一句核过的原话', at, pos}]，第一枚最大",deny:'{at}：这时徽章变灰下沉',bar:"{text:'立规矩', at, en}：落下来的横杠",zoom:'景别',bg:'没有口播时垫的图',props:PH},
 beats:p=>A(p.items).length+(p.deny?1:0)+(p.bar?1:0),
 draw(p,c){markHost(p);const zf=zoomS(p,c),its=A(p.items),ts=its.map((it,i)=>c.at(it.at)??c.t0+.3+i*.7),td=p.deny?c.at(p.deny.at)??c.t0+c.d*.6:1e9,b=p.bar,tb=b?c.at(b.at)??td+.5:1e9,fsb=b?fitH(b.text,170,620):0,hy=useHost(p)?0:-170;
  const geo=its.map((it,i)=>{const sd=i%2?1:-1,d=i?330:400;return {sd,d,x:sd<0?16+d/2:W-16-d/2,y:(i?770:900)+hy};});
  return t=>{let h=stage(p,c,zf,t,props(p,c,t,'behind'))+props(p,c,t,'back');
   its.forEach((it,i)=>{const g=geo[i],k=tail(t-ts[i]+.1,.1);if(k<=0)return;const dn=oc((t-td-i*.07)/.4);
    h+=`<div class="vp-coin" style="left:${f1(g.x-g.d/2+g.sd*640*(1-k)+g.sd*34*dn)}px;top:${f1(g.y-g.d/2+70*dn)}px;width:${g.d}px;height:${g.d}px;transform:rotate(${f1(g.sd*-250*(1-k)+g.sd*15*dn)}deg);filter:grayscale(${f3(dn)}) brightness(${f3(1-.45*dn)})"><img src="${it.img}" style="object-position:${it.pos??'50% 20%'}"></div>`;
    const kn=oc((t-ts[i]-.28)/.3);if(kn>0)h+=`<div class="vp-coinname" style="left:${f1(g.x-150+g.sd*34*dn)}px;top:${f1(g.y+g.d/2-30+70*dn)}px;opacity:${f3(kn*(1-.5*dn))}"><b>${it.name}</b><u>${it.tag??''}</u></div>`;
    if(it.say){const ks=oe((t-ts[i]-.42)/.22)*(1-oc((t-td)/.18));if(ks>0)h+=`<div class="vp-say ${g.sd<0?'l':'r'}" style="${g.sd<0?'left':'right'}:44px;top:${f1(g.y-g.d/2-118)}px;transform:rotate(${g.sd*-4}deg) scale(${f3(ks)})">${it.say}<s></s></div>`;}});
   if(b&&t>tb-.02){const k=tail(t-tb,.07);h+=`<div class="vp-bar" style="top:${f1(lerp(-260,(p.barY??1052)+hy,k))}px;transform:rotate(-3deg)"><i></i><span style="font-size:${fsb}px">${pword(b.text,'accent',null,false)}</span>${b.en?`<u>${b.en}</u>`:''}<i></i></div>`;}
   return h+props(p,c,t,'front');};}
});

// ====== 8 vp-number：用一个数收尾 ======
S('vp-number',{real:()=>true,minDur:2,
 says:'一个顶满宽的巨数升起来、边升边数（有口播抠像时真的在她身后）；下面滑上来一张读数卡，柱子往上长，把涨幅露出来',use:'用一个数收尾；一句话的主角就是这个数',avoid:'一句里两个数',
 need:['value'],help:{value:"'1158' '-6.9%' '$104'：数字前后可以带符号，小数照写",unit:'单位，写在读数卡上',label:'读数卡上的说明',pct:"涨幅 '+103%'（可不写）",at:'出现的时刻',zoom:'景别，建议 1.0',bg:'没有口播时垫的图',lit:'巨数用亮色还是深色：不写就自己量（她身后的墙暗就用亮色，墙亮就用深色；没有她用亮色），true / false 可以硬定',props:PH+"；收尾常挂 bills（layer:'behind'）"},
 beats:()=>2,
 async prep(p){if(p.lit!=null||!useHost(p))return;try{const im=new Image();im.src=roomSrc(1);await im.decode();const cv=document.createElement('canvas');cv.width=32;cv.height=32;const g=cv.getContext('2d');g.drawImage(im,0,0,32,32);const d=g.getImageData(0,0,32,12).data;let s=0;for(let i=0;i<d.length;i+=4)s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];p._lit=s/(d.length/4)/255<.42;}catch{p._lit=false;}},
 draw(p,c){markHost(p);const zf=zoomS(p,c),ta=(c.at(p.at)??c.t0+.4)-.1,M=/^([^\d]*)([\d.,]+)(.*)$/.exec(String(p.value))??['','',String(p.value),''],N=parseFloat(M[2].replace(/,/g,'')),dec=(M[2].split('.')[1]??'').length,fs=Math.min(p.size??610,fitN(p.value,610,1130)),tc=ta+.55,host=useHost(p);
  const fmt=v=>isNaN(N)?p.value:M[1]+v.toFixed(dec).padStart(M[2].replace(/,/g,'').length,' ')+M[3];
  return t=>{const k=tail(t-ta,.2),n=N*oe((t-ta)/1.15);
   const num=k>0?`<div class="vp-back${(p.lit??p._lit??!host)?' lit':''}" style="top:${f1(lerp(620,p.top??(host?36:300),k))}px;font-size:${fs}px;opacity:${f3(c01((t-ta)*5))}">${fmt(n)}</div>`:'';
   let h=stage(p,c,zf,t,(num||' ')+props(p,c,t,'behind'))+props(p,c,t,'back');
   const kc=tail(t-tc,.11);if(kc>0){const g=oc((t-tc-.15)/1.0);
    h+=`<div class="vp-read" style="top:${f1((host?1076:980)+(1-kc)*420)}px;transform:rotate(-2deg)">${p.pct?`<div class="col"><i style="height:${f1(150*g)}px"></i><b style="clip-path:inset(${f1(100*(1-g))}% 0 0 0)">${p.pct}</b></div>`:''}<div class="tx"><b>${p.value}<em>${p.unit??''}</em></b><u>${p.label??''}</u></div></div>`;}
   return h+props(p,c,t,'front');};}
});

// ====================================================================================================
// 第二批：算账、比较、讲道理、引用、分段用的 12 个组件（和上面 8 个同一套颜色、同一种卡、同一种进场手感）
// 这批都是"图形镜头"：有口播时她在右上角的圆头像里，没有口播就没有头像；底是 bg（或主题里那张）压暗虚化。
// ====================================================================================================
const hasAva=p=>HOST.on&&p.avatar!==false;
const hd=(p,th)=>(p.brow?`<div class="v-brow" style="left:62px;top:150px;${wipe(oc(th/.3))}">${p.brow}</div>`:'')+(p.title?`<div class="v-h v-shadow" style="left:60px;top:208px;font-size:${fitH(p.title,88,hasAva(p)?720:960)}px;${wipe(oc((th-.1)/.35))}">${p.title}</div>`:'');
const base=(p,c,t)=>bgHTML(p,c,t,{s:1.14,blur:14,bri:.3});
const tsOf=(c,its,lead=.35,gap=.7)=>its.map((it,i)=>c.at(it.at)??c.t0+lead+i*Math.min(gap,Math.max(.25,(c.d-lead-.5)/Math.max(1,its.length))));
// 数字从 0 数到位：'$104' '3.6%' '-6.9%' 都认，前后的符号留着
const cnt=(v,k)=>{const m=/^([^\d]*)([\d.,]+)(.*)$/.exec(String(v));if(!m)return String(v);const n=parseFloat(m[2].replace(/,/g,'')),dec=(m[2].split('.')[1]??'').length;return m[1]+(n*k).toFixed(dec)+m[3];};
const numOf=v=>{const m=/([\d.,]+)/.exec(String(v));return m?parseFloat(m[1].replace(/,/g,'')):0;};
const TOP=p=>p.title?350:(p.brow?230:170);

// ====== 9 vp-bars：几根柱子比大小 ======
S('vp-bars',{real:()=>false,minDur:1.5,
 says:'几根柱子从底线往上长，数字跟着数上去；最要紧的那根是强调色',use:'几个数比大小：四家公司的投入、三年的营收',avoid:'超过 5 根；数差不多大（看不出高低）',
 need:['items'],help:{items:"[{label:'微软', value:'800', hl:true, at}]，2–5 根；value 可带符号和单位",unit:'左上角的单位小字',title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.items).length,
 draw(p,c){markAva(p);const its=A(p.items),n=its.length,ts=tsOf(c,its),top=TOP(p)+90,by=1170,mh=by-top-70,mx=Math.max(...its.map(i=>numOf(i.value)),1e-9),w=Math.min(210,(900-(n-1)*36)/n),x0=(W-(n*w+(n-1)*36))/2;
  return t=>{const th=t-c.t0;let h=base(p,c,t)+hd(p,th)+(p.unit?`<div class="v-cap" style="left:64px;top:${TOP(p)+10}px">${p.unit}</div>`:'')+`<div class="vp-base" style="left:60px;top:${by}px;width:${f1(960*oc(th/.4))}px"></div>`;
   its.forEach((it,i)=>{const k=oc((t-ts[i])/.8);if(k<=0)return;const hh=Math.max(14,mh*numOf(it.value)/mx)*k,x=x0+i*(w+36);
    h+=`<div class="vp-col${it.hl?' hl':''}" style="left:${f1(x)}px;top:${f1(by-hh)}px;width:${f1(w)}px;height:${f1(hh)}px"></div><div class="vp-colv${it.hl?' hl':''}" style="left:${f1(x-40)}px;top:${f1(by-hh-78)}px;width:${f1(w+80)}px">${cnt(it.value,k)}</div><div class="vp-coll" style="left:${f1(x-40)}px;top:${by+18}px;width:${f1(w+80)}px;font-size:${fitU(it.label,44,w+70)}px;opacity:${f3(c01((t-ts[i])*5))}">${it.label}</div>`;});
   return h+ava(p,t);};}
});

// ====== 10 vp-versus：两边对着看 ======
S('vp-versus',{real:p=>!!(p.left?.img||p.right?.img),minDur:1.5,
 says:'两张卡从两边滑进来对着放，中间一个 VS；可以在某个时刻让一边赢',use:'"黄金不生利息，美债一年 4.9%"：两样东西对比',avoid:'三样以上（改 vp-bars / vp-rank）',
 need:['left','right'],help:{left:"{name:'黄金', value:'0%', sub:'不生利息', img, at}",right:'同 left',win:"{side:'right', at}：这时赢的一边亮起、另一边变灰",title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>2+(p.win?1:0),
 draw(p,c){markAva(p);const L=p.left,Rr=p.right,tl=c.at(L.at)??c.t0+.3,tr=c.at(Rr.at)??c.t0+1,tw=p.win?c.at(p.win.at)??tr+.8:1e9,top=TOP(p)+60,ch=p.left.img||p.right.img?780:660;
  const card=(o,sd,ta,t)=>{const k=tail(t-ta+.08,.11);if(k<=0)return '';const win=oc((t-tw)/.3),lose=p.win&&p.win.side!==(sd<0?'left':'right'),hit=p.win&&!lose;
   return `<div class="vp-vs${hit&&win>0?' on':''}" style="left:${f1((sd<0?44:556)+sd*620*(1-k))}px;top:${top}px;height:${ch}px;transform:rotate(${sd*-2}deg);filter:grayscale(${f3(lose?win:0)}) brightness(${f3(1-(lose?.4*win:0))})">${o.img?`<div class="ph"><img src="${o.img}"></div>`:''}<b style="font-size:${fitH(o.name,72,420)}px">${o.name}</b><em style="font-size:${fitU(String(o.value),150,420)}px">${cnt(o.value,oe((t-ta)/.9))}</em><u>${o.sub??''}</u></div>`;};
  return t=>{const th=t-c.t0,kv=oe((t-tr)/.2);return base(p,c,t)+hd(p,th)+card(L,-1,tl,t)+card(Rr,1,tr,t)+(t>tr-.02?`<div class="vp-vsb" style="top:${top+ch/2-64}px;transform:scale(${f3(1+1.4*(1-kv))});opacity:${f3(c01((t-tr)*8))}">VS</div>`:'')+ava(p,t);};}
});

// ====== 11 vp-chain：一环扣一环 ======
S('vp-chain',{real:p=>A(p.items).some(i=>i.img),minDur:2,
 says:'三四张卡从上往下一张接一张滑进来，中间的箭头长出来；最后一张是强调色',use:'因果链："打仗 → 油价涨 → 通胀 → 加息"',avoid:'超过 4 环；每环的字超过 8 个',
 need:['items'],help:{items:"[{title:'打仗推高油价', value:'$104', sub:'国际油价', img, at}]，3–4 环",title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.items).length,
 draw(p,c){markAva(p);const its=A(p.items),n=its.length,ts=tsOf(c,its),top=TOP(p)+30,gap=56,ch=Math.min(210,(1230-top-(n-1)*gap)/n);
  return t=>{const th=t-c.t0;let h=base(p,c,t)+hd(p,th);
   its.forEach((it,i)=>{const k=tail(t-ts[i]+.08,.1);if(k<=0)return;const y=top+i*(ch+gap),last=i===n-1;
    if(i)h+=`<div class="vp-arrow" style="left:520px;top:${f1(y-gap+6)}px;height:${f1((gap-12)*oc((t-ts[i]+.1)/.25))}px"><i></i></div>`;
    h+=`<div class="vp-link${last?' hl':''}" style="left:${f1(70+(i%2?1:-1)*900*(1-k))}px;top:${f1(y)}px;height:${f1(ch)}px">${it.img?`<span class="ph"><img src="${it.img}"></span>`:`<span class="no">${i+1}</span>`}<div><b style="font-size:${fitH(it.title,74,it.value?480:700)}px">${it.title}</b><u>${it.sub??''}</u></div>${it.value?`<em>${cnt(it.value,oe((t-ts[i])/.8))}</em>`:''}</div>`;});
   return h+ava(p,t);};}
});

// ====== 12 vp-list：几条要点 ======
S('vp-list',{real:()=>false,minDur:1.5,
 says:'几条要点一条条翻出来，前面一个圆牌（序号、对勾或叉）',use:'"三个原因""两条出路""该做的和不该做的"',avoid:'超过 4 条；每条超过 12 个字',
 need:['items'],help:{items:"[{text:'利率还在涨', sub:'小字', mark:'ok'|'no'|'1', hl:true, at}]，2–4 条",title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.items).length,
 draw(p,c){markAva(p);const its=A(p.items),n=its.length,ts=tsOf(c,its),top=TOP(p)+40,rh=Math.min(236,(1220-top)/n-24);
  return t=>{const th=t-c.t0;let h=base(p,c,t)+hd(p,th);
   its.forEach((it,i)=>{const k=(t-ts[i]+.04)/.3;if(k<=0)return;const m=it.mark??String(i+1);
    h+=`<div class="vp-row${it.hl?' hl':''}" style="left:60px;top:${f1(top+i*(rh+24))}px;height:${f1(rh)}px;opacity:${f3(c01(k*4))};transform:perspective(900px) rotateX(${f1(-88*(1-oe(k)))}deg)"><span class="bd ${m==='ok'?'ok':m==='no'?'no':''}">${m==='ok'?'✓':m==='no'?'✕':m}</span><div><b style="font-size:${fitH(it.text,80,760)}px">${it.text}</b>${it.sub?`<u>${it.sub}</u>`:''}</div></div>`;});
   return h+ava(p,t);};}
});

// ====== 13 vp-line：走势线 ======
S('vp-line',{real:()=>true,minDur:2,
 says:'一条走势线从左画到右，画到哪标到哪；线下面一层淡淡的颜色',use:'"金价一路掉回一年前""股价三个月翻倍"',avoid:'两条以上的线；没有真数据（不许编走势）',
 need:['data'],help:{data:"数字数组 [3200,3260,…]，或一个 json 文件（数字数组，或 [{v:…}] 这类对象数组，取第一个数字字段）",marks:"[{i:103, text:'1月最高 $5,318', at}]：i 是第几个点，-1 是最后一个",drawTo:'画完的时刻（默认 1.6 秒画完）',unit:'单位小字',down:'true = 跌的走势，线和面用冷色',title:'标题',brow:'小字',source:'数据来源小字（要写）',bg:'垫底的图'},
 beats:p=>1+A(p.marks).length,
 async prep(p){let d=p.data;if(typeof d==='string')d=await (await fetch(d)).json();if(d&&!Array.isArray(d))d=Object.values(d).find(Array.isArray)??[];p._d=d.map(x=>typeof x==='number'?x:Array.isArray(x)?+x[x.length-1]:+Object.values(x).find(v=>typeof v==='number')).filter(x=>!isNaN(x));},
 check(p,c){if(!p.source)c.warn('走势线没写 source：数据从哪来的要写在屏上');},
 draw(p,c){markAva(p);const d=p._d??[],n=d.length,top=TOP(p)+30,cw=960,chh=1210-top,pad=44,mn=Math.min(...d),mx=Math.max(...d),X=i=>pad+(cw-2*pad)*i/Math.max(1,n-1),Y=v=>pad+60+(chh-2*pad-90)*(1-(v-mn)/Math.max(1e-9,mx-mn));
  const pts=d.map((v,i)=>`${f1(X(i))},${f1(Y(v))}`),t1=c.at(p.drawTo)??c.t0+1.9,mk=A(p.marks).map(m=>({...m,i:m.i<0?n+m.i:m.i})),tm=mk.map((m,j)=>c.at(m.at)??lerp(c.t0+.3,t1,m.i/Math.max(1,n-1)));
  return t=>{const th=t-c.t0,k=tail(th,.12),g=c01((t-c.t0-.3)/Math.max(.3,t1-c.t0-.3)),m=Math.max(1,Math.round(g*(n-1)));
   let h=base(p,c,t)+hd(p,th)+`<div class="vp-chart${p.down?' down':''}" style="left:60px;top:${f1(top+(1-k)*120)}px;width:${cw}px;height:${f1(chh)}px;opacity:${f3(c01(th*8))}">${p.unit?`<u class="un">${p.unit}</u>`:''}<svg width="${cw}" height="${f1(chh)}" viewBox="0 0 ${cw} ${f1(chh)}"><defs><linearGradient id="vpg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".42"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs>${[.25,.5,.75].map(q=>`<line x1="${pad}" x2="${cw-pad}" y1="${f1(pad+60+(chh-2*pad-90)*q)}" y2="${f1(pad+60+(chh-2*pad-90)*q)}" stroke="rgba(255,255,255,.1)" stroke-width="2"/>`).join('')}${g>0&&n>1?`<polygon points="${pts.slice(0,m+1).join(' ')} ${f1(X(m))},${f1(chh-pad)} ${pad},${f1(chh-pad)}" fill="url(#vpg)"/><polyline points="${pts.slice(0,m+1).join(' ')}" fill="none" stroke="currentColor" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${f1(X(m))}" cy="${f1(Y(d[m]))}" r="13" fill="#fff" stroke="currentColor" stroke-width="6"/>`:''}</svg>${mk.map((mm,j)=>{const kk=oe((t-tm[j])/.22);if(kk<=0||mm.i>m)return '';const lx=X(mm.i),ly=Y(d[mm.i]);return `<i class="pt" style="left:${f1(lx-9)}px;top:${f1(ly-9)}px"></i><span class="mk" style="${lx>cw/2?`right:${f1(cw-lx-10)}px`:`left:${f1(lx-10)}px`};top:${f1(ly<170?ly+26:ly-78)}px;transform:scale(${f3(kk)})">${mm.text}</span>`;}).join('')}</div>`;
   if(p.source)h+=`<div class="v-cap" style="left:62px;top:1238px">${p.source}</div>`;
   return h+ava(p,t);};}
});

// ====== 14 vp-photo：一张图当主角 ======
S('vp-photo',{real:()=>true,minDur:1.2,
 says:'一张图装在大窗里，从侧面转进来停住；下面一条条标签贴上去',use:'"这就是那座工厂""现场是这样的"：让观众看见东西本身',avoid:'图里的东西很小；连着用两次',
 need:['img'],help:{img:'图',pos:"裁切位置，默认 '50% 40%'",title:'标题',brow:'小字',tags:"[{text:'油价冲上 $104', at}]，最多 3 条",source:'出处小字',hh:'窗高，默认 760',bg:'垫底的图（不写就用这张图自己虚化）'},
 beats:p=>A(p.tags).length,
 draw(p,c){markAva(p);const tags=A(p.tags).map(x=>typeof x==='string'?{text:x}:x),ts=tsOf(c,tags,.6,.8),top=TOP(p)+20,hh=Math.min(p.hh??760,1180-top);
  return t=>{const th=t-c.t0,k=tail(th,.13);let h=bgHTML({...p,bg:p.bg??p.img},c,t,{s:1.2,blur:20,bri:.3})+hd(p,th);
   h+=`<div class="v-abs" style="left:0;top:0;width:${W}px;height:${ZH}px;perspective:1500px"><div class="vp-win" style="left:50px;top:${top}px;width:980px;height:${hh}px;transform-origin:100% 50%;transform:rotateY(${f1(-62*(1-k)-5)}deg) rotateZ(1.2deg);opacity:${f3(c01(th*9))}"><img src="${p.img}" style="object-position:${p.pos??'50% 40%'}"></div></div>`;
   tags.forEach((g,i)=>{const kk=oe((t-ts[i])/.22);if(kk>0)h+=`<div class="vp-tag" style="left:${78+i*26}px;top:${f1(top+hh-70-(tags.length-1-i)*96)}px;transform:rotate(${i%2?2:-2}deg) scale(${f3(kk)})"><i></i>${g.text}</div>`;});
   if(p.source)h+=`<div class="v-cap" style="left:62px;top:${top+hh+26}px">${p.source}</div>`;
   return h+ava(p,t);};}
});

// ====== 15 vp-quote：一句引语（没有抠像时用） ======
S('vp-quote',{real:p=>!!p.img,minDur:1.5,
 says:'一对大引号先落下，原话一行行擦出来，最后名牌从左边滑进来',use:'引一句核过出处的原话，手里只有头像或者没有照片',avoid:'有能抠的人像（用 vp-person 更好）；原话超过 3 行',
 need:['lines','name'],help:{lines:"['买得越多','<em>省得越多</em>']，1–3 行，<em> 是重点",name:'谁说的',tag:'身份',img:'头像（可不写）',at:'每行的时刻',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.lines).length+1,
 draw(p,c){markAva(p);const ls=A(p.lines),n=ls.length,ts=ls.map((_,i)=>c.at(A(p.at)[i])??c.t0+.4+i*.6),fs=Math.min(...ls.map(l=>fitH(l,128,900))),y0=560-n*fs*.6,tn=ts[n-1]+.45;
  return t=>{const th=t-c.t0,kq=oe(th/.25);let h=base(p,c,t)+(p.brow?`<div class="v-brow" style="left:62px;top:150px;${wipe(oc(th/.3))}">${p.brow}</div>`:'')+`<div class="vp-qm" style="left:56px;top:${f1(y0-250)}px;transform:scale(${f3(1+.9*(1-kq))});opacity:${f3(c01(th*6))}">“</div>`;
   ls.forEach((l,i)=>{const k=oc((t-ts[i])/.4);if(k>0)h+=`<div class="vp-ql" style="left:74px;top:${f1(y0+i*fs*1.3)}px;font-size:${fs}px;${wipe(k)}">${l}</div>`;});
   const kn=tail(t-tn,.1);if(kn>0)h+=`<div class="vp-plate" style="left:${f1(70-(1-kn)*700)}px;top:${f1(y0+n*fs*1.3+70)}px">${p.img?`<span><img src="${p.img}"></span>`:''}<div><b>${p.name}</b><u>${p.tag??''}</u></div></div>`;
   return h+ava(p,t);};}
});

// ====== 16 vp-timeline：时间线 ======
S('vp-timeline',{real:()=>false,minDur:2,
 says:'一条竖线往下长，走到哪个日子，圆点亮起、那天的事从右边滑进来',use:'"9 月加了一次息，12 月可能再加"：几个有日期的节点',avoid:'超过 4 个节点；没有先后顺序的事（改 vp-list）',
 need:['items'],help:{items:"[{date:'11月12日', text:'黄仁勋辞职', sub, hl:true, at}]，2–4 个",title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.items).length,
 draw(p,c){markAva(p);const its=A(p.items),n=its.length,ts=tsOf(c,its),top=TOP(p)+50,sp=Math.min(260,(1210-top)/n);
  return t=>{const th=t-c.t0;let h=base(p,c,t)+hd(p,th);const reach=its.reduce((a,_,i)=>Math.max(a,(i+oc((t-ts[i]+.3)/.4))*sp),0);
   h+=`<div class="vp-tl" style="left:128px;top:${top}px;height:${f1(Math.min(reach,(n-1)*sp+60))}px"></div>`;
   its.forEach((it,i)=>{const k=tail(t-ts[i]+.05,.1);if(k<=0)return;const y=top+i*sp;
    h+=`<i class="vp-dot${it.hl?' hl':''}" style="left:106px;top:${f1(y+26)}px;transform:scale(${f3(oe((t-ts[i]+.05)/.2))})"></i><div class="vp-tli${it.hl?' hl':''}" style="left:${f1(190+(1-k)*900)}px;top:${f1(y)}px;height:${f1(sp-40)}px"><u>${it.date}</u><b style="font-size:${fitH(it.text,70,750)}px">${it.text}</b>${it.sub?`<s>${it.sub}</s>`:''}</div>`;});
   return h+ava(p,t);};}
});

// ====== 17 vp-share：占比（一个圆环） ======
S('vp-share',{real:()=>false,minDur:1.5,
 says:'一个粗圆环画到那个百分比停住，中间的数跟着数上去',use:'"市场押 75% 会加息""四家占了全行业六成"',avoid:'要比三样以上的占比（改 vp-bars / vp-rank）',
 need:['value'],help:{value:"'75%'",label:'圆环中间数字下面的字',note:'圆环下面一行说明',at:'开始画的时刻',title:'标题',brow:'小字',bg:'垫底的图'},
 beats:()=>1,
 draw(p,c){markAva(p);const ta=c.at(p.at)??c.t0+.35,v=Math.min(100,numOf(p.value)),r=290,C=2*Math.PI*r,cy=TOP(p)+60+r+50;
  return t=>{const th=t-c.t0,k=oc((t-ta)/1.1),kk=tail(th,.12);
   let h=base(p,c,t)+hd(p,th)+`<svg class="vp-ring" style="left:${540-r-50}px;top:${f1(cy-r-50+(1-kk)*80)}px;opacity:${f3(c01(th*7))}" width="${2*r+100}" height="${2*r+100}" viewBox="0 0 ${2*r+100} ${2*r+100}"><circle cx="${r+50}" cy="${r+50}" r="${r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="78"/><circle cx="${r+50}" cy="${r+50}" r="${r}" fill="none" stroke="currentColor" stroke-width="78" stroke-linecap="round" stroke-dasharray="${f1(C*v/100*k)} ${f1(C)}" transform="rotate(-90 ${r+50} ${r+50})"/></svg><div class="vp-ringn" style="top:${f1(cy-160)}px">${cnt(p.value,k)}</div>${p.label?`<div class="vp-ringl" style="top:${f1(cy+96)}px;font-size:${fitU(p.label,50,440)}px">${p.label}</div>`:''}`;
   if(p.note){const kn=oc((t-ta-.9)/.4);if(kn>0)h+=`<div class="vp-ringl" style="top:${f1(cy+r+90)}px;font-size:48px;${wipe(kn)}">${p.note}</div>`;}
   return h+ava(p,t);};}
});

// ====== 18 vp-rank：排行 ======
S('vp-rank',{real:()=>false,minDur:1.5,
 says:'几行横条一行行出来，条的长短就是大小，数字跟在条尾；最要紧的那行是强调色',use:'"亏损榜第一""四家里谁花得最多"：有名次的比较',avoid:'超过 5 行',
 need:['items'],help:{items:"[{name:'微软', value:'800亿', hl:true, at}]，3–5 行，照名次排好",title:'标题',brow:'小字',bg:'垫底的图'},
 beats:p=>A(p.items).length,
 draw(p,c){markAva(p);const its=A(p.items),n=its.length,ts=tsOf(c,its,.35,.5),top=TOP(p)+40,rh=Math.min(214,(1220-top)/n-22),mx=Math.max(...its.map(i=>numOf(i.value)),1e-9);
  return t=>{const th=t-c.t0;let h=base(p,c,t)+hd(p,th);
   its.forEach((it,i)=>{const k=tail(t-ts[i]+.05,.1);if(k<=0)return;const g=oc((t-ts[i])/.8),bw=Math.max(30,620*numOf(it.value)/mx)*g;
    h+=`<div class="vp-rk${it.hl?' hl':''}" style="left:${f1(60-(1-k)*900)}px;top:${f1(top+i*(rh+22))}px;height:${f1(rh)}px"><span>${i+1}</span><b style="font-size:${fitH(it.name,66,250)}px">${it.name}</b><i style="width:${f1(bw)}px"></i><em>${cnt(it.value,g)}</em></div>`;});
   return h+ava(p,t);};}
});

// ====== 19 vp-chapter：分段的小标题 ======
S('vp-chapter',{real:()=>false,minDur:.8,
 says:'一个大序号、一条线、一个标题：告诉观众换话题了',use:'两分钟以上的片子分段；"第一个原因""再看另一边"',avoid:'30 秒的短片（不用分段）；一条片超过 3 次',
 need:['title'],help:{no:"序号 '01'（可不写）",title:'这一段叫什么（6 个字以内）',en:'英文小字',bg:'垫底的图'},
 beats:()=>1,
 draw(p,c){const fs=fitH(p.title,210,900);
  return t=>{const th=t-c.t0,k=tail(th,.11),kl=oc(th/.45);
   return base(p,c,t)+(p.no?`<div class="vp-chno" style="left:${f1(64-(1-k)*500)}px;top:430px">${p.no}</div>`:'')+`<div class="vp-chl" style="left:64px;top:${p.no?700:560}px;width:${f1(952*kl)}px"></div><div class="vp-word vp-it" style="left:${f1(60+(1-k)*1100)}px;top:${p.no?740:600}px;width:auto;font-size:${fs}px;text-align:left;transform:rotate(-4deg);transform-origin:0 60%">${pword(p.title,'accent',null,false)}</div>${p.en?`<div class="v-en" style="left:70px;top:${(p.no?740:600)+fs*1.2+30}px;font-size:32px;${wipe(oc((th-.35)/.4))}">${p.en}</div>`:''}`;};}
});

// ====== 20 vp-ask：把问题抛给观众 ======
S('vp-ask',{real:()=>true,minDur:1.2,
 says:'一个巨大的问号先转进来压在后面，问题一两行砸在前面',use:'开头抛问题；讲到一半反问一句"那钱从哪来？"',avoid:'后面不回答的问题；连着两镜用',
 need:['lines'],help:{lines:"['黄金为什么','反而跌']，1–2 行，不用写问号",at:'每行的时刻',zoom:'景别',bg:'没有口播时垫的图',props:PH},
 beats:p=>A(p.lines).length,
 draw(p,c){markHost(p);const zf=zoomS(p,c),ls=A(p.lines),n=ls.length,ts=ls.map((_,i)=>c.at(A(p.at)[i])??c.t0+.35+i*.6),fss=ls.map((l,i)=>fitH(l,i===n-1?240:176,900)),host=useHost(p),ys=[];let y=host?1270:1010;for(let i=n-1;i>=0;i--){y-=fss[i]*1.14;ys[i]=y;}
  return t=>{const th=t-c.t0,kq=tail(th-.05,.12);const qm=`<div class="vp-askq" style="left:${host?560:400}px;top:${host?120:160}px;transform:rotate(${f1(14+46*(1-kq))}deg) scale(${f3(.6+.4*kq)});opacity:${f3(c01(th*6)*(host?.9:.8))}">？</div>`;
   let h=stage(p,c,zf,t,host&&HOST.cut?qm:' ')+(host&&HOST.cut?'':qm)+props(p,c,t,'back');
   ls.forEach((l,i)=>{const k=(t-ts[i])/.16;if(k>0)h+=line(pword(l,i===n-1?'accent':'white'),ys[i],fss[i],i%2?10:-30,`opacity:${f3(c01(k*3))};transform:perspective(1200px) rotateY(-13deg) rotateX(5deg) rotate(-3deg) scale(${f3(1+1.2*(1-oe(k)))})`);});
   return h+props(p,c,t,'front');};}
});

// ---------- 全片自检（--check 时 vert.js 会来调）：都是提醒，不拦 ----------
const STAGE=new Set(['vp-words','vp-reject','vp-voices','vp-number','vp-ask']);
const zEnds=p=>{const z=p.zoom;if(z==null)return [1,1];if(typeof z==='number')return [z,z];const a=A(z).map(x=>x.s??1);return [a[0]??1,a[a.length-1]??1];};
function checkFilm(shots,warn){
 const cnt={};shots.forEach((s,i)=>{if(!s.scene.startsWith('vp-'))return;(cnt[s.scene]??=[]).push(i+1);
  if(i&&shots[i-1].scene===s.scene)warn(`第 ${i} 镜和第 ${i+1} 镜连着用了 ${s.scene}：进场一样，看着像套模板；换一个组件，或者中间插一镜别的`);});
 for(const k in cnt)if(cnt[k].length>2)warn(`${k} 用了 ${cnt[k].length} 次（第 ${cnt[k].join('、')} 镜）：一条片里每个组件最多一两次，多了观众会看出是同一个动作`);
 shots.forEach((s,i)=>{const p=s.p,tag=`第 ${i+1} 镜（${s.scene}）`;if(!s.scene.startsWith('vp-'))return;
  if(STAGE.has(s.scene)&&!useHost(p)&&!bgOf(p))warn(`${tag}没有口播，也没写 bg：这一镜的底是空的。写一张图，或者在 KIT_VPRO.theme({bg:'…'}) 里给全片一张默认的底`);
  if(s.scene==='vp-verdict'&&!bgOf(p))warn(`${tag}没写 bg：最重的一镜垫一张和结论有关的图（公司、现场）更压得住`);
  const kinds=new Set(A(p.props).map(o=>o.kind));if(kinds.size>1)warn(`${tag}挂了 ${kinds.size} 种道具（${[...kinds].join('、')}）：一镜只演一样东西`);
  A(p.props).forEach(o=>{if(o.kind!=='bills'&&!/\.(png|webp)(\?|$)/i.test(o.img??''))warn(`${tag}的道具 ${o.img} 不是透明 PNG：先用 scripts/cut_img.py 抠出来，不然会带着一块底`);});
  if(i&&STAGE.has(s.scene)&&STAGE.has(shots[i-1].scene)&&useHost(p)&&useHost(shots[i-1].p)){const a=zEnds(shots[i-1].p)[1],b=zEnds(p)[0];if(Math.abs(a-b)<.1)warn(`第 ${i} 镜和第 ${i+1} 镜都是她，景别 ${a} 接 ${b} 差得太少，切过去像没切：差 0.15 以上，或者中间插一镜证据`);}
 });
 const n=shots.filter(s=>s.scene.startsWith('vp-')).length,pr=shots.filter(s=>A(s.p.props).length).length;
 if(n>=5&&!pr)warn('全片没有一样会动的道具（props）：只有字和卡，会显得少点东西。挑一两个口播里的词演出来（一件真东西的抠图就行）');
}
window.KIT_VPRO={theme,TH,PROP,pword,tail,oc,oe,checkFilm};
})();
