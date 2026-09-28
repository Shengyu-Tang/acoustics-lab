import {useEffect,useMemo,useState} from 'react';
import katex from 'katex';
import {forcedBeat} from './beatsPhysics';
export default function BeatsLab(){
 const [f,setF]=useState(1.1),[time,setTime]=useState(0),[running,setRunning]=useState(!matchMedia('(prefers-reduced-motion: reduce)').matches),[show,setShow]=useState(false);
 const delta=Math.abs(f-1),duration=30;
 const samples=useMemo(()=>Array.from({length:1801},(_,i)=>forcedBeat(i*duration/1800,f)),[f]);
 const scale=Math.max(1,...samples.map(s=>s.envelope));
 const value=forcedBeat(time,f),x=(t:number)=>50+t/duration*660,y=(v:number)=>235-v/scale*95;
 const path=(sign:number)=>samples.map((s,i)=>`${i?'L':'M'}${x(i*duration/1800)},${y(sign===0?s.x:sign*s.envelope)}`).join(' ');
 useEffect(()=>{if(!running)return;let frame=0,last=0;function tick(now:number){if(last)setTime(t=>Math.min(duration,t+Math.min((now-last)/1000,.05)));last=now;frame=requestAnimationFrame(tick)}frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[running]);
 useEffect(()=>{if(time>=duration)setRunning(false)},[time]);
 function change(n:number){setF(n);setTime(0)}
 const equations=useMemo(()=>[
 String.raw`m\ddot{x}+Kx=F_0\cos(\omega t),\quad x(0)=\dot{x}(0)=0`,
 String.raw`x(t)=\frac{F_0}{m(\omega_0^2-\omega^2)}[\cos(\omega t)-\cos(\omega_0t)]\quad(\omega\ne\omega_0)`,
 String.raw`f_{\mathrm{beat}}=|f-f_0|,\qquad T_{\mathrm{beat}}=\frac{1}{|f-f_0|}`,
 String.raw`\omega=\omega_0:\quad x(t)=\frac{F_0}{2m\omega_0}t\sin(\omega_0t)`
 ].map(t=>katex.renderToString(t,{displayMode:true,throwOnError:true,trust:false})),[]);
 return <section className="paper" aria-label="拍现象交互演示">
 <span className="eyebrow">BEATS / 从拍振动走近共振</span><h2>外力一直在推，振动为什么时强时弱？</h2>
 <p>让一个原本静止的无阻尼弹簧振子受到简谐力。激励频率接近固有频率时，完整响应中的两个频率分量交替增强、抵消，形成拍振动。</p>
 <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}><button className="secondary" onClick={()=>{if(time>=duration)setTime(0);setRunning(!running)}}>{running?'暂停':'播放'}</button><button className="secondary" onClick={()=>setTime(0)}>从头播放</button>{[1.2,1.1,1.05,1].map(n=><button className="secondary" key={n} aria-pressed={f===n} onClick={()=>change(n)}>{n===1?'恰好共振':n===1.05?'更慢的拍':n===1.1?'明显的拍':'更快的拍'}</button>)}</div>
 <div className="parameter" style={{marginTop:24}}><label htmlFor="beat-frequency">激励频率 f：{f.toFixed(2)} Hz（固有频率 f₀ = 1.00 Hz）</label><input id="beat-frequency" aria-label="拍演示激励频率" className="native-range" type="range" min="0.8" max="1.2" step="0.01" value={f} onChange={e=>change(Number(e.target.value))}/></div>
 <div style={{display:'flex',gap:24,flexWrap:'wrap',margin:'16px 0'}}><strong>拍频：{delta<1e-9?'0.00':delta.toFixed(2)} Hz</strong><strong>拍周期：{delta<1e-9?'无周期性拍振动':(1/delta).toFixed(2)+' s'}</strong><span>当前位移：{value.x.toFixed(2)} mm</span></div>
 <svg viewBox="0 0 760 380" role="img" aria-label="无阻尼受迫振子的运动、位移时间曲线与拍包络" style={{width:'100%',display:'block',background:'#0d2939',borderRadius:18}}>
 <defs><radialGradient id="beat-glow"><stop stopColor="#6de8dc" stopOpacity=".7"/><stop offset="1" stopColor="#6de8dc" stopOpacity="0"/></radialGradient></defs>
 <circle cx="380" cy="66" r="60" fill="url(#beat-glow)" opacity={.15+.85*value.envelope/scale}/>
 <path d="M160 28V102M160 100H600" stroke="#62818d" fill="none"/>
 <path d={Array.from({length:25},(_,i)=>`${i?'L':'M'}${160+i*(200+value.x/scale*130)/24},${65+(i===0||i===24?0:i%2?12:-12)}`).join(' ')} stroke="#71e5dc" strokeWidth="3" fill="none"/>
 <rect x={360+value.x/scale*130} y="42" width="42" height="46" rx="8" fill="#71e5dc"/>
 <text x="30" y="25" fill="#bfd8e0" fontSize="14">弹簧振子 · 位移放大</text><text x="485" y="25" fill="#bfd8e0" fontSize="14">青：完整响应　金：振幅包络</text>
 {[0,5,10,15,20,25,30].map(t=><g key={t}><path d={`M${x(t)} 135V335`} stroke="#244657"/><text x={x(t)} y="355" fill="#bfd8e0" fontSize="14" textAnchor="middle">{t}</text></g>)}
 <path d="M50 135V335M50 235H710" stroke="#7593a1" fill="none"/>
 <path d={path(1)} stroke="#ffc979" strokeDasharray="6 4" fill="none"/><path d={path(-1)} stroke="#ffc979" strokeDasharray="6 4" fill="none"/><path d={path(0)} stroke="#71e5dc" strokeWidth="1.7" fill="none"/>
 <path d={`M${x(time)} 135V335`} stroke="#ffffff" opacity=".6"/><circle cx={x(time)} cy={y(value.x)} r="5" fill="#fff"/>
 <text x="50" y="125" fill="#bfd8e0" fontSize="14">纵轴：±{scale.toFixed(2)} mm（随参数自动缩放）</text><text x="615" y="375" fill="#bfd8e0" fontSize="14">时间 / s</text>
 </svg>
 <label htmlFor="beat-time">拖动时间，逐帧观察：{time.toFixed(2)} s</label><input id="beat-time" aria-label="拍演示时间" className="native-range" type="range" min="0" max={duration} step="0.01" value={time} onChange={e=>{setRunning(false);setTime(Number(e.target.value))}}/>
 <p>{delta<1e-9?'恰好共振：振幅包络随时间线性增长，不再周期性地强弱交替。理想无阻尼模型没有有限的稳态振幅。':`相邻两次包络最大值相隔 ${(1/delta).toFixed(2)} s。将频率继续调近 1.00 Hz，拍变慢；拍周期超过 30 s 时，本窗口不能显示完整一拍。`}</p>
 <h3>课堂观察：先快拍，再慢拍，最后共振</h3><p>依次点击“更快的拍”“明显的拍”“更慢的拍”，数一数 30 秒内有几次强弱起伏；再点击“恰好共振”。注意：纵轴自动缩放，比较振幅时请同时看毫米刻度。</p>
 <button className="secondary" aria-expanded={show} onClick={()=>setShow(!show)}>{show?'收起解释':'为什么会拍？展开公式与解释'}</button>
 {show&&<><div className="equation-block">{equations.map((html,i)=><div className="equation-row" key={i}><div className="equation-math" dangerouslySetInnerHTML={{__html:html}}/></div>)}</div><p>非共振时，激励频率的特解与固有频率的自由响应相加。无阻尼使自由响应持续存在；相近频率之间的相对相位缓慢变化，所以振幅时大时小。拍周期按包络的相邻强峰计数，不是带符号包络的完整周期。</p><p>乐器调音也是利用相近频率的拍：两音越接近，响度起伏越慢。但两个固定幅值的同频声音叠加不会自动无限增长；这里的共振增长来自外力持续对振子做功。</p></>}
 <p className="control-tip">本演示独立参数：f₀ = 1.00 Hz，静位移 F₀/K = 1.00 mm；初始位移和速度为零，无阻尼、线性弹簧。时间按真实秒播放，振子位置与曲线光标同步。</p>
 </section>;
}
