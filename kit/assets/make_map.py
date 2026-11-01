# -*- coding: utf-8 -*-
"""生成 map 场景用的点阵世界地图（只画陆地，不画国界：示意用，避开边界问题）。产物已经提交，只在改样式时重跑。
  python kit/assets/make_map.py <world-atlas 的 land-50m.json>
  land-50m.json 来自 npm 包 world-atlas@2（Natural Earth 数据，公有领域）：npm pack world-atlas@2 --registry=https://registry.npmmirror.com
输出 worldmap.png：等距圆柱投影，经度 -180..180 → x 0..3600，纬度 84..-58 → y 0..1420（每度 10 像素）。
kit.js 的 KIT.lonlat(lon, lat) 用同一套换算把经纬度变成地图上的坐标。"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
PX, LAT0, LAT1 = 10, 84, -58
W, H = 360 * PX, (LAT0 - LAT1) * PX
topo = json.load(open(sys.argv[1], encoding='utf-8'))
sx, sy = topo['transform']['scale']; tx, ty = topo['transform']['translate']
arcs = []
for a in topo['arcs']:
    x = y = 0; pts = []
    for dx, dy in a:
        x += dx; y += dy; pts.append((x * sx + tx, y * sy + ty))
    arcs.append(pts)


def ring(idx):
    out = []
    for i in idx:
        pts = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(pts if not out else pts[1:])
    return out


def to_px(lon, lat):
    return ((lon + 180) * PX, (LAT0 - lat) * PX)


S = 2  # 先画 2 倍大再缩，边缘平滑
mask = Image.new('L', (W * S, H * S), 0); d = ImageDraw.Draw(mask)


def unwrap(pts):
    """跨 180° 经线的环：经度连续展开（不然会横着拉出一条带子），画的时候左右各平移一圈"""
    out, off = [], 0
    for i, (lon, lat) in enumerate(pts):
        if i:
            dl = lon + off - out[-1][0]
            if dl > 180: off -= 360
            elif dl < -180: off += 360
        out.append((lon + off, lat))
    return out


for g in topo['objects']['land']['geometries']:
    polys = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
    for poly in polys:
        for k, r in enumerate(poly):
            ll = unwrap(ring(r))
            for shift in (-360, 0, 360):
                pts = [(x * S, y * S) for x, y in (to_px(lon + shift, lat) for lon, lat in ll)]
                if len(pts) > 2:
                    d.polygon(pts, fill=0 if k else 255)
m = np.asarray(mask.resize((W, H), Image.BILINEAR), np.float32) / 255

# 点阵：每 12 像素一个点，点在陆地上才画
step, rad = 12, 3.3
img = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
for y in range(step // 2, H, step):
    for x in range(step // 2, W, step):
        if m[y, x] > .5:
            dd.ellipse((x - rad, y - rad, x + rad, y + rad), fill=(196, 212, 230, 190))
img.save(os.path.join(D, 'worldmap.png'), optimize=True)
print('worldmap.png', W, H, os.path.getsize(os.path.join(D, 'worldmap.png')) // 1024, 'KB')
