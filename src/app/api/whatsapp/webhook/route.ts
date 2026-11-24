import { NextRequest, NextResponse } from 'next/server';
import { getWhatsAppConfig, processIncomingMessage } from '@/app/actions/whatsapp';
import {
  getExternalWebhookUrl,
  verifyMetaWebhookSignature,
  verifyTwilioWebhookSignature,
} from '@/lib/whatsapp/webhook-security';
import { WHATSAPP_WEBHOOK_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import {
  correspondeContestarSolo,
  type ReferenciaDeOrigen,
} from '@/lib/whatsapp/vino-de-la-publicidad';
import { atenderProspectoAnuncioWhatsApp, enlaceAlSimuladorDelProspecto } from '@/lib/asistente/por-whatsapp';
import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import {
  atenderProspectoUnificado,
  verificarEsContactoPersonalONotaBaja,
} from '@/lib/whatsapp/asistente-de-prospectos';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { agregarPropuestasDeduplicadas } from '@/lib/asistente/propuestas-service';
import { clavesIguales } from '@/lib/security/claves-iguales';
import {
  evaluarProspectoDeWhatsApp,
  esProspectoDeWhatsApp,
  type EvaluacionProspectoWhatsApp,
} from '@/lib/whatsapp/quien-es-prospecto';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';
import { buildCrmMensaje } from '@/lib/crm/conversacion';
import { enriquecerLeadExistenteConIA, registrarMensajeYAnalizarProspecto } from '@/lib/crm/ia-prospecto';
import { normalizeUruguayPhone } from '@/lib/commercial/contact';
import { createNotification } from '@/lib/notifications/create-notification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function conTimeout<T>(promesa: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promesa,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timeout tras ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * GET /api/whatsapp/webhook
 * Webhook verification endpoint required by Meta/Twilio.
 * Responds to hub.challenge with the expected token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Meta webhook verification
  if (mode === 'subscribe' && challenge) {
    const config = await getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN);
    const verifyToken = config.verifyToken;
    if (!verifyToken && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'WhatsApp verify token is not configured in production' }, { status: 403 });
    }
    const actualVerifyToken = verifyToken || 'ak_whatsapp_verify';

    if (clavesIguales(token, actualVerifyToken)) {
      return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ status: 'ok', message: 'WhatsApp webhook endpoint active' });
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming messages from WhatsApp providers.
 * Supports Meta and Twilio payload formats.
 */
