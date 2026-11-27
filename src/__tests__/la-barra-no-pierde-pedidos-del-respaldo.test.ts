const mockDbHolder: { db: any } = { db: null };
jest.mock('@/lib/firebase/server', () => ({
  get dbAdmin() {
    return mockDbHolder.db;
  },
}));
jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => false),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn(async () => undefined),
  exigirQueNoSalgaAfuera: jest.fn(async () => undefined),
  tieneModoAuditorActivo: jest.fn(() => false),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => undefined),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));
jest.mock('@/lib/carta-tragos/leer-carta-master', () => ({
  leerCartaTragosMaster: jest.fn(async () => []),
}));
jest.mock('@/lib/insumos/leer-insumos', () => ({
  leerInsumosCrudos: jest.fn(async () => []),
  limpiarCacheInsumos: jest.fn(),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));
jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn(async () => []),
  limpiarCacheInsumos: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, def: any) => def),
  writeData: jest.fn(async () => undefined),
}));

import {
  getBarraTecnologicaDashboard,
  getGuestBarOrders,
  getCierreDeBarra,
  getBarPedidosListos,
  guardarCierreDeBarra,
} from '@/app/actions/fiesta/barra-tecnologica.actions';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

describe('Orden 356 — La barra no pierde pedidos del respaldo ni expone notas en la tele', () => {
  const respaldoOrders = [
    {
      id: 'ped_respaldo_1',
      fiestaId: 'f1',
      drinkId: 'd1',
      drinkName: 'Fernet',
      guestName: 'Lucía',
      guestId: 'g1',
      note: 'Sin hielo (nota privada)',
      status: 'listo',
      createdAt: '2026-11-25T23:00:00.000Z',
      updatedAt: '2026-11-25T23:00:00.000Z',
      source: 'touchscreen',
    },
  ];

  const fiestaBase = {
    id: 'f1',
    configuracion: { nombreEvento: 'Cumple de Lucía' },
    invitados: [{ id: 'g1', nombre: 'Lucía', guestAccessToken: 'tok1' }],
    cartaTragos: { items: [{ id: 'd1', nombre: 'Fernet', recetaIngredientes: [{ insumoId: 'ins1', cantidad: 1 }] }] },
    others: {
      barraTecnologica: {
        settings: { enabled: true, title: 'Barra', subtitle: '', guestPrompt: '', barmanTitle: '', hashtag: '', instagramHandle: '', brandText: '', accentColor: '#000', requireGuestName: false, allowPhotoCapture: false, autoPublishPhotos: false, showIngredients: true, showAlcoholFreeTag: true, showDrinkDescription: true, showDrinkVideo: false, requireSocialFollowForPhotos: false, socialFollowPrompt: '' },
        orders: respaldoOrders,
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbHolder.db = null;
    (getFiestaById as jest.Mock).mockResolvedValue(fiestaBase);
  });

  it('conserva los pedidos del respaldo aunque Firestore devuelva vacío', async () => {
    mockDbHolder.db = {
      collection: jest.fn(() => ({
        doc: jest.fn((id: string) => ({ id })),
        where: jest.fn(() => ({
          get: jest.fn(async () => ({ docs: [] })),
        })),
      })),
      getAll: jest.fn(async () => [{ exists: true, data: () => ({ nombre: 'Fernet', unidad: 'botellas', cantidadDisponible: 10 }) }]),
    };

    const dash = await getBarraTecnologicaDashboard('f1');
    expect(dash.success).toBe(true);
    expect(dash.data?.orders.map((o) => o.id)).toContain('ped_respaldo_1');

    const guestOrders = await getGuestBarOrders('f1', 'g1', 'tok1');
    expect(guestOrders.success).toBe(true);
    expect(guestOrders.orders?.map((o) => o.id)).toContain('ped_respaldo_1');

    const listos = await getBarPedidosListos('f1');
    expect(listos.success).toBe(true);
    expect(listos.orders).toHaveLength(1);
    expect(listos.orders![0].id).toBe('ped_respaldo_1');
    // No expone guestId ni note privada en la pantalla pública de barra lista
    expect(listos.orders![0].guestId).toBeUndefined();
    expect(listos.orders![0].note).toBeUndefined();

    const cierre = await getCierreDeBarra('f1');
    expect(cierre.success).toBe(true);
  });

  it('combina Firestore y respaldo sin duplicados y con estado más nuevo de Firestore', async () => {
    const fsOrder = { ...respaldoOrders[0], status: 'entregado' };
    const extraFs = { ...respaldoOrders[0], id: 'ped_fs_2', status: 'listo', guestName: 'Marcos', note: 'secreto' };
    const extraResp = { ...respaldoOrders[0], id: 'ped_resp_2', status: 'listo', guestName: 'Sofía' };

    (getFiestaById as jest.Mock).mockResolvedValue({
      ...fiestaBase,
      others: { barraTecnologica: { ...fiestaBase.others.barraTecnologica, orders: [respaldoOrders[0], extraResp] } },
    });
    mockDbHolder.db = {
      collection: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(async () => ({
            docs: [
              { data: () => fsOrder },
              { data: () => extraFs },
            ],
          })),
        })),
      })),
    };

    const dash = await getBarraTecnologicaDashboard('f1');
    expect(dash.data?.orders.map((o) => o.id).sort()).toEqual(['ped_fs_2', 'ped_resp_2', 'ped_respaldo_1']);
    expect(dash.data?.orders.find((o) => o.id === 'ped_respaldo_1')?.status).toBe('entregado');
  });

  it('guardarCierreDeBarra permite reintentar si ajustePendiente quedó sin depositoMovidoEn y marca depositoMovidoEn al cerrar', async () => {
    const dataService = require('@/lib/data-service');
    dataService.readData.mockResolvedValue([{ id: 'ins1', nombre: 'Fernet', unidad: 'botellas', cantidadDisponible: 10 }]);
    const pendientePrevio = {
      at: new Date().toISOString(),
      filas: [],
      depositoAjustado: true,
      ajusteClave: '[["ins1",-2]]',
      ajustePendiente: true,
    };
    let fiestaEnMemoria = {
      ...fiestaBase,
      others: {
        barraTecnologica: {
          ...fiestaBase.others.barraTecnologica,
          cierre: pendientePrevio,
        },
      },
    };
    (getFiestaById as jest.Mock).mockImplementation(async () => fiestaEnMemoria);
    (actualizarFiesta as jest.Mock).mockImplementation(async (_id: string, fn: any) => {
      fiestaEnMemoria = fn(fiestaEnMemoria);
      return { success: true };
    });

    const r1 = await guardarCierreDeBarra('f1', { ins1: 8 }, true);
    expect(r1.success).toBe(true);
    expect(r1.cierre?.depositoMovidoEn).toBeTruthy();
    expect(dataService.writeData).toHaveBeenCalledTimes(1);

    // Un segundo toque inmediato cuando depositoMovidoEn ya existe NO vuelve a ajustar
    const r2 = await guardarCierreDeBarra('f1', { ins1: 8 }, true);
    expect(r2.success).toBe(true);
    expect(dataService.writeData).toHaveBeenCalledTimes(1);
  });
});
