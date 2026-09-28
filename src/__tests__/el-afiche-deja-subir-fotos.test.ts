/**
 * El afiche impreso del muro dice "Subí tus fotos", y su QR no llevaba permiso: el invitado que lo
 * escaneaba sólo podía mirar (28/09/2026). Ahora lleva el permiso de invitado del tótem, que vale
 * hasta el fin del día siguiente a la fiesta, y sólo lo entrega el servidor a alguien del equipo.
 */
import fs from 'fs';
import path from 'path';
import { segundosDelPermisoDelAfiche } from '@/lib/entertainment/vigencia-del-afiche';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('cuánto dura el permiso del afiche', () => {
  it('impreso tres días antes, sigue valiendo la noche de la fiesta', () => {
    const imprimo = new Date('2026-10-01T15:00:00Z');
    const nocheDeLaFiesta = new Date('2026-10-04T05:00:00Z'); // 2 de la mañana del domingo en Uruguay
    const segundos = segundosDelPermisoDelAfiche('2026-10-03', imprimo);
    expect(imprimo.getTime() + segundos * 1000).toBeGreaterThan(nocheDeLaFiesta.getTime());
  });

  it('vence al terminar el día siguiente a la fiesta, en hora de Uruguay', () => {
    // Fiesta el sábado 3: vale hasta el domingo 4 a las 23:59 de Uruguay (lunes 5, 03:00 UTC).
    expect(segundosDelPermisoDelAfiche('2026-10-03', new Date('2026-10-05T02:59:00Z'))).toBe(60);
    expect(segundosDelPermisoDelAfiche('2026-10-03', new Date('2026-10-05T03:00:00Z'))).toBe(0);
  });

  it('sin fecha, no hay permiso', () => {
    expect(segundosDelPermisoDelAfiche(undefined)).toBe(0);
    expect(segundosDelPermisoDelAfiche('sin fecha')).toBe(0);
  });
});

describe('el afiche usa el permiso', () => {
  it('el QR lleva el permiso del tótem y avisa si no lo consiguió', () => {
    const afiche = leer('src/app/evento/muro-en-vivo/[fiestaId]/afiche/page.tsx');
    expect(afiche).toMatch(/getPermisoDelAfiche\(fiestaId\)/);
    expect(afiche).toMatch(/estacion=totems&access=\$\{encodeURIComponent\(permiso\)\}/);
    expect(afiche).toMatch(/data-testid="afiche-sin-permiso"/);
  });

  it('el permiso sólo se lo da el servidor a alguien del equipo', () => {
    const acciones = leer('src/app/actions/fiesta/entretenimiento.actions.ts');
    const cuerpo = acciones.slice(acciones.indexOf('export async function getPermisoDelAfiche'));
    const hastaElFin = cuerpo.slice(0, cuerpo.indexOf('\n}\n'));
    expect(hastaElFin).toMatch(/await requireAppSession\(\);/);
    expect(hastaElFin).toMatch(/createEntertainmentAccessToken\(fiestaId, 'totems', 'guest', segundos\)/);
  });
});
