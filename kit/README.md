# 模板库（kit）

**一条片 = 一张镜头表。** 每一镜选一个场景，填这一镜的内容（字、数、图、颜色、念到哪个字）。镜头怎么走、东西怎么出现、前后层、运动模糊、字号颜色，模板全管了。这样设计，是想让换什么模型来写，动效都一样稳；这一点还没实测过。

**画风的基准是成片，不是模板。** 基准是原版《AI到底有多烧钱》的每秒一帧（`examples/ai-burn-money/frames_1fps.jpg`），和用真素材手写的《谷歌给苹果的两百亿》（`examples/google-apple-20b/`）。**实拍和新闻是主角**：当事人实拍、新闻原文截图、官方发布会和广告画面；图形只用来演钱和关系。**示例片里的图全是占位图**（`assets/kit/ph/`），只为看写法；正式片里一张都不能留，必须换成真素材。

- 场景是词汇，不是镜头顺序：先想这一镜要让观众多懂什么（`says`），再在下面的「选场景」表里找意思对得上的那个。
- 每个场景的样子：`gallery/`（`00_sheet.jpg` 是 31 个场景的总览，`<场景名>.jpg` 是单张，都是示例片里截的、用的占位图）。动起来什么样：`gallery/gif/`（几段 5 秒左右的动图，见文末「文件」）。想看一镜从开头到末尾怎么变，建示例片跑 `--sheet`。
- 能跑的完整例子：`demo/film.js`（前 22 个场景各用一次）、`demo2/film.js`（后加的 11 个）。`node scripts/new_film.mjs <目录> --demo`（或 `--demo2`）建出来就能渲。
- 规则（必须守的，带编号、能检查）和"这句话 → 场景"的决策表：`references/rules.md`。为什么这么设计：`references/thinking.md`、`references/motion.md`。

## 选场景：这句话在说什么

先写这一镜的 `says`，再在下面找意思对得上的那一行。每个场景"什么时候别用、换成什么"见 `references/rules.md` 的决策表。

**数和钱**

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 一个决定性的数（金额、估值、市值） | `number` | `value` `brow`；累加时 `roll`；旁边比一个小数 `sub` |
| 一笔账：几个数一算得出结果（摊到每天、几家相加） | `equation` | `terms`（数和 `op` 交替，最后一个是结果） |
| 同一个数从多少变成多少（涨了几倍、跌了九成） | `change` | `from` `to`（`to.at`：新数出来的时刻）`mult` |
| 两到四个数排开认一认（营收、利润、市值） | `stats` | `items`（`label` `value` `at`） |
| 两三个数比高低，"差一大截" | `bars` | `bars` `gap`（`floor:false` 不要倒影） |
| 两样本该相配的东西差得离谱（估值 vs 收入） | `versus` | `items`（`tag.value` 决定圆盘面积） |
| 一串数按年变化、按年累计 | `chart` | `x` `values` `draw` `total` |
| 整体里的一部分（占比、份额） | `share` | `parts` `focus` |
| 五家以上排个队 | `ranking` | `rows` `climb` `focus` |
| 甲 vs 乙逐项比（两到四项） | `compare` | `left` `right` `rows`（`win`）`size` |

**关系和结构**

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 几家公司 / 几个人并列；谁收购谁、谁出局 | `discs` | `items`（`photo`；`at`：念到谁亮谁） |
| 钱 / 关系怎么流（谁投了谁、转了一圈） | `network` | `nodes` `links` `steps`（`link` `flow` `loop` `focus` `pop`） |
| 一件事分几步、几个条件成不成立 | `flow` | `nodes`（`pos:[列,行]`）`links` `steps`（`mark`） |
| 三到六件事按时间排 | `timeline` | `nodes`（`year` `title` `at`） |
| 国家、城市之间的事（在哪设计、在哪造、钱流向哪） | `map` | `nodes`（`lon` `lat` `label` `at`）`links` `steps` |
| 一群里拎出一个 | `cards3d` | `cards` `key` `keyAt` `text` |
| 上面都对不上，又要把几样东西放在一个世界里讲 | `board` | `nodes`（`type` 混着用）`links` `steps` `layout` |

**人**

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 这个人 = 这个数 / 这个身份 | `person` | `img`（抠像）`words` `color` `flip` `cards` `from` |
| 关键人物第一次出场：是谁、什么身份、两三件事 | `profile` | `name` `title` `img` 或 `photo` `facts` |
| 当事人的一句原话（没有能用的原声画面） | `quote` | `text` `who` `hl` |

**真画面和证据**

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 一段真画面（人、地方、产品、发布会） | `footage` | `img` 或 `clip`，`push` `focus` `badge` |
| 这件事 = 这些画面（前景钉一个东西） | `montage` | `items` `pin` |
| 两三样有画面的东西并列（芯片和数据中心） | `frames` | `items`（`label` `at`）`pin` `fill` |
| 观众可能不信的数：给出处 | `article` | `img` + `hl`（截不到用 `mock`），`zoom` `hlAt` |
| 几家各自的新闻（截图） | `desk` | `items`（`img` `at` `hl`）`all` `read` |
| 从上一镜拎出一份证据 / 一句原声 | `popup`（board 系列里用 `pop` 步骤更好） | `img`/`clip` `back` |
| 说法很多，最要紧的只有一句 | `headlines` | `items` `pick` `mark` |
| 一个 App / 网站 / AI 产品的界面 | `device` | `img` `hl` `zoom` `label` |

**结构和包装**

| 这句话在说什么 | 场景 | 最要紧的参数 |
|---|---|---|
| 片名 / 章节 | `title` | `title` `brow` `items` |
| 长片的目录、讲到第几章 | `agenda` | `items`；列目录用 `at`，回到目录用 `cur` |
| 一句判断压成金句（结尾、一段讲完收一句） | `statement` | `lines` `hl` `at` `items` |
| 开头钩子：全网都在说一个词 | `flash` | `keyword` `items` |
| 都对不上 | `custom` | `render` |

对不上就别硬塞：换一个更对得上的，或者用 `custom` 手写（手写也要写 `says`）。

## 真人口播层（`host.js`）和新场景（`scenes_plus.js`）

为什么这么设计、什么时候用哪种：`references/presenter.md`。片子的 t 就是口播的 t（`scripts/host_timeline.py` 对齐），口播帧在 `assets/clips/host/`，抠像在 `assets/cut/host/`。`film.js` 里在 `KIT.use` 之后加一行 `await KIT_HOST.use(K,{faceY:330})`（她脸的中心在原片里的 y，圆窗、竖窗按它裁）。

| 她在哪 | 写法 | 例子（《打仗黄金反而跌》） |
|---|---|---|
| 房间全屏，景别跳 | `{scene:'host', zoom:[{at, s, x}]}`：`s` 放大（≤1.35，720p 原片 ≤1.2），`x` 往左(+)右(-)让位 | `zoom:[{at:0,s:1.16},{at:'@b01:黄',s:1}]` 近景开口，说到"黄金"跳中景 |
| 东西挂在她身后的墙上 | `items:[{at, img/clip/html 或 value+vlabel, label, x, y, w, h, out, gray, no, fill}]`，坐标是原片里墙上空地的中心，挨着她的头发放 | `{img:'assets/img/goldbars.jpg', label:'黄金', x:1490, y:300, w:560, h:376, at:'@b01:黄'}` |
| 墙上照片推满屏变成实拍 | 那张的 `fill:{clip:'smoke'}`（这一镜最后 0.5 秒）；下一镜 `{scene:'footage', clip:'smoke', from:.5, host:'pip', pipIn:'fade'}` | "乱世" → 真的战火 |
| 身后换世界 | `swap:{at, words:['利','率'], brow, en, color, size, gap, top}`：房间换成织物舞台，巨字夹在她和底之间；墙上的东西跟房间一起没了 | `swap:{at:'@b05:问+0.1', words:['利','率'], brow:'问题出在', en:'INTEREST RATES'}` |
| 角上圆窗 | 任何场景加 `host:'pip'`（上一镜是房间：她缩进去；上一镜已经是圆窗：不动；`pipIn:'fade'` 淡入） | 战火、金价图、两篇原文、纽交所 |
| 竖窗 + 图形板 | 任何场景加 `host:'window'`：这一镜的画面缩进左边的板子（16:9），她在右边竖窗 | 因果链、美联储主席 |
| 回到房间 | `{scene:'host', enter:'grow'}`（框长回全屏，框里就是这一镜的样子）或 `enter:'drop'`（上一镜往下掉） | 每段证据讲完 |

