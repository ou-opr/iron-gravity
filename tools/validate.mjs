#!/usr/bin/env node
/* 铁引力 · 数据自检：计数 + 引用完整性（动作 id 互链 / 计划动作存在性 / 视频链接格式）
   用法：node tools/validate.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = path.join(root, 'assets/js');
const win = {};
/* 说明：eval 的是本仓库自带数据文件（静态、版本控制内），无外部输入。 */
for (const f of fs.readdirSync(jsDir).filter((x) => /^data-.*\.js$/.test(x))) {
  new Function('window', fs.readFileSync(path.join(jsDir, f), 'utf8'))(win);
}
const ex = win.FIT_EXERCISES || [];
const plans = win.FIT_PLANS || [];
const cs = (win.FIT_VIDEOS || { creators: [] }).creators;
const N = win.FIT_NUTRITION || {};
const problems = [];

const ids = new Set();
ex.forEach((e) => {
  if (ids.has(e.id)) problems.push('重复动作 id: ' + e.id);
  ids.add(e.id);
  ['name', 'en', 'equip', 'level', 'dose'].forEach((k) => { if (!e[k]) problems.push(e.id + ' 缺字段 ' + k); });
  ['tips', 'errs'].forEach((k) => { if (!Array.isArray(e[k]) || !e[k].length) problems.push(e.id + ' 缺 ' + k); });
});
ex.forEach((e) => {
  (e.alt || []).forEach((a) => { if (!ids.has(a)) problems.push(e.id + ' 的替代动作引用不存在: ' + a); });
});
const pids = new Set();
plans.forEach((p) => {
  if (pids.has(p.id)) problems.push('重复计划 id: ' + p.id);
  pids.add(p.id);
  (p.schedule || []).forEach((d) => (d.items || []).forEach((it) => {
    if (!ids.has(it.ex)) problems.push(p.id + '/' + d.day + ' 引用了不存在的动作: ' + it.ex);
  }));
});
const cids = new Set();
cs.forEach((c) => {
  if (cids.has(c.id)) problems.push('重复创作者 id: ' + c.id);
  cids.add(c.id);
  (c.videos || []).forEach((v) => {
    if (!v.url || !/^https:/.test(v.url)) problems.push(c.id + ' 视频链接异常: ' + v.url);
    if (c.platform === 'bilibili' && v.bvid && v.url.indexOf(v.bvid) < 0) problems.push(c.id + ' bvid 与链接不一致: ' + v.bvid);
  });
});
(N.foods || []).forEach((f) => { ['name', 'tag', 'kcal'].forEach((k) => { if (f[k] === undefined) problems.push('食物缺字段 ' + k + ': ' + f.name); }); });

const G = win.FIT_GLOSSARY || {};
(G.terms || []).forEach((t) => { ['t', 'cat', 'd'].forEach((k) => { if (!t[k]) problems.push('术语缺字段 ' + k + ': ' + t.t); }); });
(G.faqs || []).forEach((f) => { ['q', 'a', 'cat'].forEach((k) => { if (!f[k]) problems.push('FAQ 缺字段 ' + k + ': ' + f.q); }); });
const TERM_CATS = ['训练强度', '训练方法', '力量', '计划设计', '恢复', '营养', '补剂'];
(G.terms || []).forEach((t) => { if (TERM_CATS.indexOf(t.cat) < 0) problems.push('术语分类不在约定列表: ' + t.cat + ' (' + t.t + ')'); });

const plat = {};
cs.forEach((c) => { plat[c.platform] = (plat[c.platform] || 0) + 1; });

