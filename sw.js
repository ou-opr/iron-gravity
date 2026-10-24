/* sw.js —— Service Worker（v15）：让「安装到桌面」真的能离线打开。
 *
 * 策略：
 *   · 页面（导航请求）：network-first —— 联网时永远拿最新 HTML，断网回退缓存
 *   · 其他同源静态资源：stale-while-revalidate —— 先给缓存（快），后台悄悄更新
 *   · 只处理同源 GET；不缓存任何跨域请求（视频 iframe 等一律直连）
 *
 * 更新：改动站点后把 VERSION 加一，旧缓存会在 activate 阶段被清掉。
 * 本地 file:// 打开时浏览器不允许注册 SW，app.js 里已按协议判断跳过。
 */
const VERSION = "v1.1.0";
const CACHE = "iron-gravity-" + VERSION;
const SHELL = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./assets/img/favicon.svg",
  "./assets/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* 页面导航：网络优先 */
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
    );
    return;
  }

  /* 静态资源：缓存优先 + 后台更新 */
  e.respondWith(
    caches.match(req).then((hit) => {
      const fetching = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || fetching;
    })
  );
});
