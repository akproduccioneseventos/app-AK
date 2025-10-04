
'use server';
/**
 * @fileOverview An AI agent for generating a weekly social media content plan.
 *
 * - generateMarketingPlan - Creates a content plan based on brand identity and goals.
 */

import { ai } from '@/ai/genkit';
import {
  MarketingPlanInputSchema,
  type MarketingPlanInput,
  MarketingPlanOutputSchema,
  type MarketingPlanOutput,
} from '@/ai/types/generate-marketing-plan-types';

// Exported function to be called from the UI
export async function generateMarketingPlan(
  input: MarketingPlanInput
): Promise<MarketingPlanOutput> {
  return generateMarketingPlanFlow(input);
}

// Genkit Prompt
const prompt = ai.definePrompt({
  name: 'generateMarketingPlanPrompt',
  input: { schema: MarketingPlanInputSchema },
  output: { schema: MarketingPlanOutputSchema },
  prompt: `Eres un estratega de marketing de élite para redes sociales, especializado en el sector de eventos para la marca '{{{brandName}}}'. Tu misión es diseñar un plan de contenido semanal innovador y altamente efectivo que cumpla con el objetivo principal del cliente.

**Análisis de la Marca y Objetivos:**
- **Público Objetivo:** {{{targetAudience}}}
- **Servicios Clave:** {{{keyServices}}}
- **Tono de Voz:** {{{toneOfVoice}}}
- **OBJETIVO PRINCIPAL DE ESTA SEMANA:** {{{mainGoal}}}

**Instrucciones Detalladas:**

1.  **Interpretación del Objetivo:**
    *   Si el objetivo es **'Generar Leads'**: Enfócate en contenido que demuestre valor, muestre resultados y facilite el contacto. Incluye llamados a la acción sutiles.
    *   Si el objetivo es **'Hacerme Viral'**: Prioriza ideas para videos cortos (Reels/TikTok) con audios en tendencia, formatos de "antes y después" impactantes, o contenido que genere polémica o debate en los comentarios.
    *   Si el objetivo es **'Construir Autoridad'**: Concéntrate en "Pilares de Contenido". Crea posts educativos, comparte "secretos del rubro", analiza tendencias y muestra tu expertise. El objetivo es que te vean como un referente.
    *   Para cualquier otro objetivo, adáptate creativamente.

2.  **Estrategia Semanal (Resumen):** Basado en el objetivo principal, redacta un resumen claro y conciso de la estrategia que seguirás durante la semana. Explica el "porqué" de tu plan.

3.  **Plan Diario (Lunes a Domingo):**
    *   Genera una idea de publicación **para cada día**.
    *   Para cada día, define un **tema** claro (Ej: "Lunes de Motivación", "Miércoles de Making-Of", "Viernes de Fiesta").
    *   Para cada **idea de contenido**, sé extremadamente específico. Incluye el formato (Ej: Reel, Carrusel, Historia interactiva), el texto principal sugerido, y ideas para el visual (Ej: "Video mostrando la transformación de un salón vacío a uno decorado", "Gráfico con 3 tips para elegir tu DJ").
    *   Incluye una lista de **hashtags** relevantes y de nicho.

4.  **Filosofía "Vender sin Vender":** Incluso si el objetivo es generar leads, evita los llamados a la acción agresivos. Aporta valor, educa, entretiene y muestra el proceso. Genera confianza y deseo.

5.  **Formato de Salida:** Responde ÚNICAMENTE con el objeto JSON especificado. Asegúrate de que el 'dailyPlan' contenga exactamente 7 ideas, una para cada día de la semana.`,
});

// Genkit Flow
const generateMarketingPlanFlow = ai.defineFlow(
  {
    name: 'generateMarketingPlanFlow',
    inputSchema: MarketingPlanInputSchema,
    outputSchema: MarketingPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output || !output.dailyPlan || output.dailyPlan.length !== 7) {
      throw new Error("La IA no pudo generar un plan de marketing válido y completo para toda la semana.");
    }
    return output;
  }
);
