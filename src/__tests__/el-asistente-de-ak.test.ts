let reservaDiaria: any = {};
let settingsAsistente: any = { whatsappDuenioHabilitado: false, numeroDuenio: '59812345678' };
let propuestasMock: any[] = [];
const mockJsonArrays = new Map<string, any[]>();
let mockJsonArrayQueue = Promise.resolve();
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
  getAsistenteSettings: jest.fn(async () => settingsAsistente),
}));
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: jest.fn(async (items: any[]) => {
    const agregadas = items.filter((item) => !propuestasMock.some((actual) => actual.clave === item.clave));
    propuestasMock.push(...mockClone(agregadas));
    return { agregadas, duplicadas: items.length - agregadas.length };
  }),
}));
jest.mock('@/lib/asistente/whatsapp-media', () => {
  const real = jest.requireActual('@/lib/asistente/whatsapp-media');
  return {
    ...real,
    descargarMediaWhatsApp: jest.fn((...args: any[]) => real.descargarMediaWhatsApp(...args)),
    transcribirAudioWhatsApp: jest.fn((...args: any[]) => real.transcribirAudioWhatsApp(...args)),
    clasificarImagenWhatsApp: jest.fn((...args: any[]) => real.clasificarImagenWhatsApp(...args)),
  };
});
jest.mock('@/lib/asistente/whatsapp-voz', () => ({
  enviarRespuestaConVozWhatsApp: jest.fn(),
}));
jest.mock('@/lib/budget/public-simulator-persistence', () => ({
  persistPublicSimulatorBudget: jest.fn(async () => ({ presupuesto: { id: 'budget-fixture' } })),
}));
jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(async () => ({ success: true, message: { id: 'message-fixture' } })),
}));
jest.mock('@/app/actions/social-gallery', () => ({ getPublicSocialPosts: jest.fn(async () => []) }));
jest.mock('@/lib/firebase/server-messaging', () => ({ sendPushNotificationToAll: jest.fn(async () => undefined) }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: jest.fn(async () => ({ success: true, messageId: 'wamid-test' })) }));
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn(async (_path: string, _empty: unknown, change: (data: any) => any) => {
    const next = await change(reservaDiaria);
    if (next !== null) reservaDiaria = next;
    return next;
  }),
  mutateGenericJsonArray: jest.fn(async (path: string, change: (items: any[]) => any) => {
    const previous = mockJsonArrayQueue;
    let release!: () => void;
    mockJsonArrayQueue = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      const next = change(mockClone(mockJsonArrays.get(path) || []));
      if (next !== null) mockJsonArrays.set(path, mockClone(next));
      return next;
    } finally {
      release();
    }
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
import { atenderAlEquipo } from '@/lib/asistente/por-whatsapp';
import * as whatsappMedia from '@/lib/asistente/whatsapp-media';
import { anticiparFaltantesDeMozos, ejecutarAnticipador, ejecutarVigilanteNoche } from '@/lib/agentes/motor-agentes';
import { guardarReglaIA } from '@/lib/ia/reglas-de-la-ia';
import { fotosDeFiestasParecidas, prepararBorradorProspectoAnuncio } from '@/lib/asistente/comercial-borrador';
import { ejecutarCierrePosfiesta, dependenciasCierrePosfiestaProduccion } from '@/lib/asistente/cierre-posfiesta';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { enviarRespuestaConVozWhatsApp } from '@/lib/asistente/whatsapp-voz';
import { persistPublicSimulatorBudget } from '@/lib/budget/public-simulator-persistence';
import { writeData } from '@/lib/data-service';

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
    settingsAsistente = { whatsappDuenioHabilitado: false, numeroDuenio: '59812345678' };
    propuestasMock = [];
    mockJsonArrays.clear();
    mockJsonArrayQueue = Promise.resolve();
    mockDataFiles.set('reglas-de-la-ia.json', {});
    const realMedia = jest.requireActual('@/lib/asistente/whatsapp-media');
    (whatsappMedia.descargarMediaWhatsApp as jest.Mock).mockImplementation((...args: any[]) => realMedia.descargarMediaWhatsApp(...args));
    (whatsappMedia.transcribirAudioWhatsApp as jest.Mock).mockImplementation((...args: any[]) => realMedia.transcribirAudioWhatsApp(...args));
    (whatsappMedia.clasificarImagenWhatsApp as jest.Mock).mockImplementation((...args: any[]) => realMedia.clasificarImagenWhatsApp(...args));
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;
  });

  test('caso 3: dos pasadas del despertador hacen un solo fallback al push y no registran envío WhatsApp', async () => {
    (sendPushNotificationToAll as jest.Mock).mockResolvedValueOnce({ success: true, sentCount: 1, failureCount: 0 });
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

  test('caso 1: la secretaria pregunta cuánto deben y la IA recibe contexto sin importes; el dueño sí los recibe', async () => {
    mockDataFiles.set('presupuestos.json', [{ estado: 'Aceptado', totalConDescuento: 24000, clienteNombre: 'Familia Pérez' }]);
    settingsAsistente = { numerosEquipo: [
      { telefono: '59811111111', nombre: 'Sofía', rol: 'Secretaria' },
      { telefono: '59822222222', nombre: 'Dueño', rol: 'Dueño' },
    ] };
    const secretaria = await atenderAlEquipo({ from: '59811111111', text: 'cuánto me deben?' });
    const dueno = await atenderAlEquipo({ from: '59822222222', text: 'cuánto me deben?' });
    expect(secretaria.respuestaEnviada).not.toMatch(/PLATA|24\.000|24000/);
    expect(dueno.respuestaEnviada).toMatch(/PLATA|24\.000|24000/);
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

  test('caso 2: WhatsApp guarda, recupera y olvida un recuerdo desde el flujo real del equipo', async () => {
    settingsAsistente = { numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: 'Secretaria' }] };
    await atenderAlEquipo({ from: '59899123456', text: 'Acordate que a los Pérez no se los llama de mañana' });
    const consulta = await atenderAlEquipo({ from: '59899123456', text: '¿Qué tenemos anotado sobre los Pérez?' });
    expect(consulta.respuestaEnviada).toMatch(/Pérez.*no se los llama de mañana/i);
    await atenderAlEquipo({ from: '59899123456', text: 'Olvidate de eso' });
    const luego = await atenderAlEquipo({ from: '59899123456', text: '¿Qué tenemos anotado sobre los Pérez?' });
    expect(luego.respuestaEnviada).toMatch(/no tengo recuerdos/i);
  });

  test('caso 4: atiende la transcripción de audio y pide texto si falla', async () => {
    settingsAsistente = { numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: 'Secretaria' }] };
    (whatsappMedia.descargarMediaWhatsApp as jest.Mock).mockResolvedValue({ mimeType: 'audio/webm', base64: 'YXVkaW8=' });
    (whatsappMedia.transcribirAudioWhatsApp as jest.Mock).mockResolvedValueOnce('Acordate que los Pérez prefieren la tarde');
    const atendido = await atenderAlEquipo({ from: '59899123456', type: 'audio', mediaId: 'audio-ok' });
    expect(atendido.accionIdentificada).toBe('recordar');
    expect((await loQueSe('59899123456', 'Pérez')).map((r) => r.texto)).toContain('los Pérez prefieren la tarde');

    (whatsappMedia.transcribirAudioWhatsApp as jest.Mock).mockRejectedValueOnce(new Error('transcripción no disponible'));
    const fallido = await atenderAlEquipo({ from: '59899123456', type: 'audio', mediaId: 'audio-error' });
    expect(fallido.respuestaEnviada).toMatch(/No pude escuchar el audio/i);
    expect(fallido.accionIdentificada).toBe('audio_no_disponible');
  });

  test('caso 4: el audio entrante usa voz activada y solo cae a texto cuando Meta permite fallback seguro', async () => {
    settingsAsistente = { numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: 'Secretaria' }], responderConVoz: true, vozGeminiActiva: true };
    process.env.META_WHATSAPP_TOKEN = 'meta-test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    (whatsappMedia.descargarMediaWhatsApp as jest.Mock).mockResolvedValue({ mimeType: 'audio/webm', base64: 'YXVkaW8=' });
    (whatsappMedia.transcribirAudioWhatsApp as jest.Mock).mockResolvedValue('Acordate que la reunión es por la tarde');
    (enviarRespuestaConVozWhatsApp as jest.Mock)
      .mockResolvedValueOnce({ audioEnviado: false, fallbackReason: 'cupo diario', puedeEnviarTextoFallback: true })
      .mockResolvedValueOnce({ audioEnviado: false, fallbackReason: 'resultado incierto', puedeEnviarTextoFallback: false });

    await atenderAlEquipo({ from: '59899123456', type: 'audio', mediaId: 'voice-fallback-1' });
    expect(enviarRespuestaConVozWhatsApp).toHaveBeenCalledWith(expect.objectContaining({
      to: '59899123456', authorized: true, settings: expect.objectContaining({ responderConVoz: true, vozGeminiActiva: true }),
    }));
    expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    expect((sendMetaWhatsAppMessage as jest.Mock).mock.calls[0][0].text).toMatch(/No pude responder con voz.*cupo diario/i);

    await atenderAlEquipo({ from: '59899123456', type: 'audio', mediaId: 'voice-fallback-2' });
    expect(sendMetaWhatsAppMessage).toHaveBeenCalledTimes(1);
    delete process.env.META_WHATSAPP_TOKEN;
    delete process.env.META_WHATSAPP_PHONE_ID;
  });

  test('caso 5: una foto de boleta crea propuesta y no escribe ningún gasto', async () => {
    settingsAsistente = { numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: 'Secretaria' }] };
    (whatsappMedia.descargarMediaWhatsApp as jest.Mock).mockResolvedValue({ mimeType: 'image/jpeg', base64: 'aW1hZ2U=' });
    (whatsappMedia.clasificarImagenWhatsApp as jest.Mock).mockResolvedValue({
      tipo: 'comprobante', descripcion: 'Ticket de almacén', proveedor: 'Almacén Centro', monto: 1234,
      categoria: 'Insumos', confianza: 'alta', detalle: 'Cuatro bandejas',
    } as any);
    const result = await atenderAlEquipo({ from: '59899123456', type: 'image', mediaId: 'ticket-1' });
    expect(result.accionIdentificada).toBe('proponer_gasto');
    expect(propuestasMock).toHaveLength(1);
    expect(propuestasMock[0]).toMatchObject({ tipoPropuesta: 'gasto_boleta', monto: 1234, nivelRiesgo: 'pregunta' });
    expect(mockDataFiles.has('gastos.json')).toBe(false);
    expect(writeData).not.toHaveBeenCalledWith('gastos.json', expect.anything(), expect.anything(), expect.anything());
    expect(result.respuestaEnviada).toMatch(/No registré ningún gasto/i);
  });

  test('caso 6: los tres pedidos producen planes solo con fixture inequívoco; sin cliente pregunta', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-29T12:00:00.000Z'));
    try {
      settingsAsistente = { numerosEquipo: [{ telefono: '59899123456', nombre: 'Sofía', rol: 'Secretaria' }] };
      mockDataFiles.set('fiestas.json', [
        {
          id: 'boda-sabado', estado: 'Confirmada', reuniones: [], tareas: [], presupuestoId: 'pres-boda',
          configuracion: { nombreEvento: 'Boda Pérez', tipoCelebracion: 'Boda', fechaEvento: '2026-10-31', horaInicio: '20:00', horaFin: '23:00' },
          decoracion: { tema: 'Bosque', items: [{ id: 'deco-1', name: 'Centro de mesa', quantity: 8 }] },
        },
        {
          id: 'cumple-fixture', estado: 'Confirmada', reuniones: [], tareas: [{ id: 't-1' }], presupuestoId: 'pres-cumple',
          configuracion: { nombreEvento: 'Cumpleaños Ana', fechaEvento: '2026-11-03', horaInicio: '17:00', horaFin: '22:00' },
          decoracion: { tema: 'Jardín', items: [{ id: 'deco-2', name: 'Guirnalda', quantity: 3 }] },
        },
      ]);
      mockDataFiles.set('presupuestos.json', [
        { id: 'pres-boda', estado: 'Enviado', clienteNombre: 'Familia Pérez', clienteContacto: '59899111111', eventoFecha: '2026-10-31', timestamp: '2026-10-01T12:00:00Z' },
        { id: 'pres-cumple', estado: 'Enviado', clienteNombre: 'Ana', clienteContacto: '59899222222', eventoFecha: '2026-11-03', timestamp: '2026-10-01T12:00:00Z' },
      ]);
      mockDataFiles.set('scheduled-messages.json', []);
      mockDataFiles.set('crm-appointments.json', [{
        id: 'cita-jueves', clienteNombre: 'Otro cliente', clienteContacto: '59899333333',
        fechaHora: '2026-10-29T10:15:00-03:00', estado: 'Agendada', creadoEn: '2026-10-20T12:00:00Z',
      }]);

      const reunion = await atenderAlEquipo({ from: '59899123456', messageId: 'reunion-1', text: 'Organizá la reunión con los novios del sábado' });
      expect(reunion.accionIdentificada).toBe('plan_multi_paso');
      expect(propuestasMock).toHaveLength(1);
      expect(propuestasMock[0].quePropone.split('\n')).toHaveLength(3);
      expect(propuestasMock[0].quePropone).toMatch(/horario candidato.*agenda interna.*confirmar disponibilidad Google/i);
      expect(propuestasMock[0].accion.data).toMatchObject({
        horarioCandidato: { datetimeIso: '2026-10-30T13:00:00.000Z', duracionMinutos: 30, googleVerificado: false },
        borrador: { telefono: '59899111111', presupuestoId: 'pres-boda', texto: expect.stringContaining('2026-10-30 a las 10:00') },
      });

      const semana = await atenderAlEquipo({ from: '59899123456', messageId: 'semana-1', text: 'Prepará la semana del evento "Cumpleaños Ana"' });
      expect(semana.accionIdentificada).toBe('plan_multi_paso');
      expect(propuestasMock).toHaveLength(2);
      expect(propuestasMock[1].quePropone).toMatch(/Cumpleaños Ana/);
      expect(propuestasMock[1].quePropone).toMatch(/Guirnalda.*cantidad 3/);

      const seguimiento = await atenderAlEquipo({ from: '59899123456', messageId: 'seguimiento-1', text: 'Prepará seguimiento del presupuesto "pres-cumple"' });
      expect(seguimiento.accionIdentificada).toBe('plan_multi_paso');
      expect(propuestasMock).toHaveLength(3);
      expect(propuestasMock[2].quePropone).toMatch(/59899222222/);
      expect(propuestasMock[2].quePropone).toMatch(/antigüedad no verificada/i);
      expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();

      propuestasMock = [];
      const otraBoda = { ...mockDataFiles.get('fiestas.json')[0], id: 'otra-boda-sabado' };
      mockDataFiles.set('fiestas.json', [...mockDataFiles.get('fiestas.json'), otraBoda]);
      const ambiguo = await atenderAlEquipo({ from: '59899123456', messageId: 'reunion-sin-cliente', text: 'Organizá reunión con los novios del sábado' });
      expect(ambiguo.accionIdentificada).toBe('aclarar_plan_multi_paso');
      expect(propuestasMock).toHaveLength(0);
    } finally {
      jest.useRealTimers();
    }
  });

  test('caso 8: el anticipador alerta que para 150 invitados hay 3 de los 6 mozos requeridos', async () => {
    mockDataFiles.set('fiestas.json', [{
      id: 'fiesta-150', estado: 'Confirmada', modulosContratados: { catering: true },
      configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-10-30', horaInicio: '20:00', invitadosEstimados: 150 },
      personalAsignado: [1, 2, 3].map((n) => ({ empleadoId: `mozo-${n}`, rolId: 'rol-mozo' })),
    }]);
    mockDataFiles.set('roles.json', [{ id: 'rol-mozo', nombre: 'Mozo' }]);
    const ahora = new Date('2026-10-28T15:00:00.000Z');
    expect(anticiparFaltantesDeMozos(mockDataFiles.get('fiestas.json'), mockDataFiles.get('roles.json'), ahora))
      .toMatchObject([{ fiestaId: 'fiesta-150', asignados: 3, requeridos: 6 }]);
    const informe = await ejecutarAnticipador(ahora);
    expect(informe.hallazgos.join('\n')).toMatch(/invitados=150;asignados=3;requeridos=6/);
    expect(informe.accionesPreparadas.join('\n')).toMatch(/no modificar asignación ni presupuesto/i);
  });

  test('caso 7: el borrador comercial arma presupuesto y fotos autorizadas, excluye revocadas y no envía al prospecto', async () => {
    mockDataFiles.set('armado-rapido-config.json', {
      paquetes: [{ id: 'paquete-boda', nombre: 'Boda base', tiposDeEventoAplicables: ['Boda'], serviciosIncluidos: [{ id: 'servicio-base' }] }],
      menus: [], platosVisibles: [], serviceDependencies: [], mostrarPrecios: true,
    });
    mockDataFiles.set('servicios-empresa.json', [{ id: 'servicio-base', nombre: 'Salón', tipoItem: 'Servicio', precioVenta: 5000 }]);
    mockDataFiles.set('menus-catering.json', []);
    mockDataFiles.set('galeria-publica.json', { fotos: [
      { id: 'photo-authorized-1', eventoId: 'event-1', url: 'https://img.test/1.jpg', tipoFiesta: 'Boda', salon: 'Salón Central', invitados: 120 },
      { id: 'photo-authorized-2', eventoId: 'event-2', url: 'https://img.test/2.jpg', tipoFiesta: 'Boda', salon: 'Salón Central', invitados: 150 },
      { id: 'photo-authorized-3', eventoId: 'event-3', url: 'https://img.test/3.jpg', tipoFiesta: 'Casamiento', salon: 'Otro salón', invitados: 140 },
      { id: 'photo-revoked', eventoId: 'event-revoked', url: 'https://img.test/revoked.jpg', tipoFiesta: 'Boda', salon: 'Salón Central', invitados: 120 },
      { id: 'photo-no-consent', eventoId: 'event-no-consent', url: 'https://img.test/no-consent.jpg', tipoFiesta: 'Boda', salon: 'Salón Central', invitados: 121 },
    ], videos: [] });
    mockDataFiles.set('fiestas.json', ['event-1', 'event-2', 'event-3', 'event-revoked', 'event-no-consent'].map((id, index) => ({
      id,
      configuracion: { tipoCelebracion: 'Boda', invitadosEstimados: 120 + index * 10, nombreLugar: index < 2 ? 'Salón Central' : 'Otro salón' },
    })));
    const consentimiento = (eventId: string, extra: any = {}) => ({
      eventId, authorized: true, grantedBy: 'client', method: 'written', evidenceReference: `contract-${eventId}`,
      contractVersion: '2026-01', recordedBy: 'owner-1', recordedAt: '2026-10-01T12:00:00.000Z', ...extra,
    });
    mockDataFiles.set('promotional-photo-consents.json', {
      'event-1': consentimiento('event-1'), 'event-2': consentimiento('event-2'), 'event-3': consentimiento('event-3'),
      'event-revoked': consentimiento('event-revoked', { revokedAt: '2026-10-20T12:00:00.000Z' }),
    });
    expect(await fotosDeFiestasParecidas('Boda', 140, 'Salón Central')).toHaveLength(3);

    const resultado = await prepararBorradorProspectoAnuncio({
      phone: '099123456', name: 'Familia Pérez', fecha: '2027-03-20', invitados: 140,
      salon: 'Salón Central', tipoEvento: 'Boda', requestId: 'request-order-255',
    });

    expect(resultado).toMatchObject({ status: 'draft_created', presupuestoId: 'budget-fixture', messageDraftId: 'message-fixture' });
    expect(resultado.photoIds).toHaveLength(3);
    expect(resultado.photoIds).not.toContain('photo-revoked');
    expect(resultado.photoIds).not.toContain('photo-no-consent');
    expect(persistPublicSimulatorBudget).toHaveBeenCalledWith(expect.objectContaining({
      clienteNombre: 'Familia Pérez', clienteContacto: '099123456', eventoFecha: '2027-03-20',
      serviciosIncluidos: ['servicio-base'],
    }), expect.objectContaining({ source: 'simulator_assistant', estadoInicial: 'Borrador', requirePositiveTotal: true }));
    expect(saveScheduledMessage).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pendiente', sendingMode: 'manual_click', presupuestoId: 'budget-fixture',
      promotionalPhotoIds: resultado.photoIds,
    }), expect.anything(), expect.objectContaining({ idEstable: expect.stringMatching(/^draft_presupuesto_anuncio_/) }));
    expect(sendMetaWhatsAppMessage).not.toHaveBeenCalled();
  });

  test('caso 10: el cierre posfiesta concurrente y repetido guarda un solo informe para el mismo evento', async () => {
    mockDataFiles.set('reglas-de-la-ia.json', { informe_posfiesta: 'preguntar' });
    mockDataFiles.set('fiestas.json', [{ id: 'fiesta-cerrada', configuracion: { fechaEvento: '2026-10-28', horaInicio: '18:00', horaFin: '23:00', nombreEvento: 'Boda Pérez' } }]);
    const ahora = new Date('2026-10-29T12:00:00.000Z');
    const [primera, concurrente] = await Promise.all([
      ejecutarCierrePosfiesta(ahora, dependenciasCierrePosfiestaProduccion),
      ejecutarCierrePosfiesta(ahora, dependenciasCierrePosfiestaProduccion),
    ]);
    const repetida = await ejecutarCierrePosfiesta(ahora, dependenciasCierrePosfiestaProduccion);

    expect(mockJsonArrays.get('informes-posfiesta.json')).toHaveLength(1);
    expect(mockJsonArrays.get('informes-posfiesta.json')?.[0].id).toBe('informe-posfiesta-fiesta-cerrada-2026-10-28');
    expect([primera.preparados + concurrente.preparados, repetida.preparados]).toEqual([1, 0]);
    expect(primera.propuestas[0]?.clave).toBe('informe-posfiesta-fiesta-cerrada-2026-10-28');
  });

  test('caso 9: el vigilante detecta el atraso y cron deduplica la propuesta aunque el sensor repita el hallazgo', async () => {
    mockDataFiles.set('fiestas.json', [{
      id: 'fiesta-noche', estado: 'Confirmada',
      configuracion: { nombreEvento: 'Boda Pérez', fechaEvento: '2026-10-28', horaInicio: '18:00', horaFin: '22:00' },
      programa: [{ hora: '20:20', titulo: 'Brindis', completado: false }], personalAsignado: [],
    }]);
    mockDataFiles.set('insumos.json', []);
    const primera = await ejecutarVigilanteNoche(new Date('2026-10-28T23:45:00.000Z'));
    const segunda = await ejecutarVigilanteNoche(new Date('2026-10-28T23:55:00.000Z'));
    expect(primera.hallazgos.join('\n')).toMatch(/20 minutos o más.*20:20 Brindis/);
    expect(segunda.hallazgos.join('\n')).toMatch(/tema=programa/);

    const webGlobalsAnteriores = { Request: global.Request, Response: global.Response, Headers: global.Headers };
    const undici = require('node-fetch');
    global.Request ||= undici.Request;
    global.Response ||= undici.Response;
    global.Headers ||= undici.Headers;
    const { prepararPropuestaOperativaNoche } = jest.requireActual('@/lib/asistente/propuestas-operativas');
    const { agregarPropuestasDeduplicadas, getPropuestas } = jest.requireActual('@/lib/asistente/propuestas-service');
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    try {
      const propuesta1 = prepararPropuestaOperativaNoche(primera.hallazgos[0], primera.accionesPreparadas[0]);
      const propuesta2 = prepararPropuestaOperativaNoche(segunda.hallazgos[0], segunda.accionesPreparadas[0]);
      expect(propuesta1?.clave).toBe('agente:vigilante_noche:fiesta-noche:programa:2026-10-28-20');
      expect((await agregarPropuestasDeduplicadas([propuesta1!])).agregadas).toHaveLength(1);
      expect((await agregarPropuestasDeduplicadas([propuesta2!])).agregadas).toHaveLength(0);
      expect(await getPropuestas()).toHaveLength(1);
    } finally {
      delete process.env.AK_USE_LOCAL_JSON_ONLY;
      for (const nombre of ['Request', 'Response', 'Headers'] as const) {
        if (!webGlobalsAnteriores[nombre]) delete (global as any)[nombre];
      }
    }
  });

  test('caso 11: el servidor rechaza en modo sola toda tarea configurada que contacta clientes', async () => {
    const tareasDeContacto = ['mandar_mensajes_clientes', 'perseguidor_presupuestos', 'recontacto_automatico'];
    for (const tarea of tareasDeContacto) {
      await expect(guardarReglaIA(tarea, 'sola', 'dueno'))
        .rejects.toThrow('Esta tarea no puede ejecutarse sola por seguridad');
    }
    expect(mockDataFiles.get('reglas-de-la-ia.json')).toEqual({});
  });

  test('cuando el dueño lo habilitó, manda como máximo cinco líneas al número configurado', async () => {
    (getAsistenteSettings as jest.Mock).mockResolvedValueOnce({
      whatsappDuenioHabilitado: true,
      numeroDuenio: '59899123456',
      numerosEquipo: [{ telefono: '099123456', nombre: 'Dueño', rol: 'Dueño' }],
    });
    process.env.META_WHATSAPP_TOKEN = 'test-token';
    process.env.META_WHATSAPP_PHONE_ID = '123456';
    const parteLarga = { ...parte, itemsPrincipales: Array.from({ length: 8 }, (_, i) => ({ id: String(i), titulo: `Punto ${i + 1}` })) };

    const result = await enviarResumenMananaWhatsApp(parteLarga, new Date('2026-10-28T11:30:00.000Z'));

    expect(result.enviado).toBe(true);
    const envio = (sendMetaWhatsAppMessage as jest.Mock).mock.calls[0][0];
    expect(envio.to).toBe('59899123456');
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
        .resolves.toMatchObject({ success: false, error: expect.stringMatching(/MP3 válido/i) });
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
