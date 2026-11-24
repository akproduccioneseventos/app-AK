/** @jest-environment node */
/**
 * Orden 336 — Bloque 5 (Sección H): Redes, webhooks de Meta y WhatsApp,
 * despertadores, recordatorios, perseguidor de presupuestos y sitemap.
 */
import crypto from 'crypto';
import { NextRequest } from 'next/server';

const store = new Map<string, any>();
const mockSendMetaWhatsAppMessage = jest.fn(async () => ({ success: true, messageId: 'wa_out_1' }));
const mockSendGoogleGmailMessage = jest.fn(async () => ({ id: 'gmail_1' }));
const mockSaveScheduledMessage = jest.fn(async () => ({ success: true, yaExistia: false }));
const mockMarcarCorrida = jest.fn(async () => undefined);
const mockAgregarPropuestas = jest.fn(async () => ({ agregadas: [], ignoradas: 0 }));
const mockMutateDataItem = jest.fn(async (file: string, _col: string, id: string, fn: (item: any) => any) => {
  const arr = Array.isArray(store.get(file)) ? JSON.parse(JSON.stringify(store.get(file))) : [];
  const idx = arr.findIndex((x: any) => x.id === id);
  if (idx === -1) return null;
  const next = fn(arr[idx]);
  if (!next) return null;
  arr[idx] = next;
  store.set(file, arr);
  return next;
});
const mockWriteData = jest.fn(async (file: string, data: any) => {
  store.set(file, JSON.parse(JSON.stringify(data)));
});
const mockReadData = jest.fn(async (file: string, def: any) =>
  store.has(file) ? JSON.parse(JSON.stringify(store.get(file))) : JSON.parse(JSON.stringify(def)),
);

const mockEvaluarProspectoDeWhatsApp = jest.fn();
const mockVerificarEsContactoPersonal = jest.fn(async () => ({ bloquear: false, esPersonal: false }));
const mockRegistrarMensajeYAnalizar = jest.fn(async () => null);
const mockEnriquecerLead = jest.fn(async () => null);
const mockClasificarComentario = jest.fn(async () => ({
  classified: true,
  sentiment: 'positivo',
  sentimentReason: 'Elogio',
  isInsultOrSpam: false,
  isLegitimateComplaint: false,
  esPregunta: false,
  autoHideRecommended: false,
}));
const mockProcesarComentarioRedes = jest.fn(async (inc: any) => ({
  ...inc,
  classifiedAt: '2026-11-23T12:00:00.000Z',
  sentiment: 'positivo',
  respuestaAutomatica: { texto: '¡Gracias!', at: '2026-11-23T12:00:00.000Z' },
}));
const mockAtenderProspectoUnificado = jest.fn();

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: any[]) => (mockReadData as any)(...args),
  readDataConDetalle: async (file: string, def: any) => ({
    valor: await (mockReadData as any)(file, def),
    huboFalla: false,
  }),
  writeData: (...args: any[]) => (mockWriteData as any)(...args),
  createDataItem: jest.fn(),
  mutateDataItem: (...args: any[]) => (mockMutateDataItem as any)(...args),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, fn: (arr: any[]) => any[] | null) => {
    const actual = Array.isArray(store.get(file)) ? JSON.parse(JSON.stringify(store.get(file))) : [];
    const next = fn(actual);
    if (next !== null) store.set(file, JSON.parse(JSON.stringify(next)));
    return next;
  }),
  mutarDocumento: jest.fn(async (file: string, def: any, fn: (doc: any) => any) => {
    const actual = store.has(file) ? JSON.parse(JSON.stringify(store.get(file))) : JSON.parse(JSON.stringify(def));
    const next = fn(actual);
    if (next !== null) store.set(file, JSON.parse(JSON.stringify(next)));
    return next ?? actual;
  }),
  mutarDocumentoConTransaccion: jest.fn(async (file: string, def: any, fn: (doc: any) => any) => {
    const actual = store.has(file) ? JSON.parse(JSON.stringify(store.get(file))) : JSON.parse(JSON.stringify(def));
    const next = fn(actual);
    if (next !== null) store.set(file, JSON.parse(JSON.stringify(next)));
    return next ?? actual;
  }),
  readGenericJsonFile: jest.fn(async (file: string) =>
    store.has(file) ? JSON.parse(JSON.stringify(store.get(file))) : null,
  ),
}));

