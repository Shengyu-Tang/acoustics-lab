import {freeX,models,defaults,result,oblique,reflection,type Values} from './physics';
export function forcedTrace(v:Values){let x=0,u=0;const out:number[]=[],dt=.002,w=Math.sqrt(v.k/v.m),b=2*(v.z??0)*w;const acc=(t:number,x:number,u:number)=>Math.cos(v.ratio*w*t)/v.m-b*u-w*w*x;for(let n=0;n<=4000;n++){out.push(x);const t=n*dt,a1=u,b1=acc(t,x,u),a2=u+b1*dt/2,b2=acc(t+dt/2,x+a1*dt/2,u+b1*dt/2),a3=u+b2*dt/2,b3=acc(t+dt/2,x+a2*dt/2,u+b2*dt/2),a4=u+b3*dt,b4=acc(t+dt,x+a3*dt,u+b3*dt);x+=dt*(a1+2*a2+2*a3+a4)/6;u+=dt*(b1+2*b2+2*b3+b4)/6;}return out}
export function displacement(kind:string,v:Values,t:number,trace:number[]){return ['forced','undamped'].includes(kind)?trace[Math.min(4000,Math.round(t%8/.002))]:freeX(v,t%8,['damp','quality'].includes(kind))}
export const families:Record<string,string>={free:'mechanical',energy:'mechanical',damp:'mechanical',quality:'mechanical',forced:'mechanical',undamped:'mechanical',resonance:'mechanical',string:'elastic',rod:'elastic',wave:'field',continuity:'field',intensity:'field',speed:'field',helmholtz:'field',beats:'field',interference:'field',levels:'receiver',receiver:'receiver',doppler:'field',reflection:'boundary',standing:'boundary',oblique:'boundary',guide:'guide',spherical:'propagation',cylindrical:'propagation',absorption:'propagation',mechanism:'propagation',reciprocity:'propagation',monopole:'radiation',dipole:'radiation',piston:'radiation',nearfield:'radiation',scatter:'radiation',cylinder:'radiation',image:'paths',echo:'paths',sonar:'sonar'};
export function sceneState(kind:string,v:Values){const m=models[kind],base=defaults(m),rs=result(kind,v),reference=result(kind,base);let f=v.f??1,c=v.c??1500,amp=v.P??1,size=v.a??.1,distance=v.r??10,angle=(v.angle??0)*Math.PI/180,power=1,attenuation=0,refl=0,trans=1;
 if(families[kind]==='mechanical'){f=Math.sqrt(v.k/v.m)/(2*Math.PI);amp=['resonance','forced','undamped'].includes(kind)?1/(v.k*Math.max(.01,Math.hypot(1-v.ratio*v.ratio,2*(v.z??0)*v.ratio))):.01;size=Math.cbrt(v.m);power=.5*v.k*.0001;}
 if(kind==='string'){c=Math.sqrt(v.T/v.mu);f=v.n*c/(2*v.L);size=v.L}if(kind==='rod'){c=Math.sqrt(v.E*1e9/v.rho);f=(2*v.n-1)*c/(4*v.L);size=v.L}
 if(kind==='speed')c=Math.sqrt(v.B*1e9/v.rho);
 if(['wave','continuity','intensity','speed'].includes(kind))power=amp*amp/(2*(v.rho??1000)*c);
 if(kind==='beats'){f=(v.f1+v.f2)/2;amp=2;}
 if(kind==='interference'){amp=rs[0][1];f=500;angle=v.phase*Math.PI/180;}
 if(kind==='doppler'){c=340;f=rs[0][1];}
 if(kind==='levels'){amp=rs[1][1];power=amp*amp;f=2;}
 if(kind==='receiver'){amp=rs[0][1];f=v.ratio;power=amp*amp;}
 if(kind==='reflection'){refl=reflection(v.q).R;trans=reflection(v.q).T;}
 if(kind==='oblique'){const o=oblique(v);refl=o.R;trans=o.T;}
 if(kind==='standing'){refl=1-rs[0][1]/100;trans=0;}
 if(kind==='spherical'){amp=1/v.r;power=amp*amp;}
 if(kind==='cylindrical'){amp=Math.sqrt(10/v.r);power=amp*amp;}
 if(kind==='reciprocity'){amp=1/v.r;power=amp*amp;}
 if(kind==='absorption'){attenuation=v.alpha;amp=Math.exp(-v.alpha*v.r);}
 if(kind==='mechanism'){attenuation=rs[0][1];distance=100;amp=Math.exp(-attenuation*100);f=v.ratio;}
 if(kind==='guide'){size=v.H;f=v.f;}
 if(kind==='monopole')power=rs[2][1];
 if(kind==='scatter')power=rs[1][1];
 if(kind==='dipole'){size=v.d;power=(2*Math.PI*v.f*v.d/1500)**2;}
 if(kind==='piston')power=rs[1][1]**2;
 if(kind==='nearfield'){power=rs[1][1]**2;distance=v.r;}
 if(kind==='cylinder'){size=v.ka;f=v.ka;}
 if(kind==='image'){size=v.depth;power=rs[0][1]**2;}
 if(kind==='echo'){size=v.R;distance=rs[0][1];f=340/Math.max(1,distance);}
 if(kind==='sonar'){distance=v.r;power=10**(rs[1][1]/20);}
 return {family:families[kind],f,c,amp,size,distance,angle,power,attenuation,refl,trans,wavelength:c/Math.max(.01,f),metrics:rs,reference};
}
