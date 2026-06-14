'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import * as logger from '@/lib/logger';
import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { FullMenu } from '@/types/catering';

// Schema for chat history
const ChatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Schema for input state
const SimulatorStateSchema = z.object({
  eventoTipo: z.string().optional(),
  adultos: z.number().optional(),
  ninosYAdolescentes: z.number().optional(),
  eventoFecha: z.string().optional(),
  eventoHoraInicio: z.string().optional(),
  selectedPaqueteId: z.string().optional(),
  selectedServices: z.array(z.string()).optional(),
  selectedEntradas: z.array(z.string()).optional(),
  selectedPrincipal: z.string().optional(),
  selectedInfantil: z.string().optional(),
  incluirClubUruguay: z.boolean().optional(),
  duracionHoras: z.number().optional(),
  currentChatStep: z.string().optional(),
  clienteNombre: z.string().optional(),
  clienteContacto: z.string().optional(),
  paquetesOrServicios: z.string().optional(),
});

const CopilotInputSchema = z.object({
  message: z.string(),
  history: z.array(ChatHistoryItemSchema),
  currentState: SimulatorStateSchema,
});

const CopilotOutputSchema = z.object({
  response: z.string().describe('Texto conversacional de respuesta en español rioplatense (uruguayo: vos, dale, bárbaro).'),
  action: z.object({
    type: z.enum(['none', 'apply_changes', 'check_availability']),
    reason: z.string().optional(),
    changes: z.object({
      eventoTipo: z.string().optional(),
      adultos: z.number().optional(),
      ninosYAdolescentes: z.number().optional(),
      eventoFecha: z.string().optional(),
      eventoHoraInicio: z.string().optional(),
      selectedPaqueteId: z.string().optional(),
      selectedServices: z.array(z.string()).optional(),
      selectedEntradas: z.array(z.string()).optional(),
      selectedPrincipal: z.string().optional(),
      selectedInfantil: z.string().optional(),
      incluirClubUruguay: z.boolean().optional(),
      duracionHoras: z.number().optional(),
      currentChatStep: z.string().optional(),
      clienteNombre: z.string().optional(),
      clienteContacto: z.string().optional(),
      paquetesOrServicios: z.string().optional(),
    }).optional(),
  }).nullish(),
  suggestionPill: z.object({
    label: z.string().describe('Texto del botón (máximo 4 palabras, ej: "Cambiar a Oro y Ahorrar")'),
    messageToSubmit: z.string().describe('Mensaje de texto a enviar al chat cuando se pulse el botón'),
  }).optional(),
});

export type CopilotInput = z.infer<typeof CopilotInputSchema>;
export type CopilotOutput = z.infer<typeof CopilotOutputSchema>;

function normalizeCopilotInput(input: CopilotInput): CopilotInput | null {
  const parsed = CopilotInputSchema.safeParse(input);
  if (!parsed.success) return null;

  return {
    ...parsed.data,
    message: parsed.data.message.trim().slice(0, 1000),
    history: parsed.data.history.slice(-12).map((item) => ({
      ...item,
      content: item.content.slice(0, 600),
    })),
    currentState: {
      ...parsed.data.currentState,
      selectedServices: parsed.data.currentState.selectedServices?.slice(0, 100),
      selectedEntradas: parsed.data.currentState.selectedEntradas?.slice(0, 10),
    },
  };
}

