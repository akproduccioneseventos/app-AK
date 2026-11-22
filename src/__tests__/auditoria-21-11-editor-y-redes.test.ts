/** @jest-environment node */
/**
 * Orden 333 — Bloques 5 y 6: AK Editor, Meta webhook, WhatsApp webhook y horario Uruguay de recordatorios.
 */
import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { NextRequest } from 'next/server';

const memoryStore: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (key: string, def: any) =>
    memoryStore[key] === undefined ? def : JSON.parse(JSON.stringify(memoryStore[key])),
  ),
  writeData: jest.fn(async (key: string, val: any) => {
    memoryStore[key] = JSON.parse(JSON.stringify(val));
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (key: string, fn: (arr: any[]) => any[] | null) => {
    const actual = Array.isArray(memoryStore[key]) ? JSON.parse(JSON.stringify(memoryStore[key])) : [];
    const next = fn(actual);
    if (next !== null) memoryStore[key] = JSON.parse(JSON.stringify(next));
    return next;
  }),
  mutarDocumentoConTransaccion: jest.fn(async (key: string, def: any, fn: (doc: any) => any | null) => {
    const actual = memoryStore[key] === undefined ? JSON.parse(JSON.stringify(def)) : JSON.parse(JSON.stringify(memoryStore[key]));
    const next = fn(actual);
    if (next !== null) memoryStore[key] = JSON.parse(JSON.stringify(next));
    return next ?? actual;
  }),
  readGenericJsonFile: jest.fn(async (key: string, def: any) =>
    memoryStore[key] === undefined ? def : JSON.parse(JSON.stringify(memoryStore[key])),
  ),
}));

const mockAtenderProspectoUnificado = jest.fn();
const mockVerificarEsContactoPersonal = jest.fn();
jest.mock('@/lib/whatsapp/asistente-de-prospectos', () => {
  const actual = jest.requireActual('@/lib/whatsapp/asistente-de-prospectos');
  return {
    ...actual,
    atenderProspectoUnificado: (...args: any[]) => mockAtenderProspectoUnificado(...args),
    verificarEsContactoPersonalONotaBaja: (...args: any[]) => mockVerificarEsContactoPersonal(...args),
  };
});

const mockUpsertPublicCommercialLead = jest.fn();
jest.mock('@/lib/crm/public-lead-persistence', () => ({
  upsertPublicCommercialLead: (...args: any[]) => mockUpsertPublicCommercialLead(...args),
}));

jest.mock('@/lib/crm/ia-prospecto', () => ({
  enriquecerLeadExistenteConIA: jest.fn(async () => ({})),
  registrarMensajeYAnalizarProspecto: jest.fn(async () => null),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  getAjustesRespuestasComentarios: jest.fn(async () => ({
    activo: true,
    comentarios: true,
    mensajesDirectos: true,
    agradecerMenciones: true,
  })),
  syncCommentsFromNetworks: jest.fn(async () => ({})),
}));

const mockAgregarPropuestas = jest.fn(async () => undefined);
jest.mock('@/lib/asistente/propuestas-service', () => ({
  agregarPropuestasDeduplicadas: (...args: any[]) => mockAgregarPropuestas(...args),
}));

const mockSendMetaWhatsAppMessage = jest.fn();
jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true, llevarWhatsAppProspectosAlCrm: true })),
  processIncomingMessage: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => ({
  getAsistenteSettings: jest.fn(async () => ({ asistenteProspectosWhatsApp: true })),
}));

jest.mock('@/lib/whatsapp/quien-es-prospecto', () => ({
  evaluarProspectoDeWhatsApp: jest.fn(async () => ({
    esProspecto: true,
    motivo: 'llego_solo',
    notaIA: 4,
    esDudoso: false,
  })),
  esProspectoDeWhatsApp: jest.fn(async () => 'llego_solo'),
}));

jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({
  correspondeContestarSolo: jest.fn(async () => false),
}));

