
'use server';
/**
 * @fileOverview An AI agent for analyzing an event plan.
 *
 * - analyzeEventPlan - A function that handles the event plan analysis process.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeEventPlanInputSchema, type AnalyzeEventPlanInput, AnalyzeEventPlanOutputSchema, type AnalyzeEventPlanOutput } from '@/ai/types/analyze-event-plan-types';

export async function analyzeEventPlan(input: AnalyzeEventPlanInput): Promise<AnalyzeEventPlanOutput> {
  return analyzeEventPlanFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeEventPlanPrompt',
  input: { schema: AnalyzeEventPlanInputSchema },
  output: { schema: AnalyzeEventPlanOutputSchema },
  prompt: `Eres un asistente experto en planificación de eventos para una empresa llamada AK Producciones. Tu tarea es analizar de forma exhaustiva el plan de un evento, identificar áreas incompletas, señalar posibles problemas y ofrecer sugerencias útiles.

Analiza el siguiente objeto JSON que contiene todos los datos del evento en planificación. Para cada módulo principal, determina su estado y proporciona detalles.

**Reglas de Análisis:**
1.  **Configuración General:** Verifica que el nombre del evento, tipo, fecha, lugar e invitados estimados estén completos. Si no hay un cliente asignado, señálalo como una prioridad.
2.  **Invitados:** Si la lista de invitados está vacía, el estado es 'Faltante'. Si hay invitados pero la mayoría están 'Pendiente', el estado es 'Parcial'. Si el número de invitados confirmados (considerando 'partySize') supera la cantidad de asientos en el plano del salón (calcula la suma de 'seats' de todos los elementos 'Mesa...'), el estado es 'Atención Requerida'.
3.  **Decoración:** Revisa si la paleta de colores es la predeterminada. Si es así, sugiere personalizarla. Verifica si se han añadido elementos de decoración ('items') o se han activado 'zonasContratadas'. Si no, está 'Faltante'. Si el plano del salón ('salonElements') está vacío, menciónalo.
4.  **Catering:** Comprueba si 'menuAsignadoId' tiene un valor. Si no, el catering está 'Faltante'.
5.  **Personal:** Si 'personalAsignado' está vacío, el módulo está 'Faltante'.
6.  **Tareas:** Cuenta cuántas tareas están completadas. Si hay muchas pendientes, sugiere revisarlas.
7.  **Documentos:** Verifica si 'presupuestoId' tiene valor. Si el presupuesto está 'Aceptado' pero no hay 'invoiceIds', sugiere crear la factura.
8.  **Portal del Cliente:** Revisa 'webPageSettings' y 'clientPortalSettings'. Si están en su mayoría deshabilitados, sugiere al organizador activarlos para mejorar la experiencia del cliente.

**Formato de Salida:**
Genera un informe claro y conciso en español. Para cada 'AnalysisItem', sé específico en los 'details' y 'suggestion'.

**Plan de Evento (JSON):**
\`\`\`json
{{{json planData}}}
\`\`\`

Proporciona tu análisis en el formato JSON de salida especificado.`,
});

const analyzeEventPlanFlow = ai.defineFlow(
  {
    name: 'analyzeEventPlanFlow',
    inputSchema: AnalyzeEventPlanInputSchema,
    outputSchema: AnalyzeEventPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("La IA no pudo generar un análisis del plan de evento.");
    }
    return output;
  }
);
