# 更新记录

- v2.1（2026-10-31）：`render.mjs --check` 补漏：改了文案没重算时间线直接提醒重跑 `timeline_stub`；参数名写错直接报错并猜正确写法（比如 `lable` → `label`）；只用占位图的镜头不算真素材；报错去掉程序内部字样。`timeline_stub` 把"〇"按汉字算时长；`new_film` 打印完整步骤；chart 标题下的英文小字参数改叫 `en`（`sub` 仍可用）。
- v2.0（2026-10-31）：加模板档 `kit/`（31 个场景、镜头表、`render.mjs --check` 文字自检）、`references/rules.md`、新建片子的 `new_film.mjs`；新例子《谷歌给苹果的两百亿》；找素材、渲染踩的坑补进文档。
