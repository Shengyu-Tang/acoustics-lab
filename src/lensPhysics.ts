export type LensSettings={frequency:number;diameter:number;aberration:number;correction:number;rings:number;range:number};
export const lensDefaults:LensSettings={frequency:30,diameter:12,aberration:4.5,correction:1,rings:12,range:10};
export const C=1500,F0=30000;
export function residualPhase(r:number,v:LensSettings,continuous=false){const q=Math.min(1,Math.max(0,r)),mid=continuous?q:(Math.min(v.rings-1,Math.floor(q*v.rings))+.5)/v.rings;return v.aberration*v.frequency*1000/F0*(q*q-v.correction*mid*mid)}
export function j0(x:number){let s=0;for(let i=0;i<48;i++)s+=Math.cos(x*Math.cos(Math.PI*(i+.5)/48));return s/48}
let key='',kernel:Float64Array[]=[];
export function lensPattern(v:LensSettings,continuous=false){const ka=2*Math.PI*v.frequency*1000/C*v.diameter/200,tag=ka.toFixed(10),N=128;if(tag!==key){kernel=Array.from({length:361},(_,j)=>{const q=new Float64Array(N),angle=(j/2-90)*Math.PI/180;for(let i=0;i<N;i++)q[i]=j0(ka*(i+.5)/N*Math.sin(angle));return q});key=tag}
const re=new Float64Array(N),im=new Float64Array(N);let cr=0,ci=0,mean=0,sq=0;for(let i=0;i<N;i++){const r=(i+.5)/N,w=2*r/N,phase=residualPhase(r,v,continuous);re[i]=w*Math.cos(phase);im[i]=w*Math.sin(phase);cr+=re[i];ci+=im[i];mean+=w*phase;sq+=w*phase*phase;}
const real:number[]=[],imag:number[]=[];const values=kernel.map(row=>{let a=0,b=0;for(let i=0;i<N;i++){a+=row[i]*re[i];b+=row[i]*im[i]}real.push(a);imag.push(b);return Math.hypot(a,b)}),axis=Math.hypot(cr,ci),peak=Math.max(...values);let width:number|null=null;
if(axis>=peak*.999){for(let i=181;i<361;i++){if(values[i]<=axis/Math.SQRT2){const t=(values[i-1]-axis/Math.SQRT2)/(values[i-1]-values[i]);width=(i-1-180+t);break}}}
return {values,real,imag,axis,power:axis*axis,width,rms:Math.sqrt(Math.max(0,sq-mean*mean)),footprint:width===null?null:2*v.range*Math.tan(width*Math.PI/360)};
}
