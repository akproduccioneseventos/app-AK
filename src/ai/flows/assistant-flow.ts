
'use server';
/**
 * @fileOverview The main AI assistant flow for conversational quoting.
 * This flow guides the user step-by-step to create a budget.
 */

import {ai} from '@/ai/genkit';
import {
  AssistantInputSchema,
  AssistantOutputSchema,
  type AssistantInput,
  type AssistantOutput,
  SelectableServiceSchema,
  type ServiceInfo,
} from '@/ai/types/assistant-types';
import {z} from 'genkit';
import {getOcupiedDates} from '@/app/actions/agenda';
import {savePresupuesto} from '@/app/actions/presupuestos';
import type {Message} from 'genkit';
import {
  getAssistantConfig,
  type DialogConfig,
} from '@/app/actions/assistant-config';
import {getServiciosEmpresa} from '@/app/actions/servicios-empresa';
import type {ServicioEmpresa} from '@/types/empresa';

// Tool: Get available services from the catalog
const getServiciosDisponibles = ai.defineTool(
  {
    name: 'getServiciosDisponibles',
    description:
      "Retrieves a list of all available services from the company's catalog that can be offered to a client.",
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        nombre: z.string(),
        categoria: z.string(),
        precioVenta: z.number().optional(),
        unidad: z.string().optional(),
      })
    ),
  },
  async () => {
    try {
      const services = await getServiciosEmpresa();
      return services
        .filter(s => s.tipoItem === 'Servicio' && s.precioVenta !== undefined)
        .map(s => ({
          id: s.id,
          nombre: s.nombre,
          categoria: s.categoria,
          precioVenta: s.precioVenta,
          unidad: s.unidad,
        }));
    } catch (e) {
      console.error('Error fetching services for tool', e);
      return [];
    }
  }
);


// Tool: Add a specific service to the current quote draft
const addServiceToQuote = ai.defineTool(
  {
    name: 'addServiceToQuote',
    description: 'Adds a single, specific service selected by the user to the current budget draft. This tool is used iteratively as the user selects services.',
    inputSchema: z.object({
        serviceId: z.string().describe("The ID of the service to add."),
        quantity: z.number().optional().describe("The quantity of the service. Defaults to 1.").default(1),
    }),
    outputSchema: z.object({
        serviceId: z.string(),
        nombre: z.string(),
        cantidad: z.number(),
        precioUnitario: z.number(),
        unidad: z.string().optional(),
    })
  },
  async (input) => {
    const allServices = await getServiciosEmpresa();
    const serviceToAdd = allServices.find(s => s.id === input.serviceId);
    if (!serviceToAdd) {
        throw new Error(`Servicio con ID ${input.serviceId} no encontrado.`);
    }
    return {
        serviceId: serviceToAdd.id,
        nombre: serviceToAdd.nombre,
        cantidad: input.quantity,
        precioUnitario: serviceToAdd.precioVenta || 0,
        unidad: serviceToAdd.unidad,
    };
  }
);


