"""Contact sheets for visual inspection; original screenshots remain untouched."""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont

root=Path.cwd()
out=root/'outputs/P2-3-visual-review'
out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',14)
shots=root/'outputs/slider-check'
report=json.loads((shots/'report.json').read_text(encoding='utf-8'))['screenshots']
ids=sorted({r['id'] for r in report},key=lambda s:tuple(map(int,s.split('.'))))
boards=[]
for lecture in ids:
    rows=[r for r in report if r['id']==lecture]
    sliders=sorted({r['slider'] for r in rows})
    def plot_image(name,width):
        im=Image.open(shots/name).convert('RGB')
        im=im.crop((0,0,min(640,im.width),im.height))
        im.thumbnail((width,10000))
        return im
    default=plot_image(f'{lecture}-default.png',220)
    thumbs={}
    for r in rows:
        thumbs[r['slider'],r['end']]=plot_image(r['file'],135)
    row_height=max(im.height for im in thumbs.values())+44
    board=Image.new('RGB',(235+len(sliders)*145,max(default.height+30,row_height*2)), 'white')
    d=ImageDraw.Draw(board)
    d.text((4,4),lecture+' 默认',font=font,fill='black')
    board.paste(default,(0,27))
    for col,slider in enumerate(sliders):
        for row,end in enumerate(['min','max']):
            r=next(r for r in rows if r['slider']==slider and r['end']==end)
            x,y=235+145*col,row*row_height
            d.text((x,y+2),f"{slider} {end}={r['value']:g}",font=font,fill='black')
            board.paste(thumbs[slider,end],(x,y+27))
    target=out/f'{lecture}-defaults-and-ends.png'
    board.save(target)
    boards.append({'lecture':lecture,'board':target.name,'screenshots':[f'{lecture}-default.png']+[r['file'] for r in rows]})
(out/'manifest.json').write_text(json.dumps(boards,ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(boards)} boards, {sum(len(b["screenshots"]) for b in boards)} original screenshots')
