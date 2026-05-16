import type { AnalyzeEventPlanInput, AnalyzeEventPlanOutput } from '@/ai/types/analyze-event-plan-types';

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function getConfig(plan: Record<string, unknown>) {
  return (plan.configuracion && typeof plan.configuracion === 'object' ? plan.configuracion : {}) as Record<string, unknown>;
}

export async function analyzeEventPlan(input: AnalyzeEventPlanInput): Promise<AnalyzeEventPlanOutput> {
  const plan = input.planData || {};
  const config = getConfig(plan);
  const invitados = Array.isArray(plan.invitados) ? plan.invitados : [];
  const tareas = Array.isArray(plan.tareas) ? plan.tareas : [];
  const personal = Array.isArray(plan.personalAsignado) ? plan.personalAsignado : [];
  const presupuestoId = typeof plan.presupuestoId === 'string' ? plan.presupuestoId : '';
  const clienteId = typeof plan.clienteId === 'string' ? plan.clienteId : '';
  const guestEstimate = readNumber(config.invitadosEstimados);
  const completedTasks = tareas.filter((task) => Boolean((task as { completed?: boolean }).completed)).length;

  const items: AnalyzeEventPlanOutput['items'] = [
    {
      module: 'Configuracion general',
      status: config.nombreEvento && config.fechaEvento && clienteId ? 'Completo' : 'Parcial',
      details: clienteId ? 'El evento tiene datos base y cliente asociado.' : 'Falta asociar cliente o completar datos base del evento.',
      suggestion: clienteId ? undefined : 'Asignar cliente, fecha, salon y nombre visible antes de mostrar el portal.',
    },
    {
      module: 'Invitados',
      status: invitados.length > 0 ? 'Parcial' : 'Faltante',
      details: `Hay ${invitados.length} invitados cargados sobre una referencia de ${guestEstimate || 'sin estimar'}.`,
      suggestion: invitados.length > 0 ? 'Revisar confirmados, pendientes y mesas.' : 'Cargar o importar la lista inicial de invitados.',
    },
    {
      module: 'Tareas',
      status: tareas.length && completedTasks === tareas.length ? 'Completo' : tareas.length ? 'Parcial' : 'Faltante',
      details: `${completedTasks}/${tareas.length} tareas completadas.`,
      suggestion: tareas.length ? 'Priorizar tareas vencidas o sin responsable.' : 'Crear checklist operativo de la fiesta.',
    },
    {
      module: 'Personal',
      status: personal.length > 0 ? 'Parcial' : 'Faltante',
      details: personal.length > 0 ? `Hay ${personal.length} personas asignadas.` : 'Todavia no hay personal asignado.',
      suggestion: 'Asignar responsable general, contable, marketing y roles operativos.',
    },
    {
      module: 'Documentos y presupuesto',
      status: presupuestoId ? 'Parcial' : 'Faltante',
      details: presupuestoId ? 'La fiesta tiene presupuesto vinculado.' : 'La fiesta no tiene presupuesto vinculado.',
      suggestion: presupuestoId ? 'Revisar pagos, contrato y documentos visibles.' : 'Vincular presupuesto antes de habilitar cobros o portal contable.',
    },
  ];

  const blockers = items.filter((item) => item.status === 'Faltante' || item.status === 'Parcial').length;
  return {
    summary:
      blockers === 0
        ? 'La fiesta tiene una base operativa completa. Conviene hacer una prueba final con portal, invitados y pantallas.'
        : `La fiesta tiene ${blockers} area(s) que conviene completar antes de mostrarla como experiencia final.`,
    items,
  };
}

export const analyzeEventPlanFlow = analyzeEventPlan;
