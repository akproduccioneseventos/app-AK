let reservaDiaria: any = {};
const mockFirestoreDocuments = new Map<string, any>();
const mockDataFiles = new Map<string, any>();
let mockFirestoreQueue = Promise.resolve();
const mockClone = (value: any) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (name: string) => ({ doc: (id: string) => ({ key: `${name}/${id}` }) }),
    runTransaction: async (callback: (transaction: any) => Promise<any>) => {
      const anterior = mockFirestoreQueue;
      let liberar!: () => void;
      mockFirestoreQueue = new Promise<void>((resolve) => { liberar = resolve; });
      await anterior;
      const escrituras: Array<[string, any]> = [];
      const transaction = {
        get: async (ref: { key: string }) => {
          const dato = mockFirestoreDocuments.get(ref.key);
          return { exists: dato !== undefined, data: () => mockClone(dato) };
        },
        set: (ref: { key: string }, dato: any) => escrituras.push([ref.key, mockClone(dato)]),
      };
      try {
        const resultado = await callback(transaction);
        for (const [key, value] of escrituras) mockFirestoreDocuments.set(key, value);
        return resultado;
      } finally {
        liberar();
      }
    },
  },
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'ai-consumo.json') {
      return mockClone(mockFirestoreDocuments.get('json_documents/ai-consumo.json')?._data ?? fallback);
    }
    return mockClone(mockDataFiles.has(file) ? mockDataFiles.get(file) : fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    if (file === 'ai-consumo.json') {
      mockFirestoreDocuments.set('json_documents/ai-consumo.json', {
        _filePath: file, _data: mockClone(data), _syncedAt: new Date().toISOString(),
      });
    } else mockDataFiles.set(file, mockClone(data));
    return true;
  }),
  readDataConDetalle: jest.fn(async (file: string, fallback: any) => ({
    valor: mockClone(mockDataFiles.has(file) ? mockDataFiles.get(file) : fallback), huboFalla: false,
  })),
  createDataItem: jest.fn(async (file: string, _collection: string, _id: string, item: any) => {
    mockDataFiles.set(file, [...(mockDataFiles.get(file) || []), mockClone(item)]);
  }),
  deleteDataItem: jest.fn(async (file: string, _collection: string, id: string) => {
    const anterior = mockDataFiles.get(file) || [];
    const siguiente = anterior.filter((item: any) => item.id !== id);
    mockDataFiles.set(file, siguiente);
    return siguiente.length < anterior.length;
  }),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({ whatsappDuenioHabilitado: false, numeroDuenio: '59812345678' })),
}));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn(async () => undefined) }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn(async () => ({ success: true, messageId: 'wamid-test' })) }));
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _empty: unknown, change: (data: any) => any) => {
    const next = await change(reservaDiaria);
    if (next !== null) reservaDiaria = next;
    return next;
  }),
}));

import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { enviarResumenMananaWhatsApp } from '@/lib/asistente/resumen-manana-whatsapp';
import { clasificarImagenWhatsApp, descargarMediaWhatsApp, transcribirAudioWhatsApp } from '@/lib/asistente/whatsapp-media';
import { getResumenDeGasto, registrarConsumoIA, reservarConsumoIA, setTopeMensual } from '@/lib/ai/consumo-servidor';
import { armarContextoDelNegocio } from '@/lib/multiagent/contexto-negocio';
import { ID_MEMORIA_DUENO, loQueSe, olvidar, recordar } from '@/lib/asistente/memoria';