`--check` 多查一条：没有她的画面连着超过 4.5 秒会提醒。

**line：一条真实的走势（日线）** `{scene:'line', data:{points:[['2025-09-02',3592.2],…]}, title, en, draw:{at,until}, marks:[{at, date:'max'|'last'|'2026-01-29', text, value}], level:{at, text}, focus:{at, from, value, brow}}`
- 开场先贴近线的起点，边画边拉远看整年（`intro:'none'` 不要）；`level` 从最后一个点往回拉虚线，停在上一次这么低的那天（= "一年多来最低"）；`focus` 推到最近一段，线变红，虚线下面立大数。
- 数据要有出处（《打仗黄金反而跌》用的是 Yahoo Finance GC=F 日收盘，写进 brief）。

**chain：一条因果链** `{scene:'chain', items:[{at, title, img 或 value, color, sub}]}`
- 3–4 张竖卡一字排开，念到哪张亮哪张，箭头跟着画出来；镜头只慢推，适合放进 `host:'window'` 的板子里（一句话里连着说三四环，镜头追着跑会糊）。

## 镜头表怎么写

```js
await K.film([
 {scene:'number', until:'@b03', says:'四家加起来一年砸七千多亿', value:'$7250亿', brow:'四家 · 2026 AI 资本开支'},
 {scene:'discs',  until:'@b05', says:'砸钱的是这四家', items:[...]},
 {scene:'title',  says:'片名', title:'AI到底有多烧钱'},     // 最后一镜不写 until = 到片尾
]);
```

每一镜都有的四个字段：

| 字段 | 写什么 |
|---|---|
| `scene` | 场景名（上表） |
| `until` | 这一镜到哪一刻结束。一般写下一句开口 `'@b05'`，或念到某个词 `'@b05:英伟达'`。下一镜从这里开始，不会有空档 |
| `says` | 这一镜让观众多懂了什么（一句话）。说不出来，就是这一镜还没想清楚 |
| `enter` | 可选，这一镜怎么接上一镜，见下面「接法」。不写 = 直接切 |

### 时刻一律写成字符串

| 写法 | 意思 |
|---|---|
| `'@b05'` | 句子 b05 开口 |
| `'@b05:英伟达'` | b05 念到「英伟达」 |
| `'@b05:英伟达#2'` | 第二次念到 |
| `'@b05:END'` | b05 说完 |
| `'@b05:英伟达+0.3'` | 念到以后再过 0.3 秒（可以是负数） |
| `'@bite_b10'` / `'@bite_b10:END'` | b10 后面插的原声开始 / 结束 |
| `'@title'` / `'@title:END'` | script.json 里留的片名时间 |

词要和 script.json 里的原文一字不差（标点不算）。写错了 `--check` 会直接告诉你哪一镜、哪个词、原句是什么。

### 接法（enter）：先问"带过去的是什么"

| enter | 说的是 | 什么时候用 |
|---|---|---|
| `'cut'`（默认） | 直接切 | 大多数时候 |
| `'flat'` | 上一镜讲完了，倒成桌面当底，新东西站在上面 | 新闻、原文、圆盘讲完 → 立起一个数（`number`）或一张图表（`chart`，图表从桌面上立起来） |
| `'push'` / `'push-right'` | 横推换人：换一个人来说 | `person` → `person`。`push` 往左推走，`push-right` 往右 |
| `'through'` | 推过镜头：冲进下一个世界 | 换舞台、又没有东西能带过去。`throughAt:[x,y]` 对准要冲进去的那个东西（上一镜画面上的坐标），`throughScale` 放大到几倍（默认 1.6） |
| `'blur'` | 上一镜虚化当底 | 两个世界之间，没有能带过去的东西 |
| `'whip'` / `'whip-left'` | 新画面甩进来盖住上一镜 | 又来了一样东西。`whip` 从右边甩进来，`whip-left` 从左边 |
| `'fade'` | 0.3 秒叠化 | 少用 |

- 同一种接法不要连着用；能"带过"同一个东西时（同一个数、同一个人、同一个画框）优先带过，比任何转场都好。
- `flat` 只接"一个东西立在中间"的场景：`number`、`chart`、`equation`、`change`、`stats`，和不带 `items` 的 `title`、`statement`（原版和谷歌那条只用过 `number`、`chart`）。别的场景铺满画面，会和倒下去的上一镜叠在一起，写了 `--check` 会提醒，改成 `cut` 或 `blur`。

### 颜色和底色

底只有一张很细的斜纹深蓝织物（模板库的 `assets/fabric.jpg`，`assets/make.py` 生成；中间略亮、四周压暗）。原版和谷歌那条从头到尾都是它；颜色只在当事人身后出现。

`tone`（舞台底色）只有三个。有色底也是同一张织物染色，不是平涂渐变：

| tone | 什么时候 |
|---|---|
| `navy`（默认） | 几乎所有镜头 |
| `charcoal` | 中性的炭灰 |
| `wine` | 压暗、低饱和的酒红：只给"算总账 / 亏钱"那一段（原版柱子那段就是酒红底）。**一条片最多一段** |

写别的（purple blue teal green gold red……）会按 navy 画，`--check` 提醒。所有场景不写 `tone` 都是 navy，一般不用写。

- `glow`（颜色光）：默认关。只有 `person` 默认开：当事人身后是品牌色染的织物，中间一团品牌色光（谷歌那条：皮查伊身后一片谷歌蓝 + 一团蓝光），颜色跟着它的 `color`。其他场景不写 `glow`：写了照样画，但 `--check` 会提醒。
- `color`：公司名直接写（`'nvidia'` `'英伟达'` `'openai'` `'google'` `'microsoft'` `'amazon'` `'meta'` `'oracle'` `'apple'` `'tesla'` `'tsmc'` `'alibaba'` `'tencent'` `'bytedance'` `'huawei'`……），或颜色名 `blue sky steel navy amber orange gold green lime teal cyan brick red wine purple violet pink gray slate black`，或 `'#2f6bd1'`。颜色名只用来给圆盘、柱子、卡片上色，不当整屏底色。
  - **同一家公司全片同一个颜色**：每一镜都写同一个值，最好就写公司名。不要这一镜写 `'google'`、下一镜写 `'blue'`。人用他公司的颜色（皮查伊写 `color:'google'`）。`--check` 按名字认（圆盘的 `name`、卡片和表头的 `title`、`quote` 的 `who.name`、`profile` 的 `name`），同一个名字在不同镜里颜色不一样就提醒，所以同一家公司每镜的名字也写成一样。
  - 两家撞色又要同框（谷歌和 Meta 都是蓝，甲骨文和台积电都是砖红）：给其中一家定一个颜色名（比如 Meta 写 `'sky'`），全片每一镜都写这个。
- 不要：整屏紫、青、金底；大团彩色光；前景浮尘（`K.dust` 已经停用，写了会提醒）。

## 世界舞台：board 系列（discs / versus / network / flow / timeline / map / board）

东西摆在一个世界里，**念到谁，镜头去找谁；状态在原地变**（变灰、打勾、连线亮起、嵌套）。镜头机位模板自己算，不用写坐标。`board` 是不带预设的那一个：节点类型混着用（圆盘 + 大数字 + 画框），`layout` 自己选。

### 节点 nodes（discs、versus 里叫 items）

```js
{id:'nvda', name:'英伟达', color:'nvidia', photo:'assets/img/nvidia_hq.jpg', tag:{label:'市值', value:'$5.2万亿'}, at:'@b06:英伟达'}
```

