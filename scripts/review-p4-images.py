"""Build review sheets without changing the original evidence images."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,sys
root=Path.cwd();out=root/'outputs/P4/visual-review';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',16)
mode=sys.argv[1] if len(sys.argv)>1 else 'defaults'
records=[]
def sheets(files,prefix):
 for start in range(0,len(files),6):
  selected=files[start:start+6];thumbs=[]
  for file in selected:
   im=Image.open(file).convert('RGB');im.thumbnail((420,850));thumbs.append(im)
  rowheight=max(im.height for im in thumbs)+42
  board=Image.new('RGB',(3*440,2*rowheight),'white');d=ImageDraw.Draw(board)
  for i,(file,im) in enumerate(zip(selected,thumbs)):
   x,y=(i%3)*440,(i//3)*rowheight;d.text((x+4,y+3),file.name,font=font,fill='black');board.paste(im,(x,y+32))
  name=f'{prefix}-{start//6+1}.png';board.save(out/name);records.append(dict(board=name,originals=[str(f.relative_to(root)) for f in selected]))
if mode=='defaults':
 manifest=json.loads((root/'specs/redesign/screenshots/P4/manifest.json').read_text(encoding='utf8'))
 for width,prefix in [(1440,'desktop'),(390,'mobile')]:
  files=[root/r['file'] for r in manifest['captures'] if r['width']==width]
  sheets(files,prefix)
elif mode=='matlab':
 manifest=json.loads((root/'specs/redesign/matlab-check/P4/manifest.json').read_text(encoding='utf8'))
 files=[root/Path(r['file']).with_suffix('.png') for r in manifest['jobs']]
 assert all(f.exists() for f in files)
 sheets(files,'matlab')
elif mode=='prerequisites':
 folder=root/'specs/redesign/matlab-check/P3-2'
 manifest=json.loads((folder/'manifest.json').read_text(encoding='utf8'))
 sheets([root/Path(r['file']).with_suffix('.png') for r in manifest['jobs']],'review-matlab')
 report=json.loads((root/'specs/redesign/P3-2-browser-validation.json').read_text(encoding='utf8'))
 sheets([root/r['file'] for r in report['report']],'review-browser')
elif mode=='sliders':
 report=json.loads((root/'outputs/slider-check/report.json').read_text(encoding='utf8'))['screenshots']
 for id in sorted({r['id'] for r in report if r['id'][0] in '4567'}):
  rows=[r for r in report if r['id']==id];sliders=sorted({r['slider'] for r in rows})
  def thumbnail(file,width):
   im=Image.open(root/'outputs/slider-check'/file).convert('RGB');im=im.crop((0,0,min(640,im.width),im.height));im.thumbnail((width,1100));return im
  default=thumbnail(id+'-default.png',220)
  images={(r['slider'],r['end']):thumbnail(r['file'],180) for r in rows}
  rowheight=max(im.height for im in images.values())+50
  board=Image.new('RGB',(235+len(sliders)*190,max(default.height+40,2*rowheight)),'white');d=ImageDraw.Draw(board)
  d.text((4,4),id+' 默认',font=font,fill='black');board.paste(default,(0,36))
  for col,slider in enumerate(sliders):
   for row,end in enumerate(['min','max']):
    r=next(r for r in rows if r['slider']==slider and r['end']==end);x,y=235+190*col,row*rowheight;d.text((x,y+3),f"{slider} {end}={r['value']:g}",font=font,fill='black');board.paste(images[slider,end],(x,y+35))
  name=id+'-ends.png';board.save(out/name);records.append(dict(board=name,originals=[id+'-default.png']+[r['file'] for r in rows]))
(out/(mode+'-manifest.json')).write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(mode,len(records),'sheets;',sum(len(r['originals']) for r in records),'original PNGs')
