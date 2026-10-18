/* 铁引力 · IRON GRAVITY — app.js（1/3：核心工具 + 动作弹窗 + 首页） */
(function () {
"use strict";
var $ = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
function exById(id) { var r = (window.FIT_EXERCISES || []).filter(function (e) { return e.id === id; }); return r[0]; }
function planRefs(exId) {
  var out = [];
  (window.FIT_PLANS || []).forEach(function (p) {
    (p.schedule || []).forEach(function (d) {
      (d.items || []).forEach(function (it) { if (it.ex === exId) out.push({ plan: p.name, day: d.day, pid: p.id }); });
    });
  });
  return out.slice(0, 4);
}

/* ---------- 本地存储（收藏 / 训练日志 / 饮食目标；不可用时优雅降级） ---------- */
var LS = (function () {
  var ok = false;
  try { localStorage.setItem("__ig_t", "1"); localStorage.removeItem("__ig_t"); ok = true; } catch (e) { ok = false; }
  return {
    ok: ok,
    get: function (k, d) { if (!ok) return d; try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { if (!ok) return false; try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
})();
var FAV_EX = "ig_fav_exercises", FAV_CR = "ig_fav_creators", LOG_KEY = "ig_log_sessions", TGT_KEY = "ig_nutrition_target", CUSTOM_KEY = "ig_custom_plans";
function favList(key) { var v = LS.get(key, []); return Object.prototype.toString.call(v) === "[object Array]" ? v : []; }
function favHas(key, id) { return favList(key).indexOf(id) > -1; }
function favToggle(key, id) {
  var l = favList(key), i = l.indexOf(id);
  if (i > -1) l.splice(i, 1); else l.push(id);
  LS.set(key, l);
  return i === -1;
}
function ensureLsNotice() {
  if (LS.ok) return;
  if (document.getElementById("lsWarn")) return;
  var host = document.getElementById("lgNotice") || document.querySelector("main .wrap") || document.querySelector("main");
  if (!host) return;
  var d = document.createElement("div");
  d.id = "lsWarn";
  d.className = "callout warn";
  d.innerHTML = "<b>提示：</b>当前环境禁用了浏览器本地存储（直接双击 file:// 打开时可能出现），<b>收藏与训练日志将无法保存</b>。双击 <span class=\"kbd\">serve.cmd</span> 用本地服务打开即可正常使用，其余内容不受影响。";
  host.insertBefore(d, host.firstChild);
}
function installBackTop() {
  if (document.getElementById("backTop")) return;
  var b = document.createElement("button");
  b.className = "backtop"; b.id = "backTop"; b.type = "button";
  b.setAttribute("aria-label", "回到顶部"); b.setAttribute("title", "回到顶部"); b.textContent = "↑";
  document.body.appendChild(b);
  b.addEventListener("click", function () {
    /* v12：尊重「减少动态效果」偏好 */
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });
  var onScroll = function () { b.classList.toggle("on", window.scrollY > 700); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- 动效内核（v13）----------
   只做三件事：滚动揭示、数字滚动、阅读进度；
   全部尊重 prefers-reduced-motion，且不改变任何内容与数据。 */
function prefersReduced() {
  return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}
function rafThrottle(fn) {
  var busy = false;
  return function () {
    if (busy) return;
    busy = true;
    (window.requestAnimationFrame || function (f) { return setTimeout(f, 16); })(function () { busy = false; fn(); });
  };
}
var __revealIO = null;
function scanReveal(root) {
  var nodes = $$("[data-reveal]", root || document);
  if (!nodes.length) return;
  if (prefersReduced() || typeof IntersectionObserver === "undefined") {
    nodes.forEach(function (n) { n.classList.add("in"); });
    return;
  }
  if (!__revealIO) {
    __revealIO = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        __revealIO.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  }
  nodes.forEach(function (n) {
    if (n.classList.contains("in") || n.hasAttribute("data-reveal-obs")) return;
    n.setAttribute("data-reveal-obs", "");
    __revealIO.observe(n);
  });
}
function staggerIn(root, sel) {
  var nodes = $$(sel, root || document);
  nodes.forEach(function (n, i) {
    n.setAttribute("data-reveal", "");
    if (!n.style.getPropertyValue("--i")) n.style.setProperty("--i", String(Math.min(i, 9)));
  });
  scanReveal(root || document);
  return nodes;
}
function countUp(el) {
  if (!el) return;
  var m = /^(\d+(?:\.\d+)?)(.*)$/.exec(el.textContent || "");
  if (!m || !window.requestAnimationFrame) return;
  var to = parseFloat(m[1]), suffix = m[2] || "";
  if (!isFinite(to) || to <= 0 || prefersReduced()) return;
  var t0 = 0, dur = 720;
  /* 数字滚动期间关闭 aria-live，避免读屏器逐帧播报 */
  var live = el.closest("[aria-live]");
  if (live) live.setAttribute("aria-live", "off");
  el.textContent = "0" + suffix;
  function frame(t) {
    if (!t0) t0 = t;
    var k = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suffix;
    if (k < 1) window.requestAnimationFrame(frame);
    else { el.textContent = to + suffix; if (live) live.setAttribute("aria-live", "polite"); }
  }
  window.requestAnimationFrame(frame);
}
function installScrollProgress() {
  var root = document.documentElement;
  var update = rafThrottle(function () {
    var max = root.scrollHeight - window.innerHeight;
    var y = window.pageYOffset || root.scrollTop || 0;
    var v = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    root.style.setProperty("--scroll-progress", v.toFixed(4));
    var bt = document.getElementById("backTop");
    if (bt) bt.style.setProperty("--sp", v.toFixed(4));
  });
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}
function installSpotlight() {
  if (prefersReduced()) return;
  document.addEventListener("pointermove", function (e) {
    var el = e.target && e.target.closest ? e.target.closest(".spot") : null;
    if (!el) return;
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
  }, { passive: true });
}
/* ---------- 通用弹窗 ---------- */
var __ovLastFocus = null;   /* P1 修复：焦点管理 —— 打开时记住触发元素、关闭时归还 */
function ensureOverlay() {
  if ($("#overlay")) return;
  var o = document.createElement("div");
  o.className = "overlay"; o.id = "overlay";
  o.innerHTML = '<div class="modal" id="overlayCard" role="dialog" aria-modal="true" tabindex="-1"></div>';
  document.body.appendChild(o);
  o.addEventListener("click", function (e) { if (e.target === o || e.target.closest(".x")) closeOverlay(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeOverlay(); return; }
    /* 焦点陷阱：Tab 在弹窗内循环（弹窗打开时） */
    var oo = $("#overlay");
    if (!oo || !oo.classList.contains("open") || e.key !== "Tab") return;
    var card = $("#overlayCard");
    var focusables = card.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (!focusables.length) { e.preventDefault(); card.focus(); return; }
    var first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
function openOverlay(html) {
  ensureOverlay();
  $("#overlayCard").innerHTML = '<button class="x" aria-label="关闭">✕</button>' + html;
  $("#overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  $("#overlay").scrollTop = 0;
  __ovLastFocus = document.activeElement;
  var fx = $("#overlayCard .x") || $("#overlayCard");
  if (fx && fx.focus) fx.focus();
}
function closeOverlay() {
  var o = $("#overlay"); if (!o) return;
  var wasOpen = o.classList.contains("open");
  o.classList.remove("open"); document.body.style.overflow = "";
  var f = $("#overlay iframe"); if (f) f.src = "about:blank";
  if (wasOpen && __ovLastFocus && __ovLastFocus.focus) { try { __ovLastFocus.focus(); } catch (e) {} }
  __ovLastFocus = null;
}
/* ---------- 注意人群（v15：60/60 动作，一般性训练提示，非医学诊断） ---------- */
function cautionText(ex) { return (window.IG_CAUTION || {})[ex && ex.id] || ""; }
function cautionHTML(ex) {
  var c = cautionText(ex);
  return c ? '<div class="caution"><b>注意人群：</b>' + esc(c) + "</div>" : "";
}
/* ---------- 看视频（v16）：有精确教学视频的挂真链接，其余给 B 站搜索直达 ---------- */
function biliSearchUrl(kw) {
  return "https://search.bilibili.com/all?keyword=" + encodeURIComponent(kw + " 教学");
}
function videoLinksHTML(ex) {
  if (!ex) return "";
  var list = (window.IG_EX_VIDEO || {})[ex.id] || [];
  var html = '<div class="videolink"><b>看视频分解：</b>';
  if (list.length) {
    html += list.map(function (v) {
      return '<a href="' + esc(v.u) + '" target="_blank" rel="noopener">▶ ' + esc(v.a) + " · " + esc(v.t) + "（" + esc(v.p || "YouTube") + "）</a>";
    }).join("");
  }
  html += '<a class="bsearch" href="' + biliSearchUrl(ex.name) + '" target="_blank" rel="noopener">在 B站搜「' + esc(ex.name) + '」↗</a></div>';
  return html;
}

/* ---------- 依据链接（v16）：通用两条 + 蹲/铰链类动作追加「幅度」「脊柱中立」两条 ---------- */
var EVIDENCE_HINGE_IDS = ["squat", "front-squat", "goblet-squat", "bw-squat", "deadlift", "rdl", "bb-row", "db-row",
  "seated-row", "hip-thrust", "kb-swing", "leg-press", "lunge", "bss", "reverse-lunge", "glute-bridge",
  "single-leg-glute-bridge", "farmer-carry"];
function evidenceLinksHTML(ex) {
  var list = [["volume", "每周每肌群 10–20 组（A 级）"], ["rir", "RIR 强度标尺（B 级）"]];
  if (EVIDENCE_HINGE_IDS.indexOf(ex && ex.id) > -1) {
    list.push(["rom", "全幅度优先（A 级）"], ["spine", "脊柱中立 / 髋铰链（B 级）"]);
  }
  return '<p class="evdone">依据：' + list.map(function (kv) {
    return '<a href="evidence.html#claim-' + kv[0] + '">' + esc(kv[1]) + "</a>";
  }).join(" · ") + ' · <a href="evidence.html">全部来源 ↗</a></p>';
}

/* ---------- 退阶路径（v16）：做不动时先退一步 ---------- */
function regressionHTML(ex) {
  var list = (window.IG_REGRESSION || {})[ex && ex.id] || [];
  if (!list.length) return "";
  var parts = list.map(function (id, i) {
    var e = exById(id);
    if (!e) return "";
    return (i ? '<span class="rego">→</span>' : "") + '<a class="chip" href="detail.html?id=' + esc(id) + '">' + esc(e.name) + "</a>";
  }).join("");
  return '<div class="altrow regrow"><span class="hint">做不了？先退一步：</span>' + parts + "</div>";
}

function openExercise(id) {
  var ex = exById(id); if (!ex) return;
  var refs = planRefs(id);
  var h = '<h3>' + esc(ex.name) + ' <span class="lv ' + esc(ex.level) + '">' + esc(ex.level) + '</span></h3>'
    + '<div class="en">' + esc(ex.en) + ' · ' + esc(ex.equip) + ' · ' + esc((ex.parts || []).join(" / ")) + '</div>'
    + '<div class="lists">'
    + '<div class="mbox"><h5>动作要点</h5><ul>' + (ex.tips || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>'
    + '<div class="mbox err"><h5>常见错误</h5><ul>' + (ex.errs || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + '</ul></div>'
    + '</div>'
    + '<div class="dose"><b>建议组次：</b>' + esc(ex.dose) + '</div>';
  h += cautionHTML(ex);
  h += videoLinksHTML(ex);
  h += regressionHTML(ex);
  if ((ex.alt || []).length) {
    h += '<div class="altrow"><span class="hint">替代动作：</span>' + ex.alt.map(function (a) {
      var b = exById(a); return b ? '<button class="chip" data-ex="' + b.id + '">' + esc(b.name) + '</button>' : "";
    }).join("") + '</div>';
  }
  if (refs.length) {
    h += '<div class="altrow" style="margin-top:10px"><span class="hint">出现在训练计划：</span>' + refs.map(function (r) {
      return '<a class="chip" href="plans.html#' + r.pid + '">' + esc(r.plan) + ' · ' + esc(r.day) + "</a>";
    }).join("") + "</div>";
  }
  h += '<div class="altrow" style="margin-top:12px"><a class="btn sm" href="detail.html?id=' + esc(ex.id) + '">打开独立详情页 ↗</a></div>';
  openOverlay(h);
}

/* ---------- 全局委托：动作链接/卡片 ---------- */
document.addEventListener("click", function (e) {
  var t = e.target.closest("[data-ex]");
  if (t) { e.preventDefault(); openExercise(t.getAttribute("data-ex")); }
});

/* ---------- 导航高亮 & 年份 ---------- */
function navOn() {
  var p = location.pathname.split("/").pop() || "index.html";
  $$(".nav a").forEach(function (a) {
    var h = a.getAttribute("href");
    if (h === p || (p === "index.html" && h === "index.html")) {
      a.classList.add("on");
      a.setAttribute("aria-current", "page");   /* v12：当前页可被读屏播报 */
    }
  });
}

/* ---------- 首页 ---------- */
function initHome() {
  var exs = window.FIT_EXERCISES || [], pns = window.FIT_PLANS || [];
  var cs = (window.FIT_VIDEOS || { creators: [] }).creators;
  var vn = 0; cs.forEach(function (c) { vn += (c.videos || []).length; });
  var set = function (id, v) { var el = $("#" + id); if (el) el.textContent = v; };
  set("stEx", exs.length + " 个"); set("stPlans", pns.length + " 套");
  set("stCreators", cs.length + " 位"); set("stVideos", vn + " 条");
  var G = window.FIT_GLOSSARY || {};
  set("stTerms", (G.terms || []).length + " 条"); set("stFaq", (G.faqs || []).length + " 条");
  var pick = exs[Math.floor(Math.random() * exs.length)];
  var we = $("#todayEx");
  if (we && pick) {
    we.innerHTML = '<div class="card hov" data-ex="' + pick.id + '">'
      + '<button class="hit" type="button" data-ex="' + pick.id + '" aria-label="查看「' + esc(pick.name) + '」的要点与组次"></button>'
      + '<div class="meta metarow"><span class="tag">' + esc(pick.parts.join("/")) + '</span><span class="tag mut">' + esc(pick.equip) + '</span><span class="lv ' + esc(pick.level) + '">' + esc(pick.level) + '</span></div>'
      + '<h3>' + esc(pick.name) + '</h3>'
      + '<p class="desc">' + esc(pick.tips[0]) + '</p>'
      + '<p class="dose-line" style="margin-top:12px;border-top:1px dashed var(--line);padding-top:10px;color:var(--mut);font-size:13px">' + esc(pick.dose) + '</p>'
      + '<div style="margin-top:12px;font-size:13.5px;font-weight:800;color:var(--acc)">点开看要点与组次 →</div></div>';
  }
  var wp = $("#todayPlan");
  if (wp && pns.length) {
    var p = pns[Math.floor(Math.random() * pns.length)];
    var day = (p.schedule || []).filter(function (d) { return d.items && d.items.length; })[0] || (p.schedule || [])[0] || { day: "", label: "", items: [] };
    var names = day.items.slice(0, 3).map(function (it) { var e2 = exById(it.ex); return e2 ? e2.name : ""; }).filter(Boolean).join(" → ");
    wp.innerHTML = '<div class="card hov">'
      + '<div class="metarow"><span class="tag b">' + esc(p.freq) + '</span><span class="lv ' + esc(p.level) + '">' + esc(p.level) + '</span></div>'
      + '<h3>' + esc(p.name) + '</h3>'
      + '<p class="desc">' + esc(day.day) + ' · ' + esc(day.label) + (names ? '<br>' + esc(names) + ' …' : '') + '</p>'
      + '<div class="go" style="margin-top:12px"><a class="btn sm" href="plans.html#' + p.id + '">查看完整计划 →</a></div></div>';
  }
  /* v13：统计数字滚动 + 今日推荐卡片聚光 */
  ["stEx", "stPlans", "stCreators", "stVideos", "stTerms", "stFaq"].forEach(function (id) { countUp($("#" + id)); });
  $$("#todayEx > .card, #todayPlan > .card").forEach(function (c) {
    c.classList.add("spot");
    c.setAttribute("data-reveal", "");
    c.style.setProperty("--i", "0");
  });
}

/* ---------- 安全性说明 ----------
   本文件内所有 innerHTML 渲染的内容均来自本仓库自带的静态数据文件
  （data-*.js），不含任何用户输入/网络内容；且字段已全部经 esc() 转义，
  不存在 XSS 注入路径。 */

/* ---------- 肌群基名与族（动作库筛选 / 详情页图例联动 / 同肌群推荐 共用） ---------- */
function exBases(e) {
  var m = (window.IG_MUSCLES_MAP || {})[e && e.id] || [];
  var seen = {}, out = [];
  m.forEach(function (id) {
    var b = String(id).replace(/-(left|right)$/, "");
    if (!seen[b]) { seen[b] = 1; out.push(b); }
  });
  return out;
}
/* 肌群族表（模块级：动作库筛选 / 详情页图例联动 / 同肌群推荐 共用） */
var MUSCLE_FAMS = {
  "胸": ["chest-"],
  "背": ["lats-", "traps-", "lower-back-", "spine"],
  "肩": ["shoulder-", "deltoid-"],
  "手臂": ["biceps", "triceps-", "forearm-"],
  "核心": ["abs-", "obliques", "hip-flexor"],
  "臀腿": ["gluteus-", "hamstrings-", "quads", "adductors"],
  "小腿": ["calves-"]
};
window.IG_MUSCLE_FAMS = MUSCLE_FAMS;

function famOfBase(b) {
  var F = window.IG_MUSCLE_FAMS || {};
  for (var k in F) {
    for (var i = 0; i < F[k].length; i++) {
      var f = F[k][i];
      if (f.slice(-1) === "-" ? b.indexOf(f) === 0 : b === f) return k;
    }
  }
  return "";
}
/* 目标肌群中文短名（卡片署名用；最多 max 个，去左右、去重、保序） */
function muscleText(e, max) {
  var ids = (window.IG_MUSCLES_MAP || {})[e && e.id] || [];
  var ZH = window.IG_MUSCLE_ZH || {};
  var seen = {}, out = [];
  ids.forEach(function (id) {
    var b = String(id).replace(/-(left|right)$/, "");
    var n = ZH[b] || b;
    if (!seen[n]) { seen[n] = 1; out.push(n); }
  });
  var lim = max || 3;
  return out.length > lim ? out.slice(0, lim).join(" / ") + " 等 " + out.length + " 处" : out.join(" / ");
}
/* 训练肌群归并表（v14）——把解剖基名收敛到「每肌群 10–20 组/周」的统计口径。
   部位（腿/背）会把股四+腘绳+臀合并计数，套肌群阈值必然虚高；这里统一按动作主目标肌群计。 */
var MUSCLE_GROUP = [
  ["chest-", "胸"], ["lats-", "背"], ["traps-", "背"], ["lower-back-", "背"], ["spine", "背"],
  ["shoulder-", "肩"], ["deltoid-rear", "肩"],
  ["biceps", "肱二头"], ["triceps-", "肱三头"], ["forearm-", "前臂"],
  ["abs-", "腹"], ["obliques", "腹"], ["hip-flexor", "腹"],
  ["quads", "股四头"], ["hamstrings-", "腘绳"], ["gluteus-", "臀"], ["adductors", "臀"],
  ["calves-", "小腿"]
];
/* 取动作的第 1 个映射基名（= 主目标）归并到训练肌群；无映射时回退部位名 */
function muscleGroupOf(e) {
  var m = (window.IG_MUSCLES_MAP || {})[e && e.id] || [];
  if (m.length) {
    var b = String(m[0]).replace(/-(left|right)$/, "");
    for (var i = 0; i < MUSCLE_GROUP.length; i++) {
      var k = MUSCLE_GROUP[i][0];
      if (k.slice(-1) === "-" ? b.indexOf(k) === 0 : b === k) return MUSCLE_GROUP[i][1];
    }
  }
  return (e && e.parts && e.parts[0]) || "其他";
}
window.IG_MUSCLE_GROUP_OF = muscleGroupOf;

function relatedExercises(ex, limit) {
  var mine = exBases(ex);
  if (!mine.length) return [];
  return (window.FIT_EXERCISES || []).filter(function (o) { return o.id !== ex.id; })
    .map(function (o) {
      var b = exBases(o), n = 0;
      mine.forEach(function (x) { if (b.indexOf(x) > -1) n++; });
      return { e: o, n: n };
    })
    .filter(function (r) { return r.n >= 2; })
    .sort(function (a, b) { return b.n - a.n; })
    .slice(0, limit || 6);
}

/* 导出说明牌 SVG：把详情页当前的动作帧 + 肌群面板序列化成一个独立 SVG 文件（零依赖） */
function exportPlacardSVG(ex) {
  /* 取"非 .wt 覆盖层"的 svg：擦拭对比的第二个 svg 是同一帧的裁剪视图，导出时按完整帧重建 */
  var svgs = Array.prototype.slice.call(document.querySelectorAll(".plc svg:not(.wt)"));
  if (!svgs.length) return;
  var firstVB = svgs[0].getAttribute("viewBox");
  if (firstVB !== "0 0 400 180") {
    /* 起始帧被裁剪（wipe 模式）→ 用完整双帧 viewBox 重建同一内容 */
    var body = svgs[0].innerHTML;
    svgs = [{ getAttribute: function () { return "0 0 400 180"; }, innerHTML: body }].concat(svgs.slice(1));
  }
  var W = 480, pad = 10, out = "", y = pad;
  var bands = svgs.length >= 3 ? [[svgs[0]], [svgs[1], svgs[2]]] : svgs.map(function (s) { return [s]; });
  bands.forEach(function (band) {
    var cellW = (W - pad * (band.length + 1)) / band.length;
    var maxH = 0;
    band.forEach(function (s, i) {
      var vb = (s.getAttribute("viewBox") || "0 0 400 180").split(/[\s,]+/).map(Number);
      var vw = vb[2] || 400, vh = vb[3] || 180;
      var sc = cellW / vw, h = vh * sc;
      var x = pad + i * (cellW + pad);
      out += '<g transform="translate(' + (x - vb[0] * sc).toFixed(2) + "," + (y - vb[1] * sc).toFixed(2) + ") scale(" + sc.toFixed(4) + ')">' + s.innerHTML + "</g>";
      maxH = Math.max(maxH, h);
    });
    y += maxH + pad;
  });
  var total = Math.ceil(y + pad);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + total + '" viewBox="0 0 ' + W + " " + total + '" style="--ink:#eef1f4">'
    + '<rect width="100%" height="100%" fill="#121417" rx="14"/>' + out + "</svg>";
  var blob = new Blob([svg], { type: "image/svg+xml" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (ex.id || "exercise") + "-placard.svg";
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
}

/* ---------- 动作库页（2/3 之一） ---------- */
function initExercises() {
  var exs = window.FIT_EXERCISES || [];
  var st = { part: "全部", equip: "全部", level: "全部", q: "", fav: false, sort: "default" };
  var PARTS = ["全部", "胸", "背", "肩", "腿", "臀", "手臂", "核心", "全身"];
  var EQUIPS = [["全部", "全部"], ["杠铃", "杠铃"], ["哑铃", "哑铃"], ["固定器械", "器械"], ["绳索", "绳索"], ["自重", "自重"], ["壶铃", "壶铃"], ["弹力带", "弹力带"]];
  var EQUIP_VALUES = EQUIPS.map(function (x) { return x[1]; });
  var LEVELS = ["全部", "入门", "进阶", "高阶"];
  /* 肌群族筛选（基于 data-muscles-map 的基名，与 atlas 面板同源；族表定义在模块级） */
  var MUSCLE_FAM_KEYS = ["全部", "胸", "背", "肩", "手臂", "核心", "臀腿", "小腿"];
  st.muscle = "全部";
  var qs = new URLSearchParams(location.search);
  if (qs.get("part") && PARTS.indexOf(qs.get("part")) > -1) st.part = qs.get("part");
  if (qs.get("equip") && EQUIP_VALUES.indexOf(qs.get("equip")) > -1) st.equip = qs.get("equip");
  if (qs.get("level") && LEVELS.indexOf(qs.get("level")) > -1) st.level = qs.get("level");
  if (qs.get("fav") === "1") st.fav = true;
  if (qs.get("sort")) st.sort = qs.get("sort");
  if (qs.get("q")) st.q = qs.get("q");
  if (qs.get("muscle") && MUSCLE_FAMS[qs.get("muscle")]) st.muscle = qs.get("muscle");

  function chipRow(el, list, key) {
    el.innerHTML = list.map(function (item) {
      var lab = Array.isArray(item) ? item[0] : item;
      var val = Array.isArray(item) ? item[1] : item;
      return '<button class="chip' + (st[key] === val ? " on" : "") + '" data-f="' + key + '" data-v="' + esc(val) + '">' + esc(lab) + "</button>";
    }).join("");
  }
  var LEVEL_ORDER = { "入门": 0, "进阶": 1, "高阶": 2 };
  function filtered() {
    var list = exs.filter(function (e) {
      if (st.fav && !favHas(FAV_EX, e.id)) return false;
      if (st.part !== "全部" && (e.parts || []).indexOf(st.part) < 0) return false;
      if (st.equip !== "全部" && e.equip !== st.equip) return false;
      if (st.level !== "全部" && e.level !== st.level) return false;
      if (st.muscle !== "全部") {
        var fams = MUSCLE_FAMS[st.muscle] || [];
        var bases = exBases(e);
        var hit = bases.some(function (b) {
          return fams.some(function (f) { return f.slice(-1) === "-" ? b.indexOf(f) === 0 : b === f; });
        });
        if (!hit) return false;
      }
      if (st.q) {
        var hay = [e.name, e.en, e.equip, (e.parts || []).join(""), (e.tips || []).join("")].join(" ").toLowerCase();
        if (hay.indexOf(st.q.toLowerCase()) < 0) return false;
      }
      return true;
    });
    if (st.sort === "name") list = list.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "zh-Hans-CN"); });
    else if (st.sort === "part") list = list.slice().sort(function (a, b) { return (a.parts[0] || "").localeCompare(b.parts[0] || "", "zh-Hans-CN"); });
    else if (st.sort === "level") list = list.slice().sort(function (a, b) { return (LEVEL_ORDER[a.level] || 0) - (LEVEL_ORDER[b.level] || 0); });
    else if (st.sort === "fav") list = list.slice().sort(function (a, b) { return (favHas(FAV_EX, b.id) ? 1 : 0) - (favHas(FAV_EX, a.id) ? 1 : 0); });
    return list;
  }
  function renderList() {
    var list = filtered();
    var cnt = $("#exCount"); if (cnt) cnt.textContent = "共 " + list.length + " 个动作";
    var g = $("#exGrid");
    if (!list.length) { g.innerHTML = '<div class="empty">没有符合条件的动作——试试放宽筛选条件</div>'; return; }
    g.innerHTML = list.map(function (e, i) {
      return '<div class="excard spot" data-reveal style="--i:' + Math.min(i, 8) + '" data-ex="' + e.id + '">'
        /* v14：整卡命中区改成独立的原生 <button>（覆盖层）——
           键盘可聚焦且 Enter/Space 天然激活；也消除了 role="button" 里嵌收藏按钮的
           nested-interactive 违规。卡片本身的 data-ex 保留，鼠标路径行为不变。 */
        + '<button class="hit" type="button" data-ex="' + e.id + '" aria-label="查看「' + esc(e.name) + '」的要点、常见错误与建议组次"></button>'
        + '<div class="top"><div><h3>' + esc(e.name) + '</h3><div class="ene">' + esc(e.en) + "</div></div>"
        + '<span class="acts"><button class="fav' + (favHas(FAV_EX, e.id) ? " on" : "") + '" data-fav="' + e.id + '" type="button" title="收藏这个动作" aria-label="收藏这个动作">★</button>'
        + '<span class="lv ' + esc(e.level) + '">' + esc(e.level) + "</span></span></div>"
        + (window.IG_ART ? '<div class="art">' + IG_ART.of(e) + "</div>" : "")
        + '<div class="meta"><span class="tag">' + esc((e.parts || []).join("/")) + '</span><span class="tag mut">' + esc(e.equip) + "</span></div>"
        + (window.IG_MUSCLES_MAP && window.IG_MUSCLES_MAP[e.id] ? '<div class="mgtag">目标：' + esc(muscleText(e, 3)) + "</div>" : "")
        + '<div class="tip1">' + esc((e.tips || [])[0] || "") + "</div>"
        + '<div class="dose-line">' + esc(e.dose) + "</div></div>";
    }).join("");
    scanReveal(g);   /* v13：筛选后重新观察新卡片 */
  }
  function renderFilters() {
    chipRow($("#fPart"), PARTS, "part");
    chipRow($("#fEquip"), EQUIPS, "equip");
    chipRow($("#fLevel"), LEVELS, "level");
    var mus = $("#fMus");
    if (!mus) {
      var w = $("#filterWrap");
      if (w) {
        var row = document.createElement("div");
        row.className = "frow";
        row.innerHTML = '<span class="lb">肌群</span><span class="seg" id="fMus"></span>';
        w.appendChild(row);
        mus = $("#fMus");
      }
    }
    if (mus) chipRow(mus, MUSCLE_FAM_KEYS, "muscle");
  }
  $("#filterWrap").addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    st[c.getAttribute("data-f")] = c.getAttribute("data-v");
    renderFilters(); renderList();
  });
  /* 收藏 / 排序控件（注入在搜索行下方） */
  var ctrl = document.createElement("div");
  ctrl.className = "controls";
  ctrl.innerHTML = '<span class="lb">更多</span>'
    + '<button class="chip' + (st.fav ? " on" : "") + '" id="exFavChip" type="button">★ 只看收藏</button>'
    + '<span class="lb">排序</span>'
    + '<select id="exSort" aria-label="排序方式">'
    + '<option value="default">默认顺序</option><option value="fav">收藏优先</option><option value="name">按名称</option><option value="part">按部位</option><option value="level">按难度</option></select>';
  var tb = document.querySelector(".toolbar");
  if (tb && tb.parentNode) tb.parentNode.insertBefore(ctrl, tb.nextSibling);
  var favChip = document.getElementById("exFavChip");
  if (favChip) favChip.addEventListener("click", function () { st.fav = !st.fav; this.classList.toggle("on", st.fav); renderList(); });
  var sortSel = document.getElementById("exSort");
  if (sortSel) {
    sortSel.value = st.sort;
    sortSel.addEventListener("change", function () { st.sort = this.value; renderList(); });
  }
  $("#exGrid").addEventListener("click", function (e) {
    var f = e.target.closest(".fav");
    if (!f) return;
    e.preventDefault(); e.stopPropagation();
    f.classList.toggle("on", favToggle(FAV_EX, f.getAttribute("data-fav")));
  });
  var inp = $("#exSearch");
  if (inp) { inp.value = st.q; inp.addEventListener("input", function () { st.q = this.value.trim(); renderList(); }); }
  renderFilters(); renderList();
  /* 练前热身序列（v5）*/
  var WM = window.FIT_WARMUP || [];
  var wg = $("#warmGrid");
  if (wg) wg.innerHTML = WM.map(function (m) {
    return '<div class="wrow"><b>' + esc(m.n) + '</b><span class="tag">' + esc(m.t) + '</span><span class="mut">' + esc(m.d) + "</span></div>";
  }).join("");
  var openId = qs.get("ex");
  if (openId) setTimeout(function () { openExercise(openId); }, 60);
}

/* —— 打卡与直达执行（v4）—— */
function isoLocal(d) { return window.IG_CALC.isoLocal(d); }
function weekKeyOf(dateStr) {
  var d = new Date((dateStr || "") + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function planStampHTML(p) {
  var all = LS.get("ig_log_sessions", []);
  var arr = Object.prototype.toString.call(all) === "[object Array]" ? all : [];
  var s = arr.filter(function (x) { return x.plan === p.id && x.date; });
  var wk = {};
  s.forEach(function (x) { var w = weekKeyOf(x.date); if (w) wk[w] = (wk[w] || 0) + 1; });
  var keys = Object.keys(wk).sort();
  var thisW = weekKeyOf(isoLocal(new Date()));   /* v14：toISOString 是 UTC，北京时间 0–8 点会算成上一周 */
  var dots = keys.slice(-8).map(function (w) {
    return '<span class="stamp' + (wk[w] ? " on" : "") + '" title="' + w + " 当周 " + wk[w] + ' 次">' + (wk[w] || "·") + "</span>";
  });
  if (keys.indexOf(thisW) < 0) dots.unshift('<span class="stamp" title="本周还没开练">·</span>');
  return '<div class="stampwrap"><div class="sh"><b>训练打卡</b>'
    + '<span class="hint">由日志数据自动统计 · 近 8 周</span>'
    + (s.length ? '<span class="hint num">这套计划已练 <b style="color:var(--acc)">' + s.length + "</b> 次</span>"
      : '<span class="dim">这套计划还没记录过——开始第一次吧</span>')
    + "</div>" + (dots.length ? '<div class="stamprow">' + dots.join("") + "</div>" : "") + "</div>";
}

/* ---------- 训练计划页（2/3 之二） ---------- */
function initPlans() {
  var plans = window.FIT_PLANS || [];
  if (!plans.length) return;
  var tabs = $("#planTabs"), body = $("#planBody");
  /* —— 我的课表（v7：克隆 + 本机保存 + 项级编辑）—— */
  var customs = [];
  function loadCustoms() { var v = LS.get(CUSTOM_KEY, []); customs = Object.prototype.toString.call(v) === "[object Array]" ? v : []; }
  function saveCustoms() { LS.set(CUSTOM_KEY, customs); }
  loadCustoms();
  function findPlan(id) { return plans.concat(customs).filter(function (x) { return x.id === id; })[0]; }
  function isCustom(p) { return !!customs.filter(function (x) { return x.id === p.id; }).length; }
  function itemHTML(it, pid) {
    var e = exById(it.ex);
    var name = e ? '<span class="exlink" data-ex="' + e.id + '">' + esc(e.name) + "</span>" : esc(it.ex);
    var custom = isCustom({ id: pid });
    var sx = custom ? '<span class="sx" contenteditable="true" data-edi="' + esc(pid) + '|' + esc(it.ex) + '" title="点击改组次，回车/失焦保存">' + esc(it.sets) + "</span>"
      : '<span class="sx">' + esc(it.sets) + "</span>";
    var del = custom ? ' <button class="xdel" data-planact="delitem" data-plan="' + esc(pid) + '" data-ex="' + esc(it.ex) + '" type="button" title="从课表删除这个动作">✕</button>' : "";
    return "<li><span>" + name + "</span>" + sx + del + "</li>";
  }
  function dayHTML(d, pid, di) {
    var has = d.items && d.items.length;
    var inner = has ? "<ul>" + d.items.map(function (it) { return itemHTML(it, pid); }).join("") + "</ul>" : "";
    var custom = isCustom({ id: pid });
    if (custom) inner += '<div class="addrow"><select class="asel" aria-label="选择要加入的动作">' + (window.FIT_EXERCISES || [])
      .map(function (e2) { return '<option value="' + esc(e2.id) + '">' + esc(e2.name) + "（" + esc((e2.parts || []).join("/")) + "）</option>"; }).join("")
      + '</select><input class="asets" type="text" value="3×10" aria-label="组次，如 3×10"><button class="btn sm" data-planact="additem" data-plan="' + esc(pid) + '" data-day="' + di + '" type="button">＋ 加入</button></div>';
    var go = has ? '<a class="btn sm execgo" data-planact="goday" data-plan="' + esc(pid) + '" data-day="' + di
      + '" type="button" href="#">开始这节训练 →</a>' : "";
    return '<div class="dayblock day' + (has ? "" : " rest") + '"><div class="dh"><span class="d">' + esc(d.day) + '</span><span class="l">' + esc(d.label) + '</span><span class="n">'
      + (has ? d.items.length + " 个动作 · " + go : "恢复日") + "</span></div>" + inner + "</div>";
  }
  function planHTML(p) {
    var custom = isCustom(p);
    var head = '<div class="plan-head"><div>'
      + '<h2 style="font-size:26px;font-weight:900;margin-bottom:8px">' + esc(p.name) + (custom ? ' <span class="tag" style="font-size:12px;vertical-align:3px">我的课表</span>' : "") + "</h2>"
      + '<p style="color:var(--mut);font-size:14.5px;line-height:1.8">' + esc(p.desc) + "</p>"
      + '<div class="callout info" style="margin-top:14px"><b>适合谁：</b>' + esc(p.fit) + "</div>"
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;align-items:center">'
      + '<button class="btn sm primary" data-planact="print" type="button">打印这份课表</button>'
      + '<button class="btn sm" data-planact="log" type="button">去日志里记录 →</button>'
      + "<a class=\"btn sm\" href=\"log.html#" + esc(p.id) + "\">直接空记录 →</a>"
      + (custom
        ? '<button class="btn sm" data-planact="delplan" data-plan="' + esc(p.id) + '" type="button">删除本课表</button>'
        : '<input id="cloneName" type="text" placeholder="副本名（可留空默认加 · 我的副本）" style="max-width:250px"><button class="btn sm" data-planact="clone" data-plan="' + esc(p.id) + '" type="button">复制为我的课表 ↗</button>');
    head += "</div>";
    head += '</div><div class="plan-meta card">'
      + '<div class="row"><span class="k">训练频率</span><span class="v">' + esc(p.freq) + "</span></div>"
      + '<div class="row"><span class="k">周期</span><span class="v">' + esc(p.duration) + "</span></div>"
      + '<div class="row"><span class="k">难度</span><span class="v">' + esc(p.level) + "</span></div>"
      + '<div class="row"><span class="k">目标</span><span class="v">' + esc(p.goal) + "</span></div>"
      + "</div></div>"
      + planStampHTML(p)
      + '<h3 style="font-size:17px;font-weight:900;margin:26px 0 12px">每周安排</h3>'
      + (p.schedule || []).map(function (d, i) { return dayHTML(d, p.id, i); }).join("")
      + '<div class="grid g2" style="margin-top:24px">'
      + '<div class="card"><h3 style="margin-bottom:10px">渐进规则</h3><ul class="plist">' + (p.progress || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>"
      + '<div class="card"><h3 style="margin-bottom:10px">注意事项</h3><ul class="plist">' + (p.notes || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>"
      + "</div>"
      + (custom ? '<div class="hint" style="margin-top:14px">✎ 组次可直接点开改；✕ 可删动作；改完立即自动保存到本机。</div>' : "");
    return head;
  }
  function show(id, scroll) {
    var p = findPlan(id) || plans[0];
    body.innerHTML = planHTML(p);
    $$("#planTabs .chip").forEach(function (c) { c.classList.toggle("on", c.getAttribute("data-p") === p.id); });
    if (location.hash.slice(1) !== p.id) history.replaceState(null, "", "#" + p.id);
    /* v13：训练日卡片依次入场 */
    $$(".dayblock", body).forEach(function (d, i) {
      d.classList.add("spot");
      d.setAttribute("data-reveal", "");
      d.style.setProperty("--i", String(Math.min(i, 6)));
    });
    var meta = $(".plan-meta", body);
    if (meta) meta.classList.add("spot");
    scanReveal(body);
    if (scroll) body.scrollIntoView({ behavior: prefersReduced() ? "auto" : "smooth", block: "start" });
  }
  function renderTabs() {
    tabs.innerHTML = plans.concat(customs).map(function (p) {
      return '<button class="chip" data-p="' + esc(p.id) + '">' + esc(p.name) + (isCustom(p) ? " ✎" : "") + "</button>";
    }).join("");
  }
  renderTabs();
  tabs.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    show(c.getAttribute("data-p"), false);
  });
  /* 打印课表 / 去日志记录（事件委托，重渲染后依然有效） */
  body.addEventListener("click", function (e) {
    var t = e.target.closest("button[data-planact], a[data-planact]");
    if (!t) return;
    var act = t.getAttribute("data-planact");
    if (act === "print") { e.preventDefault(); window.print(); return; }
    if (act === "log") { location.href = "log.html#" + (location.hash.slice(1) || plans[0].id); return; }
    if (act === "goday") {
      e.preventDefault();
      location.href = "log.html?plan=" + encodeURIComponent(t.getAttribute("data-plan"))
        + "&day=" + encodeURIComponent(t.getAttribute("data-day") || "0");
      return;
    }
    if (act === "clone") {
      var src = findPlan(t.getAttribute("data-plan")); if (!src) return;
      var nm = ($("#cloneName") || { value: "" }).value.trim();
      var cp = JSON.parse(JSON.stringify(src));
      cp.id = "my-" + Date.now();
      cp.name = nm || (src.name + " · 我的副本");
      cp.desc = "由「" + src.name + "」复制——组次可直接点改、动作可加可删，改动自动保存到本机。";
      customs.push(cp); saveCustoms(); renderTabs(); show(cp.id, true);
      return;
    }
    if (act === "delplan") {
      var did = t.getAttribute("data-plan");
      if (!new URLSearchParams(location.search).has("noconfirm") && !window.confirm("删除这份课表？（不可恢复）")) return;
      customs = customs.filter(function (x) { return x.id !== did; });
      saveCustoms(); renderTabs(); show(plans[0].id, false);
      return;
    }
    if (act === "delitem") {
      var did2 = t.getAttribute("data-plan"), dex = t.getAttribute("data-ex");
      var owner = customs.filter(function (x) { return x.id === did2; })[0];
      if (!owner) return;
      (owner.schedule || []).forEach(function (dd2) { dd2.items = (dd2.items || []).filter(function (it) { return it.ex !== dex; }); });
      saveCustoms(); show(did2, false);
      return;
    }
    if (act === "additem") {
      var did3 = t.getAttribute("data-plan");
      var owner2 = customs.filter(function (x) { return x.id === did3; })[0];
      if (!owner2) return;
      var wrap = t.closest(".dayblock");
      var sel = $(".asel", wrap), setsv = $(".asets", wrap);
      var di3 = parseInt(t.getAttribute("data-day"), 10) || 0;
      var dObj = (owner2.schedule || [])[di3];
      if (sel && dObj) {
        dObj.items = (dObj.items || []).concat([{ ex: sel.value, sets: (setsv && setsv.value.trim()) || "3×10" }]);
        saveCustoms(); show(did3, false);
      }
      return;
    }
  });
  /* 组次就地编辑（focusout 捕捉失焦保存） */
  body.addEventListener("focusout", function (e) {
    var el = e.target.closest("[data-edi]"); if (!el) return;
    var pp = el.getAttribute("data-edi").split("|"), pid = pp[0], exid = pp[1];
    var val = (el.textContent || "").trim() || "3×10";
    var owner = customs.filter(function (x) { return x.id === pid; })[0];
    if (!owner) return;
    var touched = false;
    (owner.schedule || []).forEach(function (dd) {
      (dd.items || []).forEach(function (it) { if (it.ex === exid && !touched) { it.sets = val; touched = true; } });
    });
    if (touched) { saveCustoms(); el.textContent = val; }
  });
  /* 30 秒选计划 */
  var pk = { exp: "new", days: "2-3", goal: "gain" };
  var pkWrap = $("#picker");
  if (pkWrap) {
    pkWrap.addEventListener("click", function (e) {
      var c = e.target.closest('.chip[data-k]');
      if (c) {
        var k = c.getAttribute("data-k"), v = c.getAttribute("data-v");
        pk[k] = v;
        $$('.chip[data-k="' + k + '"]', pkWrap).forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-v") === v); });
        var out;
        if (pk.goal === "cut") out = "fat-loss";
        else if (pk.goal === "strength") out = "strength-5x5";
        else if (pk.exp === "new" || pk.days === "2-3" || pk.goal === "restart") out = "beginner";
        else if (pk.days === "5+") out = "ppl";
        else out = "upper-lower";
        var p = plans.filter(function (x) { return x.id === out; })[0];
        var res = $("#pkRes");
        res.className = "res on";
        res.innerHTML = "<b>推荐给你：" + esc(p.name) + "</b>（" + esc(p.freq) + " · " + esc(p.level) + "）<br>"
          + '<span class="mut" style="font-size:13.5px">' + esc(p.goal) + " —— " + esc(p.fit) + "</span><br>"
          + '<button class="btn primary sm" style="margin-top:10px" data-goto="' + p.id + '">立即查看该计划</button>';
        return;
      }
      var b = e.target.closest("[data-goto]");
      if (b) show(b.getAttribute("data-goto"), true);
    });
  }
  window.addEventListener("hashchange", function () { var id = location.hash.slice(1); if (id) show(id, false); });
  show(location.hash.slice(1) || plans[0].id, false);
}

/* ---------- 饮食营养页（3/3 之一） ---------- */
function initNutrition() {
  var N = window.FIT_NUTRITION || {};
  var prin = $("#nPrin");
  if (prin) prin.innerHTML = (N.principles || []).map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("");

  var g = $("#cGender"), a = $("#cAge"), h = $("#cHeight"), w = $("#cWeight"), act = $("#cAct"), goal = $("#cGoal");
  var res = $("#calcRes");
  /* 带出上次保存的目标（如有） */
  var savedTgt = LS.get(TGT_KEY, null);
  if (savedTgt && savedTgt.weight) {
    if (savedTgt.gender) g.value = savedTgt.gender;
    if (savedTgt.age) a.value = savedTgt.age;
    if (savedTgt.height) h.value = savedTgt.height;
    if (savedTgt.weight) w.value = savedTgt.weight;
    if (savedTgt.act) act.value = savedTgt.act;
    if (savedTgt.goal) goal.value = savedTgt.goal;
  }
  window.__igSaveTarget = function () {
    LS.set(TGT_KEY, { gender: g.value, age: +a.value, height: +h.value, weight: +w.value, act: act.value, goal: goal.value, savedAt: new Date().toISOString() });
    var m = document.getElementById("tgtMsg");
    if (m) m.textContent = "已保存 ✓ 下次打开自动带出";
  };
  function igRing(pK, fK, cK) {
    var total = pK + fK + cK || 1, R = 42, C = 2 * Math.PI * R, off = 0;
    var segs = [[pK, "var(--acc)"], [fK, "var(--warn)"], [cK, "var(--blue)"]];
    /* v13：首次绘制时逐段描边（之后重算保持静态，避免每次输入都重播） */
    var animate = !window.__igRingAnimated;
    window.__igRingAnimated = true;
    var out = '<svg width="118" height="118" viewBox="0 0 120 120" role="img" aria-label="三大宏量热量占比">'
      + '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="rgba(128,128,128,.22)" stroke-width="12"/>';
    segs.forEach(function (s) {
      var len = C * s[0] / total;
      var ang = -90 + off / C * 360;
      out += '<circle' + (animate ? ' class="ring-fg"' : "") + ' cx="60" cy="60" r="' + R + '" fill="none" stroke="' + s[1] + '" stroke-width="12" stroke-dasharray="'
        + len.toFixed(1) + ' ' + C.toFixed(1) + '" stroke-dashoffset="0" transform="rotate(' + ang.toFixed(2)
        + ' 60 60)" style="--len:' + len.toFixed(1) + ';--circ:' + C.toFixed(1) + '"/>';
      off += len;
    });
    return out + '<text class="lt1" x="60" y="58" text-anchor="middle" font-size="19" font-weight="800">' + Math.round(total) + '</text>'
      + '<text class="lt2" x="60" y="74" text-anchor="middle" font-size="10.5">kcal 分配</text></svg>';
  }
  function calc() {
    if (!g || !res) return;
    var age = +a.value || 0, ht = +h.value || 0, wt = +w.value || 0, af = +act.value || 1.375;
    if (age < 14 || ht < 120 || wt < 30) { res.innerHTML = '<div class="callout warn">请输入有效的年龄 / 身高 / 体重</div>'; return; }
    var bmr = window.IG_CALC.bmr({ sex: g.value, wt: wt, ht: ht, age: age });
    var tdee = bmr * af;
    var kcal = window.IG_CALC.targetKcal(tdee, goal.value);
    var mk = window.IG_CALC.macros(kcal, wt, goal.value);
    var protein = mk.protein, fat = mk.fat, carb = mk.carb;
    var rate = goal.value === "cut"
      ? "建议每周减 " + (wt * 0.005).toFixed(1) + "–" + (wt * 0.01).toFixed(1) + " kg（体重的 0.5–1%）"
      : goal.value === "bulk"
        ? "建议每周增 " + (wt * 0.0025).toFixed(1) + "–" + (wt * 0.005).toFixed(1) + " kg，别贪快"
        : "维持体重：先把训练和蛋白做扎实";
    res.innerHTML = '<div class="big"><div class="v num">' + kcal + '</div><div class="k">目标每日热量（kcal）</div></div>'
      + '<div class="stat"><div class="v num">' + protein + ' g</div><div class="k">蛋白质（' + (goal.value === "cut" ? "2.2" : "1.8") + ' g/kg）</div></div>'
      + '<div class="stat"><div class="v num">' + fat + ' g</div><div class="k">脂肪（' + (goal.value === "cut" ? "0.9" : "1.0") + ' g/kg）</div></div>'
      + '<div class="stat"><div class="v num">' + carb + ' g</div><div class="k">碳水（剩余热量）</div></div>'
      + '<div class="callout ok" style="grid-column:1/-1">' + esc(rate) + '。BMR ≈ ' + Math.round(bmr) + ' · TDEE ≈ ' + Math.round(tdee) + '（Mifflin-St Jeor 公式）</div>'
      + '<div class="callout" style="grid-column:1/-1;background:rgba(255,255,255,.035);border-color:var(--line)">'
      + '<div class="ring">' + igRing(protein * 4, fat * 9, carb * 4)
      + '<div class="lg2">'
      + '<div class="i"><span class="dot" style="background:var(--acc)"></span>蛋白质 <b>' + protein + ' g</b> · ' + Math.round(protein * 4 / (kcal || 1) * 100) + '% 热量</div>'
      + '<div class="i"><span class="dot" style="background:var(--warn)"></span>脂肪 <b>' + fat + ' g</b> · ' + Math.round(fat * 9 / (kcal || 1) * 100) + '% 热量</div>'
      + '<div class="i"><span class="dot" style="background:var(--blue)"></span>碳水 <b>' + carb + ' g</b> · ' + Math.round(carb * 4 / (kcal || 1) * 100) + '% 热量</div>'
      + '</div></div></div>'
      + '<div style="grid-column:1/-1;display:flex;gap:12px;align-items:center;flex-wrap:wrap">'
      + '<button class="btn sm primary" type="button" onclick="window.__igSaveTarget && window.__igSaveTarget()">保存为目标（记在本机）</button>'
      + '<span class="hint" id="tgtMsg">' + (savedTgt && savedTgt.weight ? "已带出上次保存的目标" : "保存后下次打开自动带出") + '</span>'
      + '</div>';
    window.__igLastKcal = kcal;
    window.__igLastP = protein;
  }
  [g, a, h, w, act, goal].forEach(function (el) { if (el) { el.addEventListener("input", calc); el.addEventListener("change", calc); } });
  calc();

  var foods = N.foods || [];
  var foodTag = "全部";
  var TAGS = ["全部", "蛋白", "碳水", "脂肪", "蔬菜", "水果", "乳品", "补给"];
  var fTagsEl = $("#foodTags"), fSearch = $("#foodSearch"), fRows = $("#foodRows");
  function renderFoodTags() {
    if (fTagsEl) fTagsEl.innerHTML = TAGS.map(function (t) {
      return '<button class="chip' + (foodTag === t ? " on" : "") + '" data-t="' + esc(t) + '">' + esc(t) + "</button>";
    }).join("");
  }
  function renderFoods() {
    var q = fSearch ? fSearch.value.trim().toLowerCase() : "";
    var list = foods.filter(function (x) {
      if (foodTag !== "全部" && x.tag !== foodTag) return false;
      if (q && (x.name + x.note).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!fRows) return;
    var PORT = window.FIT_PORTIONS || {};
    fRows.innerHTML = list.length ? list.map(function (x) {
      return "<tr><td>" + esc(x.name) + ' <span class="foodtag ' + esc(x.tag) + '">' + esc(x.tag) + "</span></td>"
        + '<td class="c num">' + x.kcal + '</td><td class="c num">' + x.p + '</td><td class="c num">' + x.f + '</td><td class="c num">' + x.c + "</td>"
        + '<td class="mut" style="font-size:12.8px">' + esc(PORT[x.name] || "按 100g 换算") + "</td>"
        + '<td class="mut" style="font-size:12.8px">' + esc(x.note) + "</td></tr>";
    }).join("") : '<tr><td colspan="7" class="mut" style="text-align:center;padding:24px">没有匹配的食物</td></tr>';
  }
  if (fTagsEl) {
    fTagsEl.addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      foodTag = c.getAttribute("data-t"); renderFoodTags(); renderFoods();
    });
  }
  if (fSearch) fSearch.addEventListener("input", renderFoods);
  renderFoodTags(); renderFoods();

  var mw = $("#mealWrap");
  if (mw) mw.innerHTML = (N.meals || []).map(function (m, i) {
    return '<div class="meal spot" data-reveal style="--i:' + Math.min(i, 5) + '"><h4>' + esc(m.title) + '</h4><div class="tg">' + esc(m.target) + "</div>"
      + m.items.map(function (it) {
        return '<div class="mrow"><span class="t">' + esc(it.t) + '</span><span class="d">' + esc(it.d) + '</span><span class="m num">≈ ' + it.kcal + ' kcal · ' + it.p + 'g 蛋白</span></div>';
      }).join("") + "</div>";
  }).join("");
  if (mw) scanReveal(mw);

  var sr = $("#supRows");
  if (sr) sr.innerHTML = (N.supplements || []).map(function (s) {
    return '<tr><td><b>' + esc(s.name) + '</b></td><td>' + esc(s.dose) + '</td><td class="c"><span class="lvbadge ' + esc(s.level) + '">' + esc(s.level) + '</span></td><td style="font-size:13.2px" class="mut">' + esc(s.ev) + "</td></tr>";
  }).join("");
  var nd = $("#nDisc");
  if (nd) nd.textContent = N.disclaimer || "";

  /* —— 一日食谱生成器（v5）—— */
  var genBtn = $("#genBtn"), genOut = $("#genOut"), genHint = $("#genHint");
  function pool(tag) { return foods.filter(function (x) { return x.tag === tag; }); }
  function pickFrom(a2) { return (a2 && a2.length) ? a2[Math.floor(Math.random() * a2.length)] : null; }
  function showG(x, kcal, nameG) {
    var g = Math.round(kcal / (x.kcal || 1) * 100 / 10) * 10;
    if (g < 10) g = 10;
    return { t: esc(x.name) + (nameG ? " " + nameG : ""), g: g, kcal: Math.round(x.kcal * g / 100), p: Math.round(x.p * g / 100) };
  }
  function renderGen() {
    if (!genOut) return;
    var kcal = (window.__igLastKcal && window.__igLastKcal > 800) ? window.__igLastKcal : 2100;
    var tgtP = window.__igLastP || 0;
    var shares = [0.3, 0.35, 0.35], names = ["早餐", "午餐", "晚餐"];
    var proteins = pool("蛋白").concat(pool("乳品")), carbs = pool("碳水"), exs2 = pool("蔬菜").concat(pool("水果"));
    var allG = 0, allK = 0;
    genOut.innerHTML = names.map(function (nm, i) {
      var pr = pickFrom(proteins), cb = pickFrom(carbs), ex1 = pickFrom(exs2), ex2 = pickFrom(exs2.filter(function (x) { return ex1 && x.name !== ex1.name; }));
      var share = Math.round(kcal * shares[i]);
      var items = [];
      if (pr) { var it = showG(pr, share * 0.42, "（150–200g 实物重）"); items.push(it); }
      if (cb) { var it2 = showG(cb, share * 0.38, "（熟重）"); items.push(it2); }
      if (ex1 && ex2) { items.push({ t: esc(ex1.name) + " + " + esc(ex2.name), g: 0, kcal: Math.round((ex1.kcal + ex2.kcal) * 1.5), p: Math.round((ex1.p + ex2.p) * 1.5 / 2) }); }
      allK += items.reduce(function (a3, x) { return a3 + x.kcal; }, 0);
      allG += items.reduce(function (a3, x) { return a3 + x.p; }, 0);
      return '<div class="genm"><b>' + esc(nm) + '</b><span class="mut num">≈ ' + Math.round(share) + ' kcal</span>'
        + '<div class="rows">' + items.map(function (it3) {
          return '<div class="r"><span class="t">' + it3.t + '</span><span class="mut num">' + (it3.g ? it3.g + "g · " : "") + it3.kcal + ' kcal · ' + it3.p + 'g 蛋白</span></div>';
        }).join("") + "</div></div>";
    }).join("")
      + '<div class="callout ' + (tgtP && allG < tgtP * 0.9 ? "warn" : "ok") + '" style="margin-top:10px">全天合计 ≈ <b>' + allK + " kcal · " + allG
      + 'g 蛋白</b>' + (tgtP ? "（目标 " + tgtP + "g 蛋白" + (allG < tgtP * 0.9 ? "，加一勺蛋白粉或再吃一个蛋更稳）" : " ✓ 覆盖目标）") : "）") + "</div>";
    var hint = $("#genHint"); if (hint) hint.textContent = kcal ? "当前目标 " + kcal + " kcal" : "";
  }
  if (genBtn) genBtn.addEventListener("click", renderGen);
  renderGen();
}

/* ---------- 视频精选页（3/3 之二） ---------- */
function initVideos() {
  var cs = (window.FIT_VIDEOS || { creators: [] }).creators;
  var st = { plat: "全部", topic: "全部", q: "", fav: false };
  var PLATS = [["全部", "全部平台"], ["bilibili", "B站"], ["douyin", "抖音"], ["xiaohongshu", "小红书"], ["youtube", "YouTube"]];
  var TOPICS = ["全部", "增肌", "减脂", "居家跟练", "拉伸恢复", "女性塑形", "新手入门", "体态纠正", "力量举", "健美", "科普", "饮食"];
  var PF = { bilibili: "B站", douyin: "抖音", xiaohongshu: "小红书", youtube: "YouTube" };
  var qs = new URLSearchParams(location.search);
  if (qs.get("platform")) st.plat = qs.get("platform");
  if (qs.get("topic")) st.topic = qs.get("topic");
  if (qs.get("fav") === "1") st.fav = true;

  function ytId(u) { var m = /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/.exec(u); return m ? m[1] : ""; }
  function vidMatches(v) { return st.topic === "全部" ? true : v.topic === st.topic; }
  function cMatches(c) {
    if (st.fav && !favHas(FAV_CR, c.id)) return false;
    if (st.plat !== "全部" && c.platform !== st.plat) return false;
    if (st.q) {
      var hay = [c.name, c.intro, (c.tags || []).join(""), c.fit || "", (c.videos || []).map(function (v) { return v.title + v.note; }).join("")]
        .join(" ").toLowerCase();
      if (hay.indexOf(st.q.toLowerCase()) < 0) return false;
    }
    if (st.topic !== "全部") {
      var tagHit = (c.tags || []).indexOf(st.topic) > -1;
      var vidHit = (c.videos || []).some(vidMatches);
      if (!tagHit && !vidHit) return false;
    }
    return true;
  }
  function rowsHTML(c) {
    var rows = (c.videos || []).map(function (v, i) {
      var embed = (c.platform === "bilibili" && v.bvid) || (c.platform === "youtube" && ytId(v.url));
      var btn = embed
        ? '<button class="play" data-cid="' + c.id + '" data-i="' + i + '" aria-label="站内播放">▶</button>'
        : '<a class="play" href="' + esc(v.url) + '" target="_blank" rel="noopener" aria-label="前往平台观看">↗</a>';
      return '<div class="vrow">' + btn + '<div class="vm">'
        + '<div class="vt" data-cid="' + c.id + '" data-i="' + i + '">' + esc(v.title) + "</div>"
        + '<div class="vn">' + esc(v.note || "") + "</div></div>"
        + '<span class="vv">' + esc(v.views || "") + "</span></div>";
    }).join("");
    var note = c.videosNote ? '<div class="vnote">' + esc(c.videosNote) + "</div>" : "";
    return rows + note + '<div class="embedbox" id="emb-' + c.id + '"></div>';
  }
  function actsHTML(c) {
    var h = "";
    if (c.home) h += '<a class="btn sm" href="' + esc(c.home) + '" target="_blank" rel="noopener">前往主页 ↗</a>';
    if (c.search) h += '<a class="btn sm" href="' + esc(c.search) + '" target="_blank" rel="noopener">站内搜索 ↗</a>';
    return h;
  }
  function render() {
    var list = cs.filter(cMatches);
    var vn = 0; list.forEach(function (c) { vn += (c.videos || []).length; });
    var cnt = $("#vCount");
    if (cnt) cnt.textContent = "共 " + list.length + " 位创作者 · " + vn + " 条精选内容" + (st.fav ? "（已收藏）" : "");
    var g = $("#vGrid");
    if (!list.length) {
      g.innerHTML = '<div class="empty">' + (st.fav ? "还没有收藏任何创作者——点卡片右上角的 ★ 收藏，之后就能在这里快速找到" : "没有匹配的创作者——换个筛选条件试试") + "</div>";
      return;
    }
    g.innerHTML = list.map(function (c, i) {
      return '<div class="vcard spot" data-reveal style="--i:' + Math.min(i, 8) + '"><div class="vh"><div><h3>' + esc(c.name) + '</h3><div class="fans">' + esc(c.fans || "粉丝数未注明") + "</div></div>"
        + '<span class="acts"><button class="fav' + (favHas(FAV_CR, c.id) ? " on" : "") + '" data-favc="' + c.id + '" type="button" title="收藏这位创作者" aria-label="收藏这位创作者">★</button>'
        + '<span class="pf ' + esc(c.platform) + '">' + esc(PF[c.platform] || c.platform) + "</span></span></div>"
        + '<div class="ft">' + (c.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>"
        + '<p class="intro">' + esc(c.intro) + "</p>"
        + '<div class="fit">适合：' + esc(c.fit || "所有想开始训练的人") + "</div>"
        + rowsHTML(c)
        + '<div class="acts">' + actsHTML(c) + "</div></div>";
    }).join("");
    scanReveal(g);
  }
  function renderFilters() {
    var fp = $("#vPlat"), ft = $("#vTopic");
    if (fp) fp.innerHTML = PLATS.map(function (p) {
      return '<button class="chip' + (st.plat === p[0] ? " on" : "") + '" data-p="' + p[0] + '">' + p[1] + "</button>";
    }).join("");
    if (ft) ft.innerHTML = TOPICS.map(function (t) {
      return '<button class="chip' + (st.topic === t ? " on" : "") + '" data-tp="' + esc(t) + '">' + esc(t) + "</button>";
    }).join("");
  }
  var fw = $("#vFilters");
  if (fw) fw.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    if (c.hasAttribute("data-p")) st.plat = c.getAttribute("data-p");
    if (c.hasAttribute("data-tp")) st.topic = c.getAttribute("data-tp");
    renderFilters(); render();
  });
  var vs = $("#vSearch");
  if (vs) vs.addEventListener("input", function () { st.q = this.value.trim(); render(); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cid]"); if (!t) return;
    /* v14 修复：原先把 "创作者id-序号" 用 split("-") 拆开，而小红书账号 id 本身含 "-"
       （pamela-xhs 等），解析必然失败 → 那 5 位创作者的标题点了没反应。改双属性。 */
    var cid = t.getAttribute("data-cid"), idx = +t.getAttribute("data-i");
    var c = cs.filter(function (x) { return x.id === cid; })[0]; if (!c) return;
    var v = (c.videos || [])[idx]; if (!v) return;
    var box = $("#emb-" + cid); if (!box) return;
    var embed = (c.platform === "bilibili" && v.bvid) || (c.platform === "youtube" && ytId(v.url));
    if (!embed) { window.open(v.url, "_blank", "noopener"); return; }
    var already = box.classList.contains("on") && box.getAttribute("data-cur") === String(idx);
    if (already) { box.classList.remove("on"); box.innerHTML = ""; box.removeAttribute("data-cur"); return; }
    box.classList.add("on"); box.setAttribute("data-cur", String(idx));
    box.innerHTML = c.platform === "bilibili"
      ? '<iframe src="https://player.bilibili.com/player.html?bvid=' + v.bvid + '&autoplay=0&high_quality=1" allowfullscreen loading="lazy" referrerpolicy="no-referrer"></iframe>'
      : '<iframe src="https://www.youtube.com/embed/' + ytId(v.url) + '" allowfullscreen loading="lazy"></iframe>';
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  /* 收藏控件（注入在搜索行下方） */
  var ctrl = document.createElement("div");
  ctrl.className = "controls";
  ctrl.innerHTML = '<span class="lb">更多</span>'
    + '<button class="chip' + (st.fav ? " on" : "") + '" id="vFavChip" type="button">★ 只看收藏</button>';
  var tbEl = document.querySelector(".toolbar");
  if (tbEl && tbEl.parentNode) tbEl.parentNode.insertBefore(ctrl, tbEl.nextSibling);
  var vfc = document.getElementById("vFavChip");
  if (vfc) vfc.addEventListener("click", function () { st.fav = !st.fav; this.classList.toggle("on", st.fav); render(); });
  $("#vGrid").addEventListener("click", function (e) {
    var f = e.target.closest("[data-favc]");
    if (!f) return;
    e.preventDefault(); e.stopPropagation();
    f.classList.toggle("on", favToggle(FAV_CR, f.getAttribute("data-favc")));
  });
  renderFilters(); render();
}

/* ---------- 训练日志页 ---------- */
function initLog() {
  var customsQ = LS.get(CUSTOM_KEY, []);
  customsQ = Object.prototype.toString.call(customsQ) === "[object Array]" ? customsQ : [];
  var exs = window.FIT_EXERCISES || [], plans = (window.FIT_PLANS || []).concat(customsQ);
  var dateEl = $("#lgDate"), planEl = $("#lgPlan"), dayEl = $("#lgDay"), itemsEl = $("#lgItems"),
    sumEl = $("#lgSummary"), noteEl = $("#lgNote"), histEl = $("#lgHistory");
  if (!plans.length || !itemsEl) return;
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  if (dateEl && !dateEl.value) dateEl.value = iso(new Date());

  function renderPlanOptions() {
    planEl.innerHTML = plans.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + "</option>"; }).join("");
  }
  renderPlanOptions();
  var hashPlan = location.hash.slice(1);
  var qs = new URLSearchParams(location.search);
  var qPlan = qs.get("plan") || "";
  var qDay = parseInt(qs.get("day"), 10);
  var wantPlan = qPlan || hashPlan;
  if (wantPlan && plans.filter(function (p) { return p.id === wantPlan; }).length) planEl.value = wantPlan;
  function currentPlan() { return plans.filter(function (p) { return p.id === planEl.value; })[0] || plans[0]; }
  function trainingDays(p) { return (p.schedule || []).filter(function (d) { return d.items && d.items.length; }); }
  function renumber(box) { $$(".setrow", box).forEach(function (r, i) { var ix = $(".idx", r); if (ix) ix.textContent = i + 1; }); }
  /* v16：查该动作最近一次记录（用于 placeholder 提示 + 一键沿用） */
  function lastEntryFor(exId) {
    var arr = sessions();
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i], hit = null;
      (s.entries || []).forEach(function (en) { if (en.ex === exId && !hit) hit = en; });
      if (hit && hit.sets && hit.sets.length) return { date: String(s.date || "").slice(5), sets: hit.sets };
    }
    return null;
  }
  function addSet(box) {
    var wrap = $(".sets", box);
    var rows = $$(".setrow", wrap);
    var n = rows.length + 1;
    /* 上次同一动作的第 n 组：作为 placeholder（灰字），不写进 value，避免用户没注意就被存成旧数据 */
    var last = null;
    try { last = JSON.parse(decodeURIComponent(box.getAttribute("data-last") || "")); } catch (e) { last = null; }
    var l = last && last[rows.length] ? last[rows.length] : null;
    var phW = l && l.w ? String(l.w) : "kg";
    var phR = l && l.r ? String(l.r) : "次数";
    var row = document.createElement("div");
    row.className = "setrow";
    row.innerHTML = '<span class="idx">' + n + "</span>"
      + '<input type="number" class="w" step="2.5" min="0" placeholder="' + phW + '" aria-label="第 ' + n + ' 组重量">'
      + '<span class="u">kg ×</span>'
      + '<input type="number" class="r" min="0" placeholder="' + phR + '" aria-label="第 ' + n + ' 组次数">'
      + '<span class="u">次</span>'
      + '<button class="done" type="button" title="标记这组完成">✓</button>'
      + '<button class="del" type="button" title="删除这组">✕</button>';
    wrap.appendChild(row);
    renumber(box);
  }
  function updateSummary() {
    var sets = 0, vol = 0, reps = 0;
    $$(".lgitem", itemsEl).forEach(function (box) {
      $$(".setrow", box).forEach(function (r) {
        var w = parseFloat($(".w", r).value) || 0, rr = parseFloat($(".r", r).value) || 0;
        if (w > 0 || rr > 0) { sets++; vol += w * rr; reps += rr; }
      });
    });
    sumEl.innerHTML = "<b>本次合计：</b>" + sets + " 组 · 总容量 " + Math.round(vol) + " kg · 总次数 " + reps
      + (sets ? "" : '<span class="dim">（填上重量和次数会自动统计）</span>');
  }
  function renderItems() {
    var p = currentPlan(), days = trainingDays(p), d = days[+dayEl.value || 0];
    if (!d) { itemsEl.innerHTML = '<div class="hint">这个计划没有可记录的训练日，换一个计划试试。</div>'; updateSummary(); return; }
    itemsEl.innerHTML = d.items.map(function (it, idx) {
      var e = exById(it.ex);
      var last = lastEntryFor(it.ex);
      var lastAttr = last ? ' data-last="' + encodeURIComponent(JSON.stringify(last.sets)) + '"' : "";
      var lastBar = last
        ? '<div class="lastbar"><span class="lt">上次 ' + esc(last.date) + "：" + last.sets.map(function (x) { return (x.w || 0) + "×" + (x.r || 0); }).join(" / ")
          + '</span><button class="btn sm uselast" type="button" title="把上次的重量与次数填进右边各行">沿用上次</button></div>'
        : "";
      return '<div class="lgitem" data-i="' + idx + '" data-ex="' + esc(it.ex) + '"' + lastAttr + '>'
        + '<div class="h"><b>' + esc(e ? e.name : it.ex) + '</b><span class="t">目标 ' + esc(it.sets) + "</span>"
        + (e ? '<button class="btn sm" type="button" data-ex="' + e.id + '" style="padding:3px 10px">看要点</button>' : "")
        + "</div>" + lastBar
        + '<div class="sets"></div>'
        + '<button class="btn sm addset" type="button">＋ 加一组</button></div>';
    }).join("");
    $$(".lgitem", itemsEl).forEach(function (box) { for (var i = 0; i < 3; i++) addSet(box); });
    updateSummary();
  }
  function renderDays() {
    var p = currentPlan(), days = trainingDays(p);
    dayEl.innerHTML = days.map(function (d, i) { return '<option value="' + i + '">' + esc(d.day + " · " + d.label) + "</option>"; }).join("");
    renderItems();
  }
  itemsEl.addEventListener("input", updateSummary);
  itemsEl.addEventListener("click", function (e) {
    var box = e.target.closest(".lgitem"); if (!box) return;
    if (e.target.closest(".addset")) { addSet(box); updateSummary(); return; }
    /* v16：一键沿用上次的重量/次数 */
    if (e.target.closest(".uselast")) {
      var sets = [];
      try { sets = JSON.parse(decodeURIComponent(box.getAttribute("data-last") || "[]")); } catch (err) { sets = []; }
      while ($$(".setrow", box).length < sets.length) addSet(box);
      var rr = $$(".setrow", box);
      sets.forEach(function (s, i) {
        if (!rr[i]) return;
        $(".w", rr[i]).value = s.w || "";
        $(".r", rr[i]).value = s.r || "";
        var dn = $(".done", rr[i]);
        if (dn) dn.classList.toggle("on", !!s.done);
      });
      renumber(box);
      updateSummary();
      return;
    }
    var row = e.target.closest(".setrow"); if (!row) return;
    if (e.target.closest(".done")) { e.target.closest(".done").classList.toggle("on"); return; }
    if (e.target.closest(".del")) { row.remove(); renumber(box); updateSummary(); }
  });
  planEl.addEventListener("change", function () { history.replaceState(null, "", "#" + planEl.value); renderDays(); });
  dayEl.addEventListener("change", renderItems);
  $("#lgReset").addEventListener("click", function () { renderItems(); if (noteEl) noteEl.value = ""; });

  /* —— 训练趋势折线图（v3，纯 SVG 零依赖）—— */
  function svgLineChart(pts, dataLabel) {
    if (!pts || !pts.length) return "";
    var wD = 560, hD = 215, pad = 44;
    var vals = pts.map(function (p) { return p.y; });
    var maxY = (Math.max.apply(null, vals) || 1) * 1.12;
    var inW = wD - pad * 2, inH = hD - pad * 2.2;
    var xy = pts.map(function (p, i) {
      var x = pad + (pts.length === 1 ? inW / 2 : i * inW / (pts.length - 1));
      var y = pad + inH * (1 - (p.y || 0) / maxY);
      return { x: x, y: y, p: p };
    });
    var line = xy.map(function (q) { return q.x.toFixed(1) + "," + q.y.toFixed(1); }).join(" ");
    var s = '<svg viewBox="0 0 ' + wD + " " + hD + '" width="100%" role="img" aria-label="'
      + esc(dataLabel || "趋势") + " 折线图，共 " + pts.length + ' 个数据点">';
    s += '<line x1="' + pad + '" y1="' + (hD - pad) + '" x2="' + (wD - pad) + '" y2="' + (hD - pad) + '" stroke="var(--line)" stroke-width="1.5"/>';
    s += '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (hD - pad) + '" stroke="var(--line)" stroke-width="1.5"/>';
    if (xy.length > 1) {
      s += '<polygon class="trend-area" points="' + pad + "," + (hD - pad) + " " + line + " " + xy[xy.length - 1].x.toFixed(1) + "," + (hD - pad) + '" fill="rgba(198,255,61,.07)"/>';
      s += '<polyline class="trend-line" pathLength="1" points="' + line + '" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    xy.forEach(function (q, i) {
      s += '<circle class="trend-dot" style="--i:' + i + '" cx="' + q.x.toFixed(1) + '" cy="' + q.y.toFixed(1) + '" r="3.4" fill="var(--acc)"><title>' + esc((q.p.x || "") + "：" + q.p.y) + "</title></circle>";
    });
    s += '<text class="lt1" x="' + pad + '" y="' + (pad - 14) + '" font-size="12.5" font-weight="800">' + pts[0].y + "</text>";
    s += '<text class="lt2" x="' + pad + '" y="' + (hD - 12) + '" font-size="11" text-anchor="middle">' + esc(pts[0].x) + "</text>";
    if (pts.length > 1) {
      s += '<text class="lt2" x="' + (wD - pad) + '" y="' + (hD - 12) + '" font-size="11" text-anchor="middle">' + esc(pts[pts.length - 1].x) + "</text>";
      s += '<text class="lt1" x="' + (wD - pad) + '" y="' + (pad - 14) + '" font-size="12.5" font-weight="800" text-anchor="end">' + pts[pts.length - 1].y + "</text>";
    }
    return s + "</svg>";
  }
  function renderTrends() {
    var tv = $("#trVol"), tr = $("#trRm"), sel = $("#trEx");
    if (!tv && !tr && !sel) return;
    var list = sessions().slice().reverse();
    if (tv) {
      if (list.length < 2) tv.innerHTML = '<div class="empty" style="padding:26px 12px">至少保存 2 次训练，这里就会出现总容量折线图（重量×次数的总负荷）。</div>';
      else tv.innerHTML = svgLineChart(list.map(function (s) { return { x: (s.date || "").slice(5), y: sessionStats(s).vol }; }), "总容量");
    }
    if (sel) {
      var used = {}, order = [];
      list.forEach(function (s) {
        (s.entries || []).forEach(function (e) { if (!used[e.ex]) { used[e.ex] = true; order.push(e.ex); } });
      });
      var cur = sel.value;
      sel.innerHTML = order.length ? order.map(function (id2) {
        var e = exById(id2);
        return '<option value="' + esc(id2) + '">' + esc(e ? e.name : id2) + "</option>";
      }).join("") : '<option value="">（暂无记录）</option>';
      if (cur && sel.querySelector('option[value="' + cur + '"]')) sel.value = cur;
      sel.disabled = !order.length;
    }
    if (tr) {
      var exId = sel && sel.value ? sel.value : "";
      var pts = [];
      list.forEach(function (s) {
        var best = null;
        (s.entries || []).forEach(function (e) {
          if (e.ex !== exId) return;
          (e.sets || []).forEach(function (x) {
            if ((x.w || 0) > 0) {
              var rm = x.w * (1 + (x.r || 1) / 30);
              if (best === null || rm > best) best = rm;
            }
          });
        });
        if (best !== null) pts.push({ x: (s.date || "").slice(5), y: Math.round(best * 10) / 10 });
      });
      if (exId && pts.length) {
        tr.innerHTML = svgLineChart(pts, "估算 1RM")
          + '<p class="hint" style="margin-top:6px">每一点取该次训练中该动作最重一组的估算 1RM（kg）。</p>';
      } else {
        tr.innerHTML = '<div class="empty" style="padding:26px 12px">日志里还没有带重量的记录，保存一次就有了。</div>';
      }
    }
  }
  var trSel = $("#trEx");
  if (trSel) trSel.addEventListener("change", renderTrends);

  function sessions() { var v = LS.get(LOG_KEY, []); return Object.prototype.toString.call(v) === "[object Array]" ? v : []; }
  function sessionStats(s) { return window.IG_CALC.sessionStats(s); }
  function renderHistory() {
    renderTrends();
    var list = sessions();
    if (!list.length) { histEl.innerHTML = '<div class="empty">还没有记录。练完一次，填上重量与次数点保存，这里就会长出来。</div>'; return; }
    histEl.innerHTML = list.map(function (s, i) {
      var st2 = sessionStats(s);
      return '<div class="hist spot" data-reveal style="--i:' + Math.min(i, 7) + '" data-i="' + i + '"><div class="hh">'
        + '<span class="d">' + esc(s.date || "") + "</span>"
        + '<span class="m">' + esc(s.planName || "") + " · " + esc(s.day || "") + "</span>"
        + '<span class="m num">' + st2.sets + " 组 · " + st2.vol + " kg</span>"
        + '<span class="x">展开 ▾</span></div><div class="hb"><div class="hb-in">'
        + (s.entries || []).map(function (en) {
          return '<div class="row"><span>' + esc(en.name) + '</span><span class="mut num">'
            + (en.sets || []).map(function (x) { return (x.w || 0) + "×" + (x.r || 0) + (x.done ? "✓" : ""); }).join(" / ")
            + "</span></div>";
        }).join("")
        + (s.note ? '<div class="row"><span class="mut">备注</span><span>' + esc(s.note) + "</span></div>" : "")
        + '<div style="margin-top:10px"><button class="btn sm" data-del="' + i + '" type="button">删除这条</button></div>'
        + "</div></div></div>";
    }).join("");
    scanReveal(histEl);
  }
  histEl.addEventListener("click", function (e) {
    var del = e.target.closest("[data-del]");
    if (del) {
      var list = sessions();
      if (!window.confirm("删除这条记录？")) return;
      list.splice(+del.getAttribute("data-del"), 1);
      LS.set(LOG_KEY, list);
      renderHistory();
      renderWeekVol();
      renderCal();
      return;
    }
    var box = e.target.closest(".hist");
    if (box) box.classList.toggle("open");
  });
  $("#lgSave").addEventListener("click", function () {
    var p = currentPlan(), days = trainingDays(p), d = days[+dayEl.value || 0];
    var entries = [];
    $$(".lgitem", itemsEl).forEach(function (box) {
      var exId = box.getAttribute("data-ex");
      var e = exById(exId);
      var sets = $$(".setrow", box).map(function (r) {
        return {
          w: parseFloat($(".w", r).value) || 0,
          r: parseFloat($(".r", r).value) || 0,
          done: $(".done", r).classList.contains("on")
        };
      }).filter(function (x) { return x.w > 0 || x.r > 0; });
      if (sets.length) entries.push({ ex: exId, name: e ? e.name : exId, sets: sets });
    });
    if (!entries.length) { window.alert("还没有填任何组次——先填重量/次数再保存。"); return; }
    var s = {
      id: Date.now(), date: dateEl.value || iso(new Date()), plan: p.id, planName: p.name,
      day: d ? d.day + " · " + d.label : "", note: noteEl ? noteEl.value.trim() : "", entries: entries
    };
    var list = sessions();
    list.unshift(s);
    LS.set(LOG_KEY, list);
    if (noteEl) noteEl.value = "";
    renderItems();
    renderHistory();
    renderWeekVol();
    renderCal();
    var msg = document.getElementById("lgNotice");
    if (msg) {
      var ok = document.createElement("div");
      ok.className = "callout ok";
      ok.innerHTML = "已保存 ✓ 本次 <b>" + entries.length + "</b> 个动作 · 共 <b>" + sessionStats(s).sets + "</b> 组 · 总容量 <b>" + sessionStats(s).vol + " kg</b>";
      msg.innerHTML = "";
      msg.appendChild(ok);
    }
  });

  /* —— 组间休息计时器（v16；零外部资源，结束用 Web Audio 响两声）—— */
  (function restTimer() {
    var disp = $("#restTime"), btn = $("#restStart"), host = $("#restBox");
    if (!disp || !btn || !host) return;
    var total = 120, left = 120, endAt = 0, ticker = null;
    function fmt(s) { return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function paint() { disp.textContent = fmt(left); disp.classList.toggle("run", !!ticker); }
    function beep() {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        var ac = new AC(), t0 = ac.currentTime;
        [0, 0.30].forEach(function (d) {
          var o = ac.createOscillator(), g = ac.createGain();
          o.type = "sine"; o.frequency.value = 880;
          g.gain.setValueAtTime(0.0001, t0 + d);
          g.gain.exponentialRampToValueAtTime(0.32, t0 + d + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.20);
          o.connect(g); g.connect(ac.destination);
          o.start(t0 + d); o.stop(t0 + d + 0.24);
        });
        setTimeout(function () { try { ac.close(); } catch (e) {} }, 1500);
      } catch (e) { /* 音频不可用就静音，不影响计时 */ }
    }
    function halt(reset) {
      if (ticker) { clearInterval(ticker); ticker = null; }
      btn.textContent = "开始";
      if (reset) { left = total; disp.setAttribute("aria-live", "off"); paint(); }
    }
    function done() {
      clearInterval(ticker); ticker = null;
      left = 0;
      disp.textContent = "时间到";
      disp.classList.remove("run");
      disp.setAttribute("aria-live", "assertive");
      btn.textContent = "再来一次";
      beep();
      try { if (navigator.vibrate) navigator.vibrate([140, 80, 140]); } catch (e) {}
    }
    function start() {
      if (left <= 0) left = total;
      endAt = Date.now() + left * 1000;
      paint();
      disp.setAttribute("aria-live", "off");
      btn.textContent = "停止";
      if (ticker) clearInterval(ticker);
      ticker = setInterval(function () {
        var remain = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        if (remain !== left) { left = remain; if (remain > 0) paint(); }
        if (remain <= 0) done();
      }, 250);
    }
    host.addEventListener("click", function (e) {
      var c = e.target.closest("[data-rest]");
      if (c) {
        total = parseInt(c.getAttribute("data-rest"), 10) || 120;
        $$(".chip", host).forEach(function (x) { x.classList.toggle("on", x === c); });
        halt(true);
        return;
      }
      if (e.target.id === "restStart") {
        if (ticker) { halt(true); return; }
        start();
      }
    });
    paint();
  })();

  /* 1RM 估算 */
  var rmLift = $("#rmLift"), rmReps = $("#rmReps"), rmOut = $("#rmOut");
  function calcRM() {
    var w = parseFloat(rmLift.value) || 0, r = parseFloat(rmReps.value) || 0;
    if (!w || !r) { rmOut.textContent = "填入重量与次数后自动计算（次数建议 1–10 之间最准）。"; return; }
    if (r > 15) { rmOut.textContent = "次数超过 15 次时估算误差较大，建议用更重的重量再测一次。"; return; }
    var one = window.IG_CALC.epley(w, r);
    var pcts = window.IG_CALC.percentages(one);
    rmOut.innerHTML = '估算 <b style="color:var(--acc)">1RM ≈ ' + one.toFixed(1) + " kg</b>（" + w + " kg × " + r + " 次，Epley 公式）<br>"
      + '<span class="mut">常用训练重量：' + pcts.map(function (x) { return x.pct + "% · " + x.w.toFixed(1) + "kg"; }).join("　") + "</span>";
  }
  if (rmLift && rmOut) { rmLift.addEventListener("input", calcRM); rmReps.addEventListener("input", calcRM); calcRM(); }

  /* 每周容量核算 */
  var volEx = $("#volEx"), volSets = $("#volSets"), volList = $("#volList"), volTotals = $("#volTotals");
  var volItems = [];
  function renderVol() {
    volList.innerHTML = volItems.length ? volItems.map(function (v, i) {
      var e = exById(v.ex);
      return '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0"><span>' + esc(e ? e.name : v.ex)
        + '</span><span class="mut">' + v.sets + ' 组 <button class="btn sm" data-vol="' + i + '" type="button" style="padding:2px 8px;margin-left:6px">移除</button></span></div>';
    }).join("") : '<span class="dim">还没加入动作。把本周练过的动作逐个加进来。</span>';
    var parts = {};
    volItems.forEach(function (v) {
      var e = exById(v.ex);
      if (!e) return;
      var key = muscleGroupOf(e);   /* v14：按主目标肌群统计，不再用部位 */
      parts[key] = (parts[key] || 0) + (+v.sets || 0);
    });
    var keys = Object.keys(parts);
    volTotals.innerHTML = keys.length ? keys.map(function (k) {
      var n = parts[k];
      var cls = n < 10 ? "low" : n <= 20 ? "ok" : "high";
      var hint = n < 10 ? "偏低，可再加 2–4 组" : n <= 20 ? "落在 10–20 组区间 ✓" : "偏高，注意恢复";
      return '<div class="vol ' + cls + '"><div class="n">' + esc(k) + '</div><div class="v num">' + n + ' 组</div><div class="hint2">' + hint + "</div></div>";
    }).join("") : "";
  }
  if (volEx) {
    volEx.innerHTML = exs.map(function (e) { return '<option value="' + e.id + '">' + esc(e.name) + "（" + esc((e.parts || []).join("/")) + "）</option>"; }).join("");
    $("#volAdd").addEventListener("click", function () {
      volItems.push({ ex: volEx.value, sets: Math.max(1, parseInt(volSets.value, 10) || 3) });
      renderVol();
    });
    $("#volClear").addEventListener("click", function () { volItems = []; renderVol(); });
    volList.addEventListener("click", function (e) {
      var b = e.target.closest("[data-vol]"); if (!b) return;
      volItems.splice(+b.getAttribute("data-vol"), 1); renderVol();
    });
    renderVol();
  }

  /* —— 体测记录 + 体重趋势（v4）—— */
  var BW_KEY = "ig_body";
  function bwListAll() {
    var v = LS.get(BW_KEY, []);
    return Object.prototype.toString.call(v) === "[object Array]" ? v : [];
  }
  function renderBody() {
    var bwList = $("#bwList"), trBw = $("#trBw"), bwDate = $("#bwDate");
    if (!bwList && !trBw) return;
    if (bwDate && !bwDate.value) bwDate.value = iso(new Date());
    var entries = bwListAll().slice().sort(function (a, b) { return a.d < b.d ? -1 : 1; });
    if (bwList) {
      bwList.innerHTML = entries.length ? entries.slice().reverse().map(function (x) {
        return '<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0"><span>' + esc(x.d) + "</span>"
          + '<span class="mut">体重 ' + (x.w || "—") + (x.waist ? " · 腰围 " + x.waist + "cm" : "") + (x.bf ? " · 体脂 " + x.bf + "%" : "")
          + ' <button class="btn sm" data-bwdel="' + esc(String(x.id)) + '" type="button" style="padding:2px 8px;margin-left:6px">移除</button></span></div>';
      }).join("") : '<span class="dim">还没有体测数据。固定条件（比如早晨空腹）记录，变化才可比。</span>';
    }
    if (trBw) {
      var pts = entries.filter(function (x) { return x.w > 0; }).map(function (x) { return { x: (x.d || "").slice(5), y: x.w }; });
      trBw.innerHTML = pts.length >= 2
        ? svgLineChart(pts, "体重")
        : '<div class="empty" style="padding:26px 12px">至少记录 2 次体重，这里就会出现变化曲线。</div>';
    }
  }
  var bwAdd = $("#bwAdd");
  if (bwAdd) {
    bwAdd.addEventListener("click", function () {
      var w = parseFloat($("#bwW").value) || 0, waist = parseFloat($("#bwWaist").value) || 0, bf = parseFloat($("#bwBf").value) || 0;
      var d = $("#bwDate").value || iso(new Date());
      if (!w && !waist && !bf) { window.alert("至少填一项（体重/腰围/体脂）再记录。"); return; }
      var arr2 = bwListAll();
      var dup = arr2.filter(function (x) { return x.d === d; })[0];
      var entry = { id: Date.now() + "-" + Math.floor(Math.random() * 1000), d: d, w: w || null, waist: waist || null, bf: bf || null };
      if (dup) {
        if (!window.confirm("这一天已有体测记录，覆盖它？")) return;
        var idx = arr2.indexOf(dup); arr2[idx] = entry;
      } else arr2.push(entry);
      LS.set(BW_KEY, arr2);
      $("#bwW").value = ""; $("#bwWaist").value = ""; $("#bwBf").value = "";
      renderBody();
    });
    $("#bwList").addEventListener("click", function (e) {
      var b = e.target.closest("[data-bwdel]"); if (!b) return;
      if (!window.confirm("删除这条体测记录？")) return;
      var id = b.getAttribute("data-bwdel");
      LS.set(BW_KEY, bwListAll().filter(function (x) { return String(x.id) !== id; }));
      renderBody();
    });
  }

  /* —— 近 8 周肌群容量（v4，从日志自动统计）—— */
  function weekStartOf(dateStr) { return window.IG_CALC.weekStart(dateStr); }
  function renderWeekVol() {
    var host = $("#wkVol");
    if (!host) return;
    var wk = weekStartOf(iso(new Date()));
    if (!wk) return;
    var weeks = [];
    for (var i = 7; i >= 0; i--) {
      var d = new Date(wk); d.setDate(d.getDate() - i * 7);
      weeks.push({ key: iso(d), label: iso(d).slice(5).replace("-", "/"), sets: {} });
    }
    sessions().forEach(function (s) {
      if (!s.date) return;
      var st = weekStartOf(s.date);
      if (!st) return;
      var key = iso(st), slot = null;
      for (var w = 0; w < weeks.length; w++) if (weeks[w].key === key) { slot = weeks[w]; break; }
      if (!slot) return;
      (s.entries || []).forEach(function (en) {
        var e2 = exById(en.ex);
        var part = muscleGroupOf(e2);   /* v14：主目标肌群口径 */
        (en.sets || []).forEach(function (x) {
          if (x.done || (x.w > 0 && x.r > 0)) slot.sets[part] = (slot.sets[part] || 0) + 1;
        });
      });
    });
    var partOrder = [];
    weeks.forEach(function (w) { Object.keys(w.sets).forEach(function (k) { if (partOrder.indexOf(k) < 0) partOrder.push(k); }); });
    var any = weeks.some(function (w) { return Object.keys(w.sets).length; });
    if (!any) {
      host.innerHTML = '<div class="empty">保存过 2 次以上训练后，这里会按周自动统计每个肌群的组数（打 ✓ 或重量次数都填的组才算）。</div>';
      return;
    }
    host.innerHTML = partOrder.map(function (part) {
      return '<div class="wkrow"><span class="k">' + esc(part) + "</span>"
        + weeks.map(function (w, wi) {
          var n = w.sets[part] || 0;
          var cls = n <= 0 ? "zero" : n < 10 ? "low" : n <= 20 ? "ok" : "high";
          return '<span class="wkbar ' + cls + '" title="' + w.label + "：" + n + ' 组"><i style="height:' + Math.max(2, Math.min(44, n * 5)) + 'px;--i:' + wi + '"></i><em>' + n + "</em></span>";
        }).join("") + "</div>";
    }).join("")
      + '<div class="wklab">' + weeks.map(function (w) { return "<span>" + esc(w.label) + "</span>"; }).join("") + "</div>"
      + '<div class="hint" style="margin-top:12px">按「动作主目标肌群」计数 · 灰 = <10 组偏低 · 亮绿 = 10–20 组合适 · 橙 = >20 组偏高（每肌群每周的循证区间；小腿 / 前臂 / 腹等小肌群 6–12 组同样常见）。</div>';
  }
  renderBody();
  renderWeekVol();

  /* —— 训练月历（v6）—— */
  var calOff = 0, calGrid = $("#calGrid");
  function renderCal() {
    if (!calGrid) return;
    var base = new Date(); base.setDate(1); base.setHours(0, 0, 0, 0);
    base.setMonth(base.getMonth() + calOff);
    var y = base.getFullYear(), mIdx = base.getMonth();
    var title = $("#calTitle");
    if (title) title.textContent = y + " 年 " + (mIdx + 1) + " 月";
    var byDay = {};
    sessions().forEach(function (s) {
      if (!s.date || s.date.slice(0, 7) !== y + "-" + String(mIdx + 1).padStart(2, "0")) return;
      var dDay = s.date.slice(8), st2 = sessionStats(s);
      if (!byDay[dDay]) byDay[dDay] = { n: 0, vol: 0 };
      byDay[dDay].n++; byDay[dDay].vol += st2.vol;
    });
    var firstDow = (base.getDay() + 6) % 7;
    var days = new Date(y, mIdx + 1, 0).getDate();
    var today = iso(new Date());
    var html = "";
    for (var w = 0; w < firstDow; w++) html += '<span class="d blank"></span>';
    for (var i = 1; i <= days; i++) {
      var key = String(i).padStart(2, "0");
      var info = byDay[key];
      var isToday = (y + "-" + String(mIdx + 1).padStart(2, "0") + "-" + key) === today;
      html += '<span class="d' + (info ? " has" : "") + (isToday ? " today" : "") + '" style="--i:' + Math.min(i - 1, 20) + '"><b>' + i + "</b>"
        + (info ? '<em class="num">' + (info.vol >= 1000 ? (info.vol / 1000).toFixed(1) + "k" : info.vol) + "</em>" : "") + "</span>";
    }
    calGrid.innerHTML = html;
  }
  var prev = $("#calPrev"), next = $("#calNext");
  if (prev) prev.addEventListener("click", function () { calOff--; renderCal(); });
  if (next) next.addEventListener("click", function () { calOff++; renderCal(); });
  renderCal();

  /* —— 打印版周报（v7：生成 → 浏览器打印）—— */
  window.__igBuildReport = function () {
    var wrapEl = $("#printReport");
    if (!wrapEl) return "";
    var end = new Date();
    var start = new Date(); start.setDate(start.getDate() - 6);
    var s0 = iso(start), s1 = iso(end);
    var list = sessions().filter(function (s) { return s.date && s.date >= s0 && s.date <= s1; });
    var parts = {};
    list.forEach(function (s) {
      (s.entries || []).forEach(function (en) {
        var e2 = exById(en.ex);
        var part = muscleGroupOf(e2);   /* v14：主目标肌群口径 */
        (en.sets || []).forEach(function (x) {
          if (x.done || (x.w > 0 && x.r > 0)) parts[part] = (parts[part] || 0) + 1;
        });
      });
    });
    var totalVol = 0, totalSets = 0;
    list.forEach(function (s) { var st2 = sessionStats(s); totalVol += st2.vol; totalSets += st2.sets; });
    var bwEntries = bwListAll().filter(function (x) { return x.w > 0; }).sort(function (a2, b2) { return a2.d < b2.d ? -1 : 1; });
    var bwLine = bwEntries.length >= 2
      ? "最近两次体重 " + bwEntries[bwEntries.length - 2].w + " → " + bwEntries[bwEntries.length - 1].w
        + " kg（变化 " + (bwEntries[bwEntries.length - 1].w - bwEntries[bwEntries.length - 2].w > 0 ? "+" : "") + (bwEntries[bwEntries.length - 1].w - bwEntries[bwEntries.length - 2].w).toFixed(1) + "）"
      : "不足两次体重记录，暂无趋势";
    var rows = list.slice().reverse().map(function (s) {
      var st3 = sessionStats(s);
      return "<tr><td>" + esc(s.date) + "</td><td>" + esc(s.planName || "") + " · " + esc(s.day || "") + "</td><td>"
        + (s.entries || []).map(function (en) { return esc(en.name) + ": " + (en.sets || []).map(function (x) { return x.w + "×" + x.r; }).join(","); }).join("<br>")
        + "</td><td>" + st3.sets + "</td><td>" + st3.vol + "</td></tr>";
    }).join("") || '<tr><td colspan="5" style="text-align:center;color:#888">本周没有训练记录</td></tr>';
    var partRows = Object.keys(parts).length
      ? Object.keys(parts).map(function (k) {
        var n = parts[k], hint = n < 10 ? "偏低（<10）" : n <= 20 ? "合适 ✓" : "偏高（>20）";
        return "<tr><td>" + esc(k) + "</td><td>" + n + "</td><td>" + hint + "</td></tr>";
      }).join("")
      : '<tr><td colspan="3" style="text-align:center;color:#888">暂不适用（无有效组）</td></tr>';
    wrapEl.innerHTML = '<h1 style="margin:0 0 4px">铁引力 · 训练周报</h1><div style="color:#666;font-size:13px;margin-bottom:14px">' + s0 + " 至 " + s1 + " · 生成于 " + new Date().toLocaleString("zh-CN") + "</div>"
      + '<h3 style="margin:14px 0 6px">本周小结</h3><p style="margin:0">训练 <b>' + list.length + "</b> 次 · 共 <b>" + totalSets + "</b> 组 · 总容量 <b>" + totalVol + " kg</b>。" + esc(bwLine) + "</p>"
      + '<h3 style="margin:14px 0 6px">训练明细</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:12.5px;width:100%"><tr><th align="left">日期</th><th align="left">计划</th><th align="left">动作组次</th><th>组数</th><th>容量 kg</th></tr>' + rows + "</table>"
      + '<h3 style="margin:14px 0 6px">肌群周容量（10–20 组/周为循证区间）</h3><table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:12.5px"><tr><th align="left">肌群</th><th>组数</th><th>判定</th></tr>' + partRows + "</table>";
    return wrapEl.innerHTML;
  };
  var weeklyBtn = $("#lgWeekly");
  if (weeklyBtn) weeklyBtn.addEventListener("click", function () { window.__igBuildReport(); window.print(); });

  /* 数据管理：导出 / 导入 / 清空 */
  $("#lgExport").addEventListener("click", function () {
    var data = {
      app: "iron-gravity", exportedAt: new Date().toISOString(),
      sessions: sessions(), favExercises: favList(FAV_EX), favCreators: favList(FAV_CR), target: LS.get(TGT_KEY, null),
      /* v14 修复：此前漏掉自定义课表与体测记录 —— 换设备/清缓存会直接丢 */
      customs: LS.get(CUSTOM_KEY, []), body: bwListAll()
    };
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "iron-gravity-backup-" + iso(new Date()) + ".json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (err) { window.alert("导出失败：" + err.message + "（可能需要在本地服务下打开）"); }
  });
  $("#lgPick").addEventListener("click", function () { $("#lgImportFile").click(); });
  $("#lgImportFile").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        var isArr = function (v) { return Object.prototype.toString.call(v) === "[object Array]"; };
        if (!d || typeof d !== "object") throw new Error("shape");
        var got = 0;
        if (isArr(d.sessions)) { LS.set(LOG_KEY, d.sessions.filter(function (s) { return s && typeof s === "object" && s.date; })); got++; }
        if (isArr(d.favExercises)) { LS.set(FAV_EX, d.favExercises); got++; }
        if (isArr(d.favCreators)) { LS.set(FAV_CR, d.favCreators); got++; }
        /* v14：导出新增的两个键；老备份没有这两项也不报错 */
        if (isArr(d.customs)) { LS.set(CUSTOM_KEY, d.customs.filter(function (p) { return p && p.id && isArr(p.schedule); })); got++; }
        if (isArr(d.body)) { LS.set(BW_KEY, d.body.filter(function (x) { return x && x.d; })); got++; }
        if (d.target && typeof d.target === "object") { LS.set(TGT_KEY, d.target); got++; }
        if (!got) throw new Error("empty");
        var cq = LS.get(CUSTOM_KEY, []);
        plans = (window.FIT_PLANS || []).concat(isArr(cq) ? cq : []);
        renderPlanOptions();
        renderDays();
        renderBody();
        renderHistory();
        renderWeekVol();
        renderCal();
        window.alert("导入完成 ✓");
      } catch (err) { window.alert("导入失败：文件不是有效的备份 JSON。"); }
    };
    fr.readAsText(f);
  });
  $("#lgWipe").addEventListener("click", function () {
    if (!window.confirm("清空全部训练记录？（收藏、饮食目标、自定义课表与体测记录会保留）")) return;
    LS.set(LOG_KEY, []);
    renderHistory();
    renderWeekVol();   /* v14 修复：清空后 8 周容量图与月历此前不刷新，会留残影 */
    renderCal();
    window.alert("已清空。");
  });

  renderDays();
  renderHistory();
  ensureLsNotice();
}

/* ---------- 术语手册页 ---------- */
function initGlossary() {
  var G = window.FIT_GLOSSARY || {};
  var terms = G.terms || [], faqs = G.faqs || [];
  var st = { cat: "全部", q: "" };
  var cats = ["全部"];
  terms.forEach(function (t) { if (cats.indexOf(t.cat) < 0) cats.push(t.cat); });
  function renderCats() {
    var host = $("#glCats"); if (!host) return;
    host.innerHTML = cats.map(function (c) { return '<button class="chip' + (st.cat === c ? " on" : "") + '" data-c="' + esc(c) + '" type="button">' + esc(c) + "</button>"; }).join("");
  }
  function renderTerms() {
    var list = terms.filter(function (t) {
      if (st.cat !== "全部" && t.cat !== st.cat) return false;
      if (st.q && (t.t + " " + (t.en || "") + " " + t.d).toLowerCase().indexOf(st.q.toLowerCase()) < 0) return false;
      return true;
    });
    var cnt = $("#glCount"); if (cnt) cnt.textContent = "共 " + list.length + " 条术语";
    var host = $("#glTerms");
    host.innerHTML = list.length ? list.map(function (t, i) {
      return '<div class="gl spot" data-reveal style="--i:' + Math.min(i, 9) + '"><div class="t"><b>' + esc(t.t) + "</b>"
        + (t.en ? '<span class="en">' + esc(t.en) + "</span>" : "")
        + '<span class="tag mut">' + esc(t.cat) + "</span></div><p>" + esc(t.d) + "</p></div>";
    }).join("") : '<div class="empty">没有匹配的术语——换个关键词试试</div>';
    scanReveal(host);
  }
  if ($("#glCats")) {
    $("#glCats").addEventListener("click", function (e) {
      var c = e.target.closest(".chip"); if (!c) return;
      st.cat = c.getAttribute("data-c"); renderCats(); renderTerms();
    });
  }
  var s = $("#glSearch");
  if (s) s.addEventListener("input", function () { st.q = this.value.trim(); renderTerms(); });
  renderCats(); renderTerms();
  var host = $("#glFaqs");
  if (host) {
    var order = ["训练", "恢复", "营养", "计划"], groups = {};
    faqs.forEach(function (f) { (groups[f.cat] = groups[f.cat] || []).push(f); });
    host.innerHTML = order.filter(function (k) { return groups[k]; }).map(function (k) {
      return '<div class="faqcat">' + esc(k) + " · " + groups[k].length + " 问</div>" + groups[k].map(function (f) {
        return '<details class="faq"><summary>' + esc(f.q) + '</summary><div class="a">' + esc(f.a) + "</div></details>";
      }).join("");
    }).join("");
  }
}

/* ---------- 证据与来源页（v15） ---------- */
function initEvidence() {
  var E = window.IG_EVIDENCE || {};
  var meta = E.meta || {}, refs = E.refs || {}, claims = E.claims || [];
  var lvBox = $("#evLevels");
  if (lvBox) {
    var names = { A: "有直接证据", B: "需推导", C: "经验共识" };
    lvBox.innerHTML = (meta.levels || []).map(function (x) {
      return '<div class="card evlv"><span class="lvbadge ' + esc(x.k) + '">' + esc(x.k) + "</span>"
        + "<h3>" + esc(names[x.k] || x.k) + "</h3>"
        + '<p class="desc">' + esc(x.d) + "</p></div>";
    }).join("");
  }
  var mL = $("#evMethod");
  if (mL) mL.innerHTML = "<b>怎么读这张表：</b>" + esc(meta.method || "");
  var cBox = $("#evClaims");
  if (cBox) {
    /* 文献编号：与文末列表一一对应。两条 Helms 2014（备赛 / 减脂期蛋白）作者年份相同，
       只靠「作者+年份」无法区分，所以引用一律带 [n]。 */
    var refKeys = Object.keys(refs);
    var idxOf = {};
    refKeys.forEach(function (k, i) { idxOf[k] = i + 1; });
    cBox.innerHTML = claims.map(function (c) {
      var links = (c.refs || []).filter(function (k) { return refs[k]; }).map(function (k) {
        var r = refs[k];
        return '<a href="#ref-' + esc(k) + '">[' + idxOf[k] + "] " + esc(r.a) + " " + esc(r.y) + " · " + esc(r.j) + "</a>";
      }).join(" · ");
      return '<div class="card evclaim" id="claim-' + esc(c.id) + '">'
        + '<div class="evh"><span class="lvbadge ' + esc(c.lv) + '">' + esc(c.lv) + "</span><h3>" + esc(c.t) + "</h3></div>"
        + '<p class="desc">' + esc(c.say) + "</p>"
        + (c.caveat ? '<p class="evcav"><b>边界：</b>' + esc(c.caveat) + "</p>" : "")
        + '<div class="evmeta">依据：' + (links || "—") + "<br>用在哪：" + esc(c.used || "—") + "</div></div>";
    }).join("");
    scanReveal(cBox);
  }
  var rBox = $("#evRefs");
  if (rBox) {
    rBox.innerHTML = Object.keys(refs).map(function (k) {
      var r = refs[k];
      return '<li id="ref-' + esc(k) + '"><b>' + esc(r.a) + "</b>（" + esc(r.y) + "）. " + esc(r.t) + ". <i>" + esc(r.j) + "</i>"
        + (r.cite ? ", " + esc(r.cite) : "") + '. <a href="https://pubmed.ncbi.nlm.nih.gov/' + esc(r.pmid) + '/" target="_blank" rel="noopener">PMID ' + esc(r.pmid) + " ↗</a></li>";
    }).join("");
  }
  var lim = $("#evLimits");
  if (lim) lim.innerHTML = '<ul class="plist">'
    + "<li><b>动作要点</b>（肩胛后收、肘角 45°–70°、肋骨下沉…）是生物力学与教练共识，C 级，没有针对每条说法的对照研究。</li>"
    + "<li><b>组间休息秒数</b>（复合 2–3 分钟 / 孤立 60–90 秒）来自实践与部分研究的间接推断，标为 C 级；它与训练目标（力量 / 肌肥大 / 耐力）强相关。</li>"
    + "<li><b>替代动作关系</b>（谁替代谁）是动作模式相似度的判断，不是研究结论。</li>"
    + "<li><b>创作者精选</b>是编辑判断，不代表对博主内容的科学背书；粉丝数与播放量为构建时公开数据。</li>"
    + "<li><b>本站不构成医疗建议</b>：有伤病史、心血管问题、孕产期请先咨询医生或康复师。</li>"
    + "</ul>";
}

/* ---------- 主题切换（v3）---------- */
function applyTheme(mode, persist) {
  var light = mode === "light";
  document.body.classList.toggle("light", light);
  if (persist !== false) LS.set("ig_theme", light ? "light" : "dark");
  var b = document.getElementById("themeBtn");
  if (b) {
    b.textContent = light ? "🌙 切回深色" : "☀ 切换浅色";
    b.setAttribute("aria-pressed", light ? "true" : "false");   /* v12：状态可被读屏感知 */
    b.setAttribute("aria-label", light ? "当前浅色主题，切换到深色" : "当前深色主题，切换到浅色");
  }
}
function installThemeToggle() {
  var qp = new URLSearchParams(location.search).get("theme");
  /* URL 带 ?theme=… 时只临时生效（不覆盖用户记忆的主题），便于分享带主题的链接 */
  var saved = LS.get("ig_theme", "");
  if (!saved && !qp) {
    /* 用户从未手动选过主题：跟随系统偏好，但不写入（首次点按钮才记忆） */
    var sys = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    applyTheme(sys, false);
  } else {
    applyTheme(qp === "light" || qp === "dark" ? qp : (saved || "dark"), qp ? false : true);
  }
  var bar = document.querySelector(".topbar .in");
  if (bar && !document.getElementById("themeBtn")) {
    var b = document.createElement("button");
    b.className = "btn sm ghost themebtn"; b.id = "themeBtn"; b.type = "button";
    b.setAttribute("aria-label", "切换深色/浅色主题");
    bar.appendChild(b);
    b.addEventListener("click", function () {
      applyTheme(document.body.classList.contains("light") ? "dark" : "light");
    });
  }
  /* v14 修复：这里原来传 persist=true，把「首次访问的系统主题」写进了 localStorage，
     导致之后系统切主题不再跟随。现在只刷新按钮状态，写入只发生在用户手动切换时。 */
  applyTheme(document.body.classList.contains("light") ? "light" : "dark", false);
}

/* ---------- 动作详情独立页（v3）---------- */
function initDetail() {
  var host = $("#dBody"); if (!host) return;
  var exs = window.FIT_EXERCISES || [];
  var id = new URLSearchParams(location.search).get("id");
  var ex = exById(id);
  var t = $("#dTitle"), sub = $("#dSub");
  if (!ex) {
    if (t) t.textContent = "选择一个动作";
    if (sub) sub.textContent = "没有找到该动作（可能链接有误）——从下面的完整列表挑一个，或回到「动作库」筛选。";
    host.innerHTML = '<div class="glgrid">' + exs.map(function (e) {
      return '<a class="gl" href="detail.html?id=' + esc(e.id) + '"><div class="t"><b>' + esc(e.name) + "</b>"
        + '<span class="lv ' + esc(e.level) + '">' + esc(e.level) + '</span></div><p>' + esc((e.tips || [])[0] || "") + "</p></div>";
    }).join("") + "</div>";
    return;
  }
  if (t) t.textContent = ex.name;
  if (sub) sub.textContent = ex.en + " · " + (ex.parts || []).join(" / ") + " · " + ex.equip;
  document.title = ex.name + " · 铁引力";
  var refs = planRefs(id);
  var idx = exs.indexOf(ex);
  var prev = exs[(idx - 1 + exs.length) % exs.length];
  var next = exs[(idx + 1) % exs.length];
  var relList = relatedExercises(ex, 6);
  var relHtml = relList.length
    ? '<div class="altrow relrow"><span class="hint">同肌群动作：</span>' + relList.map(function (r) {
        return '<a class="rchip" href="detail.html?id=' + esc(r.e.id) + '">' + esc(r.e.name) + "</a>";
      }).join("") + "</div>"
    : "";
  var altHtml = (ex.alt || []).map(function (a) {
    var b = exById(a);
    return b ? '<a class="chip" href="detail.html?id=' + esc(b.id) + '">' + esc(b.name) + "</a>" : "";
  }).join("") || '<span class="dim">— 暂无，见同部位其他动作</span>';
  var refHtml = refs.length
    ? '<div class="altrow" style="margin-top:10px"><span class="hint">出现在训练计划：</span>'
      + refs.map(function (r) { return '<a class="chip" href="plans.html#' + r.pid + '">' + esc(r.plan) + " · " + esc(r.day) + "</a>"; }).join("") + "</div>"
    : '<div class="altrow" style="margin-top:10px"><span class="hint">出现在训练计划：</span><span class="dim">暂未编入任何计划（可用「容量核算」自由安排）</span></div>';
  host.innerHTML = '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:20px">'
    + '<a class="btn sm" href="exercises.html">← 返回动作库</a>'
    + '<button class="btn sm" data-detailact="print" type="button">打印动作卡</button>'
    + '<a class="btn sm" href="log.html">去日志记录 →</a>'
    + '<a class="btn sm" href="videos.html">找教学视频 →</a>'
    + '<button class="btn sm" id="plcExport" type="button">导出说明牌 SVG</button></div>'
    + '<div class="metarow mb18">'
    + '<span class="lv ' + esc(ex.level) + '">' + esc(ex.level) + "</span>"
    + '<span class="tag">' + esc((ex.parts || []).join("/")) + '</span><span class="tag mut">' + esc(ex.equip) + "</span></div>"
     + (function () {
      /* 说明牌图层（v8）：详情页大帧 + 部位面板；缺模板或缺图整体关掉 → 回退剪影层 */
      if (location.search.indexOf("placard=0") > -1) {
       return '<div class="art big">' + (window.IG_ART ? IG_ART.of(ex) : "") + "</div>";
     }
     var P = window.IG_PLACARD;
     if (!P) return "";
     var key = window.IG_ART ? P.keyFor(window.IG_ART.patternOf(ex), ex.id) : null;
     var html = "";
     if (key && P.hasFrames(key)) {
       /* v9 收口：默认面板 = 肌群级解剖（映射优先 + parts 机械兜底）；?panel=part 回退部位级；兜底不变 */
       var panelHtml = "";
       if (window.IG_ATLAS && window.IG_ATLAS_ART && location.search.indexOf("panel=part") < 0) {
         var det = IG_ATLAS_ART.detail(ex);
           if (det.svg) {
             var musLink = function (b) {
               var zh = IG_ATLAS_ART.zhOf(b) || b;
               var fam = famOfBase(b);
               return fam ? '<a class="mlk" href="exercises.html?muscle=' + encodeURIComponent(fam) + '">' + esc(zh) + "</a>" : esc(zh);
             };
             panelHtml = det.svg
               + '<p class="aleg">目标肌群：' + (det.hotBases.length ? det.hotBases.map(musLink).join(" / ") : "—") + "</p>"
               + (det.secBases.length ? '<p class="aleg dim">参与肌群：' + det.secBases.map(musLink).join(" / ") + "</p>" : "");
           }
       }
       if (!panelHtml) {
         panelHtml = P.panel(ex.parts || ["全身"]);
       }
       var raw = P.framesRaw ? P.framesRaw(key) : "";
       var frameBlock = P.frames(key);
       /* 两帧擦拭对比为**实验特性**（?wipe=1）：同内容两个 viewBox 各取一帧、上层 clip-path 控制；
          对近对称姿势（如正面站姿）目视易读成"叠加错位"，故默认不启用，保留并排双帧。 */
       if (raw && location.search.indexOf("wipe=1") > -1) {
         /* 两帧擦拭对比：同一内容用两个 viewBox 各取一帧，上层用 clip-path 由滑块控制 */
         frameBlock = '<div class="wipe"><div class="wst">'
           + '<svg viewBox="25 0 150 180" role="img" aria-label="起始帧">' + raw + "</svg>"
           + '<svg class="wt" viewBox="225 0 150 180" role="img" aria-label="完成帧">' + raw + "</svg>"
           + '</div>'
           + '<div class="cap"><span>起始</span><span class="hint">拖动对比 →</span><span>完成</span></div>'
           + '<input type="range" min="0" max="100" value="50" id="plcWipe" aria-label="两帧对比（拖动查看起始与完成）" title="拖动对比起始 / 完成">'
           + "</div>";
       }
       html = '<div class="plc"><div class="blk">' + frameBlock + "</div>"
         + '<div class="blk">' + panelHtml + "</div></div>";
       if (key === "pulldown" || key === "seatrow" || key === "triceps" || key === "machinelegs" || key === "legcurl") {
         html += '<p class="hint" style="margin:-4px 0 14px;color:var(--mut)">器械为简化示意。</p>';
       }
       return html;
     }
     return '<div class="art big">' + (window.IG_ART ? IG_ART.of(ex) : "") + "</div>";
    })()
    + '<div class="cards2">'
    + '<div class="card"><h3 style="margin-bottom:10px">动作要点</h3><div class="mbox"><ul>'
    + (ex.tips || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("")
    + '</ul></div></div>'
    + '<div class="card"><h3 style="margin-bottom:10px">常见错误</h3><div class="mbox err"><ul>'
    + (ex.errs || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("")
    + '</ul></div></div></div>'
    + '<div class="dose"><b>建议组次：</b>' + esc(ex.dose) + "</div>"
    /* v15/v16：把组次与幅度建议挂到证据页（来源 + 等级） */
    + evidenceLinksHTML(ex)
    + videoLinksHTML(ex)
    + cautionHTML(ex)
    + regressionHTML(ex)
    + '<div class="altrow"><span class="hint">替代动作：</span>' + altHtml + "</div>"
    + refHtml
    + relHtml
    + '<div class="dnav">'
    + '<a class="btn sm" href="detail.html?id=' + esc(prev.id) + '">← ' + esc(prev.name) + "</a>"
    + '<a class="btn sm" href="detail.html?id=' + esc(next.id) + '">' + esc(next.name) + " →</a></div>";
  host.addEventListener("click", function (e) {
    if (e.target.closest("[data-detailact]")) { e.preventDefault(); window.print(); }
    if (e.target.closest("#plcExport")) { e.preventDefault(); exportPlacardSVG(ex); }
  });
  /* 两帧擦拭对比滑块：拖动改上层的 clip-path */
  host.addEventListener("input", function (e) {
    if (e.target && e.target.id === "plcWipe") {
      var t = host.querySelector(".wipe .wt");
      if (t) t.style.clipPath = "inset(0 0 0 " + e.target.value + "%)";
    }
  });
}

/* ---------- 启动分发 ---------- */
/* ---------- 结构化数据（P2）：运行时注入 JSON-LD，随数据自动更新、零重复维护 ---------- */
function injectLdJsonLd(pg) {
  var data = null;
  if (pg === "home") {
    data = { "@context": "https://schema.org", "@type": "WebSite", "name": "铁引力 IRON GRAVITY",
      "description": "中文循证健身指南：动作库、训练计划、饮食营养、创作者精选视频与训练日志。",
      "inLanguage": "zh-CN" };
  } else if (pg === "glossary") {
    var G = window.FIT_GLOSSARY || {};
    if (!(G.faqs || []).length) return;
    data = { "@context": "https://schema.org", "@type": "FAQPage",
      "mainEntity": (G.faqs || []).map(function (f) {
        var q = f.q || f.title || "", a = f.a || f.body || (f.items || []).join(" ") || "";
        return { "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": a } };
      }) };
  }
  if (!data) return;
  var s = document.createElement("script");
  s.type = "application/ld+json";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}

/* v13：按页面类型挂上滚动揭示与聚光（只加类，不改内容） */
function revealPage(pg) {
  staggerIn(document, ".sec > .head");
  if (pg === "home") {
    $$(".mods .mod").forEach(function (m) { m.classList.add("spot"); });
    staggerIn(document, ".mods .mod");
    staggerIn(document, ".steps .step");
  } else if (pg === "muscles") {
    $$(".mgcard").forEach(function (m) { m.classList.add("spot"); });
    staggerIn(document, ".mgcard");
  } else if (pg === "plans") {
    $$(".picker, .plan-meta").forEach(function (m) { m.classList.add("spot"); });
  } else if (pg === "log") {
    $$(".card").forEach(function (m) { m.classList.add("spot"); });
  } else if (pg === "detail") {
    $$(".mbox").forEach(function (m) { m.classList.add("spot"); });
  }
  scanReveal(document);
}

document.addEventListener("DOMContentLoaded", function () {
  document.documentElement.classList.add("motion-ready");
  var yr = $("#yr"); if (yr) yr.textContent = new Date().getFullYear();
  navOn();
  installThemeToggle();
  installBackTop();
  installScrollProgress();
  installSpotlight();
  var pg = document.body.getAttribute("data-page");
  injectLdJsonLd(pg);
  if (pg === "home" && $("#todayEx")) initHome();
  if (pg === "exercises" && $("#exGrid")) initExercises();
  if (pg === "plans" && $("#planBody")) initPlans();
  if (pg === "nutrition" && $("#calcRes")) initNutrition();
  if (pg === "videos" && $("#vGrid")) initVideos();
  if (pg === "log" && $("#lgItems")) initLog();
  if (pg === "glossary" && $("#glTerms")) initGlossary();
  if (pg === "evidence" && $("#evClaims")) initEvidence();
  if (pg === "detail" && $("#dBody")) initDetail();
  revealPage(pg);
  ensureLsNotice();
  /* v15：注册 Service Worker，让「安装到桌面」真的能离线打开。
     file:// 下浏览器不允许注册 SW（会抛异常），所以按协议判断后跳过。 */
  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* 静默失败，不影响站点 */ });
    });
  }
});
/* 从往返缓存回来时重新观察视口内的元素 */
window.addEventListener("pageshow", function (e) { if (e.persisted) scanReveal(document); });
/* 供冒烟测试/外部脚本调用（详情页导出说明牌 SVG） */
window.exportPlacardSVG = exportPlacardSVG;
window.IG_RELATED = relatedExercises;
})();