| 字段 | 写什么 |
|---|---|
| `id` | 节点的名字（连线、步骤里用） |
| `type` | `disc` 圆盘（discs/network 默认）· `card` 卡片（flow 默认）· `num` 大数字 · `pill` 小金额牌 · `img` 画框 · `label` 一个短标签 · `pin` 地图上的点（map 默认）· `area` 地图上一团光（标一个区域）· `event` 时间线的一年（timeline 默认） |
| `name` | 中文名，压在盘上或盘下 |
| `photo` | 铺满圆盘的照片：当事人照片、公司大楼、产品图标（优先用；原版和谷歌那条的圆盘都是照片）。`pos` 调照片在盘里的位置（CSS 的 object-position，比如 `'50% 20%'` 让脸往上） |
| `logo` | 没有照片时，盘里放一张白色单色的 logo 图。都没有就只写 `name`：品牌色实心盘 + 名字 |
| `lt` | 旧写法，不再画字母 logo（厚玻璃 + 字母 logo 有 PPT 味）；只在没写 `name` 时当名字用 |
| `en` | 一行英文小字。圆盘、节点、卡片上不写（英文小字只跟着眉题和片名，见 `rules.md`；写了 `--check` 会提醒） |
| `tag` | 圆盘下面的价签 `{label:'估值', value:'$8520亿'}` |
| `title` `value` `img` `flag` | 卡片的标题、金额、底图、小旗 |
| `at` | 念到它的时候：出现 + 亮起（discs 只亮不动镜头，network/flow/timeline/map 镜头会去找它） |
| `pos:[列,行]` | flow 里按格子摆（`[0,0]` `[1,0]` `[1,1]`……），间距自动 |
| `lon` `lat` | 地图上的经纬度（map 里用） |
| `x` `y` | 想自己摆就写世界坐标（1920×1080 为准，可以超出），一般不用 |

### 连线 links

```js
{from:'nvda', to:'oai', text:'投资', color:'green'}     // id 自动是 'nvda>oai'
```
`style`：`'dots'`（默认，圆点虚线，一直在流）`'dash'` `'solid'`；`curve`：弯曲（0.15 左右）；`arrow:false` 不要箭头。

### 步骤 steps：每一步写念到哪个字、发生什么

```js
steps:[
 {at:'@b11:投钱', link:'nvda>oai', focus:['nvda','oai']},
 {at:'@b11:投钱+0.5', pop:{img:'assets/img/cnbc.jpg', from:'nvda>oai', back:'@b11:花钱'}},
 {at:'@b12:转了一圈', focus:'all', loop:['nvda>oai','oai>orcl','orcl>nvda']},
 {at:'@b12:英伟达', focus:'nvda'},
]
```

| 动作 | 意思 |
|---|---|
| `focus: id / [ids] / 'all'` | 镜头去找它们，它们亮着、其余压暗（看这个 / 看整体） |
| `light: id / [ids] / 'all'` | 只是亮起，镜头不动（一口气念几家的时候用） |
| `show: id / [ids]` | 出现（淡入），镜头放宽到看得见所有东西 |
| `gray: id` / `color: id` | 变灰（出局、不讲了）/ 恢复颜色 |
| `hide: id` | 淡出 |
| `mark: {id:'ok'}` / `{id:'no'}` | 打勾 / 打叉（成立 / 不成立） |
| `link: 连线id` | 这条线画出来 |
| `flow: 连线id` | 这条线变亮、流得更快（钱在走） |
| `loop: [连线id...]` | 一个亮点按顺序沿这几条线跑一圈（"转了一圈"） |
| `nest: [里面的id, 外面的id]` | 小盘被大盘套住（收购） |
| `tag: {id:'$687亿'}` | 换掉圆盘下面价签的数 |
| `roll: {id, from:'$0', until:'@b05:七千'}` | `num` 节点从 from 滚到它的 value |
| `pop: {img/clip, from:节点或连线id, back:'@...'}` | 从这个节点/连线撑开一张证据小卡，到 back 缩回去，舞台不离场 |
| `cam: {s:1.2}` | 手动改机位（一般不用） |

其他参数：`layout`（`'row'` 一排 · `'ring'` 一圈 · `'hub'` 第一个在中间 · `'grid'` 按 pos · `'line'` 时间线 · `'free'` 按 x,y）；`pre`（`'gray'` 先灰着占位、念到才上色——discs/flow/network/timeline 默认；`'hide'` 念到才出现——board、map 默认）；`brow`（整张图上面一行眉题；写了它，`num` 节点就别再写自己的 `brow`）；`scale:'area'`（圆盘面积按数值算，versus 默认）；`under`（世界里垫一张图，比如地图：`{img, x, y, w, h}`，再用 `pin` 节点标点）。开场"先看一个往里推、先看整体往外拉"、慢漂、景深、运动模糊都是自动的。

## 各场景：数和钱

下面每个场景：说的是什么、什么时候别用、参数、例子。例子来自 `demo/film.js` 和 `demo2/film.js`（`PH` = `'assets/kit/ph/'`，占位图），建出示例片就能跑；写 `assets/img/…` 的是你自己的素材路径。参数的完整说明也写在 `scenes.js` 每个场景的 `help` 里。

### number：一个决定性的数　`gallery/number.jpg`
- 说的是：这句话的落点就是一个数（带单位、对象、年份）。金色渐变的大数字，中文单位用数黑体，上面一行字距拉开的小号眉题。
- 别用：一句话要比两三个数（用 `bars`/`stats`）；数后面马上要拆构成（用 board 系列）。
- 参数：`value`（必填，`'$7250亿'` `'5.2万亿'` `'-2780亿'` `'30%'`）`brow`（眉题："谁 · 什么"，14 个字宽以内）`en`（眉题下面一行英文，可省）`roll:{from, at, stop}` `full`（满位数，滚数时默认）`sub:{label, value, at}`（旁边冒一张小卡对比，大数退一步）`color:'gold'`（默认）`|'red'`（亏损）`|'white'` `tone`。
```js
{scene:'number', until:'@title', enter:'flat', says:'四家加起来一年 7250 亿',
 value:'$7250亿', brow:'四家 · 2026 AI 资本开支', en:'BIG FOUR · AI CAPEX 2026',
 roll:{from:'$1800亿', at:'@d02:加起来', stop:'@d02:七千'}}
```
滚数只在"加起来、累计"本身就是意思的时候用，一条片最多两次；从第一笔开始滚，话说到那个数正好停。前面的东西讲完了还要留作底，就写 `enter:'flat'`：上一镜倒成桌面，数从下面立起来（原版"四家加起来"、谷歌那条"两百亿"都是这样）。

### equation：算一笔账　`gallery/equation.jpg`
- 说的是：几个数和运算符一项项出来，最后的结果用金色、大一号，下面画一道线。"一年七千二百五十亿，摊到每天将近二十亿"这种换算；"三家加起来"。
- 别用：超过 5 项（拆成两步算）；结果不是这句话的落点（用 `number`）。
- 参数：`terms`（必填）：数和运算符交替，数写 `{value, label, at}`，运算符写 `{op:'÷'}`（`+ − × ÷ = ≈`）；最后一个数是结果。`brow` `en`（眉题，左对齐在第一项上方）`size`（默认 200，太宽会自动缩）。
- 什么时候出来：第一项不写 `at`，一开场就在（第一帧不空）；后面的数写 `at`，念到再出来；运算符不用写 `at`，跟着它后面那个数一起出来。每出来一项，镜头往外让一点去找它。
```js
{scene:'equation', until:'@e01', says:'一年七千多亿，摊到每天将近二十亿',
 brow:'四家 · 2026 AI 资本开支', en:'BIG FOUR · AI CAPEX',
 terms:[{value:'$7250亿', label:'一年'}, {op:'÷'}, {value:'365', label:'天', at:'@e00:每一天'}, {op:'≈'}, {value:'$20亿', label:'每天', at:'@e00:将近'}]}
```
结果要自己算对（7250 亿 ÷ 365 ≈ 19.9 亿），约数用 `≈`。

