import fs from 'node:fs';
fs.writeFileSync('docs/.nojekyll','');
console.log('GitHub Pages static assets ready (local scripts, styles and fonts).');
