import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';
import {models} from './review-p3-models.mjs';
const {lectures,scriptParts}=await models();
const work=path.resolve('outputs/P3-1/browser');fs.mkdirSync(work+'/tmp',{recursive:true});process.env.TEMP=process.env.TMP=work+'/tmp';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4181','--strictPort'],{windowsHide:true,stdio:'ignore'});
let context;const failures=[],captures=[],errors=[];
const norm=s=>scriptParts(s).map(p=>p.value).join('');
const out='specs/redesign/screenshots/P3-1';fs.mkdirSync(out,{recursive:true});
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:4181')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 context=await chromium.launchPersistentContext(work+'/profile-'+Date.now(),{channel:'msedge',headless:true,reducedMotion:'reduce'});
 context.setDefaultTimeout(45000);
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===1440?900:844});
  // Hash navigation intentionally reuses React/SVG nodes across incompatible plot types.
  const ids=process.argv.includes('--all')?lectures.map(l=>l.id):['3.6.7','3.6.10','3.8.5','3.10.3','3.10.4','3.6.11'];
  for(const id of ids){
   const l=lectures.find(l=>l.id===id);
   await page.goto('http://127.0.0.1:4181/#/lab?topic='+id);await page.locator('h1').filter({hasText:id+' '}).waitFor();
   await page.evaluate(()=>document.fonts.ready);
   const defs=[...l.figures.map(f=>f.plot(l.defaults,0)),...l.examples.map(e=>[e.plot(e.defaults)])];
   const figures=page.locator('.matlab-figure');await figures.first().waitFor();
   for(let i=0;i<defs.length;i++){
    for(let j=0;j<defs[i].length;j++){
     const p=defs[i][j];if(p.kind==='polar')continue;
     // Fragment children render as direct <text> siblings, so inspect rotated text directly.
     const rotated=await figures.nth(i).locator('svg > g').nth(j).locator('text[transform^="rotate"]').allTextContents();
     const expected=[...(p.field&&!p.field.categories?[p.field.label]:[]),p.ylabel,...(p.rightLabel?[p.rightLabel]:[])].map(norm);
     if(JSON.stringify(rotated)!==JSON.stringify(expected))failures.push(`${width} ${id} figure ${i+1}/${j+1}: ${JSON.stringify(rotated)} != ${JSON.stringify(expected)}`);
     const clipping=await figures.nth(i).locator('text[transform^="rotate"]').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBoundingClientRect(),s=n.ownerSVGElement.getBoundingClientRect();return {text:n.textContent,inside:b.left>=s.left-1&&b.right<=s.right+1&&b.top>=s.top-1&&b.bottom<=s.bottom+1};}).filter(n=>!n.inside));
     if(clipping.length) failures.push(`${width} ${id}: clipped axis/colorbar labels ${JSON.stringify(clipping)}`);
     const axis=figures.nth(i).locator('svg > g').nth(j);
     assert.equal(await axis.locator('[data-axis-label=left]').count(),1,id+' unique left axis');
     assert.equal(await axis.locator('[data-axis-label=left]').textContent(),norm(p.ylabel),id+' axis equals definition');
     assert.equal(await axis.locator('[data-axis-label=right]').count(),p.rightLabel?1:0,id+' no stale right axis');
     assert.equal(await axis.locator('[data-axis-label=colorbar]').count(),p.field&&!p.field.categories?1:0,id+' no stale colorbar');
    }
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,id+' no page overflow');
   if(process.argv.includes('--capture')){
    const size=width===1440?'desktop':'mobile';
    for(let i=0;i<defs.length;i++){
     const name=i<l.figures.length?l.figures[i].number:id+'-E'+(i-l.figures.length+1),file=`${out}/${name}-${size}.png`;
     await figures.nth(i).screenshot({path:file});captures.push({id,name,width,file});
    }
    await page.screenshot({path:`${work}/${id}-${size}-default.png`,fullPage:true});
   }
   console.log('Checked axis labels '+id+' '+width);
   if(process.argv.includes('--paint')){
    await figures.first().screenshot({path:work+'/navigation.png'});
    await page.reload();await page.locator('.matlab-figure').first().waitFor();await page.evaluate(()=>document.fonts.ready);
    await page.locator('.matlab-figure').first().screenshot({path:work+'/fresh.png'});
    const r=spawnSync('python',['-c',"from PIL import Image,ImageChops;import sys; a=Image.open(sys.argv[1]).convert('RGB');b=Image.open(sys.argv[2]).convert('RGB');print(ImageChops.difference(a,b).getbbox())",work+'/navigation.png',work+'/fresh.png'],{encoding:'utf8',windowsHide:true});
    if(r.stdout.trim()!=='None')failures.push(`${width} ${id}: SVG paint differs after navigation: ${r.stdout.trim()}`);
   }
  }
 }
 fs.writeFileSync(work+'/axis-labels.json',JSON.stringify({failures,errors,captures},null,2));
 if(process.argv.includes('--capture'))fs.writeFileSync(out+'/manifest.json',JSON.stringify({viewports:[[1440,900],[390,844]],defaults:true,failures,errors,captures},null,2)+'\n');
 assert.deepEqual(errors,[]);
 assert.deepEqual(failures,[],'A2 each panel has only the defined axis and colorbar labels after navigation');
}finally{await Promise.race([context?.close(),new Promise(r=>setTimeout(r,5000))]);server.kill();}
process.exit(0);
