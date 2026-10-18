from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
root=Path('specs/redesign')
out=root/'screenshots/P5/review-boards'
out.mkdir(parents=True,exist_ok=True)
def board(items,name,width=600):
    tiles=[]
    for label,image in items:
        image.thumbnail((width,1600))
        tile=Image.new('RGB',(width,max(image.height+28,100)),'white')
        ImageDraw.Draw(tile).text((6,5),label,fill='black')
        tile.paste(image,((width-image.width)//2,28));tiles.append(tile)
    h=max(x.height for x in tiles)
    canvas=Image.new('RGB',(width*len(tiles),h),'#dddddd')
    for i,t in enumerate(tiles):canvas.paste(t,(i*width,0))
    canvas.save(out/(name+'.png'))
ids=['ocean','building','industry','ultrasound','music','measurement','transport','duct','grin-lens']
for size in ['desktop','mobile']:
    for start in range(0,9,3):
        items=[]
        for id in ids[start:start+3]:
            im=Image.open(root/f'screenshots/P5/{id}-{size}.png').convert('RGB')
            items.append((id+' '+size,im.crop((0,0,im.width,min(im.height,1600)))))
        board(items,f'pages-{size}-{start//3+1}',720 if size=='desktop' else 390)
        items=[]
        for id in ids[start:start+3]:
            im=Image.open(root/f'screenshots/P5/{id}-{size}.png').convert('RGB')
            items.append((id+' '+size+' end',im.crop((0,max(0,im.height-1800),im.width,im.height))))
        board(items,f'page-ends-{size}-{start//3+1}',720 if size=='desktop' else 390)
        items=[]
        for id in ids[start:start+3]:
            im=Image.open(root/f'screenshots/P5/{id}-{size}.png').convert('RGB')
            top=max(0,(im.height-1800)//2)
            items.append((id+' '+size+' middle',im.crop((0,top,im.width,min(im.height,top+1800)))))
        board(items,f'page-middle-{size}-{start//3+1}',720 if size=='desktop' else 390)
for start in range(0,9,3):
    board([(id+' '+size,Image.open(root/f'screenshots/P5/{id}-figure1-{size}.png').convert('RGB')) for id in ids[start:start+3] for size in ['desktop','mobile']],f'figures-{start//3+1}',400)
for start in range(0,9,3):
    board([(id+' set'+str(s),Image.open(root/f'matlab-check/P5/fig_{id.replace("-","_")}_set{s}.png').convert('RGB')) for id in ids[start:start+3] for s in [0,1]],f'matlab-cases-{start//3+1}',500)
for start in range(0,5,2):
    ex=['1_2_5','3_1_3','3_1_5','3_1_8','3_6_8'][start:start+2]
    board([(id+' set'+str(s),Image.open(root/f'matlab-check/P5/fig_{id}_E1_set{s}.png').convert('RGB')) for id in ex for s in [0,1]],f'matlab-examples-{start//2+1}',600)
print(out)
