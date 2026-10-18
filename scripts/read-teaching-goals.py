"""Read teaching objectives without extracting or modifying the source DOCX files."""

import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def text(element):
    return "".join(node.text or "" for node in element.findall(".//w:t", NS)).strip()


def clean_goal(value):
    # Internal assessment notes are suffixes, never part of the student objective.
    value = re.split(r"达成证据\s*[:：]|支撑\s*C", value)[0].rstrip("；; \t\u3000")
    return re.sub(r"^\d+[.．、]\s*", "", value)


def read_file(file):
    with zipfile.ZipFile(file, "r") as archive:
        return ET.fromstring(archive.read("word/document.xml")).find("w:body", NS)


def extract(file, default_number=None):
    number = default_number
    active = False
    found = {}
    for element in read_file(file):
        value = text(element)
        heading = re.match(r"^第\s*(\d+)\s*次课\s", value)
        if heading:
            number = int(heading[1])
            active = False
        if re.match(r"^二[、\s]*教学目标", value):
            active = True
            continue
        if re.match(r"^三[、\s]", value):
            active = False
        if not active or number is None:
            continue
        if element.tag.endswith("}tbl"):
            # Earlier collections put objectives and assessment in separate columns.
            candidates = [text(row.find("w:tc", NS)) for row in element.findall("w:tr", NS)]
        else:
            candidates = [value]
        for candidate in candidates:
            if re.match(r"^\d+[.．、]\s*", candidate):
                found.setdefault(number, []).append(clean_goal(candidate))
    return found


source = Path(sys.argv[1])
result = {}
for folder in ["20261018督导版教学设计", "20261008公文式随堂教学设计"]:
    # Prefer individual sessions, then the complete collection, then partial collections.
    files = sorted((source / folder).glob("*.docx"), key=lambda f: (
        0 if re.match(r"第\d+次课", f.name) else 1 if "全学期" in f.name else 2, f.name
    ))
    for file in files:
        if file.name.startswith("~$"):
            continue
        match = re.match(r"第(\d+)次课", file.name)
        for number, goals in extract(file, int(match[1]) if match else None).items():
            # Sessions 5–24 must use the current, individual supervisory designs.
            if number in result or not 1 <= number <= 24:
                continue
            if number >= 5 and (folder != "20261018督导版教学设计" or not match):
                continue
            result[number] = {"goals": goals, "source": str(file.relative_to(source))}

print(json.dumps(result, ensure_ascii=False))
