
'use server';
/**
 * @fileOverview An AI agent for generating a weekly social media content plan.
 *
 * - generateMarketingPlan - Creates a content plan based on brand identity and goals.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema: Define the brand identity for the AI
export const MarketingPlanInputSchema = z.object({
  brandName: z.string().describe("The name of the company or brand."),
  targetAudience: z.string().describe("A description of the ideal customer or target audience."),
  keyServices: z.string().describe("A list of the main services offered."),
  toneOfVoice: z.enum(['Profesional y Corporativo', 'Cercano y Amistoso', 'Moderno y Divertido', 'Lujoso y Exclusivo']).describe("The desired tone of voice for the social media posts."),
  mainGoal: z.string().describe("The primary objective of the social media strategy for the week (e.g., generate leads, build brand awareness, showcase portfolio)."),
});
export type MarketingPlanInput = z.infer<typeof MarketingPlanInputSchema>;

// Output Schema: Define the structure of the weekly content plan
const DailyPostIdeaSchema = z.object({
  day: z.string().describe("Day of the week (e.g., 'Lunes')."),
  theme: z.string().describe("The theme or topic for the day's post (e.g., 'Tip de la Semana', 'Detrás de Escena')."),
  contentIdea: z.string().describe("A concrete idea for the post content, including text and visual suggestions."),
  suggestedHashtags: z.string().describe("A few relevant hashtags for the post."),
});

export const MarketingPlanOutputSchema = z.object({
  weeklySummary: z.string().describe("A brief, high-level summary of the proposed strategy for the week."),
  dailyPlan: z.array(DailyPostIdeaSchema).describe("A list of content ideas for each day of the week, from Lunes to Domingo."),
});
export type MarketingPlanOutput = z.infer<typeof MarketingPlanOutputSchema>;

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
  prompt: `Eres un experto en marketing de redes sociales y estratega de contenido especializado en el rubro de eventos. Tu tarea es crear un plan de contenido semanal coherente y efectivo para la marca '{{{brandName}}}'.

**Identidad de la Marca y Objetivos:**
- **Público Objetivo:** {{{targetAudience}}}
- **Servicios Clave:** {{{keyServices}}}
- **Tono de Voz:** {{{toneOfVoice}}}
- **Objetivo Principal de la Semana:** {{{mainGoal}}}

**Instrucciones:**
1.  **Estrategia Semanal:** Basado en el objetivo principal, crea un resumen de la estrategia a seguir durante la semana.
2.  **Plan Diario:** Genera una idea de publicación para cada día de la semana (Lunes a Domingo).
3.  **Contenido de Valor:** Las ideas deben seguir la filosofía de "vender sin vender". Enfócate en aportar valor, educar, entretener o mostrar el "detrás de escena". Evita llamados a la acción directos y agresivos como "¡Contrátanos ya!".
4.  **Coherencia:** El plan debe ser coherente con el tono de voz y el público objetivo.
5.  **Formato:** Responde ÚNICAMENTE con el objeto JSON de salida especificado. Asegúrate de que el 'dailyPlan' contenga 7 ideas, una para cada día.

Crea el plan de contenido.`,
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
