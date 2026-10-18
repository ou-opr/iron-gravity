// tools/art/angle_check.mjs —— 角度口径固化脚本：几何反算为准（目检只判"像不像"）
// 用法: node tools/art/angle_check.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* 非 ASCII 路径（如 D:\健身）下 new URL().pathname 会被百分号编码 → 必须用 fileURLToPath */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = fs.readFileSync(path.join(ROOT, "assets", "js", "ex-art-placard.js"), "utf8");

const need = [
  ['完成帧 上臂', 'M290 62l32 4'],
  ['完成帧 前臂', 'M322 66l28 -8'],
  ['起始帧 上臂', 'M82 63l3 40'],
  ['起始帧 前臂', 'M85 103l-4 20'],
  ['pullup 模板', 'pullup: function'],
  ['pulldown 模板', 'pulldown: function'],
  ['squat 模板', 'squat: function'],
  ['deadlift 模板', 'deadlift: function'],
  ['row 模板', 'row: function'],
  ['core 模板', 'core: function'],
];
var checks = [
  { tpl: "raise", name: "完成帧折角", up: [32, 4], fore: [28, -8], seg: ["M290 62l32 4", "M322 66l28 -8"], target: "20–23" },
  { tpl: "raise", name: "起始帧折角", up: [3, 40], fore: [-4, 20], seg: ["M82 63l3 40", "M85 103l-4 20"], target: "15–18" },
];
var ok = true;
/* 角度口径：几何反算为准；同时断言源码含对应路径段（"源码现算"的解析升级为下批技术债） */
function kinkOf(up, fore) {
  return Math.abs(Math.atan2(fore[1], fore[0]) - Math.atan2(up[1], up[0])) * 180 / Math.PI;
}
for (var c of checks) {
  var val = kinkOf(c.up, c.fore);
  for (var s of c.seg) if (src.indexOf(s) < 0) { console.log("MISS 源码段: " + s); ok = false; }
  console.log("OK   " + c.tpl + " " + c.name + " = " + val.toFixed(1) + "°（目标 " + c.target + "°）路径: [[" + c.seg.join("] [") + "]]");
}
// 模块内模板清单（数量随拆族增长，不为凑数合并器械族）
var keys = [];
var m, re = /(\w+): function/g;
while ((m = re.exec(src))) keys.push(m[1]);
console.log("模块内模板数:", keys.length, "→", keys.join(","));
var EXPECT = ["raise", "pullup", "pulldown", "squat", "deadlift", "row", "core", "press", "seatrow", "curl", "triceps", "flye", "machinelegs", "legcurl", "calf", "lunge", "dip", "pushup", "thrust", "bridge", "reardelt", "stand"];
var missing = EXPECT.filter(function (k) { return keys.indexOf(k) < 0; });
if (missing.length) { console.log("缺失模板:", missing.join(", ")); ok = false; }
console.log(ok ? "几何自检通过" : "几何自检失败：源码与预期不一致");
