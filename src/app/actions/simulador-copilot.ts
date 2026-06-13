'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { z } from 'genkit';
import { getArmadoRapidoConfig } from '@/app/actions/armado-rapido';
import { getServiciosEmpresa } from '@/app/actions/servicios-empresa';
import { getMenus } from '@/app/actions/menus-catering';
import { checkDateAvailability } from '@/app/actions/simulador-v2';
import * as logger from '@/lib/logger';

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
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  // FALLBACK: Rule-based static response if API Key is not configured
  if (!apiKey) {
    logger.warn('[copilot] API Key missing. Falling back to rule-based engine.');
    return getStaticFallbackResponse(input);
  }

  try {
    // 1. Fetch business catalog data in parallel
    const [config, services, menus] = await Promise.all([
      getArmadoRapidoConfig().catch(() => null),
      getServiciosEmpresa().catch(() => []),
      getMenus().catch(() => []),
    ]);

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

    const currentStateJson = JSON.stringify(input.currentState);

    // 2. Call Gemini
    const { output } = await copilotPrompt({
      message: input.message,
      history: input.history,
      currentState: input.currentState,
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

    return {
      response: output.response,
      action: output.action ? {
        type: output.action.type as 'none' | 'apply_changes' | 'check_availability',
        reason: output.action.reason || undefined,
        changes: output.action.changes || undefined
      } : { type: 'none' as const },
      suggestionPill: output.suggestionPill || undefined
    };

  } catch (error: any) {
    logger.error('[copilot] Error in chatWithBudgetCopilot:', error);
    return getStaticFallbackResponse(input);
  }
}

/**
 * Deterministic rule-based fallback response if Gemini fails.
 */
function getStaticFallbackResponse(input: CopilotInput): CopilotOutput {
  const msg = input.message.toLowerCase();
  const state = input.currentState;

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
    return {
      response: `¡Dale, te ayudo a ahorrar! Una opción bárbara para bajar los costos es cambiar el paquete seleccionado por uno de nivel inicial (como Plata o Bronce) y desmarcar servicios adicionales a la izquierda. ¿Te parece bien probar el paquete Plata?`,
      action: {
        type: 'apply_changes' as const,
        changes: { selectedPaqueteId: 'plata' }
      },
      suggestionPill: {
        label: 'Probar paquete Plata',
        messageToSubmit: 'Probar paquete Plata'
      }
    };
  }

  // Fallback 3: Package information request
  if (msg.includes('paquete') || msg.includes('premium') || msg.includes('platino') || msg.includes('oro')) {
    return {
      response: `Bárbaro, los paquetes (Bronce, Plata, Oro, Platino) definen los servicios de base incluidos (pantallas, cabina, luces, DJ). Podés ver qué incluye cada uno seleccionándolo en los botones del formulario a la izquierda.`,
      action: { type: 'none' as const }
    };
  }

  // Generic conversational fallback
  return {
    response: `¡Hola! Soy Sofía. Ajustá los invitados, menús o paquetes a la izquierda y el presupuesto se calculará al instante. Si tenés dudas sobre los servicios, consultame por acá. ¿De qué tipo es tu fiesta?`,
    action: { type: 'none' as const }
  };
}
