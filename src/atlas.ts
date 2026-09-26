import topics from './topics.json';
export const names=['','集中参数振动','弦与棒的振动','声波的传播','声波的辐射','声波的散射','声波的接收','介质的声吸收','声呐综合案例'];
export const colors=['#6de0d2','#f3c480','#85b8ff','#dca9f3','#f3aba7','#9cdbb1','#9ecbdf','#f6d482'];
export type Node3={id:string,title:string,x:number,y:number,z:number,chapter:number,kind:'root'|'chapter'|'topic'};
export type Camera={yaw:number,pitch:number,zoom:number,panX:number,panY:number};
export function project(n:{x:number,y:number,z:number},c:Camera,w:number,h:number){const x=n.x*Math.cos(c.yaw)-n.z*Math.sin(c.yaw),z=n.x*Math.sin(c.yaw)+n.z*Math.cos(c.yaw);const vertical=z*Math.cos(c.pitch)-n.y*Math.sin(c.pitch),depth=z*Math.sin(c.pitch)+n.y*Math.cos(c.pitch),perspective=3600/(3600-depth);return {x:w/2+c.panX+x*c.zoom*perspective,y:h/2+c.panY+vertical*c.zoom*perspective,scale:c.zoom*perspective,depth};}
export const nodes:Node3[]=[{id:'root',title:'声学基础',x:0,y:230,z:0,chapter:0,kind:'root'}];
// Equal-area phyllotaxis keeps dense chapters spacious without reserving empty sectors.
const positions=Array.from({length:topics.length},(_,i)=>{const a=i*Math.PI*(3-Math.sqrt(5)),r=140+Math.sqrt((i+.5)/topics.length)*680;return {x:Math.cos(a)*r*1.5,z:Math.sin(a)*r,y:Math.sin(i*1.73)*135,angle:Math.atan2(Math.sin(a),Math.cos(a))}}).sort((a,b)=>a.angle-b.angle);
export const regions:{chapter:number,start:number,end:number}[]=[];
let cursor=0;
for(let chapter=1;chapter<=8;chapter++){
 const ts=topics.filter(t=>t.chapter===chapter),points=positions.slice(cursor,cursor+ts.length);
 const start=cursor===0?-Math.PI:(positions[cursor-1].angle+points[0].angle)/2,end=cursor+ts.length===positions.length?Math.PI:(points.at(-1)!.angle+positions[cursor+ts.length].angle)/2;
 regions.push({chapter,start,end});
 const a=(start+end)/2;
 nodes.push({id:'chapter-'+chapter,title:names[chapter],x:Math.cos(a)*1410,y:30,z:Math.sin(a)*940,chapter,kind:'chapter'});
 ts.forEach((t,i)=>nodes.push({id:t.id,title:t.title,...points[i],chapter,kind:'topic'}));cursor+=ts.length;
}
export const hierarchy:{from:string,to:string}[]=[];
export type Relation={from:string,to:string,label:string,detail:string,type:'concept'|'sequence'};
const connections=[
 ['1.1.1','2.1','从一个自由度到连续介质','单个质量块只有一个位移坐标；弦上每个位置都有位移。把局部受力规律推广到连续介质后，边界条件筛选出一组模态。'],
 ['1.1.3','1.1.5','从衰减过程到品质因数','阻尼决定自由响应的衰减速度；Q 把这种衰减与频率响应带宽联系起来，是理解换能器拖尾的桥梁。'],
 ['1.2.2','1.2.4','从启动响应到稳态频率特性','受迫响应包含暂态与稳态。暂态衰减后，扫描驱动频率就得到幅频特性，并可借助机械阻抗解释共振。'],
 ['1.2.4','4.1','结构振动如何把能量交给流体','机械驱动使辐射表面振动，流体又以辐射阻抗反作用于结构；其阻性部分对应带走的声功率。'],
 ['2.2','3.10.1','边界条件筛选模态','固定弦的驻波与波导的横向振型都由边界条件选出。波导还要结合轴向波数判断该模态能否传播。'],
 ['3.1.5','3.2.1','三条基本关系合成波动方程','质量守恒、状态关系和运动方程分别连接密度、声压与振速；线性化并消去中间变量，得到声压波动方程。'],
 ['3.2.1','3.4.1','从控制方程到平面波解','波动方程规定传播规律；选择平面行波形式后，可把频率、波数和声速联系起来，并求振速。'],
 ['3.2.1','3.5.1','从时域到频域','假设单一简谐时间因子后，波动方程化为亥姆霍兹方程，空间分布与时间振荡可以分开处理。'],
 ['3.4.2','3.3.3','阻抗连接声压与声强','平面行波的特性阻抗连接声压和振速，二者乘积的时间平均给出声强；这一换算需要行波条件。'],
 ['3.3.3','3.4.6','能量量值转成对数声级','声强按功率比使用 10log，声压按幅值比使用 20log；介质与参考值必须一致才能比较声级。'],
 ['3.4.1','3.S2','波前运动与频移','移动声源改变相邻波前到达接收点的时间间隔，从而改变接收频率；要区分声速与声源运动速度。'],
 ['3.6.1','3.6.2','连续条件确定反射透射','界面处声压和法向振速连续，给出两个方程；结合入射、反射、透射波关系求出幅度系数。'],
 ['3.6.2','3.6.5','从幅度系数到能量守恒','声压透射系数不是能量透射率；必须计入两侧阻抗，才能检查反射与透射声强之和。'],
 ['3.6.2','3.6.7','从垂直入射推广到斜入射','斜入射保留切向相位匹配，同时用法向振速建立边界条件，引出折射方向与角度依赖的反射系数。'],
 ['3.6.1','3.7.1','以表面阻抗替代内部细节','复杂材料和背衬可以整体等效为表面阻抗；反射系数继而决定驻波及不透射表面的吸声率。'],
 ['3.7.1','7.3','把边界匹配用于吸声设计','吸声设计不仅需要耗散，还需要合适的阻抗匹配；过大的反射会阻止能量进入材料。'],
 ['3.S1','3.8.5','多途是空间中的相干叠加','直达与反射路径产生不同传播相位，水面软边界再带来反相；叠加后形成位置和频率相关的峰谷。'],
 ['3.8.1','3.9.1','扩展维度改变距离规律','球面面积随 r² 增长，柱面面积随 r 增长；功率守恒因此给出不同的声强距离衰减规律。'],
 ['3.6.1','3.10.1','边界把自由传播变成波导传播','上下边界约束横向振型，横向波数与总波数共同决定轴向波数及高阶模态截止。'],
 ['3.10.3','3.10.4','截止条件走向频散','模态的轴向波数随频率非线性变化，使相速度与群速度不同；截止附近不能把二者混为一谈。'],
 ['4.2.1','3.8.1','源模型连接传播模型','脉动球表面提供源强与辐射边界条件，外部球面波描述声能离开声源后如何扩展。'],
 ['4.2.3','4.3','相反相位的声源构成偶极子','两个等强反相点声源在不同方向产生不同程差；小间距极限形成偶极指向性。'],
 ['3.S1','4.4.3','孔径面元的相干叠加形成波束','圆活塞上不同面元到观测点的路程不同。相位叠加决定主瓣与旁瓣，孔径相对波长越大，方向选择越强。'],
 ['4.4.3','4.4.4','方向图的使用需要远场条件','近场的面元程差产生轴向起伏；只有在满足远场条件后，才能使用仅依赖观察角的归一化指向性。'],
 ['3.6.1','5.1','散射也是边界定解问题','目标表面要求总场满足边界条件；已知入射场后，所需补充的场就是散射场。'],
 ['1.2.4','6.1','接收链路也有共振与带宽','水听器及接收链路把声压变为电信号；二阶响应可解释谐振峰如何改变被测信号的频谱。'],
 ['4.1','6.2','收发互换的传播约束','在线性互易系统中，交换归一化声源与接收位置可保留传递关系；这为互易校准提供传播基础。'],
 ['7.2','7.1','微观耗散汇总为宏观衰减','黏滞、热传导和弛豫等机理决定频率相关吸收，吸收系数再进入传播路径上的指数衰减。'],
 ['4.4.3','8.1','发射与指向性进入系统预算','声源输出和方向选择性影响声呐预算。孔径设计需与工作频率、平台尺寸和其他环节共同考虑。'],
 ['3.8.1','8.1','往返传播要计算两程损失','单基地主动探测的声波先到目标再返回接收器，因此几何扩展和吸收在声呐方程中出现两次。'],
 ['5.2','8.1','散射把入射声变成回波','目标散射决定回波强弱；总散射截面不能直接替代后向目标强度，需使用与探测几何相符的量。'],
 ['6.1','8.1','回波需要经过接收与判决','接收灵敏度与频响影响测量，环境噪声和检测门限影响可探测性；声呐预算把这些约束串联起来。'],
 ['7.1','8.1','介质吸收消耗链路余量','传播路径越长，吸收损失越大；主动探测还要计算回程，频率选择因此影响作用距离。'],
 ['4.4.3','7.2','高频窄波束与吸收之间的取舍','固定孔径下升频可收窄波束，但介质吸收通常随频率改变；方向分辨和传播距离需要综合设计。']
];
export const relations:Relation[]=connections.map(([from,to,label,detail])=>({from,to,label,detail,type:'concept'}));
for(let chapter=1;chapter<=8;chapter++){const ts=topics.filter(t=>t.chapter===chapter);for(let i=1;i<ts.length;i++){const a=ts[i-1],b=ts[i];if(relations.some(r=>r.from===a.id&&r.to===b.id))continue;relations.push({from:a.id,to:b.id,label:'学习递进 · '+a.title+' → '+b.title,detail:`先掌握：${a.focus||a.title} 随后学习：${b.focus||b.title}`,type:'sequence'})}}
export const chapterStories=['','先建立自由振动模型，再加入阻尼和外力；从时间响应走向机械阻抗、共振与带宽。','从集中参数推广到空间连续分布；通过弦与棒学习边界条件、模态和振型。','从守恒关系推导波动方程，再研究能量、行波与声级；加入界面、空间几何和波导约束，逐步接近真实传播。','从表面振动与辐射阻抗出发，通过球源、偶极子和有限孔径理解声源如何向空间输送能量。','把入射场与目标边界结合，求散射场；比较刚性与软边界怎样改变响应。','从声压到电信号，研究灵敏度与频响，再用互易关系理解校准。','先用吸收系数描述损失，再认识耗散机理；区分介质吸收与边界吸声。','把辐射、传播、散射与接收串联为检测余量，研究系统参数之间的取舍。'];

// Orbit around the ground-plane point under the viewport centre, including after panning.
export function orbitCamera(c:Camera,dyaw:number,dpitch:number){const perspective=Math.max(.1,1-c.panY*Math.tan(c.pitch)/(3600*c.zoom)),xr=-c.panX/(c.zoom*perspective),zr=-c.panY/(c.zoom*Math.cos(c.pitch)*perspective),pivot={x:xr*Math.cos(c.yaw)+zr*Math.sin(c.yaw),y:0,z:-xr*Math.sin(c.yaw)+zr*Math.cos(c.yaw)};c.yaw+=dyaw;c.pitch=Math.max(0,Math.min(1.25,c.pitch+dpitch));const q=project(pivot,{...c,panX:0,panY:0},0,0);c.panX=-q.x;c.panY=-q.y;}
