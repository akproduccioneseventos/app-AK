import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next');
/**
 * Cuanta memoria se le da a la compilacion.
 *
 * **Antes se respetaba cualquier valor que ya viniera puesto, y eso rompio la
 * verificacion durante una hora.** Los ayudantes economicos corren con un tope
 * bajo heredado del entorno; la compilacion moria por falta de memoria y el
 * informe decia "la rama no compila", cuando la rama estaba perfecta.
 *
 * Ahora **se toma el mayor de los dos**: si el entorno trae un tope mas chico que
 * el que hace falta, se sube. Si trae uno mas grande, se respeta.
 */
const heapMb = Number(process.env.AK_NEXT_BUILD_HEAP_MB || '4096');
const existingNodeOptions = process.env.NODE_OPTIONS || '';
const heapYaPuesto = existingNodeOptions.match(/--max-old-space-size=(\d+)/);
const heapFinal = heapYaPuesto
  ? Math.max(Number(heapYaPuesto[1]) || 0, heapMb)
  : heapMb;

const nodeOptions = heapYaPuesto
  ? existingNodeOptions.replace(/--max-old-space-size=\d+/, `--max-old-space-size=${heapFinal}`)
  : `${existingNodeOptions} --max-old-space-size=${heapFinal}`.trim();

if (heapYaPuesto && heapFinal > Number(heapYaPuesto[1])) {
  console.log(
    `[build-next-with-memory] El entorno traia ${heapYaPuesto[1]} MB de memoria, `
    + `que no alcanza. Se sube a ${heapFinal} MB.`,
  );
}

const child = spawn(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED || '1',
    NODE_OPTIONS: nodeOptions,
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error('[build-next-with-memory] Failed to start Next build:', error);
  process.exit(1);
});