jest.mock('@/lib/automatico/tareas-automaticas', () => ({
  marcarCorrida: (...args: any[]) => (mockMarcarCorrida as any)(...args),
}));

jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true, conClave: true })),
  respuestaDeLaTarea: (_puerta: any, cuerpo: any) => cuerpo,
}));

jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...args: any[]) => (mockAgregarPropuestas as any)(...args),
  guardarResumenMientrasNoEstabas: jest.fn(async () => undefined),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => (mockSendMetaWhatsAppMessage as any)(...args),
}));

jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: (...args: any[]) => (mockSendGoogleGmailMessage as any)(...args),
  ensureFreshGoogleAccount: jest.fn(async (a: any) => a),
  hasServiceAccountKey: () => true,
  getServiceAccountAccessToken: async () => 'tok_google',
  GOOGLE_WORKSPACE_SCOPES: [],
}));

jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: (...args: any[]) => (mockSaveScheduledMessage as any)(...args),
}));

jest.mock('@/lib/whatsapp/internal-token', () => ({
  WHATSAPP_AUTOMATION_INTERNAL_TOKEN: 'tok_int',
  WHATSAPP_WEBHOOK_INTERNAL_TOKEN: 'tok_wh',
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => store.get('fiestas.json') ?? []),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, fn: any) => {
    const arr = store.get('fiestas.json') ?? [];
    const idx = arr.findIndex((f: any) => f.id === id);
    if (idx === -1) return { success: false };
    const updated = await fn(JSON.parse(JSON.stringify(arr[idx])));
    arr[idx] = updated;
    store.set('fiestas.json', arr);
    return { success: true, updatedFiesta: updated };
  }),
}));

jest.mock('@/lib/asistente/comercial-borrador', () => ({
  fotosPromocionalesDeFiesta: jest.fn(async () => [
    { id: 'foto_1', url: 'https://cdn.ak.uy/foto1.jpg' },
  ]),
  validarFotosPromocionalesAlEnviar: jest.fn(async () => ({ allowed: true, authorizedPhotoIds: ['foto_1'] })),
}));

jest.mock('@/lib/presencia-digital/mejor-horario', () => ({
  mejorHorario: jest.fn(() => ({ diaNumero: 1, hora: 22, origen: 'historial' })),
}));

jest.mock('@/lib/social-media/meta-publisher', () => ({
  publishToFacebookPage: jest.fn(async () => ({ success: true })),
  publishToInstagramBusiness: jest.fn(async () => ({ success: true })),
}));
for (const m of ['tiktok-publisher', 'youtube-publisher', 'google-business-publisher', 'pinterest-publisher', 'threads-publisher', 'x-publisher', 'unified-gateway-publisher']) {
  jest.mock(`@/lib/social-media/${m}`, () => new Proxy({}, { get: () => jest.fn(async () => ({ success: true })) }));
}

jest.mock('@/lib/social-media/clasificador-comentarios', () => ({
  clasificarComentario: (...args: any[]) => (mockClasificarComentario as any)(...args),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  getAjustesRespuestasComentarios: jest.fn(async () => ({
    activo: true,
    comentarios: true,
    mensajesDirectos: true,
    agradecerMenciones: true,
  })),
  procesarComentarioRedes: (...args: any[]) => (mockProcesarComentarioRedes as any)(...args),
  syncCommentsFromNetworks: jest.fn(async () => ({
    success: true,
    totalFetched: 0,
    totalNew: 0,
    totalAutoHidden: 0,
    totalClasificados: 0,
    pendientesDeClasificar: 0,
    platforms: {},
    syncedAt: '2026-11-23T12:00:00.000Z',
  })),
}));

jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: jest.fn(async (input: any) => ({
    lead: { id: 'lead_meta_1', name: input.name, atiende: input.atiende || 'asistente' },
    isNew: true,
  })),
}));

jest.mock('@/lib/crm/ia-prospecto', () => ({
  enriquecerLeadExistenteConIA: (...args: any[]) => (mockEnriquecerLead as any)(...args),
  registrarMensajeYAnalizarProspecto: (...args: any[]) => (mockRegistrarMensajeYAnalizar as any)(...args),
}));

