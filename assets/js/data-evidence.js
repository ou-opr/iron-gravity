/* assets/js/data-evidence.js —— 证据与来源（v15）
 *
 * 目的：把站内出现的每个「可执行数字」都挂到可核对的文献上，并明确标注证据等级；
 *      同时为 60 个动作补「注意人群」。
 *
 * 事实来源：全部 8 篇文献的标题/卷期/页码均于 2026-10 通过 NCBI E-utilities（esummary）
 *          按 PMID 逐条取回后写入，未凭记忆填写。核验脚本：tools/check-links.mjs（链接）+ 人工比对。
 */
window.IG_EVIDENCE = {
  meta: {
    updated: "2026-10",
    levels: [
      { k: "A", d: "有系统综述 / 荟萃分析或权威机构立场声明直接支持该数字或结论" },
      { k: "B", d: "有文献支持，但结论需从邻近人群或间接指标推导（例如从备赛人群推到普通减脂者）" },
      { k: "C", d: "教练共识 / 生物力学常识，没有直接针对该说法的对照研究（本站动作要点、组间休息秒数等属此类）" }
    ],
    method: "站内只有「数字与结论」逐条挂文献；动作技术细节（如肩胛后收、肘角 45°）属 C 级，不逐条引用——把它们包装成循证反而是误导。"
  },

  refs: {
    pelland2026: {
      a: "Pelland JC 等", y: 2026, j: "Sports Med", cite: "56(2):481–505", pmid: "41343037",
      t: "The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains"
    },
    schoenfeld2017: {
      a: "Schoenfeld BJ 等", y: 2017, j: "J Sports Sci", cite: "35(11):1073–1082", pmid: "27433992",
      t: "Dose-response relationship between weekly resistance training volume and increases in muscle mass: A systematic review and meta-analysis"
    },
    schoenfeld2016: {
      a: "Schoenfeld BJ 等", y: 2016, j: "Sports Med", cite: "46(11):1689–1697", pmid: "27102172",
      t: "Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis"
    },
    morton2018: {
      a: "Morton RW 等", y: 2018, j: "Br J Sports Med", cite: "52(6):376–384", pmid: "28698222",
      t: "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults"
    },
    helms2014cr: {
      a: "Helms ER 等", y: 2014, j: "Int J Sport Nutr Exerc Metab", cite: "24(2):127–138", pmid: "24092765",
      t: "A systematic review of dietary protein during caloric restriction in resistance trained lean athletes: a case for higher intakes"
    },
    helms2014prep: {
      a: "Helms ER 等", y: 2014, j: "J Int Soc Sports Nutr", cite: "11:20", pmid: "24864135",
      t: "Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation"
    },
    kreider2017: {
      a: "Kreider RB 等", y: 2017, j: "J Int Soc Sports Nutr", cite: "14:18", pmid: "28615996",
      t: "International Society of Sports Nutrition position stand: safety and efficacy of creatine supplementation in exercise, sport, and medicine"
    },
    zourdos2016: {
      a: "Zourdos MC 等", y: 2016, j: "J Strength Cond Res", cite: "30(1):267–275", pmid: "26049792",
      t: "Novel Resistance Training-Specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve"
    },
    currier2026: {
      a: "Currier BS 等", y: 2026, j: "Med Sci Sports Exerc", cite: "58(4):851–872", pmid: "41843416",
      t: "American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews"
    },
    hartmann2013: {
      a: "Hartmann H 等", y: 2013, j: "Sports Med", cite: "43(10):993–1008", pmid: "23821469",
      t: "Analysis of the load on the knee joint and vertebral column with changes in squatting depth and weight load"
    },
    lee2015: {
      a: "Lee BC, McGill SM", y: 2015, j: "J Strength Cond Res", cite: "29(6):1515–1526", pmid: "26010794",
      t: "Effect of long-term isometric training on core/torso stiffness"
    }
  },

  claims: [
    {
      id: "volume", lv: "A", t: "每周每肌群 10–20 个有效组",
      refs: ["pelland2026", "schoenfeld2017"],
      say: "把同一肌群的每周组数从低档往上加，肌肥大与力量随之上行；多数人可持续、且收益与恢复划算的区间落在每周 10–20 组。",
      caveat: "超过约 20 组后增益趋平、单位时间的边际收益下降，恢复成本上升；新手从 6–10 组起步就已经能吃到大部分增益。",
      used: "动作页「建议组次」、训练日志「周容量」、训练计划渐进规则"
    },
    {
      id: "frequency", lv: "B", t: "同一肌群每周 ≥2 次",
      refs: ["schoenfeld2016"],
      say: "在总容量相同的前提下，每周练 2 次与 1 次相比，肌肥大没有显著劣势、通常略优；把容量拆到 2–3 次更容易做足且动作质量更高。",
      caveat: "这不是「必须 2 次」的硬结论——文献显示频率本身不是独立变量，真正起作用的是每周总容量。",
      used: "训练计划的分化设计（上下肢 / PPL）"
    },
    {
      id: "rir", lv: "B", t: "复合动作每组留 1–3 RIR",
      refs: ["zourdos2016"],
      say: "RIR（还能做几次）是可训练者较稳定自评的强度标尺；把复合动作留在离力竭 1–3 次，既保证有效刺激，又不至于明显拖慢恢复。",
      caveat: "新手普遍高估自己的能力（把 3 RIR 当成 0 RIR），建议先按「能再多做 4–5 次」的保守感觉练两周再收紧。",
      used: "动作页组次建议里的「留 1–2 RIR / 1–3 RIR」"
    },
    {
      id: "protein", lv: "A", t: "蛋白质 1.6–2.2 g/kg/天",
      refs: ["morton2018", "helms2014cr"],
      say: "力量训练者的蛋白摄入在约 1.6 g/kg/天 附近达到大部分增肌增益，再往上边际收益变小；热量缺口下（减脂）多项分析支持把上探到 2.2–2.4 g/kg 以保护瘦体重。",
      caveat: "肾功能异常者需遵医嘱；这里的区间针对健康成人，不适用于临床营养场景。",
      used: "饮食页 TDEE 计算器的蛋白目标（增肌 1.8 / 减脂 2.2 g/kg）"
    },
    {
      id: "deficit", lv: "B", t: "减脂缺口 15–20%、每周减 0.5–1% 体重",
      refs: ["helms2014prep", "helms2014cr"],
      say: "把减重速度控制在每周体重的 0.5–1%，配合力量训练与高蛋白，是最能保住肌肉与训练表现的节奏。",
      caveat: "该建议主要来自自然健美备赛人群的研究与共识，体脂较高者的起始阶段通常可以更快；请按自身情况调整。",
      used: "饮食页「目标热量」与减重速度提示"
    },
    {
      id: "creatine", lv: "A", t: "肌酸一水 3–5 g/天",
      refs: ["kreider2017"],
      say: "肌酸一水是研究最充分、性价比最高的运动补剂之一，长期 3–5 g/天 可提升力量与训练容量，健康人群安全性证据充分。",
      caveat: "初期体重会因水分增加上升 0.5–1.5 kg，属预期反应；肾脏疾病患者请先咨询医生。",
      used: "饮食页补剂证据等级表"
    },
    {
      id: "rom", lv: "A", t: "在可控范围内做全幅度",
      refs: ["currier2026", "hartmann2013"],
      say: "ACSM 2026 的综述汇总（overview of reviews）把「在可控的关节活动范围内完成全幅度」列为主要训练变量之一：全幅度训练的肌肥大与力量增益通常不劣于、往往优于部分幅度。",
      caveat: "深蹲类做全蹲时，膝关节与腰椎的负荷随深度上升（Hartmann 2013 的生物力学分析）——所以「深」要建立在腰椎中立与技术可控之上，而不是硬凑幅度。疼痛或活动度受限者应缩小幅度。",
      used: "动作要点里的「全行程 / 全幅度」要求；深蹲、卧推、划船的幅度提示"
    },
    {
      id: "spine", lv: "B", t: "负荷下保持腰椎中立、用髋铰链",
      refs: ["hartmann2013", "lee2015"],
      say: "在负重动作里维持腰椎中立、用髋关节折叠（髋铰链）代替弓腰，是降低腰椎压缩与剪切负荷的核心技术；长期等长训练可提高躯干刚度（Lee & McGill 2015），对稳定有间接帮助。",
      caveat: "这是生物力学与训练研究的一致方向，不是「这样练就不受伤」的保证；已有腰痛或椎间盘问题者应先做评估。核心训练也不能替代正确的髋铰链模式。",
      used: "深蹲 / 硬拉 / 划船 / 臀推的「脊柱中立」提示"
    }
  ]
};

