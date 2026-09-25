/**
 * MATAFUEGO — El control de stock de la carga suma todos los renglones del mismo equipo.
 *
 * LOG01, medido por Codex el 25 de septiembre de 2026: con 10 en depósito y dos renglones de 6
 * del mismo equipo, `checkAssetConflicts` no avisaba nada (comparaba cada renglón por separado)
 * y en la fiesta faltaba material.
 *
 * Se probo rompiendolo: con el control de antes, "dos renglones de 6" se pone en rojo.
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), writeData: jest.fn() }));
jest.mock('@/app/actions/settings', () => ({ getInvoiceTemplateSettings: jest.fn() }));

let fiestas: any[] = [];
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(async () => fiestas),
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));
jest.mock('@/app/actions/activos-fijos', () => ({
  getActivosFijos: jest.fn(async () => [
    { id: 'silla', cantidadDisponible: 10 },
    { id: 'mesa', cantidadDisponible: 5 },
  ]),
}));

import { checkAssetConflicts } from '@/app/actions/fiesta/carga-operativa.actions';

const renglon = (id: string, origenId: string, cantidad: number) =>
  ({ id, nombre: id, cantidad: String(cantidad), cargado: false, origenId }) as any;
const FECHA = '2026-10-10';

function fiestaCon(items: any[], id = 'f1') {
  return {
    id,
    configuracion: { fechaEvento: FECHA },
    listaDeCargaOperativa: {
      categorias: [
        { nombre: 'Salon', items: items.slice(0, 1) },
        { nombre: 'Jardin', items: items.slice(1) },
      ],
    },
  };
}

describe('El control de stock suma todos los renglones del mismo equipo', () => {
  it('dos renglones de 6 sillas, en dos categorías, con 10 en depósito: avisa', async () => {
    const items = [renglon('a', 'silla', 6), renglon('b', 'silla', 6)];
    fiestas = [fiestaCon(items)];
    const r = await checkAssetConflicts('f1', FECHA, items);
    expect(r.every((i) => i.hasConflict)).toBe(true);
  });

  it('justo lo que hay (5 + 5 de 10): no avisa', async () => {
    const items = [renglon('a', 'silla', 5), renglon('b', 'silla', 5)];
    fiestas = [fiestaCon(items)];
    const r = await checkAssetConflicts('f1', FECHA, items);
    expect(r.some((i) => i.hasConflict)).toBe(false);
  });

  it('editar un renglón de 6 a 7 no lo cuenta dos veces', async () => {
    fiestas = [fiestaCon([renglon('a', 'silla', 6)])];
    const r = await checkAssetConflicts('f1', FECHA, [renglon('a', 'silla', 7)]);
    expect(r[0].hasConflict).toBe(false);
  });

  it('un renglón nuevo se suma a lo que la fiesta ya tiene', async () => {
    fiestas = [fiestaCon([renglon('a', 'silla', 6)])];
    const r = await checkAssetConflicts('f1', FECHA, [renglon('nuevo', 'silla', 6)]);
    expect(r[0].hasConflict).toBe(true);
  });

  it('con la lista completa que manda la pantalla, un renglón quitado ya no cuenta', async () => {
    fiestas = [fiestaCon([renglon('a', 'silla', 6), renglon('b', 'silla', 6)])];
    const lista = [renglon('a', 'silla', 6)];
    const r = await checkAssetConflicts('f1', FECHA, lista, { listaCompleta: lista });
    expect(r[0].hasConflict).toBe(false);
  });

  it('equipos distintos no se mezclan, y se descuenta lo de otras fiestas del mismo día', async () => {
    const items = [renglon('a', 'silla', 4), renglon('b', 'mesa', 4)];
    fiestas = [fiestaCon(items), fiestaCon([renglon('x', 'silla', 7)], 'otra')];
    const r = await checkAssetConflicts('f1', FECHA, items);
    expect(r.find((i) => i.id === 'a')!.hasConflict).toBe(true); // 4 > 10 - 7
    expect(r.find((i) => i.id === 'b')!.hasConflict).toBe(false); // 4 <= 5
  });
});
