/** @jest-environment node */

/**
 * Bloque 6 - Orden 247:
 * - Un enlace de presupuesto apagado ya no abre (rechaza token viejo o con versión desactualizada).
 * - Un enlace viejo sin versión sigue abriendo mientras versionDeEnlace sea 0.
 * - Una persona con perfil 'personal' no puede marcar la llegada de otra persona ('No podés marcar la llegada de otra persona.').
 * - Dos llamadas concurrentes a `addInvoiceId` dejan las dos facturas enlazadas en la fiesta (con base de mentira que devuelva copias profundas).
 * - Token de entretenimiento rechaza fiestas canceladas/suspendidas y estaciones deshabilitadas.
 * - Stock rápido de insumos actualiza cantidadDisponible sin pisar costo, nombre ni unidad.
 * - savePlanPagosContrato actualiza contratoDatos y rechaza si ya está firmado.
 */

process.env.SESSION_SECRET = 'secreto-de-prueba-para-orden-247-bloque-6-muy-seguro';

const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

let usuarioActual: any = null;

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) =>
    almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo])
  ),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => ({
    valor: almacen[archivo] === undefined ? porDefecto : copia(almacen[archivo]),
    huboFalla: false,
  })),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = copia(datos);
  }),
  updateDataPartial: jest.fn(async (archivo: string, parcial: any) => {
    almacen[archivo] = { ...almacen[archivo], ...copia(parcial) };
  }),
  createDataItem: jest.fn(async (archivo: string, _col: string, _id: string, item: any) => {
    const lista = almacen[archivo] || [];
    lista.push(copia(item));
    almacen[archivo] = copia(lista);
    return item;
  }),
  mutateDataItem: jest.fn(async (archivo: string, _col: string, id: string, cambiar: (a: any) => any) => {
    const lista = almacen[archivo] || [];
    const index = lista.findIndex((it: any) => it.id === id);
    if (index === -1) return null;
    const actual = copia(lista[index]);
    const nuevo = await cambiar(actual);
    lista[index] = copia(nuevo);
    almacen[archivo] = copia(lista);
    return copia(nuevo);
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (path: string, _vacio: any, cambiar: (a: any) => any) => {
    // Retardo asincrónico para forzar alternancia en concurrencia
    await new Promise((r) => setTimeout(r, 15));
    const actual = almacen[path] !== undefined ? copia(almacen[path]) : null;
    const nuevo = await cambiar(actual);
    if (nuevo === null) return null;
    almacen[path] = copia(nuevo);
    return copia(nuevo);
  }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireSession: jest.fn(async () =>
    usuarioActual ? { ok: true, user: usuarioActual } : { ok: false, error: 'Sesión no autorizada.' }
  ),
  requireAppSession: jest.fn(async () => {
    if (!usuarioActual) throw new Error('Sesión no autorizada.');
    return usuarioActual;
  }),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => {}),
  hasAppSession: jest.fn(async () => Boolean(usuarioActual)),
}));

jest.mock('@/lib/auth/session-token', () => {
  const actual = jest.requireActual('@/lib/auth/session-token');
  return {
    ...actual,
    verifySession: jest.fn(async () =>
      usuarioActual ? { success: true, user: usuarioActual } : { success: false }
    ),
  };
});

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'emp-1', email: 'mozo1@ak.com', googleWorkspaceEmail: 'm1@ak.com', nombre: 'Mozo Uno' },
    { id: 'emp-2', email: 'mozo2@ak.com', googleWorkspaceEmail: 'm2@ak.com', nombre: 'Mozo Dos' },
  ]),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () =>
    Object.keys(almacen)
      .filter((k) => k.startsWith('fiestas/'))
      .map((k) => copia(almacen[k]))
  ),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireFiestaWriteAccess: jest.fn(async () => true),
  requireEventPermission: jest.fn(async () => true),
}));

jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  quienEsElEquipo: jest.fn(async () => () => true),
  usuarioDelEquipo: jest.fn(async () => true),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) =>
    almacen[`fiestas/${id}.json`] ? copia(almacen[`fiestas/${id}.json`]) : null
  ),
  preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f),
}));

jest.mock('@/app/actions/crm', () => ({
  findLeadByBudgetOrCreate: jest.fn(async () => ({ lead: { id: 'lead-1' } })),
  getCrmStages: jest.fn(async () => []),
  moveCrmLead: jest.fn(),
}));

jest.mock('@/app/actions/menus-catering', () => ({
  aplicarInsumoEnMenus: jest.fn(async () => ({ success: true })),
  getMenus: jest.fn(async () => []),
}));