/* 动作 → 教学视频（60/60 全覆盖）
   每一条都用 YouTube oEmbed 核验过：400/404 一律不收，标题与频道名取自 oEmbed 返回（不是搜索页的转义文本）。
   覆盖率 60/60，`tools/check-media.mjs` 会定期重跑同一套验证，所以这不是一次性人工核对。
   没有精确中文视频的动作，详情页另有「在 B 站搜这个动作」直达。 */
window.IG_EX_VIDEO = {
  "bench-press": [ { a: "Buff Dudes", t: "How to Perform Bench Press - Tutorial & Proper Form", u: "https://www.youtube.com/watch?v=gRVjAtPip0Y" } ],
  "db-bench": [ { a: "Colossus Fitness", t: "How To Dumbbell Chest Press PROPERLY | Fix Your DB Bench Press", u: "https://www.youtube.com/watch?v=cZalRJCaw20" } ],
  "incline-db-press": [ { a: "Colossus Fitness", t: "How To PROPERLY Dumbbell Incline Press Like A Pro | 3 Common Mistakes", u: "https://www.youtube.com/watch?v=awEEyL5zGvU" } ],
  "pushup": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Push-Up | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=WDIpL0pjun0" } ],
  "cable-fly": [ { a: "Colossus Fitness", t: "How to PROPERLY Cable Chest Fly (FIX THIS NOW!)", u: "https://www.youtube.com/watch?v=hrh0K1Oo7Yc" } ],
  "pec-deck": [ { a: "LockedIn", t: "How to do Pec Deck Machine in Correct Form | Full Tutorial | Chest Exercise | LockedIn", u: "https://www.youtube.com/watch?v=q9nmaqICFpg" } ],
  "dips": [ { a: "Jeff Nippard", t: "How To Do Dips For A Bigger Chest and Shoulders (Fix Mistakes!)", u: "https://www.youtube.com/watch?v=yN6Q1UI_xkE" } ],
  "pullup": [ { a: "Buff Dudes", t: "How to Perform Pull Ups - Proper Pull-Up Exercise Tutorial", u: "https://www.youtube.com/watch?v=vw5Xmu5CIew" } ],
  "lat-pulldown": [ { a: "Colossus Fitness", t: "How to PROPERLY Lat Pulldown | FIX YOUR LAT PULLDOWN NOW! (Updated)", u: "https://www.youtube.com/watch?v=ZxgD_89klTQ" } ],
  "bb-row": [ { a: "Runna", t: "Barbell Bent Over Row Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=rqTOAM8WoeM" } ],
  "db-row": [ { a: "Max Euceda", t: "How to do the SINGLE ARM DUMBBELL ROW! | 2 Minute Tutorial", u: "https://www.youtube.com/watch?v=dFzUjzfih7k" } ],
  "seated-row": [ { a: "Soro Bogdan", t: "How to use correctly the seated row machine. Common mistakes", u: "https://www.youtube.com/watch?v=bPwsxx6D4So" } ],
  "deadlift": [ { a: "Buff Dudes", t: "How to Perform the Deadlift - Proper Deadlift Technique & Form", u: "https://www.youtube.com/watch?v=-4qRntuXBSc" } ],
  "straight-arm-pulldown": [ { a: "Renaissance Periodization", t: "Straight Arm Pulldown", u: "https://www.youtube.com/watch?v=G9uNaXGTJ4w" } ],
  "inverted-row": [ { a: "BarBend", t: "Inverted Row Guide | Form Tips, Muscles Worked, and Mistakes", u: "https://www.youtube.com/watch?v=hXTc1mDnZCw" } ],
  "db-shoulder-press": [ { a: "Max Euceda", t: "How to do the SEATED DUMBBELL SHOULDER PRESS! | 2 Minute Tutorial", u: "https://www.youtube.com/watch?v=rO_iEImwHyo" } ],
  "ohp": [ { a: "Barbell Logic", t: "How to Press: Proper Overhead Press Form (Step-by-Step Tutorial)", u: "https://www.youtube.com/watch?v=nNMR9fRGRjQ" } ],
  "lateral-raise": [ { a: "Shelley Darlington", t: "Dumbbell Lateral Raise: Proper Form, Common Mistakes & How to Do It Correctly", u: "https://www.youtube.com/watch?v=6a-sO62TN5E" } ],
  "face-pull": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Face Pull | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=eTCBSFlCJ_s" } ],
  "rear-delt-fly": [ { a: "Muscle Flex", t: "Rear Delt Raise | Proper Technique & Form Tutorial", u: "https://www.youtube.com/watch?v=5Btk1HzSmxo" } ],
  "arnold-press": [ { a: "GrabGains", t: "Dumbbell Arnold Press: Proper form & Technique (Step-by-Step Guide) | GrabGains", u: "https://www.youtube.com/watch?v=SwGnhK6Uccc" } ],
  "squat": [ { a: "megsquats", t: "How to Squat Properly - Form Fixes + Tips + Myths", u: "https://www.youtube.com/watch?v=tTEB9jWjjys" }, { a: "Alan Thrall (Untamed Strength)", t: "How To Squat - Any Style", u: "https://www.youtube.com/watch?v=UFs6E3Ti1jg" } ],
  "goblet-squat": [ { a: "Fit Father Project - Fitness For Busy Fathers", t: "The Goblet Squat Exercise Guide - The Proper Form, Sets & Routine Tutorial", u: "https://www.youtube.com/watch?v=9W5KAqHfDe8" } ],
  "leg-press": [ { a: "Colossus Fitness", t: "How to PROPERLY Leg Press (FIX YOUR FORM NOW)", u: "https://www.youtube.com/watch?v=K5n2vg3oZa4" } ],
  "rdl": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Romanian Deadlift (Barbell) | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=xgusDooVfKU" } ],
  "bss": [ { a: "Vicky Justiz", t: "HOW TO do a BULGARIAN SPLIT SQUAT | proper form + common mistakes", u: "https://www.youtube.com/watch?v=yewlXtRs3K4" } ],
  "leg-curl": [ { a: "Physique Development", t: "How to Lying Leg Curl | Proper Technique, Set Up, & Mistakes", u: "https://www.youtube.com/watch?v=vl5nUdE9mWM" } ],
  "leg-ext": [ { a: "Cris Edmonds TV", t: "How to Do Leg Extensions with Perfect Form (The Proper Range of Motion)", u: "https://www.youtube.com/watch?v=3zWKiW9BBpo" } ],
  "calf-raise": [ { a: "Lean Physique Lab", t: "Standing Calf Raises Bodyweight Tutorial | Calf Exercise | Proper Form Guide | Step by Step", u: "https://www.youtube.com/watch?v=CtpPV2FBkG4" } ],
  "front-squat": [ { a: "Squat University", t: "How To Front Squat With Perfect Form (Stop Making These Mistakes)", u: "https://www.youtube.com/watch?v=G-Vamqoy8qM" } ],
  "lunge": [ { a: "Runna", t: "Walking Lunge Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=vYfp2t4XgqQ" } ],
  "hip-thrust": [ { a: "Runna", t: "Hip Thrust Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=pF17m_CXfL0" } ],
  "glute-bridge": [ { a: "Runna", t: "Glute Bridge Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=L9KZfxT654Y" } ],
  "cable-kickback": [ { a: "Coach Jazz", t: "How To Cable Kickback (Glute Kickback Form Tutorial)", u: "https://www.youtube.com/watch?v=l4zReIOfPCQ" } ],
  "band-walk": [ { a: "Medbridge", t: "How to Do a Lateral Band Walk Exercise | MedBridge", u: "https://www.youtube.com/watch?v=1LvxZrJFy9Y" } ],
  "bb-curl": [ { a: "NatherInkFitness", t: "Barbell Curl | Proper Form & Biceps Workout Tutorial 💪", u: "https://www.youtube.com/watch?v=V0LnAcrYuFI" } ],
  "hammer-curl": [ { a: "Colossus Fitness", t: "How To PROPERLY Hammer Curl For Bigger Biceps (FIX YOUR FORM NOW)", u: "https://www.youtube.com/watch?v=G7hy-AxQwcQ" } ],
  "incline-curl": [ { a: "Jack Cooper", t: "How To Do An Incline Dumbbell Curl | Proper Form & Technique", u: "https://www.youtube.com/watch?v=f9Jw2qGXy4g" } ],
  "pushdown": [ { a: "Gym motivation 💪 Fitness Freek", t: "Cable Triceps Pushdown Tutorial | Proper Form & Common Mistakes", u: "https://www.youtube.com/watch?v=ChbWX35gD44" } ],
  "skull-crusher": [ { a: "FIT.nl", t: "How to Do Lying Triceps Extension (Skull Crusher) | Proper Form Tutorial", u: "https://www.youtube.com/watch?v=tj81tVq3wLo" } ],
  "overhead-ext": [ { a: "ScottHermanFitness", t: "HOW TO: Overhead Triceps Extension (BEST EXERCISE FOR HUGE TRICEPS) || PERFECT FORM (POWERBOMB)", u: "https://www.youtube.com/watch?v=fYqswDVbJDg" } ],
  "plank": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Plank | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=mwlp75MS6Rg" } ],
  "hanging-leg-raise": [ { a: "Runna", t: "Hanging Leg Raise Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=rbOJSK07AGA" } ],
  "cable-crunch": [ { a: "Colossus Fitness", t: "How to PROPERLY Perform A Cable Crunch to Shape Your Abs (Kneeling Cable Abdominal Crunch)", u: "https://www.youtube.com/watch?v=aBd6T01PBqw" } ],
  "dead-bug": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Dead Bug | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=bxn9FBrt4-A" } ],
  "side-plank": [ { a: "Runna", t: "Side Plank Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=iNbH7_edNI8" } ],
  "ab-wheel": [ { a: "That Fit Friend", t: "AB WHEEL ROLLOUT GUIDE | Proper Form & Mistakes to Avoid", u: "https://www.youtube.com/watch?v=j6lR4u193gE" } ],
  "kb-swing": [ { a: "Runna", t: "Kettlebell Swings Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=kuZPzr_eldA" } ],
  "farmer-carry": [ { a: "Colossus Fitness", t: "How To Do The Farmers Walk Exercise PROPERLY (Step-By-Step Tutorial)", u: "https://www.youtube.com/watch?v=E94UNm8fD-4" } ],
  "burpee": [ { a: "Runna", t: "Burpee Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=u1floBsMZNs" } ],
  "bw-squat": [ { a: "Athlean-XX for Women", t: "How To Do SQUATS FOR BEGINNERS | Correct Form & Mechanics | STEP BY STEP GUIDE", u: "https://www.youtube.com/watch?v=otzWCWpuW-A" } ],
  "wall-sit": [ { a: "LockedIn", t: "How to do Wall Sit in Correct Form | Full Tutorial | Isometric Leg Exercise | LockedIn ", u: "https://www.youtube.com/watch?v=qFI0TEp7qeQ" } ],
  "reverse-lunge": [ { a: "FITTR", t: "Dumbbell Reverse Lunges | How To | Proper Form & Technique", u: "https://www.youtube.com/watch?v=RZKXLMxPF_I" } ],
  "band-row": [ { a: "Get Healthy U - with Chris Freytag", t: "How To Do A Resistance Band Row", u: "https://www.youtube.com/watch?v=LSkyinhmA8k" } ],
  "band-chest-press": [ { a: "Global Fitness Club", t: "How to Do: ResistanceBand Chest Press", u: "https://www.youtube.com/watch?v=Uur-4lq9vZM" } ],
  "band-pull-apart": [ { a: "BACK2BASICS", t: "How to Do a Banded Pull Apart Correctly | Rear Shoulders Exercise Form Guide", u: "https://www.youtube.com/watch?v=k5tK4n84LMI" } ],
  "single-leg-glute-bridge": [ { a: "Runna", t: "Single Leg Glute Bridge Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=VUl8R0kn6v4" } ],
  "bird-dog": [ { a: "National Academy of Sports Medicine (NASM)", t: "How to do a Bird Dog | Proper Form & Technique | NASM", u: "https://www.youtube.com/watch?v=ZdAHe9_HeEw" } ],
  "russian-twist": [ { a: "Runna", t: "Russian Twist Tutorial - Proper Form and Technique", u: "https://www.youtube.com/watch?v=IJDOoVyVjhc" } ],
  "side-lying-leg-raise": [ { a: "Perfecting Movement", t: "Side lying leg lifts done correctly to isolate the glutes", u: "https://www.youtube.com/watch?v=bBH0NetEo4E" } ]
};

