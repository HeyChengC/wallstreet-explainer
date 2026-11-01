import numpy as np
from PIL import Image, ImageFilter
W,H=1920,1080; rng=np.random.default_rng(3)
y,x=np.mgrid[0:H,0:W].astype(np.float32)
# 细斜纹：3px 周期的 45° 纹 + 纱线粗细抖动
tw=np.sin((x+y)*2*np.pi/3.2)*0.5+0.5
yarn=np.repeat(rng.normal(0,1,(H,1)),W,1)*0.15+rng.normal(0,1,(H,W))*0.25
v=0.55+0.25*tw+0.12*yarn
# 中间略亮
cx,cy=(x-W/2)/W,(y-H*0.45)/H; vig=np.clip(1.15-1.6*(cx**2+cy**2*1.4),0.35,1.15)
base=np.array([16,26,44],np.float32)
img=np.clip(base[None,None,:]*(v*vig)[...,None],0,255).astype(np.uint8)
Image.fromarray(img).filter(ImageFilter.GaussianBlur(0.4)).save('fabric.jpg',quality=92)
def tinted(c,name):
    t=np.clip(np.array(c,np.float32)[None,None,:]*(v*vig)[...,None],0,255).astype(np.uint8)
    Image.fromarray(t).filter(ImageFilter.GaussianBlur(0.4)).save(name,quality=92)
tinted([22,62,140],'fabric_gblue.jpg')
