/** @jest-environment node */

const mockData: Record<string, unknown> = {};
const mockReadData = jest.fn(async (file: string, fallback: unknown) => mockData[file] ?? fallback);
const mockWriteData = jest.fn(async () => undefined);

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));
jest.mock('@/lib/alertas/errores-humanos', () => ({ detectarErroresHumanos: jest.fn(() => []) }));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  ...jest.requireActual('@/lib/agentes/motor-agentes'),
  ejecutarAgentesAutonomos: jest.fn(async () => []),
}));
jest.mock('@/lib/presencia-digital/autogenerador-semanal', () => ({ autoGenerarBorradoresSemanales: jest.fn(async () => []) }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn(async () => undefined) }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: jest.fn(async () => ({})),
  getAsistenteSettings: jest.fn(async () => ({ avisosProactivosActivos: false })),
  getHoraUruguay: () => 12,
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(),
  mutarDocumentoConTransaccion: jest.fn(),
}));
jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true })),
  respuestaDeLaTarea: (_puerta: unknown, body: unknown) => body,
}));
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
jest.mock('@/lib/automatico/parte-manana', () => ({ getParteDeLaManana: jest.fn(async () => null) }));
jest.mock('@/lib/asistente/clima-de-las-fiestas', () => ({ detectarAlertasClimaFiestas: jest.fn(async () => []) }));
jest.mock('@/lib/asistente/fechas-comerciales', () => ({ obtenerProximasFechasComerciales: jest.fn(() => []) }));
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: jest.fn(async () => ({ agregadas: [], ignoradas: 0 })),
  guardarResumenMientrasNoEstabas: jest.fn(),
}));
jest.mock('@/lib/asistente/resumen-manana-whatsapp', () => ({ enviarResumenMananaWhatsApp: jest.fn(async () => ({})) }));

import { prepararPropuestaFaltantePersonal } from '@/lib/asistente/propuestas-operativas';
import { anticiparFaltantesDeMozos, contarCuotasVencidasNoCubiertas, ejecutarAnticipador, ejecutarVigilanteFiestas } from '@/lib/agentes/motor-agentes';

