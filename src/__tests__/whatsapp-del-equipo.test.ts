/**
 * @fileOverview Pruebas para la Orden 105: WhatsApp del equipo con audios y texto.
 */

const memoriaStore: Record<string, any> = {};
const transaccionalStore: Record<string, any> = {};

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
  readDataConDetalle: jest.fn(async (file: string, fallback: any) => ({
    valor: JSON.parse(JSON.stringify(memoriaStore[file] ?? fallback)),
    huboFalla: false,
  })),
  createDataItem: jest.fn(async (file: string, _collection: string, _id: string, item: any) => {
    memoriaStore[file] = [...(memoriaStore[file] || []), JSON.parse(JSON.stringify(item))];
  }),
  deleteDataItem: jest.fn(async (file: string, _collection: string, id: string) => {
    const before = memoriaStore[file] || [];
    memoriaStore[file] = before.filter((item: any) => item.id !== id);
    return memoriaStore[file].length < before.length;
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, cambiar: (l: any[]) => any[] | null) => {
    const nueva = cambiar(JSON.parse(JSON.stringify(memoriaStore[file] ?? [])));
    if (nueva) memoriaStore[file] = JSON.parse(JSON.stringify(nueva));
    return nueva;
  }),
  mutarDocumentoConTransaccion: jest.fn(async (path: string, vacio: unknown, cambiar: (actual: any) => any) => {
    const siguiente = await cambiar(transaccionalStore[path] ?? vacio);
    if (siguiente !== null) transaccionalStore[path] = siguiente;
    return siguiente;
  }),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));

