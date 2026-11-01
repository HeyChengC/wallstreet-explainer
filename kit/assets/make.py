# -*- coding: utf-8 -*-
"""生成模板库用的纹理和占位素材（只在改纹理时跑一次，产物已经提交在这个目录里）。
  python kit/assets/make.py
- fabric.jpg：舞台织物，很细的 45° 斜纹（3.2px 一个周期）+ 纱线粗细抖动，灰度、四边无缝、均值 128。
  kit.css 把它按原尺寸平铺、用 overlay 叠在底色上：颜色和"中间略亮、四周压暗"由底色渐变管，所以同一张织物染成深蓝、炭灰、酒红、品牌色都一样。
  配方照《谷歌给苹果的两百亿》的 examples/google-apple-20b/fabric.py（那张是整屏彩色的；这里拆成灰度纹理 + 底色）。不要大块噪声：看着像一块块的脏斑。
- grain.png：细颗粒，四边无缝，巨字和全片的印刷感
- ph/：占位素材（实拍、人像抠图、头像照片、新闻截图、App 截图），只给 demo 和刚起步的片子先跑通用；写着“占位”，成片里不能出现
"""
import math, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(D, 'ph'), exist_ok=True)
rng = np.random.default_rng(20261030)


def tile_noise(n, lo, hi):
    """四边无缝的带通噪声：频域里只留 lo..hi 之间的频率"""
    f = np.fft.fftfreq(n)
    r = np.sqrt(f[:, None] ** 2 + f[None, :] ** 2) * n
    mask = np.exp(-((np.log(np.maximum(r, 1e-6)) - math.log((lo * hi) ** .5)) ** 2) / (2 * (math.log(hi / lo) / 2) ** 2))
    mask[0, 0] = 0
    z = np.fft.ifft2(np.fft.fft2(rng.standard_normal((n, n))) * mask).real
    return (z - z.mean()) / (z.std() + 1e-9)


def save_gray(a, path, mean=128, std=22, q=None):
    im = Image.fromarray(np.clip(mean + a * std, 0, 255).astype(np.uint8), 'L')
    im.save(path, quality=q) if q else im.save(path)


def wrap_blur(a, sigma):
    """四边无缝的小半径高斯模糊（按周期卷积，接缝处不会出一条线）"""
    r = max(1, int(math.ceil(sigma * 3)))
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma ** 2)); k /= k.sum()
    for ax in (0, 1):
        a = sum(w * np.roll(a, s, axis=ax) for s, w in zip(range(-r, r + 1), k))
    return a


# 织物：照 fabric.py 的配方。斜纹 tw（x+y 方向的正弦，3.2px 一个周期）+ 一行行纱线粗细不一 + 每根纱的毛糙
N = 1024                                                   # 1024 / 3.2 = 320 个周期：平铺时四边接得上
rf = np.random.default_rng(3)
y, x = np.mgrid[0:N, 0:N].astype(np.float64)
tw = np.sin((x + y) * 2 * math.pi / 3.2) * .5 + .5
yarn = rf.normal(0, 1, (N, 1)).repeat(N, 1) * .15 + rf.normal(0, 1, (N, N)) * .25
v = wrap_blur(.55 + .25 * tw + .12 * yarn, .4)
fab = v / (2 * v.mean())                                   # overlay 在暗底上 ≈ 底色 × 2b：均值 0.5，平均亮度不变，斜纹在 ±18% 上下
Image.fromarray(np.clip(fab * 255, 0, 255).astype(np.uint8), 'L').save(os.path.join(D, 'fabric.jpg'), quality=94)

# 颗粒
g = tile_noise(512, 100, 256)
save_gray(g, os.path.join(D, 'grain.png'), std=34)


