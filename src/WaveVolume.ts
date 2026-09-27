import * as T from 'three';import {sceneState} from './animationPhysics';import {reflection,oblique,type Values} from './physics';import {interfaceField} from './fieldPhysics';
// A continuous pressure field on softly blended depth slices, not moving particles.
export function createWaveVolume(parent:T.Object3D){
const uniforms={phase:{value:0},cycles:{value:1},height:{value:1},mode:{value:0},order:{value:0},decay:{value:0},amplitude:{value:1},reflect:{value:0},reflectPhase:{value:0},transmit:{value:1},angle:{value:0},second:{value:0},offset:{value:0},spread:{value:0},range:{value:1},falloff:{value:0},tangent:{value:0},normal:{value:1},transNormal:{value:1},transPhase:{value:0},evDecay:{value:0},beatPhase:{value:0},beatWave:{value:0},sourceSpeed:{value:0},physicalTime:{value:0},frequency:{value:500}};
const material=new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
vertexShader:`varying vec3 fieldPosition;void main(){fieldPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
fragmentShader:`varying vec3 fieldPosition;uniform float phase,cycles,height,mode,order,decay,amplitude,reflect,reflectPhase,transmit,angle,second,offset,spread,range,falloff,tangent,normal,transNormal,transPhase,evDecay,beatPhase,beatWave,sourceSpeed,physicalTime,frequency;
void main(){float q=(fieldPosition.x+4.)/8.;float y=fieldPosition.y/height;float z=fieldPosition.z;float distance=q;
if(spread>0.)distance=sqrt(q*q+(y*y+(spread==1.?z*z:0.))/64.);
float wave=cycles*distance;float envelope=exp(-decay*q);
if(mode==1.){envelope*=cos(order*3.14159265*(y+1.)*.5);}
if(mode==2.){wave=cycles*(q*cos(angle)+z*.125*sin(angle));}
float pressure=amplitude*cos(phase-wave)*envelope;
if(mode==3.){float nx=cycles*(q-.5);float along=cycles*y*1.2/8.*tangent;wave=normal*nx+along;float boundaryPhase=phase-along;if(q<.5)pressure=cos(boundaryPhase-normal*nx)+reflect*cos(boundaryPhase+normal*nx+reflectPhase);else pressure=transmit*exp(-evDecay*nx)*cos(boundaryPhase-transNormal*nx+transPhase);}
if(mode==5.){pressure=2.*cos(beatPhase-beatWave*q)*cos(phase-cycles*q);}
if(mode==6.){float dx=fieldPosition.x*1.5-sourceSpeed*(physicalTime-.015);float transverse=2.25*(fieldPosition.y*fieldPosition.y+fieldPosition.z*fieldPosition.z);float c2=340.*340.,den=c2-sourceSpeed*sourceSpeed;float delay=(dx*sourceSpeed+sqrt(c2*dx*dx+den*transverse))/den;float emission=physicalTime-delay;wave=6.2831853*frequency*delay;pressure=emission<0.?0.:cos(6.2831853*frequency*emission)/max(1.,340.*delay);}

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
u.phase.value=time*2*Math.PI*s.f/(kind==='guide'?80:kind==='mechanism'?1:500);u.cycles.value=cycles;u.mode.value=mode;u.order.value=v.n??0;u.decay.value=decay;u.angle.value=s.angle;u.normal.value=1;u.tangent.value=0;u.transNormal.value=1;u.transPhase.value=0;u.evDecay.value=0;u.second.value=v.P2??0;u.offset.value=s.angle;u.reflect.value=Math.sqrt(s.refl);u.reflectPhase.value=kind==='reflection'&&v.q<1?Math.PI:kind==='standing'?Math.atan2(2*v.X,v.R*v.R+v.X*v.X-1):0;u.transmit.value=kind==='standing'?0:Math.sqrt(s.trans);u.spread.value=kind==='spherical'?1:kind==='cylindrical'?.5:0;u.range.value=kind==='cylindrical'?s.distance/10:s.distance;u.falloff.value=['spherical','reciprocity'].includes(kind)?1:kind==='cylindrical'?.5:0;u.amplitude.value=['wave','continuity','intensity','speed'].includes(kind)?Math.log10(1+Math.abs(s.amp))+.05:1;
if(s.family==='boundary')u.phase.value=time*3;
if(kind==='reflection'){const r=reflection(v.q);u.reflect.value=Math.abs(r.r);u.reflectPhase.value=r.r<0?Math.PI:0;u.transmit.value=r.t;}if(kind==='oblique'){const o=interfaceField(v);u.normal.value=o.kx;u.tangent.value=o.ky;u.transNormal.value=o.kt;u.evDecay.value=o.decay;u.reflect.value=Math.hypot(o.re,o.im);u.reflectPhase.value=Math.atan2(o.im,o.re);u.transmit.value=Math.hypot(o.tr,o.ti);u.transPhase.value=Math.atan2(o.ti,o.tr);}
if(kind==='beats'){u.mode.value=5;u.phase.value=time*2*Math.PI*(v.f1+v.f2)/2/20;u.cycles.value=2*Math.PI*(v.f1+v.f2)/2/1500*6;u.beatPhase.value=Math.PI*(v.f1-v.f2)*time/20;u.beatWave.value=Math.PI*(v.f1-v.f2)*6/1500;}
if(kind==='doppler'){u.mode.value=6;u.sourceSpeed.value=v.v;u.physicalTime.value=(time/500)%0.03;u.frequency.value=v.f;}

return {height};},material};}
