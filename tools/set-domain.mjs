#!/usr/bin/env node
/* tools/set-domain.mjs —— 部署前一键换域名
 *
 *   node tools/set-domain.mjs https://iron-gravity.example.com
 *
 * 做的事：
 *   1. 把 pages.config.json 的 baseUrl 改成新域名，并把 og:image 改成绝对 URL
 *   2. 重跑 build-pages（9+ 页的 canonical / og:* 一起更新）
 *   3. 重写 sitemap.xml 的 <loc>
 *   4. 在 robots.txt 末尾写 Sitemap: 绝对地址
 * 幂等：域名不变时不会产生任何改动。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let base = process.argv[2];
if (!base) {
  console.error("用法: node tools/set-domain.mjs https://your-domain.com");
  process.exit(1);
}
base = base.replace(/\/+$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("✗ 域名要以 http:// 或 https:// 开头");
  process.exit(1);
}

const cfgPath = path.join(root, "pages.config.json");
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const old = cfg.baseUrl;
cfg.baseUrl = base;
cfg.defaultOgImage = base + "/assets/img/og.png";
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + "\n", "utf8");
console.log(`pages.config.json: baseUrl ${old} → ${base}`);

/* 重写 sitemap */
const smPath = path.join(root, "sitemap.xml");
if (fs.existsSync(smPath)) {
  const slugs = cfg.pages.map((p) => p.slug);
  const prio = { index: "1.0", exercises: "0.9", muscles: "0.9", plans: "0.8", nutrition: "0.8", evidence: "0.8", videos: "0.7", glossary: "0.7", detail: "0.6", log: "0.5" };
  const rows = slugs
    .filter((s) => fs.existsSync(path.join(root, s + ".html")))
    .map((s) => `  <url><loc>${base}/${s}.html</loc><priority>${prio[s] || "0.5"}</priority></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows}
</urlset>
`;
  fs.writeFileSync(smPath, xml, "utf8");
  console.log(`sitemap.xml: 已重写 ${rows.split("\n").length} 条`);
}

/* robots.txt 补 Sitemap 行（幂等） */
const rbPath = path.join(root, "robots.txt");
if (fs.existsSync(rbPath)) {
  let rb = fs.readFileSync(rbPath, "utf8").replace(/\n*Sitemap:.*$/m, "").replace(/\s+$/, "");
  rb += `\nSitemap: ${base}/sitemap.xml\n`;
  fs.writeFileSync(rbPath, rb, "utf8");
  console.log("robots.txt: 已写入 Sitemap 行");
}

/* 重跑构建，让 canonical / og:* 跟着变 */
const r = spawnSync(process.execPath, [path.join(root, "tools", "build-pages.mjs")], { cwd: root, encoding: "utf8" });
process.stdout.write(r.stdout || "");
if (r.status !== 0) { process.stderr.write(r.stderr || ""); process.exit(r.status || 1); }
console.log("✓ 完成：canonical / og:image / sitemap / robots 均已指向 " + base);
console.log("  分享图为 1200×630 的 assets/img/og.png（改样式后用 node tools/gen-og.mjs 重新生成）。");
