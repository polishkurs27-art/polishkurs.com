"""Draws the PNG versions of src/assets/favicon.svg.  Usage: python3 tools/icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parent.parent / "src/assets"
VIOLET, WHITE, RED = "#5B3FD0", "#FFFFFF", "#DC143C"

def icon(size, rounded):
    S = size * 4  # draw at 4x, then downsample
    k = S / 64
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, S - 1, S - 1), radius=15 * k if rounded else 0, fill=VIOLET)
    # speech bubble: white on top, red below the middle (Polish flag)
    bubble = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(bubble)
    d.rounded_rectangle((13 * k, 13 * k, 51 * k, 44 * k), radius=9 * k, fill=255)
    d.polygon([(31 * k, 44 * k), (19 * k, 54 * k), (19 * k, 36 * k)], fill=255)
    lower = bubble.copy()
    ImageDraw.Draw(lower).rectangle((0, 0, S, 28.5 * k), fill=0)
    im.paste(WHITE, mask=bubble)
    im.paste(RED, mask=lower)
    return im.resize((size, size), Image.LANCZOS)

icon(48, True).save(out / "favicon-48.png")
icon(180, False).save(out / "apple-touch-icon.png")  # iOS rounds the corners itself
icon(512, True).save(out / "icon-512.png")
