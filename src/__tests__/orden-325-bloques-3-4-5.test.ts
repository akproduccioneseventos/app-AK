/** @jest-environment node */

import { NextRequest } from 'next/server';

const memoryStore: Record<string, any> = {};

const mockGenerateWithGeminiFallback = jest.fn();
const mockReservarConsumoIA = jest.fn();
const mockAnotarFalloIA = jest.fn(async () => {});
const mockCheckDateAvailability = jest.fn();
const mockAvisarAlDuenio = jest.fn(async () => ({ pushEnviado: true, whatsAppEnviado: false }));
const mockCreateNotification = jest.fn(async () => ({ success: true }));
const mockSendMetaWhatsAppMessage = jest.fn(async () => ({ success: true, messageId: 'wa_sent_1' }));
const mockEvaluarProspectoDeWhatsApp = jest.fn();
const mockCorrespondeContestarSolo = jest.fn();
const mockEnforcePublicRateLimit = jest.fn(async () => {});

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (memoryStore[file] !== undefined) {
      return JSON.parse(JSON.stringify(memoryStore[file]));
    }
    return JSON.parse(JSON.stringify(fallback));
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    memoryStore[file] = JSON.parse(JSON.stringify(data));
    return true;
  }),
  mutateDataItem: jest.fn(async (file: string, _col: string, id: string, fn: (item: any) => any) => {
    const list = Array.isArray(memoryStore[file]) ? memoryStore[file] : [];
    const idx = list.findIndex((item: any) => item.id === id);
    if (idx === -1) return null;
    const updated = fn(JSON.parse(JSON.stringify(list[idx])));
    list[idx] = updated;
    memoryStore[file] = list;
    return updated;
  }),
}));

jest.mock('@/lib/generic-json-store', () => ({
  mutateGenericJsonArray: jest.fn(async (file: string, fn: (lista: any[]) => any[] | null) => {
    const current = Array.isArray(memoryStore[file]) ? memoryStore[file] : [];
    const next = fn(JSON.parse(JSON.stringify(current)));
    if (next !== null) memoryStore[file] = next;
    return next;
  }),
  mutarDocumento: jest.fn(async (file: string, def: any, fn: (curr: any) => any) => {
    const current = memoryStore[file] ?? def;
    const next = fn(JSON.parse(JSON.stringify(current)));
    memoryStore[file] = next;
    return next;
  }),
}));

jest.mock('@/ai/genkit', () => ({
  geminiCommercialModel: 'googleai/gemini-flash-latest',
  geminiProModel: 'googleai/gemini-pro-latest',
  getEffectiveGeminiModelForAgent: jest.fn(async () => 'googleai/gemini-flash-latest'),
  generateWithGeminiFallback: (...args: any[]) => mockGenerateWithGeminiFallback(...args),
  isRecoverableGeminiModelError: jest.fn(() => true),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => {}),
  reservarConsumoIA: (...args: any[]) => mockReservarConsumoIA(...args),
  anotarFalloIA: (...args: any[]) => mockAnotarFalloIA(...args),
}));

jest.mock('@/app/actions/simulador-v2', () => ({
  checkDateAvailability: (...args: any[]) => mockCheckDateAvailability(...args),
}));

jest.mock('@/app/actions/armado-rapido', () => ({
  getArmadoRapidoConfig: jest.fn(async () => ({
    paquetes: [{ id: 'pkg1', nombre: 'Intermedio', descripcion: 'Sonido, luces y pantallas' }],
    menus: [{ id: 'menu1', nombre: 'Asado completo', descripcion: 'Entrada, asado y postre' }],
    clubUruguayConfig: { activo: true, precio: 45000, prestaciones: ['Ubicación céntrica'] },
  })),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresaPublicos: jest.fn(async () => [
    { id: 's1', nombre: 'Fotocabina 360', tipoItem: 'Servicio', categoria: 'Entretenimiento', precioVenta: 12000, calculationMethod: 'fijo' },
  ]),
}));

