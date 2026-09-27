// Independent teaching models inspired by the archived MATLAB examples.
export type ComparisonKind='layer'|'array'|'duct';
export type Settings=Record<string,number>;
export const comparisonCatalog=[
 {id:'layer' as const,title:'匹配层：厚度为何改变透射？',models:['reflection','standing'],topic:'3.6.5',source:'test14.m'},
 {id:'array' as const,title:'线阵：窄波束与栅瓣的取舍',models:['piston','dipole','interference'],topic:'4.4.3',source:'test22.m、test23.m'},
 {id:'duct' as const,title:'圆管：横截面振型与截止',models:['guide','helmholtz'],topic:'3.10.3',source:'test26.m–test31.m'}
];
export const initial:Record<ComparisonKind,Settings>={layer:{q:4,s:16,h:.25},array:{N:8,d:.5,steer:0},duct:{a:.2,f:800,mode:1,z:.5}};
export type Complex=[number,number];
const mul=(a:Complex,b:Complex):Complex=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const cis=(a:number):Complex=>[Math.cos(a),Math.sin(a)];
export function layer(v:Settings){const x=2*Math.PI*v.h,C=Math.cos(x),S=Math.sin(x),a=(1+1/v.s)*C,b=(v.q/v.s+1/v.q)*S,den=a*a+b*b,t:Complex=[2*a/den,-2*b/den],p=mul(t,[C,v.q/v.s*S]),r:Complex=[p[0]-1,p[1]];return {t,r,R:r[0]**2+r[1]**2,T:(t[0]**2+t[1]**2)/v.s};}
// x and h measured in wavelengths; all three media have equal c and variable density.
export function layerPressure(x:number,v:Settings):Complex {const {t,r}=layer(v),k=2*Math.PI;if(x<0){const p=cis(-k*x),b=mul(r,cis(k*x));return [p[0]+b[0],p[1]+b[1]];}if(x<=v.h)return mul(t,[Math.cos(k*(v.h-x)),v.q/v.s*Math.sin(k*(v.h-x))]);return mul(t,cis(-k*(x-v.h)));}
// Angle measured from broadside. Finite sum also handles every removable singularity.
export function arrayFactor(direction:number,v:Settings):Complex {const phase=2*Math.PI*v.d*(direction-Math.sin(v.steer*Math.PI/180));let re=0,im=0;for(let j=0;j<v.N;j++){const a=(j-(v.N-1)/2)*phase;re+=Math.cos(a);im+=Math.sin(a);}return [re/v.N,im/v.N];}
export function gratingAngles(v:Settings){const s=Math.sin(v.steer*Math.PI/180),out:number[]=[];for(let m=-5;m<=5;m++){const u=s+m/v.d;if(m!==0&&Math.abs(u)<=1+1e-12)out.push(Math.asin(Math.max(-1,Math.min(1,u)))*180/Math.PI);}return out;}
export function besselJ(n:number,x:number){let t=(x/2)**n;for(let j=2;j<=n;j++)t/=j;let sum=t;for(let j=1;j<70;j++){t*=-(x*x/4)/(j*(j+n));sum+=t;if(Math.abs(t)<1e-15)break;}return sum;}
export const ductModes=[{name:'(0,0) 平面模态',n:0,beta:0},{name:'(1,0) 单节径',n:1,beta:1.84118378134066},{name:'(2,0) 双节径',n:2,beta:3.05423692822714},{name:'(0,1) 单节圆',n:0,beta:3.83170597020751},{name:'(1,1) 节径＋节圆',n:1,beta:5.33144277352503}];
export function duct(v:Settings){const m=ductModes[v.mode],k=2*Math.PI*v.f/340,kt=m.beta/v.a,delta=k*k-kt*kt,fc=340*kt/(2*Math.PI),atCutoff=Math.abs(v.f-fc)<1e-8;return {...m,fc,kz:Math.sqrt(Math.max(0,delta)),decay:Math.sqrt(Math.max(0,-delta)),state:atCutoff?'截止':delta>0?'传播':'倏逝',cg:delta>0?340*Math.sqrt(delta)/k:0};}
export function ductShape(radius:number,angle:number,v:Settings){const m=ductModes[v.mode];return besselJ(m.n,m.beta*radius)*Math.cos(m.n*angle);}
export function ductPressure(radius:number,angle:number,z:number,phase:number,v:Settings){const d=duct(v);return ductShape(radius,angle,v)*Math.exp(-d.decay*z)*Math.cos(phase-d.kz*z);}
