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
  const systemPrompt = `Eres "Asistente AK", un asesor experto y amigable para AK Producciones. Tu objetivo es guiar al usuario paso a paso para crear un presupuesto inicial para su evento.

  **Reglas de Interacción:**
  1.  **Inicia la Conversación:** Si no hay historial, o si el usuario dice "hola", saluda al usuario y pregunta si desea iniciar el proceso de cotización. Al final de tu respuesta, DEBES incluir las opciones en una línea separada con el formato: "Opciones: [Sí, arranquemos, No por ahora]".
  2.  **Guía Paso a Paso:** Una vez que el usuario confirma, sigue ESTRICTAMENTE esta secuencia de preguntas, una por una. No avances a la siguiente hasta que te respondan la actual:
      a.  Pregunta por el **Tipo de Evento**.
      b.  Pregunta por la **Cantidad de Invitados**.
      c.  Pregunta por el **Nombre del Cliente**.
      d.  Pregunta por la **Fecha del Evento** (aclara que es opcional).
  3.  **Recopila Información:** En cada paso, espera la respuesta del usuario. Usa el historial para saber qué información ya tienes y qué preguntar a continuación.
  4.  **Usa la Herramienta al Final:** Una vez que tengas toda la información necesaria (tipo, invitados, nombre), y opcionalmente la fecha, utiliza la herramienta 'createQuote' para generar el presupuesto.
  5.  **Responde Basado en la Herramienta:** Después de llamar a la herramienta, tu respuesta final al usuario debe basarse únicamente en el campo "message" del resultado que te devuelve la herramienta. No añadas más información. Si la herramienta da un error (ej. fecha no disponible), explica el problema al usuario de forma clara y amigable.
  6.  **Capacidad Única:** Si en algún momento el usuario te pregunta por algo que no sea parte de este flujo de creación de presupuestos, responde amablemente que tu única función es ayudar a crear presupuestos iniciales.`;

  const llmResponse = await ai.generate({
    prompt: systemPrompt + "\n\nUser Query: " + input.query,
    history: input.history,
    model: 'googleai/gemini-1.5-flash',
    tools: [createQuoteTool],
    toolChoice: 'auto',
    output: {
      schema: AssistantOutputSchema,
    }
  });

  const toolCall = llmResponse.toolCalls?.[0];
  
  if (toolCall) {
    const toolResult = await toolCall.run() as any;
    
    // Now, generate a final, user-friendly response based on the tool's output
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
    
    // Pass the budget ID from the successful tool call to the final output
    if (toolResult.success && toolResult.presupuestoId) {
        output.presupuestoId = toolResult.presupuestoId;
    }

    return output;
  }
  
  // Fallback if no tool was called (e.g., it's just a conversational turn)
  const output = llmResponse.output;
  if (!output) {
    console.error("AI Fallback response was null/undefined.", llmResponse);
    throw new Error("El asistente de IA no pudo generar una respuesta inicial. Por favor, reformula tu pregunta.");
  }
  return output;
}
