
'use server';
/**
 * @fileOverview An AI agent for generating marketing testimonials from client feedback.
 *
 * - generateTestimonial - Generates a professional testimonial based on client survey responses.
 */

import { ai } from '@/ai/genkit';
import { GenerateTestimonialInputSchema, type GenerateTestimonialInput, GenerateTestimonialOutputSchema, type GenerateTestimonialOutput } from '@/ai/types/generate-testimonial-types';

export async function generateTestimonial(
  input: GenerateTestimonialInput
): Promise<GenerateTestimonialOutput> {
  return generateTestimonialFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTestimonialPrompt',
  input: { schema: GenerateTestimonialInputSchema },
  output: { schema: GenerateTestimonialOutputSchema },
  model: 'googleai/gemini-1.5-flash-preview-0514',
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

    