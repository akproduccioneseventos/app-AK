
'use server';
/**
 * @fileOverview The main AI assistant flow for conversational quoting.
 * This flow guides the user step-by-step to create a budget.
 */

import { ai } from '@/ai/genkit';
import { AssistantInputSchema, AssistantOutputSchema, type AssistantInput, type AssistantOutput } from '@/ai/types/assistant-types';
import { z } from 'genkit';
import { getOcupiedDates } from '@/app/actions/agenda';
import { savePresupuesto } from '@/app/actions/presupuestos';
import type { Message } from 'genkit';
import { getAssistantConfig, type DialogConfig } from '@/app/actions/assistant-config';


// Tool: Create a new quote
const createQuoteTool = ai.defineTool(
  {
    name: 'createQuote',
    description: 'Creates a new budget/quote for a potential client once all necessary information has been gathered (event type, guest count, client name, and optionally the date).',
    inputSchema: z.object({
      clienteNombre: z.string().describe("The name of the client or company."),
      eventoTipo: z.string().describe("The type of event (e.g., 'Boda', 'Cumpleaños de 15', 'Corporativo')."),
      invitadosCantidad: z.number().describe("The estimated number of guests."),
      eventoFecha: z.string().optional().describe("The estimated date of the event in YYYY-MM-DD format. Optional."),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      presupuestoId: z.string().optional(),
      message: z.string(),
      error: z.string().optional(),
    }),
  },
  async (input) => {
    try {
        if (input.eventoFecha) {
            const occupiedDates = await getOcupiedDates();
            const requestedDate = new Date(input.eventoFecha).toISOString().split('T')[0];
            if (occupiedDates.includes(requestedDate)) {
                return { 
                    success: false, 
                    message: `La fecha ${new Date(input.eventoFecha).toLocaleDateString('es-ES')} no está disponible. Por favor, sugiere al cliente otra fecha.`,
                    error: 'Date not available' 
                };
            }
        }
        const result = await savePresupuesto({
            clienteNombre: input.clienteNombre,
            eventoTipo: input.eventoTipo,
            invitadosCantidad: input.invitadosCantidad,
            eventoFecha: input.eventoFecha || new Date().toISOString(),
            itemsPresupuestados: [],
            costoTotalEstimado: 0, 
            salonFiestas: 'A definir', 
            timestamp: new Date().toISOString(),
        });
        if (result.success && result.id) {
            return { 
                success: true, 
                presupuestoId: result.id,
                message: `¡Perfecto! He creado el presupuesto #${result.id.substring(0,6)} para ${input.clienteNombre}. ${input.eventoFecha ? '' : 'La fecha queda a confirmar.'} Un asesor se pondrá en contacto.`
            };
        }
        return { success: false, message: "Hubo un problema al guardar el presupuesto.", error: result.error || 'Unknown error saving budget.' };
    } catch (e: any) {
        return { success: false, message: "Hubo una excepción al intentar guardar el presupuesto.", error: e.message };
    }
  }
);


export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  const dialogConfig: DialogConfig = await getAssistantConfig();
  
  const systemPrompt = `Eres "Asistente AK", un asesor experto y amigable para AK Producciones. Tu objetivo es guiar al usuario paso a paso para crear un presupuesto inicial para su evento, siguiendo un flujo de diálogo dinámico definido.

  **Flujo de Diálogo a Seguir:**
  Tu conversación DEBE seguir esta secuencia de pasos. Analiza el historial para determinar en qué paso estás y qué preguntar a continuación.
  ${dialogConfig.pasos.map((paso, index) => `${index + 1}. **${paso.title} (ID: ${paso.id})**: Pregunta: "${paso.pregunta}"`).join('\n  ')}

  **Reglas de Interacción Estrictas:**
  1.  **Inicio:** Si el historial está vacío o el usuario saluda, responde con un saludo amigable y pregunta si desea iniciar la cotización. Tu respuesta DEBE terminar en una nueva línea con el formato: "Opciones: [Sí, arranquemos, No por ahora]".
  2.  **Guía Estricta:** Una vez que el usuario confirma, sigue la secuencia del flujo de diálogo. NO te saltes pasos ni combines preguntas. Haz una pregunta a la vez.
  3.  **Personalización Dinámica:** Si el historial revela que el paso 'nombreCliente' ya se completó y se conoce el nombre del cliente, DEBES reemplazar cualquier marcador \`{{{nombreCliente}}}\` en las preguntas futuras con el nombre real del cliente.
  4.  **Uso de Configuración:** Utiliza el texto EXACTO de la pregunta configurada para el paso actual.
  5.  **Opciones Clicables:** Si el paso actual tiene un array 'opciones' configurado, DEBES incluirlas en tu respuesta, en una nueva línea y con el formato exacto: "Opciones: [Opción 1, Opción 2, ...]".
  6.  **Recopilación de Información:** Antes de preguntar, revisa el historial para ver qué datos ya tienes. Si ya tienes la información para un paso, salta a la siguiente pregunta.
  7.  **Uso de la Herramienta:** Una vez que hayas recopilado TODA la información requerida por los pasos del flujo, y solo entonces, DEBES usar la herramienta 'createQuote'.
  8.  **Respuesta Final:** Después de llamar a la herramienta, basa tu respuesta final únicamente en el campo "message" del resultado de la herramienta. No inventes información adicional.
  9.  **Manejo de Desvíos:** Si el usuario pregunta algo fuera del flujo de cotización, responde amablemente que tu única función es ayudar a crear presupuestos y luego repite la última pregunta que hiciste para reanudar el flujo.`;
  
  const history: Message[] = input.history || [];
  history.push({ role: 'user', content: [{ text: input.query }] });

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    system: systemPrompt,
    history: history,
    tools: [createQuoteTool],
    toolChoice: 'auto',
    output: {
      schema: AssistantOutputSchema,
    }
  });

  const toolCall = llmResponse.toolCalls?.[0];
  
  if (toolCall) {
    const toolResult = await toolCall.run() as any;
    
    const finalResponse = await ai.generate({
        prompt: `El usuario pidió crear un presupuesto. Usaste una herramienta y este fue el resultado: ${JSON.stringify(toolResult)}. Ahora, formula una respuesta final y amigable para el usuario basada en el campo "message" de este resultado.`,
        model: 'googleai/gemini-1.5-flash',
        output: {
            schema: AssistantOutputSchema,
        }
    });

    const output = finalResponse.output;
    if(!output) {
      throw new Error("El asistente de IA no pudo generar una respuesta final después de usar una herramienta.");
    }
    
    if (toolResult.success && toolResult.presupuestoId) {
        output.presupuestoId = toolResult.presupuestoId;
    }

    return output;
  }
  
  const output = llmResponse.output;
  if (!output) {
    console.error("AI Fallback response was null/undefined.", llmResponse);
    throw new Error("El asistente de IA no pudo generar una respuesta inicial. Por favor, reformula tu pregunta.");
  }
  return output;
}