function sanitizeCopilotOutput(
  output: CopilotOutput,
  config: ArmadoRapidoConfig | null,
  services: ServicioEmpresa[],
  menus: FullMenu[],
): CopilotOutput {
  if (!output.action?.changes) return output;

  const packageIds = new Set((config?.paquetes || []).map((item) => item.id));
  const serviceIds = new Set(services.map((item) => item.id));
  const dishIds = new Set(menus.flatMap((menu) => menu.items || []).map((item) => item.id));
  const allowedSelectionIds = new Set([...serviceIds, ...dishIds]);
  const changes = { ...output.action.changes };

  if (changes.selectedPaqueteId && !packageIds.has(changes.selectedPaqueteId)) delete changes.selectedPaqueteId;
  if (changes.selectedServices) {
    changes.selectedServices = [...new Set(changes.selectedServices.filter((id) => serviceIds.has(id)))].slice(0, 100);
  }
  if (changes.selectedEntradas) {
    changes.selectedEntradas = [...new Set(changes.selectedEntradas.filter((id) => dishIds.has(id)))].slice(0, 2);
  }
  if (changes.selectedPrincipal && !allowedSelectionIds.has(changes.selectedPrincipal)) delete changes.selectedPrincipal;
  if (changes.selectedInfantil && !allowedSelectionIds.has(changes.selectedInfantil)) delete changes.selectedInfantil;
  if (changes.adultos !== undefined) changes.adultos = Math.min(1000, Math.max(1, Math.round(changes.adultos)));
  if (changes.ninosYAdolescentes !== undefined) {
    changes.ninosYAdolescentes = Math.min(500, Math.max(0, Math.round(changes.ninosYAdolescentes)));
  }
  if (changes.duracionHoras !== undefined) changes.duracionHoras = changes.duracionHoras > 4 ? 5 : 3;
  if (changes.eventoFecha && !/^\d{4}-\d{2}-\d{2}$/.test(changes.eventoFecha)) delete changes.eventoFecha;

  return {
    ...output,
    action: {
      ...output.action,
      type: Object.keys(changes).length > 0 ? output.action.type : 'none',
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    },
  };
}
const SYSTEM_PROMPT = `Sos Sofía, la Asistente Inteligente de AK Producciones en Salto, Uruguay.
Guías al usuario para armar el presupuesto de su fiesta exclusivamente mediante un chat de preguntas y respuestas en tiempo real (estilo WhatsApp).

## TU TONO Y PERSONALIDAD
* Hablás en español uruguayo natural (usás "vos", "ta", "dale", "bárbaro"). Sos cálida, atenta, servicial y muy ágil.
* Mantené tus respuestas cortas y claras. Evitá discursos o textos largos.

## FLUJO SECUENCIAL DE PREGUNTAS (ESTRICTO)
Acompañás al cliente en el siguiente orden secuencial de pasos, guiado por \`currentState.currentChatStep\`:
1. **name:** Preguntás el nombre completo de forma amigable.
2. **phone:** Pedís un número de teléfono móvil de contacto (9 dígitos uruguayos).
3. **date:** Preguntás en qué fecha quieren realizar la fiesta.
4. **type:** Preguntás el tipo de fiesta (boda, 15 años, cumpleaños, empresarial, etc.).
5. **hours:** Preguntás si la fiesta va a durar más de 4 horas o menos de 4 horas.
6. **menu:** Ofrecés elegir el menú de catering (menú clásico, buffet, premium, infantil, etc.).
7. **package_choice:** Preguntás si prefieren armar el presupuesto "por paquetes cerrados" o "servicio a servicio".
8. **package_select / service_select:**
   - Si eligieron paquetes: Ofrecés los 3 paquetes (Básico, Intermedio, Premium) y resumís qué incluye cada uno.
   - Si eligieron servicio a servicio: Les presentás los servicios disponibles para que elijan.
9. **budget_ready:** Se presenta el presupuesto final con los detalles y costos.

## BASE DE CONOCIMIENTO Y FAQs (RESPUESTAS A PREGUNTAS DEL USUARIO)
Respondés cualquier duda libre del usuario usando esta información oficial:
- **Reserva / Seña:** Para asegurar y congelar la fecha del evento, se requiere abonar una seña del 30% del costo total estimado del presupuesto. El saldo restante se liquida en cuotas mensuales hasta la fecha del evento.
- **Ajuste Anual:** Los presupuestos se calculan a precio vigente. Si la fecha corresponde a un año posterior, se aplica una proyección de ajuste por inflación del 15% anual en el contrato final.
- **DJ y Tecnología:** AK Producciones incluye equipamiento tecnológico de primer nivel: sonido line-array, iluminación robótica móvil, pantallas LED gigantes de alta resolución, cabinas de DJ premium y efectos especiales de pista.
- **Coordinación de Reunión:** Ofrecemos coordinar una reunión presencial o videollamada con nuestro organizador jefe en Salto sin ningún tipo de compromiso para definir los detalles finos.
- **Portal VIP:** Una vez contratado el evento, el cliente recibe acceso exclusivo a su "Portal VIP" donde puede coordinar el itinerario de la fiesta, hacer sugerencias de música al DJ, subir las fotos para el video de vida y gestionar invitados y mesas.

## ACCIONES CONVERSACIONALES
Cuando el usuario responde conversacionalmente a uno de los pasos o pide un cambio, debés retornar los cambios en \`action.changes\` con \`action.type = "apply_changes"\`:
- **Cambiar Paquete:** Si seleccionan un paquete o piden abaratar/modificar, actualizá \`selectedPaqueteId\`.
- **Ajustar Invitados:** Si cambian cantidad de adultos o niños, actualizá \`adultos\` y \`ninosYAdolescentes\`.
- **Modificar Servicios:** Si agregan o quitan un servicio en el chat, actualizá \`selectedServices\`.
- **Paso Conversacional:** Si el usuario avanza de paso o realiza una elección, actualizá \`currentChatStep\` al valor correspondiente.

Siempre que sugieras una opción o acción rápida, completá el objeto \`suggestionPill\` (label: texto de máximo 4 palabras, messageToSubmit: mensaje que simula el envío del usuario).`;

