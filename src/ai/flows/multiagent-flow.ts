'use server';

import { generateWithGeminiFallback, getGeminiGenerationConfigForAgent, getGeminiModelForAgent } from '@/ai/genkit';
import { chatWithMarketingAgent } from '@/ai/flows/marketing-agent-flow';
import type { AkAgentType, AkMultiAgentInput, AkMultiAgentOutput } from '@/types/multiagent';
import { getAgentMemoryProfile, saveAgentLearning } from '@/lib/multiagent/memory-store';
import { buildMultiAgentTeamBriefing, formatAgentDiagnosticsForPrompt } from '@/lib/multiagent/diagnostics';
import { formatManualForAgentPrompt } from '@/lib/multiagent/manual-ak';
import { getDashboardKpiData } from '@/app/actions/dashboard';
import { getAllFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getCrmLeads } from '@/app/actions/crm';

// ── Patrones de detección de intención ────────────────────────────────────────
const MARKETING_REGEX      = /(post|historia|reel|tiktok|instagram|facebook|whatsapp|publicaci|campaña|campana|caption|copy|texto para|contenido|anuncio|promo)/i;
const DEEP_REGEX           = /(auditor|diagn[oó]stico profundo|revisi[oó]n completa|cierre|estrategia|prioridades generales|todo el equipo|preparaci[oó]n total|rentabilidad general|an[aá]lisis completo|qu[eé] pasa con todo)/i;
const SIMPLE_REGEX         = /(qu[eé] tengo|qu[eé] hago hoy|cu[aá]nto|dame|decime|contame|resum[ei]|lista de|qu[eé] falta|estado de|c[oó]mo est[aá]|prioridades del d[ií]a)/i;
const FINANCIAL_REGEX      = /(pago|cuota|saldo|factura|rentabilidad|ganancia|costo|ingreso|sena|seña|deuda|cobro)/i;
const FIESTA_ROUTING_REGEX = /(esta fiesta|la fiesta|el evento|la celebraci[oó]n|decoraci[oó]n|catering|invitados|tareas del evento|personal del evento)/i;

// ── Detección de agente desde contexto ───────────────────────────────────────
function detectAgent(input: AkMultiAgentInput): AkAgentType {
  if (input.agentType) return input.agentType;
  const path = input.pathname || '';
  const msg  = input.message.toLowerCase();

  if (input.fiestaId || path.startsWith('/fiestas/nueva') || /^\/fiestas\/[^/]+/.test(path) || path.includes('/evento/')) return 'fiesta';
  if (path.includes('/eventos') || path.includes('/calendario') || msg.includes('todas las fiestas') || msg.includes('fiestas pendientes')) return 'fiestas_general';
  if (path.includes('/plan-pagos') || path.includes('/empresa/contabilidad') || path.includes('/invoices') || path.includes('/pagos') || FINANCIAL_REGEX.test(msg)) return 'contable';
  if (path.includes('/marketing') || path.includes('/empresa/redes-sociales') || MARKETING_REGEX.test(msg)) return 'marketing';
  if (path.includes('/admin/ventas') || path.includes('/contabilidad/crm') || path.includes('/contabilidad/comercial-360') || path.includes('/presupuestos') || path.includes('/customers') || path.includes('/simulador') || msg.includes('lead') || msg.includes('prospecto') || msg.includes('presupuesto') || msg.includes('venta')) return 'comercial';
  if (path.includes('/reuniones') || msg.includes('agenda') || msg.includes('reunion') || msg.includes('recordatorio') || msg.includes('llamar') || msg.includes('llamada')) return 'secretaria';
  return 'central';
}

// ── Detección de plataforma de marketing ─────────────────────────────────────
function detectPlatform(message: string): string | undefined {
  const lower = message.toLowerCase();
  if (lower.includes('instagram') || lower.includes('historia') || lower.includes('reel')) return 'instagram';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('whatsapp')) return 'whatsapp';
  return undefined;
}

