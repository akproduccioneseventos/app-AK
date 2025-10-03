
'use server';
/**
 * @fileOverview An AI agent for generating social media posts for events.
 *
 * - generateSocialPost - Generates a social media post text based on event details and a desired style.
 */

import { ai } from '@/ai/genkit';
import { GenerateSocialPostInputSchema, type GenerateSocialPostInput, GenerateSocialPostOutputSchema, type GenerateSocialPostOutput } from '@/ai/types/generate-social-post-types';

export async function generateSocialPost(
  input: GenerateSocialPostInput
): Promise<GenerateSocialPostOutput> {
  return generateSocialPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialPostPrompt',
  input: { schema: GenerateSocialPostInputSchema },
  output: { schema: GenerateSocialPostOutputSchema },
  prompt: `Eres un experto en marketing de redes sociales para una empresa de planificación de eventos. Tu tarea es escribir un post para redes sociales (Facebook, Instagram, TikTok) que sea atractivo y profesional.

El estilo del post debe ser: {{{style}}}.

Aquí están los detalles del evento:
- Nombre del Evento: {{{eventName}}}
- Tipo de Evento: {{{eventType}}}
- Fecha: {{{eventDate}}}

Genera un texto para la publicación que cree expectación y emoción. Incluye al menos 3 hashtags relevantes y creativos. El texto debe ser conciso, ideal para redes sociales.

Responde ÚNICAMENTE con el objeto JSON que contiene el texto del post.`,
});

const generateSocialPostFlow = ai.defineFlow(
  {
    name: 'generateSocialPostFlow',
    inputSchema: GenerateSocialPostInputSchema,
    outputSchema: GenerateSocialPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
