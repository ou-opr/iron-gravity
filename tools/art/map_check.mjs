/* tools/art/map_check.mjs —— 机械校验映射覆盖：60 动作 id 全覆盖 + 映射值 ⊆ 89 个 atlas id */
import { readFileSync } from "node:fs";
const ids60 = (readFileSync("tools/art/exercises.json", "utf8").match(/"id": "([\w-]+)"/g) || [])
  .map((s) => s.slice(7, -1));
const atlas = new Set((readFileSync("assets/js/anatomy-atlas.js", "utf8").match(/"id":"([\w-]+)"/g) || [])
  .map((s) => s.slice(6, -1)));
const mapSrc = readFileSync("assets/js/data-muscles-map.js", "utf8");
const mapped = new Set((mapSrc.match(/"([\w-]+)": mir\(/g) || []).map((s) => s.slice(1, -7)));
const bad = [];
const idsInMap = [];
for (const m of mapSrc.matchAll(/mir\(([^)]*)\)/g)) {
  for (const b of m[1].split(",").map((s) => s.trim().replace(/"/g, "")).filter(Boolean)) {
    idsInMap.push(b + "-left", b + "-right");
  }
}
for (const id of idsInMap) if (!atlas.has(id)) bad.push(id);
const missing = ids60.filter((id) => !mapped.has(id));
console.log("动作数:", ids60.length, "| 映射表条目:", mapped.size);
console.log("未映射动作:", missing.length ? missing.join(",") : "无（0）");
console.log("非法肌群 id:", bad.length ? bad.join(",") : "无（0）");
if (missing.length === 0 && bad.length === 0) console.log("MAP CHECK: PASS");
else process.exit(1);
