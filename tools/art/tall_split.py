# tools/art/tall_split.py — 把超高截图切 N 段后横向拼成一张（供 vision 复核限额）
import sys
from PIL import Image

def main(src, out, parts=3, scale=0.92):
    parts = int(parts)
    scale = float(scale)
    im = Image.open(src)
    w, h = im.size
    step = (h + parts - 1) // parts
    piece_w = int(w * scale)
    pieces = []
    for i in range(parts):
        crop = im.crop((0, i * step, w, min(h, (i + 1) * step)))
        crop = crop.resize((piece_w, int(crop.height * scale)), Image.LANCZOS)
        pieces.append(crop)
    H = max(p.height for p in pieces)
    W = sum(p.width for p in pieces) + 12 * (len(pieces) - 1)
    canvas = Image.new("RGB", (W, H))
    x = 0
    for p in pieces:
        canvas.paste(p, (x, 0))
        x += p.width + 12
    canvas.save(out)
    print("split:", out, canvas.size)

if __name__ == "__main__":
    main(*sys.argv[1:])
