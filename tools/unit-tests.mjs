#!/usr/bin/env node
/* tools/unit-tests.mjs —— 纯函数单元测试（零框架，node:assert）
 *
 * 覆盖 assets/js/calc.js：BMR / 目标热量 / 宏量分配 / Epley 1RM / 周起始 / 容量统计。
 * 这些公式以前只能靠端到端冒烟「点一遍」，边界值（碳水为负、周日跨周、r=15）完全没有断言。
 *
 * 用法：node tools/unit-tests.mjs     退出码 0 = 全过
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const C = require(path.join(root, "assets/js/calc.js"));

let passed = 0, failed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { failed++; console.log("  ✗ " + name + " — " + e.message); }
}
const near = (a, b, eps = 0.01) => assert.ok(Math.abs(a - b) <= eps, `期望 ${b}，实际 ${a}`);

console.log("calc.js 单元测试\n" + "─".repeat(50));

/* ---- Mifflin-St Jeor ---- */
t("BMR：男 70kg / 175cm / 25 岁 = 1673.75", () => near(C.bmr({ sex: "m", wt: 70, ht: 175, age: 25 }), 1673.75));
t("BMR：女 55kg / 162cm / 30 岁 = 1246.5", () => near(C.bmr({ sex: "f", wt: 55, ht: 162, age: 30 }), 55 * 10 + 162 * 6.25 - 30 * 5 - 161));
t("BMR：缺参数不产生 NaN", () => { const v = C.bmr({}); assert.ok(Number.isFinite(v)); });
t("BMR：男女差 = 166 kcal", () => near(C.bmr({ sex: "m", wt: 60, ht: 170, age: 20 }) - C.bmr({ sex: "f", wt: 60, ht: 170, age: 20 }), 166));

/* ---- 目标热量 ---- */
t("目标热量：维持不变", () => assert.equal(C.targetKcal(2000, "maintain"), 2000));
t("目标热量：减脂 = -20%", () => assert.equal(C.targetKcal(2000, "cut"), 1600));
t("目标热量：增肌 = +12%", () => assert.equal(C.targetKcal(2000, "bulk"), 2240));
t("目标热量：四舍五入", () => assert.equal(C.targetKcal(2001.6, "cut"), 1601));

/* ---- 宏量 ---- */
t("宏量：减脂蛋白 2.2 g/kg、脂肪 0.9 g/kg", () => {
  const m = C.macros(1800, 70, "cut");
  assert.equal(m.protein, 154);
  assert.equal(m.fat, 63);
});
t("宏量：维持蛋白 1.8 g/kg、脂肪 1.0 g/kg", () => {
  const m = C.macros(2200, 70, "maintain");
  assert.equal(m.protein, 126);
  assert.equal(m.fat, 70);
});
t("宏量：碳水吃剩余热量", () => {
  const m = C.macros(2200, 70, "maintain");
  assert.equal(m.carb, Math.round((2200 - 126 * 4 - 70 * 9) / 4));
});
t("宏量：热量很低时碳水不为负（clamp 到 0）", () => {
  const m = C.macros(600, 120, "cut");
  assert.equal(m.carb, 0);
  assert.ok(m.protein * 4 + m.fat * 9 > 600, "此例蛋白+脂肪本身已超过目标热量");
});
t("宏量：三大宏量热量与目标热量一致（正常输入）", () => {
  const m = C.macros(2400, 75, "maintain");
  near(m.pKcal + m.fKcal + m.cKcal, 2400, 4.5); /* 碳水取整带来的误差不超过 2 kcal */
});

/* ---- Epley 1RM ---- */
t("Epley：100kg × 5 = 116.67", () => near(C.epley(100, 5), 116.6667, 0.001));
t("Epley：100kg × 1 = 103.33", () => near(C.epley(100, 1), 103.3333, 0.001));
t("Epley：100kg × 15 = 150（提示上限）", () => near(C.epley(100, 15), 150));
t("Epley：缺参数返回 0", () => { assert.equal(C.epley(0, 5), 0); assert.equal(C.epley(100, 0), 0); });
t("百分比表：95% 与 70% 对应关系正确", () => {
  const p = C.percentages(100);
  assert.equal(p.length, 6);
  assert.equal(p[0].pct, 95); near(p[0].w, 95);
  assert.equal(p[5].pct, 70); near(p[5].w, 70);
});

/* ---- 周起始（周一为一周之始） ---- */
t("周起始：周日 → 前一个周一", () => assert.equal(C.isoLocal(C.weekStart("2026-10-18")), "2026-10-12"));
t("周起始：周一 → 自身", () => assert.equal(C.isoLocal(C.weekStart("2026-10-12")), "2026-10-12"));
t("周起始：周三 → 本周周一", () => assert.equal(C.isoLocal(C.weekStart("2026-10-14")), "2026-10-12"));
t("周起始：跨年（2026-01-01 周四）→ 2025-12-29", () => assert.equal(C.isoLocal(C.weekStart("2026-01-01")), "2025-12-29"));
t("周起始：非法输入返回 null", () => assert.equal(C.weekStart("不是日期"), null));

/* ---- 训练统计 ---- */
t("sessionStats：三组各自计容量", () => {
  const s = { entries: [{ sets: [{ w: 60, r: 10 }, { w: 60, r: 8 }, { w: 57.5, r: 8 }] }] };
  const st = C.sessionStats(s);
  assert.equal(st.sets, 3);
  assert.equal(st.vol, 600 + 480 + 460);
});
t("sessionStats：空记录返回 0", () => assert.deepEqual(C.sessionStats({}), { sets: 0, vol: 0 }));
t("sessionStats：空组也计数（口径与原实现一致）", () => {
  const st = C.sessionStats({ entries: [{ sets: [{ w: 0, r: 0 }] }] });
  assert.equal(st.sets, 1);
  assert.equal(st.vol, 0);
});
t("isEffectiveSet：打勾算有效，全空不算", () => {
  assert.equal(C.isEffectiveSet({ done: true }), true);
  assert.equal(C.isEffectiveSet({ w: 60, r: 10 }), true);
  assert.equal(C.isEffectiveSet({ w: 0, r: 10 }), false);
  assert.equal(C.isEffectiveSet({}), false);
});

console.log("─".repeat(50));
console.log(`合计 ${passed + failed} 项 · 通过 ${passed} · 失败 ${failed}`);
process.exit(failed ? 1 : 0);
