
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
  1.  **Saludo Inicial:** Si la conversación es nueva (no hay historial), saluda amablemente. Preséntate como "Asistente AK" y explica que puedes ayudar a armar un presupuesto para una fiesta. Inmediatamente después del saludo, haz la primera pregunta del flujo: "${config.pasos.tipoFiesta.pregunta}".
  2.  **Guía Paso a Paso:** Después de obtener la respuesta a una pregunta, procede a la siguiente en este orden estricto:
      - Pregunta por el tipo de fiesta (si no lo sabes).
      - Pregunta por la cantidad de invitados.
      - Pregunta por el nombre del cliente.
      - Pregunta por la fecha (aclarando que es opcional).
  
  **Reglas de Interacción:**
  - **Usa el Historial:** SIEMPRE revisa el historial de la conversación para saber qué información ya tienes y cuál es la siguiente pregunta que debes hacer. No repitas preguntas que ya fueron respondidas.
  - **No te desvíes:** Sigue el flujo de preguntas paso a paso. No saltes preguntas ni intentes adivinar información.
  - **Usa Herramientas SOLO al final:** NO uses la herramienta \`createQuote\` hasta que hayas recopilado TODA la información requerida (nombre, tipo, cantidad). La fecha es opcional. Antes de ese punto, tu única función es hacer la siguiente pregunta del flujo.
  - **Claridad:** Sé muy claro en tus preguntas.
  - **Responde en base a la herramienta:** Cuando finalmente uses una herramienta, basa tu respuesta en el resultado que esta te devuelva. Si la herramienta da un error (ej. fecha no disponible), explica el problema al usuario de forma amigable.
  - **Año por defecto:** Si el usuario da una fecha sin año, asume que es para el próximo año, 2025.
  - **Formato:** Usa markdown para que tus respuestas sean claras y legibles.
  - **Capacidad única:** Solo tienes la capacidad de crear presupuestos. No puedes analizar el código, ni el estado del evento. Si te preguntan por otra cosa, responde amablemente que tu única función es ayudar a crear presupuestos.`;

  const history = input.history || [];
  const prompts = [
    { role: 'system', content: [{ text: systemPrompt }] },
    ...history.map((h: any) => ({
      role: h.role,
      content: h.content,
    })),
    { role: 'user', content: [{ text: input.query }] },
  ];
  
  const llmResponse = await ai.generate({
    prompt: prompts,
    model: 'googleai/gemini-1.5-flash',
    tools: [createQuoteTool],
    toolChoice: 'auto',
    output: {
        schema: AssistantOutputSchema,
    }
  });

  if (llmResponse.toolCalls && llmResponse.toolCalls.length > 0) {
    const call = llmResponse.toolCalls[0];
    const toolResult = await call.run() as any; 
    
    // Create new prompt list for final response, including the tool call and its result
    const finalPrompts = [
        ...prompts,
        { role: 'model', content: [{ toolCall: call.toJson() }] },
        { role: 'tool', content: [{ toolResult: { name: call.name, output: toolResult } }] }
    ];

    const finalResponse = await ai.generate({
        prompt: finalPrompts,
        model: 'googleai/gemini-1.5-flash',
        tools: [createQuoteTool],
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
