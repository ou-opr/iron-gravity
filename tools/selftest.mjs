#!/usr/bin/env node
/* 铁引力 · 本地服务器自测：拉起 serve.mjs 并逐页 HTTP 请求
   用法：node tools/selftest.mjs */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 8645;
const srv = spawn(process.execPath, [path.join(root, 'tools/serve.mjs'), String(PORT)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
srv.stdout.on('data', (d) => process.stdout.write('[srv] ' + d));
srv.stderr.on('data', (d) => process.stdout.write('[srv-err] ' + d));

await new Promise((r) => setTimeout(r, 1500));

const targets = ['index.html', 'exercises.html', 'muscles.html', 'plans.html', 'nutrition.html', 'videos.html', 'log.html', 'glossary.html', 'detail.html', 'evidence.html', 'assets/js/app.js', 'assets/css/style.css', 'assets/img/favicon.svg', 'assets/manifest.json', 'assets/img/icon-192.png', 'assets/img/icon-512.png', 'sw.js'];
let bad = 0;
for (const p of targets) {
  try {
    const res = await fetch('http://127.0.0.1:' + PORT + '/' + p, { signal: AbortSignal.timeout(8000) });
    console.log(p + ' -> ' + res.status);
    if (res.status !== 200) bad++;
    await res.body?.cancel();
  } catch (e) {
    console.log(p + ' -> ERR ' + e.message);
    bad++;
  }
}
srv.kill();
console.log(bad ? '自测失败 ' + bad + ' 项' : '本地服务器自测全部通过 ✓');
process.exit(bad ? 1 : 0);
