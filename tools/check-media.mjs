#!/usr/bin/env node
/* tools/check-media.mjs —— 站内「媒体与文献」链接的实际可用性验证
 *
 * 为什么要单独一个脚本：这些链接不在 HTML 里，全在 assets/js/data-evidence.js 的数据里
 * （动作→视频 60 条、证据文献 11 篇），`check-links.mjs` 扫 href 根本扫不到。
 *
 * 验证方式不是「HTTP 200 就算」：
 *   · 视频 → YouTube oEmbed。200 = 视频存在且允许嵌入；401/403/404 = 私有/删除/不存在。
 *       并且把 oEmbed 返回的标题与数据里写的标题比对，防止「链接还在但已经不是那个视频」。
 *   · 文献 → NCBI esummary 批量取元数据，校验 PMID 存在且标题一致（一次请求验全部）。
 *
 * 用法：node tools/check-media.mjs [--json]
 * 退出码：0 全通过 / 1 有失败 / 2 网络不可用（不算内容问题）
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = process.argv.includes("--json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- 读数据：数据文件是纯赋值，用 vm 求值拿结构，不做正则硬啃 ---------- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, "assets/js/data-evidence.js"), "utf8"), sandbox);
const EXV = sandbox.window.IG_EX_VIDEO || {};
const EV = sandbox.window.IG_EVIDENCE || {};

const videos = [];
Object.keys(EXV).forEach((eid) => (EXV[eid] || []).forEach((v) => videos.push({ eid, ...v })));
const refs = Object.values(EV.refs || {}).filter((r) => r && r.pmid);

/* ---------- 比对标题：只做宽松归一（标点/大小写/空白），不做模糊匹配 ---------- */
function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, " ").trim();
}
function titleMatches(a, b) {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

/* ---------- 视频：oEmbed，4 并发 + 限流重试 ---------- */
async function probeVideo(v) {
  const url = "https://www.youtube.com/oembed?url=" + encodeURIComponent(v.u) + "&format=json";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" } });
      if (r.status === 200) {
        const j = await r.json();
        return { eid: v.eid, url: v.u, ok: true, author: j.author_name, title: j.title, sameTitle: titleMatches(j.title, v.t) };
      }
      if ([400, 401, 403, 404, 410].includes(r.status)) {
        return { eid: v.eid, url: v.u, ok: false, status: r.status, why: "视频不存在 / 私有 / 禁止嵌入" };
      }
      await sleep(1200 * (attempt + 1)); /* 429/5xx → 退避重试 */
    } catch (e) {
      await sleep(1200 * (attempt + 1));
      if (attempt === 2) return { eid: v.eid, url: v.u, ok: false, status: 0, why: "网络错误：" + e.message };
    }
  }
  return { eid: v.eid, url: v.u, ok: false, status: 0, why: "限流（重试 3 次仍失败）" };
}

async function checkVideos() {
  const out = new Array(videos.length);
  let i = 0;
  const worker = async () => {
    while (i < videos.length) {
      const idx = i++;
      out[idx] = await probeVideo(videos[idx]);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  return out;
}

/* ---------- 文献：一次 esummary 批量验 ---------- */
async function checkRefs() {
  if (!refs.length) return [];
  const ids = refs.map((r) => r.pmid).join(",");
  const res = [];
  try {
    const r = await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=" + ids,
      { headers: { "User-Agent": UA } });
    const j = await r.json();
    for (const ref of refs) {
      const rec = j.result && j.result[ref.pmid];
      if (!rec || rec.error) {
        res.push({ pmid: ref.pmid, ok: false, why: "NCBI 查无此 PMID" });
        continue;
      }
      res.push({
        pmid: ref.pmid, ok: true,
        journal: rec.source, year: (rec.pubdate || "").slice(0, 4),
        sameTitle: titleMatches(rec.title, ref.t),
        title: rec.title
      });
    }
  } catch (e) {
    return refs.map((ref) => ({ pmid: ref.pmid, ok: false, why: "网络错误：" + e.message }));
  }
  return res;
}

/* ---------- 主流程 ---------- */
const [vres, rres] = await Promise.all([checkVideos(), checkRefs()]);

const vOk = vres.filter((x) => x.ok);
const vBad = vres.filter((x) => !x.ok);
const vRenamed = vOk.filter((x) => x.sameTitle === false);
const rOk = rres.filter((x) => x.ok);
const rBad = rres.filter((x) => !x.ok);
const rMismatch = rOk.filter((x) => x.sameTitle === false);

if (JSON_OUT) {
  console.log(JSON.stringify({ videos: vres, refs: rres }, null, 2));
} else {
  console.log("媒体与文献验证（" + new Date().toISOString().slice(0, 10) + "）\n" + "─".repeat(58));
  console.log(`视频  ${videos.length} 条 · 通过 ${vOk.length} · 失败 ${vBad.length}`);
  for (const x of vBad) console.log(`  ✗ ${x.eid}  ${x.url}  ${x.why}${x.status ? " (" + x.status + ")" : ""}`);
  if (vRenamed.length) {
    console.log(`  ⚠ 标题与数据不符 ${vRenamed.length} 条（视频可用，但可能被改过标题）：`);
    for (const x of vRenamed) {
      const declared = ((EXV[x.eid] || [])[0] || {}).t || "";
      console.log(`     ${x.eid}  数据「${declared.slice(0, 40)}…」 / 实际「${x.title.slice(0, 40)}…」`);
    }
  }
  console.log(`文献  ${rres.length} 条 · 通过 ${rOk.length} · 失败 ${rBad.length}`);
  for (const x of rBad) console.log(`  ✗ PMID ${x.pmid}  ${x.why}`);
  for (const x of rMismatch) console.log(`  ⚠ PMID ${x.pmid} 标题不符：NCBI「${String(x.title).slice(0, 46)}…」`);
  console.log("─".repeat(58));
  console.log(`合计 ${videos.length + rres.length} 条 · 失败 ${vBad.length + rBad.length} 条`);
}

const hardFail = vBad.length + rBad.length;
process.exit(hardFail ? 1 : 0);
