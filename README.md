# political-commentary

让 AI 做港台时政评论短片：真新闻、真原话、真时间线，各方立场摊开对照，最后落到一个能验证的判断。

派生自 [HeyChengC/wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer)（MIT）。渲染底座、配音、混音、抠像工具沿用上游；这一版把"讲一笔账"换成"评一件事"，加了立场与风格的独立配置、三个时政场景，以及一份可校验的事实底稿。

## 能做什么

- **选立场，不改事实**：中立 / 偏绿 / 偏蓝 / 香港建制 / 香港泛民 / 自定义；同一份事实底稿可以出不同立场的版本，事件时间、票数、原话不动。
- **选风格，能组合**：客观、爆料悬念、愤慨、强对立；粗口档位单独设，选愤慨不会自动加粗口。
- **选地区，语言和画面一起变**：台湾＝繁体＋台湾国语＋Noto Sans TC Black；香港＝**书面粤语**＋粤语音色＋Noto Sans HK Black。不会拿普通话去读粤语稿。
- **本地自媒体包装**：人物抠像大头上封面、粗描边巨字、slam/震动/漫画爆裂、80px 900 字重带黑描边的字幕。
- **事实有账可查**：`editorial.json` 记来源和每条 claim 的性质（事实/原话/分析/未证实/虚构），`check_editorial.py` 查引用、日期、立场配置和虚构标记。
- **可以不要角标**：`overlays: none` 时画面不显示任何来源、性质、虚构、研究标签，出处只留在 `editorial.json`。
- **虚构也能做**，但默认要求全程常驻"虚构演绎"标记，用虚构人物和机构。

## 安装

**Claude Code**（技能目录 `~/.claude/skills/`）：

```bash
git clone https://github.com/JaminYoung/political-commentary.git ~/.claude/skills/political-commentary
cd ~/.claude/skills/political-commentary
pip install -r requirements.txt
npm install && npx playwright install chromium
```

**Codex**（技能目录 `~/.agents/skills/` 或项目里的 `.agents/skills/`）：

```powershell
git clone https://github.com/JaminYoung/political-commentary.git "$HOME\.agents\skills\political-commentary"
Set-Location "$HOME\.agents\skills\political-commentary"
python -m pip install -r requirements.txt
npm install; npx playwright install chromium
```

> `SKILL.md` 必须直接位于技能文件夹里，不能多嵌一层。

另外要装 ffmpeg 并放进 `PATH`（或写在 `scripts/local.json` 的 `ffmpeg`）。

**口播模式和抠像**需要额外的 Python 包（可选，只用无人动效时不需要）：

```bash
python -m pip install faster-whisper onnxruntime rembg
python -c "from rembg import new_session; new_session('isnet-general-use')"
```

有 NVIDIA 显卡就把 `onnxruntime` 换成 `onnxruntime-gpu[cuda,cudnn]>=1.20`。

字体要自己下，放进一个目录，然后：

```json
// scripts/local.json（不进仓库）
{"fonts_dir": "D:/path/to/fonts"}
```

**必需字体**（文件名要与 `kit/kit.css` 和 `kit/regional.js` 的 `@font-face` 对上）：

| 字体 | 文件 | 用在哪 |
|---|---|---|
| MiSans Regular/Medium/Semibold/Bold | `MiSans-*.ttf` 或 `.otf` | 通用正文、眉题（上游默认） |
| 阿里妈妈数黑体 | `AlimamaShuHeiTi-Bold.ttf` | 财经片巨字（**缺繁体字，港台题材不要用**） |
| Bebas Neue | `BebasNeue-Regular.ttf` | 数字 |
| Montserrat（含 Italic） | `Montserrat-VF.ttf` / `Montserrat-Italic-VF.ttf` | 英文小字 |
| **Noto Sans TC Black / Bold** | `NotoSansTC-Black.otf` / `NotoSansTC-Bold.otf` | **台湾版**巨字与字幕（字重 900） |
| **Noto Sans HK Black / Bold** | `NotoSansHK-Black.otf` / `NotoSansHK-Bold.otf` | **香港版**巨字与字幕（字重 900） |