/* 退阶路径（v16）：动作做不动时「先退一步」的顺序，从最近的一级往更容易的方向排。
   只收站内已有的动作 id，保证每一级都能点进去看要点（validate.mjs 会校验）。 */
window.IG_REGRESSION = {
  "pullup": ["inverted-row", "lat-pulldown"],
  "dips": ["pushup", "band-chest-press"],
  "squat": ["goblet-squat", "bw-squat"],
  "front-squat": ["goblet-squat"],
  "deadlift": ["rdl", "glute-bridge"],
  "ohp": ["db-shoulder-press"],
  "bb-row": ["db-row", "band-row"],
  "hip-thrust": ["glute-bridge"],
  "ab-wheel": ["dead-bug", "plank"],
  "hanging-leg-raise": ["dead-bug"],
  "bss": ["lunge", "bw-squat"],
  "lunge": ["bw-squat"],
  "rdl": ["glute-bridge"],
  "kb-swing": ["glute-bridge"],
  "skull-crusher": ["pushdown"],
  "overhead-ext": ["pushdown"],
  "incline-curl": ["bb-curl"],
  "arnold-press": ["db-shoulder-press"],
  "side-plank": ["plank"],
  "russian-twist": ["dead-bug"],
  "cable-fly": ["pushup"],
  "pec-deck": ["pushup"],
  "burpee": ["bw-squat"]
};

