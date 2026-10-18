# 铁引力 IRON GRAVITY · 仓库分类索引（docs/INDEX.md）

> **当前状态（1.0.0，2026-10-18）**：站点本体约 520KB（10 页 HTML + assets）；`docs/screenshots` 过程留档另计 20.8MB。
> 回归基线（1.0.0）：`node tools/check-all.mjs` → 语法 42 ✓ / 单元测试 27 ✓ / 构建一致性 ✓ / 几何 ✓ / MAP CHECK PASS / 服务器自测 18 ✓ / 校验 ✓（60 动作·8 主张·11 文献·60 注意人群·23 退阶·60 视频）/ 外链 64·0 / **媒体验证 72 条（61 视频 oEmbed + 11 PMID）·0** / 冒烟 **112 项失败 0** / **axe 20 组合（10 页 × 深/浅）violations=0**，共 **11 项**。CI 见 `.github/workflows/verify.yml`。
> 相关文档：根 `README.md`（怎么用/怎么维护/怎么部署）· `docs/PLAN.md`（方案与逐版自审）· `docs/REVIEW-FIXES.md`（外部评审台账）· `docs/screenshots/MANIFEST.md`（截图清单）· `docs/ATTRIBUTION.md`（许可）
> **版本口径**：对外只发过 **1.0.0**。1.0.0 之前有 5 轮内部迭代（内部编号 v14 → v18），内容已全部并入 1.0.0；那几轮的记录见 `CHANGELOG.md` 的「开发期迭代记录」，本文档不再标注内部编号。

> v12 说明：外部评审修复台账见 `docs/REVIEW-FIXES.md`（P0×2 / P1×5 / P2×8 逐条核验与处理：修 13 项、评审判定有误 1 项（`.mbox.err` 实为在用）、有意保留 1 项（动态模板内联样式））；
> 新增站点级文件 `robots.txt`、`sitemap.xml`，工具 `tools/fix-review-p2.mjs`（og/apple meta + defer + manifest 相对路径，幂等可复跑）。
> v12.1 追加：`tools/audit-css-a11y.mjs`（CSS 变量一致性 / 未使用类 / 逐页无障碍静态审计）、`tools/fix-a11y-v12.mjs`（跳过链接、aria-* 、内联样式归一，幂等）。

