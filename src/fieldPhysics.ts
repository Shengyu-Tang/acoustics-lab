import type {Values} from './physics';
// exp(+i omega t), incident propagation towards +x. Lengths below use k1=1.
export function interfaceField(v:Values){
 const angle=v.angle*Math.PI/180,ky=Math.sin(angle),kx=Math.cos(angle),raw=1/v.ratio**2-ky*ky,d=Math.abs(raw)<1e-12?0:raw;
 const kt=Math.sqrt(Math.max(0,d)),decay=Math.sqrt(Math.max(0,-d));
 const a=v.q*kx,b=v.ratio*kt,c=v.ratio*decay,den=(a+b)**2+c*c;
 // cos(theta_t)=-i*sqrt(sin(theta_t)^2-1) selects the decaying transmitted branch.
 const re=(a*a-b*b-c*c)/den,im=2*a*c/den;
 return {kx,ky,kt,decay,re,im,tr:1+re,ti:im};
}
export function interfacePressure(x:number,y:number,phase:number,v:Values){const s=interfaceField(v),p=phase-s.ky*y;if(x<0)return Math.cos(p-s.kx*x)+s.re*Math.cos(p+s.kx*x)-s.im*Math.sin(p+s.kx*x);return Math.exp(-s.decay*x)*(s.tr*Math.cos(p-s.kt*x)-s.ti*Math.sin(p-s.kt*x));}
// Wavefronts in the stationary medium frame. Both distances use the SAME scale.
export function dopplerFronts(f:number,speed:number,time:number){const t=time%0.03,source=speed*(t-.015);return {t,source,fronts:Array.from({length:Math.floor(t*f)+1},(_,i)=>{const emitted=i/f;return {center:speed*(emitted-.015),radius:340*(t-emitted)};})};}
// Stable J1 integral (NIST DLMF 10.9.2), independently useful as a numerical oracle.
export function besselJ1Integral(x:number){let sum=0;for(let i=0;i<256;i++){const theta=Math.PI*(i+.5)/256;sum+=Math.cos(theta-x*Math.sin(theta));}return sum/256;}
