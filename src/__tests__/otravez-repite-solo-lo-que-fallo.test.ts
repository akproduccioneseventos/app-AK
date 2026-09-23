import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * `npm run otravez` tiene que repetir SOLO lo que fallo.
 *
 * Hasta el 23 de septiembre de 2026 le pasaba `--last-failed` a Playwright, que con el
 * informe en JSON no anota nada: corria las 80 pruebas enteras para repetir una. Eran 24
 * minutos en vez de 40 segundos.
 */
describe('otravez repite solo lo que fallo', () => {
  const correr = (lista: string[] | null) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'otravez-'));
    const archivo = path.join(dir, 'fallas.json');
    if (lista) fs.writeFileSync(archivo, JSON.stringify(lista));
    return spawnSync('node', ['scripts/run-playwright-production.mjs', '--last-failed'], {
      cwd: process.cwd(),
      env: { ...process.env, AK_ARCHIVO_DE_FALLAS: archivo, AK_SOLO_DECIR_QUE_CORRERIA: 'true' },
      encoding: 'utf8',
      timeout: 20_000,
    });
  };

  it('sin fallas anotadas no corre nada, en vez de correr todo', () => {
    const r = correr(null);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('no hay nada que repetir');
    expect(r.stdout).not.toContain('EJECUTANDO PRUEBAS');
  });

  it('con una falla anotada corre solo ese archivo', () => {
    const r = correr(['tests/e2e/la-puerta-de-entrada-anda.spec.ts']);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('(1 archivo/s): la-puerta-de-entrada-anda.spec.ts');
    expect(r.stdout).not.toContain('EJECUTANDO PRUEBAS');
  });
});

describe('la puerta no compila dos veces', () => {
  it('el paso de navegador no vuelve a compilar lo que el paso de compilacion ya compilo', () => {
    const puerta = fs.readFileSync(path.join(process.cwd(), 'scripts/se-puede-publicar.mjs'), 'utf8');
    const paso = puerta.slice(puerta.indexOf("nombre: 'La app usada de verdad'"));
    const comando = paso.match(/comando:\s*'([^']+)'/)?.[1] ?? '';
    expect(comando).toBe('node scripts/run-playwright-production.mjs --lo-que-toca');
  });
});
