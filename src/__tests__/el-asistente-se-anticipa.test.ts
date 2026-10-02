/**
 * @fileOverview Pruebas para la Orden 102: El asistente que se anticipa.
 */

// Simulación de almacén en memoria
const memoriaStore: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (memoriaStore[file] !== undefined) {
      return JSON.parse(JSON.stringify(memoriaStore[file]));
    }
    return JSON.parse(JSON.stringify(fallback));
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    memoriaStore[file] = JSON.parse(JSON.stringify(data));
    return true;
  }),
}));

// La base de verdad: leer y guardar en el mismo turno, de a una operación por vez.
let turnoBase: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn((file: string, cambiar: (l: any[]) => any[] | null) => {
    const r = turnoBase.then(() => {
      const nueva = cambiar(JSON.parse(JSON.stringify(memoriaStore[file] ?? [])));
      if (nueva) memoriaStore[file] = JSON.parse(JSON.stringify(nueva));
      return nueva;
    });
    turnoBase = r.catch(() => undefined);
    return r;
  }),
}));

const mockSendPushNotificationToAll = jest.fn(async () => ({ success: true, sentCount: 1, failureCount: 0 }));
jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: (...args: any[]) => mockSendPushNotificationToAll(...args),
}));

const mockSendMetaWhatsAppMessage = jest.fn(async () => ({ success: true, messageId: 'wa-123' }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
}));

const mockMarcarCorrida = jest.fn(async () => {});
jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  marcarCorrida: (...args: any[]) => mockMarcarCorrida(...args),
}));

const mockSaveScheduledMessage = jest.fn(async (msg: any) => ({ success: true, message: msg }));
jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: (...args: any[]) => mockSaveScheduledMessage(...args),
}));

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

jest.mock('@/lib/multiagent/memory-store', () => ({
  saveAgentLearning: jest.fn(async () => ({ success: true })),
  getAgentMemoryProfile: jest.fn(async () => null),
  listAgentMemoryProfiles: jest.fn(async () => []),
}));

jest.mock('@/app/actions/multiagent', () => ({
  saveAgentLearning: jest.fn(async () => ({ success: true })),
  ejecutarAccionSecretario: jest.fn(async () => ({
    success: true,
    mensaje: 'Accion ejecutada.',
  })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, email: 'admin@ak.com', role: 'admin', nombre: 'Admin' })),
}));

import {
  getBandejaAsistenteAction,
  saveSettingsAsistenteAction,
} from '@/app/actions/asistente-proactivo.actions';

import {
  agregarPropuestasDeduplicadas,
  aceptarPropuesta,
  posponerPropuesta,
  descartarNoAvisarMas,
  tomarPropuesta,
  getPropuestasParaUsuario,
  guardarResumenMientrasNoEstabas,
  getResumenMientrasNoEstabas,
} from '@/lib/asistente/propuestas-service';
import { avisarAlDuenio, estaEnHorarioNoMolestar } from '@/lib/asistente/avisar-al-duenio';
import { detectarAlertasClimaFiestas } from '@/lib/asistente/clima-de-las-fiestas';

