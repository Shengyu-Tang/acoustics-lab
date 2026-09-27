import assert from 'node:assert/strict';import {build} from 'esbuild';import katex from 'katex';import fs from 'node:fs';
await build({stdin:{contents:"export * from './src/lensPhysics';export {pistonD} from './src/physics';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'outputs/lens-check.mjs'});
const {lensPattern,lensDefaults,residualPhase,pistonD}=await import('../outputs/lens-check.mjs');const v=lensDefaults,ideal=lensPattern({...v,correction:1},true),plain=lensPattern({...v,correction:0}),corrected=lensPattern(v);
assert.ok(Math.abs(ideal.axis-1)<1e-10);assert.ok(ideal.rms<1e-9);
for(let i=0;i<361;i++){const angle=(i/2-90)*Math.PI/180,ka=2*Math.PI*v.frequency*1000/1500*v.diameter/200;assert.ok(Math.abs(ideal.values[i]-Math.abs(pistonD(ka*Math.sin(angle))))<.00015,'ideal circular aperture mismatch');}
assert.ok(corrected.power>plain.power);assert.ok(lensPattern({...v,rings:24}).rms<lensPattern({...v,rings:2}).rms);
assert.deepEqual(lensPattern({...v,correction:0,rings:2}).values,lensPattern({...v,correction:0,rings:24}).values);
assert.ok(lensPattern({...v,diameter:18,correction:1},true).width<lensPattern({...v,diameter:6,correction:1},true).width);
assert.equal(lensPattern({...v,range:20}).footprint,corrected.footprint*2);
assert.equal(residualPhase(.4,{...v,frequency:40}),2*residualPhase(.4,{...v,frequency:20}));
for(const patch of [{frequency:20},{frequency:45},{diameter:6},{diameter:18},{aberration:0},{aberration:5},{correction:0},{correction:1.5},{rings:2},{rings:24},{range:2},{range:50}]){const s=lensPattern({...v,...patch});for(const n of [...s.values,...s.real,...s.imag,s.axis,s.power,s.rms])assert.ok(Number.isFinite(n));assert.ok(s.axis<=1+1e-10);assert.ok(s.width===null||s.width>0&&s.width<=180);}
const eq=JSON.parse(fs.readFileSync('src/equations.json','utf8'));for(const tex of eq['grin-lens'])katex.renderToString(tex,{throwOnError:true,trust:false});
console.log(`PASS: GRIN model matches ideal aperture; phase compensation, ring convergence, wavelength scaling and footprint verified. Default widths: ${plain.width} -> ${corrected.width} deg.`);
