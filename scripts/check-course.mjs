import {build} from 'esbuild';
import fs from 'node:fs';import assert from 'node:assert/strict';
fs.mkdirSync('outputs',{recursive:true});
await build({stdin:{contents:"export * from './src/atlas';export * from './src/courseCatalog'; export {models,defaults,result,fmt} from './src/physics'",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'outputs/course-check.mjs'});
const {atlasEntries,experimentForModel,nodes,relations,project,models,defaults,result,fmt}=await import('../outputs/course-check.mjs');
const topics=JSON.parse(fs.readFileSync('src/topics.json','utf8')),cases=JSON.parse(fs.readFileSync('src/cases.json','utf8')),lessons=JSON.parse(fs.readFileSync('src/calendar.json','utf8'));
const projectData=JSON.parse(fs.readFileSync('src/projects.json','utf8'));assert.equal(new Set(nodes.map(n=>n.id)).size,topics.length+projectData.length+9);assert.equal(nodes.filter(n=>n.kind==='topic').length,topics.length+projectData.length);
for(const p of projectData){assert.ok(nodes.some(n=>n.id==='project-'+p.id));const edges=relations.filter(r=>r.to==='project-'+p.id);assert.equal(edges.length,p.models.length);for(const m of p.models)assert.ok(edges.some(e=>topics.find(t=>t.id===e.from)?.model===m));}
for(const name of ['CourseTree.tsx','KnowledgeGraph.tsx'])assert.ok(fs.readFileSync('src/'+name,'utf8').includes('courseCatalog'),name+' must share the course/project catalog');
for(const t of topics){assert.ok(cases[t.model],t.id+' missing case');for(const field of ['title','background','mapping','challenge'])assert.ok(cases[t.model][field]?.length>8,t.id+' '+field);assert.ok(models[t.model]);}
for(const [k,m] of Object.entries(models)){const v={...defaults(m),...m.preset};assert.ok(cases[k]);for(const p of m.params)assert.ok(v[p.key]>=p.min&&v[p.key]<=p.max,k+' preset');assert.ok(result(k,v).length);}
for(const r of relations){assert.ok(nodes.some(n=>n.id===r.from)&&nodes.some(n=>n.id===r.to),r.label);assert.ok(r.detail&&!r.detail.includes('undefined'));}
for(const yaw of [0,1,3,6])for(const pitch of [0,.5,1.25])for(const n of nodes){const p=project(n,{yaw,pitch,zoom:.4,panX:0,panY:0},1200,700);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.scale>0);}
assert.equal(lessons.length,24);assert.equal(new Set(lessons.map(l=>l.date)).size,24);for(const l of lessons){const [y,m,d]=l.date.split('.').map(Number);assert.equal(new Date(y,m-1,d).getDate(),d);}
const main=fs.readFileSync('src/main.tsx','utf8'),lab=fs.readFileSync('src/Lab.tsx','utf8'),header=fs.readFileSync('src/Header.tsx','utf8');assert.ok(!/configure|Account|Admin|api/.test(main));assert.ok(!/Comments/.test(lab));assert.ok(!/#\/account|#\/admin/.test(header));
console.log(`PASS: ${topics.length} topics, ${Object.keys(cases).length} cases, ${relations.length} explained relations, 24 valid dates; static-only entry.`);

const projects=JSON.parse(fs.readFileSync('src/projects.json','utf8'));
assert.equal(new Set(projects.map(p=>p.id)).size,projects.length);
assert.equal(new Set(projects.map(p=>p.field)).size,projects.length);
for(const p of projects){assert.equal(p.models.length,3);for(const m of p.models){assert.ok(models[m],p.id+' unknown model');assert.ok(topics.some(t=>t.model===m),p.id+' missing experiment');}for(const k of ['background','mapping','challenge'])assert.ok(p[k].length>40,p.id+' insufficient project context');}
for(const [n,expected] of [[1.592,'1.6'],[.005,'5.0e-3'],[1,'1.0'],[0,'0.0'],[-.005,'-5.0e-3'],[1234,'1.2e+3'],[.0999,'0.10']])assert.equal(fmt(n),expected);
console.log(`PASS: ${projects.length} cross-domain projects, ${projects.reduce((n,p)=>n+p.models.length,0)} valid experiment links, two-significant-digit edge cases.`);

for(const p of projects){const node=atlasEntries.find(n=>n.id==='project-'+p.id);assert.equal(node.href,'#/cases?project='+p.id);for(const m of p.models)assert.ok(relations.some(r=>r.to===node.id&&r.from===experimentForModel(m).id));}
assert.equal(new Set(atlasEntries.map(n=>n.href)).size,atlasEntries.length);
console.log('PASS: shared project links and experiment entry points match across atlas and case pages.');

await import('./check-lens.mjs');

await import('./check-comparisons.mjs');
