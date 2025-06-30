
'use server';
/**
 * @fileOverview An AI agent for generating marketing testimonials from client feedback.
 *
 * - generateTestimonial - Generates a professional testimonial based on client survey responses.
 * - GenerateTestimonialInput - The input type for the generateTestimonial function.
 * - GenerateTestimonialOutput - The return type for the generateTestimonial function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateTestimonialInputSchema = z.object({
  clientName: z.string().describe('The name of the client providing the feedback.'),
  enjoyedMost: z.string().describe('The part of the service the client enjoyed the most.'),
  toImprove: z.string().describe('What the client suggests for improvement.'),
  generalComments: z.string().optional().describe('Any other general comments from the client.'),
});
export type GenerateTestimonialInput = z.infer<typeof GenerateTestimonialInputSchema>;

export const GenerateTestimonialOutputSchema = z.object({
  testimonialText: z.string().describe('The generated marketing testimonial, written from the client\'s perspective in a warm and professional tone. It should be concise and ready for use on social media or a website.'),
});
export type GenerateTestimonialOutput = z.infer<typeof GenerateTestimonialOutputSchema>;

export async function generateTestimonial(
  input: GenerateTestimonialInput
): Promise<GenerateTestimonialOutput> {
  return generateTestimonialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestimonialPrompt',
  input: { schema: GenerateTestimonialInputSchema },
  output: { schema: GenerateTestimonialOutputSchema },
  prompt: `Eres un experto en marketing para una empresa de planificación de eventos de primer nivel. Tu tarea es convertir el feedback de un cliente en un testimonio cálido, profesional y auténtico que se pueda usar en redes sociales o en la web.

El testimonio debe:
- Estar escrito desde la perspectiva del cliente (en primera persona).
- Ser conciso y sonar natural.
- Enfocarse en los aspectos positivos mencionados en "Lo que más disfrutó" y "Comentarios generales".
- **IGNORAR POR COMPLETO** cualquier punto negativo o sugerencia de mejora mencionado en "Qué mejorarías".
- Terminar con el nombre del cliente, como si fuera una firma.

Aquí está el feedback del cliente:
- **Cliente:** {{{clientName}}}
- **Lo que más disfrutó:** {{{enjoyedMost}}}
- **Qué mejorarías:** {{{toImprove}}}
- **Comentarios generales:** {{{generalComments}}}

Genera el texto del testimonio. Responde ÚNICAMENTE con el objeto JSON que contiene el texto del testimonio.
`,
});

const generateTestimonialFlow = ai.defineFlow(
  {
    name: 'generateTestimonialFlow',
    inputSchema: GenerateTestimonialInputSchema,
    outputSchema: GenerateTestimonialOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("La IA no pudo generar un testimonio. Inténtalo de nuevo.");
    }
    return output;
  }
);
