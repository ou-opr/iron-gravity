import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const SRC = "C:/Users/OMEN/AppData/Local/hermes/cache/scratch/emm/package/dist/data/";
const f = req(SRC + "muscles.front.js").FRONT_MUSCLES, b = req(SRC + "muscles.back.js").BACK_MUSCLES;
let xs = [], ys = [];
for (const list of [f, b]) for (const m of list) for (const n of (m.path.match(/-?\d+(\.\d+)?/g) || []).map(Number)) {}
// 提取坐标对：Q/M/C 简化 = 全部数字对
function nums(p) { return (p.match(/-?\d*\.?\d+/g) || []).map(Number); }
for (const list of [f, b]) for (const m of list) { const n = nums(m.path); for (let i = 0; i + 1 < n.length; i += 2) { xs.push(n[i]); ys.push(n[i + 1]); } }
console.log("x range:", Math.min.apply(0, xs).toFixed(1), "->", Math.max.apply(0, xs).toFixed(1));
console.log("y range:", Math.min.apply(0, ys).toFixed(1), "->", Math.max.apply(0, ys).toFixed(1));
