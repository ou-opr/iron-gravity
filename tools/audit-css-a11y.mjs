/* 静态审计：CSS 自定义属性定义/使用一致性 + 疑似未使用类 + 页面级无障碍静态项
   用法：node tools/audit-css-a11y.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "exercises", "detail", "plans", "nutrition", "videos", "log", "glossary", "muscles"];
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const css = read("assets/css/style.css");
const jsFiles = fs.readdirSync(path.join(root, "assets/js")).filter((f) => f.endsWith(".js"));
const jsAll = jsFiles.map((f) => read("assets/js/" + f)).join("\n");
const htmlAll = pages.map((p) => read(p + ".html")).join("\n");
const toolHtml = fs.readdirSync(path.join(root, "tools")).filter((f) => f.endsWith(".html"))
  .map((f) => read("tools/" + f)).join("\n");

/* ---- 1) CSS 变量：定义 vs 使用 ---- */
const defined = new Set([...css.matchAll(/(^|[^\w(])(--[\w-]+)\s*:/g)].map((m) => m[2]));
const used = new Set();
const scan = (text, label) => {
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) used.add(m[1]);
};
scan(css, "css"); scan(jsAll, "js"); scan(htmlAll, "html");
const undefinedVars = [...used].filter((v) => !defined.has(v));
const unusedVars = [...defined].filter((v) => !used.has(v));

console.log("== CSS 变量 ==");
console.log("定义 " + defined.size + " 个，使用 " + used.size + " 个");
console.log(undefinedVars.length ? "⚠ 使用但未定义: " + undefinedVars.join(", ") : "✓ 无未定义引用");
console.log(unusedVars.length ? "· 定义但未使用（可清理）: " + unusedVars.join(", ") : "✓ 无未使用定义");

/* ---- 2) 疑似未使用类（.cls 定义但全站文本中找不到） ---- */
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
const classDefs = new Set();
for (const m of cssNoComments.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classDefs.add(m[1]);
const universe = jsAll + "\n" + htmlAll + "\n" + toolHtml;
const unusedClasses = [...classDefs].filter((c) => {
  const re = new RegExp("(^|[^\\w-])" + c.replace(/[-]/g, "\\-") + "([^\\w-]|$)");
  return !re.test(universe);
});
console.log("\n== 类选择器 ==");
console.log("CSS 中定义 " + classDefs.size + " 个类；疑似未使用 " + unusedClasses.length + " 个");
if (unusedClasses.length) console.log("  " + unusedClasses.slice(0, 40).join(", ") + (unusedClasses.length > 40 ? " …" : ""));

/* ---- 3) 无障碍静态项（每页） ---- */
console.log("\n== 无障碍静态检查 ==");
for (const p of pages) {
  const h = read(p + ".html");
  const issues = [];
  if (!/<html[^>]+lang="/.test(h)) issues.push("缺 html[lang]");
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) issues.push("h1 数量=" + h1);
  const imgs = [...h.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/alt=/.test(t)).length;
  if (noAlt) issues.push(noAlt + " 个 <img> 缺 alt");
  const inputs = [...h.matchAll(/<(input|select|textarea)\b[^>]*>/g)].map((m) => m[0]);
  const unlabeled = inputs.filter((t) => !/aria-label|id=/.test(t)).length;
  if (unlabeled) issues.push(unlabeled + " 个表单控件无 id/aria-label");
  if (!/skip-link|跳到主内容/.test(h)) issues.push("无跳转主内容链接");
  if (!/aria-live/.test(h)) issues.push("无 aria-live 区域（静态页可接受）");
  console.log((issues.length ? "· " : "✓ ") + p + ".html" + (issues.length ? " → " + issues.join("；") : ""));
}

/* ---- 4) 内联样式计数（代码质量追踪） ---- */
const inlineAll = jsAll + "\n" + htmlAll;
const inlineStyle = (inlineAll.match(/style="/g) || []).length;
console.log("\n== 内联样式 ==");
console.log("style=\"…\" 出现次数（js+html 合计）: " + inlineStyle);
/* 高频模式：把每个 style="…" 的内容归一后计数，找可批量抽类的目标 */
const freq = new Map();
for (const m of inlineAll.matchAll(/style="([^"]*)"/g)) {
  const key = m[1].trim();
  freq.set(key, (freq.get(key) || 0) + 1);
}
console.log("去重后 " + freq.size + " 种写法，出现 ≥3 次的有：");
[...freq.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log("  ×" + n + "  " + (k.length > 90 ? k.slice(0, 90) + "…" : k)));
