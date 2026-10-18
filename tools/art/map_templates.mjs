// tools/art/map_templates.mjs —— 动作 → 模板 分档映射表（复用 ex-art.js 的规则，保证与站点一致）
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const jsDir = path.join(ROOT, "assets", "js");
const sandbox = { window: {} };
vm.createContext(sandbox);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(jsDir, f), "utf8"), sandbox, { filename: f });
fs.readdirSync(jsDir).filter((f) => /^data-exercises-.*\.js$/.test(f)).sort().forEach(load);
load("ex-art.js");
const exs = sandbox.window.FIT_EXERCISES || [];
const art = sandbox.window.IG_ART;
const TIER = (e) => ({ "自重": "A", "哑铃": "A", "杠铃": "B", "壶铃": "B", "弹力带": "D", "绳索": "C", "固定器械": "C", "器械": "C" }[e.equip] || "D");
const map = {};
for (const e of exs) {
  const p = art.patternOf(e);
  map[p] = map[p] || { tier: TIER(e), ids: [] };
  map[p].ids.push(e.id + "(" + TIER(e) + ")");
}
const tiers = { A: [], B: [], C: [], D: [] };
for (const e of exs) tiers[TIER(e)].push(e.id);
console.log("分档: A", tiers.A.length, "B", tiers.B.length, "C", tiers.C.length, "D", tiers.D.length);
console.log("\n模板 → 动作（" + Object.keys(map).length + " 个模板覆盖 " + exs.length + " 个动作）:");
for (const [p, v] of Object.entries(map).sort((a, b) => b[1].ids.length - a[1].ids.length)) {
  console.log(" ", p.padEnd(12), v.ids.length + "个:", v.ids.join(", "));
}
fs.writeFileSync(path.join(ROOT, "tools", "art", "template-map.json"),
  JSON.stringify({ tiers, patterns: Object.fromEntries(Object.entries(map).map(([k, v]) => [k, v.ids])) }, null, 1), "utf8");
