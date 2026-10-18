"""tools/art/list_ids.py —— 查看动作清单（可 grep 关键字），并确认 Pillow 可用"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ex = json.load(open(os.path.join(ROOT, "tools", "art", "exercises.json"), encoding="utf-8"))
try:
    import PIL
    print("PIL", PIL.__version__)
except Exception as e:
    print("PIL MISSING:", e)
print("total", len(ex))
kw = sys.argv[1:] or []
for e in ex:
    if not kw or any(k in e["id"] for k in kw):
        print(" ", e["id"], "|", e["name"], "|", e["en"], "|", e["equip"], "|", "/".join(e["parts"]))
