/** @jest-environment node */
import fs from 'fs';
import path from 'path';

/**
 * Orden 163. Los avisos de seguridad que quedan en `npm audit` son de dos clases, y esta prueba
 * frena si alguna deja de serlo:
 *
 * 1. OpenTelemetry (exportador Prometheus, propagador Jaeger, baggage, instrumentaciones):
 *    viven debajo de `@opentelemetry/sdk-node`, que la compilación reemplaza por un sustituto
 *    vacío, y de los plugins de telemetría de Genkit, que la app no importa. Nunca corren.
 * 2. braces, sprintf-js, re2, postcss-selector-parser: herramientas de compilación y prueba
 *    (tailwind, jest, el emulador de Firebase). No viajan al servidor publicado.
 *
 * Si alguien importa OpenTelemetry o esos plugins, o saca el sustituto, el aviso pasa a ser real.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextConfig = require('../../next.config.js');

function aliasDeLaCompilacion(): Record<string, unknown> {
  const webpack = { NormalModuleReplacementPlugin: class {}, DefinePlugin: class {}, IgnorePlugin: class {}, ProvidePlugin: class {} };
  const cfg = nextConfig.webpack(
    { resolve: { alias: {} }, plugins: [], module: { rules: [] }, ignoreWarnings: [], externals: [], output: {}, optimization: {} },
    { isServer: true, dev: false, buildId: 'test', webpack, config: { ...nextConfig, pageExtensions: ['tsx', 'ts'] }, dir: process.cwd() },
  );
  return cfg.resolve.alias;
}

function archivosDe(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : archivosDe(p);
    return /\.(ts|tsx|js|mjs)$/.test(e.name) ? [p] : [];
  });
}

describe('los avisos de dependencias que quedan no llegan a la app publicada', () => {
  it('la compilación reemplaza el SDK de OpenTelemetry por el sustituto vacío', () => {
    const alias = aliasDeLaCompilacion()['@opentelemetry/sdk-node'];
    expect(alias).toBe(path.resolve(process.cwd(), 'src/lib/telemetria-apagada-node-sdk.js'));
  });

  it('ningún archivo de la app importa OpenTelemetry ni los plugins de telemetría de Genkit', () => {
    const prohibido = /from\s+['"](@opentelemetry\/[^'"]+|@genkit-ai\/(firebase|google-cloud)[^'"]*)['"]|require\(\s*['"](@opentelemetry\/|@genkit-ai\/(firebase|google-cloud))/;
    const quienes = archivosDe(path.join(process.cwd(), 'src'))
      .filter((f) => prohibido.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(process.cwd(), f));
    expect(quienes).toEqual([]);
  });

  it('las herramientas con avisos son sólo de desarrollo', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    for (const herramienta of ['firebase-tools', 'jest', 'tailwindcss']) {
      expect({ herramienta, enProduccion: Boolean(pkg.dependencies?.[herramienta]) }).toEqual({ herramienta, enProduccion: false });
    }
  });
});
