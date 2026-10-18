/* 训练计划数据 D 组：居家无器械计划 */
window.FIT_PLANS = window.FIT_PLANS || [];
window.FIT_PLANS.push(
{id:"home-bodyweight", name:"居家无器械计划", en:"Home Bodyweight Plan", freq:"每周 3–4 天", duration:"第 1–6 周（可循环）", level:"入门",
 goal:"零器械起步 · 建立训练习惯与基础力量",
 desc:"只有一张垫子 + 一根弹力带（没有弹力带可用毛巾/书包替代拉力）就能练。三段式全身循环：A 基础力量、B 单侧与肩背、C 臀腿核心。适合出差、宿舍、不想办卡的人。",
 fit:"没器械 / 不想去健身房 / 想先养成习惯的新手",
 schedule:[
  {day:"周一", label:"全身 A（基础力量）", items:[{ex:"bw-squat", sets:"3×15–20"},{ex:"pushup", sets:"3×8–15"},{ex:"band-row", sets:"3×12–15"},{ex:"glute-bridge", sets:"3×15–20"},{ex:"plank", sets:"3×30–45 秒"},{ex:"bird-dog", sets:"3×8–10/侧"}]},
  {day:"周二", label:"休息 / 散步 20–30 分钟", items:[]},
  {day:"周三", label:"全身 B（单侧与肩背）", items:[{ex:"reverse-lunge", sets:"3×10–12/侧"},{ex:"band-chest-press", sets:"3×12–15"},{ex:"band-pull-apart", sets:"3×15–20"},{ex:"single-leg-glute-bridge", sets:"3×10–12/侧"},{ex:"side-plank", sets:"3×20–30 秒/侧"},{ex:"dead-bug", sets:"3×8–10/侧"}]},
  {day:"周四", label:"休息", items:[]},
  {day:"周五", label:"全身 C（臀腿 + 核心）", items:[{ex:"wall-sit", sets:"3×30–60 秒"},{ex:"bw-squat", sets:"3×15（慢速离心 3 秒）"},{ex:"side-lying-leg-raise", sets:"3×12–15/侧"},{ex:"russian-twist", sets:"3×16–20"},{ex:"plank", sets:"3×45 秒"}]},
  {day:"周六", label:"可选：20–30 分钟有氧或跟练视频", items:[]},
  {day:"周日", label:"休息 · 补觉与吃够蛋白", items:[]}],
 progress:["无器械也能渐进：① 先加次数 ② 放慢离心（3 秒下） ③ 缩短组间休息 ④ 改单侧 ⑤ 增加幅度或停顿","每两周挑一个变量升级，别同时全加","6 周后如果方便，加入一对哑铃（转到「新手全身启航」）继续进阶","每周至少留 1–2 天完全休息，肌肉在休息里长"],
 notes:["需要：一张垫子 + 一根弹力带（可替代）；门框/床脚可作带子固定点","动作宁慢勿快，质量 > 数量；关节疼痛立即停止","居家训练也要热身 5 分钟（原地踏步 + 关节绕环 + 动态拉伸）","配合「饮食营养」页把蛋白质吃到 1.6–2.2 g/kg，效果会明显不同"]}
);
