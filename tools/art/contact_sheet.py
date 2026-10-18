"""tools/art/contact_sheet.py —— 把若干成图拼成一张联图，便于一次性目检
用法: python tools/art/contact_sheet.py out.png bench-press seated-row lateral-raise [--cols 3]
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
cols = 3
if "--cols" in sys.argv:
    cols = int(sys.argv[sys.argv.index("--cols") + 1])
out, ids = args[0], args[1:]
cell = 512
rows = (len(ids) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * cell), (240, 234, 224))
for i, pid in enumerate(ids):
    p = os.path.join(ROOT, "assets", "art", pid + ".png")
    if not os.path.exists(p) and os.path.exists(pid):
        p = pid
    if not os.path.exists(p):
        continue
    im = Image.open(p).convert("RGB").resize((cell, cell), Image.LANCZOS)
    sheet.paste(im, ((i % cols) * cell, (i // cols) * cell))
op = os.path.join(ROOT, out) if not os.path.isabs(out) else out
os.makedirs(os.path.dirname(op), exist_ok=True)
sheet.save(op, "PNG", optimize=True)
print("sheet:", op, sheet.size, os.path.getsize(op) // 1024, "KB", "ids:", ",".join(ids))
