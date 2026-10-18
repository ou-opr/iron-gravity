#!/usr/bin/env node
/* tools/a11y-audit.mjs —— axe-core × 全部页面的 WCAG 2.1 A/AA 实测（纯 Node，无 Python 依赖）
 *
 * 用法：
 *   node tools/a11y-audit.mjs            跑全部页面
 *   node tools/a11y-audit.mjs --json     额外输出 JSON（供 CI 存档）
 * 退出码：0 = 无 critical/serious 违规；1 = 有；2 = 环境问题（找不到 Chrome / axe / 页面）
 *
 * axe-core 是第三方库（tools/axe.min.js，已在 .gitignore 中）：缺失时会尝试自动下载；
 * 下载失败也不会让整个回归挂掉——它只让这一项变成「跳过」。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findChrome, dumpDom, decodeEntities } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AXE = path.join(root, "tools", "axe.min.js");
const RUNNER = path.join(root, "tools", "a11y-run.html");
const AXE_URL = "https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js";

/* 页面列表：优先取 pages.config.json 的顺序（新增页面只改 config） */
function pageList() {
  const cfgPath = path.join(root, "pages.config.json");
  if (fs.existsSync(cfgPath)) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      const list = cfg.pages.map((p) => p.slug).filter((s) => fs.existsSync(path.join(root, s + ".html")));
      if (list.length) return list;
    } catch { /* 落到目录扫描 */ }
  }
  return fs.readdirSync(root).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5));
}

const chrome = findChrome();
if (!chrome) { console.error("✗ 找不到 Chrome/Chromium（可用 CHROME 环境变量指定路径）"); process.exit(2); }
if (!fs.existsSync(AXE)) {
  console.log("→ 未找到 tools/axe.min.js，尝试下载 axe-core 4.10.2 …");
  try {
    const res = await fetch(AXE_URL, { redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    fs.writeFileSync(AXE, Buffer.from(await res.arrayBuffer()));
    console.log("  ✓ 已下载 " + Math.round(fs.statSync(AXE).size / 1024) + " KB");
  } catch (e) {
    console.error("✗ 下载失败：" + e.message + "（可手动放置 tools/axe.min.js）");
    process.exit(2);
  }
}

const { stdout } = dumpDom(chrome, RUNNER, {
  budget: 180000,
  windowSize: "1280,900",
  query: "pages=" + encodeURIComponent(pageList().join(",")),
});
const m = stdout.match(/<div id="out">([\s\S]*?)<\/div>/);
if (!m) { console.error("✗ 没拿到结果（Chrome 启动失败或 --dump-dom 异常）"); process.exit(2); }
const text = decodeEntities(m[1]);
if (!/DONE/.test(text)) { console.error("✗ 审计未跑完：\n" + text.slice(0, 800)); process.exit(2); }

console.log(text);
const bad = text.split("\n").filter((l) => l.includes("[critical]") || l.includes("[serious]"));
const summary = (text.match(/^== .* violations=\d+.*$/gm) || []);

if (process.argv.includes("--json")) {
  fs.writeFileSync(path.join(root, "tools", "a11y-report.json"), JSON.stringify({
    checkedAt: new Date().toISOString(), chrome: path.basename(chrome), summary, criticalOrSerious: bad, raw: text,
  }, null, 2));
  console.log("\n已写入 tools/a11y-report.json");
}

console.log("\n== 结论 ==");
if (bad.length) {
  console.log("✗ " + bad.length + " 条 critical/serious 违规");
  bad.forEach((b) => console.log("  " + b.trim()));
  process.exit(1);
}
console.log("✓ 无 critical/serious 违规");
