'use server';
/**
 * @fileOverview The main AI assistant flow.
 * This flow acts as a central brain, capable of using other flows and actions as tools.
 */

import { ai } from '@/ai/genkit';
import { analyzeCodebase } from './analyze-codebase-flow';
import { analyzeEventPlan } from './analyze-event-plan-flow';
import { assignGuestsToTables } from './assign-guests-flow';
import { AssistantInputSchema, AssistantOutputSchema, type AssistantInput, type AssistantOutput } from '@/ai/types/assistant-types';
import { z } from 'genkit';
import { getFiestaActual } from '@/app/actions/fiesta-actual';
import { savePresupuesto } from '@/app/actions/presupuestos';
import { getOcupiedDates } from '@/app/actions/agenda';
import fs from 'fs/promises';
import path from 'path';

// Helper to load the conversational configuration
async function getAssistantConfig() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'data', 'asistente-ak-config.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (e) {
        // Fallback in case the file doesn't exist
        return {
            "pasos": {
                "tipoFiesta": { "pregunta": "¿Qué tipo de evento estás planeando?" },
                "cantidadInvitados": { "pregunta": "¿Para cuántas personas sería el evento?" },
                "nombreCliente": { "pregunta": "¿A nombre de quién creo el presupuesto?" },
                "fechaEvento": { "pregunta": "¿Tienes una fecha pensada para el evento? (Opcional)" }
            }
        }
    }
}


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


export async function assistant(input: AssistantInput): Promise<AssistantOutput> {
  const config = await getAssistantConfig();
  
  const systemPrompt = `Eres "Asistente AK", un asesor experto en planificación de eventos para AK Producciones.
  Tu objetivo principal es ayudar a los clientes a crear un presupuesto inicial para su fiesta. Debes ser amigable, servicial y proactivo.

  **Flujo de Conversación Obligatorio:**
  Tu tarea es guiar al usuario a través de una serie de preguntas para recopilar la información necesaria. Sigue estos pasos en orden:
  1.  **Saludo y Tipo de Fiesta:** Saluda cordialmente y pregunta qué tipo de evento están planeando. Utiliza la pregunta: "${config.pasos.tipoFiesta.pregunta}".
  2.  **Cantidad de Invitados:** Una vez que respondan, pregunta para cuántas personas será el evento. Usa la pregunta: "${config.pasos.cantidadInvitados.pregunta}".
  3.  **Nombre del Cliente:** Luego, pregunta a nombre de quién se debe crear el presupuesto. Usa la pregunta: "${config.pasos.nombreCliente.pregunta}".
  4.  **Fecha del Evento (Opcional):** Finalmente, pregunta si tienen una fecha pensada, aclarando que es opcional. Usa la pregunta: "${config.pasos.fechaEvento.pregunta}".

  **Reglas de Interacción:**
  - **No te desvíes:** Sigue el flujo de preguntas paso a paso. No saltes preguntas ni intentes adivinar información.
  - **Usa Herramientas SOLO al final:** NO uses la herramienta \`createQuote\` hasta que hayas recopilado **toda** la información requerida (nombre, tipo, cantidad de invitados). La fecha es opcional.
  - **Claridad:** Sé muy claro en tus preguntas.
  - **Responde en base a la herramienta:** Cuando uses una herramienta, basa tu respuesta final en el resultado que esta te devuelva. Si la herramienta da un error (ej. fecha no disponible), explica el problema al usuario de forma amigable.
  - **Año por defecto:** Si el usuario da una fecha sin año, asume que es para el próximo año, 2025.
  - **Formato:** Usa markdown para que tus respuestas sean claras y legibles.

  **Otras capacidades (solo si el usuario pregunta explícitamente):**
  - Si un organizador te pide analizar el estado del evento actual, usa \`analyzeCurrentEventPlan\`.
  - Si un organizador te pide analizar el código de la aplicación, usa \`analyzeCodebase\`.
  - Si un organizador te pide asignar invitados, usa \`assignGuestsToTables\`.`;

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

  const toolCalls = llmResponse.toolCalls;
  if (toolCalls && toolCalls.length > 0) {
    const call = toolCalls[0];
    const toolResult = await call.run() as any; 
    
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

    const output = finalResponse.output;
    if(!output) {
      throw new Error("El asistente de IA no pudo generar una respuesta final después de usar una herramienta.");
    }
    
    if (call.name === 'createQuote' && toolResult.success && toolResult.presupuestoId) {
        output.presupuestoId = toolResult.presupuestoId;
    }

    return output;
  }
  
  const output = llmResponse.output;
  if(!output) {
      throw new Error("El asistente de IA no pudo generar una respuesta inicial.");
  }
  return output;
}
