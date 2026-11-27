import fs from 'node:fs';
import path from 'node:path';
import { getPaymentPlanSummary } from '@/lib/budget/payment-summary';
import { recalcularEstadoCuotas } from '@/lib/planPagos';
import { detectarProblemasFiesta } from '@/lib/fiesta/revisar-fiestas';
import type { PlanPagos, FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 367 B6 — Fechas de cobros y vencimientos en día civil de Uruguay', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('payment-summary no marca vencida una cuota el mismo día a las 23:30 de Uruguay (02:30Z del día siguiente)', () => {
    const cuotas = [
      { monto: 10000, estado: 'pendiente' as const, fechaVencimiento: '2026-10-15' },
    ];

    // 15 de octubre 23:30 en Uruguay = 16 de octubre 02:30 UTC
    const nocheDel15Uy = new Date('2026-10-16T02:30:00.000Z');
    expect(getPaymentPlanSummary(cuotas, nocheDel15Uy).overdueCount).toBe(0);

    // 16 de octubre 00:05 en Uruguay = 16 de octubre 03:05 UTC
    const madrugadaDel16Uy = new Date('2026-10-16T03:05:00.000Z');
    expect(getPaymentPlanSummary(cuotas, madrugadaDel16Uy).overdueCount).toBe(1);
  });

  it('recalcularEstadoCuotas respeta el día civil de Uruguay', () => {
    jest.useFakeTimers();
    // 15 de octubre 23:30 en Uruguay
    jest.setSystemTime(new Date('2026-10-16T02:30:00.000Z'));

    const plan: PlanPagos = {
      activo: true,
      pagoMinimoTrimestral: 10000,
      porcentajeMinimoAntesFecha: 30,
      mesesLimiteAntesFecha: 6,
      fechaLimite30Porciento: '2026-10-15',
      montoObjetivo30Porciento: 30000,
      aceptadoPorCliente: true,
      generadoAt: '2026-01-01T12:00:00.000Z',
      cuotas: [
        {
          id: 'cuota_1',
          descripcion: 'Cuota 1',
          fechaVencimiento: '2026-10-15',
          montoMinimo: 10000,
          esCuotaClave: false,
          estado: 'pendiente',
          pagosAplicados: [],
          montoAcumulado: 0,
        },
      ],
    };

    const hoyMismo = recalcularEstadoCuotas(plan, []);
    expect(hoyMismo.cuotas[0].estado).toBe('pendiente');

    // Al día siguiente en Uruguay (16 de octubre 00:05 UY)
    jest.setSystemTime(new Date('2026-10-16T03:05:00.000Z'));
    const diaSiguiente = recalcularEstadoCuotas(plan, []);
    expect(diaSiguiente.cuotas[0].estado).toBe('vencida');
  });

  it('detectarProblemasFiesta no marca pasada ni vencida una fiesta/cuota de hoy a la noche en Uruguay', () => {
    const fiesta = {
      id: 'f1',
      presupuestoId: 'p1',
      estado: 'En Planificación',
      configuracion: {
        nombreEvento: 'Evento hoy',
        fechaEvento: '2026-10-15',
        nombreLugar: 'Club Uruguay',
        invitadosEstimados: 100,
        clienteNombre: 'Ana',
        nombreAgasajado: 'Sofía',
      },
      planDePagos: {
        cuotas: [
          { id: 'c1', descripcion: 'Saldo', monto: 10000, fechaVencimiento: '2026-10-15', estado: 'pendiente' },
        ],
      },
    } as unknown as FiestaEnPlanificacion;

    const nocheDel15Uy = new Date('2026-10-16T02:30:00.000Z');
    const problemasHoy = detectarProblemasFiesta(fiesta, { hoy: nocheDel15Uy });
    expect(problemasHoy.map((p) => p.tipo)).toEqual([]);

    const madrugadaDel16Uy = new Date('2026-10-16T03:05:00.000Z');
    const problemasManana = detectarProblemasFiesta(fiesta, { hoy: madrugadaDel16Uy });
    expect(problemasManana.map((p) => p.tipo)).toEqual(['pasada_sin_archivar', 'cuotas_vencidas']);
  });

  it('ver/page.tsx y plan-pagos.tsx usan hoyEnUruguay() en vez de toISOString()', () => {
    const raiz = path.resolve(__dirname, '..');
    const verPage = fs.readFileSync(path.join(raiz, 'app/(app)/presupuestos/[id]/ver/page.tsx'), 'utf8');
    const planPagosPanel = fs.readFileSync(path.join(raiz, 'components/fiestas/panels/plan-pagos.tsx'), 'utf8');

    expect(verPage).not.toContain('setNewPagoFecha(new Date().toISOString()');
    expect(verPage).toContain('setNewPagoFecha(hoyEnUruguay())');
    expect(planPagosPanel).not.toContain('fechaVencimiento: new Date().toISOString()');
    expect(planPagosPanel).toContain('fechaVencimiento: hoyEnUruguay()');
  });
});
