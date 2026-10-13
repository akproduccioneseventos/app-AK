/** @jest-environment node */
/**
 * Insumos (Codex, auditoría 66, 5/10/2026).
 *
 * - Un ajuste masivo que falla a medias dejaba el porcentaje puesto en los insumos y decía "probá
 *   de nuevo": el reintento lo aplicaba otra vez encima (10% + 10% = 21%).
 * - Cualquier sesión podía cambiar costos y stock; ahora hace falta INSUMOS para cambiar, e
 *   INSUMOS u ORGANIZACION para leer.
 * Se probó rompiéndolo: con el código de `212ba37` fallan las dos primeras.
 */
const base: Record<string, any> = {};
let insumos: any[] = [];
let perfil = 'secretaria';
const aplicarInsumoEnMenus = jest.fn(async () => ({ success: true }));
const recibos = new Map<string, { porcentaje: number; ids: string[]; terminado: boolean }>();
let turnoPendiente: string | undefined;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', perfil } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f === 'insumos.json' ? JSON.parse(JSON.stringify(insumos)) : base[f] ?? d)),
  writeData: jest.fn(async (f: string, v: any) => { if (f === 'insumos.json') insumos = JSON.parse(JSON.stringify(v)); else base[f] = JSON.parse(JSON.stringify(v)); }),
  deleteDataItem: jest.fn(async () => true),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => JSON.parse(JSON.stringify(insumos))),
  limpiarCacheInsumos: jest.fn(),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  aplicarInsumoEnMenus: (...a: unknown[]) => (aplicarInsumoEnMenus as any)(...a),
  invalidateMenusCache: jest.fn(),
}));
jest.mock('@/lib/insumos/ajuste-costos-idempotente', () => ({
  AjusteNoIniciadoError: class AjusteNoIniciadoError extends Error {},
  comenzarAjusteCostos: jest.fn(async (porcentaje: number, operationId: string) => {
    const anterior = recibos.get(operationId);
    if (anterior) {
      if (anterior.porcentaje !== porcentaje) throw new Error(`Ese ajuste ya se envio con otro porcentaje (${anterior.porcentaje}%).`);
      return JSON.parse(JSON.stringify(anterior));
    }
    if (turnoPendiente) throw new Error('Hay un ajuste sin terminar. Reintenta antes de iniciar otro.');
    const ids = insumos.map((item) => item.id);
    for (const item of insumos) {
      if (item.valorUnitarioEstimado !== undefined) item.valorUnitarioEstimado = Math.round(item.valorUnitarioEstimado * (1 + porcentaje / 100));
    }
    const recibo = { porcentaje, ids, terminado: false };
    recibos.set(operationId, recibo);
    turnoPendiente = operationId;
    return JSON.parse(JSON.stringify(recibo));
  }),
  leerInsumosParaAjuste: jest.fn(async () => JSON.parse(JSON.stringify(insumos))),
  terminarAjusteCostos: jest.fn(async (operationId: string) => {
    const recibo = recibos.get(operationId);
    if (recibo) recibo.terminado = true;
    if (turnoPendiente === operationId) turnoPendiente = undefined;
  }),
}));

import { adjustAllInsumoCosts, getInsumos, saveInsumo } from '@/app/actions/insumos';

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  insumos = [{ id: 'ins_1', nombre: 'Lomo', unidad: 'kg', valorUnitarioEstimado: 100, categoria: 'Carnes' }];
  recibos.clear();
  turnoPendiente = undefined;
  perfil = 'secretaria';
  aplicarInsumoEnMenus.mockReset().mockResolvedValue({ success: true });
});

describe('El ajuste masivo no se aplica dos veces', () => {
  it('falla a medias, se reintenta con el mismo %: queda 110, no 121', async () => {
    aplicarInsumoEnMenus.mockResolvedValueOnce({ success: false, error: 'la base no contesta' } as any);
    const primero = await adjustAllInsumoCosts(10, 'ajuste-reintento');
    expect(primero.success).toBe(false);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);

    const reintento = await adjustAllInsumoCosts(10, 'ajuste-reintento');
    expect(reintento.success).toBe(true);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);
  });

  it('con otro porcentaje no deja sumar encima del ajuste a medias', async () => {
    aplicarInsumoEnMenus.mockResolvedValueOnce({ success: false, error: 'la base no contesta' } as any);
    await adjustAllInsumoCosts(10, 'ajuste-pendiente');
    const otro = await adjustAllInsumoCosts(5, 'ajuste-distinto');
    expect(otro.success).toBe(false);
    expect(otro.error).toMatch(/sin terminar|pendiente/i);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);
  });
});

describe('Quién toca los insumos', () => {
  it('el operador los lee para planificar, pero no los cambia', async () => {
    perfil = 'operador';
    await expect(getInsumos()).resolves.toHaveLength(1);
    await expect(saveInsumo({ ...insumos[0], valorUnitarioEstimado: 1 } as any)).rejects.toThrow();
    await expect(adjustAllInsumoCosts(10, 'ajuste-sin-permiso')).rejects.toThrow();
    expect(insumos[0].valorUnitarioEstimado).toBe(100);
  });

  it('el personal ni los lee', async () => {
    perfil = 'personal';
    await expect(getInsumos()).rejects.toThrow();
  });
});
