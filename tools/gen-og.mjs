#!/usr/bin/env node
/* tools/gen-og.mjs —— 生成 1200×630 的 og 分享图（assets/img/og.png）
 *
 *   node tools/gen-og.mjs
 *
 * 做法：headless Chrome 打开 tools/og-card.html（与站点同一套设计语言，系统字体、无外部资源），
 * 按 1200×630 截图落到 assets/img/og.png。改卡片样式后重跑一次即可，无手工修图步骤。
 * Chrome 路径自动探测复用 tools/lib/chrome.mjs，Windows / macOS / Linux 均可复跑。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { findChrome } from "./lib/chrome.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const card = path.join(root, "tools", "og-card.html");
const out = path.join(root, "assets", "img", "og.png");

const chrome = findChrome();
if (!chrome) {
  console.error("✗ 未找到 Chrome/Chromium（可用 $CHROME 指定路径）");
  process.exit(1);
}
const profile = path.join(os.tmpdir(), "ig-og-" + process.pid);
const r = spawnSync(chrome, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  "--hide-scrollbars", "--force-device-scale-factor=1",
  "--user-data-dir=" + profile,
  "--window-size=1200,630",
  "--screenshot=" + out,
  pathToFileURL(card).href,
], { encoding: "utf8", timeout: 120000 });
try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* 句柄可能未释放，忽略 */ }
if (r.status !== 0 || !fs.existsSync(out)) {
  console.error("✗ 截图失败：" + (r.stderr || "").split(/\r?\n/).filter(Boolean).slice(-3).join(" / "));
  process.exit(1);
}
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`✓ 已生成 assets/img/og.png（1200×630，${kb} KB）`);
console.log("  提示：改动 pages.config.json 的 defaultOgImage 或域名后，记得 npm run build 同步页面。");
