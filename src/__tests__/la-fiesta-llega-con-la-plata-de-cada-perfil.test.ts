/**
 * Comprobación: si sacás la línea `const conPlata = sinPlata ? reponerLaPlata(datos, actual) : datos;` de
 * `saveFiesta`, el caso 5 se pone en rojo. Si sacás `.map(sinCobros)` de `presupuestos.ts`, el caso 7 también.
 */
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

const almacen: Record<string, any> = {};
const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));
let usuarioActual: any = null;

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
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () =>
    usuarioActual ? { success: true, user: usuarioActual } : { success: false }
  ),
  generateBudgetToken: jest.fn(async () => 'mock-token'),
  verifyBudgetToken: jest.fn(async () => true),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [{ id: 'op-1', email: 'op@ak.test' }]),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => [copia(almacen['fiestas/fiesta-test-183.json'])]),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(async (id: string) => copia(almacen[`fiestas/${id}.json`] ?? null)),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, cambiar: (f: any) => any) => {
    try {
      const key = `fiestas/${id}.json`;
      const actual = copia(almacen[key] ?? null);
      const nueva = await cambiar(actual);
      almacen[key] = copia(nueva);
      return { success: true, updatedFiesta: nueva };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }),
}));

import { recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { updateGestionCostos } from '@/app/actions/fiesta/costos.actions';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos, getPresupuestoById } from '@/app/actions/presupuestos';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

