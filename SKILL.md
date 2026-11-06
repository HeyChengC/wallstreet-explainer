---
name: political-commentary
description: 港台时政评论短片（1–3 分钟、16:9）。地区决定语言：台湾用繁体 + 台湾国语 + Noto Sans TC Black，香港用**书面粤语** + zh-HK 音色 + Noto Sans HK Black。再选立场（neutral / 台湾绿营蓝营 / 香港建制泛民 / custom）、风格（objective / traffic / outrage / adversarial，可组合）、情绪与粗口档位，把"发生了什么—最关键的证据—各方公开立场—分歧与影响—我的判断—下一步看什么"做成一条片。本地自媒体包装：人物抠像大头上封面、粗描边巨字、slam/震动/爆裂、900 字重黑描边字幕；角标可选（overlays full 显示来源与性质，none 则全部不上屏、出处只留 editorial.json）。立场可以鲜明、可以尖锐批评，但不改事实、原话和身份；未证实的爆料要标"未证实"，要编内幕走 fiction 并按 overlays 配置标注。工具：新闻截图与荧光笔、人物抠像、逐帧渲染、配音时间线、混音、封面露；配 editorial.json 记录来源与事实（check_editorial.py 校验）。用户说"时政评论""港台评论""做条时政视频""像少康战情室那种""香港政策拆解""台湾议题交锋""粤语评论""带点内幕感""强对立""愤慨一点""不要角标""虚构政治剧情"时使用。
---

# 时政评论（political-commentary）

**从一笔账换成一件事：发生了什么，最关键的证据是什么，各方公开说了什么，我的判断是什么，接下来看什么。**

派生自 [wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer)（MIT）。渲染底座、配音、混音、抠像工具全部沿用上游；时政的部分是配置、论证方法、三个新场景和事实追踪。

## 先定三件事：地区、立场、风格

用户说清了的就照做；**没说的用默认值，不要逐个追问**。只有一种情况要问：同一句话里能读出两种相反的取向（比如"中立但狠狠批他"——是要 neutral 的措辞还是 outrage 的强度），这时候问一句比猜错省事。

| 维度 | 取值 | 作用 |
|---|---|---|
| `region` | `general` / `taiwan` / `hongkong` | 议题语境。**选了港台就同时定下语言、字体、字幕样式**。不推断观看者身份 |
| `stance` | `neutral`；台湾 `green-leaning` / `blue-leaning`；香港 `establishment-leaning` / `pan-democratic-leaning`；`custom` + `stance_note` | 判断重点和价值标准。**不是**改写事实的开关 |
| `styles` | `objective` / `traffic` / `outrage` / `adversarial`，可组合，第一项为主 | 开头、措辞、顺序、结尾、音画强度 |
| `emotion` | 0 平静 / 1 鲜明 / 2 愤慨 / 3 拉满 | 停顿、配乐、强调词、节奏 |
| `profanity` | `none` / `mild` / `bleeped` | 粗口档位。选 `outrage` **不会**自动提高档位 |
| `content_mode` | `factual` / `fiction` | 现实评论，或明确标注的虚构剧情 |
| `overlays` | `full` / `none` | `full` 画面上挂来源与性质角标；`none` 全部不显示，出处只留 `editorial.json` |

**默认值**（未指定时直接沿用，不必确认）：`general` + `neutral` + `[objective]` + `emotion 1` + `profanity none` + `factual` + `overlays full` + 90 秒 + `zh-CN`。

细节和四种风格的写法：`references/politics-editorial.md`；样本出处和"哪些是量过的、哪些只是看的"：`references/politics-style.md`。

## 港台本地版：语言、字体、画面一起定

选了 `region: taiwan` 或 `hongkong`，语言和画面就跟着定，**不能用普通话读繁体稿**：

| | 台湾 | 香港 |
|---|---|---|
| 语音 | `zh-TW-YunJheNeural`（男）/ `zh-TW-HsiaoChenNeural`（女） | `zh-HK-WanLungNeural`（男）/ `zh-HK-HiuMaanNeural`（女） |
| 正文 | **台湾国语写法**：影片、網路、立委、質詢、財源、期程 | **书面粤语**：唔、嘅、咗、佢、啲、喺；講咗咁耐、點解又押後 |
| 字体 | Noto Sans TC Black（900） | Noto Sans HK Black（900） |
| 字幕 | 900 字重、80px、7px 黑描边、`paint-order` | 同左 |

**硬规矩**：

- 香港版**必须**用 `zh-HK-*` 音色。用普通话音色读粤字 = 另一种语言，不算"口音差异"。
- 音色不存在或服务报错要**抛真实错误**，不能悄悄退回 `zh-CN` 交片。
- 改了 `text` 或 `voice` **必须重跑** `temp_voice.py`，不复用旧配音缓存。
- 上游巨字字体（阿里妈妈数黑体）**缺 142/336 个常用繁体字**，港台题材会一字一字 fallback 混排；本地版因此换 Noto TC/HK Black。

