'use server';

import { ai, getGeminiGenerationConfigForAgent, getGeminiModelForAgent } from '@/ai/genkit';
import { chatWithMarketingAgent } from '@/ai/flows/marketing-agent-flow';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { getAgentMemoryProfile, saveAgentLearning } from '@/lib/multiagent/memory-store';
import { buildMultiAgentTeamBriefing, formatAgentDiagnosticsForPrompt } from '@/lib/multiagent/diagnostics';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';

const MARKETING_CONTENT_REGEX = /(post|historia|reel|tiktok|instagram|facebook|whatsapp|publicaci|campaña|campana|caption|copy|texto|contenido|anuncio|promo)/i;
const DEEP_REQUEST_REGEX = /(auditor|diagn[oó]stico profundo|revision completa|revisi[oó]n completa|cierre|estrategia|prioridades generales|todo el equipo|preparaci[oó]n total)/i;

function detectAgent(input: AkMultiAgentInput): AkAgentType {
  if (input.agentType) return input.agentType;
  const path = input.pathname || '';
  const msg = input.message.toLowerCase();

  if (input.fiestaId || path.startsWith('/fiestas/nueva') || /^\/fiestas\/[^/]+/.test(path) || path.includes('/evento/')) return 'fiesta';
  if (path.includes('/eventos') || msg.includes('todas las fiestas') || msg.includes('eventos a revisar') || msg.includes('fiestas pendientes')) return 'fiestas_general';
  if (path.includes('/plan-pagos') || path.includes('/empresa/contabilidad') || path.includes('/invoices') || path.includes('/pagos') || msg.includes('rentabilidad') || msg.includes('ganancia') || msg.includes('contable') || msg.includes('pago')) return 'contable';
  if (path.includes('/marketing') || path.includes('/galeria') || msg.includes('post') || msg.includes('instagram') || msg.includes('facebook') || msg.includes('whatsapp')) return 'marketing';
  if (path.includes('/contabilidad/crm') || path.includes('/presupuestos') || path.includes('/simulador') || msg.includes('lead') || msg.includes('prospecto') || msg.includes('venta')) return 'comercial';
  if (path.includes('/settings/google-workspace') || path.includes('/calendario') || path.includes('/reuniones') || msg.includes('agenda') || msg.includes('reunion') || msg.includes('mail') || msg.includes('calendar')) return 'secretaria';
  return 'central';
}

function getFiestaNombre(fiesta: any): string | undefined {
  return fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.nombreFiesta || fiesta?.nombreEvento || fiesta?.nombre;
}

function getFiestaTipo(fiesta: any): string | undefined {
  return fiesta?.configuracion?.tipoCelebracion || fiesta?.configuracion?.tipoEvento || fiesta?.configuracion?.tipoFiesta || fiesta?.tipoEvento || fiesta?.tipo;
}

function getFiestaInvitados(fiesta: any): number | undefined {
  return fiesta?.configuracion?.invitadosEstimados || fiesta?.configuracion?.numeroInvitados || fiesta?.invitadosEstimados;
}

function agentName(agentType: AkAgentType, fiestaName?: string): string {
  const names: Record<AkAgentType, string> = {
    secretaria: 'Secretaria AK',
    fiesta: fiestaName ? `Agente de la fiesta: ${fiestaName}` : 'Agente de esta Fiesta',
    fiestas_general: 'Supervisor General de Fiestas',
    contable: 'Agente Contable AK',
    marketing: 'Agente Marketing AK',
    comercial: 'Agente Comercial AK',
    central: 'Encargado General AK',
  };
  return names[agentType];
}

function agentRole(agentType: AkAgentType): string {
  const roles: Record<AkAgentType, string> = {
    secretaria: 'Sos la secretaria personal de Alexander. Priorizás recordatorios, llamadas, tareas, reuniones, pagos y próximos pasos. Respondés muy simple y accionable.',
    fiesta: 'Sos el agente de una fiesta concreta. Revisás pendientes, prioridades, decisiones, módulos incompletos, pagos, contrato, invitados, catering, decoración, música, fotografía y tareas.',
    fiestas_general: 'Sos el supervisor general de todas las fiestas. Comparás eventos, detectás atrasos o puntos a revisar y aprendés patrones para mejorar futuras fiestas.',
    contable: 'Sos el agente contable. Analizás pagos, saldos, costos, rentabilidad, deudas, presupuestos y avisos financieros.',
    marketing: 'Sos el agente de marketing de AK. Usás el motor de Marketing AK como base cuando hay que crear contenido y revisás oportunidades reales de campañas, post-fiesta, WhatsApp y redes.',
    comercial: 'Sos el agente comercial. Revisás leads, presupuestos, seguimiento de clientes, oportunidades y mensajes para cerrar ventas.',
    central: 'Sos el encargado general de la aplicación. Controlás a todos los agentes y derivás al especialista correcto.',
  };
  return roles[agentType];
}

