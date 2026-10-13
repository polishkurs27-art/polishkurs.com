"""Crops and resizes the portrait for the site.  Usage: python3 tools/photo.py <original.jpg>"""
import sys
from pathlib import Path
from PIL import Image

out = Path(__file__).resolve().parent.parent / "src/assets/img"
im = Image.open(sys.argv[1]).convert("RGB")

hero = im.crop((0, 130, 1440, 1930))  # 4:5, hair to shoulders
for w in (800, 520):
    r = hero.resize((w, w * 5 // 4), Image.LANCZOS)
    r.save(out / f"irena-{w}.webp", "WEBP", quality=72, method=6)
    r.save(out / f"irena-{w}.jpg", "JPEG", quality=76, optimize=True, progressive=True)
