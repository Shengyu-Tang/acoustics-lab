import topics from './topics.json';
export const names=['','集中参数振动','弦与棒的振动','声波的传播','声波的辐射','声波的散射','声波的接收','介质的声吸收','声呐综合案例'];
export const colors=['#6de0d2','#f3c480','#85b8ff','#dca9f3','#f3aba7','#9cdbb1','#9ecbdf','#f6d482'];
export type Node3={id:string,title:string,x:number,y:number,z:number,chapter:number,kind:'root'|'chapter'|'topic'};
export type Camera={yaw:number,pitch:number,zoom:number,panX:number,panY:number};
export function project(n:{x:number,y:number,z:number},c:Camera,w:number,h:number){const x=n.x*Math.cos(c.yaw)-n.z*Math.sin(c.yaw),z=n.x*Math.sin(c.yaw)+n.z*Math.cos(c.yaw);const vertical=z*Math.cos(c.pitch)-n.y*Math.sin(c.pitch),depth=z*Math.sin(c.pitch)+n.y*Math.cos(c.pitch),perspective=3600/(3600-depth);return {x:w/2+c.panX+x*c.zoom*perspective,y:h/2+c.panY+vertical*c.zoom*perspective,scale:c.zoom*perspective,depth};}
export const nodes:Node3[]=[{id:'root',title:'声学基础',x:0,y:180,z:0,chapter:0,kind:'root'}];
for(let chapter=1;chapter<=8;chapter++){const angle=(chapter-3)*Math.PI/4,cx=Math.cos(angle)*1050,cz=Math.sin(angle)*1050;const ts=topics.filter(t=>t.chapter===chapter),cols=Math.ceil(Math.sqrt(ts.length)),rows=Math.ceil(ts.length/cols);nodes.push({id:'chapter-'+chapter,title:names[chapter],x:cx,y:95,z:cz-rows*50-90,chapter,kind:'chapter'});ts.forEach((t,i)=>nodes.push({id:t.id,title:t.title,x:cx+(i%cols-(cols-1)/2)*190,y:15+(i%3)*12,z:cz+(Math.floor(i/cols)-(rows-1)/2)*100,chapter,kind:'topic'}))}
export const hierarchy=nodes.filter(n=>n.kind!=='root').map(n=>({from:n.kind==='chapter'?'root':'chapter-'+n.chapter,to:n.id}));
// Explicit conceptual connections supplement the directory tree. Each describes a teaching relationship.
export const relations=[
 {from:'1.1.1',to:'2.1',label:'集中参数振动 → 连续介质振动'},
 {from:'1.2.4',to:'4.2.1',label:'受迫振动与共振 → 声源辐射'},
 {from:'3.2.1',to:'3.4.1',label:'波动方程 → 谐和平面波'},
 {from:'3.6.1',to:'3.7.1',label:'边界条件 → 阻抗表面反射'},
 {from:'3.6.1',to:'3.10.1',label:'边界条件 → 波导模态'},
 {from:'4.2.1',to:'5.1',label:'辐射声场 → 散射声场'},
 {from:'4.1',to:'6.1',label:'发射与接收的联系'},
 {from:'7.1',to:'8.1',label:'传播吸收 → 声呐作用距离'},
 {from:'6.1',to:'8.1',label:'声波接收 → 声呐探测'}
].filter(r=>nodes.some(n=>n.id===r.from)&&nodes.some(n=>n.id===r.to));
