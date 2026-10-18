"""tools/art/shrink_sheet.py —— 把超高的模板拼图裁成两列并降采样，便于一次目检
用法: python tools/art/shrink_sheet.py <src.png> <out.png> [cols_cut] [scale]
"""
import os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
cut = int(sys.argv[3]) if len(sys.argv) > 3 else 8      # 前 cut 行放左列
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.45
im = Image.open(src).convert("RGB")
W, H = im.size
row = H // 15
top = im.crop((0, 0, W, cut * row))
bot = im.crop((0, cut * row, W, H))
def sc(x):
    return x.resize((int(x.size[0] * scale), int(x.size[1] * scale)), Image.LANCZOS)
top, bot = sc(top), sc(bot)
canvas = Image.new("RGB", (top.size[0] + bot.size[0] + 10, max(top.size[1], bot.size[1])), (10, 11, 16))
canvas.paste(top, (0, 0))
canvas.paste(bot, (top.size[0] + 10, 0))
canvas.save(out, "PNG", optimize=True)
print("shrunk:", out, canvas.size, os.path.getsize(out) // 1024, "KB")