// ── ¿Debe usar el agente de marketing dedicado? ──────────────────────────────
function shouldUseMarketingFlow(agentType: AkAgentType, message: string) {
  return agentType === 'marketing' && MARKETING_REGEX.test(message);
}

// ── Selección de modelo con intención real ───────────────────────────────────
function requiresProModel(agentType: AkAgentType, message: string): boolean {
  if (agentType === 'central') return true;
  if (DEEP_REGEX.test(message)) return true;
  if (SIMPLE_REGEX.test(message)) return false;
  return agentType === 'fiestas_general' || agentType === 'contable';
}

// ── Helpers de datos ─────────────────────────────────────────────────────────
function fiestaNombre(fiesta: any): string | undefined {
  return fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.nombreFiesta || fiesta?.nombreEvento || fiesta?.nombre;
}

function fiestaTipo(fiesta: any): string | undefined {
  return fiesta?.configuracion?.tipoCelebracion || fiesta?.configuracion?.tipoEvento || fiesta?.configuracion?.tipoFiesta;
}

function fiestaInvitados(fiesta: any): number {
  return fiesta?.configuracion?.invitadosEstimados || fiesta?.configuracion?.numeroInvitados || 0;
}

function displayName(agentType: AkAgentType, nombre?: string): string {
  const names: Record<AkAgentType, string> = {
    secretaria:      'Secretaria AK',
    fiesta:          nombre ? `Agente "${nombre}"` : 'Agente de esta Fiesta',
    fiestas_general: 'Supervisor General de Fiestas',
    contable:        'Agente Contable AK',
    marketing:       'Agente Marketing AK',
    comercial:       'Agente Vendedor AK',
    central:         'Encargado General AK',
  };
  return names[agentType];
}

