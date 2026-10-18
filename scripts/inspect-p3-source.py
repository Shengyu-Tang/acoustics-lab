from pathlib import Path
import json, fitz
root=Path(__file__).resolve().parent.parent
notes=json.loads((root/'specs/redesign/P3-source-notes.json').read_text(encoding='utf8'))
pdf=fitz.open(root.parent/'04-声学基础课件资料'/'中国大学慕课-振动与声基础-ppt'/notes['3.8.4']['source'])
print('3.8.4 pages',len(pdf))
for i,page in enumerate(pdf): print(i+1,page.get_text()[:500])
(root/'outputs/source-pages').mkdir(parents=True,exist_ok=True)
for i in range(max(0,len(pdf)-3),len(pdf)):
    pdf[i].get_pixmap(matrix=fitz.Matrix(1.3,1.3)).save(root/f'outputs/source-pages/3.8.4-{i+1}.png')