# ---------- 占位素材 ----------
def font(px):
    for p in ('C:/Windows/Fonts/msyhbd.ttc', 'C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/NotoSansSC-VF.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, px)
    return ImageFont.load_default()


def stamp(im, text):
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((36, 30, 36 + 26 * len(text) + 40, 82), 10, fill=(0, 0, 0, 150) if im.mode == 'RGBA' else (20, 20, 20))
    d.text((56, 38), text, font=font(28), fill=(255, 220, 120))
    return im


def gradient(w, h, top, bot):
    t = np.linspace(0, 1, h)[:, None, None]
    return (np.array(top)[None, None] * (1 - t) + np.array(bot)[None, None] * t).repeat(w, 1)


W, H = 1920, 1080


def city():
    """夜景城市占位：深蓝天、楼的剪影、零星暗黄窗灯、地平线一层薄雾。别做成彩色光斑（虚化光点一大片，就是规则里不要的"大团颜色光"）"""
    r = np.random.default_rng(3)
    a = gradient(W, H, (6, 10, 22), (22, 26, 36)).astype(np.float32)
    yy = np.mgrid[0:H, 0:W][0]
    a += (np.exp(-((yy - H * .62) / 120) ** 2) * 16)[..., None] * np.array([1.0, .95, .9])   # 地平线薄雾
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'); d = ImageDraw.Draw(im)
    for layer, (k, base) in enumerate([(.55, H * .64), (.8, H * .72), (1.0, H * .84)]):    # 远、中、近三排楼
        x = -40
        while x < W:
            bw = r.uniform(70, 190) * (0.6 + .4 * k); bh = r.uniform(120, 460) * k
            body = tuple(int(c * (1.3 - .5 * k)) for c in (14, 18, 28))
            d.rectangle((x, base - bh, x + bw, H), fill=body)
            for wy in np.arange(base - bh + 16, base - 10, 22 * k + 6):
                for wx in np.arange(x + 10, x + bw - 12, 18 * k + 8):
                    if r.random() < .16:
                        lv = r.uniform(.35, .75) * (0.6 + .4 * k)
                        d.rectangle((wx, wy, wx + 6 * k + 3, wy + 8 * k + 3), fill=tuple(int(c * lv) for c in (200, 168, 110)))
            x += bw + r.uniform(4, 30)
    im = im.filter(ImageFilter.GaussianBlur(1.1))
    stamp(im, '占位素材 · city').save(os.path.join(D, 'ph', 'city.jpg'), quality=86)


def crowd():
    """台下观众占位：从后排看过去，一排排头和肩的剪影，前面一块暗暗的冷白大屏。不要彩色光斑"""
    r = np.random.default_rng(5)
    a = gradient(W, H, (10, 12, 18), (6, 7, 10)).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    a += (np.exp(-(((xx - W / 2) / 620) ** 2 + ((yy - H * .3) / 200) ** 2)) * 70)[..., None] * np.array([.85, .9, 1.0])  # 大屏的光
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGB'); d = ImageDraw.Draw(im)
    d.rectangle((W / 2 - 520, H * .14, W / 2 + 520, H * .46), outline=(70, 76, 88), width=4)
    for row, (y0, s) in enumerate([(H * .62, .55), (H * .74, .75), (H * .9, 1.0)]):
        x = -60 + r.uniform(0, 60)
        while x < W + 60:
            c = tuple(int(v * (1.25 - .45 * s)) for v in (16, 17, 22))
            d.ellipse((x - 46 * s, y0 - 120 * s, x + 46 * s, y0 - 10 * s), fill=c)                  # 头
            d.rounded_rectangle((x - 120 * s, y0 - 30 * s, x + 120 * s, H + 40), int(70 * s), fill=c)  # 肩
            x += r.uniform(170, 240) * s
    im = im.filter(ImageFilter.GaussianBlur(1.6))
    stamp(im, '占位素材 · crowd').save(os.path.join(D, 'ph', 'crowd.jpg'), quality=86)


city()
crowd()


def servers():
    a = gradient(W, H, (6, 10, 18), (14, 22, 34)).astype(np.uint8)
    im = Image.fromarray(a, 'RGB'); d = ImageDraw.Draw(im)
    vx, vy = W / 2, H * .46
    for side in (-1, 1):
        for i in range(14):
            x0 = vx + side * (120 + i ** 1.55 * 22)
            d.line([(x0, vy - 40 - i * 18), (x0, vy + 60 + i * 26)], fill=(30, 44, 66), width=3 + i // 3)
            for j in range(10):
                yy = vy - 30 - i * 16 + j * (9 + i * 4)
                c = (60, 170, 255) if (i + j) % 3 else (90, 255, 160)
                d.ellipse((x0 + side * 8 - 2 - i * .3, yy - 2 - i * .3, x0 + side * 8 + 2 + i * .3, yy + 2 + i * .3), fill=c)
    im = im.filter(ImageFilter.GaussianBlur(1.2))
    glow = im.filter(ImageFilter.GaussianBlur(12))
    out = np.clip(np.asarray(im, np.float32) + np.asarray(glow, np.float32) * .8, 0, 255).astype(np.uint8)
    stamp(Image.fromarray(out), '占位素材 · servers').save(os.path.join(D, 'ph', 'servers.jpg'), quality=86)


servers()


def chip():
    a = gradient(W, H, (10, 26, 14), (4, 12, 8)).astype(np.uint8)
    im = Image.fromarray(a, 'RGB'); d = ImageDraw.Draw(im)
    r = np.random.default_rng(9)
    for _ in range(260):
        x0, y0 = r.uniform(0, W), r.uniform(0, H)
        for _ in range(4):
            if r.random() < .5: x1, y1 = x0 + r.uniform(-260, 260), y0
            else: x1, y1 = x0, y0 + r.uniform(-200, 200)
            d.line([(x0, y0), (x1, y1)], fill=(160, 140, 60), width=2)
            x0, y0 = x1, y1
        d.ellipse((x0 - 4, y0 - 4, x0 + 4, y0 + 4), fill=(220, 190, 90))
    d.rounded_rectangle((W / 2 - 300, H / 2 - 260, W / 2 + 300, H / 2 + 260), 24, fill=(18, 20, 22), outline=(120, 200, 110), width=4)
    for i in range(12):
        for j in range(10):
            d.rectangle((W / 2 - 260 + i * 44, H / 2 - 220 + j * 44, W / 2 - 230 + i * 44, H / 2 - 190 + j * 44), fill=(40, 90, 50))
    glow = im.filter(ImageFilter.GaussianBlur(10))
    out = np.clip(np.asarray(im, np.float32) * .9 + np.asarray(glow, np.float32) * .6, 0, 255).astype(np.uint8)
    stamp(Image.fromarray(out), '占位素材 · chip').save(os.path.join(D, 'ph', 'chip.jpg'), quality=86)


chip()


def site():
    a = gradient(W, H, (120, 110, 100), (60, 48, 40)).astype(np.uint8)
    im = Image.fromarray(a, 'RGB'); d = ImageDraw.Draw(im)
    d.rectangle((0, H * .62, W, H), fill=(78, 64, 52))
    r = np.random.default_rng(4)
    for i in range(9):
        x0 = 80 + i * 210; h = r.uniform(180, 420)
        d.rectangle((x0, H * .62 - h, x0 + 160, H * .62), fill=(170, 172, 176), outline=(110, 112, 118), width=3)
        for k in range(int(h // 40)):
            d.line([(x0, H * .62 - k * 40), (x0 + 160, H * .62 - k * 40)], fill=(130, 132, 136), width=2)
    d.line([(1500, 120), (1500, H * .62)], fill=(230, 170, 40), width=14)
    d.line([(1100, 150), (1820, 150)], fill=(230, 170, 40), width=12)
    im = im.filter(ImageFilter.GaussianBlur(1.5))
    stamp(im, '占位素材 · site').save(os.path.join(D, 'ph', 'site.jpg'), quality=86)


site()


def stage_light():
    a = gradient(W, H, (6, 6, 10), (16, 14, 20)).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    cone = np.clip(1 - np.abs(xx - W / 2) / (120 + (yy / H) * 520), 0, 1) ** 1.5 * (yy / H) ** .6
    a += cone[..., None] * np.array([118, 120, 130])
    floor = np.exp(-(((xx - W / 2) / 520) ** 2 + ((yy - H * .86) / 90) ** 2))
    a += floor[..., None] * np.array([140, 142, 150])
    stamp(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)), '占位素材 · stage').save(os.path.join(D, 'ph', 'stage.jpg'), quality=86)


stage_light()


def person():
    """人像抠图占位：半身剪影（透明底），只为看构图"""
    w, h = 1000, 1300
    m = Image.new('L', (w, h), 0); d = ImageDraw.Draw(m)
    d.ellipse((w / 2 - 150, 120, w / 2 + 150, 500), fill=255)                      # 头
    d.rectangle((w / 2 - 70, 440, w / 2 + 70, 600), fill=255)                      # 脖子
    d.rounded_rectangle((w / 2 - 430, 560, w / 2 + 430, h + 200), 240, fill=255)   # 肩和身子
    m = m.filter(ImageFilter.GaussianBlur(2))
    yy, xx = np.mgrid[0:h, 0:w]
    shade = 70 + 60 * np.exp(-(((xx - w * .42) / 360) ** 2 + ((yy - 300) / 420) ** 2))
    rgb = np.stack([shade * .9, shade * .95, shade * 1.08], -1)
    im = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), 'RGB').convert('RGBA')
    im.putalpha(m)
    dd = ImageDraw.Draw(im)
    dd.text((w / 2 - 130, 640), '人像占位', font=font(64), fill=(255, 220, 120, 255))
    im.save(os.path.join(D, 'ph', 'person.png'))


