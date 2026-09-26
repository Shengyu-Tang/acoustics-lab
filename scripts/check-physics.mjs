import assert from 'node:assert/strict';
import {models,defaults,result,freeX,reflection,oblique,pistonD} from '../src/physics.ts';
import fs from 'node:fs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
near(result('free',{m:4,k:100})[0][1],Math.sqrt(100/4)/(2*Math.PI));
for(const z of [0,.2,1,1.5,2]){near(freeX({m:1,k:100,z},0),.01);if(z>0)assert.ok(Math.abs(freeX({m:1,k:100,z},10))<1e-8)}
for(const q of [.0001,.01,1,4,100,4000]){const r=reflection(q);near(r.R+r.T,1);near(1+r.r,r.t)}
for(const angle of [0,20,50,80]){const a=oblique({angle,ratio:1.5,q:2});near(a.R+a.T,1)}
near(result('levels',{L1:60,L2:60,ref:20})[0][1],63.0102999566,1e-8);
near(result('guide',{H:20,n:2,f:100})[0][1],75);
assert.ok(Number.isNaN(result('guide',{H:20,n:2,f:50})[1][1]));
near(pistonD(0),1);near(pistonD(3.831705970),0,1e-8);
const s1=result('scatter',{a:.01,f:1000})[1][1],s2=result('scatter',{a:.01,f:2000})[1][1];near(s2/s1,16);
near(result('absorption',{alpha:.001,r:1000})[1][1],20/Math.LN10);
const topics=JSON.parse(fs.readFileSync('src/topics.json','utf8'));assert.equal(topics.length,82);assert.equal(new Set(topics.map(t=>t.id)).size,82);
for(const t of topics){assert.ok(models[t.model],t.id);const m=models[t.model];for(const config of [defaults(m),{...defaults(m),...m.preset}]){for(const p of m.params)assert.ok(config[p.key]>=p.min&&config[p.key]<=p.max,`${t.id} ${p.key}`);assert.ok(result(t.model,config).length,t.id);}}
console.log('PASS: 82 topics mapped; model limits, oscillator decay, energy conservation, levels, cutoff, Bessel root, scattering scaling and absorption.');
