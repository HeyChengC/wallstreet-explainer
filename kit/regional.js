// regional.js —— 港台本地化主题：字体、语音、画面语言。
// 载入顺序：kit.js → scenes.js → scenes_plus.js → host.js → politics.js → regional.js
//
// 为什么单独一份：上游的巨字字体（阿里妈妈数黑体）**缺 142/336 个常用繁体字**
// （会议员选举预算质询报门长发强认应评对过决订条党执联场态声记会采访传网络专页论据统调资开监问责…），
// 浏览器会回退到 MiSans，结果是同一句里字形和字重混排——这正是"大陆模板"观感的来源之一。
// 所以港台题材换成 Noto Sans TC / HK（字重 900，真粗体，不是把 500 放大）。
//
// 用法（film.js 里，KIT.use 之后）：
//   K.regional('taiwan');            // 字体 + 字幕用词
//   K.regional('hongkong');
// 不改全局：不调用它，行为与上游完全一致。
//
// 注意：这里**不在加载时读 KIT**，全部在调用时通过 window.KIT 取，避免脚本顺序问题。
(()=>{
// ---------- 区域配置 ----------
const REGIONS={
 taiwan:{
  name:'taiwan',
  fontFamily:'NotoTCH',
  // 巨字/大字：NotoTCH（只注册 900，必定巨粗）
  fontStack:"NotoTCH,'Noto Sans TC','Microsoft JhengHei','PingFang TC',Mi,MiSans,sans-serif",
  // 正文/眉题：NotoTCB（700 与 900 都在）
  uiStack:"NotoTCB,'Noto Sans TC','Microsoft JhengHei','PingFang TC',Mi,MiSans,sans-serif",
  numStack:"Num,'Bebas Neue',Bahnschrift,Impact,sans-serif",
  voice:{male:'zh-TW-YunJheNeural',female:'zh-TW-HsiaoChenNeural',rate:'-4%'},
  // 台湾用语：只影响口语用词，不改专有名词、机构名和原话
  words:{视频:'影片',信息:'資訊',软件:'軟體',网络:'網路',质量:'品質',水平:'水準',出租车:'計程車',
        自行车:'腳踏車',项目:'專案',数据:'數據',打印:'列印',屏幕:'螢幕',智能手机:'智慧型手機'},
  subMax:18,   // 繁体字更宽，字幕一行 18 字
 },
 hongkong:{
  name:'hongkong',
  fontFamily:'NotoHKH',
  fontStack:"NotoHKH,'Noto Sans HK','Microsoft JhengHei','PingFang HK',Mi,MiSans,sans-serif",
  uiStack:"NotoHKB,'Noto Sans HK','Microsoft JhengHei','PingFang HK',Mi,MiSans,sans-serif",
  numStack:"Num,'Bebas Neue',Bahnschrift,Impact,sans-serif",
  voice:{male:'zh-HK-WanLungNeural',female:'zh-HK-HiuMaanNeural',rate:'-4%'},
  words:{视频:'影片',信息:'資訊',软件:'軟件',网络:'網絡',质量:'質素',出租车:'的士',
        自行车:'單車',土豆:'薯仔',项目:'項目',数据:'數據',打印:'列印',屏幕:'螢幕'},
  subMax:18,
 },
};

// 巨字族 NotoTCH：只注册 900。模板里写 font:<size>px <FAM.han> 不带字重（默认 400），
// 只注册 900 时浏览器只能选 900——这样不用改上游任何场景代码就能拿到真巨粗。
// （如果同时注册 700，400 会退到 700，正是"看起来不够粗"的原因。）
// 注意：这段是模板字符串，注释里不能出现 ${...}，否则会在加载时插值未定义变量。
const FACES_CSS=`
@font-face{font-family:NotoTCH;src:url(fonts/NotoSansTC-Black.otf);font-weight:900}
@font-face{font-family:NotoHKH;src:url(fonts/NotoSansHK-Black.otf);font-weight:900}
@font-face{font-family:NotoTCB;src:url(fonts/NotoSansTC-Bold.otf);font-weight:700}
@font-face{font-family:NotoTCB;src:url(fonts/NotoSansTC-Black.otf);font-weight:900}
@font-face{font-family:NotoHKB;src:url(fonts/NotoSansHK-Bold.otf);font-weight:700}
@font-face{font-family:NotoHKB;src:url(fonts/NotoSansHK-Black.otf);font-weight:900}
`;
let facesDone=false;
function injectFaces(){
 if(facesDone)return;facesDone=true;
 const st=document.createElement('style');st.textContent=FACES_CSS;document.head.appendChild(st);
}

let CUR=null;

// 可调用对象：window.KIT.regional('hongkong') 能直接用，
// window.KIT.regional.voice() / .words() / .hanFont() 也能用。
// 做成函数而不是纯对象，是因为 kit.js 的 use() 会把它整个取走挂到这条片的 K 上，
// 这样不管 use() 在什么时候跑，拿到的都是同一个可调用的东西。
function regional(region,opts={}){
 const R=REGIONS[region];
 if(!R)throw Error(`K.regional：只有 ${Object.keys(REGIONS).join(' / ')}，现在是 '${region}'`);
 const KIT=window.KIT;
 if(!KIT)throw Error('K.regional：window.KIT 还没准备好（regional.js 要在 kit.js 之后加载）');
 injectFaces();
 CUR={...R,...opts,region};
 // 巨字/中文大字换成本地字体栈；数字保持 Bebas（拉丁字形，两岸三地一样）
 // 字体栈里把 NotoTCH/NotoHKH 排第一，同时保留 MiSans 作为缺字兜底。
 KIT.FAM.han=R.fontStack;
 KIT.FAM.ui=R.uiStack??R.fontStack;
 KIT.FAM.num=R.numStack;
 // 字体要**加载完**再排字：模板里量字宽用的是 measureText，字体没到会按 fallback 量，布局全偏。
 // 这里返回一个 Promise，film.js 里 await K.regional(...) 即可。
 return document.fonts.ready.then(()=>KIT);
}
regional.current=()=>CUR;
// 带字重的 font 简写：模板里写 font:${size}px ${FAM.han} 会落回 400，巨字要用 900
regional.hanFont=(size,weight='black')=>{
 const fam=CUR?CUR.fontStack:window.KIT?.FAM?.han??'sans-serif';
 const w=weight==='bold'?700:900;
 return `${w} ${size}px ${fam}`;
};
// 语音参数（生成配音时用）
regional.voice=(opts={})=>{
 const R=opts.region?REGIONS[opts.region]:CUR;
 if(!R)throw Error('K.regional.voice：先 K.regional(...) 或传 {region}');
 const g=opts.gender??'male';
 return {voice:R.voice[g],rate:opts.rate??R.voice.rate};
};
// 字幕/文案用词替换（只换口语词，不碰专有名词和原话）
regional.words=(text)=>{
 if(!CUR)return text;
 let out=String(text);
 for(const [a,b] of Object.entries(CUR.words))out=out.split(a).join(b);
 return out;
};
regional.regions=()=>Object.keys(REGIONS);

// 挂到全局 KIT 上；同时留一份 window.__REGIONAL 给 kit.js 的 use() 取
if(window.KIT){
 window.KIT.regional=regional;
}else{
 window.addEventListener('DOMContentLoaded',()=>{if(window.KIT)window.KIT.regional=regional;});
}
window.__REGIONAL=regional;
})();
