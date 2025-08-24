
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


// Tool: Create a new quote
const createQuoteTool = ai.defineTool(
  {
    name: 'createQuote',
    description: 'Creates a new budget/quote for a potential client once all necessary information has been gathered (event type, guest count, and client name). The event date is optional and should only be passed if the user has provided it explicitly.',
    inputSchema: z.object({
      clienteNombre: z.string().describe("The name of the client or company."),
      eventoTipo: z.string().describe("The type of event (e.g., 'Boda', 'Cumpleaños de 15', 'Corporativo')."),
      invitadosCantidad: z.number().describe("The estimated number of guests."),
      eventoFecha: z.string().optional().describe("The estimated date of the event in YYYY-MM-DD format. This is optional."),
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
            if (occupiedDates.includes(input.eventoFecha)) {
                return { 
                    success: false, 
                    message: `La fecha ${new Date(input.eventoFecha).toLocaleDateString('es-ES', {timeZone: 'UTC'})} no está disponible. Por favor, sugiere al cliente otra fecha.`,
                    error: 'Date not available' 
                };
            }
        }
        
        const result = await savePresupuesto({
            clienteNombre: input.clienteNombre,
            eventoTipo: input.eventoTipo,
            invitadosCantidad: input.invitadosCantidad,
            // If no date, it will be handled by savePresupuesto.
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
        return { success: false, message: result.error || "Hubo un problema al guardar el presupuesto.", error: result.error || 'Unknown error saving budget.' };
    } catch (e: any) {
        return { success: false, message: "Hubo una excepción al intentar guardar el presupuesto.", error: e.message };
    }
  }
);


export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  const systemPrompt = `Eres "Asistente AK", un asesor experto y amigable para AK Producciones. Tu objetivo es guiar al usuario paso a paso para crear un presupuesto inicial para su evento.

  **Tu Flujo de Conversación:**
  1.  **Saludo Inicial:** Si el historial de chat está vacío o el usuario dice "Hola", "Comenzar", etc., preséntate amablemente y haz la PRIMERA pregunta para iniciar la cotización: "¿A nombre de quién sería el presupuesto?".
  2.  **Recopilar Información Clave:** Haz UNA PREGUNTA A LA VEZ para obtener la siguiente información, en este orden estricto:
      a. Nombre del cliente.
      b. Tipo de evento (Boda, XV, Corporativo, etc.).
      c. Cantidad de invitados.
      d. Fecha estimada del evento (deja claro que es opcional).
  3.  **Confirmación y Creación:** Una vez que tengas al menos el nombre, tipo de evento y cantidad de invitados, confirma la información con el usuario. Si está de acuerdo, DEBES usar la herramienta 'createQuote'.
  4.  **Respuesta Final:** Después de llamar a la herramienta, basa tu respuesta final únicamente en el campo "message" del resultado. No inventes información adicional.
  5.  **Manejo de Desvíos:** Si el usuario pregunta algo fuera del flujo de cotización, responde amablemente que tu única función es ayudar a crear presupuestos y luego repite la última pregunta que hiciste para reanudar el flujo.

  **Reglas de Interacción Estrictas:**
  - **Una pregunta a la vez:** No combines preguntas.
  - **Sé conversacional:** Mantén un tono amigable y servicial, no robótico.
  - **Usa la herramienta:** Solo usa 'createQuote' cuando tengas la información mínima necesaria (nombre, tipo de evento, cantidad de invitados).`;
  
  const history: Message[] = input.history || [];
  if (input.query) {
    history.push({ role: 'user', content: [{ text: input.query }] });
  } else if (history.length === 0) {
    // This case ensures the conversation starts if called with no query.
    history.push({ role: 'user', content: [{ text: 'Hola, quiero empezar.' }] });
  }

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
    
    // Generate a final, friendly response based on the tool's output message.
    const finalResponse = await ai.generate({
        prompt: `Basado en el resultado de la creación del presupuesto, que fue: ${JSON.stringify(toolResult)}, formula una respuesta final y amigable para el usuario. Usa únicamente el campo "message" como base para tu respuesta.`,
        model: 'googleai/gemini-1.5-flash',
        output: {
            schema: AssistantOutputSchema,
        }
    });

    const output = finalResponse.output;
    if(!output) {
      throw new Error("El asistente de IA no pudo generar una respuesta final después de usar la herramienta.");
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
