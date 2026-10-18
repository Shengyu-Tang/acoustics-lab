import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
import {models} from './review-p3-models.mjs';
const {lectures}=await models();
const work=path.resolve('outputs/P3-1/browser');fs.mkdirSync(work+'/tmp',{recursive:true});process.env.TEMP=process.env.TMP=work+'/tmp';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4181','--strictPort'],{windowsHide:true,stdio:'ignore'});
let context;const failures=[];
const norm=s=>s.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>'0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(c)]).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g,c=>'0123456789-'['⁰¹²³⁴⁵⁶⁷⁸⁹⁻'.indexOf(c)]).replace(/_[{]?([A-Za-z0-9]+)[}]?/g,'$1');
try{
 for(let i=0;i<80;i++){try{if((await fetch('http://127.0.0.1:4181')).ok)break;}catch{}await new Promise(r=>setTimeout(r,250));}
 context=await chromium.launchPersistentContext(work+'/profile',{channel:'msedge',headless:true,reducedMotion:'reduce'});
 const page=await context.newPage();
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
    const panels=figures.nth(i).locator('svg > g > g');
    for(let j=0;j<defs[i].length;j++){
     const p=defs[i][j];if(p.kind==='polar')continue;
     const actual=await panels.nth(j).locator(':scope > text[transform^="rotate"], :scope > text[data-axis-label], :scope > g > text[data-axis-label]').allTextContents();
     // Fragment children render as direct <text> siblings, so inspect rotated text directly.
     const rotated=await figures.nth(i).locator('svg > g').nth(j).locator('text[transform^="rotate"]').allTextContents();
     const expected=[...(p.field&&!p.field.categories?[p.field.label]:[]),p.ylabel,...(p.rightLabel?[p.rightLabel]:[])].map(norm);
     if(JSON.stringify(rotated)!==JSON.stringify(expected))failures.push(`${width} ${id} figure ${i+1}/${j+1}: ${JSON.stringify(rotated)} != ${JSON.stringify(expected)}`);
    }
   }
   console.log('Checked axis labels '+id+' '+width);
  }
 }
 fs.writeFileSync(work+'/axis-labels.json',JSON.stringify({failures},null,2));
 assert.deepEqual(failures,[],'A2 each panel has only the defined axis and colorbar labels after navigation');
}finally{await context?.close();server.kill();}
