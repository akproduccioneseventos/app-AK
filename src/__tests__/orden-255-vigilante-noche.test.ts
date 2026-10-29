/** @jest-environment node */

const mockData: Record<string, unknown> = {};
const mockReadData = jest.fn(async (file: string, fallback: unknown) => mockData[file] ?? fallback);
const mockReadDataConDetalle = jest.fn(async () => ({ valor: [], huboFalla: false }));
const mockWriteData = jest.fn(async () => undefined);
const mockEjecutarAgentes = jest.fn(async () => [] as any[]);
const mockAgregarPropuestas = jest.fn(async (nuevas: any[]) => ({
  agregadas: nuevas.map((propuesta, index) => ({ ...propuesta, id: `propuesta-${index}` })),
  ignoradas: 0,
}));
const mockPush = jest.fn(async () => ({ success: true, sentCount: 1, failureCount: 0 }));
const mockAvisarDuenio = jest.fn(async () => ({ pushEnviado: false, whatsAppEnviado: false }));
const mockGetReglaParaTarea = jest.fn(async () => 'sola' as 'sola' | 'preguntar' | 'apagada');
const mockGetParteDeLaManana = jest.fn(async () => null as any);
const mockEnviarWhatsApp = jest.fn(async () => ({ success: true, messageId: 'wamid-test' }));
let mockHoraUruguay = 2;
let mockSettings: Record<string, unknown> = { avisosProactivosActivos: true };
let mockTracking: Record<string, { fecha: string; count: number }> = {};

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => mockReadData(...args),
  readDataConDetalle: (...args: any[]) => mockReadDataConDetalle(...args),
  writeData: (...args: any[]) => mockWriteData(...args),
}));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  ...jest.requireActual('@/lib/agentes/motor-agentes'),
  ejecutarAgentesAutonomos: (...args: any[]) => mockEjecutarAgentes(...args),
}));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: (...args: any[]) => mockPush(...args) }));
jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  avisarAlDuenio: (...args: any[]) => mockAvisarDuenio(...args),
  getHoraUruguay: () => mockHoraUruguay,
  getAsistenteSettings: jest.fn(async () => ({ ...mockSettings })),
}));
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _fallback: unknown, update: (value: any) => any) => {
    const next = update(mockTracking);
    if (next !== null) mockTracking = next;
    return next;
  }),
  mutateGenericJsonArray: jest.fn(),
}));
jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true })),
  respuestaDeLaTarea: (_puerta: unknown, body: unknown) => body,
}));
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
jest.mock('@/lib/alertas/errores-humanos', () => ({ detectarErroresHumanos: jest.fn(() => []) }));
jest.mock('@/lib/asistente/clima-de-las-fiestas', () => ({ detectarAlertasClimaFiestas: jest.fn(async () => []) }));
jest.mock('@/lib/asistente/fechas-comerciales', () => ({ obtenerProximasFechasComerciales: jest.fn(() => []) }));
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...args: any[]) => mockAgregarPropuestas(...args),
  guardarResumenMientrasNoEstabas: jest.fn(),
}));
jest.mock('@/lib/presencia-digital/autogenerador-semanal', () => ({ autoGenerarBorradoresSemanales: jest.fn(async () => []) }));
jest.mock('@/lib/automatico/parte-manana', () => ({ getParteDeLaManana: (...args: any[]) => mockGetParteDeLaManana(...args) }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  ...jest.requireActual('@/lib/ia/reglas-de-la-ia'),
  getReglaParaTarea: (...args: any[]) => mockGetReglaParaTarea(...args),
}));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: (...args: any[]) => mockEnviarWhatsApp(...args) }));

import { GET as cronAsistenteProactivo, prepararPropuestaOperativaNoche } from '@/app/api/cron/asistente-proactivo/route';
import { calcularTragosDisponibles, ejecutarVigilanteNoche } from '@/lib/agentes/motor-agentes';

