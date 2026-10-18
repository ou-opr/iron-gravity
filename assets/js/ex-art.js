/* ex-art.js v6 —— 动作图示：活力剪影 + 目标肌群高亮（自绘 SVG，零依赖、离线可用）
   风格对齐健身房器械说明配图：胶囊体块拼成小人，目标肌群用主题荧光色「上色」，
   杠铃/器械用同色点缀。无外链图源；未命中/未加载时调用方优雅回退（不渲染图，仅文字）。 */
(function () {
  var B = "currentColor";   /* 体块颜色——继承 CSS color（随主题切换）*/
  var A = "var(--acc)";     /* 高亮 & 器械 */
  function S(d, w, c) { return '<path d="' + d + '" stroke="' + (c || B) + '" stroke-width="' + (w || 9) + '" stroke-linecap="round" stroke-linejoin="round" fill="none"/>'; }
  function H(d, w) { return S(d, w, A); }
  function Hd(x, y, r, c) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 7) + '" fill="' + (c || B) + '"/>'; }
  function Floor(y) { return S("M14 " + y + "H82", 3, B); }
  function Bar(y, x1, x2) {
    x1 = x1 === undefined ? 16 : x1; x2 = x2 === undefined ? 80 : x2;
    return S("M" + x1 + " " + y + "H" + x2, 4.5, A) + Hd(x1 + 6, y, 5, A) + Hd(x2 - 6, y, 5, A);
  }
  var P = {
    stand: Hd(48, 12) + S("M48 22v26") + S("M42 28l-11 12") + S("M54 28l11 12") + S("M48 48l-9 30M48 48l9 30") + Floor(88),
    squat: Hd(48, 12) + S("M48 22v22") + S("M48 44l-17 8M48 44l17 8", 10) + S("M31 52l-3 26M65 52l3 26", 9) + H("M48 44l-17 8M48 44l17 8", 10) + S("M26 79h10M60 79h10", 7) + Floor(88),
    lunge: Hd(46, 12) + S("M46 22v24") + S("M40 27l-9 14M52 27l9 14", 7.5) + H("M46 46l-12 19", 10) + S("M34 65v15", 9) + S("M46 46l14 12l16 3", 9) + Floor(88),
    hinge: Hd(62, 20) + S("M60 28L47 48", 12) + S("M47 48l-3 16M47 48l6 14", 9) + S("M44 64l-1 16M53 62l3 18", 9) + S("M56 34l-5 15", 7.5) + Bar(58, 26, 70) + H("M47 48l-4 16", 9),
    bench: S("M16 60h64", 6) + Hd(22, 52, 6.5) + S("M30 52h28", 12) + S("M30 52l-4 22M58 52l12 8l6 14", 9) + S("M34 52l-3 -24M56 52l3 -24", 7.5) + Bar(26, 12, 84) + H("M38 52h16", 12),
    pushup: Floor(88) + Hd(74, 64, 6.5) + H("M52 74l12 -2", 11) + S("M64 72l-38 12", 10) + S("M66 70l4 16", 7.5) + S("M30 83l-6 3", 8),
    press: Bar(10, 18, 78) + Hd(48, 22) + S("M48 30v20", 12) + S("M43 26l-5 -14M53 26l5 -14", 7.5) + H("M41 25h14", 11) + H("M43 26l-5 -14M53 26l5 -14", 6.5) + S("M48 50l-9 30M48 50l9 30") + Floor(88),
    pull: S("M16 8h64", 4.5, A) + S("M40 8l7 15M56 8l-7 15", 7.5) + Hd(48, 31) + S("M48 39v19", 12) + H("M42 41l0 12M54 41l0 12", 7.5) + S("M48 58l-7 10M48 58l7 8", 9) + Floor(88),
    core: Floor(84) + Hd(22, 68, 6.5) + S("M30 68h28", 12) + S("M44 66v-16M51 66l3 -14", 7.5) + S("M58 68l8 -12M58 68l13 -7", 9) + H("M36 68h13", 12),
    bridge: Floor(88) + Hd(20, 72, 6.5) + S("M28 72l24 -8", 12) + S("M28 72l-4 12", 7.5) + S("M52 64l12 10M64 74l9 12", 9) + H("M47 63l8 -4", 12),
    curl: Hd(48, 12) + S("M48 22v27", 12) + S("M53 27l8 7", 8) + S("M61 34l-3 -15", 7.5) + S("M43 27l-9 14", 7.5) + S("M48 49l-9 30M48 49l9 30") + H("M54 28l6 5", 10) + Floor(88),
    triceps: Hd(48, 12) + S("M48 22v27", 12) + S("M53 27l7 8", 8) + S("M60 35l2 12", 7.5) + S("M43 27l-9 14", 7.5) + S("M48 49l-9 30M48 49l9 30") + H("M54 28l6 6", 10) + Floor(88),
    calf: Hd(48, 12) + S("M48 22v26", 12) + S("M42 28l-11 12M54 28l11 12", 7.5) + S("M48 48l-8 28M48 48l8 28", 9) + S("M40 76l-2 6M56 76l2 6", 7) + S("M30 84h36", 5) + H("M40 62l-1 15M56 62l1 15", 8),
    machinelegs: S("M22 30v32M20 62h32", 6) + Hd(48, 22) + S("M48 30v28", 12) + S("M48 34l-10 10", 7.5) + S("M52 58l20 -12", 9) + H("M52 58l20 -12", 9) + Hd(75, 44, 5, A) + Floor(88),
    flye: Hd(48, 12) + S("M48 22v26", 12) + S("M44 27l-18 14M52 27l18 14", 7.5) + S("M14 8l12 33M82 8l-12 33", 4, A) + S("M48 48l-9 30M48 48l9 30") + H("M42 28h12", 10) + Floor(88),
    seatrow: S("M20 66h36", 6) + Hd(60, 34) + S("M46 60l10 -17", 11) + S("M46 60l-7 13M46 60l-2 16", 9) + S("M10 30L36 52", 3.5, A) + Hd(36, 52, 3.5, A) + S("M56 42l-18 10", 7.5) + H("M53 44l-6 9", 9),
    legcurl: S("M16 58h54", 6) + Hd(20, 50, 6.5) + S("M28 50h32", 11) + S("M32 50l-4 16", 7.5) + S("M60 50l10 5", 9) + S("M70 55l-3 -14", 8) + H("M46 50l14 4", 10),
    dip: S("M22 88V46M70 88V46", 4.5, A) + S("M22 46h14M56 46h14", 4.5, A) + Hd(48, 30) + S("M48 38v22", 11) + H("M42 40h12", 10) + S("M48 60l-8 11M48 60l6 10", 8),
    thrust: Floor(88) + Hd(20, 72, 6.5) + S("M28 72l24 -8", 12) + S("M28 72l-4 12", 7.5) + S("M52 62l12 10M64 74l9 12", 9) + H("M47 63l8 -4", 12) + S("M40 58h30", 4.5, A) + Hd(40, 58, 4, A) + Hd(70, 58, 4, A),
    reardelt: Hd(58, 24) + S("M56 30L46 50", 12) + S("M46 50l-2 14M46 50l5 13", 9) + S("M48 32l16 -8M48 32l-16 -8", 7.5) + H("M50 31l6 -2M46 31l-6 -2", 9) + Floor(88)
  };
  var RULES = [
    [/leg.?curl|hamstring/, "legcurl"],
    [/leg.?ext|leg.?extension|quads?/, "machinelegs"],
    [/pull.?up|pullup|chin|lat|pulldown|band|pull.?apart|pull.?over|face.?pull/, "pull"],
    [/plank|dead.?bug|crunch|situp|hollow|bird.?dog|roll.?out|ab.?wheel|hanging|leg.?raise|(^|-)abs?(-|$)/, "core"],
    [/calf/, "calf"],
    [/thrust/, "thrust"],
    [/bridge|glute|hip.?extension|kick.?back|kickback/, "bridge"],
    [/rear.?delt|reverse.?fly|rear.?fly|lateral.?raise|side.?raise/, "reardelt"],
    [/seated.*row|cable.?row/, "seatrow"],
    [/flye|fly|pec|crossover|cable.?cross/, "flye"],
    [/squat|leg.?press|hack|goblet|wall.?sit|sumo|smith/, "squat"],
    [/lunge|step.?up|bulgarian|split.?squat/, "lunge"],
    [/deadlift|rdl|romanian|hinge|good.?morning|swing|snatch|clean|row/, "hinge"],
    [/dip/, "dip"],
    [/push.?up|pushup|push.?press/, "pushup"],
    [/overhead|ohp|shoulder|military|arnold|push.?press/, "press"],
    [/bench|incline|decline|press/, "bench"],
    [/shrug/, "press"],
    [/curl|flexion/, "curl"],
    [/carry|loaded.?walk/, "stand"],
    [/triceps|extension|pushdown|skull|kick/, "triceps"],
    [/hip|rear|high/, "stand"]
  ];
  function pick(ex) {
    var k = [ex.id || "", ex.en || "", (ex.parts || []).join("/"), ex.equip || ""].join(" ").toLowerCase();
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(k)) return P[RULES[i][1]] || P.stand;
    return P.stand;
  }
  window.IG_ART = {
    of: function (e) {
      if (!e) return "";
      return '<svg viewBox="0 0 96 96" role="img" aria-label="动作示意（目标肌群用荧光色高亮）">' + pick(e) + "</svg>";
    },
    patternOf: function (e) {
      var k = [e.id || "", e.en || "", (e.parts || []).join("/"), e.equip || ""].join(" ").toLowerCase();
      for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(k)) return RULES[i][1];
      return "stand";
    }
  };
})();
