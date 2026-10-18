"""Verify original MOOC files read-only; save provenance only inside this clone."""
from pathlib import Path
import hashlib
import json
import re
import fitz

root = Path(__file__).resolve().parent.parent
base = root.parent / '04-声学基础课件资料' / '中国大学慕课-振动与声基础-ppt'
topics = {t['id']: t for t in json.loads((root / 'src/topics.json').read_text(encoding='utf-8'))}
ids = json.loads((root / 'src/content/homeCatalog.json').read_text(encoding='utf-8'))['completed']
snapshots = {}
coverage_by_id = {}
for batch in ['P2', 'P3', 'P4']:
    notes = json.loads((root / f'specs/redesign/{batch}-source-notes.json').read_text(encoding='utf-8'))
    snapshots.update(notes)
    for id in notes:
        coverage_by_id[id] = f'{batch}-source-notes.json' if batch == 'P2' else f'{batch}-summary-coverage.md'
records = []
for id in ids:
    source = base / topics[id]['source']
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    with fitz.open(source) as pdf:
        if id in snapshots:
            note = snapshots[id]
            assert len(pdf) == note['pages'], id
            if 'sha256' in note:
                assert digest == note['sha256'], id
            for page, text in note['summary']:
                assert pdf[page - 1].get_text() == text, (id, page)
            summary_pages = [p for p, _ in note['summary']]
        else:
            summary_pages = [i + 1 for i, page in enumerate(pdf) if '总结' in re.sub(r'\s', '', page.get_text())]
            assert summary_pages, id
        records.append(dict(id=id, source=source.name, sha256=digest, pages=len(pdf), summaryPages=summary_pages,
                            coverage=coverage_by_id.get(id, 'P1-polish-source-notes.md')))
out = root / 'specs/redesign/evidence/P6/source-verification.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(dict(readOnly=True, lectures=len(records), snapshotSummariesVerified=len(snapshots), records=records), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'PASS: {len(records)} original PDFs read only, {len(snapshots)} summary snapshots verified; P1 coverage retained from accepted audit.')
