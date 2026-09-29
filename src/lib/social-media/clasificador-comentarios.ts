/**
 * Clasificador de comentarios de redes sociales con Inteligencia Artificial.
 *
 * REGLAS FUNDAMENTALES DEL DUEÑO:
 * 1. Pasa obligatoriamente por el contador de presupuesto: `hayPresupuestoParaIA()` antes,
 *    y `registrarConsumoIA('clasificacion-comentarios')` después.
 * 2. Si no hay presupuesto o la IA no responde, queda sin clasificar. NUNCA inventar por palabras sueltas.
 * 3. Idioma rioplatense y modismos uruguayos:
 *    - "Está de más" / "divino" / "impecable" -> Positivo.
 *    - "Y bueno..." / dudas operativas -> Neutro.
 * 4. Quejas legítimas de clientes -> Negativo / isLegitimateComplaint: true (NO SE OCULTAN SOLAS; se avisa).
 * 5. Insultos, agresiones, spam, datos personales o nombres de menores -> isInsultOrSpam: true (se ocultan de forma reversible con aviso).
 * 6. Si duda entre queja e insulto -> trata como queja (avisa y no oculta).
 */

import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import type { CommentSentiment } from '@/types/comentarios-redes';

export interface ClasificacionComentarioResult {
  classified: boolean;
  sentiment?: CommentSentiment;
  sentimentReason?: string;
  isInsultOrSpam?: boolean;
  isLegitimateComplaint?: boolean;
  autoHideRecommended?: boolean;
  error?: string;
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
      autoHideRecommended: false,
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

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
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

CRITERIO DE SEGURIDAD:
- Si dudás entre insulto y queja legítima, marcalo SIEMPRE como queja legítima (NO ocultar automáticamente).
- El campo "autoHide" debe ser true ÚNICAMENTE para insultos graves, spam evidente o violación de privacidad. Para quejas legítimas debe ser false.

Respondé ÚNICAMENTE en formato JSON plano con esta estructura exacta:
{
  "sentiment": "positivo" | "neutro" | "negativo",
  "sentimentReason": "Explicación corta en criollo (máximo 12 palabras)",
  "isInsultOrSpam": boolean,
  "isLegitimateComplaint": boolean,
  "autoHide": boolean
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[clasificador-comentarios] Error API Gemini:', errText);
      return {
        classified: false,
        error: `Error al contactar IA (${response.status})`,
      };
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
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

    // Si es queja legítima, autoHide nunca debe ser true
    const autoHideRecommended = isLegitimateComplaint ? false : Boolean(parsed.autoHide || isInsultOrSpam);

    return {
      classified: true,
      sentiment,
      sentimentReason: parsed.sentimentReason || 'Analizado con IA',
      isInsultOrSpam,
      isLegitimateComplaint,
      autoHideRecommended,
    };
  } catch (error: any) {
    console.warn('[clasificador-comentarios] Error procesando comentario:', error?.message);
    return {
      classified: false,
      error: error?.message || 'Error al clasificar comentario.',
    };
  }
}