// Define prompt with Genkit
const copilotPrompt = ai.definePrompt({
  name: 'copilotPrompt',
  model: geminiModel,
  input: { schema: CopilotInputSchema },
  output: { schema: CopilotOutputSchema },
  system: SYSTEM_PROMPT,
  prompt: `## INFORMACIÓN DE LA EMPRESA (PAQUETES Y SERVICIOS DISPONIBLES):
{{{businessContext}}}

## ESTADO ACTUAL DEL SIMULADOR DEL CLIENTE:
{{{currentStateJson}}}

## HISTORIAL DE CHARLA:
{{#each history}}
{{role}}: {{content}}
{{/each}}

## MENSAJE DEL USUARIO A RESPONDER:
{{{message}}}`,
  config: {
    temperature: 0.2,
  },
});

/**
 * Main server action to talk to the AI Copilot.
 */
export async function chatWithBudgetCopilot(
  input: CopilotInput
): Promise<CopilotOutput> {
  const normalizedInput = normalizeCopilotInput(input);
  if (!normalizedInput?.message) {
    return {
      response: 'Contame brevemente qué tipo de fiesta querés organizar y te ayudo a armarla.',
      action: { type: 'none' },
    };
  }

  const [config, services, menus] = await Promise.all([
    getArmadoRapidoConfig().catch(() => null),
    getServiciosEmpresa().catch(() => []),
    getMenus().catch(() => []),
  ]);
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  // FALLBACK: Rule-based static response if API Key is not configured
  if (!apiKey) {
    logger.warn('[copilot] API Key missing. Falling back to rule-based engine.');
    return sanitizeCopilotOutput(getStaticFallbackResponse(normalizedInput, config), config, services, menus);
  }

  try {
    const serviceById = new Map(services.map((service) => [service.id, service]));
    const paquetesCatalog = (config?.paquetes || []).map((pkg) => ({
      id: pkg.id,
      nombre: pkg.nombre,
      descripcion: pkg.descripcion,
      recommended: pkg.recommended,
      serviciosIncluidos: pkg.serviciosIncluidos.map((included) => {
        const service = serviceById.get(included.id);
        return {
          id: included.id,
          nombre: service?.nombre || 'Servicio sin nombre configurado',
          esRegalo: Boolean(included.esRegalo),
          precio: service?.precioVenta || service?.precioPorPersona || service?.precioBase || 0,
          calculationMethod: service?.calculationMethod,
        };
      }),
    }));
    const businessContext = JSON.stringify({
      paquetesCatalog,
      menusCatalog: config?.menus || [],
      serviciosCompletos: services.map(s => ({
        id: s.id,
        nombre: s.nombre,
        categoria: s.categoria,
        precio: s.precioVenta || s.precioPorPersona || s.precioBase || 0,
        calculationMethod: s.calculationMethod
      })),
      cateringMenus: menus.map(m => ({
        id: m.id,
        nombre: m.name,
      }))
    });

    const currentStateJson = JSON.stringify(normalizedInput.currentState);

    // 2. Call Gemini
    const { output } = await copilotPrompt({
      message: normalizedInput.message,
      history: normalizedInput.history,
      currentState: normalizedInput.currentState,
      // Pass serialized data into the prompt template
      businessContext,
      currentStateJson
    } as any);

    if (!output) {
      throw new Error('Gemini no retornó una respuesta válida.');
    }

    // 3. Process check_availability custom tool logic on server side
    if (output.action?.type === 'check_availability' && output.action.changes?.eventoFecha) {
      try {
        const dateCheck = await checkDateAvailability(output.action.changes.eventoFecha);
        if (!dateCheck.isOccupied) {
          output.response = `¡Buenas noticias! Estuve revisando el calendario y la fecha del ${output.action.changes.eventoFecha} está libre para tu evento 🎉. ¿Querés que la guardemos en el simulador?`;
          output.suggestionPill = {
            label: 'Guardar esta fecha',
            messageToSubmit: `Sí, guardar fecha ${output.action.changes.eventoFecha}`
          };
          output.action.type = 'apply_changes';
        } else {
          output.response = `Estuve chequeando y la fecha del ${output.action.changes.eventoFecha} ya está ocupada o reservada 😔. ¿Querés probar con otra fecha cercana?`;
          output.action.type = 'none';
          output.action.changes = undefined;
        }
      } catch (err) {
        // Suppress check failure and return original response
      }
    }

    return sanitizeCopilotOutput({
      response: output.response,
      action: output.action ? {
        type: output.action.type as 'none' | 'apply_changes' | 'check_availability',
        reason: output.action.reason || undefined,
        changes: output.action.changes || undefined
      } : { type: 'none' as const },
      suggestionPill: output.suggestionPill || undefined
    }, config, services, menus);

  } catch (error: any) {
    logger.error('[copilot] Error in chatWithBudgetCopilot:', error);
    return sanitizeCopilotOutput(getStaticFallbackResponse(normalizedInput, config), config, services, menus);
  }
}

