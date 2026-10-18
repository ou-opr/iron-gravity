#!/usr/bin/env node
/* tools/build-pages.mjs —— 最小构建层：把 nav / head 元信息 / footer 从 partials 同步进 9+ 个页面。
 *
 * 解决的问题：此前 head、nav、footer 在 9 个 HTML 里各复制一份，改导航要改 9 处。
 * 设计取舍：**不引入 src→dist**——根目录的 HTML 始终是完整、可双击打开的成品
 *          （这是本站「零依赖、双击即用」的核心卖点），脚本只重写其中三段：
 *            · <meta charset="utf-8"> … </head>   （title/description/canonical/og/icon/manifest/主题色）
 *            · <nav class="nav"> … </nav>
 *            · <footer> … </footer>
 *          页面正文（hero / main / scripts）一个字都不碰。
 *
 * 用法：
 *   node tools/build-pages.mjs           写入（幂等）
 *   node tools/build-pages.mjs --check   只校验是否与生成结果一致（CI 用，不一致退出码 1）
 *   node tools/build-pages.mjs --dry     只打印哪些页会变
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const DRY = args.has("--dry");

const cfg = JSON.parse(fs.readFileSync(path.join(root, "pages.config.json"), "utf8"));
const navRaw = fs.readFileSync(path.join(root, "partials/nav.part.html"), "utf8").replace(/\r\n/g, "\n").replace(/\s+$/, "");
const footerTpl = fs.readFileSync(path.join(root, "partials/footer.part.html"), "utf8").replace(/\r\n/g, "\n");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function headHTML(p) {
  const url = cfg.baseUrl.replace(/\/$/, "") + "/" + p.slug + ".html";
  const og = p.ogImage || cfg.defaultOgImage;
  return [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1">`,
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.desc)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:title" content="${esc(p.title)}">`,
    `<meta property="og:description" content="${esc(p.desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:image" content="${og}">`,
    `<meta name="twitter:card" content="summary">`,
    `<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">`,
    `<link rel="manifest" href="assets/manifest.json">`,
    `<meta name="theme-color" content="#0a0b10">`,
    `<link rel="apple-touch-icon" href="assets/img/icon-192.png">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-title" content="铁引力">`,
    ...(p.extraHead ? [p.extraHead] : []),
    `<link rel="stylesheet" href="assets/css/style.css">`,
  ].join("\n") + "\n";
}

function footerHTML(p) {
  const list = (p.col3 || []).map((x) => `<li>${x}</li>`).join("");
  return footerTpl
    .replace("{{COL3_TITLE}}", p.col3Title || "说明")
    .replace("{{COL3_LIST}}", list)
    .replace("{{VERIFY_MONTH}}", cfg.verifyMonth || "")
    .replace(/\s+$/, "");   /* 末尾不留换行：锚点区间外已有换行，否则每跑一次多一个空行（幂等性） */
}

const HEAD_RE = /<meta charset="utf-8">[\s\S]*?(?=<\/head>)/;
const NAV_RE = /[ \t]*<nav class="nav"[\s\S]*?<\/nav>/;
const FOOT_RE = /<footer>[\s\S]*?<\/footer>/;

let changed = [], skipped = [], missing = [];
for (const p of cfg.pages) {
  const f = path.join(root, p.slug + ".html");
  if (!fs.existsSync(f)) { missing.push(p.slug); continue; }
  const before = fs.readFileSync(f, "utf8");
  let after = before;

  if (!HEAD_RE.test(after)) { console.error(`✗ ${p.slug}.html 找不到 head 锚点`); process.exitCode = 1; continue; }
  after = after.replace(HEAD_RE, headHTML(p));

  if (!NAV_RE.test(after)) { console.error(`✗ ${p.slug}.html 找不到 nav 锚点`); process.exitCode = 1; continue; }
  after = after.replace(NAV_RE, navRaw);

  if (!FOOT_RE.test(after)) { console.error(`✗ ${p.slug}.html 找不到 footer 锚点`); process.exitCode = 1; continue; }
  after = after.replace(FOOT_RE, footerHTML(p));

  if (after === before) { skipped.push(p.slug); continue; }
  changed.push(p.slug);
  if (!CHECK && !DRY) fs.writeFileSync(f, after, "utf8");
}

const mode = CHECK ? "检查" : DRY ? "预演" : "构建";
console.log(`[${mode}] 配置 ${cfg.pages.length} 页 · 有变化 ${changed.length} · 无变化 ${skipped.length}${missing.length ? " · 未创建 " + missing.length : ""}`);
if (changed.length) console.log("  变更：" + changed.join(", "));
if (missing.length) console.log("  尚未创建（跳过）：" + missing.join(", "));
if (CHECK && changed.length) {
  console.error("✗ 页面与 partials/pages.config.json 不一致 —— 请运行 `node tools/build-pages.mjs` 后提交");
  process.exitCode = 1;
}

/* ---- Service Worker 版本号：从 package.json 注入 ----
   手改 sw.js 的 VERSION 必然会忘（改了站点但缓存还是旧的），这里统一由版本号派生。 */
{
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const swPath = path.join(root, "sw.js");
  if (fs.existsSync(swPath)) {
    const src = fs.readFileSync(swPath, "utf8");
    const want = 'const VERSION = "v' + pkg.version + '";';
    if (!/const VERSION = "[^"]*";/.test(src)) {
      console.error("✗ sw.js 里找不到 VERSION 常量");
      process.exitCode = 1;
    } else {
      const out = src.replace(/const VERSION = "[^"]*";/, want);
      if (out !== src) {
        if (CHECK) { console.error(`✗ sw.js 的 VERSION 与 package.json（${pkg.version}）不一致`); process.exitCode = 1; }
        else { fs.writeFileSync(swPath, out, "utf8"); console.log(`  sw.js 版本 → v${pkg.version}`); }
      }
    }
  }
}
