/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockGetFiestaById = jest.fn();
const mockSaveFiesta = jest.fn();
const mockDocGet = jest.fn();
const mockWhereGet = jest.fn(async () => ({ docs: [] }));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: (...args: any[]) => mockSaveFiesta(...args),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
}));

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => false),
  hayEmuladorDeBase: jest.fn(() => false),
  hayEmuladorDeArchivos: jest.fn(() => false),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        get: () => mockWhereGet(),
      })),
      doc: jest.fn((orderId: string) => ({
        get: () => mockDocGet(orderId),
      })),
    })),
  },
  authAdmin: null,
}));

import {
  cancelBarDrinkOrder,
  getGuestBarOrders,
} from '@/app/actions/fiesta/barra-tecnologica.actions';

function crearPedidoTotem(overrides: Record<string, any> = {}) {
  return {
    id: 'ord_totem_ana',
    fiestaId: 'f_barra_365',
    drinkId: 'drink_1',
    drinkName: 'Fernet con Coca',
    guestId: '',
    guestName: 'Ana',
    status: 'nuevo',
    createdAt: '2026-11-26T22:00:00.000Z',
    updatedAt: '2026-11-26T22:00:00.000Z',
    stockMovements: [],
    ...overrides,
  };
}

function crearFiestaBase(invitados: Array<Record<string, any>>, orders: Array<Record<string, any>>) {
  return {
    id: 'f_barra_365',
    configuracion: { nombreEvento: 'Fiesta 365' },
    invitados,
    others: {
      barraTecnologica: {
        settings: { enabled: true, openingTime: '', closingTime: '' },
        orders,
      },
    },
  };
}

describe('la barra no confunde invitados por nombre (Orden 365)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWhereGet.mockResolvedValue({ docs: [] });
    mockDocGet.mockResolvedValue({ exists: false });
  });

  it('Test A: con dos invitados llamados Ana, el pedido del tótem no se expone ni se cancela desde una invitación', async () => {
    const totemOrder = crearPedidoTotem();
    const fiesta = crearFiestaBase(
      [
        { id: 'inv_ana_1', nombre: 'Ana', guestAccessToken: 'tok_1' },
        { id: 'inv_ana_2', nombre: 'Ana', guestAccessToken: 'tok_2' },
      ],
      [totemOrder],
    );
    mockGetFiestaById.mockResolvedValue(fiesta);
    mockDocGet.mockResolvedValue({ exists: true, data: () => totemOrder });

    const listRes = await getGuestBarOrders('f_barra_365', 'inv_ana_1', 'tok_1');
    expect(listRes.success).toBe(true);
    expect(listRes.orders).toEqual([]);

    const cancelRes = await cancelBarDrinkOrder('f_barra_365', totemOrder.id, 'inv_ana_1', 'tok_1');
    expect(cancelRes).toEqual({ success: false, error: 'Pedido no encontrado.' });
  });

  it('Test B: con una sola Ana en la fiesta, getGuestBarOrders devuelve el pedido del tótem', async () => {
    const totemOrder = crearPedidoTotem();
    const fiesta = crearFiestaBase(
      [{ id: 'inv_ana_1', nombre: 'Ana', guestAccessToken: 'tok_1' }],
      [totemOrder],
    );
    mockGetFiestaById.mockResolvedValue(fiesta);

    const listRes = await getGuestBarOrders('f_barra_365', 'inv_ana_1', 'tok_1');
    expect(listRes.success).toBe(true);
    expect(listRes.orders).toHaveLength(1);
    expect(listRes.orders?.[0]?.id).toBe(totemOrder.id);
  });

  it('Test C: si el pedido en Firestore pertenece a otra fiesta, cancelBarDrinkOrder devuelve Pedido no encontrado', async () => {
    const fiesta = crearFiestaBase(
      [{ id: 'inv_ana_1', nombre: 'Ana', guestAccessToken: 'tok_1' }],
      [],
    );
    mockGetFiestaById.mockResolvedValue(fiesta);
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () =>
        crearPedidoTotem({
          id: 'ord_ajena',
          fiestaId: 'otra_fiesta',
          guestId: 'inv_ana_1',
        }),
    });

    const cancelRes = await cancelBarDrinkOrder('f_barra_365', 'ord_ajena', 'inv_ana_1', 'tok_1');
    expect(cancelRes).toEqual({ success: false, error: 'Pedido no encontrado.' });
  });
});
