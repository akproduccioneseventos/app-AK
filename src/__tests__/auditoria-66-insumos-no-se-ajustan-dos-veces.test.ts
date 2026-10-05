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

import { adjustAllInsumoCosts, getInsumos, saveInsumo } from '@/app/actions/insumos';

beforeEach(() => {
  for (const k of Object.keys(base)) delete base[k];
  insumos = [{ id: 'ins_1', nombre: 'Lomo', unidad: 'kg', valorUnitarioEstimado: 100, categoria: 'Carnes' }];
  perfil = 'secretaria';
  aplicarInsumoEnMenus.mockReset().mockResolvedValue({ success: true });
});

describe('El ajuste masivo no se aplica dos veces', () => {
  it('falla a medias, se reintenta con el mismo %: queda 110, no 121', async () => {
    aplicarInsumoEnMenus.mockResolvedValueOnce({ success: false, error: 'la base no contesta' } as any);
    const primero = await adjustAllInsumoCosts(10);
    expect(primero.success).toBe(false);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);

    const reintento = await adjustAllInsumoCosts(10);
    expect(reintento.success).toBe(true);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);
  });

  it('con otro porcentaje no deja sumar encima del ajuste a medias', async () => {
    aplicarInsumoEnMenus.mockResolvedValueOnce({ success: false, error: 'la base no contesta' } as any);
    await adjustAllInsumoCosts(10);
    const otro = await adjustAllInsumoCosts(5);
    expect(otro.success).toBe(false);
    expect(otro.error).toMatch(/10%/);
    expect(insumos[0].valorUnitarioEstimado).toBe(110);
  });
});

describe('Quién toca los insumos', () => {
  it('el operador los lee para planificar, pero no los cambia', async () => {
    perfil = 'operador';
    await expect(getInsumos()).resolves.toHaveLength(1);
    await expect(saveInsumo({ ...insumos[0], valorUnitarioEstimado: 1 } as any)).rejects.toThrow();
    await expect(adjustAllInsumoCosts(10)).rejects.toThrow();
    expect(insumos[0].valorUnitarioEstimado).toBe(100);
  });

  it('el personal ni los lee', async () => {
    perfil = 'personal';
    await expect(getInsumos()).rejects.toThrow();
  });
});
