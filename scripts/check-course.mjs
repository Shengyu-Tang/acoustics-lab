import {build} from 'esbuild';
import fs from 'node:fs';import assert from 'node:assert/strict';
fs.mkdirSync('outputs',{recursive:true});
await build({stdin:{contents:"export * from './src/atlas'; export {models,defaults,result} from './src/physics'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'outputs/course-check.mjs'});
const {nodes,relations,project,models,defaults,result}=await import('../outputs/course-check.mjs');
const topics=JSON.parse(fs.readFileSync('src/topics.json','utf8')),cases=JSON.parse(fs.readFileSync('src/cases.json','utf8')),lessons=JSON.parse(fs.readFileSync('src/calendar.json','utf8'));
assert.equal(new Set(nodes.map(n=>n.id)).size,91);assert.equal(nodes.filter(n=>n.kind==='topic').length,82);
for(const t of topics){assert.ok(cases[t.model],t.id+' missing case');for(const field of ['title','background','mapping','challenge'])assert.ok(cases[t.model][field]?.length>8,t.id+' '+field);assert.ok(models[t.model]);}
for(const [k,m] of Object.entries(models)){const v={...defaults(m),...m.preset};assert.ok(cases[k]);for(const p of m.params)assert.ok(v[p.key]>=p.min&&v[p.key]<=p.max,k+' preset');assert.ok(result(k,v).length);}
for(const r of relations){assert.ok(nodes.some(n=>n.id===r.from)&&nodes.some(n=>n.id===r.to),r.label);assert.ok(r.detail&&!r.detail.includes('undefined'));}
for(const yaw of [0,1,3,6])for(const pitch of [0,.5,1.25])for(const n of nodes){const p=project(n,{yaw,pitch,zoom:.4,panX:0,panY:0},1200,700);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.scale>0);}
assert.equal(lessons.length,24);assert.equal(new Set(lessons.map(l=>l.date)).size,24);for(const l of lessons){const [y,m,d]=l.date.split('.').map(Number);assert.equal(new Date(y,m-1,d).getDate(),d);}
const main=fs.readFileSync('src/main.tsx','utf8'),lab=fs.readFileSync('src/Lab.tsx','utf8'),header=fs.readFileSync('src/Header.tsx','utf8');assert.ok(!/configure|Account|Admin|api/.test(main));assert.ok(!/Comments/.test(lab));assert.ok(!/#\/account|#\/admin/.test(header));
console.log(`PASS: ${topics.length} topics, ${Object.keys(cases).length} cases, ${relations.length} explained relations, 24 valid dates; static-only entry.`);