### change：从多少变成多少　`gallery/change.jpg`
- 说的是：同一个数从多少变成多少：左边旧的（白，箭头画过去时压暗），箭头画过去，右边新的（金色、大三成），箭头上写涨了几倍。镜头先只看旧的数，新数出来前往右让开、拉到看全。
- 别用：中间还有好几个阶段（用 `chart` 或 `timeline`）；两个数不是同一样东西（用 `bars` 或 `versus`）。
- 参数：`from:{value, label}`、`to:{value, label, at}`（必填；`to.at` 是新数出来的时刻，不写就开场后 1 秒左右）`mult`（箭头上的倍数，`'×1.7'`，可省）`color:'gold'`（涨，默认）`|'red'`（跌）`brow` `en` `size`（旧数的字号，默认 190）。
```js
{scene:'change', until:'@e06', enter:'blur', says:'两年里英伟达市值涨了七成多',
 brow:'英伟达 · 市值', en:'NVIDIA · MARKET CAP',
 from:{value:'$3万亿', label:'2024 年'}, to:{value:'$5.2万亿', label:'2026 年', at:'@e05:五万'}, mult:'×1.7'}
```
`mult` 自己算对（5.2 ÷ 3 ≈ 1.7）；跌的写 `color:'red'`，倍数写成 `'-90%'` 这类。

### stats：几个数一字排开　`gallery/stats.jpg`
- 说的是：两到四个数一字排开，每个数上面一行小字说它是什么。小字一开场就在（先暗着，观众先知道要看哪几样），数念到才出来，镜头往念到的那个偏一点。
- 别用：要比大小（用 `bars`，高度一眼可见）；只有一个数（用 `number`）；超过 4 个。
- 参数：`items:[{label, value, at}]`（必填，2–4 个）`brow` `light:true`（念到哪个只亮哪个，其余压暗；默认念过的都亮着）`color`（数的颜色，默认金）`size`（默认 150，自动缩到放得下）。每一项写了 `photo`（或 `logo`、`lt`：盘里一两个字）再加 `color`，就在数上面放一个品牌色小圆盘。
```js
{scene:'stats', until:'@e07', says:'投入、估值、市值放在一起看',
 items:[{label:'四家一年投入', value:'$7250亿', at:'@e06:四家'}, {label:'OpenAI 估值', value:'$8520亿', at:'@e06:OpenAI'}, {label:'英伟达市值', value:'$5.2万亿', at:'@e06:英伟达'}]}
```

### bars：柱子对比（低机位）　`gallery/bars.jpg`
- 说的是：两三个数按真实高度立成柱子，柱子占满画面高度。深蓝织物底，低机位、略带透视，柱子站在地面上（有倒影和地面一抹光），柱顶是金色的数。不写 `at` 的柱子一开场就立着（镜头看全）；写了 `at` 的念到才长，长的时候镜头跟着往上。"差一大截"时镜头沿着差的那一段往上抬，括号跟着画出来。
- 别用：超过 5 根（用 `ranking`）；差距小到看不出来。
- 参数：`bars:[{label, value, color, at}]`（必填；`value` 是柱顶写的字，高度按它的数；写 `'?'` 的要给 `n`：估一个高度用的数）`gap:{at, a, b, text}`（从矮柱顶到高柱顶画括号，镜头沿着它抬）`tone` `floor:false`（不要地面的倒影和光）。尺寸一般不用改：`barH`（最高那根多高，默认 500）`barW`（柱宽，默认 220）`barGap`（柱间距，按根数自动 200–320）。
- 算总账、亏钱那一段要压一压气氛：写 `tone:'wine'`（原版柱子那段就是酒红底）。一条片最多一段。
```js
{scene:'bars', until:'@d15', says:'投入和回报差一大截',
 bars:[{label:'每年砸进去', value:'$7250亿', color:'red', at:'@d14:砸进去'}, {label:'收回来的', value:'?', n:900, color:'slate', at:'@d14:收回来'}],
 gap:{at:'@d14:差着', a:1, b:0, text:'差一大截'}}
```

### versus：按真实比例的反差　`gallery/versus.jpg`
- 说的是：两样本该相配的东西并排，小的小到几乎看不见。圆盘面积按 `tag.value` 的数算。
- 别用：差别不大（看不出来就别比）；要读出具体差多少（用 `bars`）。
```js
{scene:'versus', until:'@d06', says:'OpenAI 估值很高，收入很小',
 items:[{id:'val', name:'估值', color:'openai', tag:{label:'OpenAI 估值', value:'$8520亿'}},
        {id:'rev', name:'收入', color:'openai', tag:{label:'今年收入', value:'$360亿'}, at:'@d05:收入'}]}
```

### chart：白底图表　`gallery/chart.jpg`
- 说的是：一条趋势画在白底图表卡上（原版就是白底卡，略带透视），线跟着话画出来，累计数跟着线滚。
- 别用：只有一个数（用 `number`）；两三个数比大小（用 `bars`，更有冲击力）。
```js
{scene:'chart', until:'@d07', enter:'flat', says:'到 2030 年累计要亏 2780 亿',
 title:'OpenAI 累计净烧钱（示意）', x:['2026','2027','2028','2029','2030'], values:[-120,-380,-860,-1600,-2780], unit:'亿',
 draw:{at:'@d06:净烧', until:'@d06:两千七百'}, total:{label:'累计净烧', from:'$0', to:'-$2780亿'}}
```
`kind:'line'|'area'|'bar'`，`color`（亏损默认红），`mark:[{at, i, text}]`。数据要有出处；示意的要在标题里写"示意"。`total` 跟着线滚，也算一次滚数（一条片最多两次，`--check` 连它一起数）。接 `enter:'flat'` 时，图表卡从倒下去的上一镜上立起来（原版"原文倒成桌面、图表立起来"）。

### share：占比　`gallery/share.jpg`
- 说的是：整体里的一部分有多大：一个环，讲到的那一块亮起、往外推一点，中间写这一块的数。
- 别用：超过 5 块（合并成"其他"）；要比几个整体的大小（用 `versus`）。
- 参数：`parts:[{label, value, color}]`（必填，最多 5 块；`value` 是占比，加起来不用正好 100）`focus:[{at, i}]`（讲到哪一块）`center:{value, label}`（环中间的字，不写就显示讲到的那一块）`title`（环上方一行眉题）`rings:true`（环后面加一圈圈很淡的同心细线，默认没有）。

### ranking：排行榜　`gallery/ranking.jpg`
- 说的是：一排数从大到小，讲到谁谁亮。超过 5 行时镜头从末尾开始，往上走到第一名，差距由镜头走出来。
- 别用：只有两三家（用 `bars` 或 `versus`）。
- 参数：`rows:[{name, value, color}]`（必填，从大到小排好）`title` `climb`（镜头从末尾往上走到第一名的时刻）`focus:[{at, i}]`（从 0 开始）。

### compare：两边逐项对比　`gallery/compare.jpg`
- 说的是：左右两栏各一个表头（公司、国家、时代），中间一个 VS，一行行比下去：赢的那边变金色、打勾，输的那边压暗。
- 别用：超过 4 行（挑最要紧的）；只比一项（用 `versus` 或 `bars`）；要看出差多少（用 `bars`）。
- 参数：`left:{title, color}`、`right:{title, color}`（必填，表头；`color` 写公司名）`rows:[{label, left, right, win, at}]`（必填；`win` 写 `'left'` 或 `'right'`，不写就不分输赢；不写 `at` 就开场后一行行自己出来）`brow`（表头上面一行眉题）`size`（数字字号，默认 110）。超过 4 行 `--check` 提醒。
```js
{scene:'compare', until:'@e08', enter:'whip', says:'甲赚得多，乙长得快（示例数据）',
 brow:'示例数据 · 不是真实公司',
 left:{title:'公司甲', color:'green'}, right:{title:'公司乙', color:'red'},
 rows:[{label:'营收', left:'$600亿', right:'$250亿', win:'left', at:'@e07:营收'},
  {label:'利润率', left:'55%', right:'10%', win:'left', at:'@e07:利润率'},
  {label:'增速', left:'20%', right:'60%', win:'right', at:'@e07:增速'}]}
```

## 各场景：关系和结构

