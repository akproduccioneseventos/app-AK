/** @jest-environment node */

import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

let currentUser: { userId: string; perfil?: string; role?: string; soloCrm?: boolean } = {
  userId: 'u-dueno',
  perfil: 'dueno',
  role: 'admin',
};
let portalSessionAuthorized = true;
let storedBudgets: Presupuesto[] = [];
let storedFiestas: FiestaEnPlanificacion[] = [];

const mockWriteData = jest.fn(async (file: string, next: any) => {
  if (file === 'presupuestos.json') {
    storedBudgets = next;
  } else if (file === 'fiestas.json') {
    storedFiestas = next;
  }
});

const mockEnforcePublicRateLimit = jest.fn(async () => undefined);
const mockSetPortalSessionCookie = jest.fn(async () => undefined);
const mockLeerFiestasCrudas = jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas)));
const mockGetFiestaByIdRaw = jest.fn(async (fiestaId: string) => {
  const found = storedFiestas.find((f) => f.id === fiestaId);
  return found ? JSON.parse(JSON.stringify(found)) : null;
});
const mockGetFiestaById = jest.fn(async (fiestaId: string) => {
  const found = storedFiestas.find((f) => f.id === fiestaId);
  return found ? JSON.parse(JSON.stringify(found)) : null;
});
const mockActualizarFiesta = jest.fn(async (
  fiestaId: string,
  updater: ((actual: FiestaEnPlanificacion) => FiestaEnPlanificacion) | Partial<FiestaEnPlanificacion>,
) => {
  const idx = storedFiestas.findIndex((f) => f.id === fiestaId);
  if (idx === -1) return { success: false, error: 'Fiesta no encontrada' };
  const current = JSON.parse(JSON.stringify(storedFiestas[idx]));
  const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  storedFiestas[idx] = updated;
  return { success: true, updatedFiesta: updated };
});

jest.mock('server-only', () => ({}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/firebase/modo-local', () => ({
  sinDepositoDisponible: jest.fn(() => true),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => 'mock/path.txt'),
  isStorageAvailable: jest.fn(() => false),
}));
jest.mock('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  return {
    ...actual,
    mkdir: jest.fn(async () => undefined),
    writeFile: jest.fn(async () => undefined),
  };
});
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: currentUser })),
  verifyBudgetToken: jest.fn(),
}));
jest.mock('@/lib/auth/perfiles', () => {
  const actual = jest.requireActual('@/lib/auth/perfiles');
  return {
    ...actual,
    puede: (user: { perfil?: string; role?: string; soloCrm?: boolean } | null | undefined, permiso: string) => {
      if (user?.soloCrm) {
        return permiso === actual.PERMISOS.CRM || permiso === actual.PERMISOS.ORGANIZACION;
      }
      return actual.puede(user, permiso);
    },
  };
});
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => portalSessionAuthorized),
  setPortalSessionCookie: (...args: any[]) => mockSetPortalSessionCookie(...args),
}));
jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: (...args: any[]) => mockEnforcePublicRateLimit(...args),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => undefined),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: (...args: any[]) => mockLeerFiestasCrudas(...args),
}));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: (...args: any[]) => mockGetFiestaByIdRaw(...args),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: (...args: any[]) => mockActualizarFiesta(...args),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas))),
  getFiestaById: (...args: any[]) => mockGetFiestaById(...args),
  saveFiesta: jest.fn(async () => ({ success: true })),
  syncFiestaFromBudget: jest.fn(async () => undefined),
  getFiestas: jest.fn(async () => JSON.parse(JSON.stringify(storedFiestas))),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, defaultVal: any = []) => {
    if (file === 'presupuestos.json') return JSON.parse(JSON.stringify(storedBudgets));
    if (file === 'fiestas.json') return JSON.parse(JSON.stringify(storedFiestas));
    return defaultVal;
  }),
  readDataConDetalle: jest.fn(async (file: string, defaultVal: any = []) => ({
    valor: file === 'presupuestos.json' ? JSON.parse(JSON.stringify(storedBudgets)) : defaultVal,
    huboFalla: false,
  })),
  writeData: (...args: [string, any]) => mockWriteData(...args),
  mutateDataItem: jest.fn(async (_file: string, _collection: string, id: string, mutator: (item: any) => any) => {
    const idx = storedBudgets.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const next = mutator(JSON.parse(JSON.stringify(storedBudgets[idx])));
    if (!next) return null;
    storedBudgets[idx] = next;
    return JSON.parse(JSON.stringify(next));
  }),
}));
jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn(async () => ({ lead: { id: 'lead-1' } })),
  getCrmStages: jest.fn(async () => []),
  moveCrmLead: jest.fn(),
}));

