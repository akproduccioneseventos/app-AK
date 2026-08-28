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

function getArchivosVersionados() {
  try {
    const raw = execSync('git ls-files -- "*.ts" "*.tsx" "*.js" "*.jsx" "*.md"', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return raw
      .split('\n')
      .map((f) => f.trim().replace(/\\/g, '/'))
      .filter((f) => f.length > 0 && !ARCHIVOS_PERMITIDOS.has(f));
  } catch {
    return [];
  }
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
