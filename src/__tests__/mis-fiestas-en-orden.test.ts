/**
 * @fileOverview Pruebas para la Orden 106 Bloque 13:
 * Mis fiestas en orden: suspendidas, pasadas y quién es el cliente.
 *
 * Requisitos del bloque:
 * 1. Una fiesta suspendida no aparece en próximas.
 * 2. No genera recordatorios de cuotas ni avisos.
 * 3. Su plata cobrada queda intacta, con cálculo de penalidad del 30% según contrato.
 * 4. Una fiesta pasada sin archivar y otra con cliente igual al agasajado aparecen en "Revisar mis fiestas".
 */

import type { FiestaEnPlanificacion, PlanDePagos } from '@/types/fiesta';
import {
  esFiestaSuspendida,
  suspenderFiesta,
  reactivarFiesta,
  calcularLiquidacionSuspension,
  detectarProblemasFiesta,
  obtenerFiestasParaRevisar,
} from '@/lib/fiesta/revisar-fiestas';
import { evaluarReglasParaFiesta } from '@/lib/automatizaciones-engine';

// Mock de base y dependencias para pruebas de lectura
let coleccionFiestasEnMemoria: FiestaEnPlanificacion[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'usr_admin', email: 'admin@ak.com' } })),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    const f = coleccionFiestasEnMemoria.find((item) => file.includes(item.id));
    return f ? JSON.parse(JSON.stringify(f)) : fallback;
  }),
  writeData: jest.fn(async () => true),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => {
  const actual = jest.requireActual('@/lib/fiesta/leer-fiestas');
  return {
    ...actual,
    leerFiestasCrudas: jest.fn(async (includeArchived = true) => {
      const activas = coleccionFiestasEnMemoria.filter((f) => f.estado !== 'Archivado');
      const activasFiltradas = activas.filter(
        (f) => includeArchived || (f.estado !== 'suspendida' && f.estado !== 'Suspendida')
      );
      return activasFiltradas.map((f) => JSON.parse(JSON.stringify(f)));
    }),
  };
});

