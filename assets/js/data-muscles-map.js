/* assets/js/data-muscles-map.js —— 60 动作 → 肌群级高亮 id 映射（v9 默认 atlas 数据源）
 * 域值必须落在 assets/js/anatomy-atlas.js 的 89 个 id 内（由 tools/art/map_check.mjs 机械校验）。
 * mir() 自动展开 left/right；缺省动作由 ex-art-atlas.js 的 parts→肌群兜底，保证 60/60 有图。
 */
window.IG_MUSCLES_MAP = (function () {
  function mir() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { out.push(arguments[i] + "-left", arguments[i] + "-right"); }
    return out;
  }
  return {
    "bench-press": mir("chest-upper", "chest-lower", "shoulder-front", "triceps-long"),
    "db-bench": mir("chest-upper", "chest-lower", "shoulder-front", "triceps-long"),
    "incline-db-press": mir("chest-upper", "shoulder-front", "triceps-long"),
    "pushup": mir("chest-upper", "chest-lower", "shoulder-front", "triceps-long", "abs-upper"),
    "cable-fly": mir("chest-upper", "chest-lower", "shoulder-front"),
    "pec-deck": mir("chest-upper", "chest-lower", "shoulder-front"),
    "dips": mir("chest-lower", "shoulder-front", "triceps-long"),
    "pullup": mir("lats-upper", "lats-mid", "traps-mid", "biceps"),
    "lat-pulldown": mir("lats-upper", "lats-mid", "traps-mid", "biceps"),
    "bb-row": mir("lats-upper", "lats-mid", "lats-lower", "traps-mid", "biceps"),
    "db-row": mir("lats-upper", "lats-mid", "lats-lower", "traps-mid", "biceps"),
    "seated-row": mir("lats-upper", "lats-mid", "lats-lower", "traps-mid", "traps-lower", "biceps"),
    "deadlift": mir("lower-back-erectors", "gluteus-maximus", "hamstrings-medial", "hamstrings-lateral", "traps-mid", "traps-upper"),
    "straight-arm-pulldown": mir("lats-upper", "lats-mid"),
    "inverted-row": mir("lats-upper", "lats-mid", "traps-mid", "biceps"),
    "db-shoulder-press": mir("shoulder-front", "shoulder-side", "chest-upper", "triceps-long"),
    "ohp": mir("shoulder-front", "shoulder-side", "chest-upper", "triceps-long"),
    "arnold-press": mir("shoulder-front", "shoulder-side", "chest-upper", "triceps-long"),
    "lateral-raise": mir("shoulder-side"),
    "face-pull": mir("deltoid-rear", "traps-mid", "traps-lower"),
    "rear-delt-fly": mir("deltoid-rear", "traps-mid", "traps-lower"),
    "squat": mir("quads", "gluteus-maximus", "lower-back-erectors"),
    "goblet-squat": mir("quads", "gluteus-maximus", "lower-back-erectors"),
    "front-squat": mir("quads", "gluteus-maximus", "lower-back-erectors"),
    "bw-squat": mir("quads", "gluteus-maximus"),
    "wall-sit": mir("quads"),
    "leg-press": mir("quads", "gluteus-maximus"),
    "rdl": mir("hamstrings-medial", "hamstrings-lateral", "gluteus-maximus", "lower-back-erectors"),
    "bss": mir("quads", "gluteus-maximus", "adductors"),
    "lunge": mir("quads", "gluteus-maximus", "adductors"),
    "reverse-lunge": mir("quads", "gluteus-maximus", "adductors"),
    "leg-curl": mir("hamstrings-medial", "hamstrings-lateral"),
    "leg-ext": mir("quads"),
    "calf-raise": mir("calves-gastroc-medial", "calves-gastroc-lateral", "calves-soleus"),
    "hip-thrust": mir("gluteus-maximus", "hamstrings-medial", "hamstrings-lateral"),
    "glute-bridge": mir("gluteus-maximus", "hamstrings-medial", "hamstrings-lateral"),
    "single-leg-glute-bridge": mir("gluteus-maximus", "hamstrings-medial", "hamstrings-lateral"),
    "cable-kickback": mir("gluteus-maximus"),
    "band-walk": mir("gluteus-medius", "gluteus-maximus"),
    "side-lying-leg-raise": mir("gluteus-medius", "gluteus-maximus"),
    "bb-curl": mir("biceps", "forearm-flexors"),
    "hammer-curl": mir("biceps", "forearm-flexors"),
    "incline-curl": mir("biceps", "forearm-flexors"),
    "pushdown": mir("triceps-long", "triceps-lateral"),
    "skull-crusher": mir("triceps-long", "triceps-lateral"),
    "overhead-ext": mir("triceps-long", "triceps-lateral"),
    "plank": mir("abs-upper", "abs-lower", "obliques"),
    "hanging-leg-raise": mir("abs-lower", "obliques", "hip-flexor"),
    "cable-crunch": mir("abs-upper", "abs-lower", "obliques"),
    "dead-bug": mir("abs-upper", "abs-lower", "obliques"),
    "side-plank": mir("obliques", "abs-upper"),
    "ab-wheel": mir("abs-lower", "abs-upper", "obliques"),
    "russian-twist": mir("obliques", "abs-upper", "abs-lower"),
    "kb-swing": mir("gluteus-maximus", "hamstrings-medial", "hamstrings-lateral", "lower-back-erectors"),
    "farmer-carry": mir("forearm-flexors", "forearm-extensors", "traps-upper"),
    "burpee": mir("chest-lower", "shoulder-front", "abs-lower", "quads"),
    "band-row": mir("lats-upper", "lats-mid", "traps-mid", "biceps"),
    "band-chest-press": mir("chest-upper", "chest-lower", "triceps-long"),
    "band-pull-apart": mir("traps-mid", "deltoid-rear"),
    "bird-dog": mir("lower-back-erectors", "gluteus-maximus", "obliques")
  };
})();
/* 肌群 id（去左右）→ 中文名（面板图例用，覆盖映射表引用的全部基名） */
window.IG_MUSCLE_ZH = {
  "chest-upper": "上胸", "chest-lower": "下胸", "shoulder-front": "三角肌前束", "shoulder-side": "三角肌中束",
  "deltoid-rear": "三角肌后束", "triceps-long": "肱三头肌长头", "triceps-lateral": "肱三头肌外侧头",
  "biceps": "肱二头肌", "forearm-flexors": "前臂屈肌群", "forearm-extensors": "前臂伸肌群",
  "lats-upper": "背阔肌上束", "lats-mid": "背阔肌中束", "lats-lower": "背阔肌下束",
  "traps-upper": "斜方肌上束", "traps-mid": "斜方肌中束", "traps-lower": "斜方肌下束",
  "lower-back-erectors": "竖脊肌", "spine": "脊柱",
  "abs-upper": "腹直肌上部", "abs-lower": "腹直肌下部", "obliques": "腹斜肌", "hip-flexor": "髂腰肌",
  "gluteus-maximus": "臀大肌", "gluteus-medius": "臀中肌",
  "hamstrings-medial": "腘绳肌内侧", "hamstrings-lateral": "腘绳肌外侧",
  "quads": "股四头肌", "adductors": "内收肌群",
  "calves-gastroc-medial": "腓肠肌内侧头", "calves-gastroc-lateral": "腓肠肌外侧头", "calves-soleus": "比目鱼肌"
};

