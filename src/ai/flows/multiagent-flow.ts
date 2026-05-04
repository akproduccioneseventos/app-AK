'use server';

import { ai, geminiModel } from '@/ai/genkit';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { getAgentMemoryProfile } from '@/lib/multiagent/memory-store';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';

function detectAgent(input: AkMultiAgentInput): AkAgentType {
  if (input.agentType) return input.agentType;
  const path = input.pathname || '';
  const msg = input.message.toLowerCase();

  if (input.fiestaId || path.startsWith('/fiestas/nueva')) return 'fiesta';
  if (path.includes('/empresa/contabilidad') || path.includes('/invoices') || msg.includes('rentabilidad') || msg.includes('ganancia') || msg.includes('contable')) return 'contable';
  if (path.includes('/marketing') || msg.includes('post') || msg.includes('instagram') || msg.includes('facebook') || msg.includes('whatsapp')) return 'marketing';
  if (path.includes('/contabilidad/crm') || msg.includes('lead') || msg.includes('prospecto') || msg.includes('venta')) return 'comercial';
  if (msg.includes('todas las fiestas') || msg.includes('eventos atrasados') || msg.includes('fiestas pendientes')) return 'fiestas_general';
  return 'secretaria';
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
    fiesta: 'Sos el asistente de una fiesta concreta. Revisás pendientes, riesgos, decisiones, módulos incompletos, pagos, contrato, invitados, catering, decoración, música, fotografía y tareas.',
    fiestas_general: 'Sos el coordinador general de todas las fiestas. Comparás eventos, detectás atrasos y aprendés patrones para mejorar futuras fiestas.',
    contable: 'Sos el agente contable. Analizás pagos, saldos, costos, rentabilidad, deudas, presupuestos y alertas financieras.',
    marketing: 'Sos el agente de marketing de AK. Creás contenido humano, uruguayo, vendedor sin vender, con foco en captar clientes y educar.',
    comercial: 'Sos el agente comercial. Revisás leads, presupuestos, seguimiento de clientes, oportunidades y mensajes para cerrar ventas.',
    central: 'Sos el coordinador multiagente. Elegís el especialista correcto y das respuestas concretas.',
  };
  return roles[agentType];
}

async function buildContext(input: AkMultiAgentInput, agentType: AkAgentType) {
  const [kpiResult, presupuestos, leads] = await Promise.all([
    getDashboardKpiData().catch(() => null),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
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

  return {
    fiesta,
    fiestas,
    memory,
    text: `
FECHA ACTUAL: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}
AGENTE ACTIVO: ${agentName(agentType, fiesta?.configuracion?.nombreFiesta)}

MEMORIA DEL AGENTE:
${memory.summary || 'Sin memoria todavía.'}

APRENDIZAJES RECIENTES:
${memory.learnings.slice(0, 12).map(item => `- ${item.title}: ${item.content}`).join('\n') || 'Sin aprendizajes guardados.'}

FIESTA ACTUAL:
${fiesta ? JSON.stringify({
  id: fiesta.id,
  nombre: fiesta.configuracion?.nombreFiesta,
  tipo: fiesta.configuracion?.tipoFiesta,
  fecha: fiesta.configuracion?.fechaEvento,
  invitados: fiesta.configuracion?.numeroInvitados,
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
${leads.slice(-8).map(l => `- ${l.name} | ${l.stageId || 'sin etapa'} | ${l.followUpDate || 'sin fecha'}`).join('\n') || 'Sin leads.'}

FIESTAS REVISADAS:
${fiestas.slice(0, 12).map(f => `- ${f.configuracion?.nombreFiesta || f.id} | ${f.configuracion?.tipoFiesta || 'sin tipo'} | ${f.configuracion?.fechaEvento || 'sin fecha'} | ${f.estado || 'sin estado'}`).join('\n') || 'No aplica.'}
`,
  };
}

export async function runMultiAgent(input: AkMultiAgentInput): Promise<AkMultiAgentOutput> {
  const agentType = detectAgent(input);
  const context = await buildContext(input, agentType);
  const name = agentName(agentType, context.fiesta?.configuracion?.nombreFiesta);

  const { text } = await ai.generate({
    model: geminiModel,
    system: `${agentRole(agentType)}\n\nReglas: hablá simple, directo y práctico. No inventes acciones realizadas. Si falta información, pedí una sola cosa. Si detectás un aprendizaje útil, sugerí guardarlo, pero no digas que se guardó si no se ejecutó una acción real.`,
    prompt: `CONTEXTO REAL DE LA APP:\n${context.text}\n\nHISTORIAL:\n${input.history.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nMENSAJE DE ALEXANDER:\n${input.message}`,
    config: { temperature: agentType === 'marketing' ? 0.7 : 0.2 },
  });

  return {
    success: true,
    response: text || 'No pude generar respuesta. Probá de nuevo.',
    agentType,
    agentName: name,
    action: { type: 'none' },
  };
}