def news(name, head, sub):
    """新闻截图占位（desk、popup 的示例用）：通用版式，不仿任何真实网站"""
    w, h = 1280, 800
    im = Image.new('RGB', (w, h), (252, 252, 250)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 86), fill=(30, 33, 40))
    d.text((48, 22), '占位新闻 · PLACEHOLDER', font=font(34), fill=(255, 220, 120))
    d.rounded_rectangle((48, 130, 200, 176), 6, fill=(184, 40, 47)); d.text((64, 134), '财经', font=font(30), fill=(255, 255, 255))
    d.text((220, 136), '2026-10-30', font=font(28), fill=(120, 124, 132))
    y = 210
    for ln in head:
        d.text((48, y), ln, font=font(66), fill=(23, 25, 29)); y += 92
    d.text((48, y + 10), sub, font=font(34), fill=(90, 94, 102)); y += 90
    for i in range(6):
        d.rounded_rectangle((48, y + i * 52, w - 48 - (i % 3) * 140, y + i * 52 + 22), 8, fill=(222, 224, 228))
    im.save(os.path.join(D, 'ph', f'{name}.jpg'), quality=86)


news('news_a', ['公司甲宣布：2026 年', 'AI 投入翻倍'], '这是示例新闻截图，换成 snap_news.mjs 截的原文')
news('news_b', ['公司乙：明年数据中心', '支出再加三成'], '这是示例新闻截图，换成 snap_news.mjs 截的原文')
news('news_c', ['公司丙上调资本开支', '预期'], '这是示例新闻截图，换成 snap_news.mjs 截的原文')
news('news_d', ['公司丁：算力不够', '还要继续买'], '这是示例新闻截图，换成 snap_news.mjs 截的原文')


