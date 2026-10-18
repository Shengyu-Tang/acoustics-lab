"""Read original MOOC files without modifying them; snapshot summaries and questions."""
from pathlib import Path
import hashlib, json, re, zipfile
import xml.etree.ElementTree as ET
import fitz
root = Path(__file__).resolve().parent.parent
base = root.parent / '04-声学基础课件资料'
topics = {t['id']: t for t in json.loads((root/'src/topics.json').read_text(encoding='utf-8')) if re.match(r'^3\.(6|7|8|9|10)\.', t['id'])}
docx = next((base/'中国大学慕课-振动与声基础-内容简介及思考题').glob('*.docx'))
with zipfile.ZipFile(docx) as z:
    doc = ET.fromstring(z.read('word/document.xml'))
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
questions, current, active = {}, None, False
for p in doc.findall('.//w:body/w:p', ns):
    text = ''.join(e.text or '' for e in p.iter() if e.tag.endswith('}t'))
    m = re.match(r'^(\d+\.\d+(?:\.\d+)?)\s', text)
    if m: current, active = m[1], False
    if text == '思考题：': active = True
    elif current in topics and active and re.match(r'^\d+、',text): questions.setdefault(current,[]).append(text)
notes = {}
for id,t in topics.items():
    file = base/'中国大学慕课-振动与声基础-ppt'/t['source']
    with fitz.open(file) as pdf:
        pages = [[i+1,p.get_text()] for i,p in enumerate(pdf) if '总结' in re.sub(r'\s','',p.get_text())]
        if not pages: pages = [[len(pdf),pdf[-1].get_text()]]
        notes[id] = dict(source=t['source'],pages=len(pdf),summary=pages,questions=questions.get(id,[]),sha256=hashlib.sha256(file.read_bytes()).hexdigest(),questionSourceSha256=hashlib.sha256(docx.read_bytes()).hexdigest())
        if '--verify' in __import__('sys').argv: assert notes[id]['questions'] == t['questions'], id
out = root/'specs/redesign/P3-source-notes.json'
if '--verify' in __import__('sys').argv:
    assert json.loads(out.read_text(encoding='utf-8')) == notes
else: out.write_text(json.dumps(notes,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for id,n in notes.items():
    print(id, '\n', '\n'.join(t for _,t in n['summary']), '\n思考题:', '\n'.join(n['questions']))
