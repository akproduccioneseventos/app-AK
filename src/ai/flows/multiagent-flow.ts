'use server';

import { ai, geminiModel } from '@/ai/genkit';
import { chatWithMarketingAgent } from '@/ai/flows/marketing-agent-flow';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { getAgentMemoryProfile, saveAgentLearning } from '@/lib/multiagent/memory-store';
import { buildMultiAgentTeamBriefing, formatAgentDiagnosticsForPrompt } from '@/lib/multiagent/diagnostics';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';

const MARKETING_CONTENT_REGEX = /(post|historia|reel|tiktok|instagram|facebook|whatsapp|publicaci|campaña|campana|caption|copy|texto|contenido|anuncio|promo)/i;

function detectAgent(input: AkMultiAgentInput): AkAgentType {
  if (input.agentType) return input.agentType;
  const path = input.pathname || '';
  const msg = input.message.toLowerCase();

  if (input.fiestaId || path.startsWith('/fiestas/nueva')) return 'fiesta';
  if (path.includes('/empresa/contabilidad') || path.includes('/invoices') || msg.includes('rentabilidad') || msg.includes('ganancia') || msg.includes('contable')) return 'contable';
  if (path.includes('/marketing') || msg.includes('post') || msg.includes('instagram') || msg.includes('facebook') || msg.includes('whatsapp')) return 'marketing';
  if (path.includes('/contabilidad/crm') || msg.includes('lead') || msg.includes('prospecto') || msg.includes('venta')) return 'comercial';
  if (msg.includes('todas las fiestas') || msg.includes('eventos a revisar') || msg.includes('fiestas pendientes')) return 'fiestas_general';
  return 'secretaria';
}

function getFiestaNombre(fiesta: any): string | undefined {
  return fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.nombreFiesta || fiesta?.nombreEvento || fiesta?.nombre;
}

function getFiestaTipo(fiesta: any): string | undefined {
  return fiesta?.configuracion?.tipoEvento || fiesta?.configuracion?.tipoFiesta || fiesta?.tipoEvento || fiesta?.tipo;
}

function getFiestaInvitados(fiesta: any): number | undefined {
  return fiesta?.configuracion?.invitadosEstimados || fiesta?.configuracion?.numeroInvitados || fiesta?.invitadosEstimados;
}

function agentName(agentType: AkAgentType, fiestaName?: string): string {
  const names: Record<AkAgentType, string> = {
    secretaria: 'Secretaria AK',
    fiesta: fiestaName ? `Asistente de la fiesta: ${fiestaName}` : 'Asistente de esta fiesta',
    fiestas_general: 'Coordinador General de Fiestas',
    contable: 'Agente Contable AK',
    marketing: 'Agente de Marketing AK',
    comercial: 'Agente Comercial AK',
    central: 'Multiagente AK',
  };
  return names[agentType];
}

function agentRole(agentType: AkAgentType): string {
  const roles: Record<AkAgentType, string> = {
    secretaria: 'Sos la secretaria personal de Alexander. Priorizás recordatorios, llamadas, tareas, reuniones, pagos y próximos pasos. Respondés muy simple y accionable.',
    fiesta: 'Sos el asistente de una fiesta concreta. Revisás pendientes, prioridades, decisiones, módulos incompletos, pagos, contrato, invitados, catering, decoración, música, fotografía y tareas.',
    fiestas_general: 'Sos el coordinador general de todas las fiestas. Comparás eventos, detectás atrasos o puntos a revisar y aprendés patrones para mejorar futuras fiestas.',
    contable: 'Sos el agente contable. Analizás pagos, saldos, costos, rentabilidad, deudas, presupuestos y avisos financieros.',
    marketing: 'Sos el agente de marketing de AK. Usás el motor de Marketing AK como base cuando hay que crear contenido y revisás oportunidades reales de campañas, post-fiesta, WhatsApp y redes.',
    comercial: 'Sos el agente comercial. Revisás leads, presupuestos, seguimiento de clientes, oportunidades y mensajes para cerrar ventas.',
    central: 'Sos el coordinador multiagente. Elegís el especialista correcto y das respuestas concretas.',
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

async function buildContext(input: AkMultiAgentInput, agentType: AkAgentType) {
  const [kpiResult, presupuestos, leads, briefing] = await Promise.all([
    getDashboardKpiData().catch(() => null),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
    buildMultiAgentTeamBriefing({ fiestaId: input.fiestaId }).catch(() => null),
  ]);

  const fiesta = input.fiestaId ? await getFiestaById(input.fiestaId).catch(() => null) : null;
  const fiestas = agentType === 'fiestas_general' || agentType === 'secretaria'
    ? await getAllFiestas().catch(() => [])
    : [];

  const memory = await getAgentMemoryProfile({
    agentType,
    fiestaId: input.fiestaId,
    scope: input.fiestaId ? 'fiesta' : agentType === 'secretaria' ? 'global' : 'modulo',
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

export async function runMultiAgent(input: AkMultiAgentInput): Promise<AkMultiAgentOutput> {
  const agentType = detectAgent(input);
  const context = await buildContext(input, agentType);
  const name = agentName(agentType, getFiestaNombre(context.fiesta));

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
      response: marketingResult.content || 'No pude generar contenido de marketing. Probá de nuevo.',
      agentType,
      agentName: name,
      action: { type: 'none' },
    };
  }

  const { text } = await ai.generate({
    model: geminiModel,
    system: `${agentRole(agentType)}\n\nReglas: hablá simple, directo y práctico. Primero usá el diagnóstico automático si existe. Separá la respuesta en: 1) lo más importante, 2) próximos pasos, 3) aprendizaje sugerido si corresponde. No inventes acciones realizadas. Si falta información, pedí una sola cosa. Si detectás un aprendizaje útil, sugerí guardarlo, pero no digas que se guardó si no se ejecutó una acción real.`,
    prompt: `CONTEXTO REAL DE LA APP:\n${context.text}\n\nHISTORIAL:\n${input.history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nMENSAJE DE ALEXANDER:\n${input.message}`,
    config: { temperature: agentType === 'marketing' ? 0.55 : 0.2 },
  });

  return {
    success: true,
    response: text || 'No pude generar respuesta. Probá de nuevo.',
    agentType,
    agentName: name,
    action: { type: 'none' },
  };
}
