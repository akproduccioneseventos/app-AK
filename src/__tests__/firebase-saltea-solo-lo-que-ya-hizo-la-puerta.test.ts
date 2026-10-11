/** @jest-environment node */
/**
 * Firebase App Hosting se moría en el paso "revisar tipos y estilo" sin dar ningún error, y la web
 * se quedó tres publicaciones atrás (10/10/2026). Decisión del dueño: en Firebase se saltea ese
 * paso, porque la puerta (`npm run "publicar?"`) lo hace completo antes de toda fusión.
 *
 * Lo que este control cuida: que el salteo valga SÓLO adentro de Firebase. Si alguien lo prende
 * para todos, la puerta dejaría de revisar tipos y nadie se enteraría.
 *
 * Probado rompiéndolo: con `ignoreBuildErrors: true` fijo, la segunda prueba se pone en rojo.
 */
import { spawnSync } from 'child_process';

/** Carga la configuración en un proceso aparte, como la carga Next al compilar. */
function cargarConfig(env: Record<string, string | undefined>) {
  const entorno: NodeJS.ProcessEnv = { ...process.env };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete entorno[k];
    else entorno[k] = v;
  }
  const r = spawnSync('node', ['-e', "const c=require('./next.config.js');process.stdout.write(JSON.stringify({typescript:c.typescript,eslint:c.eslint}))"], {
    cwd: process.cwd(), env: entorno, encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}

it('en Firebase App Hosting se saltea el revisor de tipos y estilo (lo hizo la puerta)', () => {
  const c = cargarConfig({ FIREBASE_APP_HOSTING: '1' });
  expect(c.typescript?.ignoreBuildErrors).toBe(true);
  expect(c.eslint?.ignoreDuringBuilds).toBe(true);
});

it('fuera de Firebase (la puerta, la máquina local) se revisa todo como siempre', () => {
  const c = cargarConfig({ FIREBASE_APP_HOSTING: undefined });
  expect(c.typescript?.ignoreBuildErrors).toBe(false);
  expect(c.eslint?.ignoreDuringBuilds).toBe(false);
});
