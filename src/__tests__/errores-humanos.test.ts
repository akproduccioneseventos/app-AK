import { detectarErroresHumanos, type AlertaErrorHumano } from '@/lib/alertas/errores-humanos';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';

const FECHA_BASE = new Date('2026-09-01T12:00:00Z');

function fiestaCompleta(extra: Partial<FiestaEnPlanificacion> = {}): FiestaEnPlanificacion {
  return {
    id: 'f_completa_1',
    presupuestoId: 'p_completo_1',
    configuracion: {
      nombreEvento: 'XV de Valentina',
      fechaEvento: '2026-09-15',
      nombreLugar: 'Salón Principal AK',
      invitadosAdultos: 80,
      invitadosNinos: 20,
    } as any,
    contratoFirmaInfo: { isSigned: true, signedAt: '2026-08-01' } as any,
    menuAsignadoId: 'menu_completo_1',
    personalAsignado: [{ empleadoId: 'emp_1', nombre: 'Carlos Mozo' }] as any,
    invitados: [{ id: 'inv_1', nombre: 'Juan' }] as any,
    clientPortalSettings: { accessKey: 'key_123' } as any,
    estadosCompra: [{ id: 'compra_1', estado: 'comprado' }] as any,
    invoiceIds: ['inv_123'],
    ...extra,
  };
}

function presupuestoCompleto(extra: Partial<Presupuesto> = {}): Presupuesto {
  return {
    id: 'p_completo_1',
    clienteNombre: 'Valentina Rodríguez',
    clienteContacto: '098123456',
    eventoTipo: 'XV años',
    eventoFecha: '2026-09-15',
    invitadosCantidad: 100,
    costoTotalEstimado: 100000,
    senia: 20000,
    pagosCliente: [{ id: 'pago_1', monto: 100000, estadoPago: 'confirmado' }] as any,
    ...extra,
  };
}

