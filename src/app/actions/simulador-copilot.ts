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
import { readData, writeData } from '@/lib/data-service';
import { CopilotConfig, DEFAULT_COPILOT_CONFIG } from '@/types/copilot';

const COPILOT_CONFIG_FILE = 'copilot-config.json';

export async function getCopilotConfig(): Promise<CopilotConfig> {
  const config = await readData<CopilotConfig>(COPILOT_CONFIG_FILE, DEFAULT_COPILOT_CONFIG);
  return {
    promptPersonalidad: config?.promptPersonalidad || DEFAULT_COPILOT_CONFIG.promptPersonalidad,
    faqs: config?.faqs || DEFAULT_COPILOT_CONFIG.faqs,
  };
}

export async function saveCopilotConfig(
  newConfig: CopilotConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitizedConfig: CopilotConfig = {
      promptPersonalidad: (newConfig.promptPersonalidad || '').trim(),
      faqs: (newConfig.faqs || []).map(faq => ({
        pregunta: (faq.pregunta || '').trim(),
        respuesta: (faq.respuesta || '').trim(),
      })).filter(faq => faq.pregunta && faq.respuesta)
    };
    await writeData(COPILOT_CONFIG_FILE, sanitizedConfig);
    return { success: true };
  } catch (error: any) {
    logger.error('[copilot] Error saving copilot config:', error);
    return { success: false, error: error.message || 'No se pudo guardar la configuraciÃ³n de la IA.' };
  }
}

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

const GenkitCopilotInputSchema = z.object({
  message: z.string(),
  history: z.array(ChatHistoryItemSchema),
  currentState: SimulatorStateSchema,
  businessContext: z.string(),
  currentStateJson: z.string(),
  copilotSystemPrompt: z.string(),
  faqsJson: z.string(),
});

const CopilotOutputSchema = z.object({
  response: z.string().describe('Texto conversacional de respuesta en espaÃ±ol rioplatense (uruguayo: vos, dale, bÃ¡rbaro).'),
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
    label: z.string().describe('Texto del botÃ³n (mÃ¡ximo 4 palabras, ej: "Cambiar a Oro y Ahorrar")'),
    messageToSubmit: z.string().describe('Mensaje de texto a enviar al chat cuando se pulse el botÃ³n'),
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

const SYSTEM_PROMPT = `{{{copilotSystemPrompt}}}

## BASE DE CONOCIMIENTO Y FAQs (PREGUNTAS FRECUENTES):
UtilizÃ¡ las siguientes FAQs para responder cualquier duda del usuario:
{{{faqsJson}}}`;

// Define prompt with Genkit
const copilotPrompt = ai.definePrompt({
  name: 'copilotPrompt',
  model: geminiModel,
  input: { schema: GenkitCopilotInputSchema },
  output: { schema: CopilotOutputSchema },
  system: SYSTEM_PROMPT,
  prompt: `## INFORMACIÃ“N DE LA EMPRESA (PAQUETES Y SERVICIOS DISPONIBLES):
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
      response: 'Contame brevemente quÃ© tipo de fiesta querÃ©s organizar y te ayudo a armarla.',
      action: { type: 'none' },
    };
  }

  const [config, services, menus, copilotConfig] = await Promise.all([
    getArmadoRapidoConfig().catch(() => null),
    getServiciosEmpresa().catch(() => []),
    getMenus().catch(() => []),
    getCopilotConfig().catch(() => DEFAULT_COPILOT_CONFIG),
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
      businessContext,
      currentStateJson,
      copilotSystemPrompt: copilotConfig.promptPersonalidad,
      faqsJson: JSON.stringify(copilotConfig.faqs)
    } as any);

    if (!output) {
      throw new Error('Gemini no retornÃ³ una respuesta vÃ¡lida.');
    }

    // 3. Process check_availability custom tool logic on server side
    if (output.action?.type === 'check_availability' && output.action.changes?.eventoFecha) {
      try {
        const dateCheck = await checkDateAvailability(output.action.changes.eventoFecha);
        if (!dateCheck.isOccupied) {
          output.response = `Â¡Buenas noticias! Estuve revisando el calendario y la fecha del ${output.action.changes.eventoFecha} estÃ¡ libre para tu evento ðŸŽ‰. Â¿QuerÃ©s que la guardemos en el simulador?`;
          output.suggestionPill = {
            label: 'Guardar esta fecha',
            messageToSubmit: `SÃ­, guardar fecha ${output.action.changes.eventoFecha}`
          };
          output.action.type = 'apply_changes';
        } else {
          output.response = `Estuve chequeando y la fecha del ${output.action.changes.eventoFecha} ya estÃ¡ ocupada o reservada ðŸ˜”. Â¿QuerÃ©s probar con otra fecha cercana?`;
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
      response: `Dale, para ver si el ${matchedDate} estÃ¡ disponible te sugiero usar el calendario interactivo a la izquierda. AhÃ­ podÃ©s elegir el dÃ­a y ver en tiempo real si el salÃ³n estÃ¡ libre.`,
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
        ? `Â¡Dale, te ayudo a ahorrar! Podemos probar el paquete ${lowerPackage.nombre} y revisar los servicios adicionales.`
        : 'Â¡Dale, te ayudo a ahorrar! Revisemos los servicios adicionales y dejemos solamente lo esencial para tu fiesta.',
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
  if (msg.includes('paquete') || msg.includes('premium') || msg.includes('platino') || msg.includes('oro') || msg.includes('plata') || msg.includes('bronce') || msg.includes('basico') || msg.includes('bÃ¡sico')) {
    const foundPkg = (config?.paquetes || []).find((pkg) => {
      const normalizedName = pkg.nombre
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      const normalizedId = pkg.id
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return msg.includes(normalizedName) || msg.includes(normalizedId);
    });

    const recommendedPackage = foundPkg
      || (config?.paquetes || []).find((pkg) => pkg.id === input.currentState.selectedPaqueteId)
      || (config?.paquetes || []).find((pkg) => pkg.recommended)
      || config?.paquetes?.[0];
    const includedCount = recommendedPackage?.serviciosIncluidos.length || 0;
    return {
      response: recommendedPackage
        ? `Para tu configuraciÃ³n te conviene revisar ${recommendedPackage.nombre}. Tiene ${includedCount} servicios configurados y ahora podÃ©s ver cada inclusiÃ³n y el total estimado directamente en su tarjeta.`
        : 'TodavÃ­a no hay paquetes configurados para este tipo de evento. PodÃ©s armar una propuesta a medida con los servicios disponibles.',
      action: recommendedPackage
        ? { type: 'apply_changes' as const, changes: { selectedPaqueteId: recommendedPackage.id } }
        : { type: 'none' as const },
    };
  }

  // Generic conversational fallback
  return {
    response: `Â¡Hola! Soy SofÃ­a. En este momento estoy con intermitencias en mi conexiÃ³n inteligente ðŸ“¡, pero podÃ©s ajustar los invitados, menÃºs o paquetes directamente a la izquierda y el presupuesto se calcularÃ¡ al instante. Â¡ArmÃ¡ tu fiesta ahÃ­!`,
    action: { type: 'none' as const }
  };
}

