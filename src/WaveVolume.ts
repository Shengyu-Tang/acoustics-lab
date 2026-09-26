import * as T from 'three';import {sceneState} from './animationPhysics';import {reflection,oblique,type Values} from './physics';
// A continuous pressure field on softly blended depth slices, not moving particles.
export function createWaveVolume(parent:T.Object3D){
const uniforms={phase:{value:0},cycles:{value:1},height:{value:1},mode:{value:0},order:{value:0},decay:{value:0},amplitude:{value:1},reflect:{value:0},reflectPhase:{value:0},transmit:{value:1},angle:{value:0},second:{value:0},offset:{value:0},spread:{value:0},range:{value:1},falloff:{value:0}};
const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
vertexShader:`varying vec3 fieldPosition;void main(){fieldPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 fieldPosition;uniform float phase,cycles,height,mode,order,decay,amplitude,reflect,reflectPhase,transmit,angle,second,offset,spread,range,falloff;
void main(){float q=(fieldPosition.x+4.)/8.;float y=fieldPosition.y/height;float z=fieldPosition.z;float distance=q;
if(spread>0.)distance=sqrt(q*q+(.10*y*y+.06*z*z)*spread);
float wave=cycles*distance;float envelope=exp(-decay*q);
if(mode==1.){envelope*=cos(order*3.14159265*(y+1.)*.5);}
if(mode==2.){wave=cycles*(q*cos(angle)+z*.125*sin(angle));}
float pressure=amplitude*cos(phase-wave)*envelope;
if(mode==3.){wave=cycles*(q-.5)-y*sin(angle)*2.;if(q<.5)pressure=cos(phase-wave)+reflect*cos(phase+wave+reflectPhase);else pressure=transmit*cos(phase-wave);}
if(mode==4.)pressure=cos(phase-wave)+second*cos(phase-wave+offset);
pressure/=pow(max(1.,q*range),falloff);
float edge=(1.-smoothstep(.84,1.,abs(y)))*(1.-smoothstep(.92,1.,abs(fieldPosition.x)/4.));
float band=abs(pressure);float glow=1.-exp(-band*1.6);vec3 cold=vec3(.18,.91,.89),warm=vec3(1.,.56,.32);vec3 color=mix(warm,cold,smoothstep(-.06,.06,pressure));color=mix(color,vec3(.83,1.,1.),pow(glow,5.)*.35);
float antiAlias=1.-smoothstep(2.,6.,fwidth(wave));gl_FragColor=vec4(color,.13*pow(glow,1.3)*edge*antiAlias);}`});
const geometry=new T.PlaneGeometry(8,2,1,1);const slices:T.Mesh[]=[];
for(let i=0;i<11;i++){const g=geometry.clone();g.translate(0,0,(i/10-.5)*2.8);const plane=new T.Mesh(g,material);plane.renderOrder=2;parent.add(plane);slices.push(plane)}geometry.dispose();
return {update(kind:string,v:Values,time:number){const s=sceneState(kind,v),u=uniforms,k=2*Math.PI*s.f/s.c;const length=s.family==='propagation'?s.distance:s.family==='guide'?100:6;let cycles=k*length,mode=0,decay=s.attenuation*length;
const height=s.family==='guide'?Math.max(.9,Math.min(2.3,v.H/20)):1.2;slices.forEach(o=>o.scale.y=height);u.height.value=1; // shader coordinates precede mesh scaling
if(s.family==='guide'){mode=1;const transverse=v.n*Math.PI/v.H,axial=Math.sqrt(Math.abs(k*k-transverse*transverse));cycles=k>=transverse?axial*length:0;decay=k>=transverse?0:axial*length;}
if(kind==='helmholtz')mode=2;if(s.family==='boundary'){mode=3;cycles=4*Math.PI;}if(kind==='interference'){mode=4;cycles=4*Math.PI;}
u.phase.value=time*2*Math.PI*s.f/(kind==='guide'?80:kind==='mechanism'?1:500);u.cycles.value=cycles;u.mode.value=mode;u.order.value=v.n??0;u.decay.value=decay;u.angle.value=s.angle;u.second.value=v.P2??0;u.offset.value=s.angle;u.reflect.value=Math.sqrt(s.refl);u.reflectPhase.value=kind==='reflection'&&v.q<1?Math.PI:kind==='standing'?Math.atan2(2*v.X,v.R*v.R+v.X*v.X-1):0;u.transmit.value=kind==='standing'?0:Math.sqrt(s.trans);u.spread.value=kind==='spherical'?1:kind==='cylindrical'?.5:0;u.range.value=kind==='cylindrical'?s.distance/10:s.distance;u.falloff.value=['spherical','reciprocity'].includes(kind)?1:kind==='cylindrical'?.5:0;u.amplitude.value=['wave','continuity','intensity','speed'].includes(kind)?Math.log10(1+Math.abs(s.amp))+.05:1;
if(kind==='reflection'){const r=reflection(v.q);u.reflect.value=Math.abs(r.r);u.reflectPhase.value=r.r<0?Math.PI:0;u.transmit.value=r.t;}if(kind==='oblique'){const o=oblique(v);if(Number.isFinite(o.angle)){const a=v.angle*Math.PI/180,r=(v.q*Math.cos(a)-Math.cos(o.angle))/(v.q*Math.cos(a)+Math.cos(o.angle));u.reflect.value=Math.abs(r);u.reflectPhase.value=r<0?Math.PI:0;u.transmit.value=1+r;}}
if(kind==='beats'){u.phase.value=time*2*Math.PI*v.f1/100;u.amplitude.value=2*Math.cos(Math.PI*(v.f1-v.f2)*time/4)}
return {height};},material};}
