import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';

export interface UnbookedLeadRemarketingCandidate {
  id: string;
  name: string;
  phone?: string;
  eventType?: string;
  createdAt: string;
  budgetTotal?: number;
}

export interface RemarketingResult {
  processedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  details: { leadId: string; phone: string; success: boolean; error?: string }[];
}

/**
 * Genera el mensaje amigable de seguimiento por WhatsApp (Neuroventas "Vender sin vender").
 * Si hay presupuesto de IA, lo redacta a medida. Si no, usa el predeterminado.
 */
export async function buildRemarketingMessage(
  name: string,
  eventType?: string,
  createdAt?: string,
  budgetTotal?: number
): Promise<string> {
  const firstName = name.trim().split(' ')[0] || name;
  const eventLabel = eventType ? eventType.toLowerCase() : 'tu fiesta';

  const defaultMessage = `¡Hola ${firstName}! 👋 ¿Cómo estás? Te escribimos de AK Producciones.

Vimos que estuviste consultando el presupuesto para ${eventLabel}. Queríamos saber si te quedó alguna duda con las opciones o si querés que ajustemos algún servicio a tu medida.

Si señás tu fecha esta semana, te incluimos un beneficio exclusivo para tu evento. 🎉

¿Te gustaría que te llamemos o te pasemos más fotos del salón?`;

  try {
    const { hayPresupuestoParaIA, registrarConsumoIA } = await import('@/lib/ai/consumo-servidor');
    if (!(await hayPresupuestoParaIA())) {
      return defaultMessage;
    }

    const { generateWithGeminiFallback, geminiMarketingModel } = await import('@/ai/genkit');
    const dias = createdAt
      ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 2;

    const response = await generateWithGeminiFallback({
      model: geminiMarketingModel,
      prompt: `Sos un asesor de ventas amable de AK Producciones, una empresa de fiestas de Uruguay.
Tu objetivo es reactivar el interés de un cliente que cotizó un evento hace unos días pero no señó.
Reglas:
- Escribí en español rioplatense (uruguayo), usando "vos".
- Tono: empático, cercano, neuroventas ("vender sin vender"). No suenes robot.
- Corto, no más de tres párrafos breves.
- Nombre del cliente: ${firstName}
- Evento: ${eventLabel}
- Días desde que cotizó: ${dias} días.
- Total cotizado: ${budgetTotal ? `$${budgetTotal} UYU` : 'Desconocido'}. (No menciones el total si es Desconocido. Si lo mencionas, que sea sutil).
- OFRECÉ EXACTAMENTE ESTO: "Si señás tu fecha esta semana, te incluimos un beneficio exclusivo para tu evento. 🎉" y terminá preguntando sutilmente si le quedó alguna duda o prefiere que lo llamemos.
- NADA DE PROMETER DESCUENTOS ESPECÍFICOS O COSAS QUE NO SEAN EL "BENEFICIO EXCLUSIVO". NO INVENTES DATOS. NO INVENTES NOMBRES.`,
    });

    if (response.text) {
      await registrarConsumoIA('remarketing');
      return response.text.trim();
    }
  } catch (error) {
    console.error('[buildRemarketingMessage] Falló la generación por IA, usando fallback estático.', error);
  }

  return defaultMessage;
}

/**
 * Procesa el remarketing de prospectos no señados a 48hs
 */
export async function processUnbookedLeadsRemarketing(
  candidates: UnbookedLeadRemarketingCandidate[]
): Promise<RemarketingResult> {
  const apiToken = process.env.META_WHATSAPP_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || '';

  const details: { leadId: string; phone: string; success: boolean; error?: string }[] = [];
  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  if (!apiToken || !phoneNumberId) {
    console.warn('[remarketing] No hay credenciales de WhatsApp configuradas. Se omiten los envíos.');
    return {
      processedCount: candidates.length,
      sentCount: 0,
      failedCount: 0,
      skippedCount: candidates.length,
      details: candidates
        .filter((l) => l.phone)
        .map((l) => ({ leadId: l.id, phone: l.phone!, success: false, error: 'Sin credenciales WhatsApp' })),
    };
  }

  for (const lead of candidates) {
    if (!lead.phone) {
      skippedCount += 1;
      continue;
    }

    const message = await buildRemarketingMessage(lead.name, lead.eventType, lead.createdAt, lead.budgetTotal);

    try {
      const res = await sendMetaWhatsAppMessage({
        to: lead.phone,
        text: message,
        apiToken,
        phoneNumberId,
      });

      if (res.success) {
        sentCount += 1;
        details.push({ leadId: lead.id, phone: lead.phone, success: true });
      } else {
        failedCount += 1;
        details.push({ leadId: lead.id, phone: lead.phone, success: false, error: res.error });
      }
    } catch (err) {
      failedCount += 1;
      details.push({
        leadId: lead.id,
        phone: lead.phone,
        success: false,
        error: err instanceof Error ? err.message : 'Error inesperado al enviar WhatsApp',
      });
    }
  }

  return {
    processedCount: candidates.length,
    sentCount,
    failedCount,
    skippedCount,
    details,
  };
}