describe('Bloque 6: Detección de Errores Humanos Previos a la Fiesta', () => {
  it('una fiesta completa y sin errores NO genera ninguna alerta', () => {
    const f = fiestaCompleta();
    const p = presupuestoCompleto();
    const alertas = detectarErroresHumanos([f], [p], [], FECHA_BASE);

    expect(alertas).toHaveLength(0);
  });

  it('detecta fiesta cercana sin contrato firmado y desaparece cuando se firma', () => {
    // Sin contrato
    const fSinContrato = fiestaCompleta({
      id: 'f_sin_contrato',
      contratoFirmaInfo: undefined,
      contratoGenerado: undefined,
      contratoDatos: undefined,
    });
    const p = presupuestoCompleto();

    const alertasAntes = detectarErroresHumanos([fSinContrato], [p], [], FECHA_BASE);
    const alertaContrato = alertasAntes.find((a) => a.id.startsWith('contrato_sin_firmar'));
    expect(alertaContrato).toBeDefined();
    expect(alertaContrato?.titulo).toBe('Contrato sin firmar');

    // Se firma el contrato
    const fConContrato = {
      ...fSinContrato,
      contratoFirmaInfo: { isSigned: true, signedAt: '2026-09-02' } as any,
    };
    const alertasDespues = detectarErroresHumanos([fConContrato], [p], [], FECHA_BASE);
    expect(alertasDespues.find((a) => a.id.startsWith('contrato_sin_firmar'))).toBeUndefined();
  });

  it('detecta seña no cobrada faltando 15 días o menos', () => {
    const f = fiestaCompleta({
      configuracion: { ...fiestaCompleta().configuracion, fechaEvento: '2026-09-10' },
    });
    const pSinSenia = presupuestoCompleto({
      pagosCliente: [],
      senia: 30000,
    });

    const alertas = detectarErroresHumanos([f], [pSinSenia], [], FECHA_BASE);
    const alertaSenia = alertas.find((a) => a.id.startsWith('sena_sin_cobrar'));
    expect(alertaSenia).toBeDefined();
    expect(alertaSenia?.titulo).toBe('Seña no cobrada');
  });

  it('detecta saldo pendiente de fiesta que ya pasó', () => {
    const fPasada = fiestaCompleta({
      configuracion: { ...fiestaCompleta().configuracion, fechaEvento: '2026-08-20' }, // Pasó hace 12 días
    });
    const pConSaldo = presupuestoCompleto({
      eventoFecha: '2026-08-20',
      costoTotalEstimado: 100000,
      pagosCliente: [{ id: 'p1', monto: 70000, estadoPago: 'confirmado' }] as any, // Debe 30.000
    });

    const alertas = detectarErroresHumanos([fPasada], [pConSaldo], [], FECHA_BASE);
    const alertaSaldo = alertas.find((a) => a.id.startsWith('saldo_impago_pasado'));
    expect(alertaSaldo).toBeDefined();
    expect(alertaSaldo?.descripcion).toMatch(/Quedan \$30\.000 sin cobrar/i);
  });

  it('detecta discrepancia en cantidad de invitados entre presupuesto y fiesta', () => {
    const f = fiestaCompleta({
      configuracion: {
        ...fiestaCompleta().configuracion,
        invitadosAdultos: 50,
        invitadosNinos: 10, // Total 60
      },
    });
    const p = presupuestoCompleto({
      invitadosCantidad: 120, // 120 vs 60
    });

    const alertas = detectarErroresHumanos([f], [p], [], FECHA_BASE);
    const alertaDiscrepancia = alertas.find((a) => a.id.startsWith('discrepancia_invitados'));
    expect(alertaDiscrepancia).toBeDefined();
    expect(alertaDiscrepancia?.titulo).toBe('Diferencia en cantidad de invitados');
  });

  it('detecta menú sin definir a menos de 20 días', () => {
    const fSinMenu = fiestaCompleta({
      menuAsignadoId: undefined,
      menuMesa: undefined,
      menuSeleccionPortal: undefined,
    });
    const p = presupuestoCompleto();

    const alertas = detectarErroresHumanos([fSinMenu], [p], [], FECHA_BASE);
    const alertaMenu = alertas.find((a) => a.id.startsWith('menu_sin_definir'));
    expect(alertaMenu).toBeDefined();
  });

  it('detecta personal sin asignar faltando 10 días o menos', () => {
    const fSinPersonal = fiestaCompleta({
      configuracion: { ...fiestaCompleta().configuracion, fechaEvento: '2026-09-08' }, // Faltan 7 días
      personalAsignado: [],
    });
    const p = presupuestoCompleto({ eventoFecha: '2026-09-08' });

    const alertas = detectarErroresHumanos([fSinPersonal], [p], [], FECHA_BASE);
    const alertaPersonal = alertas.find((a) => a.id.startsWith('personal_sin_asignar'));
    expect(alertaPersonal).toBeDefined();
  });

  it('detecta conflicto cuando dos fiestas están en el mismo salón la misma fecha', () => {
    const f1 = fiestaCompleta({
      id: 'f_salon_1',
      configuracion: { ...fiestaCompleta().configuracion, fechaEvento: '2026-09-15', nombreLugar: 'Club Salto Grande' },
    });
    const f2 = fiestaCompleta({
      id: 'f_salon_2',
      configuracion: { ...fiestaCompleta().configuracion, fechaEvento: '2026-09-15', nombreLugar: 'Club Salto Grande' },
    });

    const alertas = detectarErroresHumanos([f1, f2], [presupuestoCompleto()], [], FECHA_BASE);
    const alertaSalon = alertas.find((a) => a.id.startsWith('conflicto_salon'));
    expect(alertaSalon).toBeDefined();
    expect(alertaSalon?.titulo).toMatch(/Dos fiestas en el mismo salón/i);
  });

  it('permite descartar una alerta con motivo y no la vuelve a mostrar', () => {
    const fSinContrato = fiestaCompleta({
      id: 'f_descarte_test',
      contratoFirmaInfo: undefined,
    });
    const p = presupuestoCompleto();

    const descartes = [
      {
        alertaId: 'contrato_sin_firmar_f_descarte_test',
        motivo: 'El cliente firma en persona el día del evento',
        descartadaEn: '2026-09-01T12:00:00Z',
        descartadaPor: 'admin',
      },
    ];

    const alertas = detectarErroresHumanos([fSinContrato], [p], descartes, FECHA_BASE);
    expect(alertas.find((a) => a.id === 'contrato_sin_firmar_f_descarte_test')).toBeUndefined();
  });
});

