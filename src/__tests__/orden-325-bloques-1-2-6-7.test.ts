/** @jest-environment node */

import crypto from 'crypto';
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { NextRequest } from 'next/server';

const copia = <T,>(val: T): T => JSON.parse(JSON.stringify(val));
const store = new Map<string, any>();
let fiestasStore: any[] = [];
let sessionMock: { success: boolean; user?: any } = {
  success: true,
  user: { userId: 'admin_1', perfil: 'dueno', role: 'admin' },
};

const mockDecidir = jest.fn();
const mockCreateNotification = jest.fn(async (data: any) => ({
  success: true,
  notification: { id: `notif_${Date.now()}`, ...data, fecha: new Date().toISOString(), leida: false },
}));
const mockCheckDateAvailability = jest.fn(async (fecha: string) => ({
  isOccupied: fecha === '2027-11-20',
  suggestions: fecha === '2027-11-20' ? ['2027-11-21', '2027-11-26'] : undefined,
}));
const mockClasificarComentario = jest.fn(async (texto: string) => ({
  classified: true,
  sentiment: 'neutro',
  esPregunta: texto.includes('?') || /cu[aá]nto|precio|fecha/i.test(texto),
  isInsultOrSpam: false,
  isLegitimateComplaint: false,
  autoHideRecommended: false,
  debeResponder: true,
}));

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (store.has(file)) return copia(store.get(file));
    return copia(fallback);
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    store.set(file, copia(data));
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, cambiar: (arr: any[]) => any[] | null) => {
    const actual = store.has(file) ? copia(store.get(file)) : [];
    const nueva = cambiar(actual);
    if (nueva !== null) store.set(file, copia(nueva));
    return nueva;
  }),
}));

jest.mock('@/lib/ai/decisiones', () => ({
  decidir: (...args: any[]) => mockDecidir(...args),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => copia(fiestasStore)),
  leerHistorialCrudo: jest.fn(async () => []),
}));

jest.mock('@/app/actions/simulador-v2', () => ({
  checkDateAvailability: (...args: any[]) => mockCheckDateAvailability(...args),
}));

jest.mock('@/lib/social-media/clasificador-comentarios', () => ({
  clasificarComentario: (...args: any[]) => mockClasificarComentario(...args),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sessionMock),
  generateBudgetToken: jest.fn(async () => 'tok_test'),
}));

jest.mock('@/lib/auth/require-session', () => {
  const { puede } = jest.requireActual('@/lib/auth/perfiles');
  return {
    hasAppSession: jest.fn(async () => Boolean(sessionMock.success)),
    requireAppSession: jest.fn(async () => sessionMock.user),
    requirePermiso: jest.fn(async (permiso: string) => {
      if (!sessionMock.success || !puede(sessionMock.user, permiso)) {
        return { ok: false, error: 'Sin permiso' };
      }
      return { ok: true, user: sessionMock.user };
    }),
    requirePermisoAlguno: jest.fn(async (...permisos: string[]) => {
      if (!sessionMock.success || !permisos.some((p) => puede(sessionMock.user, p))) {
        throw new Error('Sin permiso');
      }
      return sessionMock.user;
    }),
  };
});

jest.mock('@/lib/asistente/por-whatsapp', () => {
  const real = jest.requireActual('@/lib/asistente/por-whatsapp');
  return {
    extraerDatosPresupuestoProspecto: real.extraerDatosPresupuestoProspecto,
    enlaceAlSimuladorDelProspecto: real.enlaceAlSimuladorDelProspecto,
    atenderAlEquipo: jest.fn(async () => ({ atendido: false })),
    atenderProspectoAnuncioWhatsApp: jest.fn(async () => ({
      completo: false,
      faltantes: ['fecha'],
      borradorAtendido: false,
      respuestaTexto: '',
    })),
  };
});

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(async () => ({ success: true, messageId: 'wamid_out_1' })),
}));

import { buildWhatsAppLink, extractWhatsAppRefCode } from '@/lib/commercial/contact';
import { esProspectoDeWhatsApp } from '@/lib/whatsapp/quien-es-prospecto';
import { POST as whatsappWebhookPOST } from '@/app/api/whatsapp/webhook/route';
import { POST as metaWebhookPOST } from '@/app/api/meta/webhook/route';
import { captureSimulatorLeadProgress } from '@/app/actions/armado-rapido';
import { confirmarProspectoDudoso } from '@/app/actions/crm';
import { leerBandejaUnica } from '@/lib/mensajes/bandeja-unica';
import {
  extraerCharlasDesdeArchivos,
  procesarCharlasViejasWhatsApp,
} from '@/lib/whatsapp/rescatar-charlas';

