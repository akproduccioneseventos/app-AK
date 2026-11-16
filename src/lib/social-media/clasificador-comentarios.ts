/**
 * Clasificador de comentarios de redes sociales con Inteligencia Artificial.
 *
 * REGLAS FUNDAMENTALES DEL DUEÑO (Actualizado 12/11/2026, Orden 282):
 * 1. Pasa obligatoriamente por el contador de presupuesto: `hayPresupuestoParaIA()` antes,
 *    y `registrarConsumoIA('clasificacion-comentarios')` después.
 * 2. Si no hay presupuesto o la IA no responde, queda sin clasificar. NUNCA inventar por palabras sueltas.
 * 3. Idioma rioplatense y modismos uruguayos:
 *    - "Está de más" / "divino" / "impecable" -> Positivo.
 *    - "Y bueno..." / dudas operativas -> Neutro.
 * 4. Quejas legítimas y comentarios negativos -> autoHideRecommended: true (SE OCULTAN SOLAS
 *    de forma preventiva y reversible; en Meta ocultar no borra y el autor lo sigue viendo; NUNCA borrar).
 * 5. A una queja legítima o comentario negativo NO se le contesta automáticamente sola (debeResponder: false).
 *    Se envía alerta por WhatsApp al dueño en el momento con texto y enlace para que él conteste en persona si quiere.
 * 6. Insultos, agresiones, spam, datos personales o nombres de menores -> isInsultOrSpam: true (se ocultan sin borrar).
 * 7. Comentarios positivos o neutros reciben agradecimiento cordial con la voz de AK (sin precios, sin 'garantía',
 *    sin '24/7', sin nombrar personal ni agasajado).
 */

import { generateWithGeminiFallback } from '@/ai/genkit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { readData } from '@/lib/data-service';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import type { CommentSentiment } from '@/types/comentarios-redes';

export interface ClasificacionComentarioResult {
  classified: boolean;
  sentiment?: CommentSentiment;
  sentimentReason?: string;
  isInsultOrSpam?: boolean;
  isLegitimateComplaint?: boolean;
  esPregunta?: boolean;
  autoHideRecommended?: boolean;
  debeResponder?: boolean;
  error?: string;
}

