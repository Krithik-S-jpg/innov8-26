from pathlib import Path
from PIL import Image
import numpy as np, cv2, subprocess

SRC=Path('a_clean_high_resolution_sprite_sheet_multi_fram.png')
OUT=Path('intro_frames'); OUT.mkdir(exist_ok=True)

im=np.array(Image.open(SRC).convert('RGB'))
h,w=im.shape[:2]
xs=[round(i*w/4) for i in range(5)]
ys=[round(i*h/4) for i in range(5)]
for idx in range(16):
    r,c=divmod(idx,4)
    crop=im[ys[r]:ys[r+1], xs[c]:xs[c+1]]
    bgr=cv2.cvtColor(crop,cv2.COLOR_RGB2BGR)
    hsv=cv2.cvtColor(bgr,cv2.COLOR_BGR2HSV)
    cand=((hsv[:,:,1]<12)&(hsv[:,:,2]>215)).astype(np.uint8)
    n,labels,stats,_=cv2.connectedComponentsWithStats(cand,8)
    bg=np.zeros(cand.shape,np.uint8)
    for lab in range(1,n):
        x,y,ww,hh,area=stats[lab]
        if x==0 or y==0 or x+ww==cand.shape[1] or y+hh==cand.shape[0]:
            bg[labels==lab]=255
    bg=cv2.dilate(bg,np.ones((3,3),np.uint8),iterations=1)
    rgba=np.dstack([crop,255-bg])
    Image.fromarray(rgba,'RGBA').resize((220,220),Image.Resampling.LANCZOS).save(OUT/f'frame_{idx:02d}.png')

subprocess.run(['ffmpeg','-y','-framerate','30','-i',str(OUT/'frame_%02d.png'),'-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','intro_animation.mov'],check=True)
print('Created 220x220 transparent WebM.')