jest.mock('@/app/actions/salones', () => ({
  getSalonesPublicos: jest.fn(async () => [
    { id: 'sal1', nombre: 'Club Uruguay', capacidad: 200, direccion: 'Uruguay 710' },
  ]),
}));

jest.mock('@/lib/asistente/avisar-al-duenio', () => {
  const actual = jest.requireActual('@/lib/asistente/avisar-al-duenio');
  return {
    ...actual,
    getAsistenteSettings: jest.fn(async () => ({
      ...actual.ASISTENTE_SETTINGS_DEFAULT,
      ...(memoryStore['asistente-settings.json'] || {}),
    })),
    avisarAlDuenio: (...args: any[]) => mockAvisarAlDuenio(...args),
  };
});

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: (...args: any[]) => mockSendMetaWhatsAppMessage(...args),
}));

jest.mock('@/lib/whatsapp/quien-es-prospecto', () => ({
  evaluarProspectoDeWhatsApp: (...args: any[]) => mockEvaluarProspectoDeWhatsApp(...args),
}));

jest.mock('@/lib/whatsapp/vino-de-la-publicidad', () => ({
  correspondeContestarSolo: (...args: any[]) => mockCorrespondeContestarSolo(...args),
  esOrigenDePublicidad: jest.fn((ref: any) => ref?.source_type === 'ad' || ref?.source_type === 'post'),
}));

jest.mock('@/lib/asistente/por-whatsapp', () => ({
  atenderAlEquipo: jest.fn(async () => ({ atendido: false })),
  atenderProspectoAnuncioWhatsApp: jest.fn(async () => ({ borradorAtendido: false, completo: false, faltantes: [] })),
  enlaceAlSimuladorDelProspecto: jest.requireActual('@/lib/whatsapp/datos-prospecto').enlaceAlSimuladorDelProspecto,
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(async () => ({ enabled: true, provider: 'meta', apiKey: 'tok', phoneNumberId: '123' })),
  processIncomingMessage: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: (...args: any[]) => mockEnforcePublicRateLimit(...args),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno', role: 'admin' } })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno', role: 'admin' } })),
}));

jest.mock('@/lib/social-media/comments-backfill', () => ({
  getAjustesRespuestasComentarios: jest.fn(async () => ({
    comentarios: true,
    mensajesDirectos: true,
  })),
}));

import {
  analizarMensajeEntranteParaCRM,
  aplicarAnalisisSinPisar,
} from '@/lib/crm/ia-prospecto';
import {
  MENSAJE_BIENVENIDA_PROSPECTO,
  atenderProspectoUnificado,
} from '@/lib/whatsapp/asistente-de-prospectos';
import { ASISTENTE_SETTINGS_DEFAULT } from '@/lib/asistente/avisar-al-duenio';
import { devolverCharlaAlAsistenteAction } from '@/app/actions/crm';
import { chatWithVirtualAssistant } from '@/app/actions/asistente-virtual';
import { evaluarRespuestaAutomatica } from '@/lib/mensajes/bandeja-unica';
import { POST as whatsappWebhookPOST } from '@/app/api/whatsapp/webhook/route';
import type { CrmLead } from '@/types/crm';

