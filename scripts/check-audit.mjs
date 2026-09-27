import assert from 'node:assert/strict';
import {build} from 'esbuild';
await build({stdin:{contents:"export * from './src/fieldPhysics';export * from './src/physics';export * from './src/comparisonPhysics';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'outputs/audit-check.mjs'});
const {interfaceField,interfacePressure,dopplerFronts,j1,result,models,defaults,ductPressure,duct}=await import('../outputs/audit-check.mjs');
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
// Pressure AND normal-velocity boundary continuity, including the evanescent branch.
for(const ratio of [.5,1,1.5,2])for(const q of [.2,1,5])for(const angle of [0,30,42,60,85]){
 const v={ratio,q,angle},s=interfaceField(v),ad=ratio/(q*s.kx);
 near(1-s.re,ad*(s.kt*s.tr+s.decay*s.ti));near(-s.im,ad*(s.kt*s.ti-s.decay*s.tr));
 const R=s.re*s.re+s.im*s.im,T=ad*s.kt*(s.tr*s.tr+s.ti*s.ti);near(R+T,1);
 for(const phase of [0,.7,2.1])near(interfacePressure(-1e-8,.4,phase,v),interfacePressure(1e-8,.4,phase,v),1e-6);
 // Verify Helmholtz PDE away from the boundary by independent finite differences.
 const h=1e-3,x=1.2,y=.3,phase=.8,p=(x,y)=>interfacePressure(x,y,phase,v),lap=(p(x+h,y)+p(x-h,y)+p(x,y+h)+p(x,y-h)-4*p(x,y))/(h*h);
 near(lap+p(x,y)/ratio**2,0,2e-5);
}
const ev=interfaceField({ratio:1.5,q:2,angle:60});assert.ok(ev.decay>0);assert.ok(Math.hypot(ev.tr,ev.ti)>0);near(ev.kt,0);
// Measured wavefront spacings, not a repeat of the received-frequency calculation.
for(const speed of [-100,0,100]){const f=1000,d=dopplerFronts(f,speed,.0123),a=d.fronts[0],b=d.fronts[1];near((a.center+a.radius)-(b.center+b.radius),(340-speed)/f);near((b.center-b.radius)-(a.center-a.radius),(340+speed)/f);near(d.source,speed*(d.t-.015));}
// Tabulated high-argument Bessel values catch catastrophic power-series cancellation.
for(const [x,y] of [[20,.06683312417585005],[30,-.11875106261662294],[40,.12603831803758497]]){near(j1(x),y,1e-12);near(j1(-x),-y,1e-12);}
const critical=result('damp',{m:1,k:100,z:1}),over=result('damp',{m:1,k:100,z:2});near(critical[3][1],.1);near(over[3][1],(2+Math.sqrt(3))/10);assert.ok(over[3][0].includes('慢衰减'));
assert.ok(Number.isNaN(result('forced',{m:1,k:100,z:0,ratio:1})[1][1]));near(result('guide',{H:20,n:2,f:75})[2][1],0);
const v={a:.2,f:300,mode:1},a=ductPressure(.6,0,0,0,v),b=ductPressure(.6,0,1,0,v);near(b/a,Math.exp(-duct(v).decay));
// Every combination of parameter endpoints: no accidental NaN in physical outputs.
let count=0;for(const [kind,m] of Object.entries(models)){for(let mask=0;mask<2**m.params.length;mask++){const v=defaults(m);m.params.forEach((p,i)=>v[p.key]=(mask>>i)&1?p.max:p.min);for(const [name,value] of result(kind,v))assert.ok(!Number.isNaN(value)||['guide','oblique','forced'].includes(kind),kind+' '+name);count++;}}
console.log(`PASS: ${count} parameter corners; boundary pressure/velocity continuity and PDE, evanescent decay, Doppler spacing, high-ka Bessel values, damping regimes and cutoff.`);
