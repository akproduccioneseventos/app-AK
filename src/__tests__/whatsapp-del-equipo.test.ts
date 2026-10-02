/**
 * @fileOverview Pruebas para la Orden 105: WhatsApp del equipo con audios y texto.
 */

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

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, cambiar: (l: any[]) => any[] | null) => {
    const nueva = cambiar(JSON.parse(JSON.stringify(memoriaStore[file] ?? [])));
    if (nueva) memoriaStore[file] = JSON.parse(JSON.stringify(nueva));
    return nueva;
  }),
}));

const mockSendMetaWhatsAppMessage = jest.fn(async () => ({ success: true, messageId: 'wa-123' }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: jest.fn(async () => ({ success: true, sentCount: 1, failureCount: 0 })),
}));

import { atenderAlEquipo } from '@/lib/asistente/por-whatsapp';

describe('105 — WhatsApp del equipo', () => {
  beforeEach(() => {
    for (const k of Object.keys(memoriaStore)) {
      delete memoriaStore[k];
    }
    jest.clearAllMocks();

    // Configuración de números autorizados en ajustes
    memoriaStore['asistente-settings.json'] = {
      avisoCelularHabilitado: true,
      whatsappDuenioHabilitado: true,
      numeroDuenio: '59898355530',
      numerosEquipo: [
        { telefono: '59898355530', nombre: 'Alexander Knuth', rol: 'Dueño' },
        { telefono: '59899123456', nombre: 'Lucía', rol: 'Coordinadora' },
      ],
    };
  });

  test('un audio o texto simulado de un número habilitado que dice "anotá llamar al salón mañana" crea la tarea y contesta', async () => {
    const res = await atenderAlEquipo({
      from: '59898355530',
      type: 'audio',
      text: 'anotá llamar al salón mañana',
    });

    expect(res.atendido).toBe(true);
    expect(res.nivel).toBe('solo');
    expect(res.respuestaEnviada).toContain('la anoté en la bandeja');

    // La tarea queda donde la lee una pantalla: la bandeja "Tu asistente". Antes iba a
    // "tareas.json", que no lee nadie.
    const bandeja = memoriaStore['asistente-propuestas.json'] || [];
    expect(bandeja.length).toBe(1);
    expect(bandeja[0].titulo).toContain('llamar al salón mañana');
    expect(bandeja[0].responsableNombre).toBe('Alexander Knuth');
    expect(memoriaStore['tareas.json']).toBeUndefined();
  });

  test('el mismo texto desde un número NO habilitado no crea nada y sigue el camino de hoy', async () => {
    const res = await atenderAlEquipo({
      from: '59891999888', // Número desconocido no autorizado
      text: 'anotá llamar al salón mañana',
    });

    expect(res.atendido).toBe(false);
    expect(res.motivoNoAtendido).toContain('no registrado como parte del equipo');

    // No se creó ninguna tarea
    const tareas = memoriaStore['tareas.json'] || [];
    expect(tareas.length).toBe(0);
  });

  test('"marcá como pagada la cuota de Ana" no marca nada y contesta que eso se hace en la app', async () => {
    const res = await atenderAlEquipo({
      from: '59898355530',
      text: 'marcá como pagada la cuota de Ana',
    });

    expect(res.atendido).toBe(true);
    expect(res.nivel).toBe('nunca');
    expect(res.respuestaEnviada).toContain('Eso lo tenés que hacer vos desde la app');
    expect(res.respuestaEnviada).toContain('/asistente');

    // Comprobar que no se modificó nada de pagos
    expect(memoriaStore['presupuestos.json']).toBeUndefined();
  });

  test('cargar un gasto por mensaje queda como propuesta en la app y responder "sí" no lo confirma', async () => {
    // 1. Pide cargar gasto
    const resGasto = await atenderAlEquipo({
      from: '59899123456', // Lucía
      text: 'cargar gasto de $3500 de nafta para el flete',
    });

    expect(resGasto.atendido).toBe(true);
    expect(resGasto.nivel).toBe('pregunta');
    expect(resGasto.respuestaEnviada).toContain('Te lo dejé preparado como propuesta');

    // Quedó en asistente-propuestas.json
    const props = memoriaStore['asistente-propuestas.json'] || [];
    expect(props.length).toBe(1);
    expect(props[0].estado).toBe('pendiente');

    // 2. Intenta responder "sí" por WhatsApp
    const resConfirmacion = await atenderAlEquipo({
      from: '59899123456',
      text: 'sí, hacelo',
    });

    expect(resConfirmacion.atendido).toBe(true);
    expect(resConfirmacion.respuestaEnviada).toContain('responder "sí" por WhatsApp no confirma la acción');
  });

  test('"cuánto me deben" sólo se lo contesta al dueño, con la cuenta del panel', async () => {
    memoriaStore['presupuestos.json'] = [];
    memoriaStore['invoices.json'] = [];
    const empleado = await atenderAlEquipo({ from: '59899123456', type: 'text', text: 'cuánto me deben' });
    expect(empleado.respuestaEnviada).toContain('sólo el dueño');
    const duenio = await atenderAlEquipo({ from: '59898355530', type: 'text', text: 'cuánto me deben' });
    expect(duenio.respuestaEnviada).toContain('por cobrar');
  });
});