建片子：

```powershell
node scripts/new_film.mjs <目录> --region taiwan      # 繁体正文 + zh-TW 男声 + 无角标
node scripts/new_film.mjs <目录> --region hongkong    # 书面粤语 + zh-HK 男声 + 无角标
```

细节：`references/local-language.md`（用词与语音）、`references/local-native-style.md`（封面、字幕、动效、无角标）。

## 无角标（overlays: none）

用户要求画面不显示来源、性质、虚构、研究等任何标签时：

```js
K.politics.display('no-badges');
```

关掉的是**所有**上屏标记：来源角标、性质 chip、虚构演绎、角落年份/主题小字（`kicker` 写了也不画）、原素材自带的台标（要裁掉）。

**关掉不等于没有记录**：`editorial.json` 的 `sources` / `claims` 照常写，事实与分析的区分仍在文件里。画面不显示 ≠ 事实不分。

`--check` 会打印 `虚构标记：已关闭（display:'no-badges'…）`。

## 立场怎么用，不越哪条线

- 立场决定**你更看重什么**：谁的责任、哪种代价更要紧、什么算证据不足。它不决定事件时间、票数、原话、身份。
- **可以得出"一方证据更强"的结论**。neutral 不等于永远五五开，强行平衡本身就是一种歪曲。
- **不能靠删掉决定性反证来制造结论**。对方的最强论据要摆出来再反驳，不是不提。
- **党派和派别内部不是铁板一块**。一个人的话不能写成整个阵营的立场。
- 香港不用台湾的蓝绿值，反过来也一样；`stance:'custom'` 必须写 `stance_note` 说清判断重点。

## 四种风格，具体到能执行

| 风格 | 开头 | 正文 | 别做 |
|---|---|---|---|
| `objective` | 事实里最反常的那一点 | 证据—解释—条件式判断 | 假装没有立场；把不确定说成确定 |
| `traffic` | 公开记录里一个容易忽略的细节、一处自相矛盾、一个还没揭晓的结果 | 悬念一步步兑现，每段给一个新信息 | 说"我刚收到内部消息""独家确认"；用疑问句暗示自己不敢明说的指控 |
| `outrage` | 直接点出最不能接受的那件事 | 递进反问、短句、断句；批评落在政策和言行上 | 每句都骂；把强度写成对群体的敌意 |
| `adversarial` | 先把对方最有力的论点说准 | 逐条摆论据、逐条反驳、给出替代解释 | 稻草人；把对方说成没人会信的蠢话 |

**内幕感的正确来源**：公开文件里前后不一致的地方、时间线上的缺口、说辞和账面/记录对不上、谁在什么场合改了说法。这些都能给出处。编出来的"内部人士"不行。

**未证实的爆料**：只做归因——谁、哪天、说了什么、证据是什么、争议在哪；`kind:'unverified'` + `marked_on_screen:true`，口播和画面都写"未证实"。不能升级成"我们确认"。

**真要做虚构**：`content_mode:'fiction'` + `fiction_marker`，全片右上角常驻"虚构演绎"，用虚构人物和虚构机构，不给真实官员安虚构的罪名。
例外只有一种：`overlays:'none'`（用户明确要求画面不挂任何标记）时不再强制常驻，但 `note` 里必须写清"这是虚构演绎、不外发"——**画面不显示不等于可以不交代**。

## 一条片的骨架

发生了什么 → 最关键的证据 → 各方公开立场 → 分歧和影响 → 我的判断 → 下一步看什么。

**这不是必须六段。** `traffic` 会把悬念留到最后，`adversarial` 会把对方论点提前，`outrage` 可能从一个细节直接切进去。骨架管的是"信息别漏"，不是"顺序不许动"。

每一镜仍然要写 `says`（这一镜让观众多懂了什么），接住上一镜的某样东西。

## 事实底稿：editorial.json

**一条片一份 `editorial.json`**，放在片子目录里，和 `script.json` 并列。它记三样东西：`config`（上面的选项）、`sources`（来源）、`claims`（每条事实/原话/分析/未证实/虚构）。

- `claims[].beat_ids` 指向 `script.json` 的句 id；镜头表的 `claimIds` 指向 claims。
- `kind` 分五类：`fact` 事实 / `quote` 原话 / `analysis` 分析 / `unverified` 未证实 / `fiction` 虚构演绎。
- `fact`、`quote`、`unverified` 必须有 `source_ids`；`analysis` 必须有 `reasoning`；`quote` 必须有 `speaker`。
- `published_at` 查不到就写 `null`（这是提醒不是错误，别为了过检查编日期）。抓取日期写 `accessed_at`，两者不是一回事。
- 用户自己提供的视频/文件用 `source_type:'user-provided'` + `local_path`，不要硬标成 synthetic。

