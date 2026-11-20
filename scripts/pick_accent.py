# -*- coding: utf-8 -*-
"""从一帧画面里挑强调色（给 KIT_VPRO.theme({accent}) 用）：python pick_accent.py <图> [<图> ...]
有口播：给她的一两帧（assets/clips/host/0100.jpg）。没有口播：给主图。
做法：看画面中间偏下那一块（她的衣服一般在这），把有颜色的像素按色相分堆，报最大的三堆；
每堆给一个"原色"和一个"能当强调色用的"（提亮、饱和度拉到够在深色卡上看清）。挑和主体最贴的那个，不要挑肤色和木头色（橙棕）。"""
import sys, colorsys
import numpy as np
from PIL import Image


def pick(path):
    im = Image.open(path).convert('RGB'); im.thumbnail((480, 480)); a = np.asarray(im, np.float32) / 255
    h, w, _ = a.shape; reg = a[int(h * .42):int(h * .9), int(w * .2):int(w * .8)].reshape(-1, 3)
    hsv = np.array([colorsys.rgb_to_hsv(*p) for p in reg[::3]])
    keep = hsv[(hsv[:, 1] > .14) & (hsv[:, 2] > .22) & (hsv[:, 2] < .95)]
    if len(keep) < 50: return []
    bins = (keep[:, 0] * 24).astype(int) % 24; out = []
    for b in np.argsort(-np.bincount(bins, weights=keep[:, 1], minlength=24))[:3]:
        g = keep[bins == b]; share = len(g) / len(keep)
        if share < .06: continue
        hh, ss, vv = np.median(g[:, 0]), np.median(g[:, 1]), np.median(g[:, 2])
        ha = hh + (.67 - hh) * .6 if .70 < hh < .95 else hh          # 紫红往蓝紫收一档：参考片的强调色偏冷，粉紫显得甜
        raw = colorsys.hsv_to_rgb(hh, ss, vv); acc = colorsys.hsv_to_rgb(ha, min(.62, max(.42, ss * 1.5)), .93)
        hx = lambda c: '#' + ''.join(f'{round(x * 255):02x}' for x in c)
        skin = .02 < hh < .12
        out.append((share, hx(raw), hx(acc), '（像肤色或木头色，一般不选）' if skin else ''))
    return out


for p in sys.argv[1:]:
    print(p)
    for share, raw, acc, note in pick(p) or [(0, '-', '-', '画面里没什么颜色：用默认的 #8a86ee，或自己定一个冷色')]:
        print(f'  占 {share:4.0%}  原色 {raw}  →  强调色 {acc}  {note}')
