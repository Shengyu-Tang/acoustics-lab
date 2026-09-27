import {build} from 'esbuild';import assert from 'node:assert/strict';import fs from 'node:fs';
await build({entryPoints:['src/comparisonPhysics.ts'],bundle:true,platform:'node',format:'esm',outfile:'outputs/comparison-check.mjs'});
const {layer,layerPressure,arrayFactor,gratingAngles,duct,ductModes,ductShape,besselJ,comparisonCatalog}=await import('../outputs/comparison-check.mjs');
const near=(a,b,e=1e-9)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
near(layer({q:4,s:16,h:.25}).T,1);near(layer({q:4,s:16,h:.5}).T,64/289);near(layer({q:4,s:16,h:0}).T,64/289);
for(const q of [.2,1,4,20])for(const s of [.2,1,16,20])for(const h of [0,.005,.25,.5,.995,1]){const v={q,s,h},a=layer(v);near(a.R+a.T,1);assert.ok(a.T>=0&&a.T<=1+1e-12);for(const x of [0,h]){const left=layerPressure(x-1e-8,v),right=layerPressure(x+1e-8,v);near(left[0],right[0],1e-5);near(left[1],right[1],1e-5);}}
for(const N of [2,8,16])for(const d of [.1,.5,1.5,2])for(const steer of [-60,0,60]){const v={N,d,steer};near(Math.hypot(...arrayFactor(Math.sin(steer*Math.PI/180),v)),1);for(const u of [-1,-.5,0,.5,1])assert.ok(Math.hypot(...arrayFactor(u,v))<=1+1e-12);for(const angle of gratingAngles(v))near(Math.hypot(...arrayFactor(Math.sin(angle*Math.PI/180),v)),1);}
for(const u of [-1,-.7,0,.3,1])near(Math.hypot(...arrayFactor(u,{N:2,d:.5,steer:0})),Math.abs(Math.cos(Math.PI*.5*u)));
assert.equal(gratingAngles({N:8,d:.5,steer:60}).length,0);assert.equal(gratingAngles({N:8,d:1.5,steer:0}).length,2);
for(let mode=0;mode<ductModes.length;mode++){const {n,beta}=ductModes[mode];near(n===0?-besselJ(1,beta):(besselJ(n-1,beta)-besselJ(n+1,beta))/2,0,1e-10);const d=duct({mode,a:.2,f:800}),large=duct({mode,a:.4,f:800});near(d.fc,2*large.fc);for(const a of [.05,.5])for(const f of [50,4000]){const v={mode,a,f};assert.ok(Object.values(duct(v)).filter(x=>typeof x==='number').every(Number.isFinite));assert.ok(Number.isFinite(ductShape(0,0,v)));}if(mode){assert.equal(duct({mode,a:.2,f:d.fc*.8}).state,'倏逝');assert.equal(duct({mode,a:.2,f:d.fc*1.2}).state,'传播');assert.equal(duct({mode,a:.2,f:d.fc}).state,'截止');}}
near(duct({mode:0,a:.2,f:50}).cg,340);near(ductShape(.8,2,{mode:0}),1);
const topics=JSON.parse(fs.readFileSync('src/topics.json','utf8'));for(const c of comparisonCatalog){assert.ok(topics.some(t=>t.id===c.topic&&c.models.includes(t.model)));for(const m of c.models)assert.ok(topics.some(t=>t.model===m));}
for(const file of ['Lab.tsx','Projects.tsx','KnowledgeGraph.tsx','CourseTree.tsx'])assert.ok(fs.readFileSync('src/'+file,'utf8').includes('ComparisonLinks'),file+' lacks comparison entry');
console.log('PASS: matching-layer conservation, interface pressure continuity, array singularities and grating lobes, circular rigid-wall modes and cutoff, four-module comparison links.');
