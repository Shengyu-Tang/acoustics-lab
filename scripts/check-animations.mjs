import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';import katex from 'katex';import {createRequire} from 'node:module';
fs.mkdirSync('outputs',{recursive:true});
await build({stdin:{contents:"export {default as Simulation} from './src/Simulation';export * from './src/animationPhysics';export {models,defaults} from './src/physics';export {createElement} from 'react';export {renderToStaticMarkup} from 'react-dom/server';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:'outputs/animation-check.cjs'});
const {Simulation,sceneState,forcedTrace,models,defaults,createElement,renderToStaticMarkup}=createRequire(import.meta.url)('../outputs/animation-check.cjs');
const equations=JSON.parse(fs.readFileSync('src/equations.json','utf8'));let count=0;const missing=[];
for(const [kind,m] of Object.entries(models)){
 assert.ok(equations[kind],kind+' equations');for(const tex of equations[kind])assert.ok(!katex.renderToString(tex,{throwOnError:true,trust:false}).includes('katex-error'));
 for(const param of m.params){const values=[param.min,param.max];const svg=values.map(value=>{const v={...defaults(m),[param.key]:value};const s=sceneState(kind,v);assert.ok(s.family,kind+' family');for(const name of ['f','c','amp','size','distance','power','wavelength'])assert.ok(Number.isFinite(s[name]),kind+' '+param.key+' '+name);const html=renderToStaticMarkup(createElement(Simulation,{kind,v}));assert.ok(!/NaN|undefined/.test(html),kind+' invalid SVG');return html.match(/<svg[\s\S]*?<\/svg>/)[0];});if(svg[0]===svg[1])missing.push(kind+'.'+param.key);count++}
}
assert.deepEqual(missing,[],'Every parameter must have visible quantitative feedback, even if normalized shape is invariant');
const v={m:1,k:100,z:0,ratio:1},trace=forcedTrace(v);for(const t of [.2,1,3,6])assert.ok(Math.abs(trace[Math.round(t/.002)]-t*Math.sin(10*t)/20)<1e-6,'undamped resonant growth');
console.log(`PASS: ${Object.keys(models).length} model equation sets; ${count} parameter min/max SVG and finite scene-state checks; resonant transient matches analytic solution.`);