describe('Orden 255, bloque 7: faltante de mozos', () => {
  const ahora = new Date('2026-10-29T15:00:00.000Z');
  const fiestaBase: any = {
    id: 'fiesta-150',
    estado: 'En Planificación',
    configuracion: {
      nombreEvento: 'Fiesta de 150',
      fechaEvento: '2026-11-08',
      horaInicio: '20:00',
      horaFin: '01:00',
      invitadosEstimados: 150,
    },
    modulosContratados: { catering: true },
    personalAsignado: [
      { empleadoId: 'mozo-1', rolId: 'rol-mozo' },
      { empleadoId: 'mozo-2', rolId: 'rol-mozo' },
      { empleadoId: 'mozo-3', rolId: 'rol-mozo' },
      { empleadoId: 'cocina-1', rolId: 'rol-mozo-cocina' },
      { empleadoId: 'dj-1', rolId: 'rol-dj' },
      { empleadoId: '', rolId: 'rol-mozo' },
    ],
  };
  const roles = [
    { id: 'rol-mozo-cocina', nombre: 'Mozo de Cocina' },
    { id: 'rol-mozo', nombre: 'Mozo' },
    { id: 'rol-dj', nombre: 'DJ' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockData).forEach((key) => delete mockData[key]);
    mockWriteData.mockClear();
  });

  it('detecta 3 mozos asignados frente a 6 requeridos para 150 invitados y deja propuesta estable', async () => {
    const faltantes = anticiparFaltantesDeMozos([fiestaBase], roles, ahora);
    expect(faltantes).toHaveLength(1);
    expect(faltantes[0]).toMatchObject({ fiestaId: 'fiesta-150', invitados: 150, asignados: 3, requeridos: 6 });

    const propuesta = prepararPropuestaFaltantePersonal(faltantes[0].hallazgo);
    expect(propuesta).toMatchObject({
      clave: 'faltante-mozos:fiesta-150:2026-11-08:3:6',
      fiestaId: 'fiesta-150',
      tipoPropuesta: 'faltante_personal',
      area: 'fiestas',
      quePropone: expect.stringContaining('3 lugares faltantes'),
    });
    expect(propuesta).not.toHaveProperty('monto');
    expect(propuesta).not.toHaveProperty('responsableId');
    expect(prepararPropuestaFaltantePersonal(faltantes[0].hallazgo)?.clave).toBe(propuesta?.clave);
  });

  it('emite la alerta desde anticipador, no duplica en vigilante ni cambia asignaciones', async () => {
    mockData['fiestas.json'] = [fiestaBase];
    mockData['presupuestos.json'] = [];
    mockData['alertas-descartadas.json'] = [];
    mockData['roles.json'] = roles;
    mockData['agentes-historial.json'] = [];
    mockData['agentes-configuracion.json'] = [];

    const antes = JSON.stringify(fiestaBase.personalAsignado);
    const registro = await ejecutarAnticipador(ahora);

    expect(registro.hallazgos.some((hallazgo) => hallazgo.includes('asignados=3;requeridos=6'))).toBe(true);
    expect(registro.estado).toBe('alerta');
    const vigilante = await ejecutarVigilanteFiestas(ahora);
    expect(vigilante.hallazgos.some((hallazgo) => hallazgo.includes('asignados=3;requeridos=6'))).toBe(false);
    expect(JSON.stringify(fiestaBase.personalAsignado)).toBe(antes);
    expect(mockWriteData.mock.calls.map(([file]) => file)).not.toContain('presupuestos.json');
  });

  it('no inventa una regla si catering, invitados, rol o ventana de 14 días no están confirmados', () => {
    const fueraDeVentana = {
      ...fiestaBase,
      configuracion: { ...fiestaBase.configuracion, fechaEvento: '2026-11-13' },
    };
    const sinCatering = { ...fiestaBase, modulosContratados: { catering: false } };
    const sinInvitados = {
      ...fiestaBase,
      configuracion: { ...fiestaBase.configuracion, invitadosEstimados: 0 },
    };
    expect(anticiparFaltantesDeMozos([fueraDeVentana, sinCatering, sinInvitados], roles, ahora)).toEqual([]);
    expect(anticiparFaltantesDeMozos([fiestaBase], [{ id: 'rol-dj', nombre: 'DJ' }], ahora)).toEqual([]);
  });

  it('imputa cobros reconciliados a cuotas cronológicas antes de afirmar atraso', async () => {
    const fiesta: any = {
      id: 'fiesta-cuotas', estado: 'Confirmada', presupuestoId: 'budget-cuotas',
      configuracion: { nombreEvento: 'Boda', fechaEvento: '2026-11-20', horaInicio: '20:00', horaFin: '23:00', invitadosEstimados: 50 },
      planDePagos: { cuotas: [
        { id: 'q1', fechaVencimiento: '2026-10-01', monto: 30, montoPagado: 0, estado: 'vencido' },
        { id: 'q2', fechaVencimiento: '2026-10-10', monto: 30, montoPagado: 0, estado: 'vencido' },
        { id: 'q3', fechaVencimiento: '2026-11-10', monto: 30, montoPagado: 0, estado: 'pendiente' },
      ] }, personalAsignado: [],
    };
    mockData['fiestas.json'] = [fiesta];
    mockData['presupuestos.json'] = [{ id: 'budget-cuotas', invoiceId: 'invoice-cuotas', pagosCliente: [] }];
    mockData['roles.json'] = [];
    mockData['invoices.json'] = [{ id: 'invoice-cuotas', sourcePresupuestoId: 'budget-cuotas', status: 'Paid', invoiceNumber: 'AK-10', totalAmount: 90, payments: [{ id: 'payment-1', paymentDate: '2026-10-28', amount: 60 }] }];

    const registro = await ejecutarAnticipador(ahora);
    expect(registro.hallazgos.some((hallazgo) => hallazgo.includes('[area=cobros]'))).toBe(false);

    mockData['invoices.json'] = [{ id: 'invoice-cuotas', sourcePresupuestoId: 'budget-cuotas', status: 'Paid', invoiceNumber: 'AK-10', totalAmount: 300, payments: [{ id: 'payment-1', paymentDate: '2026-10-28', amount: 200 }] }];
    fiesta.planDePagos.cuotas[0].monto = 100;
    fiesta.planDePagos.cuotas[1].monto = 100;
    fiesta.planDePagos.cuotas[2].monto = 100;
    expect((await ejecutarAnticipador(ahora)).hallazgos.some((hallazgo) => hallazgo.includes('[area=cobros]'))).toBe(false);

    mockData['invoices.json'] = [{ id: 'invoice-cuotas', sourcePresupuestoId: 'budget-cuotas', status: 'Paid', invoiceNumber: 'AK-10', totalAmount: 300, payments: [{ id: 'payment-1', paymentDate: '2026-10-28', amount: 50 }] }];
    expect((await ejecutarAnticipador(ahora)).hallazgos.some((hallazgo) => hallazgo.includes('[area=cobros]'))).toBe(true);
  });

  it('no classifies invalid dates or amounts as overdue', () => {
    expect(contarCuotasVencidasNoCubiertas([
      { fechaVencimiento: '2026-02-30', monto: 100 },
      { fechaVencimiento: '2026-10-01', monto: 100 },
    ], 0, '2026-10-29')).toEqual([]);
  });
});