/**
 * Deterministic rule-based fallback response if Gemini fails.
 */
function getStaticFallbackResponse(input: CopilotInput, config: ArmadoRapidoConfig | null): CopilotOutput {
  const msg = input.message.toLowerCase();

  // Fallback 1: Date check request
  const dateRegex = /(\d{4})[-/](\d{2})[-/](\d{2})/;
  const dateMatch = msg.match(dateRegex);
  if (dateMatch) {
    const matchedDate = dateMatch[0];
    return {
      response: `Dale, para ver si el ${matchedDate} está disponible te sugiero usar el calendario interactivo a la izquierda. Ahí podés elegir el día y ver en tiempo real si el salón está libre.`,
      action: { type: 'none' as const }
    };
  }

  // Fallback 2: Reduce budget request
  if (msg.includes('barato') || msg.includes('bajar') || msg.includes('precio') || msg.includes('ahorrar') || msg.includes('reducir')) {
    const lowerPackage = (config?.paquetes || []).find((item) => {
      const normalized = `${item.id} ${item.nombre}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return normalized.includes('plata') || normalized.includes('bronce') || normalized.includes('basico');
    }) || config?.paquetes?.[0];

    return {
      response: lowerPackage
        ? `¡Dale, te ayudo a ahorrar! Podemos probar el paquete ${lowerPackage.nombre} y revisar los servicios adicionales.`
        : '¡Dale, te ayudo a ahorrar! Revisemos los servicios adicionales y dejemos solamente lo esencial para tu fiesta.',
      action: lowerPackage
        ? { type: 'apply_changes' as const, changes: { selectedPaqueteId: lowerPackage.id } }
        : { type: 'none' as const },
      suggestionPill: lowerPackage ? {
        label: `Probar ${lowerPackage.nombre}`.slice(0, 40),
        messageToSubmit: `Probar paquete ${lowerPackage.nombre}`,
      } : undefined,
    };
  }

  // Fallback 3: Package information request
  if (msg.includes('paquete') || msg.includes('premium') || msg.includes('platino') || msg.includes('oro')) {
    const selectedPackage = (config?.paquetes || []).find((pkg) => pkg.id === input.currentState.selectedPaqueteId);
    const recommendedPackage = selectedPackage
      || (config?.paquetes || []).find((pkg) => pkg.recommended)
      || config?.paquetes?.[0];
    const includedCount = recommendedPackage?.serviciosIncluidos.length || 0;
    return {
      response: recommendedPackage
        ? `Para tu configuración te conviene revisar ${recommendedPackage.nombre}. Tiene ${includedCount} servicios configurados y ahora podés ver cada inclusión y el total estimado directamente en su tarjeta.`
        : 'Todavía no hay paquetes configurados para este tipo de evento. Podés armar una propuesta a medida con los servicios disponibles.',
      action: recommendedPackage
        ? { type: 'apply_changes' as const, changes: { selectedPaqueteId: recommendedPackage.id } }
        : { type: 'none' as const },
    };
  }

  // Generic conversational fallback
  return {
    response: `¡Hola! Soy Sofía. En este momento estoy con intermitencias en mi conexión inteligente 📡, pero podés ajustar los invitados, menús o paquetes directamente a la izquierda y el presupuesto se calculará al instante. ¡Armá tu fiesta ahí!`,
    action: { type: 'none' as const }
  };
}

