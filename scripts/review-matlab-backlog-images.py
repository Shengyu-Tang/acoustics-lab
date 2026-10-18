"""Make complete, labelled contact sheets without changing source PNGs."""
import json, math, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path.cwd()
out = root / 'outputs/matlab-backlog-review'
out.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 17)
folders = ['P2-3/P1', 'P2-3/P2', 'P3', 'P3-1', 'P4-half-polar']
manifest = []
for batch in folders:
    folder = root / 'specs/redesign/matlab-check' / batch
    results_file = folder / 'results.json'
    results = {r['filename']: r for r in json.loads(results_file.read_text(encoding='utf-8'))} if results_file.exists() else {}
    images = []
    for p in sorted(folder.glob('fig_*_set*.png')):
        if batch == 'P2-3/P1' and not p.name.startswith(('fig_1_', 'fig_2_')):
            continue
        script = p.with_suffix('.m')
        result = results.get(p.stem)
        if not script.exists() or not result or result.get('sha256') != hashlib.sha256(script.read_bytes()).hexdigest():
            continue
        original = Image.open(p).convert('RGB')
        # Split wide subplot grids too, so their Chinese labels keep the same scale.
        cols = max(1, round(original.width / 780))
        for col in range(cols):
            x0 = max(0, round(col * original.width / cols) - 24)
            x1 = min(original.width, round((col + 1) * original.width / cols) + 24)
            im = original.crop((x0, 0, x1, original.height))
            scale = 460 / im.width
            im = im.resize((460, round(im.height * scale)))
            n = max(1, math.ceil(im.height / 650))
            for k in range(n):
                y0 = max(0, round(k * im.height / n) - 24)
                y1 = min(im.height, round((k + 1) * im.height / n) + 24)
                strip = k if cols == 1 else 10000 * cols + 100 * col + k
                images.append((p, strip, im.crop((0, y0, 460, y1))))
    for start in range(0, len(images), 12):
        tiles = images[start:start + 12]
        rows = math.ceil(len(tiles) / 4)
        h = max(im.height for _, _, im in tiles) + 38
        board = Image.new('RGB', (4 * 480, rows * h), '#ededed')
        d = ImageDraw.Draw(board)
        records = []
        for i, (p, strip, im) in enumerate(tiles):
            x, y = (i % 4) * 480, (i // 4) * h
            d.text((x + 4, y + 3), p.stem.replace('fig_', '') + f' [{strip + 1}]', font=font, fill='black')
            board.paste(im, (x + 8, y + 31))
            records.append({'png': p.relative_to(root).as_posix(), 'strip': strip,
                            'sha256': hashlib.sha256(p.read_bytes()).hexdigest()})
        target = out / (batch.replace('/', '-') + f'-{start // 12:02}.png')
        board.save(target)
        manifest.append({'batch': batch, 'board': target.relative_to(root).as_posix(), 'images': records})
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({'boards': len(manifest), 'pngs': len({r['png'] for b in manifest for r in b['images']}),
                  'byBatch': {f: sum(b['batch'] == f for b in manifest) for f in folders}}, indent=2))
