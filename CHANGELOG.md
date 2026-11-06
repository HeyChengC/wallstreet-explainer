# 更新记录

## v0.1.0（2026-11-06）— 从 wallstreet-explainer 派生

从 [HeyChengC/wallstreet-explainer](https://github.com/HeyChengC/wallstreet-explainer) 的 `f39845a` 派生，保留全部上游历史和 LICENSE。

**新增**

- `SKILL.md` / `README.md` 改写为时政入口：地区、立场、风格、情绪、粗口、`content_mode` 独立配置。
- `references/politics-editorial.md`（怎么写：立场、四种风格、反驳、未证实、虚构）、`politics-style.md`（节目样本与"哪些量过哪些没量"）、`politics-sourcing.md`（素材与降级路径）、`politics-rules.md`（P 系列规则 + 上游 43 条的映射，标明自动/手查）、`politics-production.md`（逐站产物与命令）。
- `editorial.json` 事实底稿：config / sources / claims，claim 的 `kind` 分事实/原话/分析/未证实/虚构。
- `scripts/check_editorial.py`：校验配置、跨地区立场、来源与 claim 引用、日期、引用所需字段、`factual` 下禁用 synthetic、`unverified` 归因与标记、`fiction_marker`，以及 `film.js` 的 `claimIds`/`sourceIds` 是否对得上。退出码 0 / 1 / 2（只有提醒）。`--json` 输出纯 JSON。
- `kit/politics.js`：三个场景 `stance-matrix` / `event-timeline` / `verdict`；帧层固定来源与性质角标（不随镜头缩放、不压字幕）；全片常驻虚构标记。字段并入 `kit.js` 的词汇表，`claimIds`/`sourceIds` 是通用字段。
- `--check-policy upstream|politics`：策略从 `render.mjs` 传到 `KIT.use` 再到 `lint`；子 worker 也透传。`politics` 关掉财经专属配额，换成"证据镜要挂 `sourceIds`"和"虚构标记每镜都在"的检查。`--check` 会打印实际生效的策略和虚构标记状态。
- `new_film.mjs --politics`：建时政片子；`starter/index.html` 加载 `politics.js`。
- `examples/politics-demo`：8 镜、约 99 秒（配音后），虚构城市、自绘图形 + 三份本地虚构材料；演示三个新场景、角标、事实/分析区分、常驻虚构标记。
- `tests/editorial/`：13 个用例（负例覆盖缺来源、未知引用、地区×立场不符、未证实缺标记、虚构缺 marker、非法日期、factual 用 synthetic、不存在的 beat；正例覆盖最小合法文件与 user-provided）。

**修复的上游问题**

- `kit/host.js` 把 `KIT.use` 包成 `async F=>…`，吞掉了第二个参数；`index.html` 无条件加载它，会让 `--check-policy` 静默失效。已改为透传 `(F,o)`。
- `render.mjs` 的 `--video` 子 worker 不继承策略参数，已补 `--check-policy`。

**兼容**

- 不写 `--check-policy`（或写 `upstream`）时行为与上游一致；原有 33 个场景、示例片、工具链不变。
- 上游 `references/` 的 11 份保留，作为画风与动效的底座。

**未验证**

- 口播（`host_timeline.py`）与抠像（`matte.py`）未端到端跑过：验证机缺 faster-whisper / onnxruntime。
- 未做节目镜头频率统计。

## 上游记录

- v2.2（2026-11-04）：加真人口播模式，一个 skill 两种模式。
- v2.1（2026-10-31）：`render.mjs --check` 补漏。
- v2.0（2026-10-31）：加模板档 `kit/`、`references/rules.md`、`new_film.mjs`。
