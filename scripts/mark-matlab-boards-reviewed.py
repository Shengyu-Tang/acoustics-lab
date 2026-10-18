"""Record sheets actually opened for visual review, keyed to source PNG hashes."""
import json, sys
from pathlib import Path
folder = Path('outputs/matlab-backlog-review')
manifest = json.loads((folder / 'manifest.json').read_text(encoding='utf-8'))
target = folder / 'reviewed.json'
reviewed = json.loads(target.read_text(encoding='utf-8')) if target.exists() else []
seen = {(r['png'], r['sha256'], r['strip']) for r in reviewed}
for name in sys.argv[1:]:
    board = next(b for b in manifest if Path(b['board']).name == name)
    for r in board['images']:
        key = (r['png'], r['sha256'], r['strip'])
        if key not in seen:
            reviewed.append(r)
            seen.add(key)
target.write_text(json.dumps(reviewed, indent=2), encoding='utf-8')
print(f'{len(seen)} inspected image strips recorded.')
