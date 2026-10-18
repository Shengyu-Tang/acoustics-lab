"""Build legible review boards, retaining original PNGs beside them."""
from pathlib import Path
import json,re
from PIL import Image,ImageDraw,ImageFont
import fitz
root=Path(__file__).resolve().parent.parent
out=root/'outputs/P3-evidence-review';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
shots=root/'specs/redesign/screenshots/P3'
for desktop in sorted(shots.glob('*-figure*-desktop.png')):
    mobile=desktop.with_name(desktop.name.replace('-desktop','-mobile'))
    if not mobile.exists():continue
    images=[]
    for file in [desktop,mobile]:
        im=Image.open(file).convert('RGB');im.thumbnail((640,2200));images.append(im)
    board=Image.new('RGB',(sum(im.width for im in images)+12,max(im.height for im in images)+30),'white')
    draw=ImageDraw.Draw(board);draw.text((6,4),desktop.stem.replace('-desktop','')+' 桌面 / 手机',font=font,fill='black')
    x=0
    for im in images:board.paste(im,(x,30));x+=im.width+12
    board.save(out/(desktop.stem.replace('-desktop','')+'.png'))
notes=json.loads((root/'specs/redesign/P3-source-notes.json').read_text(encoding='utf8'))
pages=[]
for id,note in notes.items():
    pdf=fitz.open(root.parent/'04-声学基础课件资料'/'中国大学慕课-振动与声基础-ppt'/note['source'])
    for page,_ in note['summary']:
        pix=pdf[page-1].get_pixmap(matrix=fitz.Matrix(1,1));im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
        im.thumbnail((620,450));pages.append((id,page,im))
for i in range(0,len(pages),6):
    board=Image.new('RGB',(1240,3*485),'white');draw=ImageDraw.Draw(board)
    for j,(id,page,im) in enumerate(pages[i:i+6]):
        x=(j%2)*620;y=(j//2)*485;draw.text((x+8,y+4),f'{id} PPT 总结 第 {page} 页',font=font,fill='black');board.paste(im,(x,y+28))
    board.save(out/f'sources-{i//6+1}.png')
print(len(list(out.glob('*.png'))),'figure/source review boards')