### discs：几家公司 / 几个人并列　`gallery/discs.jpg`
- 说的是：一家一个照片圆盘：品牌色的圆，照片铺满盘（底部压一层品牌色），名字压在盘上或盘下，细亮边加投影。先灰着占位，念到谁亮谁；收购 = 嵌套（`nest`），出局 = 变灰（`gray`）。
- 别用：它们之间有流向（用 `network`）。
- 照片：公司用认得出的大楼、门店、产品图标，人用他的照片（谷歌那条：谷歌大楼 + Safari 图标两个盘）。没有照片就给一张白色单色 logo 图（`logo`），再没有就只写 `name`：品牌色实心盘 + 名字。
```js
{scene:'discs', until:'@d02', says:'砸钱的是这四家',
 items:[{id:'goog', name:'谷歌', color:'google', photo:'assets/img/google.jpg', at:'@d01:谷歌'},
        {id:'msft', name:'微软', color:'microsoft', photo:'assets/img/microsoft.jpg', at:'@d01:微软'}, ...],
 steps:[{at:'@d01:这四家', light:'all'}]}
```
`photo` 换成你自己的图。示例片里这一镜没有照片，是品牌色实心盘 + 名字。

### network：关系网 / 资金循环　`gallery/network.jpg`
- 说的是：节点之间的流向。钱流到哪镜头跟到哪，"转了一圈"有亮点跑一圈；中间可以弹出一张证据小卡（`pop`），舞台不离场。
- 别用：没有方向的并列（用 `discs`）。
- 例子见上面「步骤」；完整的在 `demo/film.js` 第 11 镜（三个照片圆盘用的是 `face_a/b/c.jpg` 占位头像）。节点默认是照片圆盘，写法同 `discs`。

### flow：流程 / 条件　`gallery/flow.jpg`
- 说的是：卡片和虚线箭头，一步步亮起，对的打勾、错的打叉，最后不确定的那一环变灰。
- 别用：只是并列几样东西（用 `discs`）；按时间先后（用 `timeline`）。
```js
{scene:'flow', until:'@d16', says:'链条的最后一环还不知道',
 nodes:[{id:'c1', title:'算力', color:'steel', pos:[0,0], at:'@d15:算力'}, ...,
        {id:'c4', title:'收回钱', color:'red', pos:[3,0], at:'@d15:赚回来'}],
 links:[{from:'c1',to:'c2'},{from:'c2',to:'c3'},{from:'c3',to:'c4'}],
 steps:[{at:'@d15:训出', mark:{c1:'ok'}}, {at:'@d15:没人知道', focus:'c4', gray:'c4'}]}
```

### timeline：时间线　`gallery/timeline.jpg`
- 说的是：年份排在一条光轴上，念到哪年镜头推到哪年。三到六个点最好。
- 别用：只有两个时间点（用 `change` 或 `bars`）。
```js
{scene:'timeline', until:'@d11', says:'三年里钱越砸越多',
 nodes:[{id:'y22', year:'2022', title:'ChatGPT 上线', color:'openai', at:'@d10:二〇二二'}, ...]}
```

### map：示意地图　`gallery/map.jpg`
- 说的是：点阵世界地图（只有陆地、不画国界），按经纬度标点、画航线。念到哪里，镜头飞到哪里；隔得远会先拉远再推近，像地图软件里"飞过去"。
- 别用：要精确的国界（在中国平台发的地图要合规：用标准地图服务 bzdt.ch.mnr.gov.cn 的底图，放进 `board` 的 `under`）；只是"这家公司在美国"（一句话的事，不用地图）。
- 参数：和 board 系列一样（`nodes` `links` `steps`）。节点写 `lon` `lat`（经纬度）、`label`（中文地名）、`at`；`type:'area'` 加 `r` 是一团光（标一个区域，比如中东）。连线默认是弯的金色虚线。节点默认念到才出现，底图一开场就在，第一帧不空。
- 一镜里要让观众看到一次全貌：最后一个地方出现的那一步写 `show` + `focus:'all'`（出现，同时镜头拉到看全），不要等这一镜快结束了才拉全。
```js
{scene:'map', until:'@e03:创始人', enter:'through', says:'一颗芯片要跨三个地方才造得出来',
 nodes:[
  {id:'ca', lon:-121.96, lat:37.35, label:'加州 · 设计', at:'@e02:加州'},
  {id:'hc', lon:120.97, lat:24.8, label:'新竹 · 制造', at:'@e02:新竹'},
  {id:'nl', lon:5.4, lat:51.41, label:'荷兰 · 光刻机'},
 ],
 links:[{from:'ca', to:'hc', text:'设计图'}, {from:'nl', to:'hc', text:'光刻机'}],
 steps:[{at:'@e02:新竹', link:'ca>hc'}, {at:'@e02:荷兰', show:'nl', link:'nl>hc', focus:'all'}, {at:'@e03', focus:'ca'}]}
```
念到"荷兰"时它出现、线画出来、镜头拉到看全三个地方；下一句"设计它的公司"飞回加州，下一镜从"创始人"接上。地点做什么写进 `label`（"加州 · 设计"），不写 `en`。

### cards3d：一群里拎出一个　`gallery/cards3d.jpg`
- 说的是：一组并列的东西（几个国家、几家机构）平铺成一排排卡片（4–9 张，每排最多 4 张）。念到 `keyAt`，主角那张放大、往前移，其余压暗、退到远一层；`text` 再在上面压一句大字。名字里的"3D"是旧叫法，现在是平的。
- 别用：只有两三样（用 `discs`）；不需要拎出主角（用 `discs` 一排）。少于 3 张、多于 9 张 `--check` 提醒。
- 参数：`cards:[{title, color, flag, value}]`（必填）`key`（主角序号，从 0 开始）`keyAt`（拎出主角的时刻）`text:{zh, at}`。卡片颜色不写就是统一的深色，主角亮起来才显眼；别每张一个颜色。
```js
{scene:'cards3d', until:'@d13', says:'各国都在砸钱，最大的是美国',
 cards:[{title:'美国'}, {title:'欧盟'}, {title:'日本'}, {title:'英国'}, {title:'法国'}, {title:'德国'}, {title:'韩国'}, {title:'印度'}],
 key:0, keyAt:'@d12:还是', text:{zh:'出手最大', at:'@d12:美国'}}
```

## 各场景：人

### person：人站在巨字前面　`gallery/person.jpg`
- 说的是：这个人 = 这个词。当事人的抠像站在两组巨字前面（字在人和底之间）；身后是品牌色染的织物，中间一团品牌色光（谷歌那条：皮查伊身后一片谷歌蓝，头两侧"36 | %"）。全片的颜色光只给这里。
- 要素材：人像抠图（透明 PNG，`scripts/matte.py` 从实拍抠，或者从高清照片抠）。模板会自己量出头在哪，把人放在中间、字分在头两侧。
- 参数：`img`（必填）`words:['5.2','万亿']`（两组，每组 1–4 个字）`color`（他公司的颜色：身后染色的织物、那团光、巨字的渐变都跟着它）`brow` `flip:[{at, words}]`（同一个人换一个说法）`cards:[{at, label, value}]`（他说到的小数在肩旁冒出来，巨字退一步）`from:{img, at}`（人身后换背景：先放原照片，at 那一刻换成舞台 + 巨字；抠图和原照片要同尺寸）`glow:false`（不要那团光，只留染色的织物）`tone`（写了 navy/charcoal/wine 就不染品牌色，用这个底）`h` `top`。
- 别用：只有照片没有抠图（用 `profile` 的 `photo`，或者 `discs` 的照片圆盘）。
```js
{scene:'person', until:'@d05', says:'英伟达 = 全球市值第一',
 img:'assets/cut/jensen.png', color:'nvidia', words:['5.2','万亿'], brow:'英伟达 · 市值',
 flip:[{at:'@d04:全世界', words:['全球','第一']}]}
```
换下一个人用 `enter:'push'`（横推换人）。

### profile：人物第一次出场　`gallery/profile.jpg`
- 说的是：一个关键人物第一次出现：左边是他的抠像（或照片圆盘；都没有就是品牌色实心盘 + 全名），右边名字、英文名、身份，两三条要紧的事一条条冒出来。
- 别用：这个人只出现一次、不重要（一句话带过）；已经出场过（之后用 `discs` 的照片圆盘，或者 `person`）。
- 参数：`name`（必填）`title`（身份：`'英伟达创始人、CEO'`，按片子发布那天查过再写）`img`（人像抠图，透明 PNG）或 `photo`（照片，放进圆盘）`color`（他公司的颜色）`facts:[{text, at}]`（最多 3 条，每条 16 字以内；不写 `at` 就一条条自己冒）`tag:{label, value}`（名字下面一个价签，比如身家）`en`（英文名）。
```js
{scene:'profile', until:'@e04', says:'英伟达的创始人黄仁勋：从游戏显卡做起，干了三十多年',
 name:'黄仁勋', en:'Jensen Huang', title:'英伟达创始人、CEO', img:PH+'person.png', color:'nvidia',
 facts:[{text:'1993 年和两位朋友创立英伟达', at:'@e03:一九九三'}, {text:'从游戏显卡做起', at:'@e03:游戏显卡'}, {text:'当了三十多年 CEO', at:'@e03:三十多年'}]}
```