function buildMetaWhatsAppRequest(params: {
  from: string;
  name?: string;
  body: string;
  messageId?: string;
  referral?: { source_type?: string; source_id?: string; headline?: string };
}) {
  return new NextRequest('https://ak.test/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                contacts: [{ profile: { name: params.name || 'Contacto' } }],
                messages: [
                  {
                    id: params.messageId || `wamid_${Date.now()}_${Math.random()}`,
                    from: params.from,
                    type: 'text',
                    text: { body: params.body },
                    ...(params.referral ? { referral: params.referral } : {}),
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
  });
}

function buildSignedMetaRequest(payload: Record<string, any>, secret: string) {
  const rawBody = JSON.stringify(payload);
  const sig = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  return new NextRequest('https://ak.test/api/meta/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': sig,
    },
    body: rawBody,
  });
}

describe('Orden 325 — Bloques 1, 2, 6 y 7', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    store.clear();
    fiestasStore = [];
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.META_APP_SECRET = 'meta-secret-325';
    store.set('whatsapp-config.json', {
      enabled: true,
      provider: 'meta',
      mode: 'manual',
      llevarWhatsAppProspectosAlCrm: true,
      numerosPersonales: [],
    });
    store.set('crm-leads.json', []);
    store.set('customers.json', []);
    store.set('presupuestos.json', []);
    store.set('empleados.json', []);
    store.set('proveedores.json', []);
    store.set('social-mensajes-directos.json', []);
    store.set('social-comments.json', []);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('marca corta (ref AK-...) en buildWhatsAppLink se agrega con id o página y se extrae', () => {
    const linkLead = buildWhatsAppLink('099123456', 'Hola!', { leadId: 'lead_abc123' });
    expect(decodeURIComponent(linkLead)).toContain('(ref AK-lead_abc123)');
    expect(extractWhatsAppRefCode(decodeURIComponent(linkLead))).toBe('lead_abc123');

    const linkPagina = buildWhatsAppLink('099123456', 'Consulto por boda', { pagina: 'landing_bodas' });
    expect(decodeURIComponent(linkPagina)).toContain('(ref AK-landing_bodas)');
    expect(extractWhatsAppRefCode('Hola quiero info (ref AK-landing_bodas)')).toBe('landing_bodas');
  });

  it('con el interruptor apagado (por defecto false), WhatsApp común no entra al CRM', async () => {
    store.set('whatsapp-config.json', { enabled: true }); // sin llevarWhatsAppProspectosAlCrm
    const motivo = await esProspectoDeWhatsApp('59899111222', null, 'Hola quiero presupuesto');
    expect(motivo).toBeNull();

    const res = await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899111222',
        name: 'Desconocido',
        body: 'Hola quiero presupuesto',
      }),
    );
    expect(await res.json()).toMatchObject({ respondido: false });
    expect(store.get('crm-leads.json')).toEqual([]);
  });

  it('mensaje personal no se guarda en el CRM', async () => {
    mockDecidir.mockResolvedValueOnce({
      consulta_de_evento: { valor: false, siNo: false },
      seguridad: { valor: 1, nota: 1 },
    });

    const motivo = await esProspectoDeWhatsApp('59899444555', null, 'Che, ¿a qué hora comemos hoy en casa?');
    expect(motivo).toBeNull();

    mockDecidir.mockResolvedValueOnce({
      consulta_de_evento: { valor: false, siNo: false },
      seguridad: { valor: 1, nota: 1 },
    });
    const res = await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899444555',
        name: 'Mamá',
        body: 'Che, ¿a qué hora comemos hoy en casa?',
        messageId: 'wamid_personal_1',
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ respondido: false });
    expect(store.get('crm-leads.json')).toEqual([]);
  });

  it('número en Números personales es rechazado aunque venga de anuncio, CRM o tenga marca (ref AK-...)', async () => {
    store.set('whatsapp-config.json', {
      enabled: true,
      llevarWhatsAppProspectosAlCrm: true,
      numerosPersonales: ['099 888 777'],
    });
    store.set('crm-leads.json', [
      { id: 'lead_existente', name: 'Tío Roberto', phone: '099888777', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' },
    ]);

    const motivo = await esProspectoDeWhatsApp(
      '59899888777',
      { source_type: 'ad', source_id: 'ad_1' },
      'Hola (ref AK-lead_existente) quiero info de fiesta',
    );
    expect(motivo).toBeNull();

    const res = await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899888777',
        name: 'Tío Roberto',
        body: 'Hola (ref AK-lead_existente) quiero info de fiesta',
        referral: { source_type: 'ad', source_id: 'ad_1' },
        messageId: 'wamid_tio_1',
      }),
    );
    expect(await res.json()).toMatchObject({ respondido: false });
    const leads = store.get('crm-leads.json');
    expect(leads[0].conversacion).toBeUndefined();
  });

  it('cliente con fiesta ya contratada es rechazado y no entra como prospecto', async () => {
    store.set('customers.json', [
      { id: 'cust_1', name: 'Sofía Martínez', phone: '099222333', estadoCliente: 'Actual', partyDate: '2026-12-20' },
    ]);

    const motivo = await esProspectoDeWhatsApp('59899222333', null, 'Hola, ¿a qué hora va el DJ a mi fiesta?');
    expect(motivo).toBeNull();

    const res = await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899222333',
        name: 'Sofía',
        body: 'Hola, ¿a qué hora va el DJ a mi fiesta?',
        messageId: 'wamid_cliente_1',
      }),
    );
    expect(await res.json()).toMatchObject({ respondido: false });
    expect(store.get('crm-leads.json')).toEqual([]);
  });

  it('mensaje tras simulador queda unificado en conversacion del mismo prospecto', async () => {
    const simRes = await captureSimulatorLeadProgress({
      clienteNombre: 'Lucía Fernández',
      clienteContacto: '099555666',
      eventoTipo: 'XV años',
      eventoFecha: '2027-10-15',
      invitados: 120,
      salonFiestas: 'Club Uruguay',
    });
    expect(simRes.success).toBe(true);

    const leadsDespuesSim = store.get('crm-leads.json');
    expect(leadsDespuesSim).toHaveLength(1);
    expect(leadsDespuesSim[0].conversacion).toHaveLength(1);
    expect(leadsDespuesSim[0].conversacion[0].canal).toBe('simulador');

    // Ahora la misma persona escribe por WhatsApp (incluso con otro nombre de perfil)
    const waRes = await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899555666',
        name: 'Lu',
        body: 'Hola! Terminé el simulador y quería consultar por la seña',
        messageId: 'wamid_tras_sim_1',
      }),
    );
    expect(waRes.status).toBe(200);
    expect(await waRes.json()).toMatchObject({ savedToCrm: true, motivo: 'crm_existente' });

    const leadsFinal = store.get('crm-leads.json');
    expect(leadsFinal).toHaveLength(1);
    expect(leadsFinal[0].name).toBe('Lucía Fernández');
    expect(leadsFinal[0].conversacion).toHaveLength(2);
    expect(leadsFinal[0].conversacion[0].canal).toBe('simulador');
    expect(leadsFinal[0].conversacion[1].canal).toBe('whatsapp');
    expect(leadsFinal[0].conversacion[1].texto).toContain('Terminé el simulador');
  });

  it('deduplicación por idExterno evita mensajes repetidos en WhatsApp y Meta', async () => {
    mockDecidir.mockResolvedValue({
      consulta_de_evento: { valor: true, siNo: true },
      seguridad: { valor: 3, nota: 3 },
    });

    const req1 = buildMetaWhatsAppRequest({
      from: '59899777888',
      name: 'Martín',
      body: 'Hola, busco presupuesto para casamiento en noviembre',
      messageId: 'wamid_dup_99',
    });
    const req2 = buildMetaWhatsAppRequest({
      from: '59899777888',
      name: 'Martín',
      body: 'Hola, busco presupuesto para casamiento en noviembre',
      messageId: 'wamid_dup_99',
    });

    await whatsappWebhookPOST(req1);
    await whatsappWebhookPOST(req2);

    const leads = store.get('crm-leads.json');
    expect(leads).toHaveLength(1);
    expect(leads[0].conversacion).toHaveLength(1);
    expect(leads[0].conversacion[0].idExterno).toBe('wa_wamid_dup_99');
  });

  it('IG DM entra al CRM y se lee sin duplicar en bandeja única; comentarios solo si preguntan', async () => {
    const dmPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'ig_page_ak',
          messaging: [
            {
              sender: { id: 'ig_user_500', name: 'Camila IG' },
              recipient: { id: 'ig_page_ak' },
              message: { mid: 'mid_ig_500', text: 'Hola! Tienen disponibilidad para diciembre?' },
              timestamp: 1790000000000,
            },
          ],
          changes: [
            {
              field: 'comments',
              value: {
                id: 'comm_elogio_1',
                text: 'Qué divino todo!!',
                from: { id: 'ig_fan_1', username: 'fan_ak' },
              },
            },
            {
              field: 'comments',
              value: {
                id: 'comm_pregunta_2',
                text: '¿Cuánto sale para 100 personas?',
                from: { id: 'ig_preg_2', username: 'interesada_2' },
              },
            },
          ],
        },
      ],
    };

    const res1 = await metaWebhookPOST(buildSignedMetaRequest(dmPayload, 'meta-secret-325'));
    expect(res1.status).toBe(200);
    // Reenvío del mismo evento no duplica por idExterno
    const res2 = await metaWebhookPOST(buildSignedMetaRequest(dmPayload, 'meta-secret-325'));
    expect(res2.status).toBe(200);

    const leads = store.get('crm-leads.json');
    // Camila IG (DM) + interesada_2 (pregunta); comm_elogio_1 NO entra al CRM
    expect(leads).toHaveLength(2);
    const camilaLead = leads.find((l: any) => l.name === 'Camila IG');
    expect(camilaLead.conversacion).toHaveLength(1);
    expect(camilaLead.conversacion[0].idExterno).toBe('meta_dm_mid_ig_500');

    const bandeja = await leerBandejaUnica();
    const mensajesCamila = bandeja.filter((m) => m.canal === 'instagram_dm' && m.texto.includes('disponibilidad para diciembre'));
    expect(mensajesCamila).toHaveLength(1);
    expect(mensajesCamila[0].esProspecto).toBe(true);
  });

  it('Puerta 4 (Bloque 6): nota 3 entra como llego_solo, nota 2 como dudoso y confirmable/eliminable, no/null no guarda', async () => {
    // 1. Nota 3 & sí -> entra con origen llego_solo
    mockDecidir.mockResolvedValueOnce({
      consulta_de_evento: { valor: true, siNo: true },
      seguridad: { valor: 3, nota: 3 },
    });
    await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899100003',
        name: 'Vale 3',
        body: 'Hola quiero cotizar mi cumpleaños de 15 para 90 personas',
        messageId: 'wamid_p4_3',
      }),
    );

    // 2. Nota 2 & sí -> entra marcado ¿es prospecto?
    mockDecidir.mockResolvedValueOnce({
      consulta_de_evento: { valor: true, siNo: true },
      seguridad: { valor: 2, nota: 2 },
    });
    await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899100002',
        name: 'Duda 2',
        body: 'Hola, trabajan en Salto el mes que viene?',
        messageId: 'wamid_p4_2',
      }),
    );

    // 3. No / null -> no guarda nada
    mockDecidir.mockResolvedValueOnce(null);
    await whatsappWebhookPOST(
      buildMetaWhatsAppRequest({
        from: '59899100000',
        name: 'Nada 0',
        body: 'Ok nos vemos mañana',
        messageId: 'wamid_p4_0',
      }),
    );

    const leads = store.get('crm-leads.json');
    expect(leads).toHaveLength(2);

    const lead3 = leads.find((l: any) => l.phone === '099100003');
    expect(lead3.origenWhatsApp).toBe('llego_solo');
    expect(lead3.esProspectoDudoso).toBeFalsy();

    const lead2 = leads.find((l: any) => l.phone === '099100002');
    expect(lead2.origenWhatsApp).toBe('dudoso_ia');
    expect(lead2.esProspectoDudoso).toBe(true);

    // Confirmar "Es personal": borra del CRM y agrega a Números personales
    const resPersonal = await confirmarProspectoDudoso(lead2.id, false);
    expect(resPersonal).toMatchObject({ success: true, action: 'removed' });

    const leadsDespues = store.get('crm-leads.json');
    expect(leadsDespues.find((l: any) => l.id === lead2.id)).toBeUndefined();
    expect(store.get('whatsapp-config.json').numerosPersonales).toContain('099100002');
  });

  it('Bloque 7: descarta familia/proveedor, avisa cliente con fiesta sin respuesta, rescata y prioriza prospectos con link wa.me', async () => {
    const txtFamilia = [
      '10/10/2026, 10:00 - Prima Laura: Hola primooo todo bien?',
      '10/10/2026, 10:05 - AK Producciones: Todo bien!',
    ].join('\n');

    const txtCliente = [
      '12/10/2026, 15:00 - Carlos Cliente: Hola, ya contratamos la fiesta y quería cambiar la hora del DJ',
    ].join('\n');

    const txtProspectoConFechaSinResp = [
      '14/10/2026, 18:00 - +598 99 321 654: Hola! Queremos presupuesto de boda para el 2027-11-20, somos 140 invitados',
    ].join('\n');

    const txtProspectoRespondido = [
      '15/10/2026, 11:00 - Ana Gómez: Hola, hacen cumpleaños infantiles?',
      '15/10/2026, 11:10 - AK Producciones: Sí claro! Te pasamos info',
    ].join('\n');

    const zip = new JSZip();
    zip.file('Chat de WhatsApp con Prima Laura.txt', txtFamilia);
    zip.file('Chat de WhatsApp con Carlos Cliente.txt', txtCliente);
    zip.file('Chat de WhatsApp con +598 99 321 654.txt', txtProspectoConFechaSinResp);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    const { charlas } = await extraerCharlasDesdeArchivos([
      { name: 'export.zip', buffer: zipBuffer },
      { name: 'Chat de WhatsApp con Ana Gómez.txt', buffer: Buffer.from(txtProspectoRespondido, 'utf8') },
    ]);
    expect(charlas).toHaveLength(4);

    mockDecidir
      .mockResolvedValueOnce({
        tipo: { valor: 'personal', opcion: 'personal' },
        quedo_sin_respuesta: { valor: false, siNo: false },
        que_pedia: { valor: 'otro', opcion: 'otro' },
      })
      .mockResolvedValueOnce({
        tipo: { valor: 'cliente_con_fiesta', opcion: 'cliente_con_fiesta' },
        quedo_sin_respuesta: { valor: true, siNo: true },
        que_pedia: { valor: 'seguimiento_fiesta', opcion: 'seguimiento_fiesta' },
      })
      .mockResolvedValueOnce({
        tipo: { valor: 'prospecto', opcion: 'prospecto' },
        quedo_sin_respuesta: { valor: true, siNo: true },
        que_pedia: { valor: 'presupuesto', opcion: 'presupuesto' },
      })
      .mockResolvedValueOnce({
        tipo: { valor: 'prospecto', opcion: 'prospecto' },
        quedo_sin_respuesta: { valor: false, siNo: false },
        que_pedia: { valor: 'reunion_info', opcion: 'reunion_info' },
      });

    const resultado = await procesarCharlasViejasWhatsApp(charlas);

    expect(resultado.descartadosPersonal).toBe(1);
    expect(resultado.clientesSinRespuesta).toHaveLength(1);
    expect(resultado.clientesSinRespuesta[0].notificado).toBe(true);
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        titulo: expect.stringMatching(/Cliente con fiesta/i),
      }),
    );

    // Solo los 2 prospectos entran al CRM (ni familia ni cliente con fiesta)
    const leads = store.get('crm-leads.json');
    expect(leads).toHaveLength(2);
    expect(leads.every((l: any) => l.origenWhatsApp === 'rescatado')).toBe(true);

    // Prioridad: sin respuesta con fecha va primero
    expect(resultado.prospectosRescatados).toHaveLength(2);
    expect(resultado.prospectosRescatados[0].quedoSinRespuesta).toBe(true);
    expect(resultado.prospectosRescatados[0].fechaEvento).toBe('2027-11-20');
    expect(resultado.prospectosRescatados[0].fechaDisponible).toBe(false);
    expect(resultado.prospectosRescatados[0].fechasAlternativas).toEqual(['2027-11-21', '2027-11-26']);
    expect(resultado.prospectosRescatados[0].waUrl).toContain('https://wa.me/59899321654?text=');
    expect(resultado.prospectosRescatados[1].quedoSinRespuesta).toBe(false);

    // Verificar que la pantalla de Timeline tenga pestaña Conversación y CRM enlace a Rescatar
    const timelineSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/components/crm/CrmLeadTimeline.tsx'),
      'utf8',
    );
    expect(timelineSrc).toContain('Conversación');
    const crmPageSrc = fs.readFileSync(
      path.join(process.cwd(), 'src/app/(app)/contabilidad/crm/page.tsx'),
      'utf8',
    );
    expect(crmPageSrc).toContain('Rescatar charlas viejas');
  });
});
