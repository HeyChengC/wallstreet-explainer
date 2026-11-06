# -*- coding: utf-8 -*-
"""封面抠像：把照片里的人物抠成透明 PNG，给封面/正片的大头用。

  python scripts/cutout.py <输入图> <输出png> [--model isnet-general-use] [--bg 255,255,255]

用 rembg（U2Net/ISNet 系列）+ onnxruntime。首次运行会下载模型（约 170MB），之后走缓存。
没有 onnxruntime 时给出明确报错，不静默退化。

注意：
- 这是**生成式后处理**，不是"人物原样"：边缘会有一圈背景色残留。白/浅色背景的照片最好抠。
- 抠出来的是这一张照片里的人，不能挪用到别的言论上去（画面与事实的对应关系靠 editorial.json 的 source_ids）。
"""
import sys, os, json


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = {a.split('=')[0]: a.split('=')[1] for a in sys.argv[1:] if a.startswith('--') and '=' in a}
    if len(args) < 2:
        print(__doc__)
        return 1
    src, dst = args[0], args[1]
    if not os.path.exists(src):
        print(f'找不到输入图 {src}')
        return 1

    try:
        from rembg import remove, new_session
        from PIL import Image
    except ImportError as e:
        print('缺依赖：pip install rembg onnxruntime pillow')
        print(f'（{e}）')
        return 1

    model = opt.get('--model', 'isnet-general-use')
    print(f'模型 {model}（首次运行要下载）…')
    try:
        sess = new_session(model)
    except Exception as e:
        print(f'模型加载失败：{e}')
        return 1

    im = Image.open(src).convert('RGBA')
    print(f'输入 {im.size[0]}×{im.size[1]}')
    out = remove(im, session=sess, alpha_matting=True, alpha_matting_foreground_threshold=240,
                 alpha_matting_background_threshold=15, alpha_matting_erode_size=8)

    # 裁到人物外框，去掉大片透明边，方便排版（封面里按高度摆放）
    box = out.getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(out.width, box[2] + pad), min(out.height, box[3] + pad))
        out = out.crop(box)
        print(f'裁到人物框 {out.size[0]}×{out.size[1]}')

    os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
    out.save(dst, 'PNG')
    print(f'写出 {dst}（{os.path.getsize(dst) // 1024} KB）')
    return 0


if __name__ == '__main__':
    sys.exit(main())
