import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../..', import.meta.url));
const sha = '9bb955ac6af65a314f3ac62975020b37c9edaaf3';
const cache = new Map();
const read = (file) => {
  if (!cache.has(file)) cache.set(file, execFileSync('git', ['show', `${sha}:${file}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 }));
  return cache.get(file);
};
const hash = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const jsonFile = 'src/data/menus-catering.json';
const helperFile = 'src/lib/catering/menu-images.ts';
const exports = {};
vm.runInNewContext(ts.transpileModule(read(helperFile).toString('utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports }, { filename: helperFile });
const previous = new Set(['dish_main_2', 'dish_main_5', 'dish_main_7', 'dish_main_8', 'dish_main_11', 'dish_main_17', 'dish_main_18']);
const menus = JSON.parse(read(jsonFile).toString('utf8'));
const result = [];
for (const menu of menus) for (const item of menu.items) {
  const resolved = exports.getCateringDishImage(item);
  const entry = { category: menu.name, id: item.id, name: item.name, originalUrl: item.imageUrl ?? null,
    resolved: resolved ?? null, previousVisualCheck: previous.has(item.id) };
  if (resolved) {
    if (!resolved.startsWith('/catering/menus/xv/')) throw new Error(`Asset fuera del alcance: ${resolved}`);
    entry.gitAsset = `public${resolved}`;
    entry.assetSha256 = hash(read(entry.gitAsset));
  }
  result.push(entry);
}
const directory = path.join(root, 'docs/evidencias/77-resultados');
fs.mkdirSync(directory, { recursive: true });
const pendingVisual = result.filter((entry) => !entry.previousVisualCheck);
const xml = (text) => text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const tiles = [];
for (const entry of pendingVisual) {
  const tile = sharp({ create: { width: 256, height: 260, channels: 3, background: '#ffffff' } });
  const layers = [];
  if (entry.gitAsset) layers.push({ input: await sharp(read(entry.gitAsset)).resize(240, 180, { fit: 'contain', background: '#f2f2f2' }).png().toBuffer(), left: 8, top: 5 });
  const words = entry.name.split(' '); const lines = [''];
  for (const word of words) { if (`${lines.at(-1)} ${word}`.trim().length > 29) lines.push(word); else lines[lines.length - 1] = `${lines.at(-1)} ${word}`.trim(); }
  const label = `<svg width="256" height="72"><rect width="256" height="72" fill="white"/><text x="8" y="14" font-size="12" font-family="Arial" fill="#333">${xml(entry.id)}</text>${lines.slice(0, 3).map((line, i) => `<text x="8" y="${31 + i * 15}" font-size="12" font-family="Arial" fill="#111">${xml(line)}</text>`).join('')}</svg>`;
  layers.push({ input: Buffer.from(label), left: 0, top: 187 });
  tiles.push(await tile.composite(layers).png().toBuffer());
}
const sheets = [];
for (let start = 0; start < tiles.length; start += 8) {
  const file = `contacto-${1 + start / 8}.png`;
  const group = tiles.slice(start, start + 8);
  await sharp({ create: { width: 1024, height: 520, channels: 3, background: '#dddddd' } })
    .composite(group.map((input, i) => ({ input, left: (i % 4) * 256, top: Math.floor(i / 4) * 260 })))
    .png().toFile(path.join(directory, file));
  sheets.push({ file, items: pendingVisual.slice(start, start + 8).map((entry) => entry.id) });
}
const manifest = { sourceCommit: sha, observedAtUtc: new Date().toISOString(),
  sources: [{ file: jsonFile, sha256: hash(read(jsonFile)) }, { file: helperFile, sha256: hash(read(helperFile)) }],
  meaning: 'Vista de assets exactos de Git y helper real; NO catalogo Firebase ni aceptacion visual automatica. Originales no modificados.',
  items: result, sheets };
fs.writeFileSync(path.join(directory, 'catalogo.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ total: result.length, imageMissing: result.filter((x) => !x.resolved).map((x) => x.id), previousVisualCheck: previous.size, pendingVisual: pendingVisual.length, sheets: sheets.length }));