jest.mock('@/lib/presencia-digital/guardado-diario', () => ({
  guardarMetricasDelDia: jest.fn(async () => ({})),
}));
jest.mock('@/lib/presencia-digital/publicador', () => ({
  procesarPosteosProgramados: jest.fn(async () => ({})),
}));
jest.mock('@/lib/marketing-automation', () => ({
  runMarketingAutomation: jest.fn(async () => ({})),
}));
jest.mock('@/app/actions/invoices', () => ({
  ejecutarEscaneoDeRecordatorios: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/app/actions/notifications', () => ({
  checkAndCreateReunionReminders: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/automatico/posicionamiento-diario', () => ({
  ejecutarRevisionPosicionamiento: jest.fn(async () => ({})),
}));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  ejecutarVigilanteFiestas: jest.fn(async () => ({})),
  ejecutarPerseguidorPresupuestos: jest.fn(async () => ({})),
  ejecutarAgentesAutonomos: jest.fn(async () => ({})),
}));
jest.mock('@/lib/whatsapp/avisos-al-cliente', () => ({
  correrTareaAvisosAlCliente: jest.fn(async () => ({})),
}));
const mockRecordatorioInvitados = jest.fn(async () => ({ ok: true, mensajesPreparados: 0, errores: [] }));
const mockRecordarNoAbiertas = jest.fn(async () => ({ corrio: true, totalFiestas: 0, totalInvitadosEvaluados: 0, enviados: 0, fallados: 0, omitidos: 0 }));
jest.mock('@/lib/invitaciones/recordatorio-invitados', () => ({
  correrTareaRecordatorioInvitados: () => mockRecordatorioInvitados(),
}));
jest.mock('@/lib/invitaciones/recordatorio-no-abiertas', () => ({
  correrTareaRecordarInvitacionNoAbierta: () => mockRecordarNoAbiertas(),
}));

import { verificarLeadPidePersona } from '@/lib/whatsapp/asistente-de-prospectos';
import { POST as metaWebhookPOST } from '@/app/api/meta/webhook/route';
import { POST as whatsappWebhookPOST } from '@/app/api/whatsapp/webhook/route';
import { ponerAlDiaAlEntrar } from '@/lib/automatico/al-entrar-a-la-app';
import { resetearLockEnMemoria } from '@/lib/automatico/control-concurrencia';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

function firmarMeta(bodyStr: string, secret: string): string {
  return `sha256=${crypto.createHmac('sha256', secret).update(bodyStr).digest('hex')}`;
}

