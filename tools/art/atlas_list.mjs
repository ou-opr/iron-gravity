/* tools/art/atlas_list.mjs —— 打印 back 视图 id 列表（供映射参考） */
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const back = req("C:/Users/OMEN/AppData/Local/hermes/cache/scratch/emm/package/dist/data/muscles.back.js").BACK_MUSCLES;
console.log(back.map(function (m) { return m.id; }).join(","));
