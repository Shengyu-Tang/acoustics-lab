import fs from 'node:fs';
import {build,stop} from 'esbuild';
export async function models() {
  const files=fs.readdirSync('src/content/lectures').filter(f=>/^3\./.test(f));
  fs.mkdirSync('outputs/P3-1',{recursive:true});
  await build({stdin:{contents:files.map((f,i)=>`export {default as l${i}} from './src/content/lectures/${f}';`).join('')+"export {matlab} from './src/plot/export';export {fmt} from './src/content/p1';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:'outputs/P3-1/models.mjs'});
  stop();
  const all=await import('../outputs/P3-1/models.mjs?'+Date.now());
  return {lectures:files.map((_,i)=>all['l'+i]),matlab:all.matlab,fmt:all.fmt};
}
if(process.argv.includes('--inventory')) {
  const {lectures}=await models();
  for(const l of lectures) for(const e of l.examples) console.log(JSON.stringify({id:l.id,title:e.title,p:e.defaults,asks:e.asks.map(a=>({key:a.key,text:a.text,unit:a.unit,expr:a.matlab,value:a.calc(e.defaults)}))}));
}