describe('Orden 255, bloque 8: vigilante nocturno', () => {
  const ahora = new Date('2026-10-29T03:00:00.000Z'); // medianoche en Uruguay

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(ahora);
    mockHoraUruguay = 2;
    mockSettings = { avisosProactivosActivos: true };
    Object.keys(mockData).forEach((key) => delete mockData[key]);
    mockTracking = {};
    mockEjecutarAgentes.mockResolvedValue([]);
    mockGetReglaParaTarea.mockResolvedValue('sola');
    mockGetParteDeLaManana.mockResolvedValue(null);
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;
    mockAgregarPropuestas.mockImplementation(async (nuevas: any[]) => ({
      agregadas: nuevas.map((propuesta, index) => ({ ...propuesta, id: `propuesta-${index}` })),
      ignoradas: 0,
    }));
    mockReadDataConDetalle.mockResolvedValue({ valor: [], huboFalla: false });
  });

  afterEach(() => jest.useRealTimers());

  it('vigila solo fiestas vigentes dentro de horario y agrega alertas de programa, personal y barra', async () => {
    mockData['fiestas.json'] = [{
      id: 'fiesta-actual',
      estado: 'aceptada',
      configuracion: { nombreEvento: 'Fiesta actual', fechaEvento: '2026-10-28', horaInicio: '22:00', horaFin: '01:00' },
      personalAsignado: [{ empleadoId: 'e1', rolId: 'r1' }, { empleadoId: 'e2', rolId: 'r2', checkInTimestamp: '2026-10-28T23:00:00-03:00' }],
      programa: [
        { id: 'p1', hora: '23:40', titulo: 'Brindis', completado: false },
        { id: 'p2', hora: '23:39', titulo: 'Vals', completado: false },
        { id: 'p3', hora: '22:00', titulo: 'Recepción', completado: true },
      ],
      cartaTragos: { items: [
        { id: 'bajo', nombre: 'Cóctel bajo', recetaIngredientes: [{ insumoId: 'jugo', cantidad: 0.5, unidad: 'Litro' }] },
        { id: 'sin-stock', nombre: 'Receta incompleta', recetaIngredientes: [{ insumoId: 'desconocido', cantidad: 1, unidad: 'Unidad' }] },
        { id: 'sin-unidad', nombre: 'Unidad incierta', recetaIngredientes: [{ insumoId: 'jugo', cantidad: 1, unidad: 'Cc' }] },
      ] },
    }, {
      id: 'demo_futura',
      estado: 'aceptada',
      configuracion: { fechaEvento: '2026-10-28', horaInicio: '22:00', horaFin: '01:00' },
      personalAsignado: [],
    }];
    mockData['insumos.json'] = [{ id: 'jugo', nombre: 'Jugo', cantidadDisponible: 4, unidad: 'Litro' }];

    const registro = await ejecutarVigilanteNoche(ahora);

    expect(registro.estado).toBe('alerta');
    expect(registro.hallazgos).toHaveLength(3);
    expect(registro.hallazgos[0]).toMatch(/fiesta=fiesta-actual;tema=programa;hora=2026-10-29-00/);
    expect(registro.hallazgos[0]).toMatch(/2 momento\(s\)/);
    expect(registro.hallazgos[1]).toMatch(/tema=personal/);
    expect(registro.hallazgos[2]).toMatch(/tema=barra/);
    expect(registro.hallazgos.join(' ')).not.toMatch(/demo_futura|Receta incompleta|Unidad incierta|Recepción/);
    expect(registro.accionesPreparadas.join(' ')).not.toMatch(/comprar|enviar.*cliente|invitado/i);
  });

  it('aplica el umbral de 20 minutos y solo calcula rendimiento con receta y stock completos en la misma unidad', async () => {
    mockData['fiestas.json'] = [{
      id: 'umbral',
      configuracion: { fechaEvento: '2026-10-28', horaInicio: '23:45', horaFin: '01:00' },
      personalAsignado: [{ empleadoId: 'e1', rolId: 'r1' }],
      programa: [{ id: 'p1', hora: '23:45', titulo: 'Vals', completado: false }],
    }];
    mockData['insumos.json'] = [];

    const antesDelUmbral = await ejecutarVigilanteNoche(new Date('2026-10-29T03:04:59.000Z'));
    expect(antesDelUmbral.hallazgos).toHaveLength(0);
    const pasadoElUmbral = await ejecutarVigilanteNoche(new Date('2026-10-29T03:05:00.000Z'));
    expect(pasadoElUmbral.hallazgos).toHaveLength(2);

    expect(calcularTragosDisponibles(
      { recetaIngredientes: [{ insumoId: 'jugo', cantidad: 0.5, unidad: 'Litro' }] },
      [{ id: 'jugo', cantidadDisponible: 4, unidad: 'Litro' }],
    )).toBe(8);
    expect(calcularTragosDisponibles(
      { recetaIngredientes: [{ insumoId: 'jugo', cantidad: 0.5, unidad: 'Cc' }] },
      [{ id: 'jugo', cantidadDisponible: 4, unidad: 'Litro' }],
    )).toBeNull();
    expect(calcularTragosDisponibles(
      { recetaIngredientes: [{ insumoId: 'jugo', cantidad: 0.5, unidad: 'Litro' }] },
      [{ id: 'jugo', cantidadDisponible: undefined, unidad: 'Litro' }],
    )).toBeNull();
  });

  it('convierte la alerta en propuesta crítica con fiestaId y dedup por tema/hora, sin asignar responsable a ciegas', () => {
    const hallazgo = '[ALERTA NOCHE][fiesta=fiesta%3A123;tema=personal;hora=2026-10-29-00] Falta llegada.';
    const propuesta = prepararPropuestaOperativaNoche(hallazgo, 'Revisar llegada.');

    expect(propuesta).toMatchObject({
      clave: 'agente:vigilante_noche:fiesta:123:personal:2026-10-29-00',
      fiestaId: 'fiesta:123',
      tipoPropuesta: 'vigilante_noche',
      area: 'fiestas',
      esImportante: true,
    });
    expect(propuesta).not.toHaveProperty('responsableId');
    expect(propuesta).not.toHaveProperty('responsableNombre');
    expect(prepararPropuestaOperativaNoche(hallazgo, 'Revisar llegada.')?.clave)
      .toBe(propuesta?.clave);
    expect(prepararPropuestaOperativaNoche('[ALERTA NOCHE][fiesta=%E0%A4%A;tema=personal;hora=h]', 'x')).toBeNull();
  });

  it('en descanso deja la alerta en la app y no manda push ni WhatsApp', async () => {
    mockEjecutarAgentes.mockResolvedValue([{
      agenteId: 'vigilante_noche',
      agenteNombre: 'Operador de la Noche',
      hallazgos: ['[ALERTA NOCHE][fiesta=fiesta-77;tema=programa;hora=2026-10-29-02] Brindis atrasado.'],
      accionesPreparadas: ['Revisar el programa.'],
    }]);

    await cronAsistenteProactivo(new Request('http://localhost/api/cron/asistente-proactivo'));

    const propuestas = mockAgregarPropuestas.mock.calls[0][0];
    expect(propuestas).toHaveLength(1);
    expect(propuestas[0]).toMatchObject({ fiestaId: 'fiesta-77', esImportante: true, tipoPropuesta: 'vigilante_noche' });
    expect(propuestas[0].clave).toBe('agente:vigilante_noche:fiesta-77:programa:2026-10-29-02');
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockAvisarDuenio).not.toHaveBeenCalled();
    expect(mockTracking).toEqual({});
  });

  it('fuera del descanso solo usa WhatsApp del dueño cuando está habilitado y el push general está apagado', async () => {
    mockHoraUruguay = 12;
    mockSettings = {
      avisosProactivosActivos: true,
      whatsappDuenioHabilitado: true,
      avisoCelularHabilitado: false,
    };
    mockEjecutarAgentes.mockResolvedValue([{
      agenteId: 'vigilante_noche',
      agenteNombre: 'Operador de la Noche',
      hallazgos: ['[ALERTA NOCHE][fiesta=fiesta-77;tema=programa;hora=2026-10-29-12] Brindis atrasado.'],
      accionesPreparadas: ['Revisar el programa.'],
    }]);

    await cronAsistenteProactivo(new Request('http://localhost/api/cron/asistente-proactivo'));

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockAvisarDuenio).toHaveBeenCalledTimes(1);
    expect(mockAvisarDuenio.mock.calls[0][0][0]).toMatchObject({ fiestaId: 'fiesta-77', tipoPropuesta: 'vigilante_noche' });
  });

  it('apagada no lee el parte ni crea tarjeta o envía WhatsApp aunque haya pendientes', async () => {
    mockHoraUruguay = 8;
    jest.setSystemTime(new Date('2026-10-29T11:30:00.000Z'));
    mockGetReglaParaTarea.mockResolvedValue('apagada');
    mockGetParteDeLaManana.mockResolvedValue({
      fecha: '2026-10-29', textoResumen: 'Resumen de prueba', totalPendientes: 3,
      itemsPrincipales: [{ id: 'fiesta-1', tipo: 'fiesta_proxima', titulo: 'Preparar la fiesta' }],
    });
    mockSettings = { avisosProactivosActivos: true, whatsappDuenioHabilitado: true, numeroDuenio: '59812345678' };
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';

    await cronAsistenteProactivo(new Request('http://localhost/api/cron/asistente-proactivo'));

    expect(mockGetReglaParaTarea).toHaveBeenCalledWith('resumen_de_la_manana');
    expect(mockGetParteDeLaManana).not.toHaveBeenCalled();
    expect(mockEnviarWhatsApp).not.toHaveBeenCalled();
    const propuestasMatutinas = mockAgregarPropuestas.mock.calls
      .flatMap(([nuevas]) => nuevas)
      .filter((propuesta: any) => propuesta.tipoPropuesta === 'parte_manana');
    expect(propuestasMatutinas).toHaveLength(0);
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockTracking).toEqual({});
  });

  it('preguntar permite la tarjeta interna del parte, pero no lo envía por WhatsApp', async () => {
    mockHoraUruguay = 8;
    jest.setSystemTime(new Date('2026-10-29T11:30:00.000Z'));
    mockGetReglaParaTarea.mockResolvedValue('preguntar');
    mockGetParteDeLaManana.mockResolvedValue({
      fecha: '2026-10-29', textoResumen: 'Resumen de prueba', totalPendientes: 3,
      itemsPrincipales: [{ id: 'fiesta-1', tipo: 'fiesta_proxima', titulo: 'Preparar la fiesta' }],
    });
    mockSettings = { avisosProactivosActivos: true, whatsappDuenioHabilitado: true, numeroDuenio: '59812345678' };
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';

    const response = await cronAsistenteProactivo(new Request('http://localhost/api/cron/asistente-proactivo'));
    const body = await response.json();

    expect(mockGetParteDeLaManana).toHaveBeenCalledTimes(1);
    expect(mockEnviarWhatsApp).not.toHaveBeenCalled();
    expect(mockAgregarPropuestas).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ tipoPropuesta: 'parte_manana' }),
    ]));
    expect(body.fallos.join('\n')).toMatch(/requiere aprobación.*quedó sin enviar/i);
  });

  it('sola permite el resumen solo al número de WhatsApp configurado del dueño', async () => {
    mockHoraUruguay = 8;
    jest.setSystemTime(new Date('2026-10-29T11:30:00.000Z'));
    mockGetReglaParaTarea.mockResolvedValue('sola');
    mockGetParteDeLaManana.mockResolvedValue({
      fecha: '2026-10-29', textoResumen: 'Resumen de prueba', totalPendientes: 0,
      itemsPrincipales: [{ id: 'fiesta-1', tipo: 'fiesta_proxima', titulo: 'Preparar la fiesta' }],
    });
    mockSettings = { avisosProactivosActivos: true, whatsappDuenioHabilitado: true, numeroDuenio: '59812345678' };
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';

    await cronAsistenteProactivo(new Request('http://localhost/api/cron/asistente-proactivo'));

    expect(mockGetReglaParaTarea).toHaveBeenCalledWith('resumen_de_la_manana');
    expect(mockEnviarWhatsApp).toHaveBeenCalledTimes(1);
    expect(mockEnviarWhatsApp.mock.calls[0][0]).toMatchObject({ to: '59812345678' });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
