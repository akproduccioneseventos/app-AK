import { buildPuestaAlDiaReporte } from '@/lib/commercial-flow/puesta-al-dia';

/**
 * Los eventos viejos que se cargaron para tener el registro no pueden quedar
 * mezclados con los que vienen: ensucian la agenda, dejan gente asignada en
 * fechas que ya fueron y esconden si quedó plata sin cobrar.
 */

const HOY = new Date('2026-08-11T12:00:00Z');

function fiesta(extra: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    configuracion: { nombreEvento: 'XV de Sofía', fechaEvento: '2026-05-10' },
    personalAsignado: [],
    ...extra,
  } as any;
}

function presupuesto(extra: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    estado: 'Aceptado',
    eventoFecha: '2026-05-10',
    clienteNombre: 'Familia Pérez',
    costoTotalEstimado: 100000,
    pagosCliente: [],
    ...extra,
  } as any;
}

describe('puesta al día de los eventos pasados', () => {
  it('no molesta con las fiestas que todavía no ocurrieron', () => {
    const futura = fiesta({ configuracion: { nombreEvento: 'Boda', fechaEvento: '2026-12-20' } });
    const reporte = buildPuestaAlDiaReporte([futura], [], HOY);

    expect(reporte.totales.yaPasaron).toBe(0);
    expect(reporte.items).toHaveLength(0);
  });

  it('el mismo día de la fiesta todavía no cuenta como pasada', () => {
    const hoyMismo = fiesta({ configuracion: { nombreEvento: 'Hoy', fechaEvento: '2026-08-11' } });
    const reporte = buildPuestaAlDiaReporte([hoyMismo], [], HOY);

    expect(reporte.totales.yaPasaron).toBe(0);
  });

  it('avisa que una fiesta vieja sigue figurando como activa', () => {
    const reporte = buildPuestaAlDiaReporte([fiesta()], [], HOY);
    const aviso = reporte.items.find((i) => i.queLePasa.includes('sigue figurando como evento activo'));

    expect(aviso).toBeTruthy();
    expect(aviso?.nombre).toBe('XV de Sofía');
  });

  it('no repite el aviso cuando la fiesta ya se cerró', () => {
    const cerrada = fiesta({ estado: 'Finalizada' });
    const reporte = buildPuestaAlDiaReporte([cerrada], [], HOY);

    expect(reporte.items.some((i) => i.queLePasa.includes('sigue figurando'))).toBe(false);
  });

  it('marca el saldo pendiente de una fiesta que ya se hizo', () => {
    const conPresupuesto = fiesta({ presupuestoId: 'p1' });
    const reporte = buildPuestaAlDiaReporte([conPresupuesto], [presupuesto()], HOY);
    const cobrar = reporte.items.find((i) => i.gravedad === 'cobrar');

    expect(cobrar).toBeTruthy();
    expect(cobrar?.montoPendiente).toBeGreaterThan(0);
    expect(reporte.totales.plataPendiente).toBeGreaterThan(0);
    // No puede afirmar que el cliente debe: los eventos viejos se cargaron sin
    // los pagos uno por uno.
    expect(cobrar?.queHacer).toMatch(/revisalo antes de reclamar/i);
  });

  it('avisa si un evento pasado dejó gente del equipo asignada', () => {
    const conEquipo = fiesta({ personalAsignado: [{ empleadoId: 'e1' }, { empleadoId: 'e2' }] });
    const reporte = buildPuestaAlDiaReporte([conEquipo], [], HOY);
    const aviso = reporte.items.find((i) => i.queLePasa.includes('persona(s) del equipo'));

    expect(aviso).toBeTruthy();
    expect(aviso?.queLePasa).toContain('2 persona(s)');
  });

  it('encuentra el presupuesto aceptado que nunca se convirtió en evento', () => {
    const reporte = buildPuestaAlDiaReporte([], [presupuesto()], HOY);
    const huerfano = reporte.items.find((i) => i.queLePasa.includes('nunca se creó el evento'));

    expect(huerfano).toBeTruthy();
    expect(huerfano?.nombre).toBe('Familia Pérez');
  });

  it('no reclama por un presupuesto que sí tiene su fiesta', () => {
    const conFiesta = fiesta({ presupuestoId: 'p1', estado: 'Finalizada' });
    const reporte = buildPuestaAlDiaReporte([conFiesta], [presupuesto()], HOY);

    expect(reporte.items.some((i) => i.queLePasa.includes('nunca se creó el evento'))).toBe(false);
  });

  it('pone primero lo que es plata', () => {
    const conSaldo = fiesta({ id: 'f2', presupuestoId: 'p1' });
    const reporte = buildPuestaAlDiaReporte([fiesta(), conSaldo], [presupuesto()], HOY);

    expect(reporte.items[0].gravedad).toBe('cobrar');
  });
});

describe('correcciones de la revisión', () => {
  it('no reclama por un presupuesto cuyo evento quedó archivado', () => {
    const reporte = buildPuestaAlDiaReporte([], [presupuesto()], HOY, new Set(['p1']));

    expect(reporte.items.some((i) => i.queLePasa.includes('nunca se creó el evento'))).toBe(false);
  });

  it('el saldo pendiente incluye el ajuste anual', () => {
    // Contrato de 100.000 pagado completo, pero con ajuste anual del 15%:
    // faltan 15.000. Con el total pelado no aparecía nada.
    const conAjuste = presupuesto({
      ajusteAnualActivo: true,
      ajusteAnualPorcentaje: 15,
      timestamp: '2025-02-01T10:00:00.000Z',
      eventoFecha: '2026-05-10',
      pagosCliente: [{ id: 'pago1', monto: 100000, estadoPago: 'confirmado', fecha: '2025-03-01' }],
    });
    const fiestaPasada = fiesta({ presupuestoId: 'p1', configuracion: { nombreEvento: 'XV', fechaEvento: '2026-05-10' } });

    const reporte = buildPuestaAlDiaReporte([fiestaPasada], [conAjuste], HOY);
    const cobrar = reporte.items.find((i) => i.gravedad === 'cobrar');

    expect(cobrar).toBeTruthy();
    expect(cobrar?.montoPendiente).toBeGreaterThan(0);
  });

  it('no insiste con el ajuste anual si el dueño lo apagó a propósito', () => {
    const apagado = presupuesto({
      ajusteAnualActivo: false,
      timestamp: '2025-02-01T10:00:00.000Z',
      eventoFecha: '2027-05-10',
    });

    const reporte = buildPuestaAlDiaReporte([], [apagado], HOY);

    expect(reporte.items.some((i) => i.queLePasa.includes('ajuste anual'))).toBe(false);
  });

  it('cuenta las tareas del equipo, no sólo la lista del cliente', () => {
    const conTareas = fiesta({ tareas: [{ id: 't1', texto: 'Cargar fotos', completada: false }] });
    const reporte = buildPuestaAlDiaReporte([conTareas], [], HOY);
    const aviso = reporte.items.find((i) => i.queLePasa.includes('tarea(s) sin terminar'));

    expect(aviso).toBeTruthy();
  });
});
