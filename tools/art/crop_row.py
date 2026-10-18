# tools/art/crop_row.py — 按 (y0, y1) 从拼图原图裁出全尺寸行（归档用）
import sys
from PIL import Image

def main(src, out, y0, y1):
    im = Image.open(src)
    im.crop((0, int(y0), im.width, int(y1))).save(out)
    print("crop:", out, im.width, int(y1) - int(y0))

if __name__ == "__main__":
    main(*sys.argv[1:])