**校验：**

```powershell
python scripts/check_editorial.py <片子目录>/editorial.json
```

退出码 **0 干净 / 1 有错误 / 2 只有提醒**。流程里按"1 才停、2 打出来继续"处理，不要让未知发布日期卡住出片。

它查结构和可追踪性（有没有来源、引用是否存在、地区配不配那个立场、虚构有没有标记），**不判断政治观点对不对**，也不替你核实来源说了什么。字段全集见 `references/politics-rules.md`。

## 三个时政场景（`kit/politics.js`）

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 同一件事，这几方各自公开说了什么 | `stance-matrix` | `topic`、`sides[{name, short, tag, view, basis, at}]`，2–4 方 |
| 按时间怎么走到今天，最后那个还没发生的是什么 | `event-timeline` | `events[{date, who, title, at, pending}]`，2–5 个，`at` 各挂各的 cue |
| 我的判断、凭什么、什么条件下会错、接下来看什么 | `verdict` | `judgment`、`support`、`counter`、`watch`、`nature` |

其余照旧用上游场景：原话 `quote`、新闻原文 `article`/`desk`、报道标题墙 `headlines`、逐项对比 `compare`、关系流向 `flow`/`network`、地图 `map`、票数席位 `bars`/`share`/`ranking`。

**来源角标**（挂在帧层，不随镜头缩放，不压字幕）：

```js
K.politics.badges([
  {from:'@b05', until:'@b09', source:'政府新聞公報 · 11/06', nature:'fact'},
  {from:'@b12', until:'@b15', source:'立法會會議記錄', nature:'fact'},
  {from:'@b18', until:'@b21', source:'本片判斷', nature:'analysis'},
]);
K.politics.fiction(true, '虛構演繹 · 人物與情節均為虛構');   // 只有 fiction 模式
```

**一段只挂这一段真正在讲的来源**。同一镜里出现了委员会和市民团体，就拆成两段角标或拆镜，不要一个"记者会"盖到底。

## 流程

| 站 | 做什么 | 给用户看什么 |
|---|---|---|
| 0 选题 | 现在有讨论度、看完能带走一个判断、有公开材料能查 | 2–3 个切入角度，各附一句钩子 |
| 1 事实底稿 | 建 `editorial.json`：来源、claims、config | 来源清单 + 关键事实，哪里还没核实要直说 |
| 2 文案 | 按 `styles` 和 `stance` 写；口语、句句往下接 | 全文。定稿前不做正式配音 |
| 3 导演表 | 每镜写 `says`、`claimIds`、承接 | 每镜怎么接、哪几镜放证据 |
| 4 素材 | 官方页面截图 → PDF 原页 → 已核验原帖 → 用户提供 | 3–4 张关键样帧 |
| 5 开头/小样 | 钩子先做 15–20 秒 | 开头小样 |
| 6 720p | `preflight --stage draft` → `--check` → `--sheet` → 720p | 720p + 抽帧 |
| 7 成片 | 定稿后渲一次 1080p，`mix.py` 混音 | 1080p |

命令和逐站产物：`references/politics-production.md`。素材怎么找、抓不到怎么办：`references/politics-sourcing.md`。

## 交片前：两个检查，一个写、一个跑

**这是默认流程，不是可选项。** 模型单独跑也能靠它把片子做完。

### 1. 跑预检（程序查确定性错误）

```powershell
node scripts/preflight.mjs --dir <片子> --stage draft      # 写镜头表时
node scripts/preflight.mjs --dir <片子> --stage delivery   # 交片前
```

它查：页面报错/404、镜头首尾空档与重叠、cue 是否落在**声明它的那一镜**里、人物是否真的可见（逐祖先 opacity）、重复 seek 是否稳定、文字是否越出安全区、角标是否漏、字体是否真加载、实拍帧数够不够、字幕计划有没有、成片的音视频流与时长、封面确切尺寸。

退出码：**0 干净 / 1 有必须修的 / 2 只有需要你自己看的**。`out/preflight.json` 里分 `blocking_errors` / `warnings` / `review_required` / `evidence`。

**程序查完不等于片子对。** 它只证明"没有 `.pol-*` 元素"，不证明"这句话没歪曲原话"。

### 2. 自己审一遍（写 `out/review.json`）

按 `references/self-review.md` 的复核卡：先文案（原话归属、数字范围、因果动机、对方反驳），再画面（字压脸、抠像残片、台标、空场、版式重复），最后承诺（封面答应的事片子做到了吗）。