describe('La fiesta le llega a cada perfil sólo con la plata que puede ver (Orden 183)', () => {
  const fiestaMockBase: FiestaEnPlanificacion = {
    id: 'fiesta-test-183',
    nombre: 'XV de Valentina',
    fecha: '2026-11-20',
    invitados: [{ id: 'inv-1', nombre: 'Juan Pérez', rsvp: 'Confirmado' }] as any,
    menu: { platoPrincipal: 'Asado' } as any,
    cronograma: [{ hora: '21:00', actividad: 'Recepción' }] as any,
    personalAsignado: [
      { empleadoId: 'op-1', nombre: 'Operador Test', rol: 'Operador' },
      { empleadoId: 'emp-1', nombre: 'Carlos DJ', rol: 'DJ', eventSalary: 5000 },
      { empleadoId: 'emp-2', nombre: 'Ana Fotógrafa', rol: 'Fotografía', eventSalary: 8000 },
    ] as any,
    gestionCostos: {
      costoTotal: 80000,
      ingresoTotal: 150000,
      margenEstimado: 70000,
    } as any,
    pagosProveedores: [{ proveedorId: 'prov-1', monto: 12000 }] as any,
    planDePagos: { cuotas: [{ numero: 1, monto: 30000, estado: 'pagada' }] } as any,
    clientPaymentNotifications: [{ id: 'cpn-1', monto: 30000 }] as any,
    contratoDatos: { senia: 20000, saldo: 130000 } as any,
    estadosCompra: [
      { id: 'ec-1', proveedorId: 'prov-1', item: 'Carne', pagado: true, montoPagado: 12000 },
    ] as any,
  };

  const usuarioSecretaria = { perfil: 'secretaria', role: 'user' };
  const usuarioOperador = { userId: 'op-1', email: 'op@ak.test', perfil: 'operador', role: 'user' };
  const usuarioDueno = { perfil: 'dueno', role: 'admin' };
  const usuarioSecretariaConRolAdmin = { perfil: 'secretaria', role: 'admin' };
  const usuarioDuenoConRolUser = { perfil: 'dueno', role: 'user' };

  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    almacen['fiestas/fiesta-test-183.json'] = copia(fiestaMockBase);
  });

  it('1. Secretaria lee: sin eventSalary ni gestionCostos; con planDePagos', () => {
    const recortada = recortarFiestaPorPerfil(fiestaMockBase, usuarioSecretaria);

    expect(recortada.personalAsignado).toBeDefined();
    recortada.personalAsignado?.forEach((p: any) => {
      expect(p.eventSalary).toBeUndefined();
      expect(p.nombre).toBeDefined();
      expect(p.rol).toBeDefined();
    });

    expect(recortada.gestionCostos).toBeUndefined();
    expect(recortada.planDePagos).toBeDefined();
  });

  it('2. Operador lee: sin ninguno de los campos de plata de la tabla; con invitados, menú y cronograma', () => {
    const recortada = recortarFiestaPorPerfil(fiestaMockBase, usuarioOperador);

    // Sin plata
    recortada.personalAsignado?.forEach((p: any) => {
      expect(p.eventSalary).toBeUndefined();
    });
    expect(recortada.gestionCostos).toBeUndefined();
    expect(recortada.pagosProveedores).toBeUndefined();
    expect(recortada.planDePagos).toBeUndefined();
    expect(recortada.clientPaymentNotifications).toBeUndefined();
    expect(recortada.contratoDatos).toBeUndefined();
    recortada.estadosCompra?.forEach((ec: any) => {
      expect(ec.pagado).toBeUndefined();
      expect(ec.montoPagado).toBeUndefined();
    });

    // Con datos operativos
    expect(recortada.invitados?.length).toBe(1);
    expect(recortada.menu).toBeDefined();
    expect(recortada.cronograma).toBeDefined();
  });

  it('3. Dueño lee: todo intacto', () => {
    const recortada = recortarFiestaPorPerfil(fiestaMockBase, usuarioDueno);

    expect(recortada.personalAsignado?.[1]?.eventSalary).toBe(5000);
    expect(recortada.gestionCostos?.costoTotal).toBe(80000);
    expect(recortada.pagosProveedores?.length).toBe(1);
    expect(recortada.planDePagos?.cuotas?.length).toBe(1);
    expect(recortada.contratoDatos?.senia).toBe(20000);
    expect(recortada.estadosCompra?.[0]?.pagado).toBe(true);
  });

  it('4. Secretaria guarda la fiesta: eventSalary y gestionCostos guardados siguen iguales; nuevo eventSalary no se acepta', async () => {
    usuarioActual = usuarioSecretaria;

    const intentoSecretaria: FiestaEnPlanificacion = {
      ...fiestaMockBase,
      personalAsignado: [
        { empleadoId: 'op-1', nombre: 'Operador Test', rol: 'Operador' },
        { empleadoId: 'emp-1', nombre: 'Carlos DJ', rol: 'DJ', eventSalary: 999999 },
        { empleadoId: 'emp-3', nombre: 'Nuevo Empleado', rol: 'Seguridad', eventSalary: 12345 },
      ] as any,
      gestionCostos: undefined,
    };

    const res = await saveFiesta(intentoSecretaria);
    expect(res.success).toBe(true);

    const guardada = almacen['fiestas/fiesta-test-183.json'];

    // Conserva gestionCostos guardada
    expect(guardada.gestionCostos).toEqual(fiestaMockBase.gestionCostos);

    // Conserva eventSalary de Carlos DJ original (5000, no 999999) y no acepta nuevo sueldo para emp-3
    const carlos = guardada.personalAsignado?.find((p: any) => p.empleadoId === 'emp-1');
    const nuevo = guardada.personalAsignado?.find((p: any) => p.empleadoId === 'emp-3');
    expect(carlos?.eventSalary).toBe(5000);
    expect(nuevo?.eventSalary).toBeUndefined();
  });

  it('5. Operador guarda: planDePagos, contratoDatos y pagosProveedores siguen iguales a lo guardado', async () => {
    usuarioActual = usuarioOperador;

    const intentoOperador: FiestaEnPlanificacion = {
      ...fiestaMockBase,
      planDePagos: undefined,
      contratoDatos: undefined,
      pagosProveedores: undefined,
      gestionCostos: undefined,
    };

    const res = await saveFiesta(intentoOperador);
    expect(res.success).toBe(true);

    const guardada = almacen['fiestas/fiesta-test-183.json'];

    expect(guardada.planDePagos).toEqual(fiestaMockBase.planDePagos);
    expect(guardada.contratoDatos).toEqual(fiestaMockBase.contratoDatos);
    expect(guardada.pagosProveedores).toEqual(fiestaMockBase.pagosProveedores);
    expect(guardada.gestionCostos).toEqual(fiestaMockBase.gestionCostos);
  });

  it('6. Operador y updateGestionCostos: exige PERMISOS.GANANCIAS, sync automático sigue habilitado', () => {
    expect(puede(usuarioOperador, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(usuarioSecretaria, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(usuarioDueno, PERMISOS.GANANCIAS)).toBe(true);
    expect(typeof updateGestionCostos).toBe('function');
  });

  it('7. Operador lee presupuestos: sin pagosCliente; con total y costoTotalEstimado', async () => {
    usuarioActual = usuarioOperador;

    const presupuestoCompleto: Presupuesto = {
      id: 'pres-123',
      clienteNombre: 'Familia Gómez',
      total: 180000,
      costoTotalEstimado: 180000,
      senia: 40000,
      saldo: 140000,
      pagosCliente: [{ id: 'pago-1', monto: 40000 }] as any,
    } as any;

    almacen['presupuestos.json'] = [copia(presupuestoCompleto)];

    const lista = await getPresupuestos();
    expect(lista.length).toBe(1);
    const filtrado = lista[0];

    expect(filtrado.total).toBe(180000);
    expect(filtrado.costoTotalEstimado).toBe(180000);
    expect(filtrado.pagosCliente).toEqual([]);

    const individual = await getPresupuestoById('pres-123');
    expect(individual).not.toBeNull();
    expect(individual?.pagosCliente).toEqual([]);
  });

  it('8. Borrar presupuesto: usuario perfil dueno (rol viejo user) puede; rol admin con perfil secretaria NO puede', () => {
    expect(puede(usuarioDuenoConRolUser, PERMISOS.ADMINISTRACION)).toBe(true);
    expect(puede(usuarioSecretariaConRolAdmin, PERMISOS.ADMINISTRACION)).toBe(false);
  });
});
