import { recortarFiestaPorPerfil } from '@/lib/fiesta/recortar-para-afuera';
import { PERMISOS, puede } from '@/lib/auth/perfiles';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 198: lo que devuelve un guardado respeta el perfil', () => {
  const fiestaCompleta: FiestaEnPlanificacion = {
    id: 'fiesta-test-198',
    nombreEvento: 'Prueba Orden 198',
    fechaEvento: '2026-12-01',
    gestionCostos: {
      total: 9500,
      margen: 30,
    } as any,
    personalAsignado: [
      { empleadoId: 'emp_1', rolId: 'rol_dj', eventSalary: 3500 },
      { empleadoId: 'emp_2', rolId: 'rol_camarero', eventSalary: 2000 },
    ],
    pagosProveedores: [
      { id: 'pago_1', monto: 1500, proveedorId: 'prov_1' },
    ] as any,
    planDePagos: {
      cuotas: [{ numero: 1, monto: 5000, estado: 'pagada' }],
    } as any,
    clientPaymentNotifications: [{ id: 'notif_1', monto: 5000 }] as any,
    contratoDatos: { seña: 10000, saldo: 40000 } as any,
    estadosCompra: [
      { proveedorId: 'prov_1', proveedor: 'Sonido SRL', pagado: true, montoPagado: 1500 } as any,
      { proveedorId: 'prov_2', proveedor: 'Bebidas SA', pagado: false, montoPagado: 0 } as any,
    ],
  } as unknown as FiestaEnPlanificacion;

  it('el operador no recibe costos ni pagos a proveedores en la respuesta', () => {
    const operador = { perfil: 'operador' as const };
    expect(puede(operador, PERMISOS.CONTABILIDAD)).toBe(false);
    expect(puede(operador, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(operador, PERMISOS.SUELDOS)).toBe(false);

    const recortada = recortarFiestaPorPerfil(fiestaCompleta, operador);

    // Sin ganancias
    expect(recortada.gestionCostos).toBeUndefined();

    // Sin contabilidad
    expect(recortada.pagosProveedores).toBeUndefined();
    expect(recortada.planDePagos).toBeUndefined();
    expect(recortada.clientPaymentNotifications).toBeUndefined();
    expect(recortada.contratoDatos).toBeUndefined();
    expect(recortada.estadosCompra?.[0].pagado).toBeUndefined();
    expect(recortada.estadosCompra?.[0].montoPagado).toBeUndefined();

    // Sin sueldos
    expect(recortada.personalAsignado?.[0].eventSalary).toBeUndefined();
    expect(recortada.personalAsignado?.[1].eventSalary).toBeUndefined();
    // Pero conserva la asignación
    expect(recortada.personalAsignado?.[0].empleadoId).toBe('emp_1');
  });

  it('la secretaria ve contabilidad pero no ve costos (ganancias) ni sueldos ajenos', () => {
    const secretaria = { perfil: 'secretaria' as const };
    expect(puede(secretaria, PERMISOS.CONTABILIDAD)).toBe(true);
    expect(puede(secretaria, PERMISOS.GANANCIAS)).toBe(false);
    expect(puede(secretaria, PERMISOS.SUELDOS)).toBe(false);

    const recortada = recortarFiestaPorPerfil(fiestaCompleta, secretaria);

    // Sin ganancias ni sueldos
    expect(recortada.gestionCostos).toBeUndefined();
    expect(recortada.personalAsignado?.[0].eventSalary).toBeUndefined();

    // Pero sí ve contabilidad
    expect(recortada.pagosProveedores).toBeDefined();
    expect(recortada.planDePagos).toBeDefined();
    expect(recortada.estadosCompra?.[0].montoPagado).toBe(1500);
  });

  it('el dueño conserva todos los campos de plata', () => {
    const dueno = { perfil: 'dueno' as const };
    expect(puede(dueno, PERMISOS.CONTABILIDAD)).toBe(true);
    expect(puede(dueno, PERMISOS.GANANCIAS)).toBe(true);
    expect(puede(dueno, PERMISOS.SUELDOS)).toBe(true);

    const recortada = recortarFiestaPorPerfil(fiestaCompleta, dueno);

    expect(recortada.gestionCostos).toBeDefined();
    expect(recortada.personalAsignado?.[0].eventSalary).toBe(3500);
    expect(recortada.pagosProveedores).toBeDefined();
    expect(recortada.estadosCompra?.[0].montoPagado).toBe(1500);
  });

  it('saveFiesta y las acciones de reuniones y multiagente importan y usan recortarFiestaPorPerfil', () => {
    const fs = require('fs');
    const path = require('path');

    const fiestaActions = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/fiesta/fiesta.actions.ts'), 'utf8');
    expect(fiestaActions).toContain('recortarFiestaPorPerfil');

    const reunionesActions = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/fiesta/reuniones.actions.ts'), 'utf8');
    expect(reunionesActions).toContain('recortarFiestaPorPerfil');
    expect(reunionesActions).toContain('PERMISOS.ORGANIZACION');

    const multiagentActions = fs.readFileSync(path.join(process.cwd(), 'src/app/actions/multiagent.ts'), 'utf8');
    expect(multiagentActions).toContain('recortarFiestaPorPerfil');
    expect(multiagentActions).toContain('PERMISOS.ORGANIZACION');
  });
});