function shouldUseDedicatedMarketingAgent(agentType: AkAgentType, message: string) {
  return agentType === 'marketing' && MARKETING_CONTENT_REGEX.test(message);
}

function detectPlatform(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('instagram') || lower.includes('historia') || lower.includes('reel')) return 'instagram';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('whatsapp')) return 'whatsapp';
  return undefined;
}

function isDeepMultiAgentRequest(input: AkMultiAgentInput, agentType: AkAgentType): boolean {
  if (agentType === 'fiestas_general' || agentType === 'contable' || agentType === 'central') return true;
  return DEEP_REQUEST_REGEX.test(input.message);
}

async function buildContext(input: AkMultiAgentInput, agentType: AkAgentType) {
  const [kpiResult, presupuestos, leads, briefing] = await Promise.all([
    getDashboardKpiData().catch(() => null),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
    buildMultiAgentTeamBriefing({ fiestaId: input.fiestaId }).catch(() => null),
  ]);

  const fiesta = input.fiestaId ? await getFiestaById(input.fiestaId).catch(() => null) : null;
  const fiestas = agentType === 'fiestas_general' || agentType === 'secretaria' || agentType === 'central'
    ? await getAllFiestas().catch(() => [])
    : [];

  const memory = await getAgentMemoryProfile({
    agentType,
    fiestaId: input.fiestaId,
    scope: input.fiestaId ? 'fiesta' : agentType === 'secretaria' || agentType === 'central' ? 'global' : 'modulo',
    module: input.fiestaId ? undefined : agentType,
  });

  const kpi = kpiResult && kpiResult.success ? kpiResult.data : null;
  const fiestaNombre = getFiestaNombre(fiesta);
  const diagnostics = briefing
    ? formatAgentDiagnosticsForPrompt(briefing, agentType, input.fiestaId)
    : 'No pude generar diagnóstico automático en este momento.';

  return {
    fiesta,
    fiestas,
    memory,
    diagnostics,
    kpi,
    presupuestos,
    leads,
    briefing,
    text: `
FECHA ACTUAL: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}
AGENTE ACTIVO: ${agentName(agentType, fiestaNombre)}

MEMORIA DEL AGENTE:
${memory.summary || 'Sin memoria todavía.'}

APRENDIZAJES RECIENTES:
${memory.learnings.slice(0, 12).map(item => `- ${item.title}: ${item.content}`).join('\n') || 'Sin aprendizajes guardados.'}

DIAGNÓSTICO AUTOMÁTICO DEL EQUIPO:
${diagnostics}

FIESTA ACTUAL:
${fiesta ? JSON.stringify({
  id: fiesta.id,
  nombre: fiestaNombre,
  tipo: getFiestaTipo(fiesta),
  fecha: fiesta.configuracion?.fechaEvento,
  invitados: getFiestaInvitados(fiesta),
  estado: fiesta.estado,
  modulos: fiesta.modulosContratados,
  tareas: fiesta.tareas?.slice?.(0, 20),
}, null, 2) : 'No hay fiesta específica en contexto.'}

RESUMEN GENERAL:
- Próximo evento: ${kpi?.proximoEvento ? `${kpi.proximoEvento.nombre} (${kpi.proximoEvento.fecha})` : 'Sin datos'}
- Presupuestos pendientes: ${kpi?.presupuestosPendientes ?? 0}
- Facturas por vencer: ${kpi?.facturasPorVencer ?? 0}
- Alertas: ${kpi?.alerts?.length ?? 0}

PRESUPUESTOS RECIENTES:
${presupuestos.slice(-8).map(p => `- ${p.clienteNombre} | ${p.eventoTipo} | ${p.estado} | $${p.totalConDescuento ?? p.costoTotalEstimado ?? 0}`).join('\n') || 'Sin presupuestos.'}

LEADS RECIENTES:
${leads.slice(-8).map(l => `- ${l.name} | ${(l as any).stageId || (l as any).currentStageId || 'sin etapa'} | ${l.followUpDate || 'sin fecha'}`).join('\n') || 'Sin leads.'}

FIESTAS REVISADAS:
${fiestas.slice(0, 12).map(f => `- ${getFiestaNombre(f) || f.id} | ${getFiestaTipo(f) || 'sin tipo'} | ${f.configuracion?.fechaEvento || 'sin fecha'} | ${f.estado || 'sin estado'}`).join('\n') || 'No aplica.'}
`,
  };
}