export async function POST(request: NextRequest) {
  try {
    const config = await getWhatsAppConfig(WHATSAPP_WEBHOOK_INTERNAL_TOKEN);

    if (!config.enabled) {
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    const rawBody = await request.text();
    const contentType = request.headers.get('content-type') || '';
    let body: any = null;
    let formParams: URLSearchParams | null = null;
    if (contentType.includes('application/x-www-form-urlencoded')) {
      formParams = new URLSearchParams(rawBody);
      body = Object.fromEntries(formParams.entries());
    } else {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
      }
    }
    if (!body) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let phone: string | null = null;
    let messageText: string | null = null;
    let clientName: string | undefined;
    let isEcho = false;
    let metaTo: string | undefined;
    let messageType: string | undefined;
    let messageId: string | undefined;
    let mediaId: string | undefined;

    // Parse Meta (WhatsApp Business API) format
    let referencia: ReferenciaDeOrigen | null = null;

    if (body.object === 'whatsapp_business_account' || body.entry) {
      // Strictly validate Meta Signature in production
      const metaSignature = request.headers.get('x-hub-signature-256');
      if (process.env.NODE_ENV === 'production') {
        if (!config.appSecret || !metaSignature) {
          return NextResponse.json({ error: 'Meta app secret or signature missing' }, { status: 401 });
        }
        if (!verifyMetaWebhookSignature(rawBody, metaSignature, config.appSecret)) {
          return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
        }
      }

      try {
        const entry = body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        isEcho = Boolean(value?.message_echoes);
        const messageData = value?.messages?.[0] || value?.message_echoes?.[0];

        if (messageData) {
          phone = messageData.from;
          messageId = messageData.id;
          messageType = messageData.type;
          // En un eco (lo que mandó el dueño desde su WhatsApp) `from` es el propio número y el
          // destinatario viene en `to`. Sólo el chat consigo mismo se atiende como orden.
          metaTo = isEcho ? messageData.to : value?.metadata?.display_phone_number;
          if (messageData.type === 'audio') mediaId = messageData.audio?.id;
          if (messageData.type === 'image') mediaId = messageData.image?.id;
          const msgType = messageData.type;
          if (msgType === 'audio') {
            messageText = messageData.audio?.id ? `[AUDIO:${messageData.audio.id}]` : '[AUDIO]';
          } else if (msgType === 'image') {
            messageText = messageData.image?.caption || (messageData.image?.id ? `[IMAGE:${messageData.image.id}]` : '[IMAGE]');
          } else if (msgType === 'button') {
            messageText = messageData.button?.text ?? messageData.button?.payload ?? '';
          } else if (msgType === 'interactive') {
            messageText =
              messageData.interactive?.button_reply?.title ??
              messageData.interactive?.button_reply?.id ??
              messageData.interactive?.list_reply?.title ??
              messageData.interactive?.list_reply?.id ??
              '';
          } else {
            messageText = messageData.text?.body ?? messageData.type ?? '';
          }
          const contact = value?.contacts?.[0];
          clientName = contact?.profile?.name;
          // Meta avisa aca cuando la persona llego tocando un anuncio. Viene solo
          // en el primer mensaje de la conversacion.
          referencia = messageData.referral ?? null;
        }
      } catch {
        // Ignore parse errors — may be a different event type (status update, etc.)
      }
    }

    // Parse Twilio format
    if (!phone && body.From) {
      const twilioSignature = request.headers.get('x-twilio-signature');
      if (process.env.NODE_ENV === 'production') {
        if (
          !formParams ||
          !verifyTwilioWebhookSignature({
            authToken: config.apiKey,
            signature: twilioSignature,
            url: getExternalWebhookUrl(request),
            params: formParams,
          })
        ) {
          return NextResponse.json({ error: 'Twilio signature verification failed' }, { status: 401 });
        }
      }

      phone = (body.From as string).replace('whatsapp:', '');
      messageText = body.Body ?? '';
      clientName = body.ProfileName;
    }

    // Fallback: generic format { phone, message, name }
    if (!phone && body.phone) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Generic payload fallback is forbidden in production environment.' }, { status: 400 });
      }
      phone = body.phone;
      messageText = body.message ?? body.text ?? '';
      clientName = body.name;
    }

    if (!phone || !messageText) {
      // Not an incoming message event — acknowledge silently
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }

    // 1. Si es del equipo o del dueño, lo atiende el asistente
    const { atenderAlEquipo } = await import('@/lib/asistente/por-whatsapp');
    const atencionEquipo = await atenderAlEquipo({
      from: phone,
      text: messageText,
      isEcho,
      to: metaTo,
      type: messageType as any,
      messageId,
      mediaId,
    });
    if (atencionEquipo.atendido) {
      return NextResponse.json({
        status: 'ok',
        atendidoEquipo: true,
        accion: atencionEquipo.accionIdentificada,
        nivel: atencionEquipo.nivel,
      });
    }
    // Un eco es un mensaje que mandó el dueño: no es una consulta de nadie y no se contesta.
    if (isEcho) return NextResponse.json({ status: 'ok', eco: true }, { status: 200 });

    let evaluacionFallida: Error | null = null;
    const evaluacion: EvaluacionProspectoWhatsApp = config.llevarWhatsAppProspectosAlCrm === true
      ? await conTimeout(
          typeof evaluarProspectoDeWhatsApp === 'function'
            ? evaluarProspectoDeWhatsApp({
                telefono: phone,
                referencia,
                texto: messageText,
              })
            : esProspectoDeWhatsApp(phone, referencia, messageText).then((motivo) => ({
                esProspecto: Boolean(motivo),
                motivo,
                esDudoso: motivo === 'dudoso_ia',
              })),
          8000,
        ).catch((err: unknown) => {
          evaluacionFallida = err instanceof Error ? err : new Error(String(err || 'Timeout evaluando prospecto'));
          return { esProspecto: false, motivo: null };
        })
      : { esProspecto: false, motivo: null, rechazadoPor: 'interruptor_apagado' };

    if (evaluacionFallida) {
      const errEval: Error = evaluacionFallida;
      console.warn('[WhatsApp Webhook] Evaluación de prospecto no respondió a tiempo:', errEval);
      await agregarPropuestasDeduplicadas([{
        clave: `whatsapp-evaluacion-pendiente:${messageId || phone}`,
        titulo: 'Revisar WhatsApp: no se pudo evaluar el mensaje a tiempo',
        area: 'ventas',
        tipoPropuesta: 'whatsapp_revisar_contacto',
        nivelRiesgo: 'aviso' as any,
        quePasa: `Llegó un mensaje de ${clientName || phone} y la evaluación de prospecto falló o tardó demasiado (${errEval.message || 'sin respuesta'}). Por seguridad no se contestó automáticamente y quedó pendiente de revisión.`,
        porQueImporta: 'Evita perder un prospecto real si la IA o la base demoran en contestar.',
        quePropone: `Revisar manualmente el mensaje de ${clientName || phone}: "${messageText.slice(0, 80)}".`,
      }]).catch((e) => console.warn('[WhatsApp webhook] No se pudo anotar para revisar:', e));

      return NextResponse.json({
        status: 'ok',
        received: true,
        savedToCrm: false,
        respondido: false,
        requiereRevision: true,
        motivo: 'Evaluación de prospecto no contestó a tiempo: no se contesta y queda para revisión.',
      }, { status: 200 });
    }

    const asistenteSettings = await conTimeout(getAsistenteSettings(), 4000).catch(() => null);
    const asistenteProspectosActivo = Boolean(asistenteSettings?.asistenteProspectosWhatsApp);
    let filtroContacto: { bloquear: boolean; motivo?: string; nota?: number; esPersonal?: boolean } = {
      bloquear: false,
      esPersonal: false,
    };
    if (asistenteProspectosActivo || config.llevarWhatsAppProspectosAlCrm === true) {
      try {
        filtroContacto = await conTimeout(
          verificarEsContactoPersonalONotaBaja(
            phone,
            body?.clasificacion ||
              (typeof body?.nota === 'number'
                ? { nota: body.nota }
                : evaluacion.notaIA !== undefined
                  ? { nota: evaluacion.notaIA, esPersonal: evaluacion.rechazadoPor === 'numero_personal' }
                  : null),
            asistenteSettings,
          ),
          4000,
        );
      } catch (filtroErr: any) {
        console.warn('[WhatsApp Webhook] Control de contacto personal no respondió a tiempo:', filtroErr);
        await agregarPropuestasDeduplicadas([{
          clave: `whatsapp-filtro-contacto-pendiente:${messageId || phone}`,
          titulo: 'Revisar WhatsApp: no se pudo confirmar si es contacto personal',
          area: 'ventas',
          tipoPropuesta: 'whatsapp_revisar_contacto',
          nivelRiesgo: 'aviso' as any,
          quePasa: `Llegó un mensaje de ${clientName || phone} y el control de contacto personal falló o tardó demasiado (${filtroErr?.message || 'sin respuesta'}). Por seguridad no se contestó ni se guardó en el CRM.`,
          porQueImporta: 'Evita contestar automáticamente o mezclar a un contacto personal si la verificación demora.',
          quePropone: `Revisar manualmente el mensaje de ${clientName || phone}: "${messageText.slice(0, 80)}".`,
        }]).catch((e) => console.warn('[WhatsApp webhook] No se pudo anotar para revisar:', e));

        return NextResponse.json({
          status: 'ok',
          received: true,
          savedToCrm: false,
          respondido: false,
          requiereRevision: true,
          motivo: 'Control de contacto personal no contestó a tiempo: no se contesta ni se guarda.',
        }, { status: 200 });
      }
    }

    let leadGuardadoId = evaluacion.leadCoincidente?.id;

    if (evaluacion.rechazadoPor !== 'interruptor_apagado') {
      if (!evaluacion.esProspecto || !evaluacion.motivo) {
        return NextResponse.json({
          received: true,
          respondido: false,
          motivo: 'No es prospecto para el CRM (ignorado).',
        });
      }

      const ahoraIso = new Date().toISOString();
      const idExterno = messageId
        ? `wa_${messageId}`
        : `wa_${normalizeUruguayPhone(phone) || phone}_${Date.now()}`;
      const phoneNorm = normalizeUruguayPhone(phone);
      const esCelularUy = /^09\d{7}$/.test(phoneNorm);

      try {
        const { lead } = await conTimeout(upsertPublicCommercialLead({
          name: evaluacion.leadCoincidente?.name || clientName || `WhatsApp ${phone.slice(-4)}`,
          phone: esCelularUy ? phoneNorm : phone,
          permitirSinTelefono: !esCelularUy,
          claveSinTelefono: !esCelularUy ? `wa:${phoneNorm || phone}` : undefined,
          leadIdExistente: evaluacion.leadCoincidente?.id,
          coincidirSoloPorTelefono: true,
          acquisition: {
            source: 'whatsapp',
            ...(referencia?.source_id ? { campaign: referencia.headline || referencia.source_id } : {}),
          },
          atiende: evaluacion.motivo === 'anuncio' ? 'asistente' : (evaluacion.leadCoincidente?.atiende || 'persona'),
          esProspectoDudoso: evaluacion.esDudoso ? true : evaluacion.leadCoincidente?.esProspectoDudoso,
          origenWhatsApp: evaluacion.motivo,
          notaClasificacionIA: evaluacion.notaIA,
          mensajesConversacion: [
            buildCrmMensaje({
              idExterno,
              canal: 'whatsapp',
              direccion: 'entrante',
              texto: messageText,
              fecha: ahoraIso,
              autor: clientName || phone,
              meta: {
                ...(messageId ? { messageId } : {}),
                motivo: evaluacion.motivo,
              },
            }),
          ],
        }));
        leadGuardadoId = lead.id;

        await conTimeout(enriquecerLeadExistenteConIA({
          leadId: lead.id,
          mensaje: messageText,
          canal: 'whatsapp',
        })).catch((e) => console.warn('[WhatsApp webhook] Paso secundario sin completar:', e));

        if (evaluacion.esDudoso) {
          const notifRes = await createNotification({
            titulo: '¿Es prospecto?',
            mensaje: `Llegó un WhatsApp dudoso de ${lead.name} (${phone}): "${messageText.slice(0, 80)}". Confirmá si es prospecto o personal.`,
            href: `/contabilidad/crm?leadId=${encodeURIComponent(lead.id)}`,
            tipo: 'aviso',
            icono: 'HelpCircle',
            entidadRelacionadaId: lead.id,
            rolDestino: 'admin',
          }).catch(() => ({ success: false, error: 'Error creando notificación' }));
          if (!notifRes.success) {
            console.warn('[WhatsApp Webhook] No se pudo crear notificación:', notifRes.error);
          }
        }
      } catch (crmErr) {
        console.warn('[WhatsApp Webhook] No se pudo guardar el mensaje en el CRM:', crmErr);
      }
    }

    // Personal, números personales o nota <= 2 NUNCA reciben respuesta automática.
    if (
      filtroContacto.bloquear ||
      evaluacion.rechazadoPor === 'numero_personal' ||
      evaluacion.rechazadoPor === 'cliente_con_fiesta' ||
      evaluacion.rechazadoPor === 'contacto_conocido' ||
      evaluacion.esDudoso ||
      (evaluacion.notaIA !== undefined && evaluacion.notaIA <= 2)
    ) {
      return NextResponse.json({
        status: 'ok',
        received: true,
        savedToCrm: Boolean(leadGuardadoId),
        leadId: leadGuardadoId,
        motivo: filtroContacto.motivo || evaluacion.motivo || 'Contacto personal o nota <= 2: contesta una persona.',
        respondido: false,
      });
    }

    const vinoDePublicidad = await correspondeContestarSolo(phone, referencia);

    const pidioPersonaExplicitamente =
      messageText.trim().toLowerCase() === 'quiero una persona';

    if (asistenteProspectosActivo) {
      const habilitadoPorPuerta =
        vinoDePublicidad ||
        (evaluacion.esProspecto && !evaluacion.esDudoso && (evaluacion.notaIA === undefined || evaluacion.notaIA > 2)) ||
        (pidioPersonaExplicitamente && Boolean(leadGuardadoId));

      if (!habilitadoPorPuerta) {
        return NextResponse.json({
          status: 'ok',
          received: true,
          savedToCrm: Boolean(leadGuardadoId),
          leadId: leadGuardadoId,
          motivo: 'No viene de la publicidad ni supera el filtro de prospecto.',
          respondido: false,
        });
      }

      if (messageId) {
        let yaRespondido = false;
        await mutateGenericJsonArray<string>('asistente/anuncio-mensajes-respondidos.json', (actuales) => {
          const lista = actuales || [];
          if (lista.includes(messageId)) {
            yaRespondido = true;
            return null;
          }
          return [...lista, messageId];
        }).catch((e) => console.warn('[WhatsApp webhook] Paso secundario sin completar:', e));
        if (yaRespondido) {
          return NextResponse.json({ status: 'ok', respondido: false, motivo: 'Mensaje duplicado ya atendido' }, { status: 200 });
        }
      }

      const resultadoProspecto = await atenderProspectoUnificado({
        canal: 'whatsapp',
        remitenteId: phone,
        nombre: clientName,
        texto: pidioPersonaExplicitamente ? 'Quiero una persona' : messageText,
        messageId,
        esPersonal: filtroContacto.esPersonal,
        nota: evaluacion.notaIA ?? filtroContacto.nota,
      });

      if (resultadoProspecto.silenciado || !resultadoProspecto.respuesta) {
        return NextResponse.json({
          status: 'ok',
          savedToCrm: Boolean(leadGuardadoId),
          leadId: leadGuardadoId,
          respondido: false,
          motivo: resultadoProspecto.motivo || 'atiende_persona',
        }, { status: 200 });
      }

      if (leadGuardadoId) {
        await registrarMensajeYAnalizarProspecto({
          leadId: leadGuardadoId,
          analizar: false,
          mensaje: buildCrmMensaje({
            canal: 'whatsapp',
            direccion: 'saliente',
            texto: resultadoProspecto.respuesta,
            fecha: new Date().toISOString(),
            autor: 'Asistente AK',
            respondidoPor: 'asistente',
          }),
        }).catch((e) => console.warn('[WhatsApp webhook] Paso secundario sin completar:', e));
      }

      if (body.From) {
        const text = resultadoProspecto.respuesta.replace(/[<>&"']/g, char => ({
          '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
        })[char]!);
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${text}</Message></Response>`, {
          status: 200, headers: { 'Content-Type': 'text/xml' },
        });
      }

      const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
      const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
      let envioExitoso = false;
      try {
        const envio = await sendMetaWhatsAppMessage({
          to: phone,
          text: resultadoProspecto.respuesta,
          apiToken,
          phoneNumberId,
        });
        envioExitoso = Boolean(envio?.success);
      } catch {
        envioExitoso = false;
      }

      if (!envioExitoso) {
        await agregarPropuestasDeduplicadas([{
          clave: 'prospecto-asistente-fallo-envio:' + (messageId || phone),
          titulo: 'Contestar al prospecto: no salió el mensaje automático',
          area: 'ventas',
          tipoPropuesta: 'prospecto_envio_fallido',
          nivelRiesgo: 'aviso' as any,
          quePasa: `No se pudo enviar la respuesta automática al prospecto (${phone}).`,
          porQueImporta: 'El prospecto espera respuesta.',
          quePropone: `Contactar manualmente a ${clientName || phone}.`,
        }]).catch((e) => console.warn('[WhatsApp webhook] Paso secundario sin completar:', e));
      }

      return NextResponse.json({
        status: 'ok',
        tipo: 'asistente_prospectos',
        respondido: true,
        atiende: resultadoProspecto.atiende,
      }, { status: 200 });
    }

    if (evaluacion.rechazadoPor !== 'interruptor_apagado' && !vinoDePublicidad) {
      return NextResponse.json({
        status: 'ok',
        received: true,
        savedToCrm: Boolean(leadGuardadoId),
        leadId: leadGuardadoId,
        motivo: evaluacion.motivo,
        respondido: false,
      });
    }

    if (!vinoDePublicidad) {
      /**
       * **El numero es el personal del dueno: no se le contesta a cualquiera.**
       *
       * La charla de quienes llegan de anuncios sigue siendo automatica. Solo el
       * presupuesto con fotos queda como borrador para revision y envio humanos.
       *
       * A la familia, a los proveedores y a los amigos **no les contesta nadie**: el
       * mensaje se ignora y lo lee una persona cuando puede.
       */
      return NextResponse.json({
        received: true,
        respondido: false,
        motivo: 'No viene de la publicidad: contesta una persona.',
      });
    }

    // Si viene de la publicidad y trae los datos de la fiesta, se atiende el prospecto de anuncio
    const atencionAnuncio = await atenderProspectoAnuncioWhatsApp({
      phone,
      name: clientName,
      text: messageText,
      messageId,
    });

    if (atencionAnuncio.borradorAtendido) {
      if (messageId) {
        let yaRespondido = false;
        await mutateGenericJsonArray<string>('asistente/anuncio-mensajes-respondidos.json', (actuales) => {
          const lista = actuales || [];
          if (lista.includes(messageId)) {
            yaRespondido = true;
            return null;
          }
          return [...lista, messageId];
        });
        if (yaRespondido) {
          return NextResponse.json({ status: 'ok', respondido: false, motivo: 'Mensaje duplicado ya atendido' }, { status: 200 });
        }
      }

      const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
      const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

      if (atencionAnuncio.completo && atencionAnuncio.datos) {
        const texto = `¡Gracias! Con lo que nos contaste ya podés ver tu presupuesto en el momento: ${enlaceAlSimuladorDelProspecto(atencionAnuncio.datos)}\nAl final vas a poder reservar una entrevista gratuita y sin compromiso con nosotros para ver todos los detalles.`;
        let envioExitoso = false;
        try {
          const envio = await sendMetaWhatsAppMessage({
            to: phone,
            text: texto,
            apiToken,
            phoneNumberId,
          });
          envioExitoso = Boolean(envio?.success);
        } catch {
          envioExitoso = false;
        }

        if (!envioExitoso) {
          await agregarPropuestasDeduplicadas([{
            clave: 'prospecto-anuncio-fallo-envio:' + (messageId || phone),
            titulo: 'Contestar al prospecto: no salió el mensaje automático',
            area: 'ventas',
            tipoPropuesta: 'prospecto_envio_fallido',
            nivelRiesgo: 'aviso' as any,
            quePasa: `No se pudo enviar el mensaje automático al prospecto (${phone}).`,
            porQueImporta: 'El prospecto espera respuesta a su consulta por el anuncio.',
            quePropone: `Contactar manualmente a ${clientName || phone} para darle seguimiento al presupuesto.`,
          }]);
        }

        return NextResponse.json({ status: 'ok', tipo: 'prospecto_anuncio_completo', respondido: true }, { status: 200 });
      }

      if (atencionAnuncio.completo) {
        return NextResponse.json({
          status: 'ok', tipo: 'prospecto_anuncio_borrador',
          completo: true, respondido: false, requiereRevision: true,
        }, { status: 200 });
      }

      if (!atencionAnuncio.completo && atencionAnuncio.respuestaTexto) {
        let envioExitoso = false;
        try {
          const envio = await sendMetaWhatsAppMessage({
            to: phone,
            text: atencionAnuncio.respuestaTexto,
            apiToken,
            phoneNumberId,
          });
          envioExitoso = Boolean(envio?.success);
        } catch {
          envioExitoso = false;
        }

        if (!envioExitoso) {
          await agregarPropuestasDeduplicadas([{
            clave: 'prospecto-anuncio-fallo-envio:' + (messageId || phone),
            titulo: 'Contestar al prospecto: no salió el mensaje automático',
            area: 'ventas',
            tipoPropuesta: 'prospecto_envio_fallido',
            nivelRiesgo: 'aviso' as any,
            quePasa: `No se pudo enviar la consulta de datos faltantes al prospecto (${phone}).`,
            porQueImporta: 'El prospecto no recibió el pedido de datos para su presupuesto.',
            quePropone: `Contactar manualmente a ${clientName || phone} para pedirle los datos faltantes.`,
          }]);
        }

        return NextResponse.json({ status: 'ok', tipo: 'prospecto_anuncio_incompleto', respondido: true }, { status: 200 });
      }

      return NextResponse.json({ status: 'ok', tipo: 'prospecto_anuncio_atendido', respondido: false }, { status: 200 });
    }

    if (atencionAnuncio.completo) {
      return NextResponse.json({
        status: 'ok', tipo: 'prospecto_anuncio_borrador',
        completo: true, respondido: false, requiereRevision: true,
      }, { status: 200 });
    }

    const result = await processIncomingMessage(phone, messageText, clientName, WHATSAPP_WEBHOOK_INTERNAL_TOKEN);
    if (!result.success) {
      console.error('[WhatsApp Webhook] Error processing message:', result.error);
      return NextResponse.json({ status: 'ok' }, { status: 200 });
    }
    if (result.botResponse && body.From) {
      const text = result.botResponse.replace(/[<>&"']/g, char => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
      })[char]!);
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${text}</Message></Response>`, {
        status: 200, headers: { 'Content-Type': 'text/xml' },
      });
    }
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Unexpected error:', error);
    // Always return 200 to prevent provider retries
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  }
}