### quote：当事人的原话　`gallery/quote.jpg`
- 说的是：左边他的照片圆盘（名字、身份写在盘下），右边一句中文原话，关键几个字刷金；下面可以有一行英文原文和出处。
- 别用：有原声画面（用 `footage` 放原声更真，前面一句做铺垫）；话太长（压到 30 字以内，超过 36 字 `--check` 提醒）。
- 参数：`text`（必填，中文原话）`who:{name, title, photo, color}`（没有 `photo` 就是品牌色实心盘 + 名字）`hl`（要刷金的那几个字，必须原样出现在 `text` 里，不然报错）`hlAt`（刷金的时刻，默认这一镜过了一半）`orig`（英文原文，可省）`source`（出处一短句，可省）。
- 原话要查得到出处，翻译不改意思。`orig` 是一行英文小字（一帧的英文小字最多这一行），`source` 写一短句（"谁 · 哪一场"）。
```js
{scene:'quote', until:'@e05', says:'他自己说：买得越多，省得越多',
 text:'买得越多，省得越多。', hl:'省得越多', hlAt:'@e04:省得',
 who:{name:'黄仁勋', title:'英伟达 CEO', photo:PH+'face_a.jpg', color:'nvidia'},
 orig:'The more you buy, the more you save.', source:'2023 年台北电脑展主题演讲'}
```

## 各场景：真画面和证据

### footage：全屏实拍　`gallery/footage.jpg`
- 说的是：实拍就是在讲的东西。全屏、干净、不压字，镜头朝一个点慢推。
- 别用：画面里认不出是谁、是什么（换一段有脸、logo、标题的）；想在上面加字（字只用 `person` 的巨字，或 `montage`/`title`/`statement` 退成底）。
- 参数：`img` 或 `clip`（`footage.py extract` 抽的帧序列名）`from`（从第几秒开始）`rate`（播放速度，最慢 0.8）`push:[1,1.06]`（慢推的起止倍数）`focus:[x,y]`（往哪一点推）`settle`（接 frames 推满屏）`badge:{name, color, at}`（上一镜的圆盘缩成徽章钉在左上角，底下的实拍在换）。
- 实拍至少停 1.5 秒（不到 `--check` 提醒）；画面里要认得出是谁、是什么（logo、人脸、标题）。原片烧进去的字幕和台标，抽帧时放大裁掉。

### montage：钉住一个东西，底下换实拍　`gallery/montage.jpg`
- 说的是：这件事 = 这些画面。前景钉一个视线落点（一个数、一个标题、一个圆盘），底下的实拍压暗去色，0.42 秒一换。
- 别用：前景没有视线落点（那就别快切）；底下的实拍要观众看清（用 `footage`）。
```js
{scene:'montage', until:'@d19', says:'这七千多亿 = 这些楼和芯片',
 pin:{value:'$7250亿', brow:'一年'}, items:['assets/img/dc1.jpg', 'assets/img/dc2.jpg', {clip:'site'}]}
```
`items` 至少 3 段不同的实拍（少于 3 段 `--check` 提醒）；实拍段可以写 `{clip, from, rate}`，同一段轮到第二次时接着往后放，不从头放。`step` 几秒一换，`br` `sat` 调底下的亮度和饱和（默认 0.36、0.5）。

### frames：画框并列　`gallery/frames.jpg`
- 说的是：两三样有画面的东西并列，实拍装进白边画框，念到一样甩进来一样，各带一个中文标签。`pin` 在上面钉一个数，线分到各个画框（一个数分成两路）；`fill` 把其中一个推满屏，下一镜接同一份素材的 `footage`（写 `settle:true`）。
- 别用：只有一样（用 `footage` 全屏）；超过 3 样（太碎）。
```js
{scene:'frames', until:'@d04', says:'钱的大头流向芯片和数据中心', pin:{value:'$7250亿'},
 items:[{img:'assets/img/chip.jpg', label:'芯片', at:'@d03:芯片'}, {img:'assets/img/dc.jpg', label:'数据中心', at:'@d03:数据中心'}],
 fill:{i:0, at:'@d03:END-0.1'}}
```

### article：原文出处　`gallery/article.jpg`
- 说的是：可能被质疑的数先给出处。原文截图摊在织物上（略斜、四周压暗，不是整屏白网页）：先看整页上半，认出是哪家、哪天；镜头再推向那一句，荧光笔（正片叠底的黄）从左往右刷过。
- 别用：原文要读很久（压成一句再刷）；数没核实过；有好几篇要一起看（用 `desk`）。
- 有截图：`img` + `hl`（要刷黄的框 `[x,y,w,h]`；折行就写两个：`[[…],[…]]`）。坐标：`snap_news.mjs` 打印的框（也写在 `docs/news.json` 的 `rects` 里）原样抄，它截的图是 3200 宽、框是 1600 宽的网页坐标，模板会换算；别的截图按图片像素量；对不上再写 `cssW`（hl 按多宽的网页坐标算）。
- 截不到原文：`mock:{source, date, title, body:[...], mark}`，用核实过的文字排一页通用样式：不放任何真实网站的标志和名字（`source` 写"报道""外媒报道"这类），`mark` 要原样出现在标题或正文里。
- 时刻：`zoom` 是镜头开始推向刷黄处的时刻（默认这一镜过了三成）；`hlAt` 是荧光笔刷过的时刻（默认 `zoom` 后 0.6 秒，镜头快推到位的时候）。`tilt`：截图斜几度（默认 -1.2，0 = 摆正）。
- 刷黄以后要清楚地停 1 秒以上：`until` 至少比刷黄晚 1.5 秒（刷 0.45 秒 + 停 1 秒），不够 `--check` 提醒。
```js
{scene:'article', until:'@d06:净烧', says:'亏损的数有出处',
 mock:{source:'报道', date:'2026-10-02', title:'OpenAI 预计 2030 年前累计烧钱约 2780 亿美元',
  body:['（示例排版：截不到原文时，用核实过的文字排一页通用样式，不放任何真实网站的标志。）','报道称，这家公司在算力上的投入会继续增加，收入的增长暂时追不上支出。'],
  mark:'2780 亿美元'},
 zoom:'@d06:从今年'}
```
有真截图时这样写（谷歌那条的雅虎财经截图，框是 `snap_news.mjs` 打印的"$20 billion"）：
```js
{scene:'article', until:'@b03', says:'两百亿是官司里翻出来的，有出处',
 img:'assets/docs/yahoo200.png', hl:[783.6, 139, 139.9, 34], zoom:'@b02:两百亿'}
```

### desk：新闻桌面　`gallery/desk.jpg`
- 说的是：几篇真新闻的截图摊在织物桌面上（透视，每张略斜）。念到哪篇，镜头沿桌面滑过去（0.5 秒），那篇亮起来；`all` 抬高机位看全部；`read` 念到证据时桌面抬平、推近看那一张，刷黄它的 `hl`。原版"四家各砸多少"、谷歌那条"两百亿的报道"都是它。
- 别用：截图上的字太小、看不出是哪家（换截图，或者用 `discs`）；只有一篇（用 `article`）。
- 参数：`items:[{img, at, hl, cssW}]`（必填，2–5 张，用 `snap_news.mjs` 截；`hl` 是这张上要刷黄的框，坐标和 `article` 一样）`all`（抬高看全部的时刻）`read:{i, at}`（念到证据、抬平看第 i 张，从 0 数；那张要写 `hl`）`tilt`（桌面倾角，默认 54，50–58 最像）`docW`（每张截图摊在桌上多宽，默认 1280）。截图的标题里要看得出是哪家、多少钱。
- `read` 以后要留够时间：`until` 比 `read.at` 晚 2 秒以上（抬平、刷黄，再停 1 秒），不够 `--check` 提醒。
- 讲完了还要留作底：下一镜写 `enter:'flat'`，接 `number`（金额立在倒下去的桌面上）。
```js
{scene:'desk', until:'@d17:追着问', says:'各家还在加码',
 items:[{img:PH+'news_a.jpg', at:'@d16:各家'}, {img:PH+'news_b.jpg', at:'@d16:最近', hl:[176,306,272,80]}, {img:PH+'news_c.jpg', at:'@d16:新闻'}, {img:PH+'news_d.jpg'}],
 all:'@d16:还都', read:{i:1, at:'@d16:加码'}}
```

