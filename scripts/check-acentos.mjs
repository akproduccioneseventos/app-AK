#!/usr/bin/env node
/**
 * Detector multiplataforma de acentos rotos ("mojibake") en el código.
 * Funciona de manera nativa en Windows, Linux y macOS sin requerir bash.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PATRON_MOJIBAKE = /Ã[¡©\u00ad³º±\t ]|Â[¿¡«»°]|â€[™œ<\s]/;

const ARCHIVOS_PERMITIDOS = new Set([
  'src/__tests__/acentos-rotos.test.ts',
  'src/app/(app)/settings/datos/page.tsx',
  'scripts/check-acentos.sh',
  'scripts/check-acentos.mjs',
  'auditoria-out/informe.md',
]);

/**
 * Un control que no pudo mirar NO dice que esta todo bien.
 *
 * Antes, si `git ls-files` fallaba, esta funcion se tragaba el error y devolvia
 * una lista vacia; el script imprimia "sin acentos rotos (0 archivos revisados)"
 * y terminaba en exito. O sea: **el control daba verde sin haber revisado nada**,
 * y es uno de los seis pasos de la puerta. Es el mismo defecto que tenia el
 * corredor de pruebas de navegador, que decia "todas pasaron" con cero pruebas
 * corridas. Ahora falla fuerte y dice por que.
 */
function getArchivosVersionados() {
  let raw;
  try {
    raw = execSync('git ls-files -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.md"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    console.error('Acentos: NO SE PUDO REVISAR. No se pudo leer la lista de archivos del repositorio.');
    console.error(String(error?.message || error).split('\n')[0]);
    console.error('Esto no es "todo bien": es que el control no pudo mirar. Corregilo antes de seguir.');
    process.exit(1);
  }

  const archivos = raw
    .split('\n')
    .map((f) => f.trim().replace(/\\/g, '/'))
    .filter((f) => f.length > 0);

  if (archivos.length === 0) {
    console.error('Acentos: NO SE PUDO REVISAR. El repositorio no devolvio ningun archivo para mirar.');
    console.error('Un proyecto con cero archivos versionados no existe: algo esta mal en el entorno.');
    process.exit(1);
  }

  return archivos.filter((f) => !ARCHIVOS_PERMITIDOS.has(f));
}

const archivos = getArchivosVersionados();
const lineasRotas = [];

for (const relPath of archivos) {
  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) continue;

  try {
    const contenido = fs.readFileSync(absPath, 'utf8');
    const lineas = contenido.split('\n');
    for (let i = 0; i < lineas.length; i++) {
      if (PATRON_MOJIBAKE.test(lineas[i])) {
        lineasRotas.push(`${relPath}:${i + 1}: ${lineas[i].trim().slice(0, 100)}`);
      }
    }
  } catch {}
}

if (lineasRotas.length === 0) {
  console.log(`Acentos: bien, sin acentos rotos (${archivos.length} archivos revisados).`);
  process.exit(0);
} else {
  console.error(`Acentos: PROBLEMA. ${lineasRotas.length} líneas con acentos rotos.`);
  console.error(lineasRotas.slice(0, 30).join('\n'));
  if (lineasRotas.length > 30) {
    console.error(`... y ${lineasRotas.length - 30} más.`);
  }
  process.exit(1);
}
