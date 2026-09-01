import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public', { recursive: true });
mkdirSync('public/icons', { recursive: true });

copyFileSync('index.html', 'public/index.html');
copyFileSync('manifest.webmanifest', 'public/manifest.webmanifest');

const icons = [
  'apple-touch-icon.png',
  'favicon-32.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
];
for (const f of icons) {
  copyFileSync(f, `public/icons/${f}`);
}
console.log(`✓ index.html, manifest.webmanifest, icons(${icons.length}) → public/`);
