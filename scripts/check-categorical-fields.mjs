import fs from "node:fs";
import assert from "node:assert/strict";
import {build,stop} from "esbuild";
const files=fs.readdirSync("src/content/lectures");
await build({stdin:{contents:files.map((f,i)=>`export {default as l${i}} from './src/content/lectures/${f}';`).join('\n')+"export {matlab} from './src/plot/export';",resolveDir:process.cwd()},bundle:true,platform:"node",format:"esm",outfile:"outputs/categories.mjs"});stop();
const m=await import('../outputs/categories.mjs');let fields=0,categories=0;
files.forEach((_,i)=>{const l=m[`l${i}`]; for(const f of l.figures){const p=l.defaults??{M:10,D:395000,Rm:400,F0:50,n:1900};for(const panel of f.plot(p,0)){if(!panel.field)continue;fields++;const values=[...new Set(panel.field.z.flat().filter(Number.isFinite))];if(values.length>1&&values.length<=8){assert.ok(panel.field.categories,`${l.id} ${f.number}: discrete field needs categories`);categories++;assert.ok(values.every(v=>panel.field.categories.some(c=>c.value===v)));assert.ok(!/cb=colorbar/.test(m.matlab([panel],1,1,f.title)));}}}});
assert.ok(categories>0);console.log(`PASS categorical fields: ${fields} fields, ${categories} discrete maps use category legends without continuous colorbars.`);
