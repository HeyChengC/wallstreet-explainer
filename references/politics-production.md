# 时政片怎么做：逐站产物和命令

上游 `SKILL.md` 的七站流程在这里具体化。**每站给用户能审的东西**，不是每站都卡死等他点头——研发和已授权的任务可以连着做完再交。

## 准备：建片子

```powershell
node scripts/new_film.mjs <片子目录> --politics
```

建出来的是**可运行的时政起点**：`index.html`（已引 `lib/politics.js`）、`film.js`（5 镜，带角标和 `verdict`/`event-timeline` 示例）、`script.json`、**`editorial.json`**、`assets/docs/`（它引用的三份本地虚构材料）、`lib/`、`assets/kit/`、`fonts/`。

起点默认是 **fiction** 模式（虚构城市 + 常驻虚构标记），因为这样不用联网就能跑通。换成真实题材时三件事一起做：

1. `editorial.json` 的 `content_mode` 改 `factual`，`sources` 换成真实来源；
2. 删掉 `film.js` 里的 `K.politics.fiction(...)` 那一行；
3. `K.politics.badges` 换成你自己核实过的来源。

**老片子要加时政能力**：

```powershell
node scripts/new_film.mjs <老片子> --sync
```

`--sync` 只更新 `lib/` 和 `assets/kit/`，**不动你的 `index.html`**（那可能被你改过）。所以新加的 `lib/politics.js` 不会自动生效——脚本会检测并提示。要用时政场景，手动在 `<script src="lib/host.js"></script>` 后面加一行：

```html
<script src="lib/politics.js"></script>
```

没加这一行，`stance-matrix` / `event-timeline` / `verdict` 和角标都不会工作（页面会报"没有这个场景"）。**不要指望 `--sync` 一步给老片子开新场景。**

## 站 1：事实底稿 editorial.json

在写文案之前建。它决定这条片能说什么。

```json
{
 "config": {
  "region": "hongkong",
  "stance": "neutral",
  "styles": ["objective"],
  "emotion": 1,
  "profanity": "none",
  "content_mode": "factual",
  "as_of": "2026-11-06T14:00:00+08:00"
 },
 "sources": [
  {"id":"s1","url":"https://www.info.gov.hk/gia/general/...","publisher":"香港政府新聞公報",
   "title":"行政長官發表施政報告","published_at":"2026-09-16",
   "accessed_at":"2026-11-06","source_type":"gov-press"}
 ],
 "claims": [
  {"id":"c1","kind":"fact","text":"一句话说清这条事实","beat_ids":["b03"],
   "source_ids":["s1"],"event_date":"2026-09-16"},
  {"id":"c2","kind":"quote","text":"原话","beat_ids":["b05"],
   "source_ids":["s1"],"speaker":"職銜 + 姓名"},
  {"id":"c3","kind":"analysis","text":"我的判断","beat_ids":["b12"],
   "source_ids":["s1"],"reasoning":"凭什么这么判断：哪几条证据指向它"}
 ]
}
```

**产物给用户看**：来源清单 + 每条事实一句话。哪里没核实（`published_at` 是 `null`、只有一家媒体在报）要主动说。

## 站 2：文案 script.json

```powershell
node scripts/timeline_stub.mjs <片子>/script.json     # 先估时间线，画面才能挂 cue
```

`lines` 每句一个 `id`，写口语、句句往下接。**每句都要能在 `editorial.json` 找到对应 claim**（至少关键的几句）。

## 站 3：导演表 + film.js

导演表在上游那几列基础上加两列：`claimIds`、角标。

`film.js` 的骨架：

```js
window.ready=(async()=>{
const F=await FB.init({counts:['assets/clips/counts.json'],fonts:KIT.FONTS});
const K=await KIT.use(F);                 // policy 由 render.mjs --check-policy 从 URL 带进来

K.politics.badges([
 {from:'@b03', until:'@b07', source:'政府新聞公報 · 09/16', nature:'fact'},
 {from:'@b12', until:'@b16', source:'本片判斷', nature:'analysis'},
]);
// K.politics.fiction(true,'虛構演繹 · 人物與情節均為虛構');   // 只有 fiction 模式

await K.film([
 {scene:'statement', until:'@b02', says:'……', claimIds:['c0'], lines:['…']},
 {scene:'event-timeline', until:'@b07', says:'……', claimIds:['c1'],
  events:[{date:'2026-09-16',who:'…',title:'…',at:'@b03'}, …]},
 {scene:'stance-matrix', until:'@b12', says:'……', claimIds:['c1','c2'], sides:[…]},
 {scene:'verdict', says:'……', claimIds:['c3'], judgment:'…', support:[…], counter:{…}, watch:{…}},
]);
return K.go();
})();
```

**产物的形状**：`says` 一列读一遍，遮住文案看能不能讲通。

## 站 4：素材

见 `politics-sourcing.md`。真素材放 `assets/img/`，截图放 `docs/`，PDF 原页放 `assets/img/`。

**产物给用户看**：3–4 张关键样帧。

## 站 5：配音和时间线

```powershell
python scripts/temp_voice.py <片子>/script.json      # edge-tts 临时配音 + 逐字时间线
```

