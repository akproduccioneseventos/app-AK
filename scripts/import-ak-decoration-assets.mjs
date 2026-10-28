import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const source = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Indicar la carpeta AK_DECORACIONES_TODO_CORREGIDO.');
const raw = await fs.readFile(path.join(source, '00_INSTRUCCIONES/catalogo.json'));
const catalog = JSON.parse(raw);
const target = path.resolve('public/media/decoracion-ak');
await fs.mkdir(target, { recursive: true });
const assets = [];
const ids = new Set();
for (const item of catalog.elementos) {
  if (!/^AK-\d{3}$/.test(item.id) || ids.has(item.id)) throw new Error('ID invalido o repetido.');
  if (!item.archivo.startsWith('01_IMPORTAR_APP/')) throw new Error('Solo se importa el paquete actual.');
  const file = path.resolve(source, item.archivo);
  if (!file.startsWith(source + path.sep)) throw new Error('Ruta fuera del paquete.');
  ids.add(item.id);
  const bytes = await fs.readFile(file);
  const name = item.id.toLowerCase() + '.png';
  await fs.copyFile(file, path.join(target, name));
  assets.push({ id: `ak_deco_v2_${item.id}`, name: item.nombre,
    category: item.categoria.replaceAll('_', ' '), url: `/media/decoracion-ak/${name}`,
    pixelWidth: item.ancho, pixelHeight: item.alto,
    sha256: createHash('sha256').update(bytes).digest('hex'), provenance: item.metodo });
}
await fs.writeFile('src/lib/decoracion/ak-assets.json', JSON.stringify({
  sourceSha256: createHash('sha256').update(raw).digest('hex'), assets,
}, null, 2) + '\n');
console.log(JSON.stringify({ imported: assets.length, categories: new Set(assets.map(a => a.category)).size }));
