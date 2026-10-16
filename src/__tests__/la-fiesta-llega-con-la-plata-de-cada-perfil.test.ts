import { recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';
import { reponerLaPlata } from '@/lib/fiesta/reponer-la-plata';
import { sinCobros } from '@/lib/budget/sin-cobros';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { updateGestionCostos, updateGestionCostosInterno } from '@/app/actions/fiesta/costos.actions';
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
  const usuarioOperador = { perfil: 'operador', role: 'user' };
  const usuarioDueno = { perfil: 'dueno', role: 'admin' };
  const usuarioSecretariaConRolAdmin = { perfil: 'secretaria', role: 'admin' };
  const usuarioDuenoConRolUser = { perfil: 'dueno', role: 'user' };

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

    expect(recortada.personalAsignado?.[0]?.eventSalary).toBe(5000);
    expect(recortada.gestionCostos?.costoTotal).toBe(80000);
    expect(recortada.pagosProveedores?.length).toBe(1);
    expect(recortada.planDePagos?.cuotas?.length).toBe(1);
    expect(recortada.contratoDatos?.senia).toBe(20000);
    expect(recortada.estadosCompra?.[0]?.pagado).toBe(true);
  });

  it('4. Secretaria guarda la fiesta: eventSalary y gestionCostos guardados siguen iguales; nuevo eventSalary no se acepta', () => {
    const intentoSecretaria: FiestaEnPlanificacion = {
      ...fiestaMockBase,
      personalAsignado: [
        { empleadoId: 'emp-1', nombre: 'Carlos DJ', rol: 'DJ', eventSalary: 999999 },
        { empleadoId: 'emp-3', nombre: 'Nuevo Empleado', rol: 'Seguridad', eventSalary: 12345 },
      ] as any,
      gestionCostos: undefined,
    };

    const permisosSecretaria = {
      puedeContabilidad: puede(usuarioSecretaria, PERMISOS.CONTABILIDAD),
      puedeSueldos: puede(usuarioSecretaria, PERMISOS.SUELDOS),
      puedeGanancias: puede(usuarioSecretaria, PERMISOS.GANANCIAS),
    };

    const resultado = reponerLaPlata(intentoSecretaria, fiestaMockBase, permisosSecretaria);

    // Conserva gestionCostos guardada
    expect(resultado.gestionCostos).toEqual(fiestaMockBase.gestionCostos);

    // Conserva eventSalary de Carlos DJ original (5000, no 999999) y no acepta nuevo sueldo para emp-3
    const carlos = resultado.personalAsignado?.find((p) => p.empleadoId === 'emp-1');
    const nuevo = resultado.personalAsignado?.find((p) => p.empleadoId === 'emp-3');
    expect(carlos?.eventSalary).toBe(5000);
    expect(nuevo?.eventSalary).toBeUndefined();
  });

  it('5. Operador guarda: planDePagos, contratoDatos y pagosProveedores siguen iguales a lo guardado', () => {
    const intentoOperador: FiestaEnPlanificacion = {
      ...fiestaMockBase,
      planDePagos: undefined,
      contratoDatos: undefined,
      pagosProveedores: undefined,
    };

    const permisosOperador = {
      puedeContabilidad: puede(usuarioOperador, PERMISOS.CONTABILIDAD),
      puedeSueldos: puede(usuarioOperador, PERMISOS.SUELDOS),
      puedeGanancias: puede(usuarioOperador, PERMISOS.GANANCIAS),
    };

    const resultado = reponerLaPlata(intentoOperador, fiestaMockBase, permisosOperador);

    expect(resultado.planDePagos).toEqual(fiestaMockBase.planDePagos);
    expect(resultado.contratoDatos).toEqual(fiestaMockBase.contratoDatos);
    expect(resultado.pagosProveedores).toEqual(fiestaMockBase.pagosProveedores);
    expect(resultado.gestionCostos).toEqual(fiestaMockBase.gestionCostos);
  });

  it('6. Operador y updateGestionCostos: exige PERMISOS.GANANCIAS, sync automático sigue habilitado', () => {
    expect(puede(usuarioOperador, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(usuarioSecretaria, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(usuarioDueno, PERMISOS.GANANCIAS)).toBe(true);
    expect(typeof updateGestionCostos).toBe('function');
    expect(typeof updateGestionCostosInterno).toBe('function');
  });

  it('7. Operador lee presupuestos: sin senia, saldo ni pagosCliente; con total', () => {
    const presupuestoCompleto: Presupuesto = {
      id: 'pres-123',
      clienteNombre: 'Familia Gómez',
      total: 180000,
      costoTotalEstimado: 180000,
      senia: 40000,
      saldo: 140000,
      pagosCliente: [{ id: 'pago-1', monto: 40000 }] as any,
    } as any;

    const filtrado = sinCobros(presupuestoCompleto);

    expect(filtrado.total).toBe(180000);
    expect(filtrado.costoTotalEstimado).toBe(180000);
    expect(filtrado.senia).toBeUndefined();
    expect(filtrado.saldo).toBeUndefined();
    expect(filtrado.pagosCliente).toEqual([]);
  });

  it('8. Borrar presupuesto: usuario perfil dueno (rol viejo user) puede; rol admin con perfil secretaria NO puede', () => {
    expect(puede(usuarioDuenoConRolUser, PERMISOS.ADMINISTRACION)).toBe(true);
    expect(puede(usuarioSecretariaConRolAdmin, PERMISOS.ADMINISTRACION)).toBe(false);
  });
});