// Tool: Create the final quote
const createQuoteTool = ai.defineTool(
  {
    name: 'createQuote',
    description:
      'Creates a final budget/quote for a potential client once all necessary information has been gathered (event type, guest count, client name, and selected services).',
    inputSchema: z.object({
      clienteNombre: z.string().describe('The name of the client or company.'),
      eventoTipo: z
        .string()
        .describe(
          "The type of event (e.g., 'Boda', 'Cumpleaños de 15', 'Corporativo')."
        ),
      invitadosCantidad: z
        .number()
        .describe('The estimated number of guests.'),
      eventoFecha: z
        .string()
        .optional()
        .describe(
          'The estimated date of the event in YYYY-MM-DD format. Optional.'
        ),
      serviceIds: z
        .array(z.string())
        .optional()
        .describe('An array of IDs for all the services the client has selected during the conversation.'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      presupuestoId: z.string().optional(),
      message: z.string(),
      error: z.string().optional(),
    }),
  },
  async input => {
    try {
      if (input.eventoFecha) {
        const occupiedDates = await getOcupiedDates();
        const requestedDate = new Date(input.eventoFecha)
          .toISOString()
          .split('T')[0];
        if (occupiedDates.includes(requestedDate)) {
          return {
            success: false,
            message: `La fecha ${new Date(
              input.eventoFecha
            ).toLocaleDateString(
              'es-ES'
            )} no está disponible. Por favor, sugiere al cliente otra fecha.`,
            error: 'Date not available',
          };
        }
      }

      const allServices = await getServiciosEmpresa();
      const itemsPresupuestados = (input.serviceIds || [])
        .map(id => allServices.find(s => s.id === id))
        .filter((s): s is ServicioEmpresa => !!s)
        .map(s => ({
          idServicioCatalogo: s.id,
          nombreServicio: s.nombre,
          cantidad: s.unidad === 'Por persona' ? input.invitadosCantidad : 1,
          unidad: s.unidad,
          precioUnitario: s.precioVenta || 0,
          costoTotalItem:
            (s.unidad === 'Por persona' ? input.invitadosCantidad : 1) *
            (s.precioVenta || 0),
          categoriaServicio: s.categoria,
        }));

      const result = await savePresupuesto({
        clienteNombre: input.clienteNombre,
        eventoTipo: input.eventoTipo,
        invitadosCantidad: input.invitadosCantidad,
        eventoFecha: input.eventoFecha || new Date().toISOString(),
        itemsPresupuestados: itemsPresupuestados,
        costoTotalEstimado: 0, // This will be recalculated in savePresupuesto
        salonFiestas: 'A definir',
        timestamp: new Date().toISOString(),
      });
      if (result.success && result.id) {
        return {
          success: true,
          presupuestoId: result.id,
          message: `¡Perfecto! He creado el presupuesto #${result.id.substring(
            0,
            6
          )} para ${input.clienteNombre}. Ya puedes revisarlo, descargarlo o compartirlo.`,
        };
      }
      return {
        success: false,
        message: 'Hubo un problema al guardar el presupuesto.',
        error: result.error || 'Unknown error saving budget.',
      };
    } catch (e: any) {
      return {
        success: false,
        message: 'Hubo una excepción al intentar guardar el presupuesto.',
        error: e.message,
      };
    }
  }
);

export async function assistant(
  input: AssistantInput
): Promise<AssistantOutput> {
  const dialogConfig: DialogConfig = await getAssistantConfig();

  const systemPrompt = `Eres "Asistente AK", un asesor experto y amigable para AK Producciones. Tu objetivo es guiar al usuario paso a paso para crear un presupuesto inicial para su evento, siguiendo un flujo de diálogo dinámico definido.

  **Flujo de Diálogo a Seguir:**
  Tu conversación DEBE seguir esta secuencia de pasos. Analiza el historial para determinar en qué paso estás y qué preguntar a continuación.
  ${dialogConfig.pasos
    .map(
      (paso, index) =>
        `${index + 1}. **${paso.title} (ID: ${paso.id})**: Pregunta: "${
          paso.pregunta
        }"`
    )
    .join('\n  ')}

  **Reglas de Interacción Estrictas:**
  1.  **Inicio:** Si el historial está vacío o el usuario saluda, responde con un saludo amigable y pregunta si desea iniciar la cotización. Tu respuesta DEBE terminar en una nueva línea con el formato: "Opciones: [Sí, arranquemos, No por ahora]".
  2.  **Guía Estricta:** Una vez que el usuario confirma, sigue la secuencia del flujo de diálogo. NO te saltes pasos ni combines preguntas. Haz una pregunta a la vez.
  3.  **Personalización Dinámica:** Si el historial revela que el paso 'nombreCliente' ya se completó y se conoce el nombre del cliente, DEBES reemplazar cualquier marcador \`{{{nombreCliente}}}\` en las preguntas futuras con el nombre real del cliente.
  4.  **Uso de Configuración:** Utiliza el texto EXACTO de la pregunta configurada para el paso actual.
  5.  **Opciones Clicables:** Si el paso actual tiene un array 'opciones' configurado, DEBES incluirlas en tu respuesta, en una nueva línea y con el formato exacto: "Opciones: [Opción 1, Opción 2, ...]".
  6.  **Recopilación de Información:** Antes de preguntar, revisa el historial para ver qué datos ya tienes. Si ya tienes la información para un paso, salta a la siguiente pregunta.
  7.  **Sugerencia de Servicios:** Cuando llegues al paso con el id 'seleccionServicios', DEBES usar la herramienta 'getServiciosDisponibles' para obtener una lista de servicios y ofrecérselos al usuario. En este punto, el usuario podrá seleccionar servicios de un catálogo. No insistas si el usuario no quiere añadir más servicios.
  8.  **Añadir Servicios Iterativamente**: Si el usuario pide añadir un servicio específico (ej: "añade el DJ"), usa la herramienta 'addServiceToQuote'.
  9.  **Uso de la Herramienta 'createQuote':** Una vez que hayas recopilado TODA la información requerida por los pasos del flujo (incluyendo los servicios que el cliente haya elegido), y solo entonces, DEBES usar la herramienta 'createQuote'.
  10. **Respuesta Final:** Después de llamar a la herramienta 'createQuote', basa tu respuesta final únicamente en el campo "message" del resultado de la herramienta. No inventes información adicional.
  11. **Manejo de Desvíos:** Si el usuario pregunta algo fuera del flujo de cotización, responde amablemente que tu única función es ayudar a crear presupuestos y luego repite la última pregunta que hiciste para reanudar el flujo.`;

  const history: Message[] = input.history || [];
  if (input.query) {
    history.push({role: 'user', content: [{text: input.query}]});
  }

  const llmResponse = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    system: systemPrompt,
    history: history,
    tools: [createQuoteTool, getServiciosDisponibles, addServiceToQuote],
    toolChoice: 'auto',
    output: {
      schema: AssistantOutputSchema,
    },
  });

  const toolCalls = llmResponse.toolCalls;
  let newSelectedServices = [...(input.currentServices || [])];
  
  if (toolCalls && toolCalls.length > 0) {
    let finalLlmResponse;
    const toolResults: any[] = [];

    for (const toolCall of toolCalls) {
        const toolResult = (await toolCall.run()) as any;
        toolResults.push(toolResult);

        if (toolCall.name === 'addServiceToQuote' && toolResult) {
            const serviceToAdd: ServiceInfo = {
              id: toolResult.serviceId,
              name: toolResult.nombre,
              quantity: toolResult.cantidad,
              unitPrice: toolResult.precioUnitario,
            };
            if (!newSelectedServices.some(s => s.id === serviceToAdd.id)) {
              newSelectedServices.push(serviceToAdd);
            }
        }
    }
      
    // Create a new history including the tool calls and their results for context
    const followUpHistory = [...history, llmResponse.message, ...toolCalls.map((tc, i) => tc.toToolResponse(toolResults[i]))];

    finalLlmResponse = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        system: systemPrompt,
        history: followUpHistory, // Use the updated history
        tools: [createQuoteTool, getServiciosDisponibles, addServiceToQuote],
        output: { schema: AssistantOutputSchema },
    });

    const output = finalLlmResponse.output;
    if (!output) {
      throw new Error(
        'El asistente de IA no pudo generar una respuesta final después de usar una herramienta.'
      );
    }
    output.currentServices = newSelectedServices;
    
    // Check if the getServices tool was called to populate selectableServices
    const getServicesCall = toolCalls.find(tc => tc.name === 'getServiciosDisponibles');
    if (getServicesCall) {
        const servicesResult = toolResults[toolCalls.indexOf(getServicesCall)];
        if(Array.isArray(servicesResult)){
            const parsedServices = z.array(SelectableServiceSchema).safeParse(servicesResult);
             if (parsedServices.success) {
                output.selectableServices = parsedServices.data;
            }
        }
    }
    
    // Check if the createQuote tool was called to populate the budget ID
    const createQuoteCall = toolCalls.find(tc => tc.name === 'createQuote');
    if (createQuoteCall) {
        const createQuoteResult = toolResults[toolCalls.indexOf(createQuoteCall)];
        if (createQuoteResult.success && createQuoteResult.presupuestoId) {
          output.presupuestoId = createQuoteResult.presupuestoId;
        }
    }

    return output;
  }

  const output = llmResponse.output;
  if (!output) {
    console.error('AI Fallback response was null/undefined.', llmResponse);
    throw new Error(
      'El asistente de IA no pudo generar una respuesta inicial. Por favor, reformula tu pregunta.'
    );
  }
  output.currentServices = newSelectedServices;
  return output;
}