function fallbackResponse(agentType: AkAgentType, context: Awaited<ReturnType<typeof buildContext>>, error?: unknown) {
  const items = context.briefing?.items?.slice(0, 5) || [];
  const diagnostics = items.length
    ? items.map((item, index) => `${index + 1}. ${item.title}: ${item.detail}`).join('\n')
    : 'No veo pendientes claros con los datos actuales.';

  const steps: Record<AkAgentType, string[]> = {
    central: ['Revisar alertas generales.', 'Derivar al agente correcto.', 'No marcar nada como hecho sin acción real.'],
    fiestas_general: ['Ver fiestas próximas.', 'Priorizar las más atrasadas.', 'Revisar tareas y pagos por evento.'],
    fiesta: ['Revisar tareas pendientes.', 'Confirmar pagos, contrato y personal.', 'Crear tareas para lo que falte.'],
    secretaria: ['Mirar agenda.', 'Revisar llamadas y recordatorios.', 'Crear recordatorio si corresponde.'],
    comercial: ['Revisar leads pendientes.', 'Ver presupuestos sin respuesta.', 'Preparar mensaje de seguimiento.'],
    contable: ['Revisar pagos pendientes.', 'Confirmar saldos.', 'No aprobar comprobantes sin revisión.'],
    marketing: ['Revisar oportunidades post-fiesta.', 'Crear contenido con datos reales.', 'Pedir autorización si falta.'],
  };

  const note = error instanceof Error ? `\n\nError técnico: ${error.message.slice(0, 140)}` : '';

  return [
    'Estoy funcionando en modo respaldo. No inventé datos.',
    '',
    'Lo más importante:',
    diagnostics,
    '',
    'Próximos pasos:',
    ...steps[agentType].map(step => `- ${step}`),
    note,
  ].filter(Boolean).join('\n');
}

export async function runMultiAgent(input: AkMultiAgentInput): Promise<AkMultiAgentOutput> {
  const agentType = detectAgent(input);
  const context = await buildContext(input, agentType);
  const name = agentName(agentType, getFiestaNombre(context.fiesta));

  try {
    if (shouldUseDedicatedMarketingAgent(agentType, input.message)) {
      const marketingResult = await chatWithMarketingAgent({
        request: input.message,
        context: context.text,
        platform: detectPlatform(input.message),
        eventType: getFiestaTipo(context.fiesta),
        attachmentDataUri: input.imageDataUri,
      });

      await saveAgentLearning({
        agentType: 'marketing',
        module: 'marketing',
        title: 'Contenido generado por Marketing AK',
        content: `Pedido: ${input.message}\nResultado: ${(marketingResult.content || '').slice(0, 1200)}`,
        tags: ['marketing', 'multiagente', 'contenido'],
        source: 'conversation',
        confidence: 'medium',
      }).catch(() => null);

      return {
        success: true,
        response: marketingResult.content || fallbackResponse(agentType, context),
        agentType,
        agentName: name,
        action: { type: 'none' },
      };
    }

    const isDeepRequest = isDeepMultiAgentRequest(input, agentType);
    const model = getGeminiModelForAgent(agentType, { deep: isDeepRequest });
    const generationConfig = getGeminiGenerationConfigForAgent(agentType, { deep: isDeepRequest });

    const { text } = await ai.generate({
      model,
      system: `${agentRole(agentType)}\n\nReglas duras: hablá simple, directo y práctico. Usa solo los datos del CONTEXTO REAL. Si un dato no aparece, decí "no lo veo cargado" y sugerí dónde cargarlo. No inventes pagos, mails enviados, invitados confirmados, tareas hechas, contratos firmados ni fechas. Primero usá el diagnóstico automático si existe. Ordená la respuesta en: 1. lo más importante, 2. próximos pasos, 3. aprendizaje sugerido si corresponde. No digas que guardaste, enviaste o sincronizaste algo salvo que la acción real se haya ejecutado desde un botón o acción de servidor.`,
      prompt: `CONTEXTO REAL DE LA APP:\n${context.text}\n\nHISTORIAL:\n${input.history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nMENSAJE DE ALEXANDER:\n${input.message}`,
      config: generationConfig,
    });

    return {
      success: true,
      response: text || fallbackResponse(agentType, context),
      agentType,
      agentName: name,
      action: { type: 'none' },
    };
  } catch (error) {
    return {
      success: true,
      response: fallbackResponse(agentType, context, error),
      agentType,
      agentName: name,
      action: { type: 'none' },
      error: error instanceof Error ? error.message : 'IA no respondió',
    };
  }
}
