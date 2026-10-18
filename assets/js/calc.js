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

  return {
    bmr: bmr,
    targetKcal: targetKcal,
    macros: macros,
    epley: epley,
    percentages: percentages,
    weekStart: weekStart,
    isoLocal: isoLocal,
    sessionStats: sessionStats,
    isEffectiveSet: isEffectiveSet
  };
});
