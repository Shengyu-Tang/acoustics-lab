import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {fmt} from './physics';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {arrayFactor,ductPressure,layerPressure,layer,type ComparisonKind,type Settings} from './comparisonPhysics';

export default function ComparisonScene({kind,v}:{kind:ComparisonKind,v:Settings}){
 const host=useRef<HTMLDivElement>(null),latest=useRef(v),paused=useRef(false),reset=useRef(()=>{});latest.current=v;
 const [stopped,setStopped]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[failed,setFailed]=useState(false);paused.current=stopped;
 useEffect(()=>{const el=host.current!;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{setFailed(true);return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#091f2c');el.appendChild(renderer.domElement);renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label',kind==='array'?'三维阵列方向性曲面':kind==='duct'?'圆管横截面连续声压振型':'三介质的连续声压波面');
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,.01,80);camera.position.set(4.5,4.1,5.8);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3;controls.maxDistance=18;controls.mouseButtons.LEFT=THREE.MOUSE.ROTATE;controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;controls.target.set(0,0,0);reset.current=()=>{camera.position.set(4.5,4.1,5.8);controls.target.set(0,0,0);controls.update();};
 const geometry=new THREE.BufferGeometry(),coords:number[]=[],indices:number[]=[],uv:number[]=[];const nu=80,nv=48;
 for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){coords.push(0,0,0);uv.push(i/nu,j/nv);if(i<nu&&j<nv){const a=j*(nu+1)+i,b=a+nu+1;indices.push(a,b,a+1,a+1,b,b+1);}}
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(coords.length),3));geometry.setIndex(indices);
 const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,transparent:true,opacity:.87});const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 const grid=new THREE.GridHelper(8,20,0x285164,0x173a49);grid.position.y=-1.1;scene.add(grid);
 const borderGeometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:129},(_,i)=>new THREE.Vector3(2*Math.cos(i*Math.PI/64),0,2*Math.sin(i*Math.PI/64))));const borderMaterial=new THREE.LineBasicMaterial({color:0xb3dce4});const border=new THREE.LineLoop(borderGeometry,borderMaterial);border.visible=kind==='duct';scene.add(border);
 const interfaceGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-1,-1.4),new THREE.Vector3(0,1.3,-1.4),new THREE.Vector3(0,1.3,1.4),new THREE.Vector3(0,-1,1.4)]);const interfaceMaterial=new THREE.LineBasicMaterial({color:0xffc477});const interfaces=[new THREE.LineLoop(interfaceGeometry,interfaceMaterial),new THREE.LineLoop(interfaceGeometry,interfaceMaterial)];interfaces.forEach(x=>{x.visible=kind==='layer';scene.add(x)});
 const axes=new THREE.AxesHelper(1);axes.position.set(-3,-1.05,-2);scene.add(axes);
 const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(el);
 let visible=true;const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observer.observe(el);
 let frame=0,last=0,phase=0;const color=new THREE.Color(),pos=geometry.getAttribute('position'),col=geometry.getAttribute('color');
 function draw(now:number){frame=requestAnimationFrame(draw);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(!paused.current)phase+=dt*2;const p=latest.current;const layerState=kind==='layer'?layer(p):null;const pressureScale=layerState?Math.max(2,Math.hypot(...layerState.t)*Math.max(1,p.q/p.s)):2;if(kind==='layer'){interfaces[0].position.x=-3+6*1.5/(3+p.h);interfaces[1].position.x=-3+6*(1.5+p.h)/(3+p.h);}
 for(let n=0;n<uv.length/2;n++){const u=uv[n*2],w=uv[n*2+1];let x=0,y=0,z=0,value=0;
 if(kind==='array'){const polar=w*Math.PI,az=u*2*Math.PI,dy=Math.cos(polar),dx=Math.sin(polar)*Math.cos(az),dz=Math.sin(polar)*Math.sin(az),a=arrayFactor(dy,p),amp=Math.hypot(...a);x=2.3*amp*dx;y=2.3*amp*dy;z=2.3*amp*dz;value=amp*(.8+.2*Math.cos(phase));}
 else if(kind==='duct'){const r=w,angle=u*2*Math.PI;x=2*r*Math.cos(angle);z=2*r*Math.sin(angle);value=ductPressure(r,angle,p.z,phase,p);y=value*.8;}
 else{const distance=-1.5+u*(3+p.h),a=layerPressure(distance,p);value=(a[0]*Math.cos(phase)-a[1]*Math.sin(phase))/pressureScale;x=-3+6*u;z=(w-.5)*2.5;y=value*.7;}
 pos.setXYZ(n,x,y,z);const intensity=Math.min(1,Math.abs(value));color.setRGB(.035+intensity*(value>=0?.24:.9),.13+intensity*(value>=0?.73:.32),.18+intensity*(value>=0?.69:.16));col.setXYZ(n,color.r,color.g,color.b);}
 pos.needsUpdate=true;col.needsUpdate=true;controls.update();renderer.render(scene,camera);}
 frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();controls.dispose();geometry.dispose();material.dispose();borderGeometry.dispose();borderMaterial.dispose();interfaceGeometry.dispose();interfaceMaterial.dispose();grid.geometry.dispose();(grid.material as THREE.Material).dispose();axes.geometry.dispose();(axes.material as THREE.Material).dispose();renderer.dispose();renderer.domElement.remove();};
 },[kind]);
 return <div className="comparison-visual"><div className="comparison-visual-toolbar"><span>{kind==='array'?'立体方向性':kind==='duct'?'圆管横截面 · 声压振型':'连续声压 · 入射、层内与透射'}</span><button onClick={()=>setStopped(!stopped)}>{stopped?'播放对照动画':'暂停对照动画'}</button><button onClick={()=>reset.current()}>复位视角</button></div><div ref={host} className="comparison-canvas"/>{failed&&<p>当前设备无法显示 WebGL，请使用下方曲线与数值进行比较。</p>}<p>拖动旋转 · 滚轮缩放 · 右键平移。{kind==='array'?'青色明暗表示幅度，亮度缓慢起伏帮助观察曲面。':'青色正压、暖色负压，动画统一慢放。'}{kind==='array'?'曲面半径表示归一化远场声压幅度，不表示传播距离。':kind==='duct'?`表面高度表示声压，不是管壁形变；观察截面 z=${fmt(v.z)} m。`:'金色框为层的两侧界面；波面高度表示声压。全场共用自适应比例，防止层内共振超出画面；不同方案的绝对大小请比较透射率。'}</p></div>;
}
