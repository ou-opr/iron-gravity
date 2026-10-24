# 维护手册 · MAINTENANCE

> **基线：v1.1.0（2026-10-24）**。仓库历史自 v1.0.0 重置起算，之后每次发版追加提交。
> 本文档说明「日常改什么、跑什么门禁、怎么发版、什么需要定期看」。

## 一、基线数字

| 项 | v1.1.0 |
|---|---|
| 跟踪文件 | 175 |
| `.git` | 约 950 KB |
| 页面 | 10 |
| 内容规模 | 60 动作 · 6 计划 · 8 主张 × 11 文献 · 60 注意人群 · 23 退阶 · 61 条教学视频 |
| 回归链 | 11 项（单测 37 项 · 冒烟 117 项 · axe 20 组合 = 10 页 × 深/浅） |
| 线上 | https://ou-opr.github.io/iron-gravity/ |

## 二、日常改动：改哪里 → 跑什么

| 想改什么 | 改哪里 | 必须跑 |
|---|---|---|
| 页面标题 / 描述 / 页脚第三列 | `pages.config.json` → `npm run build` | `npm test` |
| 导航 | `partials/nav.part.html` → `npm run build` | `npm test` |
| 新增 / 修改动作 | `assets/js/data-exercises-*.js`，同步 `data-muscles-map.js`（肌群映射）与 `data-evidence.js`（注意人群 / 退阶 / 视频） | `npm test` |
| 新增证据主张或文献 | `assets/js/data-evidence.js` 的 `IG_EVIDENCE`（PMID 必须实际核过） | `npm run validate` + `npm test` |
| 样式 / 布局 | `assets/css/style.css`（改完记得深色与浅色都看） | `npm test`（含 axe 双主题） |
| 换域名部署 | `node tools/set-domain.mjs <https://域名>` | `npm test` |

**改完至少跑 `npm test`**（= `node tools/check-all.mjs`，11 项）。
赶时间用 `npm run test:offline`：跳过联网外链与媒体验证，其余 9 项照跑。

单项速查：

```bash
npm run validate   # 只跑数据校验
npm run a11y       # 只跑无障碍（20 组合）
npm run check:build# 只校验页面是否与 partials 同步
node tools/unit-tests.mjs   # 只跑纯函数单测（27 项）
```

## 三、发版流程

```bash
# 1) 改版本号（唯一入口；sw.js 的 VERSION 由 build 从 package.json 注入）
#    package.json → version
npm run build

# 2) 更新 CHANGELOG.md（只写「新增 / 变更 / 修复」，别写流水账）
# 3) 提交
git add -A && git commit -m "release: v1.2.0"

# 4) 打 annotated tag 并推送
git tag -a v1.2.0 -m "iron gravity 1.2.0"
git push origin main --follow-tags

# 5) 建 Release（body 写文件，别塞进命令行）
gh release create v1.2.0 --title "1.2.0" --notes-file notes.md --verify-tag
```

- **不要**用 `gh release delete --cleanup-tag`：它会连本地 tag 一起删，之后 `git push origin <tag>` 会报 `src refspec does not match any`。
- 版本语义：结构性变化 → 主版本；功能/内容增量 → 次版本；只修 bug → 修订号。

## 四、定期维护

| 频率 | 做什么 | 怎么查 |
|---|---|---|
| 每月 1 日 | 外链 + 媒体链接自动复检 | CI `verify.yml` 的 schedule；去 Actions 看有没有红 |
| 每季度 | 抽查 5 条教学视频（创作者会删视频 / 设私有） | `node tools/check-media.mjs`（oEmbed 200 才算活着） |
| 有新证据时 | 更新 `IG_EVIDENCE` 并记进 CHANGELOG | 改完 `npm run validate` |
| 内容过时时 | 动作要点 / 注意人群 / 退阶路径 | 无自动检查，靠人工判断 |

## 五、已知遗留（都是有意为之）

- **过程截图不入库**：`docs/screenshots/` 只有 README 引用的 3 张 webp 进版本库，其余 99 张在 `.gitignore` 里（文件仍在磁盘）。新截图默认不进 git，需要时 `git add -f`。
- **`.git` 582KB**：历史已重置为单提交，旧的 21MB 截图不再存在于任何提交里。
- **备份**：`D:\健身\_backup\iron-gravity-history-*.bundle` 是重置前的完整历史（19MB），确认不再需要可删。
- **`tools/fix-*.mjs`**：v12 时期的一次性修复脚本，保留作历史记录，不参与回归链。
- **`docs/legacy/`**：退役的样板页，不参与发布。

## 六、CI 与部署

| 工作流 | 触发 | 内容 |
|---|---|---|
| `verify.yml` | push / PR（离线项）+ 每月 1 日（联网项） | 语法 / 单测 / 构建一致性 / 几何 / 映射 / 自测 / 校验 / 外链 / 媒体 / 冒烟 / axe |
| `pages.yml` | push main | rsync 排除 `tools/ docs/ partials/ .github/` 后发布到 GitHub Pages |

部署是自动的：推到 `main` 就会重新发布站点。canonical / og:image / sitemap / robots 已指向 `https://ou-opr.github.io/iron-gravity`。