**Noto Sans TC/HK 官方来源**（开源，SIL OFL）：

```powershell
# 从 notofonts/noto-cjk 的 release 取语言子集包（每个约 33 MB）
# https://github.com/notofonts/noto-cjk/releases/tag/Sans2.004
#   19_NotoSansTC.zip → NotoSansTC-Black.otf / -Bold.otf
#   20_NotoSansHK.zip → NotoSansHK-Black.otf / -Bold.otf
# 解压后把 4 个 otf 放进 fonts_dir
```

单文件下载：`https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/19_NotoSansTC.zip`

**为什么必须换**：阿里妈妈数黑体缺 **142/336 个常用繁体字**（會議員選舉預算質詢報門長…），浏览器会一字一字 fallback 到 MiSans，同一句里字重和字形混排——这是"大陆模板"观感最直接的来源。Noto Sans TC/HK Black 缺 0。

Playwright 装在别处就写 `"playwright_from": "<装了 playwright 的 package.json>"`。

## 可选：人物抠像（封面大头）

封面需要透明人物 PNG。仓库带 `scripts/cutout.py`（rembg）：

```powershell
python -m pip install rembg onnxruntime pillow
python scripts/cutout.py assets/img/presser.jpg assets/img/person.png
```

首次运行会下载模型（约 170 MB）。**实测**：`isnet-general-use` 在灰色背景的记者会照片上会失败（整幅被当成前景），`u2net_human_seg` 效果好得多——两个都试一次，选干净的那个。抠像边缘会有背景色残留，白/浅背景的照片最好抠。

## 使用

重启后直接说：

> 用 political-commentary 做一条 90 秒的时政评论，台湾议题，偏绿，愤慨一点，但不要粗口，选题是这周立法院的那个预算争议

或者更省事：

> 用 political-commentary 把这篇报道做成时政评论，我自己给素材

第一条命令它会先问地区、立场、风格（没说的用默认值），然后建 `editorial.json`，再写文案。

## 三条可直接复制的调用

**1. 香港本地版（粤语 + 无角标）**

```
用 political-commentary 做一条香港时政评论：region hongkong、neutral、objective、emotion 2、不要粗口、overlays none。
题材：2024 年垃圾徵费押后。先把政府公报原文和记者会答问找来，出处记进 editorial.json，但画面不要任何角标。
台词必须是书面粤语（唔/嘅/咗/佢），用 zh-HK 男声。
```

**2. 台湾本地版（繁体 + 台湾国语）**

```
用 political-commentary 做一条台湾时政评论：region taiwan、stance neutral、styles ["traffic"]、emotion 2。
题材：台北市长辩论里的金句与政见。人物用官方公开片源，裁掉台标；封面做大头 + 粗描边巨字。
台词用台湾说法（影片/網路/立委/質詢/財源/期程），zh-TW 男声。画面不要角标。
```

**3. 虚构剧情（要打标）**

```
用 political-commentary 做一条虚构政治剧情短片，60 秒，content_mode fiction。
虚构一个城市和一组虚构官员，演一场预算黑箱的戏；全片右上角常驻"虚构演绎"，不能用真实官员的肖像或名字。
```

## 检查

```powershell
python scripts/check_editorial.py <片子>/editorial.json                       # 0 过 / 1 停 / 2 看提醒
node scripts/render.mjs --dir <片子> --check-policy politics --check          # 镜头表（时政策略）
node scripts/render.mjs --dir <片子> --check-policy politics --sheet          # 每镜三帧，自己先看
```

`--check-policy politics` 关掉财经配额，换成证据镜要挂 `sourceIds` 这类检查。不写就用上游默认，财经片照旧。