describe('Orden 255: resumen matutino del asistente AK', () => {
  const parte: any = {
    fecha: '2026-10-28',
    itemsPrincipales: [
      { id: 'a', tipo: 'fiesta_proxima', titulo: 'Preparar la fiesta del sábado' },
      { id: 'b', tipo: 'prospecto', titulo: 'Revisar propuestas pendientes' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFirestoreDocuments.clear();
    mockDataFiles.clear();
    mockFirestoreQueue = Promise.resolve();
    process.env.FIRESTORE_EMULATOR_HOST = 'mock:8080';
    reservaDiaria = {};
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;
  });

  test('envía al push genérico si falta WhatsApp y no repite el resumen del día', async () => {
    const hoy = new Date('2026-10-28T11:30:00.000Z'); // 08:30 en Uruguay
    const primero = await enviarResumenMananaWhatsApp(parte, hoy);
    const segundo = await enviarResumenMananaWhatsApp(parte, hoy);

    expect(primero).toMatchObject({ enviado: false, fallbackPush: true });
    expect(segundo.motivo).toMatch(/ya se procesó/i);
    expect(sendPushNotificationToAll).toHaveBeenCalledTimes(1);
    expect((sendPushNotificationToAll as jest.Mock).mock.calls[0][0].body).not.toMatch(/saldo|cobro|\$/i);
    expect(reservaDiaria).toMatchObject({ fecha: '2026-10-28', estado: 'push_fallback' });
  });

  test('caso 1: el contexto financiero no llega a perfiles sin permiso', () => {
    const datos = {
      fiestas: [],
      presupuestos: [{ estado: 'Aceptado', totalConDescuento: 24000, clienteNombre: 'Familia Pérez' }],
    };
    const contextoDuenio = armarContextoDelNegocio({ perfil: 'dueno' }, datos);
    const contextoOperador = armarContextoDelNegocio({ perfil: 'operador' }, datos);

    expect(contextoDuenio).toContain('PLATA:');
    expect(contextoDuenio).toContain('$24.000');
    expect(contextoOperador).not.toContain('PLATA:');
    expect(contextoOperador).not.toContain('24.000');
  });

  test('caso 2: recordar, consultar y olvidar usa almacenamiento simulado y aísla dueño/equipo', async () => {
    const idEquipo = '59899123456';
    expect(await recordar(idEquipo, 'La familia Pérez prefiere reuniones por la tarde')).toMatchObject({ guardado: true });
    expect(await recordar(ID_MEMORIA_DUENO, 'El salón favorito es La Rinconada', undefined, { esDueno: true }))
      .toMatchObject({ guardado: true });

    expect((await loQueSe(idEquipo, 'familia Pérez')).map((item) => item.texto)).toEqual([
      'La familia Pérez prefiere reuniones por la tarde',
    ]);
    expect((await loQueSe(idEquipo, 'salón favorito'))).toHaveLength(0);
    expect((await loQueSe(ID_MEMORIA_DUENO, 'salón favorito')).map((item) => item.texto)).toEqual([
      'El salón favorito es La Rinconada',
    ]);
    expect(await olvidar(idEquipo, 'familia Pérez')).toBe(1);
    expect(await loQueSe(idEquipo, 'familia Pérez')).toHaveLength(0);
    expect(await loQueSe(ID_MEMORIA_DUENO, 'salón favorito')).toHaveLength(1);
  });

  test('cuando el dueño lo habilitó, manda como máximo cinco líneas al número configurado', async () => {
    (getAsistenteSettings as jest.Mock).mockResolvedValueOnce({ whatsappDuenioHabilitado: true, numeroDuenio: '59812345678' });
    process.env.META_WHATSAPP_TOKEN = 'test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    const parteLarga = { ...parte, itemsPrincipales: Array.from({ length: 8 }, (_, i) => ({ id: String(i), titulo: `Punto ${i + 1}` })) };

    const result = await enviarResumenMananaWhatsApp(parteLarga, new Date('2026-10-28T11:30:00.000Z'));

    expect(result.enviado).toBe(true);
    const envio = (sendMetaWhatsAppMessage as jest.Mock).mock.calls[0][0];
    expect(envio.to).toBe('59812345678');
    expect(envio.text.split('\n')).toHaveLength(5);
    expect(sendPushNotificationToAll).not.toHaveBeenCalled();
    expect(reservaDiaria.estado).toBe('whatsapp_enviado');
  });

  test('descarga audio solo de un destino Meta permitido y valida tipo y tamaño reales', async () => {
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    const bytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    const responseBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const fetchFn = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        url: 'https://lookaside.fbsbx.com/media-1', mime_type: 'audio/webm', file_size: bytes.length,
      }) })
      .mockResolvedValueOnce({ ok: true, headers: { get: (name: string) => ({ 'content-type': 'audio/webm', 'content-length': String(bytes.length) } as Record<string, string>)[name] || null }, arrayBuffer: async () => responseBody });

    await expect(descargarMediaWhatsApp('media-1', 'audio', fetchFn as unknown as typeof fetch))
      .resolves.toEqual({ mimeType: 'audio/webm', base64: bytes.toString('base64') });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[1][1]).toMatchObject({ redirect: 'error', cache: 'no-store' });
  });

  test('rechaza URLs externas y medios que no coinciden con el MIME de Meta', async () => {
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    const urlNoPermitida = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => ({
      url: 'https://media.example.invalid/file', mime_type: 'image/jpeg', file_size: 3,
    }) });
    await expect(descargarMediaWhatsApp('media-2', 'image', urlNoPermitida as unknown as typeof fetch)).rejects.toThrow(/ubicación.*no es válida/i);
    expect(urlNoPermitida).toHaveBeenCalledTimes(1);

    const cuerpoIncorrecto = Buffer.from('not-an-image');
    const imagenFalsa = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({
        url: 'https://lookaside.fbsbx.com/file', mime_type: 'image/jpeg', file_size: cuerpoIncorrecto.length,
      }) })
      .mockResolvedValueOnce({ ok: true, headers: { get: () => 'image/jpeg' }, arrayBuffer: async () => cuerpoIncorrecto.buffer.slice(cuerpoIncorrecto.byteOffset, cuerpoIncorrecto.byteOffset + cuerpoIncorrecto.byteLength) });
    await expect(descargarMediaWhatsApp('media-3', 'image', imagenFalsa as unknown as typeof fetch)).rejects.toThrow(/contenido descargado.*no coincide/i);
  });

  test('reserva presupuesto antes de Gemini y cuenta el intento una sola vez', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    await setTopeMensual(1);
    const fetchAnterior = global.fetch;
    const fetchGemini = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Llamar al salón mañana.' }] } }] }),
    });
    global.fetch = fetchGemini as unknown as typeof fetch;
    try {
      await expect(transcribirAudioWhatsApp({ mimeType: 'audio/webm', base64: 'YXVkaW8=' })).resolves.toBe('Llamar al salón mañana.');
      expect(fetchGemini).toHaveBeenCalledTimes(1);
      await expect(transcribirAudioWhatsApp({ mimeType: 'audio/webm', base64: 'YXVkaW8=' })).rejects.toThrow(/tope mensual/i);
      expect(fetchGemini).toHaveBeenCalledTimes(1);
      expect(await getResumenDeGasto()).toMatchObject({ gastadoUYU: 1, porFuncion: { 'whatsapp-media': 1 } });
    } finally {
      global.fetch = fetchAnterior;
      delete process.env.GEMINI_API_KEY;
      delete process.env.META_WHATSAPP_TOKEN;
    }
  });

  test('la reserva transaccional admite solo una llamada concurrente cuando queda $1', async () => {
    const ahora = new Date();
    await setTopeMensual(100);
    await registrarConsumoIA('whatsapp-media', 99, ahora);

    const intentos = await Promise.all(Array.from({ length: 12 }, () => reservarConsumoIA('whatsapp-media', 1, ahora)));

    expect(intentos.filter(Boolean)).toHaveLength(1);
    expect(await getResumenDeGasto(ahora)).toMatchObject({ gastadoUYU: 100, porFuncion: { 'whatsapp-media': 100 }, frenado: true });
  });

  test('libera solo rechazos definitivos del proveedor y conserva cargos inciertos', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    const fetchAnterior = global.fetch;
    try {
      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 400 }) as unknown as typeof fetch;
      await expect(transcribirAudioWhatsApp({ mimeType: 'audio/webm', base64: 'YXVkaW8=' })).rejects.toThrow(/Gemini no pudo/i);
      expect((await getResumenDeGasto()).gastadoUYU).toBe(0);

      global.fetch = jest.fn().mockResolvedValueOnce({ ok: false, status: 503 }) as unknown as typeof fetch;
      await expect(transcribirAudioWhatsApp({ mimeType: 'audio/webm', base64: 'YXVkaW8=' })).rejects.toThrow(/Gemini no pudo/i);
      expect((await getResumenDeGasto()).gastadoUYU).toBe(1);
    } finally {
      global.fetch = fetchAnterior;
      delete process.env.GEMINI_API_KEY;
    }
  });

  test('rechaza WAV para WhatsApp sin realizar ninguna petición de red', async () => {
    const { sendMetaWhatsAppAudioMessage: enviarAudioReal } = jest.requireActual('@/lib/whatsapp/meta-sender');
    const wav = Buffer.alloc(44);
    wav.write('RIFF', 0, 'ascii');
    wav.write('WAVE', 8, 'ascii');
    const fetchAnterior = global.fetch;
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;
    try {
      await expect(enviarAudioReal({ to: '59899123456', audio: wav, apiToken: 'token', phoneNumberId: '123456' }))
        .resolves.toMatchObject({ success: false, error: expect.stringMatching(/WAV.*texto/i) });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = fetchAnterior;
    }
  });

  test('lee campos del comprobante desde una sola llamada multimodal', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    const fetchAnterior = global.fetch;
    const fetchGemini = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        tipo: 'comprobante', descripcion: 'Ticket de almacén', proveedor: 'Almacén Centro', fecha: '29/10/2026',
        monto: 1234, categoria: 'Insumos', confianza: 'alta', detalle: 'Cuatro bandejas',
      }) }] } }] }),
    });
    global.fetch = fetchGemini as unknown as typeof fetch;
    try {
      await expect(clasificarImagenWhatsApp({ mimeType: 'image/jpeg', base64: 'aW1hZ2U=' })).resolves.toMatchObject({
        tipo: 'comprobante', proveedor: 'Almacén Centro', monto: 1234, confianza: 'alta',
      });
      expect(fetchGemini).toHaveBeenCalledTimes(1);
    } finally {
      global.fetch = fetchAnterior;
      delete process.env.GEMINI_API_KEY;
    }
  });
});
