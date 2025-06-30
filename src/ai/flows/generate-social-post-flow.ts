
'use server';
/**
 * @fileOverview An AI agent for generating social media posts for events.
 *
 * - generateSocialPost - Generates a social media post text based on event details and a desired style.
 * - GenerateSocialPostInput - The input type for the generateSocialPost function.
 * - GenerateSocialPostOutput - The return type for the generateSocialPost function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSocialPostInputSchema = z.object({
  eventName: z.string().describe('The name of the event.'),
  eventType: z.string().describe('The type of event (e.g., Boda, Fiesta de 15, Evento Corporativo).'),
  eventDate: z.string().describe('The date of the event.'),
  style: z.enum(['divertida', 'elegante', 'promocional']).describe('The desired tone or style for the post.'),
  // In a future version, we could add more context like services, venue, etc.
});
export type GenerateSocialPostInput = z.infer<typeof GenerateSocialPostInputSchema>;

const GenerateSocialPostOutputSchema = z.object({
  postText: z.string().describe('The generated social media post text, including relevant hashtags.'),
});
export type GenerateSocialPostOutput = z.infer<typeof GenerateSocialPostOutputSchema>;

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
