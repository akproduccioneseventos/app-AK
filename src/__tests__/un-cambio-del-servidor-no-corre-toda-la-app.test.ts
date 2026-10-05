/**
 * Un cambio adentro del servidor no corre las 380 pruebas de navegador (5/10/2026).
 *
 * El dueño: *"no es toda la app, es sólo esas cosas; 40 minutos debería ser 5"*. Medido ese día:
 * un permiso nuevo adentro de `presupuestos.ts` o `insumos.ts`, o un cambio en el botón de voz del
 * asistente flotante, "alcanzaba" las 370 pantallas subiendo de importación en importación y por los
 * armazones, y corrían todas las pruebas. Ahora un cambio del servidor llega hasta la primera
 * pantalla que lo usa, y un armazón se expande sólo si cambió él mismo.
 *
 * Se probó rompiéndolo: con la selección vieja, las tres dan "todo".
 */
import { pantallasTocadasDesde, esSoloDelServidor } from '../../scripts/pantallas-tocadas.mjs';
import { pruebasQueTocanDesde } from '../../scripts/pruebas-que-tocan.mjs';
import fs from 'fs';
import path from 'path';

const todoCambio = () => '*';
const pruebas = fs.readdirSync(path.join(process.cwd(), 'tests/e2e'))
  .filter((f) => f.endsWith('.spec.ts'))
  .map((f) => `tests/e2e/${f}`);

describe('Lo nuevo, no toda la app', () => {
  it('sabe qué es del servidor', () => {
    expect(esSoloDelServidor('src/app/actions/insumos.ts')).toBe(true);
    expect(esSoloDelServidor('src/app/api/asistente/voz-parte/route.ts')).toBe(true);
    expect(esSoloDelServidor('src/components/album/TuVideoDeLaFiestaModal.tsx')).toBe(false);
  });

  it('cambiar los permisos de insumos llega a sus pantallas, no a todas', () => {
    const r = pantallasTocadasDesde(['src/app/actions/insumos.ts'], todoCambio, { pasosDeServidor: 0 });
    expect(r).not.toBe('TODO');
    expect((r as string[]).length).toBeLessThan(20);
    expect(r).toContain('/empresa/insumos');
  }, 120_000);

  it('cambiar el botón de voz del asistente flotante no expande el armazón a todas las pantallas', () => {
    const r = pantallasTocadasDesde(['src/lib/asistente/reproductor-voz.ts'], todoCambio);
    expect(r).not.toBe('TODO');
  }, 120_000);

  it('las pruebas de navegador para un cambio de insumos son pocas, y siempre van las de humo', () => {
    const r = pruebasQueTocanDesde(['src/app/actions/insumos.ts'], pruebas);
    expect(r).not.toBe('TODAS');
    expect((r as string[]).length).toBeLessThan(pruebas.length / 4);
    expect(r).toContain('tests/e2e/internal-smoke.spec.ts');
  }, 120_000);
});
