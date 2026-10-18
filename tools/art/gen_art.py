#!/usr/bin/env python
"""tools/art/gen_art.py —— 魔搭免费档批量生成「男性动作插画」（初稿+精修两轮用同一脚本）

用法（在 fitness-site 目录下）:
  python tools/art/gen_art.py --next 3                 # 取清单里还没有成图的前 3 个动作
  python tools/art/gen_art.py --ids bench-press,squat  # 指定动作
  python tools/art/gen_art.py --ids x --model t2i      # 换文生图（默认 edit=带参考图）
  python tools/art/gen_art.py --ids x --force          # 已有成图也重掷
  python tools/art/gen_art.py --ids x --extra "prompt 追加"

产物: assets/art/<id>.png（1024 方图，统一底色补边）; 原始下载在 tools/art/raw/<id>.png;
日志 tools/art/gen-log.jsonl 每张一行（含 prompt/task/尝试次数，可复现）。
"""
import argparse, base64, json, os, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOME = os.path.join(os.environ.get("LOCALAPPDATA", ""), "hermes")
BASE = "https://api-inference.modelscope.cn/v1"
REF_DEFAULT = os.path.join(ROOT, "tools", "art", "ref_crop.png")
OUT = os.path.join(ROOT, "assets", "art")
RAW = os.path.join(ROOT, "tools", "art", "raw")
LOG = os.path.join(ROOT, "tools", "art", "gen-log.jsonl")


def read_key():
    for line in open(os.path.join(HOME, ".env"), encoding="utf-8", errors="replace"):
        if line.startswith("MODELSCOPE_API_KEY="):
            return line.split("=", 1)[1].strip()
    raise SystemExit("MODELSCOPE_API_KEY 不在 .env")


KEY = read_key()


def call(method, url, body=None, extra=None, timeout=120):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    headers.update(extra or {})
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return -1, repr(e)


def poll(tid, tries=30, wait=6):
    for i in range(tries):
        time.sleep(wait)
        st, body = call("GET", f"{BASE}/tasks/{tid}", extra={"X-ModelScope-Task-Type": "image_generation"}, timeout=40)
        try:
            p = json.loads(body)
        except Exception:
            p = {}
        s = p.get("task_status")
        if s == "SUCCEED":
            return p
        if s in ("FAILED", "FAIL", "ERROR"):
            print("    fail:", body[:200].replace("\n", " "))
            return p
    return {}


PROMPT_BASE = ("Flat semi-realistic illustration of a MALE athlete, full body, centered, "
               "plain warm beige background (#f5ead9), thin dark-brown outlines, "
               "muted teal top and navy shorts, subtle muscle shading, "
               "clean minimal gym equipment, no text, no watermark, no logo")

# 姿态强制条款：edit 模型会继承参考图的姿势，必须显式覆盖（免费档实测坑）
POSE = [
    (("bench-press", "db-bench", "incline", "decline", "fly"), "lying supine on a flat bench, feet on the floor, arms extended upward, pressing the weight directly above the chest with elbows slightly bent, a flat bench visible under the body"),
    (("seated-row", "cable-row"), "seated upright on a low cable row machine with a padded foot plate, knees slightly bent, torso vertical, both arms pulling a horizontal handle into the abdomen, elbows close to the torso"),
    (("lateral-raise", "side-raise"), "standing with feet shoulder-width apart, both arms raised out to the sides up to shoulder height, elbows slightly bent, a dumbbell in each hand at shoulder level"),
    (("raise",), "standing, raising the weight with a bent arm, clear motion arc visible"),
    (("pullup", "pull-up", "chin"), "hanging from a horizontal pull-up bar with both hands, arms overhead, legs slightly bent behind"),
    (("pulldown",), "seated at a lat pulldown machine, thighs under the pads, both arms pulling the bar down toward the upper chest"),
    (("pushup", "push-up", "plank", "dip"), "body horizontal above the floor, supported on straight arms, elbows bent during the movement, feet or knees as support"),
    (("squat", "leg-press", "hack"), "standing with a barbell across the upper back, hips lowered in a deep squat, thighs near horizontal, knees tracking over the toes"),
    (("deadlift", "rdl", "romanian", "hinge"), "standing with feet hip-width, hips pushed back, torso hinged forward with a flat back, both arms hanging vertically holding a barbell near the shins"),
    (("lunge", "split", "step-up", "bulgarian"), "split stance with one leg forward bent at the knee and the rear leg extended behind, torso upright"),
    (("curl",), "standing upright, upper arms fixed at the sides, forearms curled upward toward the shoulders holding the weight"),
    (("press", "ohp", "shoulder", "military"), "standing or seated upright, elbows at shoulder height, pressing the weight straight overhead until arms are extended"),
    (("calf",), "standing on the balls of the feet, heels raised high off the floor, legs straight"),
    (("thrust", "bridge", "glute"), "lying supine with the upper back on a bench, feet flat on the floor, hips lifted until the torso is horizontal, a barbell across the hips"),
    (("triceps", "pushdown", "skull", "kickback"), "standing beside a cable machine, elbows pinned to the sides, forearms pressing downward to full extension"),
    (("row", "shrug"), "torso hinged forward with a flat back, both arms pulling the weight upward toward the abdomen"),
]