function makeWhatsAppRequest(body: Record<string, unknown>) {
  return new NextRequest('https://akproducciones.uy/api/whatsapp/webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Orden 325 — Bloques 3, 4 y 5', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const k of Object.keys(memoryStore)) {
      delete memoryStore[k];
    }

    mockReservarConsumoIA.mockResolvedValue({ liberar: jest.fn(async () => {}) });
    mockGenerateWithGeminiFallback.mockResolvedValue({
      output: {
        resumenIA: 'Consulta por fiesta de 15 en noviembre para 120 personas.',
        leadTemperature: 'caliente',
        nextAction: 'Pasarle el simulador y confirmar fecha del 15/11/2027.',
        eventDate: '2027-11-15',
        guestCount: 60, // distinto al ya cargado para probar que no pisa
        partyType: 'Boda', // distinto al ya cargado para probar que no pisa
        venueName: 'Club Uruguay',
        borradorRespuesta:
          '¡Hola! Podés armar tu presupuesto entre $50.000 y $90.000 o verlo en el simulador.',
      },
      text: '',
    });
    mockCheckDateAvailability.mockResolvedValue({ isOccupied: false });
    mockEvaluarProspectoDeWhatsApp.mockResolvedValue({
      esProspecto: true,
      motivo: 'llego_solo',
      notaIA: 3,
      esDudoso: false,
    });
    mockCorrespondeContestarSolo.mockResolvedValue(false);
  });

  describe('Bloque 3 — La IA trabaja en el CRM', () => {
    it('usa geminiCommercialModel + reservarConsumoIA, completa campos vacíos sin pisar los cargados y prepara borrador sin enviar solo', async () => {
      const leadExistente: CrmLead = {
        id: 'lead_b3_1',
        name: 'Camila Rodríguez',
        phone: '099111222',
        partyType: 'XV años', // ya cargado por el equipo
        guestCount: 120, // ya cargado por el equipo
        createdAt: '2026-11-19T10:00:00.000Z',
        updatedAt: '2026-11-19T10:00:00.000Z',
      };

      const analisis = await analizarMensajeEntranteParaCRM({
        lead: leadExistente,
        mensaje: 'Hola, averiguo para el 2027-11-15 en Club Uruguay',
        canal: 'whatsapp',
      });

      expect(mockReservarConsumoIA).toHaveBeenCalledWith('extraccion-prospecto-whatsapp');
      expect(mockGenerateWithGeminiFallback).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'googleai/gemini-flash-latest',
        }),
      );

      // No se envía ningún mensaje automático por WhatsApp
      expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();

      // El borrador no conserva rangos de precios inventados ("entre $50.000 y $90.000")
      expect(analisis.borradorRespuesta).not.toMatch(/entre\s*\$?\s*50\.000/i);
      expect(analisis.borradorRespuesta).toContain('simulador');
      expect(analisis.resumenIA).not.toContain('\n');
      expect(analisis.leadTemperature).toBe('caliente');
      expect(analisis.nextAction).toBeTruthy();

      const actualizado = aplicarAnalisisSinPisar(leadExistente, analisis);

      // Datos ya cargados NO se pisan
      expect(actualizado.partyType).toBe('XV años');
      expect(actualizado.guestCount).toBe(120);
      // Campos vacíos SÍ se completan
      expect(actualizado.eventDate).toBe('2027-11-15');
      expect(actualizado.venueName).toBe('Club Uruguay');
      expect(actualizado.borradorRespuesta).toBe(analisis.borradorRespuesta);
    });
  });

  describe('Bloque 4 — Cerebro único en WhatsApp', () => {
    it('el primer mensaje es exacto con opciones "Seguí vos" y "Quiero una persona"', async () => {
      const res = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899123456',
        texto: 'Hola, quiero consultar por una fiesta',
      });

      expect(res.silenciado).toBe(false);
      expect(res.respuesta).toBe(MENSAJE_BIENVENIDA_PROSPECTO);
      expect(res.opciones).toEqual(['Seguí vos', 'Quiero una persona']);
    });

    it('"Quiero una persona" contesta, avisa al dueño, marca atiende="persona" y se calla luego hasta devolverle la charla', async () => {
      memoryStore['crm-leads.json'] = [
        {
          id: 'lead_wa_1',
          name: 'Martín',
          phone: '099123456',
          createdAt: '2026-11-19T10:00:00.000Z',
          updatedAt: '2026-11-19T10:00:00.000Z',
        },
      ];

      // Primer contacto
      await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899123456',
        texto: 'Hola',
      });

      // Elige "Quiero una persona" de noche (23:30 UY -> 02:30 UTC)
      const resPersona = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899123456',
        texto: 'Quiero una persona',
        ahora: new Date('2026-11-20T02:30:00.000Z'),
      });

      expect(resPersona.silenciado).toBe(false);
      expect(resPersona.atiende).toBe('persona');
      expect(resPersona.respuesta).toContain('¡Listo! Le aviso al equipo y te escriben por acá');
      expect(resPersona.respuesta?.toLowerCase()).toContain('mañana por la mañana');
      expect(mockAvisarAlDuenio).toHaveBeenCalled();
      expect(memoryStore['crm-leads.json'][0].atiende).toBe('persona');

      // Siguiente mensaje mientras atiende una persona -> se calla
      const resSilencio = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899123456',
        texto: '¿Hay alguien ahí?',
      });
      expect(resSilencio.silenciado).toBe(true);
      expect(resSilencio.respuesta).toBeUndefined();

      // Botón del CRM: "Devolverle la charla al asistente"
      const devuelto = await devolverCharlaAlAsistenteAction('lead_wa_1');
      expect(devuelto.success).toBe(true);
      expect(memoryStore['crm-leads.json'][0].atiende).toBe('asistente');

      // Ahora el asistente vuelve a contestar
      const resVuelve = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899123456',
        texto: 'Seguí vos',
      });
      expect(resVuelve.silenciado).toBe(false);
      expect(resVuelve.atiende).toBe('asistente');
    });

    it('informa fecha ocupada con alternativas de checkDateAvailability', async () => {
      mockCheckDateAvailability.mockResolvedValueOnce({
        isOccupied: true,
        suggestions: ['2027-11-20', '2027-11-21'],
      });

      await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899333444',
        texto: 'Hola',
      });

      const res = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899333444',
        texto: 'Seguí vos, quiero saber si el 2027-11-15 está libre',
      });

      expect(mockCheckDateAvailability).toHaveBeenCalledWith('2027-11-15');
      expect(res.respuesta?.toLowerCase()).toContain('ocupado');
      expect(res.respuesta).toContain('20/11/2027');
    });

    it('si el calendario está caído, NUNCA dice "libre" y avisa al equipo', async () => {
      mockCheckDateAvailability.mockRejectedValueOnce(new Error('Firestore caído'));

      await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899444555',
        texto: 'Hola',
      });

      const res = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899444555',
        texto: '¿Tienen disponible el 2027-12-10?',
      });

      expect(res.respuesta?.toLowerCase()).not.toMatch(/\best[aá]\s+libre\b/);
      expect(res.respuesta?.toLowerCase()).toContain('persona del equipo');
      expect(mockAvisarAlDuenio).toHaveBeenCalled();
    });

    it('si pide reservar, señar o pagar, pasa a persona y no reserva ni cobra', async () => {
      await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899555666',
        texto: 'Hola',
      });

      const res = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: '59899555666',
        texto: 'Quiero reservar la fecha y pagar la seña ahora',
      });

      expect(res.pasoAPersona).toBe(true);
      expect(res.atiende).toBe('persona');
      expect(res.respuesta).toContain('¡Listo! Le aviso al equipo y te escriben por acá');
      expect(mockAvisarAlDuenio).toHaveBeenCalled();
    });

    it('el interruptor viene apagado de fábrica y números personales / personal / nota <= 2 nunca reciben respuesta', async () => {
      expect(ASISTENTE_SETTINGS_DEFAULT.asistenteProspectosWhatsApp).toBe(false);

      // Con interruptor encendido, número personal igual se bloquea
      memoryStore['asistente-settings.json'] = { asistenteProspectosWhatsApp: true };
      memoryStore['whatsapp-config.json'] = { numerosPersonales: ['099777888'] };
      mockEvaluarProspectoDeWhatsApp.mockResolvedValueOnce({
        esProspecto: false,
        motivo: null,
        rechazadoPor: 'numero_personal',
      });

      const reqPersonal = makeWhatsAppRequest({
        phone: '59899777888',
        message: 'Hola hermano, ¿cenamos hoy?',
        name: 'Hermano',
      });
      const resPersonal = await whatsappWebhookPOST(reqPersonal);
      const dataPersonal = await resPersonal.json();
      expect(dataPersonal.respondido).toBe(false);
      expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();

      // Con nota <= 2 tampoco responde
      mockEvaluarProspectoDeWhatsApp.mockResolvedValueOnce({
        esProspecto: true,
        motivo: 'dudoso_ia',
        esDudoso: true,
        notaIA: 2,
      });

      const reqNotaBaja = makeWhatsAppRequest({
        phone: '59899666555',
        message: 'Te mando la factura del flete',
        name: 'Flete',
      });
      const resNotaBaja = await whatsappWebhookPOST(reqNotaBaja);
      const dataNotaBaja = await resNotaBaja.json();
      expect(dataNotaBaja.respondido).toBe(false);
      expect(mockSendMetaWhatsAppMessage).not.toHaveBeenCalled();
    });
  });

  describe('Bloque 5 — Web, Instagram DM, Messenger y comentarios públicos', () => {
    it('Web e Instagram DM reciben el mismo primer mensaje exacto', async () => {
      const resWeb = await chatWithVirtualAssistant('web_sess_1', [], 'Hola!');
      expect(resWeb.success).toBe(true);
      expect(resWeb.text).toBe(MENSAJE_BIENVENIDA_PROSPECTO);
      expect(resWeb.opciones).toEqual(['Seguí vos', 'Quiero una persona']);

      const resIg = await evaluarRespuestaAutomatica({
        canal: 'instagram_dm',
        texto: 'Hola, quiero info',
        remitenteId: 'ig_user_1',
        esCliente: false,
      });
      expect(resIg.respondeSolo).toBe(true);
      expect(resIg.respuesta).toBe(MENSAJE_BIENVENIDA_PROSPECTO);
      expect(resIg.opciones).toEqual(['Seguí vos', 'Quiero una persona']);
    });

    it('fuera de WhatsApp, "Quiero una persona" devuelve enlace wa.me con datos prellenados y marca (ref AK-...)', async () => {
      // Primer mensaje con datos en Messenger
      await evaluarRespuestaAutomatica({
        canal: 'messenger',
        texto: 'Hola, somos 140 invitados para 15 años el 2027-10-12 en Club Uruguay',
        remitenteId: 'fb_user_1',
        esCliente: false,
      });

      // Elige hablar con una persona
      const resHandoff = await evaluarRespuestaAutomatica({
        canal: 'messenger',
        texto: 'Quiero una persona',
        remitenteId: 'fb_user_1',
        esCliente: false,
      });

      expect(resHandoff.respondeSolo).toBe(true);
      expect(resHandoff.respuesta).toContain('¡Dale! Te escribe una persona del equipo por WhatsApp: tocá acá');
      expect(resHandoff.whatsappUrl).toContain('https://wa.me/59898355530?text=');

      const decodedText = decodeURIComponent(resHandoff.whatsappUrl || '');
      expect(decodedText).toContain('140');
      expect(decodedText).toContain('XV años');
      expect(decodedText).toContain('2027-10-12');
      expect(decodedText).toContain('Club Uruguay');
      expect(decodedText).toMatch(/\(ref AK-[A-Z0-9]+\)/);
    });

    it('comentarios públicos nunca dicen precios ni fechas y solo contestan "¡Te escribimos por privado!"', async () => {
      const resComIg = await evaluarRespuestaAutomatica({
        canal: 'instagram_comentario',
        texto: '¿Cuánto sale y qué fechas tienen libres en noviembre?',
        remitenteId: 'ig_commenter_1',
        esCliente: false,
      });

      expect(resComIg.respondeSolo).toBe(true);
      expect(resComIg.respuesta).toContain('¡Te escribimos por privado!');
      expect(resComIg.respuesta).not.toContain('$');
      expect(resComIg.respuesta?.toLowerCase()).not.toMatch(/noviembre|libre|\d{4}/);
    });
  });
});
