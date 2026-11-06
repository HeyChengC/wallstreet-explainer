# political-commentary

让 AI 做港台时政评论短片：真新闻、真原话、真时间线，各方立场摊开对照，最后落到一个能验证的判断。

派生自 [HeyChengC/wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer)（MIT）。渲染底座、配音、混音、抠像工具沿用上游；这一版把"讲一笔账"换成"评一件事"，加了立场与风格的独立配置、三个时政场景，以及一份可校验的事实底稿。

## 能做什么

- **选立场，不改事实**：中立 / 偏绿 / 偏蓝 / 香港建制 / 香港泛民 / 自定义；同一份事实底稿可以出不同立场的版本，事件时间、票数、原话不动。
- **选风格，能组合**：客观、爆料悬念、愤慨、强对立；粗口档位单独设，选愤慨不会自动加粗口。
- **事实有账可查**：`editorial.json` 记来源和每条 claim 的性质（事实/原话/分析/未证实/虚构），`check_editorial.py` 查引用、日期、立场配置和虚构标记。
- **画面上分得清**：固定角标显示"事实 / 原话 / 分析 / 未证实 / 虚构演绎"和来源简称，不随镜头缩放、不压字幕。
- **虚构也能做**，但全程常驻"虚构演绎"标记，用虚构人物和机构。

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

字体清单见 `kit/kit.css` 的 `@font-face`：MiSans（Regular/Medium/Semibold/Bold）、阿里妈妈数黑体、Bebas Neue、Montserrat（含 Italic）。

Playwright 装在别处就写 `"playwright_from": "<装了 playwright 的 package.json>"`。

## 使用

重启后直接说：

> 用 political-commentary 做一条 90 秒的时政评论，台湾议题，偏绿，愤慨一点，但不要粗口，选题是这周立法院的那个预算争议

或者更省事：

> 用 political-commentary 把这篇报道做成时政评论，我自己给素材

第一条命令它会先问地区、立场、风格（没说的用默认值），然后建 `editorial.json`，再写文案。

## 三条可直接复制的调用

**1. 客观风格，香港政策拆解**

```
用 political-commentary 做一条 100 秒的香港政策拆解：neutral、objective、emotion 1、不要粗口。
选题：政府刚公布的那个交通收费方案。
要求：先把政府公报和议会记录找出来，标清日期和出处；各方的公开说法用 stance-matrix；
我的判断用 verdict，写清条件和下一个观察点。事实底稿先给我，我确认后再写文案。
```

**2. 台湾议题，偏蓝强对立**

```
用 political-commentary 做一条 80 秒的台湾议题评论：region taiwan、stance blue-leaning、
styles ["adversarial","traffic"]、emotion 2、profanity none。
把对方最强的论点原样摆出来，然后逐条反驳；不能改原话、不能改数字。
未证实的说法标"未证实"，不做成"我们确认"。
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

`examples/politics-demo/`：虚构海岚市的一条 123 秒片，8 镜，演示三个新场景 + 角标 + 事实分析区分。不需要联网，全部素材自绘或本地虚构文件（`assets/docs/` 里三份 md 都标了是测试材料）。

跑起来：

```powershell
node scripts/new_film.mjs /tmp/politics-demo --politics     # 建空片
# 把 examples/politics-demo 的 script.json / film.js / editorial.json / assets/docs 拷进去
python scripts/check_editorial.py /tmp/politics-demo/editorial.json
node scripts/render.mjs --dir /tmp/politics-demo --check-policy politics --sheet
```

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