def news_box(lines, line, word):
    """占位新闻里某个词的框 [x,y,w,h]（截图像素），demo 的荧光笔用"""
    f = font(66); s = lines[line]; i = s.index(word)
    return [round(48 + f.getlength(s[:i])) - 4, 210 + line * 92 + 4, round(f.getlength(word)) + 8, 80]


def portrait(name, top, bot, light, seed):
    """头像照片占位（圆盘的 photo 用）：虚化的室内背景 + 半身剪影 + 侧光，只为看照片圆盘的样子"""
    w = h = 900
    r = np.random.default_rng(seed)
    a = gradient(w, h, top, bot).astype(np.float32)
    glow = Image.new('RGB', (w, h), 0); d = ImageDraw.Draw(glow)
    for _ in range(26):
        cx, cy, rad = r.uniform(0, w), r.uniform(0, h * .7), r.uniform(30, 110)
        k = r.uniform(.25, .7); d.ellipse((cx - rad, cy - rad, cx + rad, cy + rad), fill=tuple(int(v * k) for v in light))
    a += np.asarray(glow.filter(ImageFilter.GaussianBlur(28)), np.float32) * .55
    m = Image.new('L', (w, h), 0); dm = ImageDraw.Draw(m)
    dm.ellipse((w / 2 - 130, 150, w / 2 + 130, 480), fill=255)                       # 头
    dm.rectangle((w / 2 - 62, 430, w / 2 + 62, 590), fill=255)                       # 脖子
    dm.rounded_rectangle((w / 2 - 330, 560, w / 2 + 330, h + 240), 210, fill=255)    # 肩
    m = m.filter(ImageFilter.GaussianBlur(3))
    yy, xx = np.mgrid[0:h, 0:w]
    shade = 46 + 70 * np.exp(-(((xx - w * .38) / 260) ** 2 + ((yy - 330) / 380) ** 2))  # 左上来的光
    body = np.stack([shade * 1.05, shade * .98, shade * .95], -1)
    al = np.asarray(m, np.float32)[..., None] / 255
    out = a * (1 - al) + body * al
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB')
    ImageDraw.Draw(im).text((w / 2 - 56, 96), '占位', font=font(48), fill=(255, 220, 120))
    im.save(os.path.join(D, 'ph', f'{name}.jpg'), quality=86)


