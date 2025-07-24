
'use server';
/**
 * @fileOverview The main AI assistant flow.
 * This flow acts as a central brain, capable of using other flows and actions as tools.
 */

import { ai } from '@/ai/genkit';
import { analyzeCodebase } from './analyze-codebase-flow';
import { analyzeEventPlan } from './analyze-event-plan-flow';
import { assignGuestsToTables } from './assign-guests-flow';
import { AssistantInputSchema, AssistantOutputSchema, type AssistantInput } from '@/ai/types/assistant-types';
import { z } from 'genkit';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { getOcupiedDates } from '@/app/actions/agenda';

// Tool: Analyze the current event plan
const analyzeEventPlanTool = ai.defineTool(
  {
    name: 'analyzeCurrentEventPlan',
    description: 'Analyzes the current event plan in detail and returns a summary of its status, identifying incomplete areas and potential issues. Use this when the user asks to "analyze the event", "check the party plan", "review the current event", or similar requests.',
    inputSchema: z.object({}), 
    outputSchema: z.any(),
  },
  async () => {
    const planData = await getFiestaActual();
    return await analyzeEventPlan({ planData });
  }
);

// Tool: Analyze the application's codebase
const analyzeCodebaseTool = ai.defineTool(
    {
        name: 'analyzeCodebase',
        description: 'Performs a thorough analysis of the application\'s codebase against a predefined specification. Use this when the user asks to "analyze the code", "check the codebase", "review the project structure", or similar requests.',
        inputSchema: z.object({
            specification: z.string().optional().describe("An optional user-provided specification to analyze against. If not provided, a default one is used."),
        }),
        outputSchema: z.any(),
    },
    async ({ specification }) => {
        const defaultSpec = 'Analyze the current application state and report on completeness, bugs, and suggest improvements.';
        return await analyzeCodebase({ specification: specification || defaultSpec });
    }
);

// Tool: Assign guests to tables
const assignGuestsTool = ai.defineTool(
  {
    name: 'assignGuestsToTables',
    description: 'Automatically assigns confirmed guests to available tables based on party size and table capacity. Use this when the user asks to "assign guests", "seat the guests", "distribute guests to tables", or similar requests.',
    inputSchema: z.object({}),
    outputSchema: z.any(),
  },
  async () => {
    const fiesta = await getFiestaActual();
    const confirmedGuests = fiesta.invitados?.filter(i => i.rsvp === 'Confirmado') || [];
    const tables = fiesta.decoracion?.salonElements?.filter(el => el.category?.toLowerCase().includes('mesa'))
      .map(el => ({ id: el.id, name: el.name, seats: el.seats || 0 })) || [];
    
    if (confirmedGuests.length === 0) return { error: "No hay invitados confirmados para asignar." };
    if (tables.length === 0) return { error: "No hay mesas definidas en el plano del salón." };

    return await assignGuestsToTables({ guests: confirmedGuests, tables });
  }
);

// Tool: Create a new quote
const createQuoteTool = ai.defineTool(
  {
    name: 'createQuote',
    description: 'Creates a new budget/quote for a potential client. Use this when the user asks to "create a quote", "make a budget", "prepare a proposal", or similar requests. It requires client name, event type, and guest count. The event date is optional. If any information is missing, you MUST ask the user for it.',
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


export async function assistant(input: AssistantInput) {
  // This prompt guides the model to be a helpful event planning assistant and use the available tools.
  const systemPrompt = `Eres "Asistente AK", un asistente experto en planificación de eventos para AK Producciones.
  Tu objetivo es ayudar al organizador a gestionar su aplicación.
  Sé conciso, amigable y proactivo.
  Cuando un usuario te pida realizar una acción (como analizar el evento, asignar invitados o crear un presupuesto), utiliza las herramientas disponibles.
  Si una herramienta requiere información que no tienes, haz preguntas claras y directas para obtener los datos necesarios antes de llamar a la herramienta. NO inventes información.
  Si el usuario quiere crear un presupuesto pero no especifica una fecha, no hay problema, es opcional.
  Al presentar los resultados de una herramienta, no solo muestres los datos JSON. En su lugar, explícalos de forma clara, amigable y útil para un organizador de eventos, usando formato markdown para que sea legible.
  Si una herramienta devuelve un error, explica el problema al usuario de forma sencilla y amigable.
  Para fechas, asume que el año actual es 2025 si no se especifica.`;

  const llmResponse = await ai.generate({
    prompt: [
        {text: systemPrompt},
        {text: `La consulta del usuario es: "${input.query}"`},
    ],
    model: 'googleai/gemini-1.5-flash',
    tools: [analyzeEventPlanTool, analyzeCodebaseTool, assignGuestsTool, createQuoteTool],
    toolChoice: 'auto',
    output: {
        schema: AssistantOutputSchema,
    }
  });

  const toolCalls = llmResponse.toolCalls();
  if (toolCalls.length > 0) {
    const call = toolCalls[0];
    const toolResult = await call.run();
    
    // Send the tool's structured output back to the model to generate a natural language response
    const finalResponse = await ai.generate({
        prompt: [
            {text: systemPrompt},
            {text: `El usuario preguntó: "${input.query}"`},
            {toolResult: {name: call.name, output: toolResult}}
        ],
        model: 'googleai/gemini-1.5-flash',
        tools: [analyzeEventPlanTool, analyzeCodebaseTool, assignGuestsTool, createQuoteTool],
        output: {
            schema: AssistantOutputSchema,
        }
    });

    return finalResponse.output()!;
  }
  
  // If no tool was called, return the direct text response
  return llmResponse.output()!;
}