/* v15：证据与来源 —— claims 必须都有真实文献、文献必须有 PMID、60 个动作都要有「注意人群」 */
const EV = win.IG_EVIDENCE || {};
const EVREF = EV.refs || {};
const claims = EV.claims || [];
const claimIds = new Set();
claims.forEach((c) => {
  ["id", "t", "lv", "say", "used"].forEach((k) => { if (!c[k]) problems.push("证据主张缺字段 " + k + ": " + (c.id || c.t)); });
  if (claimIds.has(c.id)) problems.push("重复证据主张 id: " + c.id);
  claimIds.add(c.id);
  if (["A", "B", "C"].indexOf(c.lv) < 0) problems.push("证据等级非法: " + c.id + " → " + c.lv);
  if (!(c.refs || []).length) problems.push("证据主张没有任何文献支撑: " + c.id);
  (c.refs || []).forEach((r) => { if (!EVREF[r]) problems.push("主张 " + c.id + " 引用了不存在的文献: " + r); });
});
Object.keys(EVREF).forEach((k) => {
  const r = EVREF[k];
  ["a", "y", "j", "t", "pmid"].forEach((f) => { if (!r[f]) problems.push("文献 " + k + " 缺字段 " + f); });
  if (!/^\d{6,9}$/.test(String(r.pmid))) problems.push("文献 " + k + " 的 PMID 格式不对: " + r.pmid);
});
/* 证据页里被 app.js 直接链接的 claim id 必须存在（防止改了 id 页面链接失效） */
["volume", "rir"].forEach((id) => { if (!claimIds.has(id)) problems.push("详情页引用的证据锚点不存在: claim-" + id); });
const CA = win.IG_CAUTION || {};
ex.forEach((e) => { if (!CA[e.id]) problems.push("动作缺「注意人群」: " + e.id); });
Object.keys(CA).forEach((k) => { if (!ids.has(k)) problems.push("注意人群引用了不存在的动作: " + k); });

/* v16/v17：动作 → 视频映射。v17 起覆盖全部动作，链接本身是 YouTube watch URL；
   真实可达性交给 tools/check-media.mjs（oEmbed），这里只做结构与格式断言。 */
const EXV = win.IG_EX_VIDEO || {};
Object.keys(EXV).forEach((k) => {
  if (!ids.has(k)) problems.push("视频映射引用了不存在的动作: " + k);
  (EXV[k] || []).forEach((v) => {
    ["a", "t", "u"].forEach((f) => { if (!v[f]) problems.push("动作 " + k + " 视频缺字段 " + f); });
    if (!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(v.u || "")) {
      problems.push("动作 " + k + " 的视频不是合法的 YouTube 链接: " + v.u);
    }
  });
});
ex.forEach((e) => { if (!((EXV[e.id] || []).length)) problems.push("动作没有教学视频: " + e.id); });

/* v16：退阶路径必须指向站内真实动作，且不能指向自己 */
const REG = win.IG_REGRESSION || {};
Object.keys(REG).forEach((k) => {
  if (!ids.has(k)) problems.push("退阶映射引用了不存在的动作: " + k);
  const arr = REG[k] || [];
  if (!arr.length) problems.push("退阶映射为空: " + k);
  arr.forEach((v, i) => {
    if (!ids.has(v)) problems.push("动作 " + k + " 的退阶引用了不存在的动作: " + v);
    if (v === k) problems.push("动作 " + k + " 的退阶指向自己");
    if (arr.indexOf(v) !== i) problems.push("动作 " + k + " 的退阶里有重复项: " + v);
  });
});

console.log('动作:', ex.length, '| 计划:', plans.length, '| 创作者:', cs.length,
  '| 视频条目:', cs.reduce((n, c) => n + (c.videos || []).length, 0),
  '| 食物:', (N.foods || []).length, '| 补剂:', (N.supplements || []).length,
  '| 术语:', (G.terms || []).length, '| FAQ:', (G.faqs || []).length,
  '| 证据主张:', claims.length, '/ 文献:', Object.keys(EVREF).length, '/ 注意人群:', Object.keys(CA).length);
console.log('平台分布:', JSON.stringify(plat));
if (problems.length) { console.log('发现问题:'); problems.forEach((p) => console.log('  -', p)); process.exit(1); }
console.log('校验通过 ✓');