jest.mock('@/lib/whatsapp/asistente-de-prospectos', () => {
  const real = jest.requireActual('@/lib/whatsapp/asistente-de-prospectos');
  return {
    ...real,
    atenderProspectoUnificado: (...args: any[]) => mockAtenderProspectoUnificado(...args),
    verificarEsContactoPersonalONotaBaja: (...args: any[]) => (mockVerificarEsContactoPersonal as any)(...args),
    verificarLeadPidePersona: jest.fn(async () => false),
  };
});

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true, llevarWhatsAppProspectosAlCrm: true })),
  processIncomingMessage: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/asistente/por-whatsapp', () => ({
  atenderAlEquipo: jest.fn(async () => ({ atendido: false })),
  atenderProspectoAnuncioWhatsApp: jest.fn(async () => ({ borradorAtendido: false, completo: false })),
  enlaceAlSimuladorDelProspecto: jest.fn(() => 'https://ak.uy/sim'),
}));

jest.mock('@/lib/whatsapp/quien-es-prospecto', () => ({
  evaluarProspectoDeWhatsApp: (...args: any[]) => mockEvaluarProspectoDeWhatsApp(...args),
  esProspectoDeWhatsApp: jest.fn(async () => null),
}));

jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({
  correspondeContestarSolo: jest.fn(async () => false),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({ asistenteProspectosWhatsApp: true, avisosProactivosActivos: true })),
  avisarAlDuenio: jest.fn(async () => null),
  getHoraUruguay: jest.fn(() => 12),
}));

jest.mock('@/lib/commercial/commercial-followup', () => ({
  generateAiCommercialFollowup: jest.fn(async () => ({ success: false })),
}));

jest.mock('@/app/actions/blog', () => ({
  getBlogPosts: jest.fn(async () => store.get('blog-posts.json') ?? []),
}));

const mockAutoGenerarBorradores = jest.fn(async () => ({ success: true, createdCount: 0, tipoOrigen: 'sin_material', posts: [] }));
jest.mock('@/lib/presencia-digital/autogenerador-semanal', () => ({
  autoGenerarBorradoresSemanales: () => mockAutoGenerarBorradores(),
}));

const mockEjecutarAgentesAutonomos = jest.fn(async () => []);
jest.mock('@/lib/agentes/motor-agentes', () => {
  const actual = jest.requireActual('@/lib/agentes/motor-agentes');
  return {
    ...actual,
    ejecutarAgentesAutonomos: (...args: any[]) => mockEjecutarAgentesAutonomos(...args),
  };
});

jest.mock('@/lib/alertas/errores-humanos', () => ({
  detectarErroresHumanos: jest.fn(() => []),
}));
jest.mock('@/lib/automatico/parte-manana', () => ({
  getParteDeLaManana: jest.fn(async () => null),
}));
jest.mock('@/lib/asistente/clima-de-las-fiestas', () => ({
  detectarAlertasClimaFiestas: jest.fn(async () => []),
}));
jest.mock('@/lib/asistente/cierre-posfiesta', () => ({
  ejecutarCierrePosfiesta: jest.fn(async () => ({ nuevasPropuestas: [], errores: [] })),
}));
jest.mock('@/lib/asistente/avisos-operativos-whatsapp', () => ({
  enviarAvisosOperativosWhatsApp: jest.fn(async () => null),
}));
jest.mock('@/lib/firebase/server-messaging', () => ({
  sendPushNotificationToAll: jest.fn(async () => undefined),
}));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({
  getReglaParaTarea: jest.fn(async () => 'apagada'),
}));
jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn(async () => ({ guardado: true, fecha: '2026-11-23' })),
}));
jest.mock('@/lib/social-media/meta-history-backfill', () => ({
  DEFAULT_EARLIEST_DATE: '2019-09-01T00:00:00.000Z',
  syncMetaPublicHistory: jest.fn(async () => ({ success: true, fetched: 0, imported: 0, updated: 0, platforms: [] })),
}));
jest.mock('@/lib/social-media/youtube-history-backfill', () => ({
  syncYouTubePublicHistory: jest.fn(async () => ({ success: true, fetched: 0, imported: 0, updated: 0, complete: true })),
}));
jest.mock('@/lib/social-media/other-public-history-backfill', () => ({
  syncOtherPublicHistory: jest.fn(async () => ({ success: true, platforms: [] })),
}));
jest.mock('@/lib/decoracion/catalog-service', () => ({
  syncDecorationCatalog: jest.fn(async () => ({ sources: 0, added: 0 })),
  processDecorationDraft: jest.fn(async () => ({ processed: false })),
}));
jest.mock('@/ai/genkit', () => ({
  geminiCommercialModel: 'gemini-mock',
  generateWithGeminiFallback: jest.fn(async () => ({ text: 'Resumen competencia: rival1 creció 5%.' })),
}));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
  reservarConsumoIA: jest.fn(async () => ({ liberar: jest.fn(async () => undefined) })),
}));