const mockSendMetaWhatsAppMessage = jest.fn(async () => ({ success: true, messageId: 'wa-123' }));
const mockSendMetaWhatsAppAudioMessage = jest.fn(async () => ({ success: true, messageId: 'wa-audio-123' }));
const mockEnviarRespuestaConVozWhatsApp = jest.fn(async () => ({
  audioEnviado: false,
  fallbackReason: 'voz no disponible',
  puedeEnviarTextoFallback: true,
}));
const mockDescargarMediaWhatsApp = jest.fn(async () => ({ mimeType: 'audio/webm', base64: 'YXVkaW8=' }));
const mockTranscribirAudioWhatsApp = jest.fn(async () => 'anotá llamar al salón mañana');
const mockClasificarImagenWhatsApp = jest.fn(async () => ({
  tipo: 'comprobante', descripcion: 'Ticket de compra', proveedor: 'Proveedor de prueba', fecha: '2026-10-29',
  monto: 1234, categoria: 'Insumos', confianza: 'alta', detalle: 'Ticket legible',
}));
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
  sendMetaWhatsAppAudioMessage: (...args: any[]) => mockSendMetaWhatsAppAudioMessage(...args),
}));
jest.mock('@/lib/asistente/whatsapp-voz', () => ({
  enviarRespuestaConVozWhatsApp: (...args: any[]) => mockEnviarRespuestaConVozWhatsApp(...args),
}));
jest.mock('@/lib/asistente/whatsapp-media', () => ({
  descargarMediaWhatsApp: (...args: any[]) => mockDescargarMediaWhatsApp(...args),
  transcribirAudioWhatsApp: (...args: any[]) => mockTranscribirAudioWhatsApp(...args),
  clasificarImagenWhatsApp: (...args: any[]) => mockClasificarImagenWhatsApp(...args),
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
    for (const k of Object.keys(transaccionalStore)) delete transaccionalStore[k];
    jest.clearAllMocks();
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;

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

  test('un audio de Meta se descarga, se transcribe y la transcripción del equipo crea la tarea', async () => {
    const res = await atenderAlEquipo({
      from: '59898355530',
      type: 'audio',
      mediaId: 'media-1',
      messageId: 'wamid-1',
    });

    expect(res.atendido).toBe(true);
    expect(res.nivel).toBe('solo');
    expect(res.respuestaEnviada).toContain('la anoté en la bandeja');
    expect(mockDescargarMediaWhatsApp).toHaveBeenCalledWith('media-1', 'audio');
    expect(mockTranscribirAudioWhatsApp).toHaveBeenCalledWith({ mimeType: 'audio/webm', base64: 'YXVkaW8=' });

    // La tarea queda donde la lee una pantalla: la bandeja "Tu asistente". Antes iba a
    // "tareas.json", que no lee nadie.
    const bandeja = memoriaStore['asistente-propuestas.json'] || [];
    expect(bandeja.length).toBe(1);
    expect(bandeja[0].titulo).toContain('llamar al salón mañana');
    expect(bandeja[0].responsableNombre).toBe('Alexander Knuth');
    expect(memoriaStore['tareas.json']).toBeUndefined();
  });

  test('audio e imagen desde números NO habilitados no descargan ni procesan medios', async () => {
    const audio = await atenderAlEquipo({
      from: '59891999888', // Número desconocido no autorizado
      type: 'audio',
      mediaId: 'media-no-autorizado',
      messageId: 'wamid-no-autorizado',
    });
    const imagen = await atenderAlEquipo({
      from: '59891999888',
      type: 'image',
      mediaId: 'imagen-no-autorizada',
      messageId: 'wamid-imagen-no-autorizada',
    });

    expect(audio.atendido).toBe(false);
    expect(imagen.atendido).toBe(false);
    expect(audio.motivoNoAtendido).toContain('no registrado como parte del equipo');

    // No se creó ninguna tarea
    const tareas = memoriaStore['tareas.json'] || [];
    expect(tareas.length).toBe(0);
    expect(mockDescargarMediaWhatsApp).not.toHaveBeenCalled();
    expect(mockTranscribirAudioWhatsApp).not.toHaveBeenCalled();
    expect(mockClasificarImagenWhatsApp).not.toHaveBeenCalled();
  });

  test('un comprobante leído queda pendiente y no registra un gasto', async () => {
    mockDescargarMediaWhatsApp.mockResolvedValueOnce({ mimeType: 'image/jpeg', base64: 'YXVkaW8=' } as any);

    const res = await atenderAlEquipo({
      from: '59898355530', type: 'image', mediaId: 'receipt-media-1', messageId: 'wamid-receipt-1',
    });

    expect(res.accionIdentificada).toBe('proponer_gasto');
    expect(mockClasificarImagenWhatsApp).toHaveBeenCalledTimes(1);
    expect(memoriaStore['asistente-propuestas.json']).toHaveLength(1);
    expect(memoriaStore['asistente-propuestas.json'][0]).toMatchObject({ estado: 'pendiente', monto: 1234, tipoPropuesta: 'gasto_boleta' });
    expect(memoriaStore['gastos.json']).toBeUndefined();
    expect(memoriaStore['pagos.json']).toBeUndefined();
  });

  test('el plan de reunión tiene tres pasos, deduplica por messageId y no escribe a clientes', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-29T12:00:00Z'));
    try {
    memoriaStore['fiestas.json'] = [{
      id: 'boda-sabado', estado: 'Confirmada', presupuestoId: 'pres-boda', reuniones: [],
      configuracion: { nombreEvento: 'Boda de prueba', tipoCelebracion: 'Boda', fechaEvento: '2026-10-31', horaInicio: '20:00', horaFin: '23:00' },
    }];
    memoriaStore['presupuestos.json'] = [{ id: 'pres-boda', estado: 'Enviado', clienteNombre: 'Cliente de prueba', clienteContacto: '099123456' }];
    memoriaStore['crm-appointments.json'] = [];
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    const pedido = { from: '59898355530', text: 'Organizá la reunión con los novios del sábado', messageId: 'wamid-reunion-1' };
    await atenderAlEquipo(pedido);
    await atenderAlEquipo(pedido);

    const propuestas = memoriaStore['asistente-propuestas.json'];
    expect(propuestas).toHaveLength(1);
    expect(propuestas[0].quePropone.split('\n')).toHaveLength(3);
    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(2);
    expect(mockSendMetaWhatsAppMessage.mock.calls.every(([args]) => args.to === '59898355530')).toBe(true);
    } finally { jest.useRealTimers(); }
  });

  test('la respuesta por voz confirma audio, usa texto al agotar cuota y no duplica si Meta no confirma', async () => {
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    memoriaStore['asistente-settings.json'].responderConVoz = true;
    memoriaStore['asistente-settings.json'].vozGeminiActiva = false;

    const sinInterruptorGemini = await atenderAlEquipo({ from: '59898355530', type: 'audio', mediaId: 'audio-1', messageId: 'wamid-audio-1' });
    expect(sinInterruptorGemini.audioEnviado).toBe(false);
    expect(mockEnviarRespuestaConVozWhatsApp).not.toHaveBeenCalled();
    expect(mockSendMetaWhatsAppAudioMessage).not.toHaveBeenCalled();
    mockSendMetaWhatsAppMessage.mockClear();

    memoriaStore['asistente-settings.json'].vozGeminiActiva = true;
    mockEnviarRespuestaConVozWhatsApp.mockResolvedValueOnce({
      audioEnviado: true,
      messageId: 'wamid-audio-out-1',
      puedeEnviarTextoFallback: false,
    });
    const conAmbosInterruptores = await atenderAlEquipo({ from: '59898355530', type: 'audio', mediaId: 'audio-2', messageId: 'wamid-audio-2' });
    expect(conAmbosInterruptores.audioEnviado).toBe(true);
    expect(mockEnviarRespuestaConVozWhatsApp).toHaveBeenCalledWith(expect.objectContaining({
      to: '59898355530', authorized: true,
      settings: expect.objectContaining({ responderConVoz: true, vozGeminiActiva: true }),
    }));
    expect(mockSendMetaWhatsAppAudioMessage).not.toHaveBeenCalled();
    expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();

    mockEnviarRespuestaConVozWhatsApp.mockResolvedValueOnce({
      audioEnviado: false,
      fallbackReason: 'Se alcanzó el límite compartido de 100 voces de Gemini de hoy.',
      puedeEnviarTextoFallback: true,
    });
    const porTexto = await atenderAlEquipo({ from: '59898355530', type: 'audio', mediaId: 'audio-3', messageId: 'wamid-audio-3' });
    expect(porTexto.audioEnviado).toBe(false);
    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMetaWhatsAppMessage.mock.calls[0][0].text).toMatch(/límite compartido de 100 voces.*Te respondo por texto/i);

    mockEnviarRespuestaConVozWhatsApp.mockResolvedValueOnce({
      audioEnviado: false,
      fallbackReason: 'Se perdió la confirmación de Meta; no reintentes para evitar duplicados.',
      puedeEnviarTextoFallback: false,
    });
    const incierto = await atenderAlEquipo({ from: '59898355530', type: 'audio', mediaId: 'audio-4', messageId: 'wamid-audio-4' });
    expect(incierto.audioEnviado).toBe(false);
    expect(mockSendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect(mockEnviarRespuestaConVozWhatsApp).toHaveBeenCalledTimes(3);
    expect(transaccionalStore['asistente/voz-uso.json']).toBeUndefined();
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

  test('guarda y consulta un recuerdo propio sin mezclarlo con el del dueño', async () => {
    const guardado = await atenderAlEquipo({ from: '59899123456', text: 'Acordate que a los Pérez no se los llama de mañana' });
    expect(guardado.respuestaEnviada).toContain('lo guardé en tu memoria personal');

    const delDueno = await atenderAlEquipo({ from: '59898355530', text: 'Acordate que el salón preferido es La Rinconada' });
    expect(delDueno.respuestaEnviada).toContain('lo guardé en tu memoria personal');
    expect(memoriaStore['asistente-memoria.json'][1].usuarioId).toBe('ak:dueno');

    const recuerdoDueno = await atenderAlEquipo({ from: '59898355530', text: '¿Qué sabés del salón?' });
    expect(recuerdoDueno.respuestaEnviada).toContain('La Rinconada');

    const recuerdoLucia = await atenderAlEquipo({ from: '59899123456', text: '¿Qué sabés de la familia Pérez?' });
    expect(recuerdoLucia.respuestaEnviada).toContain('no se los llama de mañana');
    expect(recuerdoLucia.respuestaEnviada).not.toContain('La Rinconada');
  });

  test('olvidate borra el recuerdo del remitente y una contraseña no se guarda', async () => {
    await atenderAlEquipo({ from: '59899123456', text: 'Acordate que el cumpleaños de Ana es en mayo' });
    const sensible = await atenderAlEquipo({ from: '59899123456', text: 'Acordate que la contraseña es secreto123' });
    expect(sensible.respuestaEnviada).toContain('No guardé ese dato');

    const borrado = await atenderAlEquipo({ from: '59899123456', text: 'Olvidate de Ana' });
    expect(borrado.respuestaEnviada).toContain('eliminé ese recuerdo');
  });

  test('una pregunta general del equipo no se convierte en una propuesta de gasto', async () => {
    memoriaStore['fiestas.json'] = [];
    memoriaStore['crm-leads.json'] = [];
    const res = await atenderAlEquipo({ from: '59899123456', text: '¿Qué tengo esta semana?' });

    expect(res.accionIdentificada).toBe('ver_mi_semana');
    expect(res.respuestaEnviada).toContain('AGENDA');
    expect(memoriaStore['asistente-propuestas.json']).toBeUndefined();
  });
});
