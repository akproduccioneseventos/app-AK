/**
 * Orden del dueno, 23 de septiembre de 2026: "se debe probar lo nuevo, no toda la app".
 *
 * Se probo rompiendolo: si `pruebasQueTocanDesde` devuelve todas las pruebas siempre, la
 * segunda comprobacion se cae; si deja de mirar las direcciones, se cae la tercera.
 */
import { pruebasQueTocanDesde, HUMO, visita } from '../../scripts/pruebas-que-tocan.mjs';

const PRUEBAS = [
  ...HUMO,
  'tests/e2e/la-hoja-de-cocina.spec.ts',
  'tests/e2e/salon-3d-cliente.spec.ts',
  'tests/e2e/muro-subir-foto.spec.ts',
];
const TEXTOS: Record<string, string> = {
  'tests/e2e/la-hoja-de-cocina.spec.ts': "await page.goto('/buscar?q=1');",
  'tests/e2e/salon-3d-cliente.spec.ts': "await page.goto(`/portal/c/${clave}`);",
  'tests/e2e/muro-subir-foto.spec.ts': "await page.goto('/muro/abc');",
};
const leer = (f: string) => TEXTOS[f] ?? '';

describe('Se prueba lo nuevo, no toda la app', () => {
  it('sin poder saber que cambio, corren todas', () => {
    expect(pruebasQueTocanDesde(null, PRUEBAS, leer)).toBe('TODAS');
  });

  it('tocar una pantalla corre las pruebas de esa pantalla y el humo, no las demas', () => {
    const r = pruebasQueTocanDesde(['src/app/buscar/page.tsx'], PRUEBAS, leer);
    expect(r).not.toBe('TODAS');
    expect(r).toEqual(expect.arrayContaining([...HUMO, 'tests/e2e/la-hoja-de-cocina.spec.ts']));
    expect(r).not.toContain('tests/e2e/muro-subir-foto.spec.ts');
    expect(r).not.toContain('tests/e2e/salon-3d-cliente.spec.ts');
  });

  it('tocar codigo que solo corre con la base de verdad no hace correr todas (25/9/2026)', () => {
    // Las pruebas de navegador corren con la base local: `generic-json-store.ts` no lo ven.
    // Antes esto hacia correr las 84 (veinte minutos) sin probar nada nuevo.
    const r = pruebasQueTocanDesde(['src/lib/generic-json-store.ts', 'src/lib/firebase-sync.ts'], PRUEBAS, leer);
    expect(r).not.toBe('TODAS');
    expect([...(r as string[])].sort()).toEqual([...HUMO].sort());
  });

  it('una prueba nueva o tocada corre siempre', () => {
    const r = pruebasQueTocanDesde(['tests/e2e/muro-subir-foto.spec.ts'], PRUEBAS, leer);
    expect(r).toContain('tests/e2e/muro-subir-foto.spec.ts');
  });

  it('tocar lo que manda sobre toda la app, o los ayudantes de las pruebas, corre todas', () => {
    expect(pruebasQueTocanDesde(['src/app/layout.tsx'], PRUEBAS, leer)).toBe('TODAS');
    expect(pruebasQueTocanDesde(['tests/e2e/helpers/fiesta-de-prueba.ts'], PRUEBAS, leer)).toBe('TODAS');
    expect(pruebasQueTocanDesde(['playwright.config.ts'], PRUEBAS, leer)).toBe('TODAS');
  });

  it('reconoce una direccion con tramo variable y no confunde prefijos', () => {
    expect(visita("goto(`/portal/c/${k}`)", '/portal/c/[accessKey]')).toBe(true);
    expect(visita("goto('/buscarlo')", '/buscar')).toBe(false);
    expect(visita("goto('/buscar?q=1')", '/buscar')).toBe(true);
  });
});
