import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateDjProfileSchema = z.object({
  eventoTipo: z.string(),
  playlistFiesta: z.string().optional(),
  listaNoReproducir: z.string().optional(),
  cancionesTortaBrindis: z.array(z.string()).optional(),
});

export type GenerateDjProfileInput = z.infer<typeof GenerateDjProfileSchema>;

export async function generateDjProfileFlow(input: GenerateDjProfileInput): Promise<string> {
  try {
    const prompt = `Actúa como un DJ profesional experto en eventos y fiestas.
Necesito que me generes un "DJ Brief" o Perfil Musical para una fiesta que estoy organizando.

Datos del evento:
- Tipo de fiesta: ${input.eventoTipo}
- Preferencias y playlist base: ${input.playlistFiesta || 'No especificadas, usa tu criterio para este tipo de fiesta.'}
- Lo que NO debe sonar: ${input.listaNoReproducir || 'Nada en particular, evita temas inapropiados.'}
- Canciones clave (torta/brindis): ${input.cancionesTortaBrindis?.join(', ') || 'A definir'}

Por favor genera un reporte profesional y estructurado con:
1. Una evaluación del estilo musical solicitado (Vibe check).
2. Sugerencias de 5 canciones para la recepción (música ambiente).
3. Sugerencias de 5 canciones para la cena o almuerzo (un poco más movido pero que permita hablar).
4. Sugerencias de 10 canciones infalibles para abrir y explotar la pista de baile, respetando las preferencias.
5. Recomendaciones técnicas o de flow para el DJ.

Responde directamente con el texto en formato legible (usando saltos de línea y viñetas). NO devuelvas JSON.`;

    const model = getGeminiModelForAgent('fiestas_general');
    const result = await generateWithGeminiFallback({
      model,
      prompt,
    });

    return result.text;
  } catch (error) {
    console.error('Error in generateDjProfileFlow:', error);
    return 'Hubo un error al generar el perfil musical.';
  }
}
