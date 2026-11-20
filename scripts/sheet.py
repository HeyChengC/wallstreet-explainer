# 把渲出来的单帧拼成联系表：python sheet.py <单帧目录> <输出.jpg> <列数> <每格宽> t1,t2,...   （只取画面区 0–1574 再加一点底条）
import sys
from pathlib import Path
from PIL import Image, ImageDraw

d, out, cols, w = Path(sys.argv[1]), sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
ts = sys.argv[5].split(',')
crop_h = int(sys.argv[6]) if len(sys.argv) > 6 else 1640
ims = []
for t in ts:
    im = Image.open(d / f'still_{float(t):.2f}.png').convert('RGB')
    im = im.crop((0, 0, im.width, int(im.height * crop_h / 1920)))
    h = round(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(im).text((6, 4), t, fill=(255, 255, 0))
    ims.append(im)
rows = (len(ims) + cols - 1) // cols
H = ims[0].height
sheet = Image.new('RGB', (cols * w + (cols - 1) * 4, rows * H + (rows - 1) * 4), (255, 0, 255))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * (w + 4), (i // cols) * (H + 4)))
sheet.save(out, quality=88)
print(out, sheet.size)
