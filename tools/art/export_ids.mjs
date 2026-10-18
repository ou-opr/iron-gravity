// tools/art/export_ids.mjs —— 从站点数据文件导出 60 个动作清单（id/name/en/parts/equip）
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const SITE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const jsDir = path.join(SITE, "assets", "js");
const files = fs.readdirSync(jsDir).filter((f) => /^data-exercises-.*\.js$/.test(f)).sort();
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of files) {
  vm.runInContext(fs.readFileSync(path.join(jsDir, f), "utf8"), sandbox, { filename: f });
}
const exs = (sandbox.window.FIT_EXERCISES || []).map((e) => ({
  id: e.id, name: e.name, en: e.en || "", parts: e.parts || [], equip: e.equip || "", level: e.level || ""
}));
const out = path.join(SITE, "tools", "art", "exercises.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(exs, null, 1), "utf8");
console.log("exported", exs.length, "->", out);
