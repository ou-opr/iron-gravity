# tools/art/crop_rows.py — 从超高拼图里裁出若干行并纵向堆成一图（返工项全尺寸复核用）
# 用法: python tools/art/crop_rows.py src out 6,7 21,22   （行号从 0 起，逐行裁切后堆叠）
import sys
from PIL import Image

def main(src, out, *pairs):
    """pairs: 像素区间 "y0,y1"（可多个，纵向堆叠）"""
    im = Image.open(src)
    crops = []
    for p in pairs:
        a, b = [int(x) for x in str(p).split(",")]
        crops.append(im.crop((0, a, im.width, min(im.height, b))))
    H = sum(c.height for c in crops) + 8 * (len(crops) - 1)
    W = max(c.width for c in crops)
    canvas = Image.new("RGB", (W, H))
    y = 0
    for c in crops:
        canvas.paste(c, (0, y))
        y += c.height + 8
    canvas.save(out)
    print("rows:", out, canvas.size)

if __name__ == "__main__":
    main(*sys.argv[1:])