### popup：反应窗 / 证据小卡　`gallery/popup.jpg`
- 说的是：从上一镜里拎出一份证据或一句原声：上一镜冻住压暗，从 `from:[x,y,w,h]` 撑开一个窗口到 `to`（默认 1120×630），到 `back` 缩回。
- 别用：在 board 系列里（用 `pop` 步骤，舞台不冻住）；证据要细读很久（给全屏 `footage` / `article`）；第一镜（没有上一镜可冻）。
- 原声反应梗也用它，前面一句要做铺垫（"难怪黄仁勋总爱说这句："）。
```js
{scene:'popup', until:'@d18', says:'连新闻台都在问',
 img:PH+'tv.jpg', back:'@d17:END'}
```
这一镜从上一镜（desk）的 `until` 开始，也就是念到"追着问"的时候：桌面冻住压暗，窗口撑开。

### headlines：标题墙 → 一句　`gallery/headlines.jpg`
- 说的是：各家都在说：6–12 条新闻标题平铺开（像摊开的剪报，平的，不斜、不叠；5 条以内一列，10 条以内两列，再多三列），一条条很快出来；念到 `pick` 那一刻，只亮起最要紧的那一条，其余压暗、退到远一层，镜头推近、刷黄。
- 用在：开头钩子或转折："说法很多，但有一句最要紧"。
- 别用：标题编不出真的（每条都要来自核实过的报道，外文的翻成中文）；只有两三条（用 `desk` 放真截图）。
- 参数：`items:[{src, title, date}]`（必填，6–12 条，少于 6 条 `--check` 提醒；`title` 30 字以内，最多折两行，超了提醒）`pick:{i, at}`（亮起第几条，从 0 开始）`mark`（被亮起那条里要刷黄的字，必须原样出现在它的 `title` 里，不然报错）`every`（一条条出来的间隔秒数，默认 0.08；0 = 一起出来）。
- 这是自己排的版，不是截图：`src` 写类别（"资讯""评论""问答"），不写真实媒体的名字、不仿它们的样式；出处写进视频简介。有真截图就用 `desk`。
```js
{scene:'headlines', until:'@e09', says:'说法很多，要紧的只有一句：什么时候赚回来',
 items:[
  {src:'示例 · 资讯', date:'10-02', title:'AI 芯片还要排多久的队'},
  {src:'示例 · 评论', date:'10-05', title:'数据中心的电从哪里来'},
  {src:'示例 · 资讯', date:'10-08', title:'大模型价格战打到了几分钱'},
  {src:'示例 · 问答', date:'10-11', title:'这钱什么时候能赚回来？'},
  {src:'示例 · 视频', date:'10-13', title:'一年砸七千亿，到底值不值'},
  {src:'示例 · 资讯', date:'10-16', title:'算力租金还在涨'},
  {src:'示例 · 讨论', date:'10-20', title:'AI 应用到底谁在用'},
  {src:'示例 · 资讯', date:'10-24', title:'各家都说明年还要加码'},
 ],
 pick:{i:3, at:'@e08:最要紧'}, mark:'什么时候能赚回来'}
```

### device：产品界面　`gallery/device.jpg`
- 说的是：界面截图装进正面摆着的手机（或电脑）外框，不转不斜；镜头推近到要看的那一块，金色细框框出来，旁边一个短标签（手机写在右边，电脑写在框上方），推近时标签一起框进来。
- 别用：截图上没有要看的东西（用 `footage` 放录屏）；有官方的产品实拍（用 `footage`，真东西更好）。
- 参数：`img`（必填，界面截图：手机竖屏或电脑横屏，最好是自己截的真界面）`kind:'phone'`（默认）`|'laptop'` `hl:[x,y,w,h]`（截图上要框出来的那一块）`zoom`（推近到 `hl` 的时刻；不写就这一镜过了四成）`label`（短标签，2–8 个字；写了 `label` 就要写 `hl`，不然 `--check` 提醒）`cssW`。
- `hl` 的坐标：按截图原图的像素量；`snap_news.mjs` 截的网页图（3200 宽）按 1600 宽的网页坐标，也可以写 `cssW` 指定。截图和屏幕比例不一样时，截图按铺满屏幕、顶对齐放，`hl` 跟着换算，不用自己算。
```js
{scene:'device', until:'@e10', enter:'through', says:'钱要从应用里赚回来：看有没有人掏钱',
 img:PH+'app.jpg', hl:[48,1150,984,250], zoom:'@e09:愿不愿意', label:'掏钱的人（示意）'}
```

## 各场景：结构和包装

### title：片名 / 章节卡　`gallery/title.jpg`
- 说的是：这条片（这一段）要回答什么问题。字是主角，底下的实拍压暗退成底（`items`），不给就是舞台。
- 别用：片名前面空等（第一句话说完就进）；一条片超过 3 张章节卡。
- 参数：`title`（必填）`brow`（片名上面，常是刚数出来的那个数）`en`（下面一行英文）`items`（底下压暗去色的实拍：只给一段就连续放，一段实拍退成底；给几段就 `step` 秒一换，默认 0.42，同一段轮到第二次时接着往后放）`br`（底下实拍的亮度，默认 0.34）`kind:'chapter'` + `num:'阶段一'` `year:'2022'`（章节卡，一条片最多 3 张，多了 `--check` 提醒）。
- 不带 `items` 的片名可以接 `enter:'flat'`（立在倒下去的上一镜上）；带 `items` 的不行。
- 片名放在钩子之后。

### agenda：目录 / 章节进度　`gallery/agenda.jpg`
- 说的是：几个章节排成一列（大号序号 01、02……），现在讲到的那一章亮起来，左边一道金线。
- 用在：3 分钟左右的长片：开头列目录；每一章开头回到目录、亮起这一章（写 `cur`）。
- 别用：一两分钟的短片（不用目录）；超过 6 章。
- 参数：`items`（必填，3–6 章，每章一个短语）`title`（目录上面一行）`at`（列目录时每一章亮起的时刻，数组，和 `items` 一样多）`cur`（章节开头回到目录时写：现在第几章，从 0 开始；写了 `cur` 就不用 `at`）。
- 接法用 `cut`：目录铺满画面，`enter:'flat'` 会和倒下去的上一镜叠在一起。
```js
{scene:'agenda', until:'@e02', says:'这条片要讲四件事',
 title:'AI 这笔钱，分四段讲', items:['钱从哪来','钱去哪了','谁在赚钱','能不能赚回来'],
 at:['@e01:钱从哪来','@e01:钱去哪了','@e01:谁在赚钱','@e01:能不能']}
```

### statement：金句　`gallery/statement.jpg`
- 说的是：一句判断压成一两行大字，关键词刷金，最后一行下面一道金线。结尾，或者一大段讲完收一句。
- 别用：放一段话（只放一两行、每行 10 字左右，超过 12 个字宽 `--check` 提醒）；每段都来一句（一条片最多三次）。
- 参数：`lines`（必填，一两行）`hl`（要刷金的词，数组）`at`（每一行出来的时刻，数组；不写就一起出来）`brow`（上面一行小字：`'所以'` `'说到底'`）`items`（底下压暗的实拍，可省：只给一段就连续放，几段就 0.6 秒一换）`br`（底下实拍的亮度，默认 0.3）`color:'gold'`（默认）`|'red'`。一条片超过 3 句金句 `--check` 提醒。
- 结尾的金句，底下用开头那段实拍最好：首尾呼应。谷歌那条的结尾就是一段 Safari 实拍压暗退成底，写成 `items:[{clip:'safari'}]`。不带 `items` 的金句可以接 `enter:'flat'`。
```js
{scene:'statement', says:'结论：卖铲子的最赚钱',
 brow:'说到底', lines:['卖铲子的','最赚钱'], hl:['最赚钱'], at:['@e10:卖铲子','@e10:最赚钱'],
 items:[PH+'site.jpg', PH+'servers.jpg', PH+'chip.jpg']}
```

