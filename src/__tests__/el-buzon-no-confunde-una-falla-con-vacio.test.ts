/**
 * MATAFUEGO — Una falla de lectura del buzon NO es un buzon vacio.
 *
 * Lo encontro Codex el 20 de septiembre de 2026: cuando la lectura fallaba,
 * `getBuzonMessages` devolvia una lista vacia. La pantalla borraba los saludos que se
 * estaban viendo y encima anunciaba "Sincronizado", y la descarga armaba un archivo
 * vacio como si fueran todos los recuerdos de la fiesta.
 *
 * Se probo rompiendola a proposito: haciendo que el detalle devuelva
 * `huboFalla: false` en el catch, esta prueba se pone en rojo.
 */

const requireAppSession = jest.fn();
let baseFalsa: any = null;

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: (...a: any[]) => requireAppSession(...a),
}));
jest.mock('@/lib/firebase/server', () => ({
  get dbAdmin() {
    if (baseFalsa instanceof Error) throw baseFalsa;
    return baseFalsa;
  },
}));

import { getBuzonMessagesConDetalle } from '@/app/actions/buzon';

function baseQueDevuelve(docs: any[]) {
  return {
    collection: () => ({
      where: () => ({ get: async () => ({ docs }) }),
    }),
  };
}

describe('El buzon no confunde una falla con vacio', () => {
  beforeEach(() => {
    requireAppSession.mockReset();
    requireAppSession.mockResolvedValue({ ok: true });
    baseFalsa = null;
  });

  it('si la base no contesta, avisa que fallo y no dice que esta vacio', async () => {
    baseFalsa = new Error('la base no contesta');

    const detalle = await getBuzonMessagesConDetalle('fiesta_1');

    expect(detalle.huboFalla).toBe(true);
    expect(detalle.mensajes).toEqual([]);
  });

  it('si no hay saludos de verdad, NO marca falla', async () => {
    baseFalsa = baseQueDevuelve([]);

    const detalle = await getBuzonMessagesConDetalle('fiesta_1');

    expect(detalle.huboFalla).toBe(false);
    expect(detalle.mensajes).toEqual([]);
  });

  it('trae los saludos del mas nuevo al mas viejo', async () => {
    baseFalsa = baseQueDevuelve([
      { data: () => ({ id: 'viejo', fiestaId: 'fiesta_1', timestamp: '2026-09-01T10:00:00.000Z' }) },
      { data: () => ({ id: 'nuevo', fiestaId: 'fiesta_1', timestamp: '2026-09-20T10:00:00.000Z' }) },
    ]);

    const detalle = await getBuzonMessagesConDetalle('fiesta_1');

    expect(detalle.huboFalla).toBe(false);
    expect(detalle.mensajes.map((m: any) => m.id)).toEqual(['nuevo', 'viejo']);
  });
});

describe('La pantalla y la descarga miran ese aviso', () => {
  const fs = require('fs');
  const path = require('path');
  const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf-8');

  it('la pantalla del buzon usa el detalle, no la lista pelada', () => {
    const pantalla = leer('src/app/(app)/fiestas/nueva/buzon/page.tsx');
    expect(pantalla).toContain('getBuzonMessagesConDetalle');
    expect(pantalla).toContain('huboFallaAlLeer');
    // Y el aviso se ve en pantalla, no queda en una variable que nadie mira.
    expect(pantalla).toContain('No se pudieron traer los saludos');
  });

  it('la descarga no arma un archivo vacio cuando fallo la lectura', () => {
    const ruta = leer('src/app/api/buzon/[fiestaId]/download/route.ts');
    expect(ruta).toContain('getBuzonMessagesConDetalle');
    expect(ruta).toContain('huboFalla');
  });
});
