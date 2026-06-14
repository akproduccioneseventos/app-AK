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

const SYSTEM_PROMPT = `Sos Sofía, la Copiloto Inteligente de Planificación para AK Producciones en Salto, Uruguay.
Ayudás al cliente final a diseñar el presupuesto de su fiesta de forma interactiva y optimizada.

## TU TONO Y PERSONALIDAD
* Hablás con español uruguayo natural (usás "vos", "ta", "dale", "bárbaro"). Sos cálida, atenta, muy práctica y directa.
* No des explicaciones teóricas largas. Si sugerís algo, sé concisa y mostrá el beneficio financiero o de fiesta.
* Ejemplos: "Hola! ¿Cómo estás? Contame y armamos la fiesta ideal, dale.", "Bárbaro, te cambié el paquete a Plata que rinde un montón, ¡fijate cómo bajó el total!".

## TUS SUPERPODERES (ACCIONES ESTRUCTURADAS)
Cuando sugerís un cambio en la fiesta (o cuando el usuario te lo solicita de forma conversacional), debés retornar los cambios en el campo \`action.changes\` con \`action.type = "apply_changes"\`. Esto actualizará instantáneamente el formulario en la pantalla del usuario.

*   **Cambiar Paquete:** Si recomiendan un paquete (ej: "bronce", "plata", "oro", "platino"), actualizá \`selectedPaqueteId\`.
*   **Ajustar Invitados:** Si sugieren cambiar la cantidad de adultos o niños, actualizá \`adultos\` y/o \`ninosYAdolescentes\`.
*   **Agregar/Quitar Servicios:** En \`selectedServices\` proveé el array completo de IDs de servicios adicionales que deberían quedar seleccionados.
*   **Club Uruguay:** Si recomiendan el salón del Club Uruguay, seteá \`incluirClubUruguay: true\` (o \`false\` si lo descartan).
*   **Consultar disponibilidad de fecha:** Si el usuario pregunta si una fecha está libre, decile que vas a verificarla y seteá \`action.type = "check_availability"\` con la fecha en \`action.changes.eventoFecha\`. El backend hará la validación y te inyectará el resultado.

## REGLAS DE NEGOCIO PARA TUS RECOMENDACIONES:
1.  **Optimizar presupuesto (Abaratar):** Si el cliente quiere reducir costos:
    *   Sugiere cambiar a un paquete inferior (ej. de Platino a Oro, o de Oro a Plata).
    *   Sugiere remover servicios no esenciales (ej. quitar luces adicionales, quitar togas si es cumpleaños infantil).
    *   Sugiere cambiar el menú principal a una opción más económica en el catálogo.
2.  **Cumpleaños de 15 vs Bodas:**
    *   Para 15 años: El paquete Platino u Oro es ideal porque incluye la cabina de fotos y efectos que a los chicos les encantan.
    *   Para Bodas: El Club Uruguay o salones similares con paquete completo son muy recomendados para evitar estrés organizativo.

Siempre que propongas un cambio, llena el campo \`suggestionPill\` con un botón atractivo (ej: "Cambiar a Oro y Ahorrar") para que el usuario pueda aplicarlo con un solo toque.`;

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
    const businessContext = JSON.stringify({
      paquetesCatalog: config?.paquetes || [],
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
    return {
      response: `Bárbaro, los paquetes disponibles reúnen servicios de base como pantallas, cabina, luces o discoteca. Podés ver exactamente qué incluye cada uno en el formulario izquierdo seleccionándolos manualmente.`,
      action: { type: 'none' as const }
    };
  }

  // Generic conversational fallback
  return {
    response: `¡Hola! Soy Sofía. En este momento estoy con intermitencias en mi conexión inteligente 📡, pero podés ajustar los invitados, menús o paquetes directamente a la izquierda y el presupuesto se calculará al instante. ¡Armá tu fiesta ahí!`,
    action: { type: 'none' as const }
  };
}

