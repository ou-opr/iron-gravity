/* tools/art/atlas_extract.mjs —— 抽取 @emmorts/body-muscles 的路径数据，固化为仓库内静态数据文件 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const req = createRequire(import.meta.url);
const SRC = "C:/Users/OMEN/AppData/Local/hermes/cache/scratch/emm/package/dist/data/";
const front = req(SRC + "muscles.front.js");
const back = req(SRC + "muscles.back.js");
const groups = req(SRC + "muscle-groups.js");
const pack = (list) => list.map(function (m) { return { id: m.id, name: m.name, d: m.path }; });
const head = "/* assets/js/anatomy-atlas.js —— 肌群级解剖图静态数据（89 区域，前/后视图）\n * 来源：@emmorts/body-muscles v2.1.1 (npm)，许可 Apache-2.0；许可全文见 docs/licenses/body-muscles-LICENSE.txt\n * 修改说明：未改路径数据；仅保留 id/name/path 三字段；渲染器另见 assets/js/ex-art-atlas.js。\n */\nwindow.IG_ATLAS = {\n  front: " + JSON.stringify(pack(front.FRONT_MUSCLES)) + ",\n  back: " + JSON.stringify(pack(back.BACK_MUSCLES)) + "\n};\n";
writeFileSync("./assets/js/anatomy-atlas.js", head);
const ids = pack(front.FRONT_MUSCLES).map(function (m) { return m.id; }).join(",");
console.log("front:", pack(front.FRONT_MUSCLES).length, "back:", pack(back.BACK_MUSCLES).length);
console.log(ids);
