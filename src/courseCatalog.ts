import topics from './topics.json';import projects from './projects.json';
export const courseTopics=topics;
const entryPoints:Record<string,string>={piston:'4.4.3',nearfield:'4.4.4',reflection:'3.6.2',guide:'3.10.3',intensity:'3.3.3',string:'2.2'};
export const experimentForModel=(m:string)=>topics.find(t=>t.id===entryPoints[m]&&t.model===m)||topics.find(t=>t.model===m)!;
export const projectCount=projects.length;
export const atlasEntries=[...topics.map(t=>({...t,href:'#/lab?topic='+t.id,isProject:false})),...projects.map(p=>({id:'project-'+p.id,title:p.title,chapter:8,model:p.models[0],source:'综合项目',focus:p.background+' '+p.mapping,questions:[p.challenge],href:'#/cases?project='+p.id,isProject:true}))];
export const atlasSummary=`${topics.length} 个知识点 · ${projects.length} 个综合项目`;
export const projectRelations=projects.flatMap(p=>p.models.map(m=>({from:experimentForModel(m).id,to:'project-'+p.id,label:experimentForModel(m).title+' → '+p.field,detail:(experimentForModel(m).focus||experimentForModel(m).title)+' '+p.mapping,type:'concept' as const})));