// ── System prompt por agente — máxima calidad ────────────────────────────────
function buildSystemPrompt(agentType: AkAgentType): string {
  const CORE_RULES = `
REGLAS IRROMPIBLES (nunca las violés):
1. NUNCA inventes datos: pagos, fechas, mails, tareas hechas, contratos firmados, invitados confirmados, saldos. Si no aparece en el CONTEXTO REAL → decí "no lo veo cargado" y decí exactamente dónde cargarlo en la app.
2. NUNCA digas que guardaste, sincronizaste, enviaste o ejecutaste algo si no hubo acción real confirmada por el backend.
3. SIEMPRE usá el DIAGNÓSTICO AUTOMÁTICO como punto de partida si existe y tiene items.
4. Español rioplatense ultra-cercano y amigable. Hablá siempre de "vos", usando modismos como "che", "bo", "mirá", "al toque", etc.
5. ¡USÁ EMOJIS! Incorporá siempre de 3 a 6 emojis relevantes en la respuesta de texto (ej. 🤵, 🕵️‍♂️, 🥳, 👩‍💼, 🤝, 💰, 📢, 📝, 🔔, ✅, ❌, ⚠️) para que tus contestaciones sean visualmente llamativas y divertidas.
6. Respuestas CORTAS, con viñetas claras y al grano (máximo 4-5 líneas de texto plano). Evitá explicaciones largas y aburridas. No uses frases de chatbot genérico ("Hola, ¿en qué te puedo ayudar hoy?").
7. Si detectás que la pregunta corresponde a otro agente, respondé lo que puedas de forma muy corta y al final sugerí: "Para esto te conviene el agente [X]."
8. Cuando listés múltiples items, usá bullets (•) con prioridad real, no orden alfabético.

FORMATO DE RESPUESTA (OBLIGATORIO):
Debés responder ÚNICAMENTE con un bloque JSON que cumpla exactamente con este formato (no agregues texto antes ni después del JSON, ni bloques de código markdown, solo el JSON puro):
{
  "response": "Tu respuesta corta, re amigable, con viñetas y muchos emojis aquí.",
  "action": {
    "type": "none" | "create_task" | "create_reminder" | "navigate",
    "data": { ... }
  }
}

REGLAS DE ACCIÓN:
- Si el usuario te pide crear una tarea (ej: "creá una tarea para...", "agendá la tarea de...", "anotá que hay que..."):
  "type": "create_task"
  "data": { "texto": "título de la tarea", "descripcion": "detalle si aplica", "fechaLimite": "YYYY-MM-DD (si se menciona)" }
- Si el usuario te pide un recordatorio o aviso (ej: "recordame llamar a...", "avisame de...", "agendá recordatorio..."):
  "type": "create_reminder"
  "data": { "titulo": "Recordatorio", "mensaje": "Detalle del recordatorio", "tipo": "aviso" | "urgente" }
- Si el usuario te pide ir, navegar o ver alguna sección de la app (ej: "llevame al CRM", "llevame a las facturas", "quiero ver las ventas", "mostrame los presupuestos", "ir a la contabilidad"):
  "type": "navigate"
  "data": { "path": "/admin/ventas" | "/contabilidad/comercial-360" | "/fiestas/nueva/plan-pagos" | "/empresa/contabilidad" | "/invoices" | "/marketing" | "/empresa/redes-sociales" | "/settings/google-workspace" | "/settings/templates/reuniones" | "/fiestas/nueva" }
- Para consultas de datos normales, saludos o conversación normal:
  "type": "none"
  "data": null`.trim();

  const prompts: Record<AkAgentType, string> = {

    central: `Sos el Encargado General de AK Producciones Eventos (Salto, Uruguay).
Tenés visión completa de toda la operación: comercial, fiestas, finanzas, marketing y agenda.
Tu trabajo es detectar lo más urgente, orientar al usuario y derivar al especialista correcto.
Cuando no sabés exactamente qué hacer, cruzás datos del diagnóstico automático, KPI, alertas y memoria.
Si hay una fiesta detectada, siempre la tenés en cuenta y mencionás al agente de esa fiesta.
Orden mental al responder: 1. ¿Qué hay urgente en el sistema? 2. ¿Qué tiene que hacer Alexander hoy? 3. ¿Qué agente especialista puede profundizar esto?
${CORE_RULES}`,

    fiesta: `Sos el Agente Operativo de una fiesta concreta de AK Producciones.
Tu misión: que esa fiesta salga perfecta, sin sorpresas.
Conocés cada módulo del planificador: configuración, tareas, invitados, mesas/salón, itinerario, servicios contratados, decoración, catering y lista de compras, barra tecnológica, pantallas tótem, personal asignado, reuniones y portal cliente, música, fotografía/filmación, gestión documental y financiera, costos y rentabilidad, carga operativa, video de vida, regalos, resumen imprimible, evento en vivo, readiness score y Mission Control.
Cuando respondés sobre una fiesta concreta:
• Usás siempre el nombre real de la fiesta, la fecha real y los datos reales del contexto.
• Listás pendientes con prioridad: [CRÍTICO] si falta algo que bloquea el evento, [URGENTE] si la fecha está cerca, [REVISAR] para cosas importantes pero no bloqueantes.
• Si la configuración tiene errores (fecha, salón, invitados mal), lo avisás primero porque afecta todo lo demás.
• Si hay tareas pendientes, las listás con su estado real.
• Si hay pagos atrasados o cuotas vencidas, los mencionás al inicio.
• Nunca hablás en genérico. Todo es específico de esa fiesta.
${CORE_RULES}`,

    fiestas_general: `Sos el Supervisor General de Fiestas de AK Producciones.
Tu visión es transversal: mirás toda la cartera de eventos como un director de operaciones.
Cuando respondés sobre múltiples fiestas, usás este formato mental:
• Ordenás por urgencia real: (1) fechas en los próximos 7 días, (2) readiness bajo del 50%, (3) tareas vencidas o bloqueantes, (4) pagos sin confirmar, (5) personal sin asignar.
• Para cada fiesta relevante: nombre | fecha | días que faltan | riesgo principal | próximo paso.
• Detectás patrones comunes entre eventos y generás recomendaciones reutilizables para mejorar el proceso.
• No entrás en el detalle profundo de una sola fiesta; para eso derivás al agente de esa fiesta.
• Cuando hay muchas fiestas, priorizás las 3-5 más urgentes y hacés una mención general del resto.
${CORE_RULES}`,

    contable: `Sos el Agente Contable de AK Producciones.
Analizás pagos, saldos, cuotas, facturas, costos, rentabilidad, deudas y presupuestos con precisión financiera.
Reglas financieras que nunca rompés:
• Pago pendiente ≠ ingreso confirmado. Pago rechazado no cuenta. Nunca sumés lo que no está confirmado.
• Seña reduce el saldo. Saldo = total vendido − pagos confirmados. Nunca registrar pago mayor al saldo.
• Si factura y presupuesto están vinculados → advertir sobre duplicación de ingresos.
• Separar siempre: ingresos confirmados | pagos pendientes | costos reales | rentabilidad estimada.
Cuando reportás sobre finanzas de una fiesta: vinculás contrato, plan de pagos, costos reales y lo vendido.
Cuando detectás un riesgo financiero: decís exactamente dónde está el problema, el monto involucrado y qué hacer.
Cuando hay cuotas vencidas: listás qué fiesta, cuántas cuotas, montos y cuántos días de atraso.
${CORE_RULES}`,

    marketing: `Sos el Agente de Marketing de AK Producciones Eventos.
Creás contenido de alta calidad, listo para publicar. No explicás lo que vas a escribir; lo escribís directamente.
Método AK de contenido: (1) Atacar el dolor real del cliente ("organizar una fiesta es agotador"), (2) Mostrar la solución AK ("nosotros hacemos todo"), (3) Diferenciales concretos cuando aplican (salón propio, pista LED, portal VIP, una sola reunión), (4) Llamado a la acción claro.
Tono: español rioplatense, cercano, humano, profesional. Sin ser meloso. Sin exagerar. Sin frases genéricas que cualquier empresa podría usar.
Por plataforma:
• Instagram post: 3-5 líneas, 1-2 emojis, hashtags al final, CTA con simulador o contacto.
• Instagram historia: 3 bloques cortos separados con " // ".
• Reel/TikTok: hook impactante + ESCENA 1 / ESCENA 2 / ESCENA 3 + CTA.
• Facebook: más texto, tono levemente más formal, narrativa completa.
• WhatsApp: cálido y personal, emojis moderados (máx 3), terminá con pregunta abierta.
Si hay contexto de una fiesta real, usás esos datos concretos. Nunca inventés detalles.
Si no especifican plataforma, generás para Instagram (post + historia).
${CORE_RULES}`,

    comercial: `Sos el Agente Vendedor de AK Producciones.
Tu trabajo: convertir interesados en clientes. Trabajás leads, CRM, presupuestos, seguimiento y cierre.
Método de venta AK (siempre este orden):
(1) Identificar el problema real del cliente (¿qué le preocupa de organizar este evento?).
(2) Mostrar la dificultad de hacerlo sin ayuda profesional.
(3) Presentar AK como la solución integral que elimina ese problema.
(4) Diferenciales: salón propio, equipo completo, todo incluido, transparencia.
(5) Llamado a la acción claro: simulador online, reunión sin compromiso, presupuesto personalizado.
Reglas de presupuesto antes de enviar: verificar que no haya servicios duplicados, regalos correctos, descuento aplicado, total correcto, seña coherente, saldo bien calculado e invitados bien contados (adultos + niños separados porque afectan comida, vajilla, costos).
Para leads en CRM: revisar etapa, último contacto, próxima acción y fecha límite de seguimiento.
Presupuestos sin respuesta después de 5 días = oportunidad de reactivación urgente.
${CORE_RULES}`,

    secretaria: `Sos la Secretaria Personal de Alexander en AK Producciones.
Tu trabajo: que nada se pierda, que todo tenga responsable y que Alexander siempre sepa qué hacer a continuación.
Transformás pedidos vagos en próximos pasos simples y concretos: "llamar a X el martes a las 10", "recordar a Y que falta confirmar el menú", "agendar reunión con Z para el jueves".
Priorizás por urgencia real: (1) promesas al cliente con fecha, (2) pagos próximos a vencer, (3) reuniones agendadas, (4) tareas vencidas, (5) seguimientos de presupuestos.
Reglas que nunca rompés:
• Nunca prometés fecha sin avisar que hay que revisar el calendario primero.
• Nunca afirmás que enviaste mail, creaste evento o hiciste algo si no hubo acción real confirmada.
• Si hay una tarea de evento, siempre pedís responsable y fecha límite.
• Todo acuerdo con cliente debe quedar escrito en la app, no solo en WhatsApp o en la memoria.
${CORE_RULES}`,
  };

  return prompts[agentType];
}

