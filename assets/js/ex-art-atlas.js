/* assets/js/ex-art-atlas.js —— 肌群级解剖面板（POC v9，@emmorts/body-muscles 数据）
 * 说明牌风：黑底 + 浅灰实体肌块 + 目标肌群红高亮；front/back 双视图并排。
 * 数据源 assets/js/anatomy-atlas.js（Apache-2.0，见 docs/licenses/ 与 ATTRIBUTION.md）。
 * 用法：IG_ATLAS_ART.of(["shoulder-front-left", …]) → SVG HTML；未加载返回 ""。
 */
window.IG_ATLAS_ART = (function () {
  var HOT = "#ff2d2d", DIM = "#b23a30", BASE = "var(--ink-mus, #cfd3d9)", STROKE = "var(--ink-mus-line, rgba(0,0,0,.35))";
  function view(list, ids, sec) {
    return list.map(function (m) {
      var hot = ids.indexOf(m.id) > -1;
      var hotSec = !hot && sec && sec.indexOf(m.id) > -1;
      return '<path d="' + m.d + '" fill="' + (hot ? HOT : hotSec ? DIM : BASE) + '"'
        + ' stroke="' + STROKE + '" stroke-width="0.14"'
        + (hot ? ' data-hot="1"' : hotSec ? ' data-hot="s"' : "") + "/>\n";
    }).join("");
  }
  function one(list, ids, sec) {
    return '<svg viewBox="-1 -1 71 95" role="img" aria-label="肌群级解剖图">' + view(list, ids, sec) + "</svg>";
  }
  function of(ids, sec) {
    var A = window.IG_ATLAS;
    if (!A || !ids || !ids.length) return "";
    return '<div class="atlas2">' + one(A.front, ids, sec) + one(A.back, ids, sec) + "</div>";
  }
  /* —— 站点接入（v9 收口）：动作对象 → 肌群级高亮 id 集（映射优先，parts 机械兜底） —— */
  function resolve(ex) {
    var ids = [], sec = [];
    if (!ex) return { ids: ids, sec: sec };
    var M = window.IG_MUSCLES_MAP;
    var secMap = window.IG_MUSCLES_SEC || {};
    if (M && M[ex.id] && M[ex.id].length) {
      ids = M[ex.id];
    } else {
      /* parts → 肌群机械兜底（保证 60/60 都有图；未覆盖的 part 返回空 → 上层回退部位级） */
      var P2M = {
        "胸": ["chest-upper", "chest-lower", "shoulder-front"],
        "肩": ["shoulder-front", "shoulder-side"],
        "背": ["lats-upper", "lats-mid", "traps-mid", "lower-back-erectors"],
        "腿": ["quads", "hamstrings-medial", "calves-gastroc-medial", "gluteus-maximus"],
        "臀": ["gluteus-maximus", "gluteus-medius"],
        "腹": ["abs-upper", "abs-lower", "obliques"],
        "核心": ["abs-upper", "abs-lower", "obliques"],
        "手臂": ["biceps", "triceps-long", "forearm-flexors"]
      };
      var mirSeen = {};
      (ex.parts || []).forEach(function (p) {
        for (var key in P2M) {
          if ((p + "").indexOf(key) < 0) continue;
          P2M[key].forEach(function (b) {
            if (mirSeen[b]) return;
            mirSeen[b] = 1;
            ids.push(b + "-left", b + "-right");
          });
        }
      });
    }
    /* 次要肌群：IG_MUSCLES_SEC 的值由数据文件的 mir() 展开过，直接用（勿再加左右后缀） */
    sec = (secMap[ex.id] || []).slice();
    /* 去重语义：凡进 SEC 的一律从"目标"里剔除（避免同一肌群同时出现在目标与参与） */
    if (sec.length) ids = ids.filter(function (id) { return sec.indexOf(id) < 0; });
    return { ids: ids, sec: sec };
  }
  function forEx(ex) {
    var A = window.IG_ATLAS;
    if (!A || !ex) return "";
    var r = resolve(ex);
    return of(r.ids, r.sec);
  }
  /* 中文名（去左右后缀）→ 显示名；供图例使用 */
  function zhOf(id) {
    var base = id.replace(/-(left|right)$/, "");
    var ZH = window.IG_MUSCLE_ZH || {};
    if (ZH[base]) return ZH[base];
    var A = window.IG_ATLAS;
    if (A) {
      var all = A.front.concat(A.back);
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i].name;
    }
    return base;
  }
  function uniqNames(ids) {
    var seen = {}, out = [];
    (ids || []).forEach(function (id) {
      var n = zhOf(id);
      if (!seen[n]) { seen[n] = 1; out.push(n); }
    });
    return out;
  }
  function uniqBase(ids) {
    var seen = {}, out = [];
    (ids || []).forEach(function (id) {
      var b = String(id).replace(/-(left|right)$/, "");
      if (!seen[b]) { seen[b] = 1; out.push(b); }
    });
    return out;
  }
  /* 详情 API：{ svg, hot, sec, hotBases, secBases } —— hot/sec 为中文名清单，*Bases 为去左右基名 */
  function detail(ex) {
    var r = resolve(ex);
    if (!r.ids.length) return { svg: "", hot: "", sec: "", hotBases: [], secBases: [] };
    return {
      svg: of(r.ids, r.sec),
      hot: uniqNames(r.ids).join(" / "),
      sec: uniqNames(r.sec).join(" / "),
      hotBases: uniqBase(r.ids),
      secBases: uniqBase(r.sec)
    };
  }
  return { of: of, for: forEx, detail: detail, zhOf: zhOf, uniqBase: uniqBase };
})();
