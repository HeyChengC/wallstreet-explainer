# wallstreet-explainer

有一类财经视频，画面简洁、高级，有质感。我做了个 Skill，让 AI 直接做这种片子。

![样片：《打仗了，黄金为什么反而跌》](examples/gold-rates/sample.gif)

《打仗了，黄金为什么反而跌》，29 秒，有人口播。主持人是 AI 生成的数字人，不是真人。证据挂在她身后的墙上，讲到关键处她缩进角上的小窗，讲完再回到全屏。新闻截图和实拍是引用的。

![样片：《AI 到底有多烧钱》](examples/ai-burn-money/sample.gif)

《AI 到底有多烧钱》，77 秒，没有人口播。当事人从发布会里抠出来，站在大字前面讲。素材出处在 [CREDITS.md](examples/ai-burn-money/CREDITS.md)。

两个 GIF 都没有声音。你给了口播视频（真人或数字人都行），它就做第一种；没给，就做第二种。

## 这种片子怎么做

画面基本都是真东西：发布会、采访、新闻原文、公司官方画面。数字和钱的关系，用图表和大字演出来。

![四个镜头动作的连续帧](examples/ai-burn-money/moves_v6.jpg)

上面是样片里的四个镜头，从上往下：镜头沿着桌上的新闻滑过去；黄仁勋从发布会里抠出来，身后换成"5.2 万亿"；整组横推出去换成 Altman；新闻倒下去变成桌面，图表立起来。

几条规矩：

- 一个问题撑一条片。开头五到七秒抛出反差，结尾回答它。
- 克制。同一个东西靠镜头推拉，不要每出一样新东西就切一刀，不要渐入渐出。
- 每一镜都要让观众多懂一点，并且接得住上一镜。
- 素材要真、要清楚、最好是官方的。新闻截图把关键句刷黄。
- 小字少放。静音看一遍，画面自己能讲明白。

整条片用代码一帧一帧画出来，按配音的时间线排，最后渲染成视频。配乐是平稳的底乐，人声出来时自动压低。

## 怎么用

最省事的办法：把这个仓库链接发给你的 AI 工具，让它装好，然后直接让它做片。

用 Claude Code 自己装：

```bash
git clone https://github.com/HeyChengC/wallstreet-explainer.git ~/.claude/skills/wallstreet-explainer
cd ~/.claude/skills/wallstreet-explainer
pip install -r requirements.txt
npm install && npx playwright install chromium
```

再装个 ffmpeg 放进 PATH。重启 Claude Code，跟它说"用 wallstreet-explainer 做一条 1 分钟的片子，讲 AI 到底有多烧钱"。

选题和文案可以自己给，也可以让它出。开头它会给你几个钩子挑。

有口播视频的话，口播就是配音，它会逐字对齐排时间线。没有的话，配音先用免费的 edge-tts 临时配，把时间线排出来。画面定了再换成自己的配音：每句存成 `voice/<句子id>.final.wav`，跑 `python scripts/temp_voice.py film/script.json --asr`，画面会重新对齐。

可能碰到的问题：

- yt-dlp、edge-tts 过一阵会 403，`pip install -U` 一下。
- 抠人要装 `onnxruntime-gpu`（N 卡）或 `onnxruntime`，再下模型：`python -c "from rembg import new_session; new_session('isnet-general-use')"`。
- 换配音后的逐字对齐用 faster-whisper，有 N 卡快很多。
- 字体要自己下：MiSans（字幕）、阿里妈妈数黑体（标签、片名）、Bebas Neue（大数字）、Montserrat（英文小标）、Noto Sans SC（兜底）。放进 `fonts/`，文件名和 `kit/kit.css` 对上。放别处就在 `scripts/local.json` 里写 `"fonts_dir": "<路径>"`。
- Playwright 装在别处，设环境变量 `PLAYWRIGHT_FROM` 指过去。

## 里面有什么

- `SKILL.md`：AI 读的入口。
- `references/`：怎么想每一镜、镜头怎么动、画面和转场、开头钩子、找素材和声音、交付前查什么、踩过的坑。
- `scripts/`：找片下片、截新闻、临时配音、抠人、渲染、混音这些工具。
- `kit/`：现成的场景，填字、填数、填图就能用。
- `starter/`：新片的起点。
- `examples/`：样片的文案、导演表和画面代码。

## 素材和版权

这类片子一定会用别人的素材。只拿来做评论和解读，每条片在简介里写清出处，写法参考 [CREDITS.md](examples/ai-burn-money/CREDITS.md)。风险自己判断。

截不到新闻网页时，可以用核实过的文字自己排一张图，但别仿网站的 logo 和版式，别编数据。

## License

代码和文档是 MIT，见 [LICENSE](LICENSE)。样片里的第三方画面、截图、logo 和人物不在 MIT 范围内，归各自所有者。

## 联系

微信号 Yangdavee，加的时候备注来意。

## 友情链接

https://linux.do/