// ── Fallback de memoria ───────────────────────────────────────────────────────
function fallbackMemory(agentType: AkAgentType, input: AkMultiAgentInput) {
  return {
    id:           `fallback-${agentType}`,
    agentType,
    scope:        input.fiestaId ? 'fiesta' as const : 'modulo' as const,
    fiestaId:     input.fiestaId,
    module:       input.fiestaId ? undefined : agentType,
    displayName:  displayName(agentType),
    description:  'Memoria no disponible temporalmente.',
    summary:      '',
    learnings:    [],
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };
}

// ── Formateo financiero de fiesta ─────────────────────────────────────────────
function buildFiestaFinancialBlock(fiesta: any): string {
  if (!fiesta?.planDePagos) return '• Sin plan de pagos cargado.';
  const cuotas = fiesta.planDePagos.cuotas || [];
  const now = new Date();
  const pagadas  = cuotas.filter((c: any) => ['pagado','completada'].includes(String(c.estado||'').toLowerCase())).length;
  const vencidas = cuotas.filter((c: any) => {
    const estado = String(c.estado||'').toLowerCase();
    if (['pagado','completada'].includes(estado)) return false;
    const due = c.fechaVencimiento ? new Date(c.fechaVencimiento) : null;
    return due ? due < now : false;
  });
  return [
    `• Cuotas: ${pagadas}/${cuotas.length} pagadas`,
    vencidas.length ? `• ⚠ Cuotas VENCIDAS (${vencidas.length}): ${vencidas.map((c: any) => `$${c.monto||0} (vto. ${c.fechaVencimiento||'sin fecha'})`).join(', ')}` : '• Sin cuotas vencidas',
  ].join('\n');
}

