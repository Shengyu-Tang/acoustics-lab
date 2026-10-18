"""Extract DOCX calendar text using only Python's standard library."""

import json
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
W = "{" + NS["w"] + "}"


def text(paragraph):
    return "".join(
        (node.text or "") if node.tag == W + "t"
        else "\n" if node.tag in (W + "br", W + "cr")
        else "\t" if node.tag == W + "tab" else ""
        for node in paragraph.iter()
    )


with zipfile.ZipFile(sys.argv[1], "r") as archive:
    document = ET.fromstring(archive.read("word/document.xml"))

print(json.dumps({
    "paragraphs": [text(p) for p in document.findall("w:body/w:p", NS)],
    "rows": [
        ["\n".join(text(p) for p in cell.findall("w:p", NS))
         for cell in row.findall("w:tc", NS)]
        for row in document.findall(".//w:tr", NS)
    ],
}, ensure_ascii=False))
