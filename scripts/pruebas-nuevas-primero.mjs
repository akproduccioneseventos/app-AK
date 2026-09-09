#!/usr/bin/env node
/**
 * EL CORTAFUEGOS: LAS PRUEBAS NUEVAS SE CORREN PRIMERO, Y SOLAS.
 *
 * **Por que existe, medido y no supuesto.** La puerta entera son unos cincuenta
 * minutos, y cuando frena, frena casi siempre en el paso de las pruebas de navegador,
 * al minuto cuarenta. Se miraron las ultimas fallas: **ocho de ocho estaban en pruebas
 * NUEVAS o recien tocadas** -las que llegaron con las ordenes 45, 46, 47, 48, 49 y 50-,
 * ninguna en las viejas. Es logico: lo viejo ya paso por la puerta muchas veces.
 *
 * Entonces se corren primero **solo esas**, que son dos o tres minutos. Si estan mal,
 * la puerta frena ahi y no se pagan los cuarenta minutos para enterarse de lo mismo.
 *
 * **No reemplaza a nada.** Despues se corre igual la tanda completa: dos pruebas que
 * pasan por separado pueden romper juntas. Lo unico que hace es **fallar temprano**.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

function sh(comando) {
  const r = spawnSync(comando, { shell: true, encoding: 'utf8' });
  return { ok: r.status === 0, salida: `${r.stdout || ''}` };
}

function pruebasQueCambiaron() {
  const base = sh('git merge-base origin/main HEAD');
  if (!base.ok || !base.salida.trim()) return null; // sin base: no se puede acotar
  const ref = base.salida.trim();

  const guardadas = sh(`git diff --name-only ${ref}...HEAD`);
  const sinGuardar = sh('git status --porcelain');
  if (!guardadas.ok) return null;

  const archivos = [
    ...guardadas.salida.split('\n'),
    ...sinGuardar.salida.split('\n').map((l) => l.slice(3)),
  ]
    .map((f) => f.trim())
    .filter(Boolean);

  /**
   * EL RECORRIDO DE PANTALLAS NO ENTRA ACA, Y ES A PROPOSITO.
   *
   * Tiene su propio paso en la puerta, con su propio acotado -recorre solo las
   * pantallas que toca el cambio-. Metido aca tarda quince minutos y **deja de ser un
   * cortafuegos**: el cortafuegos sirve porque es barato. Se aprendio en la primera
   * corrida con esto puesto, que tardo eso mismo.
   */
  const NO_ENTRAN = ['recorrido-de-pantallas.spec.ts', 'fotos-de-la-app.spec.ts'];

  const specs = [...new Set(archivos)]
    .filter((f) => f.startsWith('tests/e2e/') && f.endsWith('.spec.ts'))
    .filter((f) => !NO_ENTRAN.includes(path.basename(f)))
    .filter((f) => existsSync(path.join(process.cwd(), f)));

  return specs;
}

console.log('='.repeat(60));
console.log('CORTAFUEGOS: LAS PRUEBAS NUEVAS, PRIMERO');
console.log('='.repeat(60));

const specs = pruebasQueCambiaron();

if (specs === null) {
  console.log('No se pudo saber que cambio. Se saltea: la tanda completa las corre igual.\n');
  process.exit(0);
}

if (specs.length === 0) {
  console.log('Ninguna prueba de navegador nueva ni tocada. No hay nada que adelantar.\n');
  process.exit(0);
}

console.log(`${specs.length} prueba(s) de navegador nuevas o tocadas en este cambio:`);
for (const s of specs) console.log(`   ${s}`);
console.log('\nSe corren solas antes que el resto. Si algo esta mal, se sabe en minutos.\n');

const r = spawnSync('node', ['scripts/run-playwright-production.mjs', ...specs], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, AK_RECORRIDO: 'true' },
});

process.exit(r.status ?? 1);