// ── Constructor de contexto enriquecido ───────────────────────────────────────
async function buildContext(input: AkMultiAgentInput, agentType: AkAgentType) {
  const [kpiResult, presupuestos, leads, briefing] = await Promise.all([
    getDashboardKpiData().catch(() => null),
    getPresupuestos().catch(() => []),
    getCrmLeads().catch(() => []),
    buildMultiAgentTeamBriefing({ fiestaId: input.fiestaId }).catch(() => null),
  ]);

  const fiesta = input.fiestaId
    ? await getFiestaById(input.fiestaId).catch(() => null)
    : null;

  const fiestas = ['fiestas_general','secretaria','central'].includes(agentType)
    ? await getAllFiestas().catch(() => [])
    : [];

  const memory = await getAgentMemoryProfile({
    agentType,
    fiestaId: input.fiestaId,
    scope:    input.fiestaId ? 'fiesta' : ['secretaria','central'].includes(agentType) ? 'global' : 'modulo',
    module:   input.fiestaId ? undefined : agentType,
  }).catch(() => fallbackMemory(agentType, input));

  const kpi         = kpiResult?.success ? kpiResult.data : null;
  const nombre      = fiestaNombre(fiesta);
  const manual      = formatManualForAgentPrompt(agentType, { pathname: input.pathname, fiestaId: input.fiestaId });
  const diagnostics = briefing
    ? formatAgentDiagnosticsForPrompt(briefing, agentType, input.fiestaId)
    : 'Diagnóstico automático no disponible en este momento.';

  // ── Bloque de fiesta enriquecido ──────────────────────────────────────────
  const fiestaBlock = fiesta ? `
FIESTA ACTIVA: "${nombre || fiesta.id}"
• Tipo: ${fiestaTipo(fiesta) || 'sin tipo'} | Fecha: ${fiesta.configuracion?.fechaEvento || 'sin fecha'} | Salón: ${fiesta.configuracion?.nombreLugar || 'sin salón'}
• Invitados: ${fiestaInvitados(fiesta)} (adultos: ${fiesta.configuracion?.invitadosAdultos || 0}, niños: ${(fiesta.configuracion?.invitadosNinos || 0) + (fiesta.configuracion?.invitadosAdolescentes || 0)})
• Estado: ${fiesta.estado || 'sin estado'} | Módulos: ${fiesta.modulosContratados ? (Object.entries(fiesta.modulosContratados).filter(([_, v]) => v === true).map(([k]) => k).join(', ') || 'ninguno') : 'ninguno'}
• Tareas totales: ${fiesta.tareas?.length || 0} | Pendientes: ${(fiesta.tareas || []).filter((t: any) => !t.completada).length}
TAREAS PENDIENTES (${(fiesta.tareas || []).filter((t: any) => !t.completada).length}):
${(fiesta.tareas || []).filter((t: any) => !t.completada).slice(0, 20).map((t: any) => `  • [${t.fechaLimite || 'sin fecha'}] ${t.texto}${t.asignadaA ? ` → ${t.asignadaA}` : ''}`).join('\n') || '  Sin tareas pendientes.'}
FINANZAS DE ESTA FIESTA:
${buildFiestaFinancialBlock(fiesta)}`.trim() : 'Sin fiesta específica en contexto.';

  // ── Bloque de cartera de fiestas ──────────────────────────────────────────
  const now = new Date();
  const cartBlock = (fiestas as any[]).length ? `
CARTERA DE FIESTAS (${(fiestas as any[]).length} total):
${(fiestas as any[]).slice(0, 20).map((f: any) => {
  const nombre = fiestaNombre(f) || f.id;
  const fecha  = f.configuracion?.fechaEvento;
  const dias   = fecha ? Math.ceil((new Date(fecha).getTime() - now.getTime()) / 86400000) : null;
  const pend   = (f.tareas || []).filter((t: any) => !t.completada).length;
  const diasStr = dias !== null ? (dias < 0 ? `hace ${Math.abs(dias)} días` : dias === 0 ? 'HOY' : `en ${dias} días`) : 'sin fecha';
  return `  • ${nombre} | ${diasStr} | ${f.estado || 'sin estado'} | ${pend} tareas pendientes`;
}).join('\n')}` : '';

  // ── Alertas KPI ───────────────────────────────────────────────────────────
  const alertsBlock = (kpi?.alerts || []).length
    ? `ALERTAS ACTIVAS:\n${(kpi?.alerts as any[]).slice(0,8).map((a: any) => `  • [${String(a.level||'aviso').toUpperCase()}] ${a.message}`).join('\n')}`
    : 'Sin alertas activas.';

  // ── Texto de contexto completo ─────────────────────────────────────────────
  const text = `
FECHA Y HORA: ${new Date().toLocaleString('es-UY', { timeZone: 'America/Montevideo' })}
AGENTE: ${displayName(agentType, nombre)}
RUTA: ${input.pathname || 'no especificada'}
${input.fiestaId ? `FIESTA ID: ${input.fiestaId}` : ''}

══════════ MANUAL BASE ══════════
${manual}

══════════ MEMORIA DEL AGENTE ══════════
${memory.summary || 'Sin memoria guardada.'}

APRENDIZAJES RECIENTES (últimos 15):
${memory.learnings.slice(0, 15).map(l => `• [${l.confidence}] ${l.title}: ${l.content.slice(0, 300)}`).join('\n') || 'Sin aprendizajes.'}

══════════ DIAGNÓSTICO AUTOMÁTICO ══════════
${diagnostics}

══════════ DATOS EN TIEMPO REAL ══════════
KPI RESUMEN:
• Próximo evento: ${kpi?.proximoEvento ? `${kpi.proximoEvento.nombre} el ${kpi.proximoEvento.fecha}` : 'Sin datos'}
• Presupuestos pendientes: ${kpi?.presupuestosPendientes ?? 0}
• Facturas por vencer: ${kpi?.facturasPorVencer ?? 0}
• Alertas totales: ${kpi?.alerts?.length ?? 0}
${alertsBlock}

${fiestaBlock}
${cartBlock}

PRESUPUESTOS (últimos 12):
${(presupuestos as any[]).slice(-12).map((p: any) => `• ${p.clienteNombre || 'Sin nombre'} | ${p.eventoTipo || 'sin tipo'} | ${p.estado} | Total: $${p.totalConDescuento ?? p.costoTotalEstimado ?? 0} | Seña: $${p.sena ?? 0} | Saldo: $${Math.max(0, (p.totalConDescuento ?? 0) - (p.sena ?? 0))}`).join('\n') || 'Sin presupuestos.'}

LEADS CRM (últimos 12):
${(leads as any[]).slice(-12).map((l: any) => `• ${l.name} | Etapa: ${(l as any).stageId || (l as any).currentStageId || 'sin etapa'} | Próx. acción: ${l.followUpDate || 'sin fecha'} | ${l.phone || ''}`).join('\n') || 'Sin leads.'}
`.trim();

  return { fiesta, fiestas, memory, diagnostics, kpi, presupuestos, leads, briefing, manual, text };
}

