/* assets/js/calc.js —— 站内所有「会算数」的纯函数（v16）
 *
 * 抽出来的理由：这些公式此前内联在 app.js 的闭包里，只能用端到端冒烟「点一遍」来验证，
 * 边界值（r=15、碳水为负、周日/周一跨周）没有任何断言。现在 app.js 与 tools/unit-tests.mjs
 * 共用同一份实现，改公式会被单测立刻抓到。
 *
 * 浏览器：window.IG_CALC；Node：require('./assets/js/calc.js')。零依赖。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.IG_CALC = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  /* Mifflin-St Jeor 基础代谢 */
  function bmr(o) {
    var sex = o && o.sex === "m" ? 5 : -161;
    return 10 * (+o.wt || 0) + 6.25 * (+o.ht || 0) - 5 * (+o.age || 0) + sex;
  }

  /* 目标热量：维持 1.0 / 减脂 0.8 / 增肌 1.12（对应 -20% 与 +12%） */
  function targetKcal(tdee, goal) {
    var f = goal === "cut" ? 0.8 : goal === "bulk" ? 1.12 : 1;
    return Math.round(tdee * f);
  }

  /* 三大宏量：蛋白 2.2（减脂）/1.8（其他）g/kg；脂肪 0.9/1.0 g/kg；碳水吃剩余热量，最低 0 */
  function macros(kcal, wt, goal) {
    var cut = goal === "cut";
    var protein = Math.round(wt * (cut ? 2.2 : 1.8));
    var fat = Math.round(wt * (cut ? 0.9 : 1.0));
    var carb = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    return {
      protein: protein,
      fat: fat,
      carb: carb,
      pKcal: protein * 4,
      fKcal: fat * 9,
      cKcal: carb * 4,
      cut: cut
    };
  }

  /* Epley 1RM 估算：w × (1 + r/30) */
  function epley(w, r) {
    var W = +w || 0, R = +r || 0;
    if (!W || !R) return 0;
    return W * (1 + R / 30);
  }

  /* 常用百分比训练重量（相对 1RM） */
  function percentages(oneRm, list) {
    var pcts = list || [95, 90, 85, 80, 75, 70];
    return pcts.map(function (p) {
      return { pct: p, w: Math.round((+oneRm || 0) * p / 100 * 10) / 10 };
    });
  }

  /* 该日期所在周的周一（本地时间；周一为一周之始）。返回 Date，非法输入返回 null。 */
  function weekStart(dateStr) {
    var d = new Date((dateStr || "") + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  /* Date → 'YYYY-MM-DD'（本地，不用 toISOString，避免 UTC 偏移把日期拨到前一天） */
  function isoLocal(d) {
    if (!d || isNaN(d.getTime())) return "";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* 训练记录统计（与原实现一致：所有录入的组都计数，不做有效组过滤 ——
     「有效组」的判定在周容量里单独做，两处口径不同是有意的） */
  function sessionStats(s) {
    var sets = 0, vol = 0;
    ((s && s.entries) || []).forEach(function (en) {
      (en.sets || []).forEach(function (x) {
        sets++;
        vol += (+x.w || 0) * (+x.r || 0);
      });
    });
    return { sets: sets, vol: Math.round(vol) };
  }

  /* 有效组判定：打勾，或重量与次数都填了（周容量 / 周报用） */
  function isEffectiveSet(x) {
    return !!(x && (x.done || (x.w > 0 && x.r > 0)));
  }

  /* ---- 双重渐进建议（v1.1）----
   * 计划里「先把每组做到区间上限次数，再加重」的规则，做成可单测的纯函数。
   * 目标串形如 "3×8–12" / "5×5" / "3×8–10/侧"，带备注（"3×8–10（轻）"）可解析；
   * 计时类（"3×45 秒"、"30–40 秒/侧 ×3"）与 RPE 类（"3×力竭前 2"）返回 null，不瞎建议。 */
  function parseTargetSets(str) {
    var s = String(str || "").replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "").trim();
    if (!s || /秒/.test(s)) return null;
    var m = s.match(/^(\d+)\s*×\s*(\d+)(?:\s*[–—-]\s*(\d+))?/);
    if (!m) return null;
    var min = +m[2], max = m[3] ? +m[3] : min;
    if (max < min) max = min;
    return { sets: +m[1], min: min, max: max };
  }

  /* 加重档位：对应计划规则里的「+2.5–5%」——大重量取 5kg（约 5%），中重量 2.5kg，轻重量 1kg */
  function nextWeight(w) {
    var W = +w || 0;
    if (W <= 0) return 0;
    var inc = W >= 40 ? 5 : W >= 10 ? 2.5 : 1;
    return Math.round((W + inc) * 10) / 10;
  }

  /* 减重档位：对应计划规则里的「减重 10% 重新爬坡」，取整到 2.5kg 档 */
  function deloadWeight(w) {
    var W = +w || 0;
    if (W <= 0) return 0;
    return Math.round(W * 0.9 / 2.5) * 2.5;
  }

  /* 依据计划目标 + 最近两次的各组 {w, r}，给出本次建议。
   * 判定只看负重 >0 的组（自重动作单独谈次数）；返回 { kind, w, msg }，w 为建议填入的重量（0 = 无重量可填）。
   * v1.2 新增平台期减载：同一重量连续两次都没碰到区间下限 → 按计划规则减重 10% 重新爬坡。 */
  function progression(target, lastSets, prevSets) {
    var tgt = parseTargetSets(target);
    if (!tgt) return null;
    var sets = (lastSets || []).filter(function (x) { return x && ((+x.r || 0) > 0 || (+x.w || 0) > 0); });
    if (!sets.length) {
      return { kind: "first", w: 0, msg: "首次练这个动作：从能标准完成 " + tgt.min + " 次的重量起步，每组留 2–3 次余力" };
    }
    var wSets = sets.filter(function (x) { return (+x.w || 0) > 0; });
    if (!wSets.length) {
      var bestR = 0;
      sets.forEach(function (x) { if ((+x.r || 0) > bestR) bestR = +x.r; });
      var allMax = sets.every(function (x) { return (+x.r || 0) >= tgt.max; });
      if (allMax) {
        return { kind: "bw-up", w: 0, msg: "自重已全部到上限 " + tgt.max + " 次：可加负重（背包/弹力带）或换更难的变式" };
      }
      return { kind: "bw", w: 0, msg: "自重目标每组 " + tgt.min + "–" + tgt.max + " 次，上次最多 " + bestR + " 次：沿用即可，往上限推" };
    }
    var W = 0;
    wSets.forEach(function (x) { if ((+x.w || 0) > W) W = +x.w; });
    var allUp = wSets.every(function (x) { return (+x.r || 0) >= tgt.max; });
    var allMin = wSets.every(function (x) { return (+x.r || 0) >= tgt.min; });
    if (allUp) {
      var nw = nextWeight(W);
      return { kind: "up", w: nw, msg: "上次 " + W + " kg 全部到上限 " + tgt.max + " 次：本次可加重到 " + nw + " kg" };
    }
    if (!allMin) {
      /* 平台期判定：上次有组没到下限，且上上次同一重量也全军没到下限 → 减载 */
      var pWSets = (prevSets || []).filter(function (x) { return x && (+x.w || 0) > 0; });
      var pW = 0;
      pWSets.forEach(function (x) { if ((+x.w || 0) > pW) pW = +x.w; });
      var pAllBad = pW > 0 && pWSets.every(function (x) { return (+x.r || 0) < tgt.min; });
      if (pW === W && pAllBad) {
        var dw = deloadWeight(W);
        return { kind: "deload", w: dw, msg: "同一重量连续两次没到下限 " + tgt.min + " 次：按计划规则减到 " + dw + " kg 重新爬坡" };
      }
      return { kind: "grind", w: W, msg: "上次有组没到下限 " + tgt.min + " 次：沿用 " + W + " kg 把动作质量做稳（吃力就减 10%）" };
    }
    return { kind: "push", w: W, msg: "沿用 " + W + " kg：每组往上限 " + tgt.max + " 次推，全到了再加重" };
  }

  /* ---- 个人纪录（v1.2）----
   * 从全部训练会话里给每个动作算「历史最佳一组」：
   * 估算 1RM（Epley）只统计 1–12 次的组——高次数下 Epley 会明显高估，不冒充精确；
   * 全是自重（无负重）或没录入重量的动作不参与排名；返回数组，不排序（展示端自行排）。 */
  function personalRecords(sessions) {
    var by = {};
    ((sessions || [])).forEach(function (s) {
      var date = String((s && s.date) || "");
      ((s && s.entries) || []).forEach(function (en) {
        if (!en || !en.ex) return;
        var rec = by[en.ex] || (by[en.ex] = { ex: en.ex, name: en.name || en.ex, count: 0, lastDate: "", best: null, maxW: 0, maxWr: 0 });
        var hasWeighted = false;
        (en.sets || []).forEach(function (x) {
          var w = +x.w || 0, r = +x.r || 0;
          if (w <= 0 || r <= 0) return;
          hasWeighted = true;
          if (w > rec.maxW) { rec.maxW = w; rec.maxWr = r; }
          if (r <= 12) {
            var e = Math.round(epley(w, r) * 10) / 10;
            if (!rec.best || e > rec.best.e1rm) {
              rec.best = { w: w, r: r, e1rm: e, date: date };
            }
          }
        });
        if (hasWeighted) {
          rec.count++;
          if (date > rec.lastDate) rec.lastDate = date;
        }
      });
    });
    return Object.keys(by).map(function (k) { return by[k]; }).filter(function (r) { return r.count > 0; });
  }

  return {
    bmr: bmr,
    targetKcal: targetKcal,
    macros: macros,
    epley: epley,
    percentages: percentages,
    weekStart: weekStart,
    isoLocal: isoLocal,
    sessionStats: sessionStats,
    isEffectiveSet: isEffectiveSet,
    parseTargetSets: parseTargetSets,
    nextWeight: nextWeight,
    deloadWeight: deloadWeight,
    progression: progression,
    personalRecords: personalRecords
  };
});
