/* 训练计划数据 A 组：新手全身启航 + 经典力量 5×5 */
window.FIT_PLANS = window.FIT_PLANS || [];
window.FIT_PLANS.push(
{id:"beginner", name:"新手全身启航", en:"Full-Body Starter", freq:"每周 3 天", duration:"第 1–8 周", level:"零基础",
 goal:"建立动作模式 · 全身均衡发展",
 desc:"A/B 两套全身训练交替，每次 6 个动作覆盖全身。动作模式优先、重量其次，是唯一推荐给纯新手的起步方案。",
 fit:"完全没练过 / 中断很久想重启",
 schedule:[
  {day:"周一", label:"全身 A", items:[{ex:"goblet-squat", sets:"3×8–12"},{ex:"db-bench", sets:"3×8–12"},{ex:"db-row", sets:"3×8–12"},{ex:"db-shoulder-press", sets:"3×8–12"},{ex:"glute-bridge", sets:"3×10–15"},{ex:"dead-bug", sets:"3×8–10/侧"}]},
  {day:"周二", label:"休息 / 散步 30 分钟", items:[]},
  {day:"周三", label:"全身 B", items:[{ex:"inverted-row", sets:"3×8–12"},{ex:"leg-press", sets:"3×10–12"},{ex:"incline-db-press", sets:"3×8–12"},{ex:"rdl", sets:"3×8–10（轻）"},{ex:"lateral-raise", sets:"3×12–15"},{ex:"plank", sets:"3×30–45 秒"}]},
  {day:"周四", label:"休息", items:[]},
  {day:"周五", label:"全身 A / B 轮换（照周一周三交替）", items:[]},
  {day:"周六", label:"可选：快走 30–45 分钟", items:[]},
  {day:"周日", label:"休息", items:[]}],
 progress:["双重渐进：先把每组做到区间上限次数，再加重 2.5–5%","每个动作连续 2 次练不动 → 减重 10% 重新爬坡","第 4 周减量一周（组数砍 1/3）让身体超量恢复","8 周后转到「上下肢四分化」继续进阶"],
 notes:["前 2 周重量宁轻勿重，把动作轨迹练熟再谈强度","每组保留 2–3 次余力（RIR 2–3），别练到力竭","训练日之间至少隔 1 天休息","每次训练前 5–10 分钟动态热身（髋、肩、核心激活）"]},
{id:"strength-5x5", name:"经典力量 5×5", en:"Strength 5×5", freq:"每周 3 天", duration:"8–12 周", level:"入门～进阶",
 goal:"三大项力量增长 · 简单粗暴可执行",
 desc:"只围绕深蹲/卧推/硬拉/推举四个动作的极简计划：A/B 交替、每次 3 个主项，8–12 周力量涨幅明显。",
 fit:"想先把三大项练扎实 / 喜欢简单明确规则的人",
 schedule:[
  {day:"周一", label:"训练 A", items:[{ex:"squat", sets:"5×5"},{ex:"bench-press", sets:"5×5"},{ex:"bb-row", sets:"5×5"},{ex:"plank", sets:"3×45 秒"}]},
  {day:"周三", label:"训练 B", items:[{ex:"squat", sets:"5×5"},{ex:"ohp", sets:"5×5"},{ex:"deadlift", sets:"1×5"},{ex:"hanging-leg-raise", sets:"3×8–12"}]},
  {day:"周五", label:"训练 A（下周 B/A/B 交替）", items:[{ex:"squat", sets:"5×5"},{ex:"bench-press", sets:"5×5"},{ex:"bb-row", sets:"5×5"}]},
  {day:"其余天", label:"休息 · 保证睡眠与蛋白摄入", items:[]}],
 progress:["5×5 全部成功才加重：深蹲/硬拉 +2.5–5kg，卧推/推举 +1–2.5kg","同一重量失败 3 次 → 减重 10% 重新爬坡","热身组：空杆 → 40% → 60% → 80% 各做几次激活","8–12 周后力量平台期，转到容量更高的增肌方案"],
 notes:["每次训练 45–60 分钟，别贪辅助动作","腰背出现不适先停练、降重量查技术","吃睡是计划的一部分：睡眠 7–9 小时、蛋白达标"]}
);