## 示例片

**当前两版（港台本地风格，v0.2）**

| 示例 | 时长 | 内容 | 看点 |
|---|---|---|---|
| [`examples/taiwan-native`](examples/taiwan-native) | 27.6 秒 | 台北市長辯論：金句怎麼搶聲量 | 红黄撞色大头封面、粗描边巨字、slam/震动/爆裂、80px 900 字重繁中字幕、**无角标** |
| [`examples/hongkong-native`](examples/hongkong-native) | 42.3 秒 | 2024 垃圾徵費押後，邊個交代 | **书面粤语正文 + zh-HK 音色**、官员抠像封面、原片裁掉立法会 logo、无角标 |

两版都带 `cover.html`（封面入口页）、`cover.js`（封面版式）、`cover_1280.jpg`（成品）、`script.json`、`film.js`、`editorial.json`、`film.css`，以及裁好的素材图。**原视频不随仓库分发**（第三方版权），`editorial.json` 里记了来源 URL。

**完整复现**（示例里没有 `lib/` 和 `fonts/`——那是本机路径，不进仓库）：

```powershell
# 1. 建一个带 lib / fonts 的新片子（这里以香港版为例）
node scripts/new_film.mjs D:/tmp/hk-demo --region hongkong

# 2. 把示例的全部相关文件拷进去（不是只拷三个 json）
$src = "examples/hongkong-native"
Copy-Item "$src/film.js","$src/script.json","$src/editorial.json","$src/film.css","$src/cover.html","$src/cover.js" "D:/tmp/hk-demo/" -Force
Copy-Item "$src/assets/img/*" "D:/tmp/hk-demo/assets/img/" -Force

# 3. 重出时间线（示例的 script.json 有台词但新目录还没有配音）
python scripts/temp_voice.py D:/tmp/hk-demo/script.json

# 4. 检查 + 封面 + 联系表
python scripts/check_editorial.py D:/tmp/hk-demo/editorial.json
node scripts/render.mjs --dir D:/tmp/hk-demo --page cover.html --cover
node scripts/render.mjs --dir D:/tmp/hk-demo --check-policy politics --check
node scripts/render.mjs --dir D:/tmp/hk-demo --check-policy politics --sheet
```

**历史示例（v0.1，财经风格）**

- [`examples/politics-demo`](examples/politics-demo)：虚构海岚市，99 秒，8 镜，演示 `stance-matrix` / `event-timeline` / `verdict` 三个时政场景 + 来源角标 + 虚构标记。这是**旧版**（深蓝织物底、小卡片、有角标），保留作历史与低强度风格参考。

## 和上游的关系

- 历史、LICENSE、`examples/` 里的三条财经样片、`kit/` 的 33 个场景全部保留。
- `references/` 里上游那 11 份是财经语境，画风和动效照用；时政的规矩在新的 5 份 `politics-*.md` 里，冲突时以后者为准。
- 不写 `--check-policy politics` 时行为与上游一致。

## 已知限制

- **素材可访问性随环境变**：平台和新闻站点的可用性取决于部署环境、区域和时间。到新环境先验网页截图、PDF、视频三条链，别沿用上一份笔记。
- **口播模式和抠像继承上游，未在本仓库的验证里端到端跑过**（需要 faster-whisper / onnxruntime）。首次用要装：见上文"安装后缀"或上游 README。
- 时政风格样本只做了页面级定性参考，**没有做镜头频率统计**，文档里不写"港台节目平均每两秒切镜"这类没量过的数。

## 版权

代码和文档 MIT。示例片里的虚构材料是本仓库自制，可自由使用。真实做片时，新闻截图、议会录像、人物照片、音乐**不因仓库是 MIT 就获得再分发许可**，按平台和当地规则处理，成片保留出处清单。

## 上游

原项目：[HeyChengC/wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer) · [作者论坛帖](https://linux.do/t/topic/3127621)