换正式配音后：每句存成 `voice/<id>.final.wav`，再跑一次 `python scripts/temp_voice.py <片子>/script.json --asr`。

**每改一次 `script.json` 都要重跑时间线**，否则 `--check` 会拦住（它会比对文案和 timeline，对不上直接报错）。

## 站 6：720p

```powershell
python scripts/check_editorial.py <片子>/editorial.json
node scripts/preflight.mjs --dir <片子> --stage draft
node scripts/render.mjs --dir <片子> --check-policy politics --check
node scripts/render.mjs --dir <片子> --check-policy politics --sheet
node scripts/render.mjs --dir <片子> --check-policy politics --video --h 720
```

`render --video`（politics 策略下）会先跑一遍预检，有 blocking 就停下、不渲。确认要渲加 `--force`。

`--check` 会打印：

```
检查策略：politics
虚构标记：全片常驻「…」，每一镜都验过      ← fiction 模式才有这一行
```

**零提醒不等于能交片**。必须自己看：

- `out/sheet.png`：每一镜的开头/中间/末尾
- 角标有没有压在字幕上、有没有出安全区
- `stance-matrix` 的卡片有没有重叠、长名字有没有被省略号吃掉
- `event-timeline` 的节点是否各挂各的 cue（不是同时亮）
- 原话念得完吗（字数 / 时长）

## 站 6.5：字幕

默认 `caption_mode:'sidecar'`，影片不烧录字幕：

```powershell
python scripts/export_captions.py <片子>        # → captions.zh-TW.srt / .vtt / captions.json
```

在 `script.json` 的每条 line 上写 `caption_segments`（完整短语，0-based、end exclusive），导出脚本按真实逐字时刻算 start/end。**没有 `caption_segments` 时只出草稿**，并标 `review_required`——草稿是按标点猜的，不能当终稿。

结构错误（漏句头、漏句尾、段间漏字、重叠、文字和原文不符、超过两行、时间倒序）会**直接报错且不写文件**。

验证开关：

```powershell
Copy-Item starter/review-player.html <片子>/out/
cd <片子>/out; python -m http.server 8080
# 打开 http://127.0.0.1:8080/review-player.html，播放 → 点「字幕：關」→ 字幕消失、画面里也没字
```

## 站 7：成片

```powershell
python scripts/mix.py <片子> --check
node scripts/render.mjs --dir <片子> --check-policy politics --video --h 1080
ffmpeg -i <片子>\out\visual_1080.mp4 -i <片子>\mix_master.wav `
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart `
  <片子>\out\final_clean_1080.mp4
ffprobe -v error -show_entries stream=codec_type,duration -of json <片子>\out\final_clean_1080.mp4
node scripts/preflight.mjs --dir <片子> --stage delivery     # 最后一道
```

**命名**：默认 `final_clean_720.mp4`（无烧录字幕，配独立 SRT/VTT）；要硬字幕才出 `final_burned_720.mp4`。

**预检 delivery 会查**：音视频流都在、时长差 ≤0.25s、封面正好 1280×720 / 1920×1080、平均音量不异常、每句都有字幕计划。

**验证**：`ffprobe` 要看得到一条 video 和一条 audio，时长和 `timeline.json` 的 `duration` 对得上。

## 两种口播模式

### 无人出镜（默认）

`temp_voice.py` 出配音，纯动效 + 证据。时政片多数是这个。

### 有口播视频（继承上游，未在本机端到端实测）

用户给了自己的口播/数字人视频时不依赖 YouTube，走上游那套：

```powershell
ffmpeg -i <口播.mp4> -vf fps=30,scale=1920:1080 <片子>/assets/clips/host/%04d.jpg
python scripts/matte.py <片子>/assets/clips/host <片子>/assets/cut/host
python scripts/host_timeline.py <口播.mp4> <片子>/script.json <片子>/timeline.json
```

**本机没装 faster-whisper 和 onnxruntime，这条路没跑过。** 要跑先装：

```powershell
python -m pip install faster-whisper onnxruntime rembg
python -c "from rembg import new_session; new_session('isnet-general-use')"
```

有 NVIDIA 显卡换成 `onnxruntime-gpu` 和 `faster-whisper` 的 GPU 版。

## 目录结构

```text
片/
├─ index.html            渲染入口（已引 politics.js）
├─ film.js               镜头表
├─ script.json           文案（句子 id）
├─ timeline.json         每句每字的时刻
├─ editorial.json        来源与事实（config / sources / claims）
├─ assets/
│  ├─ img/               图片（截图、PDF 原页）
│  ├─ clips/             实拍帧序列
│  ├─ cut/               抠像结果
│  ├─ docs/              原始材料（截图、提供给用户的本地文件）
│  └─ kit/               模板库纹理
├─ voice/                配音
├─ lib/                  渲染底座 + 模板 + politics.js
└─ out/
   ├─ sheet.png          每镜三帧
   ├─ check.json         检查结果（policy / fiction / warns）
   └─ visual_720.mp4
```

## 交付时说的话

- 这版改了什么
- 哪些验过（`check_editorial` 结果、`--check` 结果、虚构标记是否全片）
- 哪些**没验**（口播路径、下载路径、某段素材没找到）
- 版权：哪些是引用、哪些是自制