```json
{
  "input_hash": "<preflight 报的 hash>",
  "covers": {
    "visual_check": ["逐镜看过 sheet：第 1 镜……；全片无 .pol-* 元素"],
    "semantic_check": ["c1 对逐字稿第 19 条：……"],
    "caption_check": ["56 条按完整短语断句，人名未被切断"]
  }
}
```

**`covers` 每一项要有实际文字证据**——`true`、`{}`、空数组都不算。预检核对 `input_hash`：画面或素材改过就会说 `review_stale`，得重看。

### 什么情况停下来

同一类错误改三轮还在：停下，把证据、试过的修法、缺什么资源写出来，不要整片重渲。

**不改用户选的立场/情绪，不为了过检查偷偷加角标，不谎称验过。**

## 常用命令

```powershell
node scripts/new_film.mjs <片子目录> --politics          # 建时政片子：5 镜起点 + editorial.json + 本地虚构材料
node scripts/new_film.mjs <片子目录> --region taiwan     # 港台本地版：繁体正文 + zh-TW 男声 + 无角标
node scripts/new_film.mjs <片子目录> --region hongkong   # 港台本地版：书面粤语 + zh-HK 男声 + 无角标
node scripts/timeline_stub.mjs <片子>/script.json        # 没配音时先估时间线
python scripts/temp_voice.py <片子>/script.json          # edge-tts 临时配音 + 逐字时间线（用 script.json 里的 voice）
python scripts/cutout.py <图> <out.png>                  # 人物抠像（封面大头用）
python scripts/check_editorial.py <片子>/editorial.json  # 事实底稿：0 过 / 1 停 / 2 看提醒
node scripts/render.mjs --dir <片子> --check-policy politics --check   # 镜头表（时政策略）
node scripts/render.mjs --dir <片子> --check-policy politics --sheet   # 每镜三帧
node scripts/render.mjs --dir <片子> --cover             # 封面 1280×720
node scripts/render.mjs --dir <片子> --cover --cover-h 1080             # 封面 1920×1080
node scripts/render.mjs --dir <片子> --check-policy politics --video --h 720
python scripts/mix.py <片子> --check
```

`--politics` 建出来的起点是**虚构样例**（可离线跑通）：换成真实题材时，把 `editorial.json` 的 `content_mode` 改成 `factual`、删掉 `film.js` 里的 `K.politics.fiction(...)`、`sources` 换成真实来源。
`--region` 建出来的起点是**真实题材脚手架**：正文已经是繁体/粤语，`sources` 是空的——`check_editorial` 会警告"还没填来源"，填完才算数。

老片子加时政能力用 `--sync`，但它**不会**给你的 `index.html` 加 `<script src="lib/politics.js"></script>` 和 `local_native.js`，要手动加，否则新场景不可用。

`--check-policy politics` 关掉财经专属配额（真素材≥40%、滚数≤2、酒红底≤1 段、同一家公司同色），换成"证据镜要挂 sourceIds"这类实质检查。不写这个参数就是上游默认行为，财经片照旧。

## 素材：先验三条链

到新环境先花五分钟验：**网页截图**、**PDF 下载**、**视频下载**。平台和站点的可访问性会随环境、区域、时间变化，别假设上一份笔记还适用。

时政片默认走**页面截图 + PDF 原页**，不是下视频。官方录像路径在有权限的环境里可用；遇到平台人机验证就换降级路径（摘录卡、自绘图表），标清楚哪些是引用、哪些是自制。详见 `references/politics-sourcing.md`。

## 字体和本机配置

和上游一样：字体不随仓库给（清单见 README），下好放进一个目录，在 `scripts/local.json` 写 `fonts_dir`；Playwright、ffmpeg 不在默认位置时也写在这里。这个文件只放本机配置，不进仓库。

## 读哪份

| 在做什么 | 读 |
|---|---|
| 台湾用词、香港粤语、语音选择 | `references/local-language.md` |
| 封面、粗描边字幕、slam/震动/爆裂、无角标 | `references/local-native-style.md` |
| 立场、风格、情绪、粗口、标题、怎么反驳 | `references/politics-editorial.md` |
| 节目样本、出处、哪些量过哪些没量 | `references/politics-style.md` |
| 找素材、抓不到怎么办、素材降级路径 | `references/politics-sourcing.md` |
| 时政验收规则、和上游财经检查的映射 | `references/politics-rules.md` |
| 逐站产物、命令、两种口播模式 | `references/politics-production.md` |
| 上游的画风、动效原理、模板参数 | `references/thinking.md`、`motion.md`、`rules.md`、`kit/README.md` |

上游那几份是财经语境写的，**画风和动效照用，"讲一笔账"的规矩不照搬**。冲突时以 politics-rules 为准。
