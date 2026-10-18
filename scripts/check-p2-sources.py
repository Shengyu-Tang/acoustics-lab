"""Read-only MOOC provenance check. Run where the teacher's sibling sources exist.
Requires PyMuPDF; npm test uses the checked-in snapshot so CI needs no private files.
"""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import zipfile
import fitz

root = Path(__file__).resolve().parent.parent
base = root.parent / "04-声学基础课件资料"
notes_path = root / "specs/redesign/P2-source-notes.json"
notes = json.loads(notes_path.read_text(encoding="utf-8"))
topics = {t["id"]: t for t in json.loads((root / "src/topics.json").read_text(encoding="utf-8"))}
docx = next((base / "中国大学慕课-振动与声基础-内容简介及思考题").glob("*.docx"))
with zipfile.ZipFile(docx) as archive:
    doc = ET.fromstring(archive.read("word/document.xml"))
ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
questions, current, active = {}, None, False
for paragraph in doc.findall(".//w:body/w:p", ns):
    text = "".join(e.text or "" for e in paragraph.iter() if e.tag.endswith("}t"))
    match = re.match(r"^(\d+\.\d+(?:\.\d+)?)\s", text)
    if match:
        current, active = match[1], False
    if text == "思考题：":
        active = True
    elif current in notes and active and re.match(r"^\d+、", text):
        questions.setdefault(current, []).append(text)
for lecture_id, note in notes.items():
    source = base / "中国大学慕课-振动与声基础-ppt" / note["source"]
    with fitz.open(source) as pdf:
        assert len(pdf) == note["pages"], lecture_id
        for page, expected in note["summary"]:
            assert pdf[page-1].get_text() == expected, (lecture_id, page)
    assert questions[lecture_id] == note["questions"] == topics[lecture_id]["questions"], lecture_id
    if "sha256" in note:
        assert hashlib.sha256(source.read_bytes()).hexdigest() == note["sha256"], lecture_id
    if "questionSourceSha256" in note:
        assert hashlib.sha256(docx.read_bytes()).hexdigest() == note["questionSourceSha256"]
print(f"PASS: {len(notes)} original MOOC summaries and {sum(map(len, questions.values()))} verbatim questions; all sources read only.")
