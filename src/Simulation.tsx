'use client';
import {useEffect,useMemo,useState} from 'react';
import {Values,freeX,pistonD,reflection,oblique,result,fmt} from './physics';
const pi=Math.PI;
const curve=(fn:(x:number)=>number,min=0,max=1,yScale=90,y0=170)=>Array.from({length:301},(_,i)=>{const x=min+(max-min)*i/300,y=fn(x);return `${i?'L':'M'}${40+i*1.8},${y0-Math.max(-200,Math.min(200,y*yScale))}`;}).join(' ');
export default function Simulation({kind,v,application=false}:{kind:string,v:Values,application?:boolean}){
 if(kind==='undamped')kind='forced';
 const [running,setRunning]=useState(true),[time,setTime]=useState(0);
 useEffect(()=>{setTime(0)},[kind,v]);
 useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)setRunning(false)},[]);
 useEffect(()=>{if(!running)return;let raf=0,last=0;const tick=(now:number)=>{if(last)setTime(t=>(t+Math.min((now-last)/1000,.05))%1000);last=now;raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[running]);
 const forced=useMemo(()=>{if(kind!=='forced')return [];let x=0,u=0;const out=[];const dt=.002,w=Math.sqrt(v.k/v.m),b=2*v.z*w;const acc=(t:number,x:number,u:number)=>Math.cos(v.ratio*w*t)/v.m-b*u-w*w*x;for(let n=0;n<=4000;n++){out.push(x);let t=n*dt,a1=u,b1=acc(t,x,u),a2=u+b1*dt/2,b2=acc(t+dt/2,x+a1*dt/2,u+b1*dt/2),a3=u+b2*dt/2,b3=acc(t+dt/2,x+a2*dt/2,u+b2*dt/2),a4=u+b3*dt,b4=acc(t+dt,x+a3*dt,u+b3*dt);x+=dt*(a1+2*a2+2*a3+a4)/6;u+=dt*(b1+2*b2+2*b3+b4)/6;}return out},[kind,v]);
 let content:React.ReactNode;let caption='横轴：归一化位置　纵轴：归一化振幅；为观察现象已慢放';
 const line=(d:string,color='#71e5dc',width=2.5)=><path d={d.replace(/-?\d+\.\d+/g,n=>Number(n).toFixed(3))} fill="none" stroke={color} strokeWidth={width}/>;
 const text=(x:number,y:number,s:string)=><text x={x} y={y} fill="#b8d5df" fontSize="14">{s}</text>;
 const axes=<><path d="M40 65V270H580M40 170H580" stroke="#466373" fill="none"/>{[0,1,2,3,4,5].map(i=><path key={i} d={`M${40+i*108} 65V270`} stroke="#244558"/>)}</>;
 if(kind==='echo'){
  const a=v.angle*pi/180,end=[310+120*Math.cos(a),170-120*Math.sin(a)],ph=(time%4)/4*a;content=<><circle cx="310" cy="170" r="120" fill="none" stroke="#426275" strokeWidth="7"/><path d={`M430 170A120 120 0 0 0 ${end[0]} ${end[1]}`} fill="none" stroke="#71e5dc" strokeWidth="4"/>{line(`M430 170L${end[0]} ${end[1]}`,'#ffc979',2)}<circle cx={310+120*Math.cos(ph)} cy={170-120*Math.sin(ph)} r="6" fill="white"/>{text(40,30,'青：沿壁圆弧近似 · 金：直达声路径')}{text(40,320,`厅堂半径 ${v.R} m · 两路径使用相同声速`)}</>;caption='几何路径示意，圆弧代表沿壁多次反射的近似路径；不计算声场聚焦或衍射。';
 }else if(kind==='helmholtz'){
  const k=2*pi*v.f/1500,a=v.angle*pi/180;content=<>{Array.from({length:45},(_,i)=>Array.from({length:18},(_,j)=>{const y=Math.cos(k*(i/44*6*Math.cos(a)+j/17*3*Math.sin(a))-time*2);return <rect key={`${i}-${j}`} x={40+i*12} y={55+j*13} width="12" height="13" fill={y>0?'#71e5dc':'#fdab83'} opacity={Math.abs(y)*.9+.05}/>}))}{text(40,32,'二维平面波 · 等相位面垂直于波矢')}{text(40,315,'横向 6 m / 纵向 3 m')}</>;caption='颜色表示归一化声压正负；改变频率和波矢方向，观察等相位线。';
 }else if(['free','energy','damp','quality','forced'].includes(kind)){
  const y=(t:number)=>kind==='forced'?forced[Math.min(4000,Math.round(t/.002))]||0:freeX(v,t,kind==='damp'||kind==='quality');const sec=time%8;const scale=kind==='forced'?Math.max(.01,...forced.map(Math.abs)):.01;
  content=<>{axes}{line(curve(t=>y(t)/scale,0,8,65,205))}<path d="M40 42H100" stroke="#9dbcc7"/>{line(Array.from({length:15},(_,i)=>`${i?'L':'M'}${100+i*(110+70*y(sec)/scale)/14},${42+(i===0||i===14?0:i%2?12:-12)}`).join(' '))}<rect x={210+70*y(sec)/scale} y="24" width="40" height="36" rx="5" fill="#71e5dc"/>{text(350,45,application?'工程系统的等效质量—弹簧模型':'位移已放大 · x(0)=1 cm')}<circle cx={40+540*sec/8} cy={205-65*y(sec)/scale} r="5" fill="#ffc979"/>{text(40,295,'0 s')}{text(540,295,'8 s')}{text(45,120,`位移 / ${fmt(scale*1000)} mm`)}{kind==='energy'&&text(300,110,`势能占比 ${fmt((y(sec)/.01)**2*100)}%`)}</>;
  caption='横轴：真实时间 0–8 s；轨迹按当前范围缩放，放大后的振子与曲线同步。';
 }else if(['resonance','receiver'].includes(kind)){
  const a=(x:number)=>1/Math.hypot(1-x*x,2*v.z*x),max=1/(2*v.z)+1;
  content=<>{axes}{line(curve(x=>a(x)/max,0,3,170,260))}<circle cx={40+180*v.ratio} cy={260-170*a(v.ratio)/max} r={6+Math.sin(time*2)*1.5} fill="#ffc979"/>{text(40,295,'0')}{text(210,295,'1')}{text(390,295,'2')}{text(550,295,'3')}{text(50,50,'幅频响应 |H|')}{text(420,320,'频率比 f/f₀')}{text(50,90,`当前放大倍数 ${fmt(a(v.ratio))}`)}</>;caption='横轴：激励频率 / 固有频率；纵轴：幅值增益。金色标记为当前工作点。';
 }else if(kind==='beats'){
  content=<>{axes}{line(curve(t=>.5*(Math.cos(2*pi*v.f1*t)+Math.cos(2*pi*v.f2*t)),time/20,time/20+.15,75))}{line(curve(t=>Math.abs(Math.cos(pi*(v.f1-v.f2)*t)),time/20,time/20+.15,75),'#ffc979',1)}{line(curve(t=>-Math.abs(Math.cos(pi*(v.f1-v.f2)*t)),time/20,time/20+.15,75),'#ffc979',1)}{text(45,45,`拍频 ${fmt(Math.abs(v.f1-v.f2))} Hz`)}</>;caption='青色：合成波（÷2）；金色：包络；横轴窗口 0.15 s，时间慢放 20 倍。';
 }else if(kind==='string'||kind==='rod'){
  const n=kind==='rod'?v.n-.5:v.n;const physicalFrequency=kind==='string'?v.n*Math.sqrt(v.T/v.mu)/(2*v.L):(2*v.n-1)*Math.sqrt(v.E*1e9/v.rho)/(4*v.L);const ph=time*2*pi*physicalFrequency/(kind==='string'?160:5000);content=<>{axes}{kind==='string'?line(curve(x=>Math.sin(n*pi*x)*Math.cos(ph))):Array.from({length:35},(_,i)=><line key={i} x1={40+i*15+9*Math.sin(n*pi*i/36)*Math.cos(ph)} x2={40+i*15+9*Math.sin(n*pi*i/36)*Math.cos(ph)} y1="125" y2="210" stroke="#71e5dc" strokeWidth="3"/>)}<path d="M40 100V240" stroke="#ffc979" strokeWidth="6"/>{kind==='string'&&<path d="M580 100V240" stroke="#ffc979" strokeWidth="6"/>}{text(40,295,'固定端 x=0')}{text(425,295,kind==='string'?'固定端 x=L':'自由端 x=L')}{text(45,45,`模态 ${v.n} · ${application?'尺寸改变音高':'位移图示'}`)}</>;caption='横轴：位置 x/L；位移幅值放大。棒的竖线代表材料截面，沿轴向往复振动。';
 }else if(['wave','continuity','intensity','speed'].includes(kind)){
  const c=kind==='speed'?Math.sqrt(v.B*1e9/v.rho):v.c;const f=v.f,P=v.P??1,k=2*pi*f/c,ph=time*2*pi*f/500;content=<>{axes}{line(curve(x=>P/10*Math.cos(ph-k*x),0,6,100,210))}{Array.from({length:43},(_,i)=><circle key={i} cx={40+i*12+5*(P/10)*Math.sin(ph-k*i/7)} cy={110} r={i===20?5:3} fill={i===20?'#ffc979':'#71e5dc'}/>)}{text(45,45,'质点往复运动 · 波形向右传播')}{text(45,295,'0 m')}{text(540,295,'6 m')}{text(45,250,'声压 p / 10 Pa')}{text(365,65,`λ = ${fmt(c/f)} m`)}</>;caption='粒子位移放大、演示时间缩放；波长与横轴米数对应。金色粒子始终在自己的平衡位置附近振动。';
 }else if(kind==='levels'){
  const L=result(kind,v)[0][1];content=<>{[v.L1,v.L2,L].map((a,i)=><g key={i}><rect x={95+i*170} y={265-a*1.5} width="70" height={a*1.5} fill={i===2?'#ffc979':'#71e5dc'} rx="5"/>{text(95+i*170,290,['声源 1','声源 2','总声级'][i])}{text(90+i*170,250-a*1.5,fmt(a)+' dB')}</g>)}{line(curve(x=>.2*Math.sin(x*30-time*3),0,1,35,55),'#6a9aa9')}</>;caption='柱高表示 dB 数值，合成使用不相干声源的能量求和。波纹仅表示声源正在工作，不表示相干波形。';
 }else if(kind==='interference'){
  const a=time*2;content=<>{axes}{line(curve(x=>Math.cos(4*pi*x-a),0,1,35,130),'#699db8',1.5)}{line(curve(x=>v.P2*Math.cos(4*pi*x-a+v.phase*pi/180),0,1,35,130),'#ffc979',1.5)}{line(curve(x=>Math.cos(4*pi*x-a)+v.P2*Math.cos(4*pi*x-a+v.phase*pi/180),0,1,35,225))}{text(45,45,'蓝：参考声源 · 金：第二声源 · 青：合成声压')}</>;caption='横轴为一个观察窗口内的相位；两源峰值与相位差共同决定合成幅值。';
 }else if(kind==='doppler'){
  content=<>{Array.from({length:8},(_,i)=>{const age=(time*.6+i)%8;return <circle key={i} cx={290-age*v.v*.35} cy="170" r={age*31} stroke="#71e5dc" opacity={1-age/9} fill="none"/>})}<circle cx="290" cy="170" r="9" fill="#ffc979"/>{text(375,50,`接收频率 ${fmt(v.f*340/(340-v.v))} Hz`)}{text(425,285,'接收器（静止）')}<rect x="475" y="150" width="12" height="40" fill="#ffc979"/></>;caption='波前示意，保持 vₛ/c 的相对效果；数字按 c=340 m/s 计算，空间尺度不代表米。';
 }else if(kind==='reflection'||kind==='standing'){
  let re=0,im=0;if(kind==='reflection')re=reflection(v.q).r;else{const den=(v.R+1)**2+v.X*v.X;re=(v.R*v.R+v.X*v.X-1)/den;im=2*v.X/den;}const ph=time*3;
  content=<>{axes}<path d="M365 50V275" stroke="#ffc979" strokeDasharray="5 5"/>{line(curve(x=>Math.cos(ph-4*pi*x)+re*Math.cos(ph+4*pi*x)-im*Math.sin(ph+4*pi*x),-1.5,0,38,160).replaceAll(/([ML])([\d.]+),/g,(_,a,b)=>a+(40+(Number(b)-40)*.6)+','))}{kind==='reflection'&&line(Array.from({length:101},(_,i)=>`${i?'L':'M'}${365+i*2.1},${160-(1+re)*38*Math.cos(ph-i/100*4*pi)}`).join(' '))}{text(55,45,'入射侧：入射 + 反射')}{text(395,45,kind==='standing'?'终端表面':'透射侧')}{text(55,295,kind==='standing'?'声压驻波；匹配时为行波':'界面声压连续')}</>;caption='界面处 x=0；青色为合成声压，纵轴同一比例。声压透射幅值不等于能量透射率。';
 }else if(kind==='oblique'){
  const o=oblique(v),a=v.angle*pi/180,b=o.angle*pi/180,dx=Math.sin(a)*170,dy=Math.cos(a)*140;
  content=<><rect x="40" y="170" width="540" height="130" fill="#163b51"/><path d="M40 170H580M310 35V300" stroke="#7394a2" strokeDasharray="5 5"/>{line(`M${310-dx} ${170-dy}L310 170L${310+dx} ${170-dy}`)}{Number.isFinite(b)?line(`M310 170L${310+Math.sin(b)*170} ${170+Math.cos(b)*120}`,'#ffc979'):Array.from({length:7},(_,i)=><path key={i} d={`M310 ${182+i*16}H565`} stroke="#ffc979" strokeOpacity={Math.exp(-i*.65)} strokeDasharray={`${15+Math.sin(time*2)*5} 8`}/>)}<circle cx={310-dx+(time%2)/2*dx} cy={170-dy+(time%2)/2*dy} r="5" fill="white"/>{text(45,45,`入射角 ${v.angle}°（相对法线）`)}{text(45,285,Number.isFinite(b)?'传播透射波':'全内反射 · 下侧为倏逝场')}</>;caption='射线表示传播方向；全内反射时下侧的金色条纹随深度衰减。';
 }else if(kind==='guide'){
  const k=2*pi*v.f/1500,kz=v.n*pi/v.H,kx=Math.sqrt(Math.abs(k*k-kz*kz)),prop=k>kz;content=<>{Array.from({length:45},(_,i)=>Array.from({length:14},(_,j)=>{const x=i/44*100,z=j/13;const a=Math.cos(v.n*pi*z)*(prop?Math.cos(kx*x-time*2):Math.exp(-kx*x)*Math.cos(time*2));return <rect key={`${i}-${j}`} x={40+i*12} y={70+j*13} width="12" height="13" fill={a>0?'#71e5dc':'#fdab83'} opacity={Math.abs(a)*.9+.05}/>}))}<path d="M40 67H580M40 255H580" stroke="#9dbcc7" strokeWidth="4"/>{text(45,40,prop?'传播模态':'截止以下：沿轴指数衰减')}{text(45,290,'0 m')}{text(515,290,'100 m')}</>;caption='青 / 橙分别表示正 / 负声压；横轴 100 m，纵轴 0–H；幅值归一化。';
 }else if(['piston','dipole','scatter','monopole','cylinder'].includes(kind)){
  const ka=2*pi*v.f*(v.a??v.d)/1500;let fn=(a:number)=>kind==='piston'?Math.abs(pistonD(ka*Math.sin(a))):kind==='dipole'?Math.abs(Math.cos(a)):kind==='scatter'?Math.abs(.5*Math.cos(a)-1/3)/(5/6):1;
  if(kind==='cylinder'){
   content=<>{axes}{line(curve(x=>Math.cos(v.ka*Math.cos(2*pi*x)-time*2),0,1,65))}{line(curve(x=>-Math.cos(v.ka*Math.cos(2*pi*x)-time*2),0,1,65),'#ffc979')}{line('M40 170H580','#ffffff')}{text(45,45,'青：入射声压 · 金：散射声压 · 白：总声压')}{text(45,295,'θ = 0°')}{text(495,295,'θ = 360°')}</>;caption='横轴：圆柱表面角度；纵轴：归一化边界声压。这里不绘制外部场。';
  }else{
   const amin=kind==='piston'?-pi/2:0,amax=kind==='piston'?pi/2:2*pi;const points=Array.from({length:361},(_,i)=>{const a=amin+(amax-amin)*i/360,r=fn(a)*110;return `${i?'L':'M'}${310+r*Math.cos(a)},${170-r*Math.sin(a)}`}).join(' ');
   content=<>{[.25,.5,.75,1].map(r=><circle key={r} cx="310" cy="170" r={r*110} stroke="#365567" fill="none"/>)}<path d="M180 170H445M310 50V290" stroke="#466373"/>{line(points)}{kind==='monopole'&&[0,1,2].map(i=><circle key={i} cx="310" cy="170" r={((time*.3+i/3)%1)*110} stroke="#71e5dc" opacity=".4" fill="none"/>)}{text(45,40,kind==='scatter'?'刚性球 · 瑞利区归一化远场幅值':'归一化声压指向性')}{text(445,175,'0°')}{text(295,40,'90°')}{kind==='piston'&&text(45,290,'只绘前半空间；半径表示 |D(θ)|')}{kind==='dipole'&&text(45,290,'两个瓣相位相反；半径显示绝对值')}</>;caption=kind==='scatter'?'方向曲线按最大值归一化；频率与尺寸对绝对散射强度的影响见下方实时数值。':'半径为归一化声压幅值；工程参数改变实际辐射强度或波束宽度。';
  }
 }else if(kind==='image'){
  const k=2*pi*v.f/1500;content=<><path d="M40 100H580" stroke="#71e5dc"/><circle cx="85" cy={100+v.depth*4} r="6" fill="#ffc979"/><circle cx="85" cy={100-v.depth*2} r="5" fill="none" stroke="#ffc979"/><path d={`M85 ${100+v.depth*4}L550 200M85 ${100+v.depth*4}L310 100L550 200`} stroke="#71e5dc" fill="none"/><circle cx="550" cy="200" r="7" fill="#ffc979"/>{line(curve(x=>{const r1=Math.hypot(x,10-v.depth),r2=Math.hypot(x,10+v.depth);return 5*(Math.cos(k*r1-time*2)/r1+v.sign*Math.cos(k*r2-time*2)/r2)},10,100,70,280))}{text(340,65,'界面与两条传播路径')}{text(45,325,'下方：水平距离 10–100 m 处的合成声压（共同缩放）')}</>;caption='上图为路径示意，不按比例；下图显示直达与镜像路径共同形成的干涉。';
 }else if(kind==='nearfield'){
  const fn=(z:number)=>2*Math.abs(Math.sin(pi*v.f/1500*(Math.hypot(z,v.a)-z)));content=<>{axes}{line(curve(fn,.01,3,70,255))}<circle cx={40+(v.r-.01)/2.99*540} cy={255-fn(v.r)*70} r="6" fill="#ffc979"/>{text(45,45,'轴向声压幅值 / (ρcU)')}{text(45,295,'0.01 m')}{text(535,295,'3 m')}</>;caption='轴向解析幅值，纵轴 0–2；金色点为当前接收位置。';
 }else if(kind==='reciprocity'){
  content=<>{[0,1,2,3].map(i=><circle key={i} cx="100" cy="165" r={(time*.4+i/4)%1*400} stroke="#71e5dc" opacity=".4" fill="none"/>)}<circle cx="100" cy="165" r="8" fill="#ffc979"/><circle cx={180+v.r*7} cy="165" r="8" fill="#ffc979"/>{text(70,220,'A 收 / 发')}{text(160+v.r*7,220,'B 发 / 收')}{text(50,45,`距离 ${v.r} m · 交换源与接收点，传递幅值相同`)}</>;caption='动画示意 A→B 传播；两方向传递函数的相等性见实时数值。';
 }else if(kind==='sonar'){
  const se=result(kind,v)[1][1];const phase=time%4;content=<><path d="M70 170H540" stroke="#466373" strokeDasharray="8 8"/><rect x="50" y="140" width="40" height="60" rx="8" fill="#71e5dc"/><circle cx="540" cy="170" r="25" fill="#ffc979"/><circle cx={phase<2?90+phase/2*425:515-(phase-2)/2*425} cy="170" r="8" fill="white"/>{text(50,240,'单基地收发器')}{text(485,240,'目标')}{text(50,45,`往返传播 · 距离 ${v.r} m`)}{text(50,300,`信号余量 ${fmt(se)} dB · ${se>=0?'模型阈值已满足':'模型阈值未满足'}`)}</>;caption='传播路径动画为示意，速度不按比例；实时数值含往返两次损失。';
 }else{
  const isC=kind==='cylindrical',isS=kind==='spherical',a=kind==='mechanism'?.001*(v.ratio**2+v.beta*v.ratio**2/(1+v.ratio**2)):v.alpha??0;
  const max=isS?100:isC?1000:kind==='mechanism'?100:1000,min=isC?10:isS?1:0,env=(x:number)=>isS?1/x:isC?Math.sqrt(10/x):Math.exp(-a*x);
  content=<>{axes}{line(curve(x=>env(x)*Math.cos(x/max*10*pi-time*3),min,max,75))}{line(curve(env,min,max,75),'#ffc979',1)}{line(curve(x=>-env(x),min,max,75),'#ffc979',1)}{text(45,45,isS?'球面扩展：声压 ∝ 1/r':isC?'柱面远场：声压 ∝ 1/√r':'介质吸收：声压包络指数衰减')}{text(45,295,`${min} m`)}{text(515,295,`${max} m`)}</>;caption='青色：示意载波；金色：按物理模型计算的归一化幅值包络。波形载频仅为演示。';
 }
 return <div className="simulation"><div className="sim-toolbar"><span>{application?'APPLICATION / 工程应用':'PHYSICS / 原理实验'}</span><div><button onClick={()=>setRunning(!running)} aria-label={running?'暂停动画':'播放动画'}>{running?'Ⅱ 暂停':'▶ 播放'}</button><button onClick={()=>setTime(0)}>从头播放</button></div></div><svg viewBox="0 0 620 340" role="img" aria-label={caption}>{content}</svg><p className="sim-caption">{caption}</p></div>
}


