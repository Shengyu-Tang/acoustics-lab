"""Create hash-linked contact sheets from successful current MATLAB exports."""
import hashlib
import json
import re
import sys
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path.cwd()
audit = root / 'outputs/bug-audit-1'
out = audit / 'matlab-review'
out.mkdir(parents=True, exist_ok=True)
manifest_path = out / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else []
wide = '--wide-details' in sys.argv
mode = 'columns' if wide else 'overview'
seen = {(r['png'], r['sha256']) for b in manifest for r in b['images']
        if r.get('detail', 'overview') == mode}
by_digest = {r['sha256']: (b, r) for b in manifest for r in b['images']
             if r.get('detail', 'overview') == mode}
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 16)
images = []
for batch in ['', 'round2-matlab', 'final-matlab', 'final-matlab-shard2', 'legacy-matlab']:
    folder = audit / batch
    results_file = folder / 'matlab/results.json'
    if not results_file.exists():
        continue
    results = json.loads(results_file.read_text(encoding='utf-8'))
    latest = {}
    current_hashes = {}
    for r in results:
        # A later failed retry must not hide valid current-hash PNG evidence.
        if r['file'] not in current_hashes:
            source = root / r['file']
            current_hashes[r['file']] = hashlib.sha256(source.read_bytes()).hexdigest() if source.exists() else None
        if r['passed'] and r['hash'] == current_hashes[r['file']]:
            latest[r['file']] = r
    for r in latest.values():
        script = root / r['file']
        if not r['passed'] or not script.exists() or hashlib.sha256(script.read_bytes()).hexdigest() != r['hash']:
            continue
        subplot = re.search(r'subplot\(\d+,(\d+),\d+\)', script.read_text(encoding='utf-8'))
        columns = int(subplot[1]) if wide and subplot else 1
        if wide and columns == 1:
            continue
        png = folder / 'matlab' / script.stem / r['hash'][:12] / 'figure.png'
        if not png.exists():
            continue
        digest = hashlib.sha256(png.read_bytes()).hexdigest()
        relative = png.relative_to(root).as_posix()
        if (relative, digest) in seen:
            continue
        if digest in by_digest:
            board, original_record = by_digest[digest]
            board['images'].append({'png': relative, 'sha256': digest,
                                    'identicalPixelsTo': original_record['png'], 'detail': mode})
            seen.add((relative, digest))
            continue
        original = Image.open(png).convert('RGB')
        # Preserve subplot text: split tall figures into overlapping strips.
        for column in range(columns):
            left = max(0, round(column * original.width / columns) - 20)
            right = min(original.width, round((column + 1) * original.width / columns) + 20)
            part = original.crop((left, 0, right, original.height))
            part = part.resize((560, round(part.height * 560 / part.width)))
            strips = max(1, math.ceil(part.height / 600))
            for strip in range(strips):
                top = max(0, round(strip * part.height / strips) - 20)
                bottom = min(part.height, round((strip + 1) * part.height / strips) + 20)
                label = script.stem + (f' C{column+1}/{columns}' if wide else '')
                images.append((label, part.crop((0, top, 560, bottom)),
                               {'png': relative, 'sha256': digest, 'strip': strip + 1,
                                'strips': strips, 'detail': mode, 'column': column+1}))
for start in range(0, len(images), 6):
    tiles = images[start:start + 6]
    height = max(im.height for _, im, _ in tiles) + 44
    board = Image.new('RGB', (3 * 580, math.ceil(len(tiles) / 3) * height), '#ededed')
    draw = ImageDraw.Draw(board)
    for i, (name, im, record) in enumerate(tiles):
        x, y = i % 3 * 580, i // 3 * height
        draw.text((x + 4, y + 3), name.replace('__lab_topic_', '').replace('__cases_project_', '')[:57], font=font, fill='black')
        draw.text((x + 4, y + 23), f"strip {record['strip']}/{record['strips']}", font=font, fill='black')
        board.paste(im, (x + 8, y + 44))
    filename = out / f'board-{len(manifest):03}.png'
    board.save(filename)
    manifest.append({'board': filename.relative_to(root).as_posix(), 'reviewed': False,
                     'images': [r for _, _, r in tiles]})
manifest_path.write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({'boards': len(manifest), 'unreviewed': [b['board'] for b in manifest if not b['reviewed']],
                  'pngs': len({r['png'] for b in manifest for r in b['images']})}))