/* 次要参与肌群（dim 暗红渲染；解剖上真实参与、但非该动作的说明牌焦点） */
window.IG_MUSCLES_SEC = (function () {
  function mir() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { out.push(arguments[i] + "-left", arguments[i] + "-right"); }
    return out;
  }
  return {
    "bench-press": mir("triceps-long"),
    "db-bench": mir("triceps-long"),
    "incline-db-press": mir("triceps-long"),
    "pushup": mir("triceps-long"),
    "pullup": mir("biceps"),
    "lat-pulldown": mir("biceps"),
    "band-row": mir("biceps"),
    "bb-row": mir("biceps"),
    "db-row": mir("biceps"),
    "seated-row": mir("biceps"),
    "inverted-row": mir("biceps"),
    "db-shoulder-press": mir("triceps-long"),
    "ohp": mir("triceps-long"),
    "arnold-press": mir("triceps-long"),
    "bb-curl": mir("forearm-flexors"),
    "hammer-curl": mir("forearm-flexors"),
    "incline-curl": mir("forearm-flexors"),
    "dips": mir("shoulder-front"),
    "plank": mir("obliques"),
    "dead-bug": mir("obliques"),
    "side-plank": mir("abs-upper"),
    "ab-wheel": mir("obliques"),
    "russian-twist": mir("abs-lower"),
    "cable-crunch": mir("obliques"),
    "hanging-leg-raise": mir("hip-flexor"),
    "burpee": mir("shoulder-front", "triceps-long")
  };
})();
