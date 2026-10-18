#!/usr/bin/env node
/* 铁引力 · 链接复检脚本
   用法：node tools/check-links.mjs
   读取 assets/js/data-*.js 里的全部外链，实测可达性；同时校验站内链接是否存在。
   结果写入 tools/link-report.json。 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = path.join(root, 'assets/js');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const win = {};
/* 说明：这里 eval 的是本仓库自带的 data-*.js 数据文件（纯静态、随仓库版本控制），
   不涉及任何外部/用户输入，new Function 只是为了让 window.xxx 赋值在 Node 中生效。 */
for (const f of fs.readdirSync(jsDir).filter((x) => /^data-.*\.js$/.test(x))) {
  const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
  try { new Function('window', code)(win); } catch (e) { console.error('load fail', f, e.message); }
}

const urls = new Set();
for (const c of (win.FIT_VIDEOS || { creators: [] }).creators) {
  if (c.home) urls.add(c.home);
  if (c.search) urls.add(c.search);
  for (const v of (c.videos || [])) if (v.url) urls.add(v.url);
}
urls.add('https://pubmed.ncbi.nlm.nih.gov/41343037/');
urls.add('https://pubmed.ncbi.nlm.nih.gov/28698222/');
urls.add('https://pmc.ncbi.nlm.nih.gov/articles/PMC8978023/');

/* 站内链接检查 */
const internal = [];
for (const f of fs.readdirSync(root).filter((x) => x.endsWith('.html'))) {
  /* 扫描前剥离 <script>/<style> 块：内联脚本里的链接是运行时拼接（如 href="' + PG.ex + ...），
     静态解析必然误报成坏链（本项曾误报 muscles.html 的 2 条 → 此处根治） */
  const html = fs.readFileSync(path.join(root, f), 'utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  for (const m of html.matchAll(/(?:href|src)="([^"#]+?)(?:#[^"]*)?"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|data:)/.test(u)) continue;
    internal.push({ from: f, to: u, ok: fs.existsSync(path.join(root, u)) });
  }
}

async function probeOnce(u) {
  const t0 = Date.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 25000);
  try {
    const res = await fetch(u, { redirect: 'follow', signal: ac.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'zh-CN,zh;q=0.9' } });
    clearTimeout(timer);
    try { await res.body?.cancel(); } catch { /* ignore */ }
    return { url: u, status: res.status, ok: res.status >= 200 && res.status < 400, ms: Date.now() - t0 };
  } catch (e) {
    clearTimeout(timer);
    return { url: u, status: -1, ok: false, ms: Date.now() - t0, error: String(e.message || e) };
  }
}
/* 本机出网走 TUN，youtube/pubmed 等偶尔瞬断 —— 失败先重试一次再判死，压掉假警报 */
async function probe(u) {
  let r = await probeOnce(u);
  if (!r.ok) {
    await new Promise((res) => setTimeout(res, 900));
    const r2 = await probeOnce(u);
    r2.retried = true;
    if (r2.ok || r2.status !== -1) return r2;
    return Object.assign(r2, { error: (r.error ? r.error + " | " : "") + (r2.error || "") });
  }
  return r;
}

const list = [...urls];
const results = [];
/* --slow：串行 + 间隔，用来区分「真限流」与「并发太猛被限流」（YouTube 对连发请求很敏感） */
const SLOW = process.argv.includes("--slow");
const BATCH = SLOW ? 1 : 5;
const GAP = SLOW ? 700 : 0;
for (let i = 0; i < list.length; i += BATCH) {
  const batch = list.slice(i, i + BATCH);
  const got = await Promise.all(batch.map(probe));
  results.push(...got);
  if (GAP) await new Promise((r) => setTimeout(r, GAP));
  console.log(`[${Math.min(i + BATCH, list.length)}/${list.length}]`);
}

const badInternal = internal.filter((x) => !x.ok);
/* v14：把「反爬限流」与「坏链」分开。
   YouTube 等站点对自动化请求返回 429/403：这恰恰说明路由有效（不是 404/410），
   若记成失败会产生假警报（本地连续复检时尤其明显）。限流项单列，不算通过也不算失败。
   v17：加 412 —— B 站对海外 IP（GitHub Actions runner）统一返回 412 Precondition Failed，
   是地理风控而不是坏链；国内网络下同一条链接是 200/302。 */
const THROTTLE = new Set([429, 403, 412]);
/* v15：对限流条目做一次串行复核 —— 并发 5 连发很容易被 YouTube 判为爬虫，
   串行 + 700ms 间隔通常就是 200。只有串行下仍限流，才算真的被拦。 */
const throttledRaw = results.filter((x) => !x.ok && THROTTLE.has(x.status));
if (throttledRaw.length) {
  console.log(`\n→ ${throttledRaw.length} 条被限流，串行复核中（间隔 700ms）…`);
  for (const r of throttledRaw) {
    await new Promise((res) => setTimeout(res, 700));
    const r2 = await probeOnce(r.url);
    const i = results.findIndex((x) => x.url === r.url);
    if (i >= 0) results[i] = Object.assign(r2, { rechecked: true });
  }
}
const throttled = results.filter((x) => !x.ok && THROTTLE.has(x.status));
const bad = results.filter((x) => !x.ok && !THROTTLE.has(x.status));
const report = { checkedAt: new Date().toISOString(), external: results, internal, badExternal: bad, throttledExternal: throttled, badInternal };
fs.writeFileSync(path.join(root, 'tools/link-report.json'), JSON.stringify(report, null, 2));

console.log('\n==== 外链结果 ====');
for (const r of results) console.log(((r.ok ? 'OK  ' : THROTTLE.has(r.status) ? 'THR ' : 'BAD ')) + String(r.status).padStart(4) + '  ' + r.ms + 'ms  ' + r.url);
if (badInternal.length) { console.log('\n==== 站内坏链 ===='); badInternal.forEach((x) => console.log(x.from + ' -> ' + x.to)); }
if (throttled.length) { console.log('\n==== 被限流 / 被风控（链接存在，反爬或地理拦截，非坏链）===='); throttled.forEach((x) => console.log('  ' + x.status + '  ' + x.url)); }
console.log('\n外链总计 ' + results.length + ' · 失败 ' + bad.length + ' · 限流/风控 ' + throttled.length + ' · 站内坏链 ' + badInternal.length);
process.exit(bad.length || badInternal.length ? 1 : 0);
