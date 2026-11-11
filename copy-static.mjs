import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

mkdirSync('public', { recursive: true });
mkdirSync('public/icons', { recursive: true });

/* app.js / app.css は Firebase Hosting 側で1時間キャッシュされる設定になっている。
   ファイル名が毎回同じだと、デプロイしてもブラウザが古いファイルを使い続けてしまうので、
   中身のハッシュを ?v= として index.html の参照に埋め込み、更新があればURLが変わるようにする。 */
const stamp = (file) => {
  const path = `public/${file}`;
  if (!existsSync(path)) return null;
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 8);
};

let html = readFileSync('index.html', 'utf8');
const applied = [];
for (const file of ['app.css', 'app.js']) {
  const v = stamp(file);
  if (!v) continue;
  // href="/app.css" や src="/app.js"（既に ?v= が付いていても）を置き換える
  html = html.replace(
    new RegExp(`(["'])/${file.replace('.', '\\.')}(\\?v=[a-f0-9]+)?\\1`, 'g'),
    `$1/${file}?v=${v}$1`
  );
  applied.push(`${file}?v=${v}`);
}
writeFileSync('public/index.html', html);

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
console.log(`✓ index.html (${applied.join(', ') || 'バージョン付与なし'}), manifest.webmanifest, icons(${icons.length}) → public/`);