// ── Respuesta fallback inteligente ────────────────────────────────────────────
function buildFallback(agentType: AkAgentType, context: any, error?: unknown): string {
  const items = (context?.briefing?.items || []).slice(0, 6) as any[];
  const diag  = items.length
    ? items.map((it, i) => `${i + 1}. [${it.priority.toUpperCase()}] ${it.title}: ${it.detail}`).join('\n')
    : 'Sin pendientes detectados con los datos disponibles.';

  const nextStep: Record<AkAgentType, string> = {
    fiesta:          'Revisá tareas, pagos, contrato y personal de esta fiesta.',
    fiestas_general: 'Revisá las fiestas más próximas y las que tienen readiness bajo.',
    contable:        'Revisá pagos pendientes, cuotas vencidas y presupuestos recientes.',
    marketing:       'Creá contenido con los datos reales disponibles.',
    comercial:       'Revisá leads pendientes y presupuestos sin respuesta.',
    secretaria:      'Revisá agenda, llamadas y recordatorios del día.',
    central:         'Revisá las alertas generales y elegí el agente correcto.',
  };

  const errorNote = error instanceof Error ? `\n\nError técnico: ${error.message.slice(0, 140)}` : '';

  return [
    'Funcionando en modo respaldo. Sin datos inventados.',
    '',
    'Lo más importante ahora:',
    diag,
    '',
    `→ Próximo paso: ${nextStep[agentType]}`,
    errorNote,
  ].filter(Boolean).join('\n');
}

