/* v12 无障碍 + 内联样式归一（幂等）：跳过链接 / main 锚点 / hero 与 h1 抽类 / 图标 svg aria-hidden /
   aria-live 区域 / 高频内联间距换工具类。用法：node tools/fix-a11y-v12.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = ["index", "exercises", "detail", "plans", "nutrition", "videos", "log", "glossary", "muscles"];
const report = [];

for (const name of pages) {
  const p = path.join(root, name + ".html");
  let s = fs.readFileSync(p, "utf8");
  const before = s;
  const notes = [];

  /* 1) 跳过主内容链接 */
  if (!s.includes('class="skip"')) {
    s = s.replace(/(<body\b[^>]*>)/, '$1\n<a class="skip" href="#main">跳到主内容</a>');
    if (!s.includes('class="skip"')) throw new Error(name + ": body 锚点未找到");
    notes.push("加跳过链接");
  }
  /* 2) <main> 加 id="main"（无 id 时） */
  if (!/<main[^>]*id="main"/.test(s)) {
    s = s.replace(/<main class="wrap"/, '<main class="wrap" id="main"');
    notes.push("main 加 id");
  }
  /* 3) hero 内边距抽类 */
  if (s.includes('style="padding:46px 20px 36px"')) {
    s = s.replace(/<div class="in" style="padding:46px 20px 36px">/g, '<div class="in padtight">');
    notes.push("hero 抽 .padtight");
  }
  /* 4) 页面 h1 抽类 */
  if (s.includes('style="font-size:clamp(30px,4.6vw,46px)"')) {
    s = s.replace(/<h1([^>]*?) style="font-size:clamp\(30px,4\.6vw,46px\)"/g, "<h1$1 class=\"ph1\"");
    notes.push("h1 抽 .ph1");
  }
  /* 5) 图标 svg 装饰化（24×24 图标集，均与旁侧文字重复表达） */
  const iconRe = /<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"(?![^>]*aria-hidden)/g;
  const nIcon = (s.match(iconRe) || []).length;
  if (nIcon) { s = s.replace(iconRe, '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"'); notes.push(nIcon + " 个图标 aria-hidden"); }
  /* 6) aria-live 动态区域 */
  const live = [
    ['<span class="hint" id="exCount">', '<span class="hint" id="exCount" aria-live="polite">'],
    ['<span class="hint" id="vCount">', '<span class="hint" id="vCount" aria-live="polite">'],
    ['<div class="calc-res" id="calcRes">', '<div class="calc-res" id="calcRes" aria-live="polite">'],
    ['<div id="lgSummary" class="callout info">', '<div id="lgSummary" class="callout info" aria-live="polite">'],
    ['<div class="home-stats">', '<div class="home-stats" aria-live="polite">'],
    ['<p class="sub" id="dSub">', '<p class="sub" id="dSub" aria-live="polite">'],
    ['<span class="hint" id="glCount">', '<span class="hint" id="glCount" aria-live="polite">']
  ];
  let nLive = 0;
  for (const [a, b] of live) if (s.includes(a)) { s = s.replace(a, b); nLive++; }
  if (nLive) notes.push(nLive + " 处 aria-live");
  /* 7) 高频内联间距 → 工具类（仅精确匹配）；随后合并可能产生的重复 class 属性 */
  const swaps = [['style="margin-bottom:10px"', 'class="mb10"'], ['style="margin-top:10px"', 'class="mt10"'],
    ['style="margin-top:12px"', 'class="mt12"'], ['style="margin-top:14px"', 'class="mt14"'],
    ['style="padding-top:30px"', 'class="pt30"']];
  let nSwap = 0;
  for (const [a, b] of swaps) { const c = s.split(a).length - 1; nSwap += c; s = s.split(a).join(b); }
  let merged = 0;
  for (let i = 0; i < 4; i++) {
    const nxt = s.replace(/class="([^"]*)"(\s+)class="([^"]*)"/g, function (m, a, sp, b) { merged++; return 'class="' + a + " " + b + '"'; });
    if (nxt === s) break; s = nxt;
  }
  if (nSwap) notes.push(nSwap + " 处内联间距→工具类");
  if (merged) notes.push("合并 " + merged + " 处重复 class 属性");

  /* 8) 主导航 aria-label */
  if (!s.includes('class="nav" aria-label=')) {
    const n = (s.match(/<nav class="nav">/g) || []).length;
    if (n) { s = s.replace(/<nav class="nav">/g, '<nav class="nav" aria-label="主导航">'); notes.push("nav 加 aria-label"); }
  }

  if (s !== before) { fs.writeFileSync(p, s); report.push(name + ".html：" + notes.join("；")); }
}
console.log(report.length ? report.join("\n") : "（无改动）");
console.log("完成");
