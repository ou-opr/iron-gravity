/* 按外部评审 P2 做机械修复：manifest 相对路径 / 全站外部脚本加 defer / 补 og+twitter+apple meta
   用法：node tools/fix-review-p2.mjs [--check]   （--check 只报告不改） */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const pages = ["index", "exercises", "detail", "plans", "nutrition", "videos", "log", "glossary", "muscles"];
const report = [];

/* 1) manifest.json：绝对路径 → 相对路径 */
{
  const p = path.join(root, "assets/manifest.json");
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  s = s.replace('"start_url": "/index.html"', '"start_url": "./index.html"')
       .replace('"scope": "/"', '"scope": "./"')
       .replaceAll('"/assets/', '"./assets/');
  if (s !== before) { if (!check) fs.writeFileSync(p, s); report.push("manifest.json → 相对路径（start_url/scope/icons）"); }
  else report.push("manifest.json 已是相对路径，跳过");
}

/* 2)+3) 各页：外部脚本加 defer；补 og/twitter/apple meta（幂等） */
for (const name of pages) {
  const p = path.join(root, name + ".html");
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  let notes = [];

  const nDefer = (s.match(/<script src=/g) || []).length;
  s = s.replace(/<script src=("[^"]+")><\/script>/g, '<script defer src=$1></script>');
  if (s !== before) notes.push(nDefer + " 个外部脚本已加 defer");

  if (!s.includes('property="og:title"')) {
    const title = (s.match(/<title>([^<]*)<\/title>/) || [])[1] || "铁引力 IRON GRAVITY";
    const desc = (s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    const og = [
      '<meta property="og:title" content="' + title.replace(/"/g, "&quot;") + '">',
      '<meta property="og:description" content="' + desc.replace(/"/g, "&quot;") + '">',
      '<meta property="og:type" content="website">',
      '<meta property="og:image" content="./assets/img/icon-512.png">',
      '<meta name="twitter:card" content="summary">',
      '<link rel="apple-touch-icon" href="assets/img/icon-192.png">',
      '<meta name="apple-mobile-web-app-capable" content="yes">',
      '<meta name="apple-mobile-web-app-title" content="铁引力">'
    ].join("\n");
    s = s.replace(/(<meta name="theme-color"[^>]*>)/, "$1\n" + og);
    if (!s.includes('property="og:title"')) throw new Error(name + ": og 注入锚点未找到（theme-color）");
    notes.push("补 og/twitter/apple meta");
  }

  if (s !== before) {
    if (!check) fs.writeFileSync(p, s);
    report.push(name + ".html：" + notes.join("；"));
  }
}
console.log(report.join("\n"));
console.log(check ? "[check 模式，未写入]" : "完成");