// ── Flujo principal del multiagente ──────────────────────────────────────────
export async function runMultiAgent(input: AkMultiAgentInput): Promise<AkMultiAgentOutput> {
  const agentType = detectAgent(input);
  const context   = await buildContext(input, agentType).catch(() => ({
    fiesta: null, briefing: null, fiestas: [], memory: null,
    text: 'No pude cargar el contexto completo.',
  }));
  const name = displayName(agentType, fiestaNombre(context.fiesta));

  try {
    // ── Flujo dedicado de marketing ─────────────────────────────────────────
    if (shouldUseMarketingFlow(agentType, input.message)) {
      const result = await chatWithMarketingAgent({
        request:           input.message,
        context:           context.text,
        platform:          detectPlatform(input.message),
        eventType:         fiestaTipo(context.fiesta),
        attachmentDataUri: input.imageDataUri,
      });

      await saveAgentLearning({
        agentType: 'marketing',
        module:    'marketing',
        title:     `Contenido generado: ${input.message.slice(0, 60)}`,
        content:   `Pedido: ${input.message}\nResultado: ${(result.content || '').slice(0, 1000)}`,
        tags:      ['marketing', 'contenido', detectPlatform(input.message) || 'general'].filter(Boolean) as string[],
        source:    'conversation',
        confidence:'medium',
      }).catch(() => null);

      return {
        success:   true,
        response:  result.content || buildFallback(agentType, context),
        agentType,
        agentName: name,
        action:    { type: 'none' },
      };
    }

    // ── Selección de modelo según intención ─────────────────────────────────
    const deepMode       = requiresProModel(agentType, input.message);
    const model          = getGeminiModelForAgent(agentType, { deep: deepMode });
    const generationConfig = getGeminiGenerationConfigForAgent(agentType, { deep: deepMode });

    // Historial ampliado: últimos 20 turnos para mejor contexto conversacional
    const historyText = (input.history || [])
      .slice(-20)
      .map(h => `${h.role === 'user' ? 'Alexander' : name}: ${h.content}`)
      .join('\n');

    const prompt = [
      `CONTEXTO REAL DE LA APP:`,
      context.text,
      historyText ? `\nCONVERSACIÓN ANTERIOR:\n${historyText}` : '',
      `\nMENSAJE DE ALEXANDER:\n${input.message}`,
    ].filter(Boolean).join('\n');

    const { text } = await generateWithGeminiFallback({
      model,
      system: buildSystemPrompt(agentType),
      prompt,
      config: generationConfig,
    });

    let finalResponse = '';
    let action: any = { type: 'none' };

    try {
      const rawText = text || '';
      // Intentar limpiar posibles bloques de código markdown si los incluyera
      const cleanJson = rawText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleanJson);
      finalResponse = parsed.response || '';
      action = parsed.action || { type: 'none' };
    } catch (e) {
      console.warn('[Multiagent Flow] Error al parsear JSON devuelto por Gemini. Usando texto sin estructurar.', e);
      finalResponse = text || buildFallback(agentType, context);
    }

    // Guardar aprendizaje automático si la respuesta fue útil
    if (finalResponse && finalResponse.length > 50) {
      saveAgentLearning({
        agentType,
        fiestaId:  input.fiestaId,
        scope:     input.fiestaId ? 'fiesta' : ['secretaria','central'].includes(agentType) ? 'global' : 'modulo',
        module:    input.fiestaId ? undefined : agentType,
        title:     `Respuesta: ${input.message.slice(0, 70)}`,
        content:   finalResponse.slice(0, 800),
        tags:      ['auto-learn', agentType, deepMode ? 'analisis-profundo' : 'consulta'],
        source:    'conversation',
        confidence:'low',
      }).catch(() => null); // No bloquea la respuesta
    }

    return {
      success:   true,
      response:  finalResponse || buildFallback(agentType, context),
      agentType,
      agentName: name,
      action,
    };
  } catch (error) {
    return {
      success:   true,
      response:  buildFallback(agentType, context, error),
      agentType,
      agentName: name,
      action:    { type: 'none' },
      error:     error instanceof Error ? error.message : 'IA no respondió',
    };
  }
}
