# tools/art/build_sheet.py — 把 assets/art/*.png 拼成审图网格（PNG，4 列）
import sys, glob
from PIL import Image, ImageDraw

def main(out="docs/screenshots/art-sheet2.png", cols=4, cell=512):
    cols = int(cols)
    cell = int(cell)
    files = sorted(glob.glob("assets/art/*.png"))
    rows = (len(files) + cols - 1) // cols
    im = Image.new("RGB", (cols * cell, rows * cell))
    d = ImageDraw.Draw(im)
    for i, f in enumerate(files):
        g = Image.open(f).convert("RGB").resize((cell, cell), Image.LANCZOS)
        x, y = (i % cols) * cell, (i // cols) * cell
        im.paste(g, (x, y))
        d.rectangle((x, y, x + cell - 1, y + 27), fill=(10, 11, 16))
        d.text((x + 8, y + 6), f.split("/")[-1].replace(".png", ""), fill=(255, 255, 255))
    im.save(out)
    print("sheet:", out, im.size, "tiles:", len(files))

if __name__ == "__main__":
    main(*sys.argv[1:])
