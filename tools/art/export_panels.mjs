// tools/art/export_panels.mjs —— 批量导出 60 张解剖面板 SVG（零额度、离线原生）
// 产物: assets/art-panels/<动作id>.svg（按各动作 parts 自动切换高亮；多部位并集）
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const jsDir = path.join(ROOT, "assets", "js");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(jsDir, "ex-art-placard.js"), "utf8"), sandbox, { filename: "ex-art-placard.js" });
const P = sandbox.window.IG_PLACARD;
if (!P) throw new Error("IG_PLACARD 未加载");
const exs = JSON.parse(fs.readFileSync(path.join(ROOT, "tools", "art", "exercises.json"), "utf8"));
const outDir = path.join(ROOT, "assets", "art-panels");
fs.mkdirSync(outDir, { recursive: true });
let n = 0;
for (const e of exs) {
  const svg = P.panel(e.parts && e.parts.length ? e.parts : ["全身"]);
  fs.writeFileSync(path.join(outDir, e.id + ".svg"), svg, "utf8");
  n++;
}
console.log("panels exported:", n, "-> assets/art-panels/");
const parts = {};
exs.forEach((e) => (e.parts || ["全身"]).forEach((p) => (parts[p] = (parts[p] || 0) + 1)));
console.log("部位分布:", JSON.stringify(parts));
