import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';

mkdirSync('public', { recursive: true });
mkdirSync('public/icons', { recursive: true });

copyFileSync('src/index.html', 'public/index.html');
copyFileSync('src/manifest.webmanifest', 'public/manifest.webmanifest');

let n = 0;
for (const f of readdirSync('src/icons')) {
  copyFileSync(`src/icons/${f}`, `public/icons/${f}`);
  n++;
}
console.log(`✓ index.html, manifest.webmanifest, icons(${n}) → public/`);
