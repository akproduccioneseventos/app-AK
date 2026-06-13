'use server';

import { ai, geminiCommercialModel } from '@/ai/genkit';
import {
  buildSimulatorAdvisorFallback,
  type SimulatorAdvisorInput,
  type SimulatorAdvisorResult,
} from '@/lib/simulator-ai-advisor';
import { z } from 'genkit';

const AdvisorPackageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  includedServices: z.array(z.string()),
  price: z.number().optional(),
  recommended: z.boolean().optional(),
});

const AdvisorInputSchema = z.object({
  question: z.string().optional(),
  eventType: z.string().optional(),
  guests: z.number(),
  durationHours: z.number(),
  hasVenue: z.boolean().nullable().optional(),
  selectedPackageId: z.string().optional(),
  selectedMenuItems: z.array(z.string()).optional(),
  packages: z.array(AdvisorPackageSchema),
});

const AdvisorOutputSchema = z.object({
  response: z.string(),
  recommendedPackageId: z.string().optional(),
  rationale: z.string().optional(),
});

const simulatorAdvisorPrompt = ai.definePrompt({
  name: 'simulatorPublicAdvisorPrompt',
  model: geminiCommercialModel,
  input: { schema: AdvisorInputSchema },
  output: { schema: AdvisorOutputSchema },
  config: { temperature: 0.2 },
  system: `Sos el asesor comercial publico de AK Producciones Eventos, en Salto, Uruguay.
Ayudas a una persona a elegir una fiesta usando UNICAMENTE los datos recibidos.

Reglas obligatorias:
- Responde en espanol rioplatense, claro y concreto, en un maximo de 90 palabras.
- No inventes paquetes, servicios, disponibilidad, promociones ni precios.
- Solo podes recomendar un recommendedPackageId que exista exactamente en PACKAGES.
- Los precios son estimados calculados por la app. No los recalcules ni los modifiques.
- Explica por que la recomendacion encaja con invitados, duracion, salon y menu.
- Si la pregunta pide algo que no esta en los datos, deci que debe confirmarlo una coordinadora.
- No solicites datos sensibles ni afirmes que una fecha esta reservada.`,
  prompt: `EVENTO:
- Tipo: {{eventType}}
- Invitados: {{guests}}
- Duracion: {{durationHours}} horas
- Tiene salon: {{hasVenue}}
- Paquete elegido: {{selectedPackageId}}
- Menu elegido:
{{#each selectedMenuItems}}
  - {{this}}
{{/each}}

PACKAGES:
{{#each packages}}
- ID: {{id}}
  Nombre: {{name}}
  Descripcion: {{description}}
  Precio estimado: {{price}}
  Destacado por AK: {{recommended}}
  Incluye:
{{#each includedServices}}
    - {{this}}
{{/each}}
{{/each}}

PREGUNTA DEL CLIENTE:
{{question}}

Devolve la respuesta estructurada. La recomendacion debe ser honesta y usar solo los IDs listados.`,
});

export async function askSimulatorAssistant(input: SimulatorAdvisorInput): Promise<SimulatorAdvisorResult> {
  const fallback = buildSimulatorAdvisorFallback(input);
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey || input.packages.length === 0) return fallback;

  try {
    const { output } = await Promise.race([
      simulatorAdvisorPrompt(input),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tiempo de espera agotado para Gemini')), 8000);
      }),
    ]);
    if (!output) return fallback;

    const validRecommendation = input.packages.some((pkg) => pkg.id === output.recommendedPackageId)
      ? output.recommendedPackageId
      : fallback.recommendedPackageId;

    return {
      response: output.response.trim() || fallback.response,
      recommendedPackageId: validRecommendation,
      rationale: output.rationale?.trim() || fallback.rationale,
      source: 'ai',
    };
  } catch (error) {
    console.error('[Simulador IA] Gemini no respondio; se usa recomendacion local.', error);
    return fallback;
  }
}
