/** @jest-environment node */
/**
 * MATAFUEGO — Auditoría 72 de Codex (orden 123), barra del invitado. 6/10/2026.
 *
 * BARRA72-1: cambiar un trago propio, con el enlace bueno, se rechazaba siempre: el pedido nuevo
 *            salía sin el enlace del invitado y la validación lo frenaba.
 * BARRA72-3: reintentar con el número de un pedido ya hecho lo devolvía (con su nota y el
 *            invitado) ANTES de mirar el enlace: con un enlace errado se leía un pedido ajeno.
 *
 * Se probó rompiéndolo: volviendo a pasar `guestId: existing.guestId` sin enlace, el cambio da
 * rojo; y sacando `esElMismoQuePidio`, el reintento ajeno da rojo.
 */
const almacen: Record<string, any> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: false })) }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('@/lib/data-service', () => {
  const real = jest.requireActual('@/lib/data-service');
  return {
    ...real,
    readData: jest.fn(async (archivo: string, porDefecto: any) => (almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]))),
    writeData: jest.fn(async (archivo: string, datos: any) => { almacen[archivo] = copia(datos); }),
  };
});

import { createBarDrinkOrder, changeBarDrinkOrder } from '@/app/actions/fiesta/barra-tecnologica.actions';

const TRAGOS = [
  { id: 'trago-a', nombre: 'Trago A', recetaIngredientes: [{ insumoId: 'ins-1', nombre: 'Ron', cantidad: 1, unidad: 'Botella' }] },
  { id: 'trago-b', nombre: 'Trago B', recetaIngredientes: [{ insumoId: 'ins-1', nombre: 'Ron', cantidad: 1, unidad: 'Botella' }] },
];
const FIESTA = {
  id: 'f72',
  configuracion: { nombreEvento: 'Prueba 72' },
  modulosContratados: { barraTecnologica: true },
  cartaTragos: { items: TRAGOS },
  others: { barraTecnologica: { settings: { enabled: true, openingTime: '', closingTime: '' }, orders: [] } },
  invitados: [
    { id: 'g1', nombre: 'Lucía', tableNumber: '1', guestAccessToken: 'tok-lucia' },
    { id: 'g2', nombre: 'Pedro', tableNumber: '2', guestAccessToken: 'tok-pedro' },
  ],
};

beforeEach(() => {
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/f72.json'] = copia(FIESTA);
  almacen['insumos.json'] = [{ id: 'ins-1', nombre: 'Ron', cantidadDisponible: 100, unidad: 'Botella' }];
});

const pedidos = () => (almacen['fiestas/f72.json'].others.barraTecnologica.orders || []) as any[];
const stock = () => almacen['insumos.json'][0].cantidadDisponible;
const pedirComo = (guestId: string, guestAccessToken: string, clientRequestId: string, drinkId = 'trago-a') =>
  createBarDrinkOrder({ fiestaId: 'f72', drinkId, guestName: 'x', guestId, guestAccessToken, clientRequestId, note: 'nota privada' } as any);

describe('BARRA72-1: el invitado cambia su propio trago', () => {
  it('con su enlace, el cambio sale una vez y el viejo queda cancelado', async () => {
    const a = await pedirComo('g1', 'tok-lucia', 'req-1');
    expect(a.success).toBe(true);
    const r = await changeBarDrinkOrder('f72', a.order!.id, 'trago-b', 'g1', 'tok-lucia');
    expect(r.success).toBe(true);
    const activos = pedidos().filter((p) => p.status !== 'cancelado');
    expect(activos.map((p) => p.drinkId)).toEqual(['trago-b']);
    expect(stock()).toBe(99); // uno del nuevo; el viejo devolvió sus botellas al cancelarse
  });

  it('con un enlace ajeno, no cambia nada', async () => {
    const a = await pedirComo('g1', 'tok-lucia', 'req-2');
    const r = await changeBarDrinkOrder('f72', a.order!.id, 'trago-b', 'g1', 'tok-pedro');
    expect(r.success).toBe(false);
    expect(pedidos().filter((p) => p.status !== 'cancelado').map((p) => p.drinkId)).toEqual(['trago-a']);
  });

  it('si el trago nuevo no hay, el viejo sigue en pie', async () => {
    const a = await pedirComo('g1', 'tok-lucia', 'req-3');
    almacen['insumos.json'][0].cantidadDisponible = 0;
    const r = await changeBarDrinkOrder('f72', a.order!.id, 'trago-b', 'g1', 'tok-lucia');
    expect(r.success).toBe(false);
    expect(pedidos().filter((p) => p.status !== 'cancelado').map((p) => p.drinkId)).toEqual(['trago-a']);
  });
});

describe('BARRA72-3: un reintento no lee el pedido de otro', () => {
  it('el mismo invitado reintenta y recupera su pedido sin descontar dos veces', async () => {
    await pedirComo('g1', 'tok-lucia', 'req-4');
    const r = await pedirComo('g1', 'tok-lucia', 'req-4');
    expect(r.success).toBe(true);
    expect(pedidos()).toHaveLength(1);
    expect(stock()).toBe(99);
  });

  it.each([
    ['enlace errado', 'g1', 'tok-malo'],
    ['enlace vacío', 'g1', ''],
    ['otro invitado', 'g2', 'tok-pedro'],
  ])('%s: no recibe el pedido ni un éxito', async (_n, gid, tok) => {
    await pedirComo('g1', 'tok-lucia', 'req-5');
    const r = await pedirComo(gid, tok, 'req-5');
    expect(r.success).toBe(false);
    expect(r.order).toBeUndefined();
    expect(pedidos()).toHaveLength(1);
  });

  it('el tótem por nombre (sin invitado) sigue pidiendo y reintentando', async () => {
    const a = await createBarDrinkOrder({ fiestaId: 'f72', drinkId: 'trago-a', guestName: 'Mesa 3', clientRequestId: 'tot-1' } as any);
    const b = await createBarDrinkOrder({ fiestaId: 'f72', drinkId: 'trago-a', guestName: 'Mesa 3', clientRequestId: 'tot-1' } as any);
    expect(a.success && b.success).toBe(true);
    expect(pedidos()).toHaveLength(1);
  });

  it('el tótem no recibe con el mismo número el pedido de un invitado', async () => {
    await pedirComo('g1', 'tok-lucia', 'req-6');
    const r = await createBarDrinkOrder({ fiestaId: 'f72', drinkId: 'trago-a', guestName: 'x', clientRequestId: 'req-6' } as any);
    expect(r.success).toBe(false);
  });
});
