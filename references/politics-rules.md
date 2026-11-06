# 时政验收规则（和上游财经检查的映射）

上游 `rules.md` 有 43 条，多数是为"讲一笔账"定的。这份写清楚：**哪些留、哪些在时政里不强制、哪些换成新规则**，以及**每一条到底是脚本查的还是人查的**。

## 先说清楚：什么是真的自动

| 脚本 | 真查的 | 不查的 |
|---|---|---|
| `check_editorial.py` | 配置取值与组合（`region`×`stance`）、`styles`/`emotion`/`profanity`/`content_mode` 取值、来源必填字段与日期格式、`claims` 引用的 source 是否存在、`beat_ids` 是否在 `script.json` 里、`factual` 下 fact 是否引用了 synthetic、`unverified` 的归因与标记、`fiction` 的 `fiction_marker` 与至少一条 fiction claim、`film.js` 里 `claimIds`/`sourceIds` 字面量是否对得上 | `film.js` 用变量拼的数组（抓不到，会明说"要人工核对"）；观点是否正确；来源说的和 claim 写的是不是一回事 |
| `render.mjs --check-policy politics --check` | 镜头表结构错误、`says` 缺失、占位图、场景最短时长、`tone` 非法、开口时间、场景连用、第一镜时长、证据镜是否挂了 `sourceIds`、**虚构标记是否每一镜都在**（`KIT_REPORT.fiction`） | 角标叠没叠字、卡片有没有重叠、原话读不读得完、来源挂得对不对 |

**其余全部是人查。** 下面的表里标了"手查"的就是人查，别当成脚本替你查过。

## 时政策略关掉的财经配额

`render.mjs --check-policy politics --check` 关掉这些（`upstream` 策略下仍然生效）：

| 上游条目 | 内容 | 时政里 |
|---|---|---|
| 第 7 条 | 真素材镜头 ≥ 镜头数 × 0.4 | **不数占比**。改成"证据镜要挂 `sourceIds`"（自动） |
| 第 10 条 | 酒红底一条片最多一段 | 不强制 |
| 第 13 条 | 同一家公司全片同一个颜色 | 不强制（时政主体不是公司，颜色不代表立场） |
| 第 27 条 | 滚数 ≤ 2 处 | 改成"只在票数/席次累加时滚"（自动报数量，语义人判） |
| 第 26 条（场景种类） | 40 秒以上至少 4 种 | 降为提示（低于 3 种才提醒） |
| 第 25 条（B-roll 落点） | 一镜 6.5 秒以上要有落点 | 长镜头允许停，但要挂 `claimIds`/`sourceIds` 或加 step |

**保留下来的（任何策略下都查）**：没写 `says`、场景最短时长、占位图、`tone` 非法、第一句开口 ≤ 0.5 秒、同一场景连用三次、同一种接法连用、第一镜超过 8 秒。

**上游的"审美"在时政里仍然适用**：一镜一个主角、东西朴素出现、实拍上不压字、字幕带 y≥900 不放东西、时刻挂在字上。

## 时政自己的规则（P 系列）

### 一、事实与来源

| # | 规则 | 怎么查 |
|---|---|---|
| P1 | 每条 `fact` / `quote` / `unverified` 都有 `source_ids` | **自动** |
| P2 | 每个 `source_ids` / `claim_ids` 引用真实存在 | **自动**（claims 之间）；`film.js` 的 `claimIds`/`sourceIds` 只在能抓到字面量时自动 |
| P3 | `beat_ids` 是 `script.json` 里真实的句子 id | **自动**（读同目录 `script.json`） |
| P4 | `published_at` 查不到写 `null`；不许编日期 | **自动**（null 只提醒；格式非法报错） |
| P5 | `accessed_at` 必须写 | **自动** |
| P6 | 来源有 `publisher` 和 `title` | **自动** |
| P7 | `factual` 的事实不来自 `synthetic` 材料 | **自动** |
| P8 | `user-provided` 的 `local_path` 文件真实存在 | **自动** |
| P9 | 官方声明只证明"官方这样说"，不写成事实成立 | **手查**（看 `reasoning` 和文案） |

### 二、立场与风格

| # | 规则 | 怎么查 |
|---|---|---|
| P10 | 香港不用台湾的蓝绿值，反之亦然 | **自动** |
| P11 | `stance:'custom'` 必须有 `stance_note` | **自动** |
| P12 | `styles` 取值合法，第一项是主风格 | **自动** |
| P13 | 立场不改事件时间、票数、原话、身份 | **手查**（对照 `script.json` 和 sources） |
| P14 | 不删掉对方的决定性反证 | **手查**（导演表里能找到"对方最强论据"那一镜） |
| P15 | 不把一个人的话写成整个阵营 | **手查** |
| P16 | 粗口按 `profanity` 档位，不自动升级 | **手查** |

### 三、未证实与虚构

| # | 规则 | 怎么查 |
|---|---|---|
| P17 | `unverified` 有 `attribution` | **自动** |
| P18 | `unverified` 标 `marked_on_screen:true` | **自动**（声明）；画面是否真写了"未证实"**手查** |
| P19 | 未证实的不进标题和封面 | **手查** |
| P20 | `fiction` 有 `fiction_marker` + 至少一条 fiction claim | **自动** |
| P21 | 虚构标记全片每镜都在 | **自动**（`--check` 打印"虚构标记：全片常驻…每一镜都验过"）+ 抽帧看 |
| P22 | 虚构不给真实官员/机构安虚构罪名 | **手查** |

### 四、画面与追踪

| # | 规则 | 怎么查 |
|---|---|---|
| P23 | 一段角标只挂这一段真正在讲的来源；混了两个来源就拆段或拆镜 | **手查** |
| P24 | 角标不随镜头缩放、不压字幕 | **自动**（帧层实现）+ 抽帧看 |
| P25 | 事实/原话/分析有**文字**标签，不只靠颜色 | **手查**（角标和 `verdict` 的 `nature`） |
| P26 | 全片至少一镜挂 `sourceIds` | **自动**（politics 策略） |
| P27 | `event-timeline` 的节点各挂各的 `at` | **手查**（打开 `film.js`） |
| P28 | `stance-matrix` 主体名过长用 `short` | **手查** |

## 交片前必跑

```powershell
python scripts/check_editorial.py <片子>/editorial.json          # 0 过 / 1 停 / 2 看提醒
node scripts/render.mjs --dir <片子> --check-policy politics --check
node scripts/render.mjs --dir <片子> --check-policy politics --sheet
node scripts/render.mjs --dir <片子> --check-policy politics --video --h 720
python scripts/mix.py <片子> --check
```

**两个脚本零输出不等于能交片**：角标位置、卡片重叠、原话是否读得完，都得自己看 `--sheet` 和抽帧。P 系列里标"手查"的那些，脚本一条都没替你看。