import { getPresupuestoById, apagarEnlacePresupuesto } from '@/app/actions/presupuestos';
import { generateBudgetToken, signPayload } from '@/lib/auth/session-token';
import { marcarLlegadaPersonal } from '@/app/actions/personal-fiestas';
import { addInvoiceId } from '@/app/actions/fiesta/fiesta.actions';
import { hasEntertainmentControlAccess, createEntertainmentAccessToken } from '@/lib/auth/entertainment-token';
import { saveInsumo } from '@/app/actions/insumos';
import { savePlanPagosContrato } from '@/app/actions/fiesta-actual';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque 6 - Enlaces de presupuesto, llegada de personal y facturas concurrentes', () => {
  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    usuarioActual = null;
  });

  describe('a) y b) Enlace de presupuesto y versionDeEnlace', () => {
    it('un enlace viejo sin versión sigue abriendo mientras versionDeEnlace sea 0, y apagado ya no abre', async () => {
      const presupuestoBase: Presupuesto = {
        id: 'pres-1',
        clienteNombre: 'Familia González',
        eventoTipo: 'Boda',
        eventoFecha: '2026-11-20',
        invitadosCantidad: 100,
        salonFiestas: 'Salón Principal',
        itemsPresupuestados: [],
        costoTotalEstimado: 80000,
        timestamp: new Date().toISOString(),
        estado: 'Enviado',
        versionDeEnlace: 0,
      };

      almacen['presupuestos.json'] = [copia(presupuestoBase)];

      // Token legado generado antes de que existiera la versión (payload "budget-token:pres-1")
      const tokenLegadoSinVersion = await signPayload('budget-token:pres-1');
      // Token generado con la versión 0 actual
      const tokenV0 = await generateBudgetToken('pres-1', 0);

      // b) Sin sesión de operador, el enlace viejo sin versión y el enlace con versión 0 abren
      usuarioActual = null;
      const abiertoConLegado = await getPresupuestoById('pres-1', tokenLegadoSinVersion);
      expect(abiertoConLegado).not.toBeNull();
      expect(abiertoConLegado?.id).toBe('pres-1');

      const abiertoConV0 = await getPresupuestoById('pres-1', tokenV0);
      expect(abiertoConV0).not.toBeNull();
      expect(abiertoConV0?.id).toBe('pres-1');

      // Se apaga el enlace con perfil de contabilidad
      usuarioActual = { userId: 'admin-1', role: 'admin', perfil: 'dueno' };
      const resApagado = await apagarEnlacePresupuesto('pres-1');
      expect(resApagado.success).toBe(true);

      const presupuestoGuardado = almacen['presupuestos.json'][0];
      expect(presupuestoGuardado.versionDeEnlace).toBe(1);

      // a) Sin sesión de operador, el enlace viejo y el token v0 son rechazados
      usuarioActual = null;
      const intentoConLegado = await getPresupuestoById('pres-1', tokenLegadoSinVersion);
      expect(intentoConLegado).toBeNull();

      const intentoConV0 = await getPresupuestoById('pres-1', tokenV0);
      expect(intentoConV0).toBeNull();

      // Un token nuevo generado con la nueva versión 1 abre con éxito
      const tokenV1 = await generateBudgetToken('pres-1', 1);
      const abiertoConV1 = await getPresupuestoById('pres-1', tokenV1);
      expect(abiertoConV1).not.toBeNull();
      expect(abiertoConV1?.id).toBe('pres-1');
    });
  });

  describe('c) marcarLlegadaPersonal con perfil "personal"', () => {
    it('una persona con perfil personal no puede marcar la llegada de otra persona', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f1',
        estado: 'En Planificacion',
        configuracion: { nombreEvento: 'Cumpleaños', fechaEvento: '2026-11-20' },
        personalAsignado: [
          { empleadoId: 'emp-1', rolId: 'mozo' },
          { empleadoId: 'emp-2', rolId: 'mozo' },
        ],
      } as any;

      almacen['fiestas/f1.json'] = copia(fiesta);

      // Usuario autenticado con perfil "personal" como empleado emp-1
      usuarioActual = {
        userId: 'emp-1',
        email: 'mozo1@ak.com',
        role: 'personal',
        perfil: 'personal',
      };

      // Intenta marcar la llegada de emp-2
      const resOtro = await marcarLlegadaPersonal('f1', 'emp-2');
      expect(resOtro.success).toBe(false);
      expect(resOtro.error).toBe('No podés marcar la llegada de otra persona.');

      // Intenta marcar su propia llegada emp-1
      const resPropio = await marcarLlegadaPersonal('f1', 'emp-1');
      expect(resPropio.success).toBe(true);
      expect(resPropio.checkInTimestamp).toBeDefined();

      const fiestaEnBase = almacen['fiestas/f1.json'];
      const personaMarcada = fiestaEnBase.personalAsignado.find((p: any) => p.empleadoId === 'emp-1');
      expect(personaMarcada.checkInTimestamp).toBe(resPropio.checkInTimestamp);
    });
  });

  describe('d) Concurrencia en addInvoiceId', () => {
    it('dos llamadas concurrentes a addInvoiceId dejan las dos facturas enlazadas en la fiesta', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f1',
        estado: 'En Planificacion',
        configuracion: { nombreEvento: 'Fiesta Concurrente', fechaEvento: '2026-12-10' },
        invoiceIds: [],
      } as any;

      almacen['fiestas/f1.json'] = copia(fiesta);

      usuarioActual = { userId: 'admin', role: 'admin', perfil: 'dueno' };

      // Ejecutar concurrentemente dos llamadas a addInvoiceId
      const [res1, res2] = await Promise.all([
        addInvoiceId('f1', 'factura-A'),
        addInvoiceId('f1', 'factura-B'),
      ]);

      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);

      const fiestaFinal = almacen['fiestas/f1.json'];
      expect(fiestaFinal.invoiceIds).toEqual(expect.arrayContaining(['factura-A', 'factura-B']));
      expect(fiestaFinal.invoiceIds.length).toBe(2);
    });
  });

  describe('e) hasEntertainmentControlAccess con fiesta cancelada/suspendida o módulo deshabilitado', () => {
    it('rechaza el token si la fiesta está suspendida, cancelada o la estación deshabilitada', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f-ent',
        estado: 'En Planificacion',
        configuracion: { nombreEvento: 'Fiesta Ent', fechaEvento: '2026-11-20' },
        others: {
          entretenimiento: {
            modules: {
              fotocabina: { enabled: true },
            },
          },
        },
      } as any;

      almacen['fiestas/f-ent.json'] = copia(fiesta);

      const token = createEntertainmentAccessToken('f-ent', 'fotocabina', 'operator');

      usuarioActual = null;
      // Estación habilitada y fiesta activa
      const accesoActivo = await hasEntertainmentControlAccess('f-ent', 'fotocabina', token);
      expect(accesoActivo).toBe(true);

      // Fiesta Suspendida
      almacen['fiestas/f-ent.json'].estado = 'Suspendida';
      const accesoSuspendida = await hasEntertainmentControlAccess('f-ent', 'fotocabina', token);
      expect(accesoSuspendida).toBe(false);

      // Fiesta Cancelada
      almacen['fiestas/f-ent.json'].estado = 'Cancelada';
      const accesoCancelada = await hasEntertainmentControlAccess('f-ent', 'fotocabina', token);
      expect(accesoCancelada).toBe(false);

      // Fiesta Activa pero estación deshabilitada
      almacen['fiestas/f-ent.json'].estado = 'En Planificacion';
      almacen['fiestas/f-ent.json'].others.entretenimiento.modules.fotocabina.enabled = false;
      const accesoDeshabilitada = await hasEntertainmentControlAccess('f-ent', 'fotocabina', token);
      expect(accesoDeshabilitada).toBe(false);
    });
  });

  describe('f) Stock parcial de Insumos', () => {
    it('actualiza sólo la cantidadDisponible sin pisar costo, nombre ni unidad', async () => {
      almacen['insumos.json'] = [
        {
          id: 'ins-1',
          nombre: 'Vodka Absolut',
          categoria: 'Bebidas',
          unidad: 'botella',
          valorUnitarioEstimado: 850,
          cantidadDisponible: 10,
        },
      ];

      usuarioActual = { userId: 'admin', role: 'admin', perfil: 'dueno' };

      const res = await saveInsumo({ id: 'ins-1', cantidadDisponible: 25 });
      expect(res.success).toBe(true);

      const insumoEnBase = almacen['insumos.json'][0];
      expect(insumoEnBase.cantidadDisponible).toBe(25);
      expect(insumoEnBase.valorUnitarioEstimado).toBe(850);
      expect(insumoEnBase.nombre).toBe('Vodka Absolut');
      expect(insumoEnBase.unidad).toBe('botella');
    });
  });

  describe('g) savePlanPagosContrato', () => {
    it('arma contratoDatos adentro de actualizarFiesta y rechaza si el contrato está firmado', async () => {
      const fiesta: FiestaEnPlanificacion = {
        id: 'f-contrato',
        estado: 'En Planificacion',
        configuracion: { nombreEvento: 'Fiesta Contrato' },
        contratoFirmaInfo: { isSigned: false },
        contratoDatos: { detalle: 'original' },
      } as any;

      almacen['fiestas/f-contrato.json'] = copia(fiesta);

      usuarioActual = { userId: 'admin', role: 'admin', perfil: 'dueno' };

      const planMock: any = { cuotas: [{ id: 'c1', monto: 5000 }] };
      const res = await savePlanPagosContrato('f-contrato', planMock);
      expect(res.success).toBe(true);

      const enBase = almacen['fiestas/f-contrato.json'];
      expect(enBase.contratoDatos.planPagos).toEqual(planMock);
      expect(enBase.contratoDatos.detalle).toBe('original');

      // Si está firmado, no debe permitir modificar
      enBase.contratoFirmaInfo.isSigned = true;
      almacen['fiestas/f-contrato.json'] = copia(enBase);

      const resFirmado = await savePlanPagosContrato('f-contrato', planMock);
      expect(resFirmado.success).toBe(false);
      expect(resFirmado.error).toMatch(/No se puede modificar el plan de pagos una vez firmado el contrato/);
    });
  });
});


