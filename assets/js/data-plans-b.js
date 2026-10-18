/* 训练计划数据 B 组：上下肢四分化 + 推拉腿 PPL */
window.FIT_PLANS = window.FIT_PLANS || [];
window.FIT_PLANS.push(
{id:"upper-lower", name:"上下肢四分化", en:"Upper / Lower Split", freq:"每周 4 天", duration:"8–12 周", level:"进阶",
 goal:"增肌主力方案 · 容量与频率平衡",
 desc:"上肢×2、下肢×2，每块肌肉每周练 2 次、容量可灵活加码。科研与实际两头押注的「万金油」方案。",
 fit:"练了半年以上 / 从新手计划毕业",
 schedule:[
  {day:"周一", label:"上肢 A（强度侧重）", items:[{ex:"bench-press", sets:"4×5–6"},{ex:"bb-row", sets:"4×6–8"},{ex:"ohp", sets:"3×6–8"},{ex:"lat-pulldown", sets:"3×8–10"},{ex:"pushdown", sets:"3×10–12"},{ex:"bb-curl", sets:"3×10–12"}]},
  {day:"周二", label:"下肢 A", items:[{ex:"squat", sets:"4×5–6"},{ex:"rdl", sets:"3×8–10"},{ex:"leg-press", sets:"3×10–12"},{ex:"leg-curl", sets:"3×10–12"},{ex:"calf-raise", sets:"4×10–15"},{ex:"cable-crunch", sets:"3×12–15"}]},
  {day:"周四", label:"上肢 B（容量侧重）", items:[{ex:"incline-db-press", sets:"4×8–10"},{ex:"db-row", sets:"4×8–10"},{ex:"lateral-raise", sets:"4×12–15"},{ex:"cable-fly", sets:"3×10–12"},{ex:"face-pull", sets:"3×15–20"},{ex:"skull-crusher", sets:"3×10–12"}]},
  {day:"周五", label:"下肢 B", items:[{ex:"deadlift", sets:"3×4–6"},{ex:"bss", sets:"3×8–10/侧"},{ex:"leg-ext", sets:"3×12–15"},{ex:"leg-curl", sets:"3×10–12"},{ex:"hip-thrust", sets:"3×8–12"},{ex:"hanging-leg-raise", sets:"3×8–12"}]},
  {day:"周三 / 周末", label:"休息 · 可选 1 次有氧", items:[]}],
 progress:["强度日冲重量（RIR 1–2），容量日攒组数（RIR 2–3）","每肌群每周总容量目标：12 → 16 → 20 组渐进","连续两周某动作停滞 → 换变式或调整顺序","每 8–12 周安排 1 周减量（容量减半）"],
 notes:["复合动作优先、孤立收尾","上下肢交替给同一部位 48–72 小时恢复","训练时长控制在 60–75 分钟"]},
{id:"ppl", name:"推拉腿 PPL", en:"Push · Pull · Legs", freq:"每周 3 或 6 天", duration:"8–16 周", level:"进阶",
 goal:"大容量增肌 · 高自由度",
 desc:"按「推 / 拉 / 腿」三模式分化，一周跑 1 轮（3 天版）或 2 轮（6 天版）。动作分化干净、好排课，是最流行的增肌分化之一。",
 fit:"时间充裕 / 想上更大训练量",
 schedule:[
  {day:"推 A（周一）", label:"胸 · 肩 · 三头", items:[{ex:"bench-press", sets:"4×6–8"},{ex:"incline-db-press", sets:"3×8–10"},{ex:"cable-fly", sets:"3×10–15"},{ex:"db-shoulder-press", sets:"3×8–10"},{ex:"lateral-raise", sets:"4×12–20"},{ex:"pushdown", sets:"3×10–15"},{ex:"overhead-ext", sets:"3×10–12"}]},
  {day:"拉 A（周二）", label:"背 · 后束 · 二头", items:[{ex:"pullup", sets:"4×6–10"},{ex:"bb-row", sets:"4×6–8"},{ex:"seated-row", sets:"3×10–12"},{ex:"face-pull", sets:"3×15–20"},{ex:"bb-curl", sets:"3×8–12"},{ex:"hammer-curl", sets:"3×10–12"}]},
  {day:"腿 A（周三）", label:"腿 · 臀 · 核心", items:[{ex:"squat", sets:"4×6–8"},{ex:"rdl", sets:"3×8–10"},{ex:"leg-press", sets:"3×10–15"},{ex:"leg-curl", sets:"3×10–12"},{ex:"calf-raise", sets:"4×12–15"},{ex:"cable-crunch", sets:"3×12–15"}]},
  {day:"周四–周日", label:"重复一轮（6 天版）/ 休息（3 天版）", items:[{ex:"pullup", sets:"6 天版按 A 轮再来一次，可换变式"}]}],
 progress:["6 天版：两轮之间换动作变式（如卧推换上斜哑铃）保持新鲜感","每肌群每周容量 16–20 组渐进","训练日顺序固定，保证同一模式间隔 72 小时","减脂期可砍到 3 天版 + 2 天有氧"],
 notes:["6 天版强度大：睡眠和饮食必须跟上，否则砍回 3 天","每次主项 1–2 个打头阵，孤立动作收尾"]}
);
