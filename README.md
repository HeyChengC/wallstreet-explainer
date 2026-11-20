# wallstreet-explainer

让 AI 做华尔街风格的财经解读短片：真实的新闻和画面，金色大数字，深蓝织物底，镜头一直在走。

<img src="examples/gold-rates/sample.gif" alt="真人口播样片" width="100%">

**真人口播版**：《打仗了，黄金为什么反而跌》，29 秒。主持人是 AI 生成的数字人。

<img src="examples/ai-burn-money/sample.gif" alt="无人出镜样片" width="100%">

**无人出镜版**：《AI 到底有多烧钱》，77 秒，GIF 是前 29 秒。

<img src="examples/nvda-vertical/frames.jpg" alt="竖屏真人口播样片" width="100%">

**竖屏真人口播版**：《英伟达拒绝老黄回归》，29 秒，9:16。上面是每一镜落定的一帧。

<img src="examples/nvda-vertical/frames_nohost.jpg" alt="竖屏无人出镜样片" width="100%">

**竖屏无人出镜版**：同一条片、同一份镜头表，把她的实拍换成图，配音换成 TTS。

GIF 没有声音。片中新闻截图和实拍为引用，出处见 [CREDITS.md](examples/ai-burn-money/CREDITS.md) 和 [竖屏样片的出处](examples/nvda-vertical/README.md)。

## 四种模式

| | 有真人口播 | 没有人出镜 |
|---|---|---|
| **横屏 16:9**（B 站、YouTube） | 围着人做：证据挂在她身后的墙上 | 把新闻里的当事人抠出来，站在大字前面 |
| **竖屏 9:16**（小红书、抖音、视频号） | 她是底，大字和道具压在她胸口；讲证据时她缩到角上的圆头像里 | 同一份镜头表，底换成图，主角换成东西 |

说"竖屏""9:16""手机上看"就走竖屏；给了口播视频就走真人口播，没给就走无人出镜。

竖屏版有 20 个现成的组件，一个强调色管全片（从口播画面里取），加上会动的道具（真东西的抠图或生图）。下面是其中 12 个图形组件的样张，全部见 [kit/VERTICAL.md](kit/VERTICAL.md)：

<img src="examples/vpro-gallery/gallery12.jpg" alt="竖屏图形组件样张" width="100%">

## 能做什么

给它一个选题，它会自己写文案、找素材、配音、出片。

- 有口播视频（真人或数字人），就围着人做：证据挂在人身后的墙上，讲细节时人缩到角上的小窗。
- 没有口播视频，就把新闻里的当事人抠出来，站在大字前面。
- 素材自己去视频网站找，新闻网页自己截，关键句刷黄。
- 数字和钱的关系用大字、柱子、图表演出来。

## 安装

最简单：把这个仓库链接发给你的 AI 工具，让它装。

Claude Code 手动装：

```bash
git clone https://github.com/HeyChengC/wallstreet-explainer.git ~/.claude/skills/wallstreet-explainer
cd ~/.claude/skills/wallstreet-explainer
pip install -r requirements.txt
npm install && npx playwright install chromium
```

另外要装 ffmpeg 并放进 PATH。

字体要自己下，放进 `fonts/`：MiSans、阿里妈妈数黑体、Bebas Neue、Montserrat、Noto Sans SC。文件名和 `kit/kit.css` 里的对上。

## 使用

重启 Claude Code，直接说：

> 用 wallstreet-explainer 做一条 1 分钟的片子，讲 AI 到底有多烧钱

有口播视频就一起发给它。没有的话，它先用 edge-tts 临时配音，画面定了再换成你的配音。

## 常见问题

| 问题 | 办法 |
|---|---|
| yt-dlp、edge-tts 报 403 | `pip install -U yt-dlp edge-tts` |
| 抠人报错 | 装 `onnxruntime-gpu`（N 卡）或 `onnxruntime` |
| 逐字对齐太慢 | 用 N 卡跑 faster-whisper |
| 字体不在 `fonts/` | 在 `scripts/local.json` 写 `"fonts_dir": "<路径>"` |
| Playwright 装在别处 | 设环境变量 `PLAYWRIGHT_FROM` |

## 目录

| 位置 | 内容 |
|---|---|
| `SKILL.md` | AI 读的入口 |
| `references/` | 做片的方法和规矩 |
| `scripts/` | 下片、截图、配音、抠像、渲染、混音 |
| `kit/` | 现成场景模板 |
| `starter/` | 新片起点 |
| `examples/` | 样片的文案和画面代码 |

## 版权

素材只用于评论和解读，每条片在简介里写清出处。代码和文档是 MIT 协议，见 [LICENSE](LICENSE)。样片里的第三方画面、截图、logo 和人物不在 MIT 范围内。

## 联系

微信：Yangdavee（加的时候备注来意）

## 友情链接

[LINUX DO](https://linux.do/)
