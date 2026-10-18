/* ex-art-placard.js —— 说明牌风格图层（v8）：① 解剖面板（8 部位参数化）② 动作帧（黑白双帧，同族共用底图）
   风格锚：健身房器械说明牌（黑块 + 白线稿 + 红色部位高亮）。零外链、离线原生、可整体关闭。
   C 档（绳索/大型器械）器械为简化示意，页面需如实标注。文字一律不进图（由前端按数据排版）。 */
(function () {
  var W = "var(--ink, #eef1f4)", RED = "rgba(217,58,43,.62)";
  /* —— 部位 → 三视图高亮区域（可选，缺省则用大区域）—— */
  var HL = {
    "胸":  { front:"M-11 -4q11 -6 22 0q-2 13 -11 16q-9 -3 -11 -16z M-16 -4l-7 12l8 2l5 -11z M16 -4l7 12l-8 2l-5 -11z", back:"M-14 -6q6 -3 12 0q-2 12 -6 15q-4 -3 -6 -15z M14 -6q-6 -3 -12 0q2 12 6 15q4 -3 6 -15z", side:"M-2 -6q9 -4 13 2q-1 11 -7 14q-6 -6 -6 -16z" },
    "背":  { front:"", back:"M-13 -6q13 -6 26 0q-1 16 -8 24l-5 4l-5 -4q-7 -8 -8 -24z M-16 -8l-7 10l7 3l6 -9z M16 -8l7 10l-7 3l-6 -9z", side:"M2 -8q8 -2 10 6q-1 14 -6 20q-5 -6 -6 -14z" },
    "肩":  { front:"M-17 -6l-7 13l9 3l6 -12z M17 -6l7 13l-9 3l-6 -12z", back:"M-17 -6l-7 13l9 3l6 -12z M17 -6l7 13l-9 3l-6 -12z", side:"M-4 -8q10 -3 14 4q-2 10 -8 12q-6 -6 -6 -16z" },
    "腿":  { front:"M-9 2l7 -2l1 26l-7 1z M9 2l-7 -2l-1 26l7 1z M-8 30l6 0l-1 22l-6 0z M8 30l-6 0l1 22l6 0z", back:"M-9 2l7 -2l1 26l-7 1z M9 2l-7 -2l-1 26l7 1z M-8 30l6 0l-1 22l-6 0z M8 30l-6 0l1 22l6 0z", side:"M-3 22q7 -2 8 3l-2 15l-6 1z M-4 42l6 0l1 20l-6 0z" },
    "臀":  { front:"", back:"M-13 10q13 -4 26 0q-1 12 -13 12q-12 0 -13 -12z M-12 20l12 -3l12 3l-2 7l-10 -3l-10 3z", side:"M-3 8q8 -2 11 3q-1 10 -6 13q-5 -5 -5 -16z" },
    "手臂":{ front:"M-18 -4l8 10l7 -3l-8 -11z M18 -4l-8 10l-7 -3l8 -11z", back:"M-18 -4l8 10l7 -3l-8 -11z M18 -4l-8 10l-7 -3l8 -11z", side:"M-2 -4q8 -2 9 4l-4 14l-7 -4z" },
    "核心":{ front:"M-9 2h18q0 18 -9 20q-9 -2 -9 -20z", back:"M-9 2h18q0 16 -9 18q-9 -2 -9 -18z", side:"M-3 0q9 0 9 6l-3 16l-6 -2z" },
    "全身":{ front:"M-14 -6q14 -6 28 0q-1 20 -9 26l-5 3l-5 -3q-8 -6 -9 -26z", back:"M-14 -6q14 -6 28 0q-1 20 -9 26l-5 3l-5 -3q-8 -6 -9 -26z", side:"M-2 -8q10 -4 13 4q-1 18 -7 24q-6 -6 -6 -28z" }
  };
  function bodyPath(cx, kind) {
    if (kind === "front") return "M" + cx + " 34v40 M" + (cx - 15) + " 45h30 M" + (cx - 15) + " 45l-8 40 M" + (cx + 15) + " 45l8 40 M" + cx + " 74l-8 40 M" + cx + " 74l8 40 M" + (cx - 8) + " 115h-6 M" + (cx + 8) + " 115h6";
    if (kind === "back") return "M" + cx + " 34v40 M" + (cx - 15) + " 45h30 M" + (cx - 15) + " 45l-8 40 M" + (cx + 15) + " 45l8 40 M" + cx + " 74l-8 40 M" + cx + " 74l8 40 M" + (cx - 8) + " 115h-6 M" + (cx + 8) + " 115h6 M" + (cx - 10) + " 52l4 30 M" + (cx + 10) + " 52l-4 30";
    return "M" + (cx + 2) + " 34q4 22 0 40 M" + (cx - 2) + " 44l10 34 M" + cx + " 74l-6 40 M" + cx + " 74l8 40 M" + (cx - 6) + " 114h-6 M" + (cx + 8) + " 114h6";
  }
  function view(cx, kind, parts) {
    var marks = parts.map(function (p) {
      var h = HL[p] || HL["全身"];
      var d = kind === "front" ? h.front : kind === "back" ? h.back : h.side;
      return d ? '<path d="' + d + '"/>' : "";
    }).join("");
    return '<g fill="none" stroke="' + W + '" stroke-width="1.9" stroke-linecap="round">'
      + '<circle cx="' + cx + '" cy="26" r="8"/><path d="' + bodyPath(cx, kind) + '"/></g>'
      + '<g fill="' + RED + '" transform="translate(' + cx + ',' + (kind === "side" ? 50 : 58) + ')">' + marks + "</g>";
  }
  /* 解剖面板：多部位 → 多区域高亮 */
  function panel(parts) {
    parts = (parts && parts.length ? parts : ["全身"]).slice(0, 3);
    return '<svg viewBox="0 0 400 150" role="img" aria-label="目标部位：' + parts.join("/") + '">'
      + view(66, "back", parts) + view(200, "front", parts) + view(330, "side", parts) + "</svg>";
  }

  /* —— 动作帧（黑白双帧；肘/膝可见弯曲 10–20°）—— */
  function frame(pose) {
    var g = '<g fill="none" stroke="' + W + '" stroke-width="2.2" stroke-linecap="round">';
    return g + pose + "</g>";
  }
  var DB = function (x, y) {   /* 哑铃：双圆头 + 短握把，随手持位置 */
    return '<g fill="none" stroke="' + W + '" stroke-width="2.2" stroke-linecap="round">'
      + '<path d="M' + (x - 7) + ' ' + y + 'h14"/><circle cx="' + (x - 9) + '" cy="' + y + '" r="5"/>'
      + '<circle cx="' + (x + 9) + '" cy="' + y + '" r="5"/></g>';
  };
  /* ===== v10 精细线稿共享件（自检自评循环引入）=====
     ① head 椭圆头+下颌线 ② limb 双线肢体（垂直偏移，显体量）③ pad 圆角垫 ④ plates/stack 配重
     ⑤ pulley 滑轮 ⑥ cable 细缆绳 ⑦ plate2 杠铃片 */
  function head(x, y, r) {
    r = r || 7.4;
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r * 0.85).toFixed(1) + '" ry="' + r + '" stroke-width="2.3"/>'
      + '<path d="M' + (x + r * 0.52).toFixed(1) + ' ' + (y + 1.2) + 'h' + (-r * 1.15).toFixed(1) + '" stroke-width="1.05"/>';
  }
  function limb(pts, o, w) {
    o = o || 1.55; w = w || 1.25;
    return '<path d="' + offPath(pts, o) + '" stroke-width="' + w + '"/>'
      + '<path d="' + offPath(pts, -o) + '" stroke-width="' + w + '"/>';
  }
  function offPath(pts, o) {
    var d = "M";
    for (var i = 0; i < pts.length; i++) {
      var dx, dy;
      if (i === 0) { dx = pts[1][0] - pts[0][0]; dy = pts[1][1] - pts[0][1]; }
      else if (i === pts.length - 1) { dx = pts[i][0] - pts[i - 1][0]; dy = pts[i][1] - pts[i - 1][1]; }
      else { dx = pts[i + 1][0] - pts[i - 1][0]; dy = pts[i + 1][1] - pts[i - 1][1]; }
      var L = Math.sqrt(dx * dx + dy * dy) || 1;
      d += (i ? "L" : "") + (pts[i][0] + (-dy / L) * o).toFixed(1) + " " + (pts[i][1] + (dx / L) * o).toFixed(1);
    }
    return d;
  }
  function pad(x, y, w, h, r) {   /* 圆角垫（靠背/坐垫/腿垫） */
    r = Math.min(r || 5, h / 2, w / 2);
    return '<path d="M' + (x + r) + ' ' + y + 'h' + (w - 2 * r) + 'q' + r + ' 0 ' + r + ' ' + r
      + 'v' + (h - 2 * r) + 'q0 ' + r + ' ' + (-r) + ' ' + r + 'h' + (-(w - 2 * r))
      + 'q' + (-r) + ' 0 ' + (-r) + ' ' + (-r) + 'v' + (-(h - 2 * r)) + 'q0 ' + (-r) + ' ' + r + ' ' + (-r) + 'z"/>';
  }
  function stack(x, y, n) {   /* 配重片组 */
    var d = "", k = n || 5;
    for (var i = 0; i < k; i++) { d += '<path d="M' + (x - 11) + ' ' + (y + i * 6) + 'h22" stroke-width="2.8"/>'; }
    return d + '<path d="M' + (x - 4) + ' ' + (y - 6) + 'v' + (k * 6 + 8) + '" stroke-width="1.6"/>';
  }
  function pulley(x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="4.4" stroke-width="1.9"/>'
      + '<path d="M' + x + ' ' + (y - 4.4) + 'v8.8" stroke-width="1.1"/>';
  }
  function cable(d) { return '<path d="' + d + '" stroke-width="1.1"/>'; }
  function plate2(x, y, r) {   /* 杠铃片：双圈（外盘+内环）便于小尺寸辨认 */
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" stroke-width="2.2"/>'
      + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.45).toFixed(1) + '" stroke-width="1.1"/>';
  }
  function foot(x, y, dir) {   /* 脚（小腿末端小折线） */
    return '<path d="M' + x + ' ' + y + 'l' + (7 * (dir || 1)) + ' 3l' + (6 * (dir || 1)) + ' -1" stroke-width="1.9"/>';
  }
  /* 关节参考弧（v11.2）：在 B 点、从 BA 方向到 BC 方向画虚线弧 —— 纯几何符号，不含任何文字，
     用于一眼看出"肘/膝该屈多少"；r 默认 11px */
  function arc(A, B, C, r) {
    var r0 = r || 11;
    var aBA = Math.atan2(A[1] - B[1], A[0] - B[0]) * 180 / Math.PI;
    var aBC = Math.atan2(C[1] - B[1], C[0] - B[0]) * 180 / Math.PI;
    var p0 = [B[0] + r0 * Math.cos(aBA * Math.PI / 180), B[1] + r0 * Math.sin(aBA * Math.PI / 180)];
    var p1 = [B[0] + r0 * Math.cos(aBC * Math.PI / 180), B[1] + r0 * Math.sin(aBC * Math.PI / 180)];
    var d = aBC - aBA;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return '<circle cx="' + B[0] + '" cy="' + B[1] + '" r="1.6"/>'
      + '<path d="M' + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + "A" + r0 + " " + r0 + " 0 0 "
      + (d > 0 ? 1 : 0) + " " + p1[0].toFixed(1) + " " + p1[1].toFixed(1)
      + '" stroke-width="1.2" stroke-dasharray="2.5 2.5" opacity=".85"/>';
  }
  var FR = {
    raise: function () {
      /* 几何字面量（M82 63l3 40 / M85 103l-4 20 / M290 62l32 4 / M322 66l28 -8）由 angle_check 断言，数值勿改 */
      var start = head(96, 46) + limb([[96, 54], [96, 74], [96, 98]], 5.0)
        + limb([[96, 98], [87, 124], [85, 146]], 2.0) + limb([[96, 98], [105, 124], [107, 146]], 2.0)
        + foot(85, 146, 1) + foot(107, 146, 1)
        + '<path d="M82 63l3 40" stroke-width="2.8"/><path d="M83 63l3 40" stroke-width="1.1"/>'
        + '<path d="M85 103l-4 20" stroke-width="2.8"/><path d="M86.4 103l-4 20" stroke-width="1.1"/>'
        + '<path d="M110 63l-3 40" stroke-width="2.8"/><path d="M111 63l-3 40" stroke-width="1.1"/>'
        + '<path d="M107 103l4 20" stroke-width="2.8"/><path d="M108.4 103l4 20" stroke-width="1.1"/>'
        + DB(79, 128) + DB(113, 128);
      var done = head(304, 46) + limb([[304, 54], [304, 74], [304, 98]], 5.0)
        + limb([[304, 98], [295, 124], [293, 146]], 2.0) + limb([[304, 98], [313, 124], [315, 146]], 2.0)
        + foot(293, 146, 1) + foot(315, 146, 1)
        + '<path d="M290 62l32 4" stroke-width="2.8"/>'
        + '<path d="M322 66l28 -8" stroke-width="2.8"/>'
        + '<path d="M318 62l-32 4" stroke-width="2.8"/>'
        + '<path d="M286 66l-28 -8" stroke-width="2.8"/>'
        + arc([290, 62], [322, 66], [350, 58], 11)
        + arc([318, 62], [286, 66], [258, 58], 11)
        + DB(350, 58) + DB(258, 58);
      return frame(start + done + '<path d="M40 162h120M250 162h120" stroke-width="1.6"/>');
    },
    /* —— pull-up：引体向上（悬垂 → 下巴过杆；A 档严格）v10 精细：宽握杠+躯干体量+腿部自然下垂 —— */
    pullup: function () {
      var rig = function (cx) {
        return '<path d="M' + (cx - 58) + ' 22h116" stroke-width="3.6"/>'
          + '<path d="M' + (cx - 46) + ' 22v7M' + (cx + 46) + ' 22v7" stroke-width="1.6"/>';
      };
      var hang = head(102, 62) + limb([[102, 70], [100, 88], [98, 104]], 4.2)
        + limb([[92, 76], [80, 58], [72, 38]], 1.5) + limb([[112, 76], [124, 58], [132, 38]], 1.5)
        + limb([[98, 104], [92, 126], [96, 146]], 1.5) + limb([[106, 104], [114, 124], [120, 144]], 1.5)
        + foot(96, 146, -1) + foot(120, 144, 1)
        + '<path d="M74 34h-8M138 34h8" stroke-width="2"/>';
      var up = head(304, 30) + limb([[304, 38], [302, 58], [300, 76]], 4.2)
        + limb([[294, 44], [280, 34], [270, 22]], 1.5) + limb([[314, 44], [328, 34], [338, 22]], 1.5)
        + limb([[300, 76], [292, 100], [296, 122]], 1.5) + limb([[308, 76], [318, 98], [324, 118]], 1.5)
        + foot(296, 122, -1) + foot(324, 118, 1);
      return frame(rig(102) + rig(304) + hang + up + '<path d="M52 156h104M254 156h104" stroke-width="1.6"/>');
    },
    /* —— pulldown：高位下拉（坐姿；v10 精细：坐垫/靠背/压腿垫/配重片组/滑轮缆绳）—— */
    pulldown: function () {
      var rig = function (cx, barY) {
        return stack(cx + 64, 74, 5)
          + pulley(cx, 26) + cable('M' + cx + ' 30v' + (barY - 32))
          + '<path d="M' + (cx - 52) + ' ' + barY + 'h104" stroke-width="3.2"/>'
          + '<path d="M' + (cx - 58) + ' ' + (barY - 10) + 'v-28M' + (cx + 58) + ' ' + (barY - 10) + 'v-28" stroke-width="1.4"/>'
          + pad(cx - 46, 96, 92, 9, 4)
          + pad(cx - 42, 72, 9, 26, 4)
          + pad(cx - 30, 108, 60, 8, 4)
          + '<path d="M' + (cx - 34) + ' 112h8M' + (cx + 26) + ' 112h8" stroke-width="1.8"/>';
      };
      var reach = head(104, 52) + limb([[104, 60], [102, 80], [100, 96]], 4.4)
        + limb([[94, 66], [84, 50], [76, 30]], 1.5) + limb([[114, 66], [124, 50], [132, 30]], 1.5)
        + limb([[100, 96], [86, 108], [72, 116]], 1.5) + limb([[108, 96], [122, 108], [136, 116]], 1.5)
        + foot(72, 116, -1) + foot(136, 116, 1);
      var drawn = head(312, 62) + limb([[312, 70], [310, 88], [308, 102]], 4.4)
        + limb([[302, 74], [288, 72], [276, 74]], 1.5) + limb([[322, 74], [336, 72], [348, 74]], 1.5)
        + limb([[308, 102], [292, 112], [278, 118]], 1.5) + limb([[316, 102], [330, 112], [344, 118]], 1.5)
        + foot(278, 118, -1) + foot(344, 118, 1);
      return frame(rig(104, 28) + rig(312, 74) + reach + drawn + '<path d="M52 156h104M254 156h104" stroke-width="1.6"/>');
    },
    /* —— squat：杠铃深蹲（v10 精细：宽站姿/肘尖朝下握杠/大腿体量）—— */
    squat: function () {
      var bar = function (y, x0, x1) {
        return '<path d="M' + x0 + ' ' + y + 'h' + (x1 - x0) + '" stroke-width="3.4"/>'
          + plate2(x0 + 7, y, 6.2) + plate2(x1 - 7, y, 6.2);
      };
      var grips = function (cx, by) {
        return limb([[cx - 14, by], [cx - 20, by + 16], [cx - 30, by + 26]], 1.2)
          + limb([[cx + 14, by], [cx + 20, by + 16], [cx + 30, by + 26]], 1.2)
          + '<path d="M' + (cx - 30) + ' ' + (by + 26) + 'l4 -18M' + (cx + 30) + ' ' + (by + 26) + 'l-4 -18" stroke-width="1.1"/>';
      };
      var stand = head(104, 44) + limb([[104, 52], [104, 72], [104, 92]], 5.0) + grips(104, 60)
        + limb([[104, 92], [94, 116], [92, 140]], 2.0) + limb([[104, 92], [114, 116], [116, 140]], 2.0)
        + foot(92, 140, 1) + foot(116, 140, 1);
      var deep = head(312, 52) + limb([[312, 60], [312, 78], [310, 96]], 5.0) + grips(312, 68)
        + limb([[310, 96], [282, 104], [280, 138]], 2.0) + limb([[310, 96], [340, 104], [342, 138]], 2.0)
        + arc([310, 96], [282, 104], [280, 138], 13) + arc([310, 96], [340, 104], [342, 138], 13)
        + foot(280, 138, 1) + foot(342, 138, 1);
      return frame(bar(56, 62, 146) + bar(64, 270, 354) + stand + deep + '<path d="M56 160h104M264 160h104" stroke-width="1.6"/>');
    },
    /* —— deadlift：硬拉（v10 精细：铰链起始 → 站立锁定；杠铃片+躯干体量）—— */
    deadlift: function () {
      var barbell = function (y, cx) {
        return '<path d="M' + (cx - 34) + ' ' + y + 'h68" stroke-width="3.2"/>' + plate2(cx - 38, y, 6.5) + plate2(cx + 38, y, 6.5);
      };
      var setup = head(132, 52) + limb([[128, 60], [112, 78], [108, 92]], 4.6)
        + limb([[124, 64], [112, 82], [104, 100]], 1.4) + limb([[136, 64], [126, 84], [118, 102]], 1.4)
        + arc([124, 64], [112, 82], [104, 100], 9) + arc([136, 64], [126, 84], [118, 102], 9)
        + limb([[108, 92], [100, 116], [104, 140]], 2.0) + limb([[112, 92], [130, 112], [132, 138]], 2.0)
        + arc([108, 92], [100, 116], [104, 140], 11)
        + foot(104, 140, 1) + foot(132, 138, 1);
      var lock = head(320, 44) + limb([[320, 52], [320, 72], [320, 92]], 5.0)
        + limb([[308, 60], [304, 80], [302, 104]], 1.4) + limb([[332, 60], [336, 80], [338, 104]], 1.4)
        + arc([308, 60], [304, 80], [302, 104], 9) + arc([332, 60], [336, 80], [338, 104], 9)
        + limb([[320, 92], [310, 116], [308, 140]], 2.0) + limb([[320, 92], [330, 116], [332, 140]], 2.0)
        + arc([320, 92], [310, 116], [308, 140], 11)
        + foot(308, 140, 1) + foot(332, 140, 1);
      return frame(barbell(118, 104) + barbell(104, 320) + setup + lock + '<path d="M56 152h104M264 152h104" stroke-width="1.6"/>');
    },
    /* —— row：杠铃划船（v10 精细：俯身铰链 + 双线躯干，悬挂 → 拉向腹部）—— */
    row: function () {
      var barbell = function (y, cx) {
        return '<path d="M' + (cx - 34) + ' ' + y + 'h68" stroke-width="3.2"/>' + plate2(cx - 38, y, 6.5) + plate2(cx + 38, y, 6.5);
      };
      var torso = function (cx, hipY) {
        return head(cx + 26, hipY - 40) + limb([[cx + 22, hipY - 32], [cx + 6, hipY - 18], [cx - 4, hipY]], 4.4)
          + limb([[cx - 4, hipY], [cx - 14, hipY + 24], [cx - 20, hipY + 46]], 2.0)
          + limb([[cx - 4, hipY], [cx + 6, hipY + 26], [cx + 8, hipY + 48]], 2.0)
          + foot(cx - 20, hipY + 46, 1) + foot(cx + 8, hipY + 48, 1);
      };
      var hang = torso(96, 92) + limb([[116, 68], [116, 88], [114, 104]], 1.4) + arc([116, 68], [116, 88], [114, 104], 9);
      var pulled = torso(298, 92) + limb([[318, 66], [302, 78], [298, 86]], 1.4) + arc([318, 66], [302, 78], [298, 86], 9);
      return frame(barbell(108, 104) + barbell(90, 300) + hang + pulled + '<path d="M56 152h104M264 152h104" stroke-width="1.6"/>');
    },
    /* —— press：哑铃坐姿推举（v10 精细：圆角靠背坐垫 + 双臂体量；肩侧 → 头顶）—— */
    press: function () {
      var seat = function (cx) {
        return pad(cx - 42, 106, 84, 10, 5) + pad(cx - 48, 74, 10, 36, 5)
          + '<path d="M' + (cx - 46) + ' 116v32M' + (cx + 38) + ' 116v32" stroke-width="2.4"/>'
          + '<path d="M' + (cx - 34) + ' 150h72" stroke-width="2.6"/>';
      };
      var low = head(104, 66) + limb([[104, 74], [104, 88], [104, 104]], 4.6)
        + limb([[94, 80], [88, 92], [86, 100]], 1.5) + limb([[114, 80], [120, 92], [122, 100]], 1.5)
        + DB(84, 102) + DB(124, 102)
        + limb([[104, 104], [94, 126], [90, 146]], 2.0) + limb([[104, 104], [114, 126], [118, 146]], 2.0)
        + foot(90, 146, 1) + foot(118, 146, 1);
      var up = head(312, 66) + limb([[312, 74], [312, 88], [312, 102]], 4.6)
        + limb([[302, 78], [300, 60], [300, 44]], 1.5) + limb([[322, 78], [324, 60], [324, 44]], 1.5)
        + DB(298, 40) + DB(326, 40)
        + limb([[312, 102], [302, 126], [298, 146]], 2.0) + limb([[312, 102], [322, 126], [326, 146]], 2.0)
        + foot(298, 146, 1) + foot(326, 146, 1);
      return frame(seat(104) + seat(312) + low + up + '<path d="M56 160h104M264 160h104" stroke-width="1.6"/>');
    },
    /* —— seatrow：坐姿绳索划船（v10 精细：配重片组/低位滑轮/脚踏；手前伸 → 拉至腹部）—— */
    seatrow: function () {
      var rig = function (cx) {
        return stack(cx + 52, 66, 5) + pulley(cx + 40, 124)
          + cable('M' + (cx + 40) + ' 120h-26')
          + pad(cx - 34, 116, 68, 9, 4) + pad(cx - 40, 128, 80, 7, 3)
          + '<path d="M' + (cx - 30) + ' 116h8M' + (cx + 22) + ' 116h8" stroke-width="1.8"/>';
      };
      var far = head(120, 76) + limb([[120, 84], [118, 100], [116, 114]], 4.4)
        + limb([[108, 90], [96, 84], [86, 84]], 1.4) + limb([[132, 90], [144, 84], [154, 84]], 1.4)
        + limb([[116, 114], [104, 126], [96, 132]], 1.9) + limb([[124, 114], [136, 126], [144, 132]], 1.9)
        + foot(96, 132, -1) + foot(144, 132, 1);
      var near = head(328, 76) + limb([[328, 84], [326, 100], [324, 114]], 4.4)
        + limb([[316, 90], [302, 98], [290, 104]], 1.4) + limb([[340, 90], [354, 98], [366, 104]], 1.4)
        + limb([[324, 114], [312, 126], [304, 132]], 1.9) + limb([[332, 114], [344, 126], [352, 132]], 1.9)
        + foot(304, 132, -1) + foot(352, 132, 1);
      return frame(rig(120) + rig(328) + far + near + '<path d="M56 156h104M264 156h104" stroke-width="1.6"/>');
    },
    /* —— curl：哑铃弯举（v10 精细：上臂严格垂直、前臂 ~35° 外上屈；躯干体量）—— */
    curl: function () {
      var body = function (cx) {
        return head(cx, 46) + limb([[cx, 54], [cx, 74], [cx, 94]], 5.0)
          + limb([[cx, 94], [cx - 10, 118], [cx - 12, 140]], 2.0) + limb([[cx, 94], [cx + 10, 118], [cx + 12, 140]], 2.0)
          + foot(cx - 12, 140, 1) + foot(cx + 12, 140, 1);
      };
      var down = body(104) + limb([[88, 66], [88, 92], [88, 112]], 1.5) + limb([[120, 66], [120, 92], [120, 112]], 1.5)
        + DB(88, 116) + DB(120, 116);
      var curled = body(312) + limb([[296, 66], [296, 92], [288, 68]], 1.5) + limb([[328, 66], [328, 92], [336, 68]], 1.5)
        + arc([296, 66], [296, 92], [288, 68], 9) + arc([328, 66], [328, 92], [336, 68], 9)
        + DB(286, 64) + DB(338, 64);
      return frame(down + curled + '<path d="M56 160h104M264 160h104" stroke-width="1.6"/>');
    },
    /* —— triceps：绳索下压（v10 精细：高滑轮+缆绳+配重片组；屈肘起始 → 伸肘下压）—— */
    triceps: function () {
      var rig = function (cx, hy) {
        return stack(cx + 46, 36, 5) + pulley(cx, 26)
          + cable('M' + cx + ' 30v' + (hy - 34))
          + pulley(cx, hy)
          + cable('M' + (cx - 12) + ' ' + (hy + 4) + 'l-10 6M' + (cx + 12) + ' ' + (hy + 4) + 'l10 6')
          + '<path d="M' + (cx - 30) + ' ' + (hy + 12) + 'h60" stroke-width="2.6"/>';
      };
      var bent = head(104, 52) + limb([[104, 60], [104, 78], [104, 96]], 4.6)
        + limb([[94, 66], [86, 78], [84, 88]], 1.5) + limb([[114, 66], [122, 78], [124, 88]], 1.5)
        + limb([[104, 96], [94, 120], [90, 140]], 2.0) + limb([[104, 96], [114, 120], [118, 140]], 2.0)
        + foot(90, 140, 1) + foot(118, 140, 1);
      var down = head(312, 52) + limb([[312, 60], [312, 78], [312, 96]], 4.6)
        + limb([[302, 66], [296, 84], [294, 104]], 1.5) + limb([[322, 66], [328, 84], [330, 104]], 1.5)
        + limb([[312, 96], [302, 120], [298, 140]], 2.0) + limb([[312, 96], [322, 120], [326, 140]], 2.0)
        + foot(298, 140, 1) + foot(326, 140, 1);
      return frame(rig(104, 92) + rig(312, 112) + bent + down + '<path d="M52 152h104M264 152h104" stroke-width="1.6"/>');
    },
    /* —— flye：仰卧哑铃飞鸟（v10 精细：圆角卧凳 + 躯干体量；双臂上举 → 外展至胸线）—— */
    flye: function () {
      var rig = function (cx) {
        return pad(cx - 64, 98, 128, 12, 5)
          + '<path d="M' + (cx - 56) + ' 110v26M' + (cx + 56) + ' 110v26" stroke-width="2.4"/>'
          + pad(cx - 70, 84, 86, 7, 3);
      };
      var up = head(56, 90) + limb([[64, 92], [100, 96], [136, 98]], 4.0)
        + limb([[96, 98], [112, 106], [124, 114]], 1.9) + foot(124, 114, 1)
        + limb([[74, 92], [76, 74], [74, 58]], 1.4) + limb([[86, 92], [88, 74], [86, 58]], 1.4)
        + DB(74, 54) + DB(88, 54);
      var wide = head(264, 90) + limb([[272, 92], [306, 96], [342, 98]], 4.0)
        + limb([[302, 98], [318, 106], [330, 114]], 1.9) + foot(330, 114, 1)
        + limb([[282, 88], [262, 74], [246, 66]], 1.4) + limb([[294, 86], [274, 72], [258, 64]], 1.4)
        + DB(242, 62) + DB(256, 60);
      return frame(rig(104) + rig(312) + up + wide + '<path d="M40 142h132M208 142h132" stroke-width="1.6"/>');
    },
    /* —— machinelegs：坐姿蹬腿（v10 精细：靠背/坐垫/配重片组/传力臂/带纹踏板）—— */
    machinelegs: function () {
      var rig = function (cx) {
        return pad(cx - 76, 44, 12, 64, 5)
          + pad(cx - 64, 104, 88, 10, 5)
          + '<path d="M' + (cx - 78) + ' 42v76M' + (cx - 78) + ' 118h30" stroke-width="2.4"/>'
          + stack(cx + 62, 60, 5)
          + '<path d="M' + (cx + 38) + ' 96h32l22 28" stroke-width="2.6"/>'
          + '<path d="M' + (cx + 82) + ' 50l4 24" stroke-width="2"/>'
          + '<path d="M' + (cx + 82) + ' 104h16l12 34" stroke-width="2.6"/>'
          + '<path d="M' + (cx + 94) + ' 100h22M' + (cx + 94) + ' 108h22M' + (cx + 94) + ' 116h22" stroke-width="1.9"/>';
      };
      var bent = head(64, 52) + limb([[68, 60], [74, 80], [78, 98]], 4.2)
        + limb([[56, 68], [46, 84], [44, 100]], 1.5) + limb([[78, 68], [86, 84], [88, 100]], 1.5)
        + limb([[84, 98], [114, 96], [138, 100]], 1.9) + limb([[86, 106], [116, 112], [140, 108]], 1.9)
        + '<path d="M140 94v16" stroke-width="2"/>' + foot(140, 108, 1);
      var push = head(272, 52) + limb([[276, 60], [282, 80], [286, 98]], 4.2)
        + limb([[264, 68], [254, 84], [252, 100]], 1.5) + limb([[286, 68], [294, 84], [296, 100]], 1.5)
        + limb([[292, 98], [322, 88], [348, 84]], 1.9) + limb([[294, 106], [324, 96], [350, 92]], 1.9)
        + '<path d="M348 76v18" stroke-width="2"/>' + foot(350, 92, 1);
      return frame(rig(104) + rig(312) + bent + push + '<path d="M40 152h132M208 152h132" stroke-width="1.6"/>');
    },
    /* —— legcurl：俯卧腿弯举（v10 精细：圆角卧垫/胸垫/垂臂抓把/展平腿→上屈）—— */
    legcurl: function () {
      var rig = function (cx) {
        return pad(cx - 66, 92, 134, 11, 5)
          + '<path d="M' + (cx - 58) + ' 103v24M' + (cx + 58) + ' 103v24" stroke-width="2.4"/>'
          + '<path d="M' + (cx + 26) + ' 92v-12" stroke-width="2"/>' + pad(cx + 12, 72, 40, 8, 4);
      };
      /* 返工 R5：人体线与垫面留缝、踝部滚垫显式画出（不再与器械线糊在一起） */
      var straight = head(56, 80) + limb([[64, 82], [100, 84], [136, 86]], 4.2)
        + limb([[70, 88], [66, 96], [62, 104]], 1.5)
        + arc([70, 88], [66, 96], [62, 104], 8)
        + limb([[136, 86], [162, 88], [186, 88]], 1.9) + arc([136, 86], [162, 88], [186, 88], 10)
        + foot(186, 88, 1)
        + '<circle cx="192" cy="88" r="5" stroke-width="2"/>';
      var curled = head(264, 80) + limb([[272, 82], [308, 84], [344, 86]], 4.2)
        + limb([[278, 88], [274, 96], [270, 104]], 1.5)
        + arc([278, 88], [274, 96], [270, 104], 8)
        + limb([[344, 86], [366, 72], [382, 54]], 1.9) + arc([344, 86], [366, 72], [382, 54], 10)
        + foot(382, 54, 1)
        + '<circle cx="386" cy="50" r="5" stroke-width="2"/>';
      return frame(rig(104) + rig(312) + straight + curled + '<path d="M40 138h132M208 138h132" stroke-width="1.6"/>');
    },
    /* —— calf：站姿提踵（v10.3：机架移到人体左侧，避开与躯干/腿线的读图混淆）—— */
    calf: function () {
      var rig = function (cx) {
        return stack(cx - 76, 72, 5)
          + pad(cx - 74, 52, 60, 94, 6)
          + '<path d="M' + (cx - 16) + ' 58H' + (cx + 22) + '" stroke-width="2.8"/>'
          + pad(cx + 20, 52, 16, 12, 4)
          + '<path d="M' + (cx - 66) + ' 152h116" stroke-width="4"/>'
          + '<path d="M' + (cx + 44) + ' 152v7h32" stroke-width="2.2"/>';
      };
      var low = head(134, 44) + limb([[134, 52], [134, 74], [134, 94]], 4.4)
        + limb([[124, 58], [118, 76], [116, 94]], 1.5) + limb([[144, 58], [150, 76], [152, 94]], 1.5)
        + limb([[134, 94], [134, 122], [134, 148]], 1.9) + limb([[142, 94], [142, 120], [142, 148]], 1.9)
        + foot(134, 148, 1) + foot(142, 148, 1);
      var high = head(314, 34) + limb([[314, 42], [314, 64], [314, 84]], 4.4)
        + limb([[304, 48], [298, 66], [296, 84]], 1.5) + limb([[324, 48], [330, 66], [332, 84]], 1.5)
        + limb([[314, 84], [314, 108], [314, 126]], 1.9) + limb([[322, 84], [322, 106], [322, 124]], 1.9)
        + '<path d="M312 126l14 24" stroke-width="1.9"/><path d="M320 124l14 24" stroke-width="1.9"/>'
        + '<path d="M302 116q11 -7 22 0" stroke-width="1.3"/>';
      return frame(rig(134) + rig(314) + low + high + '<path d="M40 158h132M208 158h132" stroke-width="1.6"/>');
    },
    /* —— lunge：哑铃分腿蹲（v10 精细：躯干体量；站姿 → 前膝 90° 弓步）—— */
    lunge: function () {
      var stand = head(96, 44) + limb([[96, 52], [96, 72], [96, 92]], 5.0)
        + limb([[96, 92], [86, 116], [84, 138]], 2.0) + limb([[96, 92], [106, 116], [108, 138]], 2.0)
        + foot(84, 138, 1) + foot(108, 138, 1)
        + limb([[84, 62], [80, 92], [78, 118]], 1.5) + limb([[108, 62], [112, 92], [114, 118]], 1.5)
        + arc([84, 62], [80, 92], [78, 118], 9) + arc([108, 62], [112, 92], [114, 118], 9)
        + DB(78, 124) + DB(114, 124);
      var split = head(118, 36) + limb([[118, 44], [118, 62], [118, 80]], 5.0)
        + limb([[118, 80], [102, 100], [102, 132]], 2.2)
        + limb([[118, 80], [148, 96], [152, 134]], 2.0)
        + arc([118, 80], [102, 100], [102, 132], 13) + arc([118, 80], [148, 96], [152, 134], 13)
        + foot(102, 132, 1) + foot(152, 134, 1)
        + limb([[106, 56], [100, 88], [98, 116]], 1.5) + limb([[130, 56], [136, 88], [138, 116]], 1.5)
        + arc([106, 56], [100, 88], [98, 116], 9) + arc([130, 56], [136, 88], [138, 116], 9)
        + DB(98, 122) + DB(138, 122);
      return frame(stand + split + '<path d="M52 142h108M258 142h108" stroke-width="1.6"/>');
    },
    /* —— dip：双杠臂屈伸（v10 精细：双立柱+横把+底座；直臂支撑 → 屈肘下沉）—— */
    dip: function () {
      var bars = function (cx) {
        return '<path d="M' + (cx - 36) + ' 44v108M' + (cx + 36) + ' 44v108" stroke-width="2.8"/>'
          + '<path d="M' + (cx - 28) + ' 68h16M' + (cx + 12) + ' 68h16" stroke-width="4.4"/>'
          + '<path d="M' + (cx - 36) + ' 152h72" stroke-width="2.2"/>';
      };
      var high = head(104, 54) + limb([[104, 62], [104, 78], [104, 96]], 4.8)
        + limb([[96, 68], [86, 70], [72, 70]], 1.5) + limb([[112, 68], [122, 70], [136, 70]], 1.5)
        + limb([[104, 96], [98, 120], [96, 144]], 2.0) + limb([[112, 96], [118, 120], [120, 144]], 2.0)
        + foot(96, 144, -1) + foot(120, 144, 1);
      var low = head(312, 74) + limb([[312, 82], [312, 94], [312, 108]], 4.8)
        + limb([[304, 86], [292, 74], [280, 70]], 1.5) + limb([[320, 86], [332, 74], [344, 70]], 1.5)
        + limb([[312, 108], [306, 128], [304, 148]], 2.0) + limb([[320, 108], [326, 128], [328, 148]], 2.0)
        + foot(304, 148, -1) + foot(328, 148, 1);
      return frame(bars(104) + bars(312) + high + low + '<path d="M52 158h104M264 158h104" stroke-width="1.6"/>');
    },
    /* —— pushup：俯卧撑（v10 精细：地面线带基座纹；直臂高位 → 屈肘贴地）—— */
    pushup: function () {
      var floor = '<path d="M36 148h128M248 148h128" stroke-width="1.8"/>'
        + '<path d="M36 148l-8 6M164 148l8 6M248 148l-8 6M376 148l8 6" stroke-width="1.2"/>';
      var top = head(88, 74) + limb([[96, 80], [130, 88], [158, 96]], 3.6)
        + limb([[118, 86], [104, 110], [102, 140]], 1.6) + foot(102, 140, -1)
        + limb([[150, 94], [158, 120], [156, 144]], 1.9) + foot(156, 144, 1);
      var low = head(292, 94) + limb([[300, 100], [334, 108], [360, 116]], 3.6)
        + limb([[318, 106], [308, 128], [306, 142]], 1.6) + foot(306, 142, -1)
        + limb([[354, 114], [362, 132], [360, 146]], 1.9) + foot(360, 146, 1);
      return frame(floor + top + low);
    },
    /* —— thrust：杠铃臀推（v10 精细：圆角凳 + 杠铃片 + 躯干体量；髋下沉 → 顶髋锁定）—— */
    thrust: function () {
      var bench = function (cx) {
        return pad(cx - 66, 96, 62, 11, 5)
          + '<path d="M' + (cx - 56) + ' 107v22M' + (cx - 12) + ' 107v22" stroke-width="2.4"/>';
      };
      /* 返工 R5：凳移到肩背下方、杠铃横压髋部并与髋线留缝、片加大加双圈（可辨性） */
      var down = head(36, 108) + limb([[44, 112], [78, 118], [104, 122]], 4.2)
        + limb([[104, 122], [124, 126], [140, 138]], 1.9) + foot(140, 138, 1)
        + '<path d="M84 114h40" stroke-width="3.2"/>' + plate2(80, 114, 7.6) + plate2(128, 114, 7.6)
        + '<path d="M92 118h24" stroke-width="0.9"/>';
      var up = head(244, 104) + limb([[252, 110], [288, 104], [318, 112]], 4.2)
        + limb([[318, 112], [338, 126], [352, 142]], 1.9) + foot(352, 142, 1)
        + '<path d="M298 104h40" stroke-width="3.2"/>' + plate2(294, 104, 7.6) + plate2(342, 104, 7.6)
        + '<path d="M306 108h24" stroke-width="0.9"/>'
        + '<path d="M282 116l20 -10" stroke-width="1.3"/>';
      return frame(bench(76) + bench(284) + down + up + '<path d="M40 152h132M208 152h132" stroke-width="1.6"/>');
    },
    /* —— bench：躺卧推举（v10 精细：圆角卧凳+杠铃片；胸前下放 → 推起伸直）—— */
    bench: function () {
      var bench = function (cx) {
        return pad(cx - 62, 100, 124, 12, 5)
          + '<path d="M' + (cx - 52) + ' 112v24M' + (cx + 52) + ' 112v24" stroke-width="2.4"/>'
          + pad(cx - 70, 86, 30, 8, 4);
      };
      var bar = function (y, x0, x1) {
        return '<path d="M' + x0 + ' ' + y + 'h' + (x1 - x0) + '" stroke-width="3.4"/>'
          + plate2(x0 + 7, y, 6.2) + plate2(x1 - 7, y, 6.2);
      };
      var start = head(48, 86) + limb([[56, 88], [96, 94], [132, 98]], 4.0)
        + limb([[96, 96], [116, 106], [130, 116]], 1.9) + foot(130, 116, 1)
        + limb([[74, 88], [70, 76], [72, 68]], 1.4) + limb([[86, 88], [82, 76], [84, 68]], 1.4)
        + bar(74, 56, 138);
      var extended = head(256, 86) + limb([[264, 88], [304, 94], [340, 98]], 4.0)
        + limb([[304, 96], [324, 106], [338, 116]], 1.9) + foot(338, 116, 1)
        + limb([[282, 88], [280, 66], [280, 50]], 1.4) + limb([[294, 88], [292, 66], [292, 50]], 1.4)
        + arc([282, 88], [280, 66], [280, 50], 9) + arc([294, 88], [292, 66], [292, 50], 9)
        + bar(52, 266, 348);
      return frame(bench(104) + bench(312) + start + extended + '<path d="M40 142h132M208 142h132" stroke-width="1.6"/>');
    },
    /* —— bridge：自重臀桥（v10 精细：头/躯干体量；髋下沉 → 顶髋抬起）—— */
    bridge: function () {
      var ground = '<path d="M40 148h130M228 148h130" stroke-width="1.6"/>';
      var down = head(56, 104) + limb([[64, 108], [96, 118], [124, 132]], 4.0)
        + limb([[124, 132], [140, 140], [156, 146]], 1.9) + foot(156, 146, 1)
        + limb([[80, 112], [72, 124], [62, 134]], 1.5) + foot(62, 134, -1);
      var up = head(258, 112) + limb([[266, 116], [298, 106], [324, 116]], 4.0)
        + limb([[324, 116], [342, 128], [356, 144]], 1.9) + foot(356, 144, 1)
        + limb([[284, 110], [276, 122], [268, 132]], 1.5) + foot(268, 132, -1)
        + '<path d="M296 120q10 -22 22 -18" stroke-width="1.4"/>';
      return frame(down + up + ground);
    },
    /* —— reardelt：俯身反向飞鸟（v10 精细：俯身铰链 + 双臂后上展开）—— */
    reardelt: function () {
      var torso = function (cx, hipY, open) {
        return head(cx + 22, hipY - 44) + limb([[cx + 18, hipY - 36], [cx + 6, hipY - 18], [cx - 2, hipY]], 4.2)
          + limb([[cx - 2, hipY], [cx - 12, hipY + 22], [cx - 18, hipY + 42]], 2.0)
          + limb([[cx - 2, hipY], [cx + 6, hipY + 24], [cx + 8, hipY + 44]], 2.0)
          + foot(cx - 18, hipY + 42, 1) + foot(cx + 8, hipY + 44, 1)
          + limb([[cx + 14, hipY - 30], [cx - 4 - open, hipY - 40], [cx - 20 - open, hipY - 34]], 1.4)
          + limb([[cx + 22, hipY - 28], [cx + 4 + open, hipY - 40], [cx - 12 + open, hipY - 34]], 1.4)
          + DB(cx - 26 - open, hipY - 32) + DB(cx - 6 + open, hipY - 32);
      };
      return frame(torso(96, 92, 0) + torso(298, 92, 22) + '<path d="M40 148h132M208 148h132" stroke-width="1.6"/>');
    },
    /* —— stand：多用途兜底假人（v10 精细：椭圆头+躯干体量+持铃站姿）—— */
    stand: function () {
      var one = head(104, 44) + limb([[104, 52], [104, 72], [104, 92]], 5.0)
        + limb([[104, 92], [94, 116], [92, 138]], 2.0) + limb([[104, 92], [114, 116], [116, 138]], 2.0)
        + foot(92, 138, 1) + foot(116, 138, 1)
        + limb([[90, 62], [86, 92], [84, 116]], 1.5) + limb([[118, 62], [122, 92], [124, 116]], 1.5)
        + DB(84, 122) + DB(124, 122);
      var two = head(312, 44) + limb([[312, 52], [312, 72], [312, 92]], 5.0)
        + limb([[312, 92], [302, 116], [300, 138]], 2.0) + limb([[312, 92], [322, 116], [324, 138]], 2.0)
        + foot(300, 138, 1) + foot(324, 138, 1)
        + limb([[298, 62], [294, 92], [292, 116]], 1.5) + limb([[326, 62], [330, 92], [332, 116]], 1.5);
      return frame(one + two + '<path d="M56 148h104M264 148h104" stroke-width="1.6"/>');
    },
    /* —— core：卷腹（v10 精细：双臂胸前交叉、两帧共用腿与地面线；A 档）—— */
    core: function () {
      var ground = '<path d="M40 150h120M250 150h120" stroke-width="1.6"/>';
      var legsAt = function (hx) {
        return limb([[hx, 116], [hx + 24, 112], [hx + 34, 96]], 1.5)
          + limb([[hx + 4, 124], [hx + 26, 120], [hx + 36, 104]], 1.5)
          + foot(hx + 40, 96, 1) + foot(hx + 42, 104, 1);
      };
      var flat = head(72, 106) + limb([[80, 110], [104, 114], [128, 116]], 3.8)
        + limb([[88, 104], [104, 116]], 1.3) + limb([[104, 100], [88, 116]], 1.3)
        + legsAt(128);
      var raised = head(296, 84) + limb([[304, 90], [322, 104], [336, 116]], 3.8)
        + limb([[312, 92], [324, 106]], 1.3) + limb([[322, 88], [310, 106]], 1.3)
        + legsAt(336);
      return frame(flat + raised + ground);
    }
  };
  /* —— 站点接入（v8）：id → 模板 key 映射 + 兜底 —— */
  function keyFor(pattern, exid) {
    var X = {      "bench-press": "bench", "db-bench": "bench", "incline-db-press": "bench", "incline-curl": "curl",
      "lat-pulldown": "pulldown", "straight-arm-pulldown": "pulldown", "face-pull": "pulldown",
      "seated-row": "seatrow", "inverted-row": "pullup", "band-row": "row",
      "band-chest-press": "flye", "band-pull-apart": "flye", "band-walk": "squat",
      "leg-press": "squat", "leg-ext": "machinelegs", "leg-curl": "legcurl", "calf-raise": "calf",
      "hip-thrust": "thrust", "glute-bridge": "bridge", "single-leg-glute-bridge": "bridge",
      "cable-kickback": "bridge", "cable-fly": "flye", "pec-deck": "flye", "dips": "dip",
      "hanging-leg-raise": "core", "side-lying-leg-raise": "core", "burpee": null, "russian-twist": "core",
      "farmer-carry": "stand", "rear-delt-fly": "reardelt", "lateral-raise": "raise" };
    if (exid in X) return X[exid];
    var M = { "pull": "pullup", "squat": "squat", "hinge": "deadlift", "core": "core", "press": "press",
      "bench": "bench", "row": "row" };
    return M[pattern] !== undefined ? M[pattern] : ({"curl": "curl", "triceps": "triceps", "flye": "flye",
      "machinelegs": "machinelegs", "legcurl": "legcurl", "calf": "calf", "lunge": "lunge", "dip": "dip",
      "pushup": "pushup", "thrust": "thrust", "bridge": "bridge", "reardelt": "reardelt", "stand": "stand",
      "pulldown": "pulldown", "pullup": "pullup", "seatrow": "seatrow", "raise": "raise"}[pattern] || null);
  }
  window.IG_PLACARD = {
    panel: panel,
    keyFor: keyFor,
    frames: function (t) {
      if (!FR[t]) return "";
      return '<svg viewBox="0 0 400 180" role="img" aria-label="动作帧：起始与完成">' + FR[t]() + "</svg>";
    },
    /* 原始内容（不含外层 svg）：供详情页"两帧擦拭对比"用自定义 viewBox 各取一帧 */
    framesRaw: function (t) {
      return FR[t] ? FR[t]() : "";
    },
    hasFrames: function (t) { return !!FR[t]; }
  };
})();
