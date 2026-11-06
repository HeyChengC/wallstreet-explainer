# 实际调用验证记录：TW 偏绿愤慨辩论样片

用最终 skill 从零跑一遍，验证它作为**实际使用者**能不能出片。记录用的是哪一版 skill、什么配置、跑了什么检查、哪些是自动验过的、哪些是人工看的。

## 用的 skill

| 项 | 值 |
|---|---|
| 仓库 | `JaminYoung/political-commentary` |
| 提交 | `b0ff366`（含 `local-clash` 显示 bug 与巨字溢出修复） |
| tag | `v0.2.1` |
| 建片命令 | `node scripts/new_film.mjs films/tw-debate-green-validation --region taiwan` |

## 配置（editorial.json 的 config）

```json
{
  "region": "taiwan", "stance": "green-leaning",
  "styles": ["outrage", "adversarial"], "emotion": 3,
  "profanity": "none", "content_mode": "factual", "language": "zh-TW",
  "overlays": "none", "use_context": "private-study"
}
```

**关于"不声称地道"**：台湾国语用 `zh-TW-YunJheNeural`、`rate +4%`，文本按台湾用词写（影片/網路/立委/質詢/財源/期程/口徑）。**我这边没有 ASR，也没有人耳试听**，所以这份记录只说"音色 ID 正确、文本未被跳过、时长合理"，不评价母语听感——那交给用户。

## 素材与事实

| 项 | 值 |
|---|---|
| 逐字稿来源 | ETtoday 文字直播 `https://features.ettoday.net/taipei-debate-2026/`（2026-10-31 12:00，TVBS／三立联合主办） |
| 影片来源 | 三立新闻网 `https://www.youtube.com/watch?v=0IlnD7rfC88`（人像取自官方缩图，已抠像，不含台标） |
| 争点 1 | 常设委员会出席率（沈质疑）vs 专案会议亲自主持、三个会报（蒋回应） |
| 争点 2 | 公馆圆环事故：两边统计口径不同，本片不判哪一方对，只要求摊开 |
| 引语处理 | **原话与压缩转述分开记在 `editorial.json` 的 `claims`**；转述不是逐字引用 |

两人身份：蒋万安（现任台北市长，国民党）、沈伯洋（民进党台北市长候选人）。

## 检查结果

| 检查 | 结果 |
|---|---|
| `python scripts/check_editorial.py` | **0 错误**；6 条 claim / 2 条来源；`film.js` 的 claimIds/sourceIds 关联全部对得上 |
| `render --check-policy politics --check` | **没有要提醒的**；打印 `检查策略：politics`、`虚构标记：未开启（factual 模式正常）` |
| `--sheet` | 7 镜全部看过：**无任何角标**（无来源、性质、虚构、台标、角落小字） |
| `ffprobe` | H.264 + AAC，1280×720，视频 98.700 秒 / 音频 98.7025 秒 |
| `mix.py` | 98.70 秒，无音效（本片没加 sfx） |

## 这一轮跑出来的两个真 bug（已修，见 `b0ff366`）

1. **`local-clash` 人物永远不显示**：`side()` 里写的是 `slam(tt, tt)`——"当前时刻"和"出现时刻"传了同一个值，进度恒为 0，两个人一直是 `opacity:0`，整镜只有灰底。之前的示例从没用过这个场景，所以一直没暴露。
2. **`local-hero` 巨字溢出**：字号只按 `headlineSize` 取，没有按文字区宽度收，长副字会从左边出屏。现在 `headline` 和 `sub` 都按 `textRight` 自适应。

## 人工看过、但不是自动验的

- 巨字有没有压到人脸（第 2/3/5/7 镜都压了一点，是参考图的风格，可接受）
- 字幕断行是否读得通（`subMax:11`）
- 照片抠像边缘是否干净（两人都裁到手肩，台标与贴纸残片已清）

## 不声称的部分

- **母语听感**未经人耳确认，交用户试听。
- 事故数字的**统计口径本身**没有独立核算，片中也明确说"不替任何一方下结论"。
- 逐字稿来自媒体整理，不是官方逐字记录；引语归属以该页面为准。