export function sanitizarTextoRespuesta(texto: string): string {
  return texto
    .replace(/\$?\s*\d+([.,]\d+)?\s*(usd|dólares|pesos|uyu)?/gi, '')
    .replace(/garant[íi]a\w*/gi, '')
    .replace(/24\/7/gi, '')
    .replace(/24\s*hs?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export interface AlertaComentarioParams {
  text: string;
  authorName?: string;
  permalink?: string;
  postUrl?: string;
  sentimentReason?: string;
  network?: string;
}

/**
 * Alerta por WhatsApp al dueño en el momento ante una queja o comentario negativo con el texto y enlace.
 */
export async function alertarDuenioPorComentarioNegativo(
  comentario: AlertaComentarioParams
): Promise<{ enviado: boolean; mensaje: string; error?: string }> {
  const settings = await readData<any>('asistente-settings.json', {}).catch(() => ({}));
  const numeroDuenio = (settings?.numeroDuenio || '').replace(/\D/g, '') || AK_WHATSAPP_NUMBER;
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';

  const enlace = comentario.permalink || comentario.postUrl || 'https://facebook.com';
  const autor = comentario.authorName || 'Usuario';
  const motivo = comentario.sentimentReason ? ` (${comentario.sentimentReason})` : '';

  const mensaje = `⚠️ *Alerta: queja o comentario negativo detectado en redes*${motivo}\n\n` +
    `👤 *Autor:* ${autor}\n` +
    `💬 *Comentario:* "${comentario.text}"\n` +
    `🔗 *Enlace:* ${enlace}\n\n` +
    `_Se ocultó preventivamente de forma reversible en Meta. Podés responder directamente desde el enlace._`;

  if (!apiToken || !phoneNumberId) {
    return { enviado: false, mensaje, error: 'Faltan credenciales de WhatsApp Meta' };
  }

  try {
    const res = await sendMetaWhatsAppMessage({
      to: numeroDuenio,
      text: mensaje,
      apiToken,
      phoneNumberId,
    });
    return { enviado: res.success, mensaje, error: res.error };
  } catch (err: any) {
    return { enviado: false, mensaje, error: err?.message || String(err) };
  }
}

/**
 * Genera agradecimiento cordial con la voz de AK para comentarios positivos o neutros.
 * Sin precios, sin 'garantía', sin '24/7', sin nombrar personal ni agasajado.
 */
export async function armarAgradecimientoComentario(
  comentarioTexto: string,
  autor?: string,
): Promise<string | null> {
  const tienePresupuesto = await hayPresupuestoParaIA();
  if (!tienePresupuesto) return null;

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return '¡Muchas gracias por acompañarnos y por la buena onda! Nos alegra un montón que te guste nuestro trabajo.';
  }

  try {
    const prompt = `Un usuario (${autor || 'Cliente'}) dejó este comentario en las redes de AK Producciones:
"${comentarioTexto}"

Generá una respuesta corta (máximo 2 oraciones), amable y cordial en español rioplatense (uruguayo) agradeciendo el comentario con la voz de AK Producciones.
REGLAS ESTRICTAS DE SEGURIDAD Y ESTILO:
1. NO des ningún precio ni menciones números de dinero bajo ningún concepto.
2. NUNCA uses la palabra "garantía" ni "garantizar".
3. NUNCA menciones atención o servicio "24/7" ni "24 horas".
4. NO nombres a nadie del personal ni menciones el nombre del agasajado o cliente específico.
5. Mostrá calidez, cercanía y gratitud sincera.`;

    const respuesta = await generateWithGeminiFallback({ prompt });
    const textoIA = (respuesta.text || '').trim();
    const agradecimiento = textoIA || '¡Muchas gracias por el apoyo y la linda onda!';

    await registrarConsumoIA('clasificacion-comentarios');

    return sanitizarTextoRespuesta(agradecimiento);
  } catch {
    return '¡Muchas gracias por acompañarnos y por el lindo comentario!';
  }
}

export async function clasificarComentario(
  texto: string,
  authorName?: string
): Promise<ClasificacionComentarioResult> {
  const textoLimpio = texto?.trim();
  if (!textoLimpio) {
    return {
      classified: true,
      sentiment: 'neutro',
      sentimentReason: 'Comentario vacío o sin texto',
      isInsultOrSpam: false,
      isLegitimateComplaint: false,
      esPregunta: false,
      autoHideRecommended: false,
      debeResponder: false,
    };
  }

  // 1. Control de presupuesto
  const tienePresupuesto = await hayPresupuestoParaIA();
  if (!tienePresupuesto) {
    return {
      classified: false,
      error: 'Sin presupuesto de IA disponible este mes.',
    };
  }

  // La misma clave que usa el resto de la IA (genkit): si no hay, no se intenta.
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      classified: false,
      error: 'No hay clave de Google Gemini configurada en el servidor.',
    };
  }

  try {
    const prompt = `Analizá el siguiente comentario dejado en las redes sociales de AK Producciones (empresa de fiestas, eventos, 15 años y bodas en Salto, Uruguay).

Texto del comentario: "${textoLimpio}"
Autor: "${authorName || 'Anónimo'}"

Reglas estrictas de moderación y modismos uruguayos:
1. Positivo: elogios, agradecimientos, recomendaciones sinceras ("está de más", "divino todo", "los mejores", "un éxito").
2. Neutro: preguntas generales ("a qué hora arranca?", "cuánto sale?"), comentarios descriptivos o expresiones ambiguas ("y bueno...").
3. Queja Legítima: disconformidad genuina de un cliente sobre atención, comida, sonido, fotos o puntualidad.
4. Insulto / Spam / Datos: agresiones directas, groserías ofensivas, spam comercial ajeno, publicación de números de teléfono personales o exposición indebida de menores.
5. Pregunta Comercial: consultas sobre precios, fechas, disponibilidad de fechas o cómo contratar.

CRITERIO DE SEGURIDAD (Decisión del dueño, 12/11/2026, Orden 282):
- Tanto insultos/spam como quejas legítimas y comentarios negativos recomiendan ocultar automáticamente (autoHide: true) porque en Meta ocultar no borra y es reversible.
- A las quejas legítimas y comentarios negativos NO se les contesta de forma automática sola (debeResponder: false).
- A los comentarios positivos o neutros se les puede contestar automáticamente (debeResponder: true).

Respondé ÚNICAMENTE en formato JSON plano con esta estructura exacta:
{
  "sentiment": "positivo" | "neutro" | "negativo",
  "sentimentReason": "Explicación corta en criollo (máximo 12 palabras)",
  "isInsultOrSpam": boolean,
  "isLegitimateComplaint": boolean,
  "esPregunta": boolean,
  "autoHide": boolean,
  "debeResponder": boolean
}`;

    // Pasa por la función con respaldos de modelo: antes llamaba a gemini-1.5-flash (retirado) por
    // fetch directo y, si fallaba, no probaba ningún otro.
    const respuesta = await generateWithGeminiFallback({
      prompt,
      output: { format: 'json' },
    });
    const rawContent = (respuesta.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    if (!rawContent) {
      return { classified: false, error: 'Respuesta vacía de la IA' };
    }

    const parsed = JSON.parse(rawContent);

    // Registrar consumo contabilizado
    await registrarConsumoIA('clasificacion-comentarios');

    const sentiment: CommentSentiment =
      parsed.sentiment === 'positivo' || parsed.sentiment === 'negativo'
        ? parsed.sentiment
        : 'neutro';

    const isInsultOrSpam = Boolean(parsed.isInsultOrSpam);
    const isLegitimateComplaint = Boolean(parsed.isLegitimateComplaint);
    const esPregunta = Boolean(
      parsed.esPregunta ??
        /(\?|cu[aá]nto|precio|cotiz|fecha|disponib|c[oó]mo contratar|info|costo|sale|disponible|alquilan)/i.test(
          textoLimpio,
        ),
    );

    const esQuejaONegativo = sentiment === 'negativo' || isLegitimateComplaint;

    // Decisión del dueño (12/11/2026, Orden 282): las quejas legítimas y comentarios negativos
    // AHORA TAMBIÉN recomiendan ocultar (autoHideRecommended: true), porque ocultar en Meta no borra y es reversible.
    const autoHideRecommended = Boolean(parsed.autoHide || isInsultOrSpam || esQuejaONegativo);

    // A una queja o comentario negativo NO se le contesta automáticamente sola (debeResponder: false).
    // Insultos y spam tampoco se contestan automáticamente.
    const debeResponder = !esQuejaONegativo && !isInsultOrSpam && (parsed.debeResponder !== false);

    return {
      classified: true,
      sentiment,
      sentimentReason: parsed.sentimentReason || 'Analizado con IA',
      isInsultOrSpam,
      isLegitimateComplaint,
      esPregunta,
      autoHideRecommended,
      debeResponder,
    };
  } catch (error: any) {
    console.warn('[clasificador-comentarios] Error procesando comentario:', error?.message);
    return {
      classified: false,
      error: error?.message || 'Error al clasificar comentario.',
    };
  }
}
