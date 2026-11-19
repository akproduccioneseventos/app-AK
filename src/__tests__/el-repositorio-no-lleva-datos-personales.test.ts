import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const CAMPOS_SENSIBLES = new Set(['cedula', 'ci', 'documento', 'telefono', 'fechaNacimiento']);

function buscarCamposSensibles(obj: unknown, ruta: string, hallazgos: string[]) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => buscarCamposSensibles(item, `${ruta}[${i}]`, hallazgos));
    return;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (CAMPOS_SENSIBLES.has(k) && v !== null && v !== undefined && String(v).trim() !== '') {
      hallazgos.push(`${ruta}.${k}`);
    }
    buscarCamposSensibles(v, `${ruta}.${k}`, hallazgos);
  }
}

describe('Orden 311 Bloque 1: el repositorio no lleva datos personales reales', () => {
  it('ningún archivo JSON versionado en src/data o data tiene cedula, ci, documento, telefono ni fechaNacimiento con valor', () => {
    const salida = execFileSync('git', ['ls-files', 'src/data', 'data'], {
      cwd: RAIZ,
      encoding: 'utf8',
    });
    const archivos = salida
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.endsWith('.json'));

    const errores: string[] = [];
    for (const rel of archivos) {
      const full = path.join(RAIZ, rel);
      try {
        const parsed = JSON.parse(readFileSync(full, 'utf8'));
        buscarCamposSensibles(parsed, rel, errores);
      } catch {
        // Ignorar JSONs inválidos o no parseables
      }
    }

    expect(errores).toEqual([]);
  });
});
