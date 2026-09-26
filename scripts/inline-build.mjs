import fs from 'node:fs';import path from 'node:path';
const root=path.resolve('docs');let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
html=html.replace(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g,(_m,src)=>`<script type="module">${fs.readFileSync(path.join(root,src),'utf8').replace(/<\/script/gi,'<\\/script')}</script>`);
html=html.replace(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/g,(_m,src)=>`<style>${fs.readFileSync(path.join(root,src),'utf8')}</style>`);
fs.writeFileSync(path.join(root,'index.html'),html);console.log('Portable GitHub Pages entry built.');