> 结构变更（随 1.0.0 发布）：整个仓库（含 `.git` 历史）装在 **`iron gravity/`** 里——外层 `D:\健身\` 只是容器。仓库根 = 本目录，因此 `.github/`、`README.md`、`LICENSE`、`.gitattributes`、`.gitignore` 都在这里；站内相对路径与全部脚本（用 `import.meta.url` 定位）不受影响，CI 也不再需要 working-directory 前缀。
> 迁移记录：2026-10-15 本仓库已从 `C:\Users\OMEN\hermes-workspace\fitness-site\` 迁至 **`D:\健身\`**（`diff -rq` 逐文件零差异后确认）。仓库内全部脚本为相对路径，任何位置可直接运行；站点双击 `index.html` 即用、零依赖、离线。
> 本索引按「用途分类」归纳全仓文件；**加粗**目录 = 功能主链路（删任何一个都会断功能）。

## 一、站点页面（根目录 10 页 + 站点级文件，功能主链路）
| 文件 | 用途 |
|---|---|
| `index.html` | 首页（统计卡、今日动作、本周打卡、7 个模块入口） |
| `exercises.html` | 动作库（四行筛选含**肌群筛选**、搜索、收藏、排序、练前热身序列） |
| `detail.html` | 动作详情（**默认面板=肌群级 atlas**，`?panel=part` 回退部位级；`?placard=0` 关说明牌层；`?wipe=1` 两帧擦拭对比（实验）；肌群图例可点、同肌群推荐、导出说明牌 SVG） |
| `muscles.html` | **肌群总览（v11.1）**：7 个肌群族各一张肌群级解剖图 + 该族动作清单 + 直达筛选（`?fam=背` 锚点直达） |
| `plans.html` | 训练计划 + 我的课表（克隆/就地编辑） |
| `nutrition.html` | 饮食建议 + 一日食谱生成器 |
| `videos.html` | 教学视频（只链不搬，64 外链有兜底） |
| `log.html` | 日志（打卡/体测/月历/打印周报/趋势 4 图） |
| `glossary.html` | 术语表 + 12 条 FAQ（运行时注入 FAQPage JSON-LD） |
| `evidence.html` | **证据与来源**：8 主张 × 11 文献（PMID 可核）、A/B/C 等级口径、「哪些内容不是循证的」 |
| `sw.js` | Service Worker：页面 network-first / 资源 stale-while-revalidate；仅 http(s) 注册；`VERSION` 由 `package.json` 注入 |
| `partials/` + `pages.config.json` + `tools/build-pages.mjs` | **最小构建层**：`nav.part.html` / `footer.part.html` 与页面配置是唯一来源，幂等注入 10 页；`--check` 供 CI |
| `package.json` / `.github/workflows/verify.yml` | npm scripts 与 CI（push/PR 门禁 + 每月外链复检） |
| `robots.txt` / `sitemap.xml` | 部署用（屏蔽 docs/tools；`tools/set-domain.mjs` 一键换域名，sitemap 已 10 条） |
| `serve.cmd` | 一键启动本地服务器并开浏览器 |
| `README.md`（根） | 项目说明（v12 已重写为准确版） |

## 二、数据层 `assets/js/data-*.js`（功能主链路）
`data-exercises-a~f`（60 动作）· `data-plans-a~d`（6 计划）· `data-nutrition-a~b` · `data-videos-a~d` · `data-glossary-a~b` · `data-warmup.js`（8 步热身）· `data-portions.js`（30 份量锚点）· **`data-muscles-map.js`（60 动作→肌群映射，atlas 的数据源，`map_check` 守着 0 非法 id）**

## 三、图层与逻辑 `assets/js/`（功能主链路）
- `app.js` —— 全站逻辑（渲染/存储/主题/周容量/退阶/上次记录提示/休息计时器/atlas 默认面板+懒渲染）
- `calc.js` —— **纯函数**：BMR / 目标热量 / 宏量 / Epley 1RM / 百分比表 / 周起始 / 容量统计；`app.js` 与 `tools/unit-tests.mjs` 共用同一份实现
- `data-evidence.js` —— **证据**：8 主张 + 11 文献（PMID 已核）+ 60 条注意人群 + 23 条退阶路径 + **60/60 动作教学视频**（每条 oEmbed 核验）
- **`ex-art-placard.js`** —— 23 个动作帧模板（两帧·黑底白线）+ 8 部位级面板 + `keyFor` 映射
- **`ex-art.js`** —— v6 剪影兜底层（可整体关闭，删文件即回退）
- **`ex-art-atlas.js` + `anatomy-atlas.js`** —— 肌群级解剖（89 区域数据，Apache-2.0，41KB）
- ~~`data-art-ai.js`~~（已删，AI 层 2026-10-15 移除）

## 四、样式与 PWA `assets/css/`（功能主链路）
`style.css`（深浅双主题 / 图层布局 / 打印周报 @media print 独占）；`manifest.json` + `assets/img/`（favicon 512/192 图标）。

## 五、许可与文档 `docs/`
- **`ATTRIBUTION.md`** —— 图源许可盘点（OpenStax NC-SA 拒引 / Everkinetic SA 传染拒引 / 厂商版权拒引；@emmorts/body-muscles 已引入；AI 层已移除的历史记录）
- **根 `LICENSE`** —— 双许可：代码 MIT + 站点文字 CC BY-NC 4.0 + 第三方资源清单
- **`REVIEW-FIXES.md`** —— 外部评审（70/100、80/100）台账：P0/P1/P2 逐条核验与处理 + v12.1 无障碍·代码质量轮 + **v16 产品闭环轮**
- **`licenses/body-muscles-LICENSE.txt`** —— Apache-2.0 全文（随仓分发，必须保留）
- **`PLAN.md`** —— 规划与各版本自审（v1–v8 节）
- **本索引 INDEX.md**

## 六、截图存档 `docs/screenshots/`（98 个文件 / 20.8MB，过程留档，**不参与站点加载**）
逐文件清单见 **`docs/screenshots/MANIFEST.md`**（按 `art-*/atlas-*/frames-*/v11-*/v12-*/…` 分组，含用途、大小与时间）。
部署时可整目录排除。全部截图由独立临时配置的无头 Chrome 渲染本地页面生成（不动用户浏览器/桌面）。

## 七、工具 `tools/`
| 文件 | 类别 | 说明 |
|---|---|---|
| **`check-all.mjs`（一键）** | **入口脚本** | `node tools/check-all.mjs` = 语法→**单元测试**→构建一致性→几何→映射→自测→校验→外链→冒烟→axe（共 10 项）；`--no-links` / `--no-a11y` 可裁剪；纯 Node，跨平台 |
| `build-pages.mjs` | **构建层** | 把 `partials/*` 与 `pages.config.json` 同步进 10 页的 head/nav/footer；幂等；`--check` 供 CI |
| `a11y-audit.mjs` / `a11y-run.html` | **无障碍实测** | axe-core 4.10.2 × 10 页 × **深/浅 2 主题** = 20 组合，WCAG 2.1 A/AA；缺 `axe.min.js` 自动下载；`--json` 出报告；输出 `themeActual` 证明主题生效 |
| `set-domain.mjs` | **部署** | 一键替换 canonical / og:image / sitemap / robots；幂等 |
| `lib/chrome.mjs` | 基础设施 | 跨平台 Chrome 定位 + headless DOM 导出（`$CHROME` → 常见路径 → PATH） |
| `check-media.mjs` | **媒体验证（新增）** | `data-evidence.js` 里的链接不经过 HTML，`check-links` 扫不到：61 条视频走 YouTube oEmbed（200 = 存在且可嵌入，并比对标题）、11 篇文献走 NCBI esummary 批量核对；退出码 1 表示有链接失效 |
| `unit-tests.mjs` | **单元测试（新增）** | `assets/js/calc.js` 的 27 项断言（BMR / 目标热量 / 宏量 / Epley 1RM / 百分比表 / 周起始跨年 / 容量口径）；`node:assert`，零框架 |
| `validate.mjs / selftest.mjs / check-links.mjs / serve.mjs / serve.cmd / smoke.html` | **常规测试链路** | 每批必跑（冒烟**112 项**断言；外链 64 条，限流串行复核；selftest **18** 个目标） |
| `check-all.sh` | 兼容入口 | 内部转 `node tools/check-all.mjs`；`bash tools/check-all.sh review` 仍可重出图示复核图 |
| `audit-css-a11y.mjs` | **质量审计（新增）** | CSS 变量定义/使用一致性（防 `--fg` 类事故）、未使用类检测、逐页无障碍静态项 |
| `fix-review-p2.mjs` / `fix-a11y-v12.mjs` | **批量修复器（v12 新增，幂等可复跑）** | 前者：og·apple meta / 外部脚本 defer / manifest 相对路径；后者：跳过链接、`#main`、图标 aria-hidden、aria-live、内联样式归一 |
| `art/map_check.mjs / export_ids.mjs / export_panels.mjs / template-map.json` | **图示生产链路** | 映射校验（60/60 覆盖+0 非法） |
| `art/angle_check.mjs / frames-only.html / atlas-review.html` | **图示复核工具** | 几何断言（23.1°/15.6°）、隔离页与肌群面板 12 格复审样张（atlas-demo 已归档进 dev/） |
| `art/atlas_extract.mjs / atlas_list.mjs / atlas_probe.mjs` | 一次性开发脚本 | 抽取 @emmorts 数据用（跑过即退役，`

可在任何**新**终端随时重跑取证） |
| `art/build_sheet.py / contact_sheet.py / shrink_sheet.py / crop_row.py / crop_rows.py / tall_split.py` | 审图工具 | 拼图/缩小/切列（vision 限额配合用；`crop_rows.py` 为按行截图裁剪） |
| `art/map_check.mjs / map_templates.mjs / export_ids.mjs / export_panels.mjs / exercises.json / template-map.json` | 图示数据 | 映射校验与导出（60/60 覆盖 + 0 非法 id） |
| **线稿自检自评循环（v10）** | 流程 | ① `frames-only.html` 截图 → ② `tall_split.py` 切列控高 → ③ `vision_analyze` 按「人体形态/姿势/器械/线条质感 ×10 分制」逐格打分 → ④ 重绘最低分项（共享件：`head()` 椭圆头+下颌、`limb()` 双线肢体、`pad()` 圆角垫、`stack()` 配重片组、`pulley()`/`cable()` 滑轮缆绳、`plate2()` 杠铃片、`foot()`）→ ⑤ 再截图再评，直至均分达标。**已完成 R1–R4 全量 23/23 模板**（均分轨迹：基线 6.75 → R1 6.78 → R2 8.2 → R3 7.78 → R4 7.80；跨轮分数仅在同尺度下可比） |
| `art/gen_art.py / gen-log.jsonl / list_ids.py` | 退役管线 | 魔搭 AI 生成管线（技能可复用，站点不再依赖其产物） |
| `docs/legacy/*.html`（原 `tools/art/dev/`） | **退役演示页归档** | v5–v7 的图示方案对比样板（线稿 POC / atlas 12 格 / 帧模板 / 23 模板样张），不参与站点与任何脚本；路径已按新位置修正，见 `docs/legacy/README.md` |
| `link-report.json` | 检查产物 | check-links 的输出样本 |

## 八、已知读图分歧（保留实现 + 证据，按几何/源码为准）
| 案例 | 视觉判读 | 源码事实 | 处置 |
|---|---|---|---|
| `pulldown` / `seatrow` 标签 | 拼图上读成"引体向上 / 坐姿推举" | 演示页与实际站点标签为 `高位下拉` / `坐姿绳索划船`（`frames-only.html` 的 keys 表） | 降采样图判读不做依据，不回改 |
| `calf` 机架与提踵 | 连判 4 轮说"横把连到腰部、无站台、两帧无高度差" | 源码（v10.3 机架已镜像到人体左侧）：横把 `M(cx-16) 58H(cx+22)` + 肩垫 `pad(cx+20,52,…)`（y=58=肩线）；站台 `M(cx-66) 152h116`（4px 加厚）+ 帧底地面线 `M40 158h132`；两帧躯干 52–94 vs 42–84（差 10px）、高帧含趾着台路径 `M312 126l14 24` | 保留实现；DOM 客观核验（dump-dom 三段路径各命中 1 处）+ 证据 `docs/screenshots/calf-v3.png` |

> 口径来源：技能 `svg-line-art-figures` 的「视觉模型误读两类应对」——先说"没画出来"的用 DOM/隔离页证伪，先说"位置不对"的先几何核对；确属读图失真的保留原实现并留存全尺寸证据。

## 九、已清理的中间产物（2026-10-15，按欧欧指示）
`tools/art/raw/`（18 张 AI 原稿第二份，13.7MB）、`tools/art/refs/`（4 张版权照片，2.3MB）、`tools/art/pose-bench.png`（0.3MB）、`tools/art/ref_crop.png`（0.1MB）——**全部删除**，累计释放约 16.5MB（30.4MB→13.9MB）。说明牌参考照原件仍在 Hermes 缓存目录（`...\hermes\cache\scratch\resume\refs\`），并未丢失。保留：`docs/screenshots/`（过程留档）、`docs/legacy/`（演示页归档，v15 从 `tools/art/dev/` 迁入）、退役管线脚本。
