#!/usr/bin/env node
/* tools/check-all.mjs —— 一键回归（纯 Node，跨平台；不依赖 Git Bash / Python / 写死的 Chrome 路径）
 *
 *   node tools/check-all.mjs            全量回归
 *   node tools/check-all.mjs --no-links 跳过联网外链复检（离线/CI 受限时用）
 *   node tools/check-all.mjs --no-a11y  跳过无障碍实测
 *
 * 步骤：语法 → 构建一致性 → 几何 → 映射 → 服务器自测 → 数据校验 → 外链 → 冒烟 → 无障碍
 * 退出码：0 全过；1 有失败步骤。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findChrome, dumpDom, decodeEntities } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const NODE = process.execPath;
const results = [];

function run(script, extra = []) {
  const r = spawnSync(NODE, [path.join("tools", script), ...extra], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 300000 });
  const out = (r.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  return { code: r.status, last: out[out.length - 1] || "", all: out.join("\n"), err: (r.stderr || "").trim() };
}
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log((ok ? "✓ " : "✗ ") + name.padEnd(14, " ") + (detail || ""));
}

console.log("铁引力 · 回归链\n" + "─".repeat(64));

/* 1. 语法 */
{
  const files = [
    ...fs.readdirSync(path.join(root, "assets/js")).filter((f) => f.endsWith(".js")).map((f) => "assets/js/" + f),
    ...fs.readdirSync(path.join(root, "tools")).filter((f) => f.endsWith(".mjs")).map((f) => "tools/" + f),
    ...fs.readdirSync(path.join(root, "tools/lib")).filter((f) => f.endsWith(".mjs")).map((f) => "tools/lib/" + f),
  ];
  const bad = files.filter((f) => spawnSync(NODE, ["--check", f], { cwd: root }).status !== 0);
  record("语法", bad.length === 0, files.length + " 个文件" + (bad.length ? " · 失败：" + bad.join(",") : " 全过"));
}

/* 2. 纯函数单元测试（calc.js：BMR / 宏量 / 1RM / 周起始 / 容量口径） */
{
  const r = run("unit-tests.mjs");
  record("单元测试", r.code === 0, r.last);
}

/* 3. 构建一致性（页面与 partials/config 是否同步） */
{
  const r = run("build-pages.mjs", ["--check"]);
  record("构建一致性", r.code === 0, r.last);
}

/* 3. 几何自检 / 4. 映射 */
{
  const r = run("art/angle_check.mjs");
  record("几何自检", r.code === 0, r.last);
}
{
  const r = run("art/map_check.mjs");
  record("肌群映射", r.code === 0, r.last);
}
/* 5. 本地服务器逐页自测 */
{
  const r = run("selftest.mjs");
  record("服务器自测", r.code === 0, r.last);
}
/* 6. 数据自检 */
{
  const r = run("validate.mjs");
  record("数据校验", r.code === 0, r.last);
}

/* 7. 外链复检 + 站内媒体验证（可跳过） */
if (args.has("--no-links")) {
  record("外链复检", true, "已跳过（--no-links）");
  record("媒体验证", true, "已跳过（--no-links）");
} else {
  const r = run("check-links.mjs");
  record("外链复检", r.code === 0, r.last);
  /* 7.5 媒体与文献：这些链接在 data-evidence.js 里，不在 HTML 里，check-links 扫不到。
     视频走 oEmbed（200 = 存在且可嵌入），文献走 NCBI esummary 批量核对标题。 */
  const m = run("check-media.mjs");
  record("媒体验证", m.code === 0, m.last);
}

/* 8. 端到端冒烟（需要 Chrome） */
const chrome = findChrome();
if (!chrome) {
  record("端到端冒烟", false, "✗ 找不到 Chrome/Chromium（可用 CHROME 环境变量指定）");
} else {
  const { stdout } = dumpDom(chrome, path.join(root, "tools/smoke.html"), { budget: 120000, windowSize: "1280,900" });
  const dom = decodeEntities(stdout);
  const m = dom.match(/合计 (\d+) 项，失败 (\d+) 项/);
  if (!m) record("端到端冒烟", false, "没拿到结果（Chrome 启动失败？）");
  else {
    record("端到端冒烟", m[2] === "0", `合计 ${m[1]} 项，失败 ${m[2]} 项`);
    if (m[2] !== "0") {
      /* 失败时把明细打出来 —— 否则 CI 上只知道「失败 2 项」，定位不到是哪两条 */
      dom.split(/\r?\n/).filter((l) => /FAIL\s*\|/.test(l)).slice(0, 12)
        .forEach((l) => console.log("    " + l.trim()));
    }
  }
}

/* 9. 无障碍实测（需要 Chrome + axe） */
if (args.has("--no-a11y")) {
  record("无障碍 axe", true, "已跳过（--no-a11y）");
} else {
  const r = run("a11y-audit.mjs");
  const combos = (r.all.match(/^== .* violations=0.*$/gm) || []).length;
  const bad = (r.all.match(/^\s+\S+ \[(critical|serious)\]/gm) || []).length;
  /* v17：每页跑深色 + 浅色两轮，所以组合数 = 页数 × 2 */
  record("无障碍 axe", r.code === 0,
    r.code === 0 ? `${combos} 组合（${combos / 2} 页 × 2 主题）0 违规` : `${bad} 条 critical/serious 违规`);
  if (r.code !== 0) {
    r.all.split(/\r?\n/).filter((l) => /\[(critical|serious)\]/.test(l)).slice(0, 20)
      .forEach((l) => console.log("    " + l.trim()));
  }
}

/* 汇总 */
const fail = results.filter((r) => !r.ok);
console.log("─".repeat(64));
console.log(`合计 ${results.length} 项检查 · 失败 ${fail.length} 项`);
if (fail.length) {
  fail.forEach((f) => console.log("  ✗ " + f.name + " — " + f.detail));
  process.exit(1);
}
console.log("全绿 ✓");