### flash：开头关键词快闪　`gallery/flash.jpg`
- 说的是：一个关键词钉在正中，周围的出处每 5 帧换一张 = "全网都在说"。
- 别用：话题不热（编不出真的出处）；关键词超过 4 个字；不是开头。
- 参数：`keyword`（2–4 个字）`items:[{cat, left, right, sum}]`（至少 8 条：左半句 + 关键词 + 右半句）`every`（几帧换一张，默认 5）。
- 内容来自核实过的报道或开放式问题；不编数据、不仿真实网站。闪到第一个具体对象出现为止（不到 2 秒最好），下一镜可以 `enter:'through'` 冲进去。

### custom：手写一镜
`render:(t, c) => HTML`。`c.t0` `c.t1` `c.at('@b05:词')` `c.bg(t, 机位, 上一帧机位, {tone})`（tone 只用 navy、charcoal、wine）`c.prev`（上一镜，画它最后一刻用 `MV.still(c.prev, c.t0-.01)`）；工具：`S25`（`camPath` `L` `mega`……）、`MV`（手法库）、`KIT`（`disc` `card` `bignum` `brow` `chrome` `appear` `camSeq` `fit`，截图坐标换算 `cssScale`，按宽度折行 `wrapLines`……）。手写也要过 `references/motion.md` 的三句话，也要守 `references/rules.md`：不做满屏 3D、不加颜色光、实拍上不压字。

## 检查和出图

```
node scripts/render.mjs --dir <片子> --check        # 镜头表：每镜的时间、场景、接法、says，加上要看一眼的提醒（几秒钟）
node scripts/render.mjs --dir <片子> --sheet        # 每镜开头/中间/末尾三帧拼一张图（out/sheet.png）
node scripts/render.mjs --dir <片子> --video --h 720
```

报错必须改。提醒不是禁令，每一条都要答得上"为什么这里就该这样"。提醒和怎么改（对应的规则编号见 `references/rules.md`）：

**写法**

| 提醒 | 怎么改 |
|---|---|
| 某个词找不到 | 词要和 script.json 原句一字不差；重复的词用 `#2` |
| 没写 says | 写清这一镜让观众多懂了什么；写不出来就重想这一镜 |
| 还在用占位素材 | 成片之前全部换成真素材 |

**节奏**

| 提醒 | 怎么改 |
|---|---|
| 第一句几秒才开口 / pre 太大 | 0.5 秒内开口：`script.json` 的 `pre` 不超过 0.35 |
| 第一镜到 8 秒以后才换 | 开头要快：第一句话说完就进主体 |
| 第一帧是空的 / 第一帧只有眉题 | 加 `pre:'gray'`，或者让第一样东西一开场就在 |
| 只有几秒，至少要几秒观众才看得清 | 这一镜太短：并到前后镜里，或者把 `until` 往后挪（实拍至少 1.5 秒） |
| 刷黄以后只停了几秒就切走 | 证据至少停 1 秒：`article` 的 `zoom`/`hlAt`、`desk` 的 `read.at` 提前，或者 `until` 往后 |
| 一镜 6.5 秒以上没有新的落点 | 拆成两镜，或者加一两个 step（board 系列） |
| 连着三个同样的场景 | 能合成一个场景的几个 steps 就合 |
| 全片只用了几种场景 | 40 秒以上的片子至少 4 种 |

**接法**

| 提醒 | 怎么改 |
|---|---|
| 连着用同一种 enter | 换一种，或者直接切 |
| 用了 push | 横推只说"换一个人"：两镜都是 `person` 才用 |
| `flat` 只给站在桌面上的场景用 | 改成 `cut` 或 `blur`；要倒成桌面，就换成 `number`、`chart`、`equation`、`change`、`stats`，或不带 `items` 的 `title`、`statement` |

**画风**

| 提醒 | 怎么改 |
|---|---|
| 真素材的镜头只有几成 | 不到四成就是"全是图形"：把能用真东西说的镜头换成 `footage`、`person`、`desk`、`article`（截图）、`frames`、`montage`…… |
| tone 不再当整屏底色 | 只用 `navy`、`charcoal`、`wine` |
| 全片几段酒红底 | 只留"算总账 / 亏钱"那一段，其余用 `navy` |
| 开了 glow | 删掉：颜色光只给 `person` |
| 浮尘已经去掉了 | 删掉 `dust` / `K.dust` |
| 同一家公司用了几种颜色 | 每一镜的 `color` 都写公司名，同一家公司每镜的名字也写成一样 |

**字**

| 提醒 | 怎么改 |
|---|---|
| 圆盘 / 节点 / 卡片 / 表头写了 en | 删掉：英文小字只跟着眉题和片名 |
| 整张图的 brow 和 num 节点的 brow 同时写了 | 一帧最多一组眉题，留一个 |
| 眉题太长 / 巨字超过 4 个字 / 金句一行太长 / 原话太长 / 标题超过 30 字 | 压短：眉题"谁 · 什么"，巨字一两个词，金句每行 10 字左右，原话 30 字以内 |

**数量**

| 提醒 | 怎么改 |
|---|---|
| 全片几处滚数 | 只留"累加"本身就是意思的一两处（`number.roll`、`chart.total`、board 的 `roll` 一起数） |
| 全片几句金句 / 几张章节卡 | 金句、章节卡各不超过 3 |
| 场景自己的数量（frames 1–3 个、desk 2–5 张、cards3d 3–9 张、compare 4 行以内、headlines 至少 6 条、flash 至少 8 条、montage 至少 3 段……） | 按提醒加减；数量对不上，多半是场景选错了，回 `rules.md` 的决策表 |

`--check` 过了不等于好看：再跑 `--sheet` 看图，渲 720p 以后和 `examples/ai-burn-money/frames_1fps.jpg` 并排比（`references/review.md`）。

## 文件

| 文件 | 是什么 |
|---|---|
| `kit.css` | 字体、颜色、零件样式（圆盘、卡片、大数字、价签、画框、图表卡、原文页……）。改风格改这一份 |
| `kit.js` | 镜头表、时刻、接法、自动机位、状态随时间变、整片提醒 |
| `scenes.js` | 场景模板（每个场景的 `says/use/avoid/help` 就是它的说明书） |
| `assets/` | 舞台织物纹理（`fabric.jpg`）、颗粒；`worldmap.png` 点阵世界地图；`ph/` 是占位素材（成片里不能出现）；`make.py` 重新生成它们 |
| `demo/` | 示例片的 `film.js` 和 `script.json`（前 22 个场景） |
| `demo2/` | 示例片二（后加的 11 个场景） |
| `gallery/` | 每个场景的样子：`<场景名>.jpg`（640×360）+ 总览 `00_sheet.jpg`。kit 改了画风就重出：`python kit/gallery/make.py <demo 目录> <demo2 目录>`（截哪一刻写在 make.py 的 `AT` 里） |
| `gallery/gif/` | 动图（560 宽、每秒 12 帧，从示例片 720p 截的）：`flat_roll` 圆盘倒成桌面、数立起来滚到总数 · `article_chart` 原文刷黄 → 倒下、图表立起来 · `network` 钱在三家之间转一圈 · `bars` 柱子长出来、镜头沿着差距走 · `map` 地图上飞一段 · `change` 数从多少变成多少 · `headlines` 标题墙里拎出一句刷黄 |

字幕样式不在 kit 里，在片子自己的 `film.css`（新片从 `starter/film.css` 拷：MiSans Medium 60px、白字带柔阴影、盒子顶在 y=936，和原版一样）。`new_film.mjs --sync` 只更新 `lib/` 和 `assets/kit/`，不动 `film.css`：老片子要新字幕，手动从 `starter/film.css` 拷。
