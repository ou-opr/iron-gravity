/* tools/lib/chrome.mjs —— 跨平台 Chrome/Chromium 定位与 headless 页面导出
 * 解决的问题：此前 check-all.sh 写死 C:/Program Files/.../chrome.exe，非 Windows 或换了安装位置就跑不了。
 * 查找顺序：$CHROME → $CHROME_PATH → 各平台常见安装路径 → PATH。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const WIN = process.platform === "win32";
const MAC = process.platform === "darwin";

const CANDIDATES = [
  process.env.CHROME,
  process.env.CHROME_PATH,
  WIN && "C:/Program Files/Google/Chrome/Application/chrome.exe",
  WIN && "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  WIN && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  MAC && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  MAC && "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/snap/bin/chromium",
];

export function findChrome() {
  for (const c of CANDIDATES) {
    if (c && fs.existsSync(c)) return c;
  }
  const which = WIN ? "where" : "which";
  for (const name of ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "chrome"]) {
    try {
      const out = execFileSync(which, [name], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
      const p = out.split(/\r?\n/).map((x) => x.trim()).filter(Boolean)[0];
      if (p && fs.existsSync(p)) return p;
    } catch { /* not found */ }
  }
  return null;
}

/** 用 headless Chrome 打开本地页面并导出渲染后的 DOM */
export function dumpDom(chromePath, filePath, { budget = 90000, windowSize = "1280,900", query = "" } = {}) {
  const profile = path.join(os.tmpdir(), "ig-chrome-" + process.pid + "-" + Math.random().toString(36).slice(2, 8));
  const url = pathToFileURL(filePath).href + (query ? "?" + query : "");
  const args = [
    "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
    "--allow-file-access-from-files", "--hide-scrollbars",
    "--user-data-dir=" + profile,
    "--window-size=" + windowSize,
    "--virtual-time-budget=" + budget,
    "--dump-dom",
    url,
  ];
  const r = spawnSync(chromePath, args, { encoding: "utf8", maxBuffer: 96 * 1024 * 1024, timeout: 240000 });
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome 可能仍持有句柄，忽略 */ }
  return { stdout: r.stdout || "", stderr: r.stderr || "", status: r.status };
}

/** 把 dump 出来的 HTML 实体解回文本（只处理我们输出的那几种） */
export function decodeEntities(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
