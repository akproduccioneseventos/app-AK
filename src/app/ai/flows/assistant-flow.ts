
'use server';
/**
 * @fileOverview The main AI assistant flow.
 * This flow acts as a central brain, capable of using other flows and actions as tools.
 */

import { ai } from '@/ai/genkit';
import { AssistantInputSchema, AssistantOutputSchema, type AssistantInput, type AssistantOutput } from '@/ai/types/assistant-types';
import { z } from 'genkit';
import { getOcupiedDates } from '@/app/actions/agenda';
import { savePresupuesto } from '@/app/actions/presupuestos';

// Tool: Create a new quote
const createQuoteTool = ai.defineTool(
  {
    name: 'createQuote',
    description: 'Creates a new budget/quote for a potential client. Use this when the user asks to "create a quote", "make a budget", "prepare a proposal", or similar requests. It requires client name, event type, and guest count. The event date is optional.',
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
  const systemPrompt = `Eres "Asistente AK", un asesor experto en planificación de eventos para AK Producciones.
  Tu único objetivo es tomar la información proporcionada en la consulta del usuario y utilizar la herramienta 'createQuote' para crear un presupuesto.

  **Reglas de Interacción:**
  - **Usa la herramienta directamente:** Al recibir la consulta del usuario, inmediatamente extrae los detalles (nombre, tipo de evento, cantidad de invitados, fecha opcional) y llama a la herramienta 'createQuote'.
  - **No Converses:** No hagas preguntas de seguimiento. Tu única función es ejecutar la herramienta con los datos que te dan.
  - **Año por defecto:** Si el usuario da una fecha sin año, asume que es para el próximo año, 2025.
  - **Responde en base a la herramienta:** Tu respuesta final al usuario debe basarse únicamente en el mensaje que devuelve la herramienta 'createQuote'. Si la herramienta da un error (ej. fecha no disponible), explica el problema al usuario de forma amigable.
  - **Capacidad única:** Solo tienes la capacidad de crear presupuestos. Si te preguntan por otra cosa, responde amablemente que tu única función es ayudar a crear presupuestos.`;

  const llmResponse = await ai.generate({
    prompt: systemPrompt + "\n\nUser Query: " + input.query,
    model: 'googleai/gemini-1.5-flash',
    tools: [createQuoteTool],
    toolChoice: 'auto',
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
  
  // Fallback if no tool was called (shouldn't happen with this prompt)
  const output = llmResponse.output;
  if(!output) {
      throw new Error("El asistente de IA no pudo generar una respuesta inicial.");
  }
  return output;
}