import {
  cambiarClavePortal,
  cancelServicesOrParty,
  changeEventDate,
  getFiestaByAccessKey,
} from '@/app/actions/fiesta/portal.actions';
import { updatePresupuesto } from '@/app/actions/presupuestos';
import { correrMigracionEmpezar2027 } from '@/lib/automatico/empezar-2027';

function buildBaseFiesta(overrides: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta-1',
    presupuestoId: 'pres-1',
    estado: 'En Planificación',
    configuracion: {
      nombreEvento: 'Fiesta de Sofía',
      tipoCelebracion: 'XV años',
      fechaEvento: '2028-11-20',
      invitadosEstimados: 100,
      presupuestoEstimado: 100000,
      nombreLugar: 'Club Uruguay',
      clienteNombre: 'Sofía Pérez',
    },
    clientPortalSettings: {
      enabled: true,
      accessKey: 'CLAVEACTUAL123',
      clientPassword: 'PIN1234',
      claveCambiadaPorCliente: true,
    },
    modulosContratados: {} as any,
    ...overrides,
  } as FiestaEnPlanificacion;
}

function buildBasePresupuesto(overrides: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'pres-1',
    clienteNombre: 'Sofía Pérez',
    eventoTipo: 'XV años',
    eventoFecha: '2028-11-20',
    invitadosCantidad: 100,
    salonFiestas: 'Club Uruguay',
    itemsPresupuestados: [
      {
        idServicioCatalogo: 'srv-1',
        nombreServicio: 'Servicio Integral',
        cantidad: 1,
        precioUnitario: 100000,
        precioUnitarioPresupuesto: 100000,
        costoTotalItem: 100000,
        categoriaServicio: 'General',
      },
    ],
    costoTotalEstimado: 100000,
    totalConDescuento: 100000,
    timestamp: '2026-04-10T12:00:00.000Z',
    estado: 'Aceptado',
    ajusteAnualActivo: true,
    ajusteAnualPorcentaje: 15,
    tipoAjusteAnual: 'acumulativo',
    ...overrides,
  };
}

