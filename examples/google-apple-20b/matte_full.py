# 整帧抠人：pim/0001.jpg… → film/pc/001.png…（1920×1080 RGBA，和原片同位置）
import sys, glob, os
import numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
src, dst, model = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(dst, exist_ok=True)
s = ort.InferenceSession(model, providers=['CPUExecutionProvider']); inp = s.get_inputs()[0].name
prev = None
for i, f in enumerate(sorted(glob.glob(os.path.join(src, '*.jpg'))), 1):
    im = Image.open(f).convert('RGB')
    x = np.asarray(im.resize((1024, 1024), Image.BILINEAR), np.float32) / 255
    x = x / max(x.max(), 1e-6) - 0.5
    m = s.run(None, {inp: x.transpose(2, 0, 1)[None]})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min() + 1e-6)
    a = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(im.size, Image.BILINEAR), np.float32)
    if prev is not None: a = np.where((a > 8) & (a < 247), 0.6 * a + 0.4 * prev, a)   # 只平滑半透明边
    prev = a
    out = im.copy(); out.putalpha(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)))
    out.save(os.path.join(dst, '%03d.png' % i)); print(i, end=' ', flush=True)