def pose_of(eid):
    for keys, txt in POSE:
        for k in keys:
            if k in eid:
                return txt
    return "standing upright performing the exercise with clear, readable overall body posture"


def kit_of(ex):
    eq = ex.get("equip", "")
    part = (ex.get("parts") or [""])[0]
    tips = {"杠铃": "holding a barbell", "哑铃": "holding dumbbells", "固定器械": "using a weight machine",
            "绳索": "using a cable station", "自重": "bodyweight only", "壶铃": "holding a kettlebell",
            "弹力带": "using a resistance band"}
    return tips.get(eq, "no equipment")


def build_prompt(ex, extra=""):
    p = PROMPT_BASE + ", performing " + (ex.get("en") or ex["name"]) + " (" + ex["name"] + "), " + kit_of(ex) + ". "
    p += "POSE (must be exactly this): " + pose_of(ex["id"]) + ". "
    p += "Do NOT copy the pose or the equipment from the reference image; borrow only its art style, palette and character design."
    if extra:
        p += " " + extra
    return p


def post(src, dst):
    from PIL import Image
    im = Image.open(src).convert("RGB")
    w, h = im.size
    s = max(w, h)
    bg = im.getpixel((2, 2))
    canvas = Image.new("RGB", (s, s), bg)
    canvas.paste(im, ((s - w) // 2, (s - h) // 2))
    canvas = canvas.resize((1024, 1024), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    canvas.save(dst, "PNG", optimize=True)
    return os.path.getsize(dst)


def prep_ref(path):
    """参考图预处理：压到 <=2048（接口硬上限），落到 tools/art/refs/。"""
    from PIL import Image
    im = Image.open(path).convert("RGB")
    if max(im.size) > 2048:
        r = 2048 / max(im.size)
        im = im.resize((int(im.size[0] * r), int(im.size[1] * r)), Image.LANCZOS)
    d = os.path.join(ROOT, "tools", "art", "refs")
    os.makedirs(d, exist_ok=True)
    out = os.path.join(d, os.path.basename(path))
    im.save(out, "PNG")
    return out


def one(ex, model, ref, extra, attempts):
    pid = ex["id"]
    final = os.path.join(OUT, pid + ".png")
    raw = os.path.join(RAW, pid + ".png")
    prompt = build_prompt(ex, extra)
    if ref and os.path.exists(ref):
        ref = prep_ref(ref)
    for k in range(1, attempts + 1):
        body = {"model": model, "prompt": prompt, "n": 1}
        if model.endswith("Image-Edit") and ref and os.path.exists(ref):
            body["image_url"] = "data:image/png;base64," + base64.b64encode(open(ref, "rb").read()).decode()
        st, resp = call("POST", BASE + "/images/generations", body=body, extra={"X-ModelScope-Async-Mode": "true"})
        try:
            tid = json.loads(resp).get("task_id")
        except Exception:
            tid = None
        print(f"  [{pid}] try{k} submit http={st} task={'Y' if tid else 'N'}")
        if not tid:
            print("     ", resp[:160].replace("\n", " "))
            continue
        res = poll(tid)
        urls = res.get("output_images") or []
        if not urls:
            print(f"  [{pid}] no image")
            continue
        os.makedirs(RAW, exist_ok=True)
        with urllib.request.urlopen(urls[0], timeout=180) as r2, open(raw, "wb") as fh:
            fh.write(r2.read())
        size = post(raw, final)
        with open(LOG, "a", encoding="utf-8") as fh:
            fh.write(json.dumps({"id": pid, "model": model, "task": tid, "try": k, "prompt": prompt,
                                 "ref": os.path.basename(ref) if ref else "", "bytes": size,
                                 "ts": time.strftime("%Y-%m-%d %H:%M:%S")}, ensure_ascii=False) + "\n")
        print(f"  [{pid}] OK -> {final} ({size // 1024}KB)")
        return True
    print(f"  [{pid}] FAILED after {attempts} attempts")
    return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ids", default="")
    ap.add_argument("--next", type=int, default=0)
    ap.add_argument("--model", default="edit", choices=["edit", "t2i"])
    ap.add_argument("--ref", default=REF_DEFAULT)
    ap.add_argument("--extra", default="")
    ap.add_argument("--attempts", type=int, default=2)
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    exs = json.load(open(os.path.join(ROOT, "tools", "art", "exercises.json"), encoding="utf-8"))
    by = {e["id"]: e for e in exs}
    if a.ids:
        todo = [by[i] for i in a.ids.split(",") if i in by]
    else:
        todo = [e for e in exs if a.force or not os.path.exists(os.path.join(OUT, e["id"] + ".png"))]
        if a.next:
            todo = todo[: a.next]
    model = "Qwen/Qwen-Image-Edit" if a.model == "edit" else "Qwen/Qwen-Image"
    print(f"plan: {len(todo)} 张 · model={model} · ref={os.path.basename(a.ref)}")
    ok = 0
    for ex in todo:
        if one(ex, model, a.ref, a.extra, a.attempts):
            ok += 1
    print(f"done: {ok}/{len(todo)}")


if __name__ == "__main__":
    main()