describe('Auditoría profunda 24/11 — Garantías de plata, contratos, portal y Empezar 2027', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    currentUser = { userId: 'u-dueno', perfil: 'dueno', role: 'admin' };
    portalSessionAuthorized = true;
    storedFiestas = [buildBaseFiesta()];
    storedBudgets = [buildBasePresupuesto()];
  });

  describe('a) cambiarClavePortal', () => {
    it('rechaza cuando verifyPortalSession devuelve false sin tocar la clave', async () => {
      portalSessionAuthorized = false;

      const res = await cambiarClavePortal('fiesta-1', 'CLAVEACTUAL123', 'NuevaClaveSegura2026');

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/no autorizada/i);
      expect(mockActualizarFiesta).not.toHaveBeenCalled();
      expect(mockSetPortalSessionCookie).not.toHaveBeenCalled();
      expect(storedFiestas[0].clientPortalSettings?.accessKey).toBe('CLAVEACTUAL123');
    });

    it('rechaza cuando clientPortalSettings.enabled es false', async () => {
      storedFiestas = [
        buildBaseFiesta({
          clientPortalSettings: {
            enabled: false,
            accessKey: 'CLAVEACTUAL123',
            clientPassword: 'PIN1234',
          },
        }),
      ];

      const res = await cambiarClavePortal('fiesta-1', 'CLAVEACTUAL123', 'NuevaClaveSegura2026');

      expect(res.success).toBe(false);
      expect(mockActualizarFiesta).not.toHaveBeenCalled();
      expect(mockSetPortalSessionCookie).not.toHaveBeenCalled();
      expect(storedFiestas[0].clientPortalSettings?.accessKey).toBe('CLAVEACTUAL123');
    });

    it('permite cambiar la clave cuando hay sesión de portal, clave actual válida y enabled: true', async () => {
      const res = await cambiarClavePortal('fiesta-1', 'CLAVEACTUAL123', 'NuevaClaveSegura2026');

      expect(res.success).toBe(true);
      expect(mockActualizarFiesta).toHaveBeenCalledTimes(1);
      expect(storedFiestas[0].clientPortalSettings?.accessKey).toBe('NuevaClaveSegura2026');
      expect(storedFiestas[0].clientPortalSettings?.claveCambiadaPorCliente).toBe(true);
      expect(mockSetPortalSessionCookie).toHaveBeenCalledWith('fiesta-1', 'NuevaClaveSegura2026');
    });
  });

  describe('b) getFiestaByAccessKey', () => {
    it('invoca enforcePublicRateLimit antes de consultar Firestore/JSON', async () => {
      mockEnforcePublicRateLimit.mockRejectedValueOnce(new Error('Rate limit alcanzado'));

      await expect(getFiestaByAccessKey('CLAVEACTUAL123')).rejects.toThrow('Rate limit alcanzado');
      expect(mockEnforcePublicRateLimit).toHaveBeenCalledWith({
        scope: 'portal-access-key-lookup',
        limit: 25,
        windowMs: 15 * 60 * 1000,
      });
      expect(mockLeerFiestasCrudas).not.toHaveBeenCalled();
    });
  });

  describe('c) updatePresupuesto', () => {
    it('bloquea cambios de tipoAjusteAnual y estructura cuando el presupuesto tiene fechaFirmaContrato sin fiesta vinculada', async () => {
      storedFiestas = [];
      storedBudgets = [
        buildBasePresupuesto({
          fechaFirmaContrato: '2026-05-15',
          tipoAjusteAnual: 'acumulativo',
        }),
      ];

      const resTipo = await updatePresupuesto({
        ...storedBudgets[0],
        tipoAjusteAnual: 'simple',
      });
      expect(resTipo.success).toBe(false);
      expect(resTipo.error).toMatch(/contrato firmado/i);

      const resEstructura = await updatePresupuesto({
        ...storedBudgets[0],
        invitadosCantidad: 130,
      });
      expect(resEstructura.success).toBe(false);
      expect(resEstructura.error).toMatch(/contrato firmado/i);
      expect(mockWriteData).not.toHaveBeenCalled();
    });

    it('conserva intacto totalConDescuento en presupuestos Facturado o con preserveTotal: true al editar un campo no estructural', async () => {
      const facturado = buildBasePresupuesto({
        id: 'pres-fact',
        estado: 'Facturado',
        invoiceId: 'inv-1',
        totalConDescuento: 87500,
        costoTotalEstimado: 100000,
        notas: 'Original',
      });
      const preservado = buildBasePresupuesto({
        id: 'pres-pres',
        estado: 'Aceptado',
        preserveTotal: true,
        totalConDescuento: 91200,
        costoTotalEstimado: 100000,
        clienteContacto: '099111222',
      } as Presupuesto & { preserveTotal?: boolean });
      storedBudgets = [facturado, preservado];

      const resFact = await updatePresupuesto({
        ...facturado,
        notas: 'Nota administrativa actualizada',
      });
      expect(resFact.success).toBe(true);
      expect(resFact.presupuesto?.totalConDescuento).toBe(87500);
      expect(resFact.presupuesto?.estado).toBe('Facturado');

      // Un total distinto mandado por la pantalla no cambia el de un facturado (revisión de Claude 25/11).
      storedBudgets = [{ ...facturado }, preservado];
      const resFactOtroTotal = await updatePresupuesto({
        ...facturado,
        notas: 'Otra nota',
        totalConDescuento: 1,
      });
      expect(resFactOtroTotal.success).toBe(true);
      expect(resFactOtroTotal.presupuesto?.totalConDescuento).toBe(87500);

      const resPres = await updatePresupuesto({
        ...preservado,
        clienteContacto: '099333444',
      });
      expect(resPres.success).toBe(true);
      expect(resPres.presupuesto?.totalConDescuento).toBe(91200);
      expect(resPres.presupuesto?.clienteContacto).toBe('099333444');
    });
  });

  describe('d) cancelServicesOrParty y changeEventDate', () => {
    it('cancelServicesOrParty con cancelAll: true en evento 2028+ firmado en 2026 apaga el ajuste anual y deja saldo = penaltyTotal - pagado sin doble 15%', async () => {
      storedFiestas = [
        buildBaseFiesta({
          contratoDatos: {
            // Sin fechaFirmaContrato en fiesta; debe tomar presupuesto.fechaFirmaContrato
            ajusteAnualPorcentaje: 15,
          } as any,
        }),
      ];
      storedBudgets = [
        buildBasePresupuesto({
          eventoFecha: '2028-11-20',
          fechaFirmaContrato: '2026-04-10',
          ajusteAnualActivo: true,
          ajusteAnualPorcentaje: 15,
          totalConDescuento: 100000,
          pagosCliente: [
            {
              id: 'pago-1',
              monto: 10000,
              fecha: '2026-04-12',
              metodo: 'Transferencia',
              estadoPago: 'confirmado',
            },
          ],
        }),
      ];

      const res = await cancelServicesOrParty('fiesta-1', {
        servicesToCancel: [],
        cancelAll: true,
        passwordInput: 'PIN1234',
      });

      expect(res.success).toBe(true);
      const updatedBudget = storedBudgets[0];
      // Firmado en 2026 y cancelado en 2026 -> 30% de $100.000 = $30.000, pagado $10.000 -> saldo exacto $20.000
      expect(updatedBudget.ajusteAnualActivo).toBe(false);
      expect(updatedBudget.ajusteAnualPorcentaje).toBe(0);
      expect(updatedBudget.totalConDescuento).toBe(30000);
      expect(updatedBudget.saldo).toBe(20000);
      expect(res.pendingDue).toBe(20000);
      expect(res.refundAmount).toBe(0);
    });

    it('changeEventDate con descuentoTipo porcentaje o preserveTotal: true guarda totalConDescuento exacto igual a totalOriginal + penaltyAmount', async () => {
      const conPorcentaje = buildBasePresupuesto({
        id: 'pres-desc',
        eventoFecha: '2027-06-15',
        descuentoTipo: 'porcentaje',
        descuentoValor: 10,
        costoTotalEstimado: 100000,
        totalConDescuento: 90000,
        ajusteAnualActivo: false,
      });
      const conPreserve = buildBasePresupuesto({
        id: 'pres-preserve',
        eventoFecha: '2027-06-15',
        preserveTotal: true,
        costoTotalEstimado: 100000,
        totalConDescuento: 80000,
        ajusteAnualActivo: false,
      } as Presupuesto & { preserveTotal?: boolean });
      storedFiestas = [
        buildBaseFiesta({ id: 'fiesta-desc', presupuestoId: 'pres-desc' }),
        buildBaseFiesta({ id: 'fiesta-preserve', presupuestoId: 'pres-preserve' }),
      ];
      storedBudgets = [conPorcentaje, conPreserve];

      const resDesc = await changeEventDate('fiesta-desc', {
        newDate: '2027-08-20',
        passwordInput: 'PIN1234',
      });
      expect(resDesc.success).toBe(true);
      expect(resDesc.penaltyAmount).toBe(9000);
      expect(storedBudgets[0].totalConDescuento).toBe(99000);

      const resPreserve = await changeEventDate('fiesta-preserve', {
        newDate: '2027-09-25',
        passwordInput: 'PIN1234',
      });
      expect(resPreserve.success).toBe(true);
      expect(resPreserve.penaltyAmount).toBe(8000);
      expect(storedBudgets[1].totalConDescuento).toBe(88000);
    });
  });

  describe('e) correrMigracionEmpezar2027', () => {
    function createMockDb() {
      let migrationDoc: Record<string, any> | null = null;
      const docRef = {
        set: jest.fn(async (data: Record<string, any>, options?: { merge?: boolean }) => {
          migrationDoc = options?.merge ? { ...(migrationDoc || {}), ...data } : data;
        }),
      };
      return {
        collection: jest.fn(() => ({
          doc: jest.fn(() => docRef),
        })),
        runTransaction: jest.fn(async (cb: (tx: any) => Promise<void>) => {
          const tx = {
            get: async () => ({
              exists: migrationDoc !== null,
              data: () => migrationDoc,
            }),
            set: (_ref: any, data: Record<string, any>) => {
              migrationDoc = data;
            },
          };
          await cb(tx);
        }),
      };
    }

    it('respeta archivados/rechazados, conserva Facturado y tipoAjusteAnual en firmados, y activa ajusteAnualActivo en activos 2027+', async () => {
      const presupuestosInput: Presupuesto[] = [
        buildBasePresupuesto({
          id: 'p-2027-archivado',
          clienteNombre: 'Archivado',
          eventoFecha: '2027-05-10',
          estado: 'Borrador',
          archived: true,
        }),
        buildBasePresupuesto({
          id: 'p-2027-rechazado',
          clienteNombre: 'Rechazado',
          eventoFecha: '2027-06-10',
          estado: 'Rechazado',
        }),
        buildBasePresupuesto({
          id: 'p-2027-facturado',
          clienteNombre: 'Facturado',
          eventoFecha: '2027-07-10',
          estado: 'Facturado',
          invoiceId: 'inv-2027',
          totalConDescuento: 95000,
          ajusteAnualActivo: undefined,
        }),
        buildBasePresupuesto({
          id: 'p-2027-firmado-simple',
          clienteNombre: 'Firmado Simple',
          eventoFecha: '2027-08-10',
          estado: 'Aceptado',
          fechaFirmaContrato: '2026-04-01',
          tipoAjusteAnual: 'simple',
          ajusteAnualActivo: undefined,
        }),
        buildBasePresupuesto({
          id: 'p-2027-activo',
          clienteNombre: 'Activo Sin Firma',
          eventoFecha: '2027-09-10',
          estado: 'Enviado',
          ajusteAnualActivo: undefined,
          tipoAjusteAnual: 'simple',
        }),
      ];

      let persistedPresupuestos: Presupuesto[] = [];
      let persistedFiestas: FiestaEnPlanificacion[] = [];

      const res = await correrMigracionEmpezar2027({
        currentUid: 'u-dueno',
        currentPerfil: 'dueno',
        currentRole: 'admin',
        ahora: new Date('2026-11-24T15:00:00.000Z'),
        getDbFn: async () => createMockDb(),
        crearRespaldoFn: async () => ({ success: true, point: { id: 'bkp-1' } }),
        crearNotificacionFn: async () => undefined,
        readDataFn: async <T>(file: string, def: T): Promise<T> => {
          if (file === 'presupuestos.json') return JSON.parse(JSON.stringify(presupuestosInput)) as T;
          return def;
        },
        writeDataFn: async (file: string, data: any) => {
          if (file === 'presupuestos.json') persistedPresupuestos = data;
          if (file === 'fiestas.json') persistedFiestas = data;
        },
      });

      expect(res.success).toBe(true);
      expect(res.presupuestos2027).toBe(3);

      const arch = persistedPresupuestos.find((p) => p.id === 'p-2027-archivado');
      const rech = persistedPresupuestos.find((p) => p.id === 'p-2027-rechazado');
      expect(arch?.estado).toBe('Borrador');
      expect(arch?.archived).toBe(true);
      expect(rech?.estado).toBe('Rechazado');
      expect(persistedFiestas.some((f) => f.presupuestoId === 'p-2027-archivado')).toBe(false);
      expect(persistedFiestas.some((f) => f.presupuestoId === 'p-2027-rechazado')).toBe(false);

      const fact = persistedPresupuestos.find((p) => p.id === 'p-2027-facturado');
      expect(fact?.estado).toBe('Facturado');
      expect(fact?.totalConDescuento).toBe(95000);
      expect(fact?.ajusteAnualActivo).toBe(true);

      const firmado = persistedPresupuestos.find((p) => p.id === 'p-2027-firmado-simple');
      expect(firmado?.tipoAjusteAnual).toBe('simple');
      expect(firmado?.ajusteAnualActivo).toBe(true);

      const activo = persistedPresupuestos.find((p) => p.id === 'p-2027-activo');
      expect(activo?.estado).toBe('Aceptado');
      expect(activo?.ajusteAnualActivo).toBe(true);
      expect(activo?.tipoAjusteAnual).toBeUndefined();
    });

    it('un presupuesto 2027 que un prospecto armó en el simulador y nadie aceptó no se da por aceptado ni crea fiesta (revisión de Claude 25/11)', async () => {
      const presupuestosInput: Presupuesto[] = [
        buildBasePresupuesto({ id: 'p-2027-simulador', clienteNombre: 'Prospecto', eventoFecha: '2027-03-10', estado: 'Enviado', source: 'simulator' } as Partial<Presupuesto>),
        buildBasePresupuesto({ id: 'p-2027-simulador-aceptado', clienteNombre: 'Cliente', eventoFecha: '2027-04-10', estado: 'Aceptado', source: 'simulator' } as Partial<Presupuesto>),
        buildBasePresupuesto({ id: 'p-2026-nov', clienteNombre: 'Noviembre', eventoFecha: '2026-11-28', estado: 'Aceptado' }),
      ];
      let persistedPresupuestos: Presupuesto[] = [];
      let persistedFiestas: FiestaEnPlanificacion[] = [];
      const res = await correrMigracionEmpezar2027({
        currentUid: 'u-dueno',
        currentPerfil: 'dueno',
        currentRole: 'admin',
        ahora: new Date('2026-11-25T15:00:00.000Z'),
        getDbFn: async () => createMockDb(),
        crearRespaldoFn: async () => ({ success: true, point: { id: 'bkp-2' } }),
        crearNotificacionFn: async () => undefined,
        readDataFn: async <T>(file: string, def: T): Promise<T> => {
          if (file === 'presupuestos.json') return JSON.parse(JSON.stringify(presupuestosInput)) as T;
          return def;
        },
        writeDataFn: async (file: string, data: any) => {
          if (file === 'presupuestos.json') persistedPresupuestos = data;
          if (file === 'fiestas.json') persistedFiestas = data;
        },
      });
      expect(res.success).toBe(true);
      const prospecto = persistedPresupuestos.find((p) => p.id === 'p-2027-simulador');
      expect(prospecto?.estado).toBe('Enviado');
      expect(persistedFiestas.some((f) => f.presupuestoId === 'p-2027-simulador')).toBe(false);
      expect(persistedPresupuestos.find((p) => p.id === 'p-2027-simulador-aceptado')?.estado).toBe('Aceptado');
      expect(persistedFiestas.some((f) => f.presupuestoId === 'p-2027-simulador-aceptado')).toBe(true);
      // Lo anterior a 2027 se borra, también noviembre de 2026 (decisión del dueño, 25/11).
      expect(persistedPresupuestos.some((p) => p.id === 'p-2026-nov')).toBe(false);
    });
  });
});
