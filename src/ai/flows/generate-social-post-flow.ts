import type { GenerateSocialPostInput, GenerateSocialPostOutput } from '@/ai/types/generate-social-post-types';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';

function normalizeHashtag(tag: string) {
  const clean = tag.trim().replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '');
  return clean ? `#${clean}` : '';
}

function buildFallbackPost(input: GenerateSocialPostInput): GenerateSocialPostOutput {
  const eventName = input.eventName?.trim() || 'tu fiesta';
  const hashtags = [
    ...(input.hashtags || []),
    'AKProducciones',
    'ExperienciaAK',
    input.eventType || 'Evento',
  ]
    .map(normalizeHashtag)
    .filter(Boolean)
    .slice(0, 8);

  const caption = [
    `${eventName} no es solo una fiesta: es una experiencia completa.`,
    `En AK Producciones unimos organizacion, pantallas, invitados, fotos, musica y momentos digitales para que cada persona viva el evento desde el celular y desde la pista.`,
    `Objetivo: ${input.goal || 'celebrar a lo grande'}.`,
    `Tono: ${input.tone || 'emocionante'}.`,
    'La tecnologia tambien puede emocionar.',
  ].join('\n\n');

  return {
    caption,
    shortCaption: `${eventName}: tecnologia, emocion y fiesta en una sola experiencia AK.`,
    hashtags,
    callToAction: 'Escribinos y armamos una experiencia a medida para tu evento.',
  };
}

export async function generateSocialPost(input: GenerateSocialPostInput): Promise<GenerateSocialPostOutput> {
  const fallback = buildFallbackPost(input);

  const canUseAI = await hayPresupuestoParaIA().catch(() => false);
  if (!canUseAI) {
    return fallback;
  }

  try {
    const model = getGeminiModelForAgent('marketing');
    const prompt = `Sos el Community Manager de AK Producciones (Salto, Uruguay).
Escribí un posteo de redes sociales para la fiesta "${input.eventName || 'Fiesta'}".
Tipo de fiesta: ${input.eventType || 'Evento'}.
Objetivo: ${input.goal || 'mostrar la energía y diversión'}.
Tono: ${input.tone || 'cálido y festivo'}.
Hashtags deseados: ${(input.hashtags || []).join(', ')}.

Reglas:
- Español rioplatense uruguayo, emocionante, sin exagerar ni sonar artificial.
- Destacá la diversión, la ambientación y la alegría compartida.
- Incluí entre 3 y 6 hashtags relevantes (#AKProducciones, #EventosSalto, etc.).
- Devolvé un JSON con:
  "caption": texto completo del post (con saltos de línea y emojis discretos).
  "shortCaption": una frase corta impactante.
  "hashtags": arreglo de hashtags (strings con #).
  "callToAction": una invitación sutil a contactar a AK.`;

    const result = await generateWithGeminiFallback({
      model,
      prompt,
    });

    const rawText = result.text.trim();
    // Parse JSON from text if returned with fences
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.caption) {
        await registrarConsumoIA('material-post-evento').catch((e) => console.warn('[ia] No se pudo anotar el consumo:', e));
        return {
          caption: parsed.caption,
          shortCaption: parsed.shortCaption || fallback.shortCaption,
          hashtags: Array.isArray(parsed.hashtags) && parsed.hashtags.length ? parsed.hashtags.map(normalizeHashtag).filter(Boolean) : fallback.hashtags,
          callToAction: parsed.callToAction || fallback.callToAction,
        };
      }
    }

    if (rawText.length > 30) {
      await registrarConsumoIA('material-post-evento').catch((e) => console.warn('[ia] No se pudo anotar el consumo:', e));
      return {
        caption: rawText,
        shortCaption: fallback.shortCaption,
        hashtags: fallback.hashtags,
        callToAction: fallback.callToAction,
      };
    }

    return fallback;
  } catch (error) {
    console.warn('[generateSocialPost] Fallback usado por error en Gemini:', error);
    return fallback;
  }
}

export const generateSocialPostFlow = generateSocialPost;

