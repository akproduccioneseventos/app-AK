'use server';

import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';

export interface GenerateTestimonialInput {
  clientName: string;
  eventType: string;
  eventDate: string;
  rating?: number;
  highlights?: string[];
  comments?: string;
}

export interface GenerateTestimonialOutput {
  testimonial: string;
  shortQuote: string;
}

function buildFallback(input: GenerateTestimonialInput): GenerateTestimonialOutput {
  const clientName = input.clientName?.trim() || 'Nuestro cliente';
  const eventType = input.eventType?.trim() || 'evento';
  const ratingText = input.rating ? ` con una valoracion de ${input.rating}/5` : '';
  const highlights = input.highlights?.filter(Boolean).slice(0, 3).join(', ');
  const extra = highlights ? ` Lo que mas se destaco fue: ${highlights}.` : '';

  return {
    testimonial: `${clientName} celebro su ${eventType} el ${input.eventDate}${ratingText}. La experiencia AK combino organizacion, tecnologia y atencion cercana para que la fiesta se viviera simple, linda y sin estres.${extra}`,
    shortQuote: `AK hizo que nuestro ${eventType} se sintiera organizado, moderno y especial.`,
  };
}

export async function generateTestimonialFlow(input: GenerateTestimonialInput): Promise<GenerateTestimonialOutput> {
  const fallback = buildFallback(input);

  const canUseAI = await hayPresupuestoParaIA().catch(() => false);
  if (!canUseAI) return fallback;

  try {
    const model = getGeminiModelForAgent('marketing');
    const prompt = `Sos el redactor de testimonios de AK Producciones (Salto, Uruguay).
A partir de la devolución real de un cliente, redactá un testimonio en primera persona, auténtico y cálido, sin inventar hechos.
Cliente: ${input.clientName || 'Cliente'}
Tipo de fiesta: ${input.eventType || 'Evento'}
Fecha: ${input.eventDate || ''}
Calificación: ${input.rating || 5}/5
Comentarios: "${input.comments || (input.highlights || []).join(', ')}"

Devolvé SOLO un JSON válido con:
{
  "testimonial": "párrafo de 2 a 3 oraciones en primera persona agradeciendo a AK Producciones",
  "shortQuote": "frase corta y destacada para tarjeta web"
}`;

    const res = await generateWithGeminiFallback({ model, prompt });
    const raw = res?.text?.trim() || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.testimonial && parsed.shortQuote) {
        await registrarConsumoIA('resumen-feedback').catch(() => {});
        return {
          testimonial: parsed.testimonial,
          shortQuote: parsed.shortQuote,
        };
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