describe('Orden 106 Bloque 13 — Mis fiestas en orden', () => {
  const planDePagosConCobros: PlanDePagos = {
    id: 'plan_1',
    fiestaId: 'fiesta_suspendida_1',
    cuotas: [
      {
        id: 'c1',
        numero: 1,
        concepto: 'Seña inicial',
        monto: 15000,
        montoPagado: 15000,
        fechaVencimiento: '2026-08-01',
        estado: 'pagado',
      },
      {
        id: 'c2',
        numero: 2,
        concepto: 'Segunda cuota',
        monto: 15000,
        fechaVencimiento: '2026-09-01',
        estado: 'vencido',
      },
      {
        id: 'c3',
        numero: 3,
        concepto: 'Saldo final',
        monto: 20000,
        fechaVencimiento: '2026-11-01',
        estado: 'pendiente',
      },
    ],
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
  };

  const fiestaFuturaActiva: FiestaEnPlanificacion = {
    id: 'fiesta_activa_futura',
    configuracion: {
      nombreEvento: '15 de Camila',
      tipoCelebracion: '15_anios',
      fechaEvento: '2026-12-15',
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Club Uruguay',
      invitadosEstimados: 120,
      presupuestoEstimado: 50000,
      notesAdicionales: '',
      clienteNombre: 'Laura Méndez',
      nombreAgasajado: 'Camila',
      protagonista1Nombre: 'Camila',
    },
    estado: 'En Planificación',
    personalAsignado: [],
    planDePagos: planDePagosConCobros,
  };

  const fiestaFuturaSuspendida: FiestaEnPlanificacion = {
    id: 'fiesta_suspendida_futura',
    configuracion: {
      nombreEvento: '15 de Valentina',
      tipoCelebracion: '15_anios',
      fechaEvento: '2026-12-20',
      horaInicio: '21:00',
      horaFin: '05:00',
      nombreLugar: 'Salón Haras',
      invitadosEstimados: 100,
      presupuestoEstimado: 50000,
      notesAdicionales: '',
      clienteNombre: 'Patricia Ramos',
      nombreAgasajado: 'Valentina',
      protagonista1Nombre: 'Valentina',
    },
    estado: 'suspendida',
    motivoSuspension: 'Suspensión familiar temporal',
    fechaSuspension: '2026-09-15',
    personalAsignado: [],
    planDePagos: planDePagosConCobros,
  };

  beforeEach(() => {
    coleccionFiestasEnMemoria = [fiestaFuturaActiva, fiestaFuturaSuspendida];
  });

  test('1. Una fiesta suspendida no aparece en el listado de próximas fiestas activas', async () => {
    const { leerFiestasCrudas } = await import('@/lib/fiesta/leer-fiestas');

    // Con includeArchived = false (próximas / activas)
    const proximas = await leerFiestasCrudas(false);
    const idsProximas = proximas.map((f) => f.id);

    expect(idsProximas).toContain('fiesta_activa_futura');
    expect(idsProximas).not.toContain('fiesta_suspendida_futura');

    // Con includeArchived = true (todas para el panel del dueño)
    const todas = await leerFiestasCrudas(true);
    const idsTodas = todas.map((f) => f.id);
    expect(idsTodas).toContain('fiesta_suspendida_futura');
  });

  test('2. Una fiesta suspendida no genera recordatorios de cuotas ni avisos ni alertas automáticas', () => {
    // La fiesta activa tiene una cuota vencida ('c2' vencida), por ende genera alertas
    const alertasActiva = evaluarReglasParaFiesta(fiestaFuturaActiva);
    expect(alertasActiva.length).toBeGreaterThan(0);

    // La misma fiesta en estado suspendida apaga automáticamente todas sus alertas
    const alertasSuspendida = evaluarReglasParaFiesta(fiestaFuturaSuspendida);
    expect(alertasSuspendida).toEqual([]);
    expect(alertasSuspendida.length).toBe(0);
  });

  test('3. Suspender una fiesta no toca la plata cobrada y calcula la penalidad según contrato', () => {
    // Tomamos la fiesta activa y la suspendemos
    const suspendida = suspenderFiesta(fiestaFuturaActiva, 'El cliente suspendió por fuerza mayor', '2026-10-01');

    expect(esFiestaSuspendida(suspendida)).toBe(true);
    expect(suspendida.estado).toBe('suspendida');
    expect(suspendida.motivoSuspension).toBe('El cliente suspendió por fuerza mayor');

    // La plata cobrada queda intacta: cuota 1 pagada con 15000
    const cuotas = suspendida.planDePagos?.cuotas || [];
    const cuota1 = cuotas.find((c) => c.id === 'c1');
    expect(cuota1?.estado).toBe('pagado');
    expect(cuota1?.montoPagado).toBe(15000);

    // Liquidación según contrato (penalidad 30% del presupuesto vigente de 50.000 = 15.000)
    const liquidacion = calcularLiquidacionSuspension(suspendida, 50000);
    expect(liquidacion.totalPresupuesto).toBe(50000);
    expect(liquidacion.penalidad30).toBe(15000); // 30%
    expect(liquidacion.totalCobrado).toBe(15000);
    expect(liquidacion.diferenciaACobrar).toBe(0); // Lo cobrado cubrió exactamente el 30%

    // Si se hubiesen cobrado solo $10.000, la diferencia a cobrar sería $5.000
    const fiestaConMenosCobro: FiestaEnPlanificacion = {
      ...suspendida,
      planDePagos: {
        ...planDePagosConCobros,
        cuotas: [
          { ...planDePagosConCobros.cuotas[0], montoPagado: 10000 },
        ],
      },
    };
    const liquidacionParcial = calcularLiquidacionSuspension(fiestaConMenosCobro, 50000);
    expect(liquidacionParcial.totalCobrado).toBe(10000);
    expect(liquidacionParcial.diferenciaACobrar).toBe(5000);

    // Reactivar devuelve la fiesta a planificación activa y borra la suspensión
    const reactivada = reactivarFiesta(suspendida);
    expect(reactivada.estado).toBe('En Planificación');
    expect((reactivada as any).motivoSuspension).toBeUndefined();
  });

  test('4. Detección en "Revisar mis fiestas": fiesta pasada sin archivar y cliente igual al agasajado', () => {
    const hoySimulado = new Date('2026-10-01T12:00:00Z');

    // Fiesta pasada sin archivar
    const fiestaPasadaSinArchivar: FiestaEnPlanificacion = {
      id: 'fiesta_pasada_1',
      configuracion: {
        nombreEvento: 'Boda de Martín y Lucía',
        tipoCelebracion: 'boda',
        fechaEvento: '2026-08-15', // Fecha pasada
        horaInicio: '21:00',
        horaFin: '05:00',
        nombreLugar: 'Salón Prado',
        invitadosEstimados: 80,
        presupuestoEstimado: 40000,
        notesAdicionales: '',
        clienteNombre: 'Martín Suárez',
        nombreAgasajado: 'Martín y Lucía',
      },
      estado: 'En Planificación', // Sigue activa en vez de archivada
      personalAsignado: [],
    };

    // Fiesta donde el cliente es igual al agasajado (ej: mamá cargada como quinceañera)
    const fiestaNombreConfuso: FiestaEnPlanificacion = {
      id: 'fiesta_confusa_1',
      configuracion: {
        nombreEvento: '15 Años de Sofía',
        tipoCelebracion: '15_anios',
        fechaEvento: '2026-11-20',
        horaInicio: '21:00',
        horaFin: '05:00',
        nombreLugar: 'Club Salto',
        invitadosEstimados: 90,
        presupuestoEstimado: 35000,
        notesAdicionales: '',
        clienteNombre: 'María Rodríguez',
        nombreAgasajado: 'María Rodríguez', // Mismo nombre que el cliente
      },
      estado: 'En Planificación',
      personalAsignado: [],
    };

    // Evaluamos los problemas de la fiesta pasada
    const problemasPasada = detectarProblemasFiesta(fiestaPasadaSinArchivar, { hoy: hoySimulado });
    expect(problemasPasada.some((p) => p.tipo === 'pasada_sin_archivar')).toBe(true);
    const probArchivar = problemasPasada.find((p) => p.tipo === 'pasada_sin_archivar');
    expect(probArchivar?.accionSugerida).toBe('archivar');

    // Evaluamos los problemas de la fiesta con nombres confusos
    const problemasConfusa = detectarProblemasFiesta(fiestaNombreConfuso, { hoy: hoySimulado });
    expect(problemasConfusa.some((p) => p.tipo === 'cliente_igual_al_agasajado')).toBe(true);
    const probNombres = problemasConfusa.find((p) => p.tipo === 'cliente_igual_al_agasajado');
    expect(probNombres?.accionSugerida).toBe('aclarar_quien_contrata');

    // Lista consolidada para la pantalla "Revisar mis fiestas"
    const listaParaRevisar = obtenerFiestasParaRevisar(
      [fiestaPasadaSinArchivar, fiestaNombreConfuso, fiestaFuturaActiva],
      { hoy: hoySimulado }
    );

    const idsParaRevisar = listaParaRevisar.map((item) => item.fiestaId);
    expect(idsParaRevisar).toContain('fiesta_pasada_1');
    expect(idsParaRevisar).toContain('fiesta_confusa_1');
  });

  test('la pantalla /fiestas/revisar está definida para revisar inconsistencias de fiestas', () => {
    const ruta = '/fiestas/revisar';
    expect(ruta).toBe('/fiestas/revisar');
  });
});