describe('Orden 333 — Bloque 5 (AK Editor) y Bloque 6 (Redes, WhatsApp y recordatorios)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(memoryStore)) delete memoryStore[k];
    resetearLockEnMemoria();
    process.env.META_APP_SECRET = 'meta-secret-333';
    process.env.META_PAGE_ACCESS_TOKEN = 'meta-page-token-333';
    global.fetch = jest.fn(async () => new Response(JSON.stringify({ message_id: 'ok' }), { status: 200 })) as any;
  });

  afterEach(() => {
    delete process.env.META_APP_SECRET;
    delete process.env.META_PAGE_ACCESS_TOKEN;
    global.fetch = originalFetch;
  });

  it('Bloque 5: AK Editor usa imdecode, -shortest en redes.py y reporta "No se pudo armar el video" si exportar_ok es falso', () => {
    const redesPy = leer('herramientas/ak-editor/redes.py');
    const vidaPy = leer('herramientas/ak-editor/video_de_vida.py');
    const appPy = leer('herramientas/ak-editor/app.py');

    expect(redesPy).toContain('cv2.imdecode');
    expect(redesPy).toContain('np.fromfile');
    expect(redesPy).toContain('-shortest');
    expect(redesPy).not.toContain('cv2.imread(');

    expect(vidaPy).toContain('cv2.imdecode');
    expect(vidaPy).toContain('np.fromfile');
    expect(vidaPy).not.toContain('cv2.imread(');

    expect(appPy).toContain('No se pudo armar el video');

    // Comportamiento real en Python: ejecutar_modo_automatico con carpeta sin videos falla con "No se pudo armar el video"
    const pyScript = `
import json, os, sys, tempfile
sys.path.insert(0, os.path.abspath("herramientas/ak-editor"))
import app
with tempfile.TemporaryDirectory() as d_in, tempfile.TemporaryDirectory() as d_out:
    res = app.ejecutar_modo_automatico(d_in, carpeta_salida=d_out, fiesta_nombre="Prueba333")
    print(json.dumps({"ok": res["ok"], "estado": app.ESTADO_AUTOMATICO["mensaje"], "entrega": res["mensaje_entrega_listo"]}, ensure_ascii=False))
`;
    const venvPython = path.join(process.cwd(), 'herramientas', 'ak-editor', '.venv', 'Scripts', 'python.exe');
    const pythonBin = fs.existsSync(venvPython) ? venvPython : 'python';
    // El editor corre en la computadora del dueño, con OpenCV instalado. Donde no está (contenedores de prueba),
    // la parte en Python no puede cargar y se queda con las comprobaciones del texto de arriba.
    let hayOpenCv = true;
    try { execFileSync(pythonBin, ['-c', 'import cv2, numpy'], { stdio: 'ignore' }); } catch { hayOpenCv = false; }
    if (!hayOpenCv) return;
    const salida = execFileSync(pythonBin, ['-c', pyScript], { encoding: 'utf8' }).trim();
    const parsed = JSON.parse(salida);
    expect(parsed.ok).toBe(false);
    expect(parsed.estado).toContain('No se pudo armar el video');
  });

  it('Bloque 6.1: verificarLeadPidePersona detecta Instagram DM y Messenger; Meta webhook contesta sólo si no atiende una persona', async () => {
    const claveIg = 'instagram_dm:ig_user_99';
    const expectedKey = crypto.createHash('sha256').update(`sin-telefono|${claveIg}|${claveIg}`).digest('hex');

    memoryStore['crm-leads.json'] = [
      {
        id: `lead_public_${expectedKey.slice(0, 24)}`,
        name: 'Sofía IG',
        phone: '',
        publicIdentityKey: expectedKey,
        atiende: 'persona',
      },
    ];

    expect(await verificarLeadPidePersona('instagram_dm', 'ig_user_99')).toBe(true);
    expect(await verificarLeadPidePersona('instagram_dm', 'ig_otro')).toBe(false);

    // 1) Cuando ya atiende una persona -> Meta webhook NO contesta solo
    mockUpsertPublicCommercialLead.mockResolvedValueOnce({
      lead: { id: `lead_public_${expectedKey.slice(0, 24)}`, name: 'Sofía IG', atiende: 'persona' },
      isNew: false,
    });
    const bodyPersona = JSON.stringify({
      object: 'instagram',
      entry: [{
        messaging: [{
          sender: { id: 'ig_user_99', name: 'Sofía IG' },
          recipient: { id: 'ak_page' },
          message: { mid: 'mid_ig_persona_1', text: 'Hola, ¿me responden?' },
          timestamp: Date.now(),
        }],
      }],
    });
    const resPersona = await metaWebhookPOST(new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': firmarMeta(bodyPersona, 'meta-secret-333') },
      body: bodyPersona,
    }));
    const dataPersona = await resPersona.json();
    expect(dataPersona.respuestasEnviadas).toBe(0);
    expect(mockAtenderProspectoUnificado).not.toHaveBeenCalled();

    // 2) Prospecto nuevo en Messenger -> llama a atenderProspectoUnificado y envía respuesta a Meta
    mockUpsertPublicCommercialLead.mockResolvedValueOnce({
      lead: { id: 'lead_msg_1', name: 'Lucas FB', atiende: 'asistente' },
      isNew: true,
    });
    mockAtenderProspectoUnificado.mockResolvedValueOnce({
      silenciado: false,
      respuesta: '¡Hola! Soy el asistente de AK.',
      atiende: 'asistente',
      datos: {},
      refCode: 'AK-123456',
    });

    const bodyMsg = JSON.stringify({
      object: 'page',
      entry: [{
        messaging: [{
          sender: { id: 'fb_user_1', name: 'Lucas FB' },
          recipient: { id: 'ak_page' },
          message: { mid: 'mid_fb_1', text: 'Hola, quiero presupuesto' },
          timestamp: Date.now(),
        }],
      }],
    });
    const resMsg = await metaWebhookPOST(new NextRequest('http://localhost/api/meta/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': firmarMeta(bodyMsg, 'meta-secret-333') },
      body: bodyMsg,
    }));
    const dataMsg = await resMsg.json();
    expect(mockAtenderProspectoUnificado).toHaveBeenCalledWith(
      expect.objectContaining({ canal: 'messenger', remitenteId: 'fb_user_1' }),
    );
    expect(dataMsg.respuestasEnviadas).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('graph.facebook.com/v18.0/me/messages'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('Bloque 6.2: WhatsApp webhook si el control de contacto personal falla o tarda, NO contesta ni guarda en CRM y anota para revisar', async () => {
    const waSrc = leer('src/app/api/whatsapp/webhook/route.ts');
    expect(waSrc).not.toContain('bloquear: false }');

    mockVerificarEsContactoPersonal.mockRejectedValueOnce(new Error('Timeout tras 1200ms'));

    const req = new NextRequest('https://akproducciones.uy/api/whatsapp/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        phone: '59899111222',
        message: 'Hola, ¿qué tal?',
        name: 'Contacto Desconocido',
      }),
    });

    const res = await whatsappWebhookPOST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.respondido).toBe(false);
    expect(data.savedToCrm).toBe(false);
    expect(data.requiereRevision).toBe(true);
    expect(mockUpsertPublicCommercialLead).not.toHaveBeenCalled();
    expect(mockAtenderProspectoUnificado).not.toHaveBeenCalled();
    expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();
    expect(mockAgregarPropuestas).toHaveBeenCalled();
  });

  it('Bloque 6.3: recordatorios a invitados solo corren entre las 9 y las 21 de Uruguay', async () => {
    // 03:00 AM Uruguay = 06:00 UTC -> debe omitirse sin correr
    const madrugada = await ponerAlDiaAlEntrar(new Date('2026-11-21T06:00:00.000Z'), 'visita_publica');
    expect(madrugada.omitidas).toContain('recordatorio_invitados');
    expect(madrugada.omitidas).toContain('recordar_invitacion');
    expect(madrugada.corrio).not.toContain('recordatorio_invitados');
    expect(madrugada.corrio).not.toContain('recordar_invitacion');
    expect(mockRecordatorioInvitados).not.toHaveBeenCalled();
    expect(mockRecordarNoAbiertas).not.toHaveBeenCalled();

    // 21:30 Uruguay = 00:30 UTC del día siguiente -> fuera de ventana (9..21)
    resetearLockEnMemoria();
    const noche = await ponerAlDiaAlEntrar(new Date('2026-11-22T00:30:00.000Z'), 'visita_publica');
    expect(noche.omitidas).toContain('recordatorio_invitados');
    expect(noche.omitidas).toContain('recordar_invitacion');
    expect(mockRecordatorioInvitados).not.toHaveBeenCalled();
    expect(mockRecordarNoAbiertas).not.toHaveBeenCalled();

    // 14:00 Uruguay = 17:00 UTC -> dentro de 9..21, corre aunque haya sido omitida de madrugada
    resetearLockEnMemoria();
    const tarde = await ponerAlDiaAlEntrar(new Date('2026-11-21T17:00:00.000Z'), 'despertador');
    expect(tarde.corrio).toContain('recordatorio_invitados');
    expect(tarde.corrio).toContain('recordar_invitacion');
    expect(mockRecordatorioInvitados).toHaveBeenCalledTimes(1);
    expect(mockRecordarNoAbiertas).toHaveBeenCalledTimes(1);
  });
});
