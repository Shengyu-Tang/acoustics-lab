"""Create labelled route contact sheets for visual review, inside the repository."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
folder = root / 'specs/redesign/screenshots/P6'
out = folder / 'boards'
out.mkdir(parents=True, exist_ok=True)
for width, label, tile_width, tile_height in [(1440, 'desktop', 360, 250), (390, 'mobile', 260, 590)]:
    files = sorted(p for p in folder.glob(f'*-{width}.jpg') if not p.name.startswith(('home-chapter3-expanded-', 'home-field-thumbnails-')))
    for offset in range(0, len(files), 12):
        group = files[offset:offset + 12]
        board = Image.new('RGB', (tile_width * 4, tile_height * 3), 'white')
        draw = ImageDraw.Draw(board)
        for i, p in enumerate(group):
            image = Image.open(p)
            image.thumbnail((tile_width, tile_height - 24))
            x, y = i % 4 * tile_width, i // 4 * tile_height
            board.paste(image, (x, y + 24))
            draw.text((x + 5, y + 4), p.stem, fill='black')
        board.save(out / f'{label}-{offset // 12 + 1:02d}.jpg', quality=88)
    print(f'{label}: {len(files)} route captures')
