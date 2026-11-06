## v0.3.2（2026-11-06）— 入口一致性

把 v0.3.0/0.3.1 的代码改动反映到入口文档上，不留"说的是旧规矩、做的是新规矩"：

- SKILL 的地区表不再写"80px 硬字幕"，改成"字幕默认不烧进画面"；新增「字幕：默认独立文件」与「素材：画面跟着论点走」两节。
- SKILL 的常用命令补齐成一条链：建片 → 配音 → 底稿 → 预检 → 画面 → 封面 → 字幕导出 → 复制播放器 → 成片 → 交付预检 → 用 HTTP 验 CC 开关。
- `caption_mode:'burned'` 明确标为 **legacy**：它仍走 `film_base.js` 的 `chunksOf`（按标点+字数切），**不读 `caption_segments`**，字号也是旧的 80px。要硬字幕且断句一致，得先改 `chunksOf`，本版没做。
- README 首段与 description 同步：字幕默认 sidecar、画面按论点配。
- package / lock 对齐 0.3.2。
# 更新记录

## v0.3.0（2026-11-06）— 自检闭环：预检、复核卡、字幕分离

这一版解决的问题：**用这个 skill 的人不必再等别人验收**。程序查能证明的，模型按复核卡查语义和画面，两边都写证据。

**新增**

- `scripts/preflight.mjs`：交片前预检。查页面报错、镜头首尾空档/重叠、cue 是否落在**声明它的那一镜**里、人物是否真的可见（逐祖先 opacity，不只读 `<img>`）、重复 seek 是否稳定（整段 HTML 哈希）、文字是否越出安全区、角标是否漏、字体是否真加载、实拍帧数够不够、字幕计划有没有、成片音视频流与时长、封面确切尺寸。输出 `out/preflight.json`，退出码 0/1/2（干净/必须修/待复核）。
- `references/self-review.md`：给执行模型的复核卡（配音前查引语、渲片前查画面、交片前查承诺），以及 `out/review.json` 的写法。
- `scripts/preflight-fixtures.ps1`：10 个真 fixture，每个故意做错一处，断言对应的 blocking code。全部通过。
- `scripts/export_captions.py`：把 `caption_segments`（完整短语，0-based、end exclusive）按真实逐字时刻导成 SRT/VTT/captions.json。结构错误（漏句头/漏句尾/重叠/文字不符/超过两行/时间倒序）全部 blocking 且**不写文件**。
- `caption_mode`（默认 `sidecar`）：影片不烧录字幕，字幕走独立文件；`burned` 保留旧行为。
- `starter/review-player.html`：`<video>` + `<track kind=captions>` + 真 CC 开关 + cue 列表，用来验证"关掉字幕画面里也没有字"。
- `kit/local_native.js` 新场景 `panel`（图解/对照清单，`layout:'steps'` 带层级箭头）、`local-hero` 支持实拍与抠像同时出现。
- `render.mjs --cover` 的真尺寸自检；`--video` 渲染前的预检闸门（fail-closed，只在 politics 策略下启用）。

**修掉的真问题**

- `local-clash` 的 `slam(tt,tt)`：进度恒为 0，两个人永远透明，整镜只剩灰底。
- `render --cover` 用 `deviceScaleFactor:2`，`cover_1280.jpg` 实际是 2560×1440。
- `.pn-note` 缺 `position:absolute`，`translateX(-50%)` 把整块推掉半个屏。
- `-webkit-text-stroke` 居中描边吃字身：加 `paint-order:stroke fill`。
- 时间线签名 Python/JS 格式不一致导致假 stale；`toFixed()` 返回字符串导致假 stale。

**约定**

- 交付命名：`final_clean_720.mp4`（默认，无烧录字幕）+ `captions.zh-TW.srt/.vtt` + `review-player.html`；`final_burned_720.mp4` 只在明确要硬字幕时提供。
- `overlays:'none'` 时 `check_editorial` 不再强制 `fiction_marker`，但要求 `note` 交代是虚构。

## v0.2.1（2026-11-06）

`local-clash` 人物不显示（`slam(tt,tt)`）、`local-hero` 巨字溢出。

## v0.2.0（2026-11-06）— 港台本地风格

地区决定语言与字体：台湾 Noto Sans TC Black + zh-TW，香港 Noto Sans HK Black + 书面粤语 + zh-HK。`--region` 入口、人物抠像封面、粗描边巨字、slam/震动/爆炸、900 字重字幕、`no-badges`。

## v0.1.1（2026-11-06）

`--politics` 真的建出时政起点（之前参数解析了但没用）；风格对照文档；sourcing 修正。

## v0.1.0（2026-11-06）— 从 wallstreet-explainer 派生

从 [HeyChengC/wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer) 的 `f39845a` 派生，保留全部上游历史和 LICENSE。时政入口、`editorial.json` 事实底稿、`check_editorial.py`、`--check-policy politics`、三个时政场景（stance-matrix / event-timeline / verdict）。

## 上游记录

- v2.2（2026-11-04）：加真人口播模式，一个 skill 两种模式。
- v2.1（2026-10-31）：render.mjs --check 补漏。
- v2.0（2026-10-31）：加模板档 kit/、references/rules.md、new_film.mjs。