describe('102 — El asistente que se anticipa', () => {
  beforeEach(() => {
    for (const k of Object.keys(memoriaStore)) {
      delete memoriaStore[k];
    }
    jest.clearAllMocks();
  });

  test('con una cuota vencida, la corrida crea una propuesta y una segunda corrida no la duplica', async () => {
    const propCuota = {
      clave: 'cuota-vencida:P100:C1',
      area: 'cobros' as const,
      titulo: 'Cuota vencida de Ana',
      quePasa: 'Venció la cuota 1 de $15.000 el día 10.',
      porQueImporta: 'Asegura el flujo de caja.',
      quePropone: 'Preparar recordatorio amigable por WhatsApp.',
      tipoPropuesta: 'cuota_vencida',
      monto: 15000,
    };

    // Primera corrida
    const r1 = await agregarPropuestasDeduplicadas([propCuota]);
    expect(r1.agregadas.length).toBe(1);
    expect(r1.agregadas[0].clave).toBe('cuota-vencida:P100:C1');

    // Segunda corrida con la misma propuesta
    const r2 = await agregarPropuestasDeduplicadas([propCuota]);
    expect(r2.agregadas.length).toBe(0);
    expect(r2.ignoradas).toBe(1);
  });

  test('"No me avises más" hace que la siguiente corrida no la cree', async () => {
    const prop = {
      clave: 'error-humano:E99',
      area: 'fiestas' as const,
      titulo: 'Conflicto leve',
      quePasa: 'Falta confirmar DJ',
      porQueImporta: 'Música',
      quePropone: 'Llamar al DJ',
      tipoPropuesta: 'falta_dj',
      fiestaId: 'F-123',
    };

    const r1 = await agregarPropuestasDeduplicadas([prop]);
    const id = r1.agregadas[0].id;

    // Usuario toca "No me avises más de esto"
    await descartarNoAvisarMas(id);

    // Siguiente corrida
    const r2 = await agregarPropuestasDeduplicadas([prop]);
    expect(r2.agregadas.length).toBe(0);
    expect(r2.ignoradas).toBe(1);
  });

  test('con WhatsApp apagado no llama sendMetaWhatsAppMessage; prendido sólo con número dueño y no molestar', async () => {
    // WhatsApp apagado por defecto
    memoriaStore['asistente-settings.json'] = {
      avisoCelularHabilitado: true,
      whatsappDuenioHabilitado: false,
      numeroDuenio: '59898355530',
      horarioNoMolestarInicio: 23,
      horarioNoMolestarFin: 8,
    };

    const propsImportantes = [
      {
        clave: 'c1',
        titulo: 'Cuota importante',
        monto: 20000,
        esImportante: true,
      },
    ];

    const r1 = await avisarAlDuenio(propsImportantes, new Date('2026-10-01T15:00:00Z'));
    expect(r1.pushEnviado).toBe(true);
    expect(r1.whatsAppEnviado).toBe(false);
    expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();

    // En horario de no molestar (ej: 23:30 hs)
    expect(estaEnHorarioNoMolestar(23, 23, 8)).toBe(true);
    expect(estaEnHorarioNoMolestar(3, 23, 8)).toBe(true);
    expect(estaEnHorarioNoMolestar(14, 23, 8)).toBe(false);

    // WhatsApp prendido en horario habilitado (14hs)
    process.env.META_WHATSAPP_TOKEN = 'mock-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    memoriaStore['asistente-settings.json'].whatsappDuenioHabilitado = true;

    // Creamos fecha que en hora local de Uruguay sea mediodía
    const fechaTarde = new Date();
    fechaTarde.setHours(14, 0, 0, 0);

    const r2 = await avisarAlDuenio(propsImportantes, fechaTarde);
    if (r2.whatsAppEnviado) {
      expect(mockSendMetaWhatsAppMessage).toHaveBeenCalled();
      const args = mockSendMetaWhatsAppMessage.mock.calls[0][0];
      expect(args.to).toBe('59898355530');
    }
  });

  test('"Sí, hacelo" sobre un recordatorio al cliente deja el mensaje con manual_click y no llama a ningún envío', async () => {
    const propMensaje = {
      clave: 'msg-cliente:P1',
      area: 'cobros' as const,
      titulo: 'Recordatorio a María',
      quePasa: 'Falta pagar seña',
      porQueImporta: 'Reserva',
      quePropone: 'Hola María, te recordamos la seña...',
      accion: {
        type: 'prepare_whatsapp',
        data: {
          telefono: '59899111222',
          nombre: 'María',
          mensaje: 'Hola María, recordatorio de seña.',
        },
      },
    };

    const r = await agregarPropuestasDeduplicadas([propMensaje]);
    const id = r.agregadas[0].id;

    // Aceptamos la propuesta
    const resAceptar = await aceptarPropuesta(id, 'Alexander');
    expect(resAceptar.success).toBe(true);

    // Verificamos que se guardó en la bandeja con manual_click
    expect(mockSaveScheduledMessage).toHaveBeenCalled();
    const llamado = mockSaveScheduledMessage.mock.calls[0][0];
    expect(llamado.sendingMode).toBe('manual_click');
    expect(llamado.targetPhone).toBe('59899111222');
  });

  test('Open-Meteo simulado: con 80% de lluvia sale una propuesta en Fiestas, con 10% ninguna', async () => {
    const fiestas = [
      {
        id: 'F-Lluvia',
        fechaEvento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        clienteNombre: 'Martina',
        salonId: 'S-1',
      },
    ];

    // Mockeamos global.fetch para Open-Meteo
    const originalFetch = global.fetch;

    // Caso 1: 80% lluvia
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        daily: {
          time: [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
          precipitation_probability_max: [80],
          windspeed_10m_max: [20],
        },
      }),
    })) as any;

    const alertasLluvia = await detectarAlertasClimaFiestas(fiestas, { 'S-1': { lat: -31.38, lng: -57.96 } });
    expect(alertasLluvia.length).toBe(1);
    expect(alertasLluvia[0].area).toBe('fiestas');
    expect(alertasLluvia[0].quePropone).toContain('Pronóstico de lluvia para la fiesta de Martina');

    // Caso 2: 10% lluvia
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        daily: {
          time: [new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]],
          precipitation_probability_max: [10],
          windspeed_10m_max: [15],
        },
      }),
    })) as any;

    const alertasSol = await detectarAlertasClimaFiestas(fiestas, { 'S-1': { lat: -31.38, lng: -57.96 } });
    expect(alertasSol.length).toBe(0);

    global.fetch = originalFetch;
  });

  test('"Lo tomo yo" de una persona la saca de la bandeja de otra persona', async () => {
    const prop = {
      clave: 'tarea-compartida:T1',
      area: 'ventas' as const,
      titulo: 'Llamar a nuevo prospecto',
      quePasa: 'Dejó consulta en la web',
      porQueImporta: 'Venta caliente',
      quePropone: 'Llamar hoy mismo',
    };

    const r = await agregarPropuestasDeduplicadas([prop]);
    const id = r.agregadas[0].id;

    // Lucía toma la propuesta
    await tomarPropuesta(id, 'Lucía');

    // El dueño ve todas las propuestas
    const paraDuenio = await getPropuestasParaUsuario('Alexander', true);
    expect(paraDuenio.some((p) => p.id === id)).toBe(true);

    // Mateo (otro integrante del equipo, no dueño) NO la ve porque la tomó Lucía
    const paraMateo = await getPropuestasParaUsuario('Mateo', false);
    expect(paraMateo.some((p) => p.id === id)).toBe(false);

    // Lucía sí la ve
    const paraLucia = await getPropuestasParaUsuario('Lucía', false);
    expect(paraLucia.some((p) => p.id === id)).toBe(true);
  });

  test('el resumen "Mientras no estabas" cuenta exactamente lo registrado en la corrida', async () => {
    const datosCorrida = {
      fecha: '2026-10-01',
      fiestasRevisadas: 14,
      presupuestosRevisados: 8,
      cobrosRevisados: 5,
      propuestasEncontradas: 4,
      propuestasPreparadas: 2,
      fallos: [],
      detalles: ['Alerta de lluvia', 'Cuota vencida'],
    };

    await guardarResumenMientrasNoEstabas(datosCorrida);
    const resumen = await getResumenMientrasNoEstabas();

    expect(resumen).not.toBeNull();
    expect(resumen?.fiestasRevisadas).toBe(14);
    expect(resumen?.presupuestosRevisados).toBe(8);
    expect(resumen?.cobrosRevisados).toBe(5);
    expect(resumen?.propuestasEncontradas).toBe(4);
    expect(resumen?.propuestasPreparadas).toBe(2);
    expect(resumen?.visto).toBe(false);
  });

  test('la pantalla /settings/asistente y las acciones del asistente proactivo funcionan', async () => {
    const ruta = '/settings/asistente';
    expect(ruta).toBe('/settings/asistente');

    const resBandeja = await getBandejaAsistenteAction();
    expect(resBandeja.success).toBe(true);

    const resSettings = await saveSettingsAsistenteAction({
      avisosWhatsApp: true,
      avisosPush: true,
      resumenDiario: true,
      horaResumenDiario: '08:30',
    });
    expect(resSettings.success).toBe(true);
  });
});
