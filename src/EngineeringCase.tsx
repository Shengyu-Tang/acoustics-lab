import cases from './cases.json';
import {models,defaults,fmt,result} from './physics';
type Topic={id:string;title:string;model:string;focus?:string};
export default function EngineeringCase({topic,onLoad}:{topic:Topic;onLoad:()=>void}){
 const c=cases[topic.model as keyof typeof cases],m=models[topic.model],v={...defaults(m),...m.preset};
 return <section className="engineering-case"><div className="case-kicker">ENGINEERING CHALLENGE · 工程任务书</div><h3>{c.title}</h3><p className="case-background">{c.background}</p><div className="case-columns"><div><h4>从项目到模型</h4><p>{c.mapping}</p></div><div><h4>你的设计任务</h4><p>{c.challenge}</p></div></div><div className="case-actions"><button className="primary" onClick={onLoad}>载入案例工况 ↓</button><span>{m.params.map(p=>`${p.label} = ${fmt(v[p.key])} ${p.unit}`).join(' · ')}</span></div><details className="case-review"><summary>完成实验后，核对案例工况</summary><p>{result(topic.model,v).map(([label,n,u])=>`${label}：${fmt(n)} ${u}`).join('；')}</p><p><b>本节论证：</b>围绕“{topic.focus||topic.title}”写出参数改变、观察证据和工程结论，并说明模型边界如何限制这个结论。</p></details></section>
}
