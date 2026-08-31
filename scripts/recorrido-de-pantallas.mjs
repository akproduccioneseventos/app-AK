import { spawnSync } from 'node:child_process';
import process from 'node:process';

console.log('='.repeat(60));
console.log('RECORRIDO DE TODAS LAS PANTALLAS (353)');
console.log('='.repeat(60));

const r = spawnSync(
  'node',
  ['scripts/run-playwright-production.mjs', 'tests/e2e/recorrido-de-pantallas.spec.ts'],
  {
    stdio: 'inherit',
    shell: true,
  },
);

process.exit(r.status || 0);