/* 注意人群（60/60 动作）：只写「这个动作最常见的风险点 + 一条可执行退路」，
   属于一般性训练提示（C 级），不构成医学诊断。 */
window.IG_CAUTION = {
  "bench-press": "肩前侧疼或肩胛控制差：先做哑铃／器械版，肘别完全外展",
  "db-bench": "肩活动度不足：下放到不痛的最大幅度，别强求触碰胸口",
  "incline-db-press": "肩峰下疼痛史：凳角降到 30°，并减小下放幅度",
  "pushup": "手腕不适：用俯卧撑架或握拳，肘别外翻成 90°",
  "cable-fly": "肩前侧不稳：重量减半，肘保持微屈固定",
  "pec-deck": "肩部拉伤／术后恢复期：别做末端过伸，肩胛始终贴靠背",
  "dips": "肩或肘有伤：先做窄幅或辅助器械版，别下放超过大臂平行",
  "pullup": "肩肘痛：改用高位下拉过渡，避免半程摆动借力",
  "lat-pulldown": "肩关节上举受限：拉到锁骨即可，别靠后仰硬拽",
  "bb-row": "腰背有伤：改用胸支撑划船或坐姿绳索划船",
  "db-row": "下背不适：一手撑凳分担，躯干别旋转",
  "seated-row": "腰椎间盘问题：保持中立位，别用腰前后摆",
  "deadlift": "腰椎／髋活动度受限：先做架上拉或罗马尼亚硬拉，从空杆起",
  "straight-arm-pulldown": "肩前侧紧：肘微屈锁定，别把手臂完全伸直顶住",
  "inverted-row": "手腕／肩不适：抬高杠位降低难度，起身先收紧肩胛",
  "db-shoulder-press": "肩峰下撞击史：掌心相对（中立握）并减小幅度",
  "ohp": "肩或腰有伤：改坐姿靠背版，别用腰后仰代偿",
  "lateral-raise": "肩痛：抬到与肩平即可，拇指略高于小指",
  "face-pull": "颈部紧：用轻重量、肩胛主导，别耸肩",
  "rear-delt-fly": "肩后侧拉伤史：俯身角度小一点，肘保持微屈",
  "arnold-press": "肩活动度不足：去掉旋转，改中立握推举",
  "squat": "膝／髋／踝活动度受限：垫高脚跟，或改高脚杯蹲／箱蹲",
  "goblet-squat": "膝前痛：蹲到大腿平行即可，膝盖别内扣",
  "leg-press": "腰椎／膝不适：膝盖别过度贴近胸口，臀不离垫",
  "rdl": "腰背有伤或腘绳紧：屈膝多一点、幅度小一点",
  "bss": "膝不稳：扶支撑物，前脚放稳再下",
  "leg-curl": "腘绳拉伤史：重量减半，全程控制、别弹震",
  "leg-ext": "膝前痛（髌股）：减小幅度、减轻重量",
  "calf-raise": "跟腱痛：先做坐姿（比目鱼肌）版本，别弹震",
  "front-squat": "腕／肩前侧受限：改交叉臂或拉力带握法",
  "lunge": "膝前痛：步幅缩短，重心别前冲",
  "hip-thrust": "腰椎过伸：收下巴、肋骨下沉，顶端别塌腰",
  "glute-bridge": "腰不适：顶点停 2 秒用臀发力，别用腰顶",
  "cable-kickback": "髋前侧紧：幅度小而稳，别甩腿",
  "band-walk": "膝内扣：弹力带套膝上方，速度放慢",
  "bb-curl": "手腕／肘痛：改 EZ 杆或哑铃，别用惯性甩",
  "hammer-curl": "肘外侧痛（网球肘）：减轻重量、放慢离心",
  "incline-curl": "肩前侧拉伸不适：凳角降到 45°",
  "pushdown": "肘痛：肘固定在体侧，别用肩发力",
  "skull-crusher": "肘部不适：改绳索过顶版本，幅度减半",
  "overhead-ext": "肩活动度不足：改单臂并减小幅度",
  "plank": "腰痛：改膝盖着地版本，别塌腰",
  "hanging-leg-raise": "肩／握力不足：改仰卧举腿，避免身体摆动",
  "cable-crunch": "腰椎屈曲不适：幅度小，别用髋部下拉",
  "dead-bug": "腰痛：只做对侧手脚，腰始终贴地",
  "side-plank": "肩不稳：改膝盖着地版本",
  "ab-wheel": "腰痛／核心不足：先做跪姿小幅度或靠墙版",
  "kb-swing": "腰背有伤：先练髋铰链（壶铃硬拉），别用手臂提",
  "farmer-carry": "肩／握力不足：重量减半、缩短距离",
  "burpee": "膝踝冲击敏感：改无跳跃版本（走步起立）",
  "bw-squat": "膝前痛：蹲到不痛的深度，节奏放慢",
  "wall-sit": "膝前痛：膝角别小于 90°，时间减半",
  "reverse-lunge": "平衡差：扶墙或椅背",
  "band-row": "肩后侧不适：固定牢弹力带，别让它回弹抽到身体",
  "band-chest-press": "肩前侧不适：别让弹力带压到腋下（神经）",
  "band-pull-apart": "颈肩紧：幅度到肩胛收紧即可",
  "single-leg-glute-bridge": "平衡／腰不稳：扶地或先做双脚版",
  "bird-dog": "腰痛：只伸手或只伸腿，别同时伸直",
  "russian-twist": "腰椎旋转痛：改死虫，别加负重",
  "side-lying-leg-raise": "髋外侧紧：幅度小，脚别向后翻"
};