import {
  calcularProximaFechaMejorHorario,
  procesarBorradoresPublicarSolo,
  procesarPosteosProgramados,
} from '@/lib/presencia-digital/publicador';
import { POST as metaWebhookPOST } from '@/app/api/meta/webhook/route';
import { POST as whatsappWebhookPOST } from '@/app/api/whatsapp/webhook/route';
import { correrTareaRecordatorioInvitados } from '@/lib/invitaciones/recordatorio-invitados';
import { correrTareaRecordarInvitacionNoAbierta } from '@/lib/invitaciones/recordatorio-no-abiertas';
import { GET as asistenteProactivoGET } from '@/app/api/cron/asistente-proactivo/route';
import { GET as metricasRedesGET } from '@/app/api/cron/metricas-de-redes/route';
import {
  getCompetenciaEstado,
  guardarCompetenciaCuentas,
  sincronizarCompetenciaSemanal,
} from '@/lib/presencia-digital/competencia';
import { ejecutarPerseguidorPresupuestos } from '@/lib/agentes/motor-agentes';
import sitemap from '@/app/sitemap';
import { getUruguayParts } from '@/lib/utils';

function firmarMeta(rawBody: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
}

describe('Orden 336 Bloque 5 (Sección H)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.META_APP_SECRET = 'sec_336';
    process.env.META_PAGE_ACCESS_TOKEN = 'tok_page_336';
    process.env.META_WHATSAPP_TOKEN = 'wa_tok_336';
    process.env.META_WHATSAPP_PHONE_ID = 'wa_phone_336';
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ message_id: 'm1' }), { status: 200 })) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('H1: guiones sin video y anuncio de Play Store sin imagen no pasan a Programado ni traban la cola', async () => {
    const ahora = new Date('2026-11-23T15:00:00Z');
    const hace20h = new Date(ahora.getTime() - 20 * 60 * 60 * 1000).toISOString();

    store.set('presencia-digital-ajustes.json', { activo: true });
    store.set('social-connections.json', [
      { platform: 'Instagram', instagramAccountId: 'ig_1', pageAccessToken: 'tok', isConnected: true },
    ]);
    store.set('social-posts.json', [
      {
        id: 'posfiesta-f1-2026-11-01-video-guion',
        sourceId: 'posfiesta-f1-2026-11-01-video-guion',
        platform: 'Instagram',
        text: 'Guion sin archivo',
        status: 'Programado', // incluso si ya había quedado trabado en Programado
        publishDate: hace20h,
        createdAt: hace20h,
        updatedAt: hace20h,
      },
      {
        id: 'anuncio-app-play-store',
        sourceId: 'anuncio-app-play-store',
        platform: 'Instagram',
        text: 'Bajala en Google Play',
        status: 'Borrador',
        publishDate: hace20h,
        createdAt: hace20h,
        updatedAt: hace20h,
      },
      {
        id: 'post-con-foto-ok',
        platform: 'Instagram',
        text: 'Foto aprobada',
        mediaUrl: 'https://cdn.ak.uy/foto1.jpg',
        mediaType: 'image',
        eventId: 'f1',
        status: 'Programado',
        publishDate: hace20h,
        createdAt: hace20h,
        updatedAt: hace20h,
      },
    ]);

    const resBorradores = await procesarBorradoresPublicarSolo(ahora);
    expect(resBorradores.promocionados).toEqual([]);
    expect(resBorradores.descartados).toContain('anuncio-app-play-store');
    expect(resBorradores.descartados).toContain('posfiesta-f1-2026-11-01-video-guion');

    const resCron = await procesarPosteosProgramados(1, ahora);
    expect(resCron.publicados).toEqual(['post-con-foto-ok']);
    expect(resCron.fallados).toEqual([]);
  });

  it('H2: calcularProximaFechaMejorHorario entre 21 y 23 hs UY agenda en el día correcto y no 24h antes', () => {
    // Lunes 23/11/2026 a las 10:00 UY (13:00 UTC)
    const ahora = new Date('2026-11-23T13:00:00.000Z');
    for (const hora of [21, 22, 23]) {
      const iso = calcularProximaFechaMejorHorario({ diaNumero: 1, hora, origen: 'historial' }, ahora);
      const uy = getUruguayParts(new Date(iso));
      expect(uy.year).toBe(2026);
      expect(uy.month).toBe(11);
      expect(uy.day).toBe(23);
      expect(uy.hour).toBe(hora);
    }
  });

  it('H3: Meta webhook llama a procesarComentarioRedes, usa prefijo ig_/fb_, pasa esCliente y no anota respuesta si Meta API falla', async () => {
    store.set('customers.json', [{ id: 'c1', name: 'Sofía Contratada', estadoCliente: 'Actual' }]);
    store.set('social-comments.json', []);
    store.set('social-mensajes-directos.json', []);

    // 1) Comentario de Instagram -> debe guardarse como ig_<id> y llamar a procesarComentarioRedes
    const payloadComentario = JSON.stringify({
      object: 'instagram',
      entry: [{
        id: 'ig_page',
        changes: [{
          field: 'comments',
          value: { id: 'comm_900', text: 'Hermosa fiesta!', from: { id: 'u_900', username: 'ana_uy' } },
        }],
      }],
    });
    const resComm = await metaWebhookPOST(new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': firmarMeta(payloadComentario, 'sec_336') },
      body: payloadComentario,
    }));
    expect(resComm.status).toBe(200);
    expect(mockProcesarComentarioRedes).toHaveBeenCalledTimes(1);
    const guardados = store.get('social-comments.json');
    expect(guardados[0].id).toBe('ig_comm_900');
    expect(guardados[0].network).toBe('Instagram');

    // 2) DM de cliente contratada -> pasa esCliente: true a atenderProspectoUnificado
    mockAtenderProspectoUnificado.mockResolvedValueOnce({
      silenciado: true,
      motivo: 'cliente_contratado_atencion_personalizada',
      atiende: 'persona',
      datos: {},
      refCode: 'AK-1',
    });
    const payloadCliente = JSON.stringify({
      object: 'instagram',
      entry: [{
        id: 'ig_page',
        messaging: [{
          sender: { id: 'ig_cli_1', name: 'Sofía Contratada' },
          recipient: { id: 'ig_page' },
          message: { mid: 'mid_cli_1', text: 'Hola, una consulta de mi fiesta' },
        }],
      }],
    });
    await metaWebhookPOST(new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': firmarMeta(payloadCliente, 'sec_336') },
      body: payloadCliente,
    }));
    expect(mockAtenderProspectoUnificado).toHaveBeenCalledWith(
      expect.objectContaining({ esCliente: true, remitenteId: 'ig_cli_1' }),
    );

    // 3) DM cuando Meta API devuelve error -> NO registra mensaje saliente en CRM ni marca contestado
    mockAtenderProspectoUnificado.mockResolvedValueOnce({
      silenciado: false,
      respuesta: '¡Hola! Te ayudo.',
      atiende: 'asistente',
      datos: {},
      refCode: 'AK-2',
    });
    global.fetch = jest.fn(async () => new Response('error', { status: 500 })) as any;

    const payloadFalloEnvio = JSON.stringify({
      object: 'page',
      entry: [{
        id: 'fb_page',
        messaging: [{
          sender: { id: 'fb_p_2', name: 'Prosp Nuevo' },
          recipient: { id: 'fb_page' },
          message: { mid: 'mid_fail_1', text: 'Precio por favor' },
        }],
      }],
    });
    const resFallo = await metaWebhookPOST(new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': firmarMeta(payloadFalloEnvio, 'sec_336') },
      body: payloadFalloEnvio,
    }));
    const dataFallo = await resFallo.json();
    expect(dataFallo.respuestasEnviadas).toBe(0);
    expect(mockRegistrarMensajeYAnalizar).not.toHaveBeenCalled();
    const dms = store.get('social-mensajes-directos.json');
    expect(dms.find((d: any) => d.mid === 'mid_fail_1')?.contestado).toBe(false);
  });

  it('H4: WhatsApp webhook no finge interruptor_apagado ante fallo de evaluación y sincronizarEstadoEnCrmLead usa transacción', async () => {
    mockEvaluarProspectoDeWhatsApp.mockRejectedValueOnce(new Error('Timeout tras 8000ms'));
    const req = new NextRequest('https://ak.uy/api/whatsapp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone: '59899111333', message: 'Hola quiero presupuesto', name: 'Juan' }),
    });
    const res = await whatsappWebhookPOST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.requiereRevision).toBe(true);
    expect(body.respondido).toBe(false);
    expect(mockAgregarPropuestas).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ clave: expect.stringContaining('whatsapp-evaluacion-pendiente:') })]),
    );

    // Sincronización con transacción cuando hay base (AK_USE_LOCAL_JSON_ONLY !== 'true')
    process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
    const realAsistente = jest.requireActual('@/lib/whatsapp/asistente-de-prospectos');
    store.set('crm-leads.json', [
      { id: 'lead_handoff_1', name: 'Laura', phone: '099444555', atiende: 'asistente' },
    ]);
    await realAsistente.atenderProspectoUnificado({
      canal: 'whatsapp',
      remitenteId: '099444555',
      nombre: 'Laura',
      texto: 'Quiero una persona',
      ahora: new Date('2026-11-23T15:00:00Z'),
    });
    expect(mockMutateDataItem).toHaveBeenCalledWith(
      'crm-leads.json',
      'crm_leads',
      'lead_handoff_1',
      expect.any(Function),
    );
    expect(mockWriteData).not.toHaveBeenCalledWith('crm-leads.json', expect.anything());
  });

  it('H5: recordatorios a invitados excluyen fiestas suspendidas, archivadas, canceladas y de muestra', async () => {
    const fechaEnDosDias = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fechaEnDiezDias = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const invitados = [{ id: 'inv_1', nombre: 'Ana', contacto: '099111222', rsvp: 'Confirmado' }];
    const invitadosNoAbiertos = [{ id: 'inv_2', nombre: 'Luis', contacto: '099333444' }];

    store.set('fiestas.json', [
      { id: 'demo_1', estado: 'En Planificación', configuracion: { fechaEvento: fechaEnDosDias, nombreEvento: 'Demo' }, invitados },
      { id: 'f_susp', estado: 'suspendida', configuracion: { fechaEvento: fechaEnDosDias, nombreEvento: 'Susp' }, invitados },
      { id: 'f_arch', estado: 'Archivado', configuracion: { fechaEvento: fechaEnDiezDias, nombreEvento: 'Arch' }, invitados: invitadosNoAbiertos },
      { id: 'f_canc', estado: 'cancelada', configuracion: { fechaEvento: fechaEnDiezDias, nombreEvento: 'Canc' }, invitados: invitadosNoAbiertos },
    ]);
    store.set('ajustes-recordatorio-invitacion.json', { activo: true });

    const r1 = await correrTareaRecordatorioInvitados();
    expect(r1.mensajesPreparados).toBe(0);
    expect(mockSaveScheduledMessage).not.toHaveBeenCalled();

    const r2 = await correrTareaRecordarInvitacionNoAbierta(new Date());
    expect(r2.enviados).toBe(0);
    expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();
  });

  it('H6: despertadores usan día de Uruguay, no marcan corrida si fallan pasos internos, y competencia guarda resumen y respeta 7 días', async () => {
    // 1) Lunes 22:30 UY = Martes 01:30 UTC: asistente-proactivo igual reconoce Lunes UY
    store.set('fiestas.json', []);
    store.set('presupuestos.json', []);
    store.set('salones.json', []);
    jest.useFakeTimers().setSystemTime(new Date('2026-11-24T01:30:00.000Z'));
    try {
      await asistenteProactivoGET(new Request('http://localhost/api/cron/asistente-proactivo'));
      expect(mockAutoGenerarBorradores).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }

    // 2) Si falla un paso interno en asistente-proactivo -> ok: false y NO marcarCorrida
    mockMarcarCorrida.mockClear();
    mockEjecutarAgentesAutonomos.mockRejectedValueOnce(new Error('Fallo agente'));
    const resAsistFail = await asistenteProactivoGET(new Request('http://localhost/api/cron/asistente-proactivo'));
    const bodyAsistFail = await resAsistFail.json();
    expect(resAsistFail.status).toBe(500);
    expect(bodyAsistFail.ok).toBe(false);
    expect(mockMarcarCorrida).not.toHaveBeenCalled();

    // 3) Si falla un paso interno en metricas-de-redes -> ok: false y NO marcarCorrida
    mockMarcarCorrida.mockClear();
    const { syncCommentsFromNetworks } = jest.requireMock('@/lib/social-media/comments-backfill');
    syncCommentsFromNetworks.mockRejectedValueOnce(new Error('Fallo comentarios'));
    const resMetricasFail = await metricasRedesGET(new Request('http://localhost/api/cron/metricas-de-redes'));
    const bodyMetricasFail = await resMetricasFail.json();
    expect(resMetricasFail.status).toBe(500);
    expect(bodyMetricasFail.ok).toBe(false);
    expect(mockMarcarCorrida).not.toHaveBeenCalled();

    // 4) Competencia guarda resumenIA y evita volver a consultar antes de los 7 días
    await guardarCompetenciaCuentas([{ username: 'rival_ak', activo: true, seguidores: 300, publicacionesCount: 20 }]);
    const t0 = new Date('2026-11-20T12:00:00Z');
    await sincronizarCompetenciaSemanal({ ahora: t0 });
    const estadoTrasSync = await getCompetenciaEstado();
    expect(estadoTrasSync.resumenIA).toContain('Resumen competencia');

    const genkit = jest.requireMock('@/ai/genkit');
    genkit.generateWithGeminiFallback.mockClear();
    // 2 días después no debe volver a consultar ni gastar IA
    await sincronizarCompetenciaSemanal({ ahora: new Date('2026-11-22T12:00:00Z') });
    expect(genkit.generateWithGeminiFallback).not.toHaveBeenCalled();
  });

  it('H7: perseguidor_presupuestos no duplica mensajes aunque el anterior ya haya sido enviado o cancelado', async () => {
    const haceSeisDias = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    store.set('presupuestos.json', [
      {
        id: 'pres_99',
        clienteNombre: 'Martina',
        clienteContacto: '099888111',
        eventoTipo: '15 años',
        eventoFecha: '2027-03-10',
        timestamp: haceSeisDias,
        estado: 'Enviado',
      },
    ]);
    store.set('scheduled-messages.json', []);
    store.set('crm-leads.json', []);

    const r1 = await ejecutarPerseguidorPresupuestos(new Date());
    expect(r1.estado).toBe('exito');
    expect(store.get('scheduled-messages.json')).toHaveLength(1);

    // El dueño envía el mensaje (cambia de 'pendiente' a 'enviado')
    const msgs = store.get('scheduled-messages.json');
    msgs[0].status = 'enviado';
    store.set('scheduled-messages.json', msgs);

    const r2 = await ejecutarPerseguidorPresupuestos(new Date(Date.now() + 24 * 60 * 60 * 1000));
    expect(r2.estado).toBe('sin_novedades');
    expect(store.get('scheduled-messages.json')).toHaveLength(1);
  });

  it('H8: sitemap excluye notas en estado borrador o programadas a futuro', async () => {
    store.set('blog-posts.json', [
      {
        slug: 'nota-publicada-ok',
        title: 'Nota pública',
        publishedAt: '2026-10-01',
        status: 'published',
      },
      {
        slug: 'nota-borrador-secreto',
        title: 'Borrador interno',
        publishedAt: '2026-10-01',
        status: 'draft',
      },
      {
        slug: 'nota-borrador-es',
        title: 'Borrador español',
        publishedAt: '2026-10-01',
        status: 'borrador',
      },
      {
        slug: 'nota-futura-programada',
        title: 'Nota futura',
        publishedAt: '2099-01-01',
        status: 'scheduled',
      },
    ]);

    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith('/public/blog/nota-publicada-ok'))).toBe(true);
    expect(urls.some((u) => u.endsWith('/public/blog/nota-borrador-secreto'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/public/blog/nota-borrador-es'))).toBe(false);
    expect(urls.some((u) => u.endsWith('/public/blog/nota-futura-programada'))).toBe(false);
  });
});