portrait('face_a', (70, 64, 58), (30, 28, 30), (255, 214, 160), 11)    # 暖色室内
portrait('face_b', (40, 56, 78), (16, 20, 30), (150, 190, 255), 12)    # 冷色舞台
portrait('face_c', (62, 70, 64), (24, 28, 26), (220, 235, 210), 13)    # 灰绿


def tvclip():
    """新闻台画面占位（popup 示例）：两个人像剪影 + 底部新闻条"""
    a = gradient(W, H, (40, 52, 70), (18, 22, 30)).astype(np.uint8)
    im = Image.fromarray(a, 'RGB'); d = ImageDraw.Draw(im)
    for cx in (700, 1220):
        d.ellipse((cx - 110, 260, cx + 110, 500), fill=(120, 128, 140)); d.rounded_rectangle((cx - 260, 480, cx + 260, 1100), 160, fill=(92, 100, 114))
    d.rectangle((0, 860, W, 980), fill=(176, 26, 34)); d.rectangle((0, 980, W, 1040), fill=(20, 20, 24))
    d.text((60, 880), '占位：新闻台画面 · 新闻条本身就是证据', font=font(60), fill=(255, 255, 255))
    stamp(im, '占位素材 · tv').save(os.path.join(D, 'ph', 'tv.jpg'), quality=86)


def app():
    """竖屏 App 截图占位（device 场景用）：通用界面，不仿任何真实 App"""
    w, h = 1080, 2340
    im = Image.new('RGB', (w, h), (246, 247, 250)); d = ImageDraw.Draw(im)
    d.rectangle((0, 0, w, 220), fill=(30, 33, 40))
    d.text((60, 110), '占位 App · PLACEHOLDER', font=font(52), fill=(255, 220, 120))
    y = 280
    for i in range(7):
        d.rounded_rectangle((48, y, w - 48, y + 250), 28, fill=(255, 255, 255), outline=(225, 228, 234), width=3)
        d.ellipse((84, y + 50, 234, y + 200), fill=[(118, 185, 0), (16, 163, 127), (66, 133, 244), (234, 67, 53)][i % 4])
        d.text((270, y + 60), f'示例条目 {i + 1}', font=font(54), fill=(23, 25, 29))
        d.rounded_rectangle((270, y + 150, 270 + 300 + (i % 3) * 90, y + 180), 10, fill=(222, 224, 228))
        d.text((w - 300, y + 90), f'+{12 + i * 7}%', font=font(54), fill=(16, 163, 127))
        y += 290
    im.save(os.path.join(D, 'ph', 'app.jpg'), quality=86)


tvclip()
person()
app()
print('news_b 里「再加三成」的框（demo 的 desk 荧光笔）:', news_box(['公司乙：明年数据中心', '支出再加三成'], 1, '再加三成'))
print('ok', sorted(os.listdir(D)), sorted(os.listdir(os.path.join(D, 'ph'))))
