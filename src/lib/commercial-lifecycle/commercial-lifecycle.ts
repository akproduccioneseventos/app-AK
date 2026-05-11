import type { CrmLead, CrmStage } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type CommercialLifecycleStatus = 'listo' | 'falta_cerrar' | 'pendiente';
export type CommercialLifecycleStepId = 'crm' | 'presupuesto' | 'contrato' | 'fiesta' | 'cliente';

export type CommercialLifecycleStep = {
  id: CommercialLifecycleStepId;
  label: string;
  ready: boolean;
  href?: string;
};

export type CommercialLifecycleRow = {
  id: string;
  customerName: string;
  phone?: string;
  partyType?: string;
  eventDate?: string;
  venueName?: string;
  stageName: string;
  score: number;
  status: CommercialLifecycleStatus;
  presupuestoId?: string;
  presupuestoEstado?: string;
  presupuestoTotal?: number;
  fiestaId?: string;
  fiestaEstado?: string;
  contratoEstado: string;
  mainActionLabel: string;
  mainActionHref: string;
  missing: string[];
  steps: CommercialLifecycleStep[];
};

export type CommercialLifecycleDashboard = {
  globalScore: number;
  status: CommercialLifecycleStatus;
  message: string;
  stats: {
    total: number;
    ready: number;
    missingBudget: number;
    missingContract: number;
    missingFiesta: number;
    orphanBudgets: number;
    acceptedWithoutFiesta: number;
  };
  rows: CommercialLifecycleRow[];
  nextWork: string[];
};

type BuildInput = {
  leads: CrmLead[];
  stages: CrmStage[];
  presupuestos: Presupuesto[];
  fiestas: FiestaEnPlanificacion[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOr(value: unknown, fallback: string): string {
  return hasText(value) ? String(value).trim() : fallback;
}

function getStageName(stages: CrmStage[], stageId?: string): string {
  if (!stageId) return 'Sin etapa';
  return stages.find((stage) => stage.id === stageId)?.name ?? 'Sin etapa';
}

function getBudgetTotal(presupuesto?: Presupuesto): number | undefined {
  if (!presupuesto) return undefined;
  return presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado;
}

function isBudgetAccepted(presupuesto?: Presupuesto): boolean {
  return presupuesto?.estado === 'Aceptado' || presupuesto?.estado === 'Facturado';
}

function isContractReady(lead?: CrmLead, presupuesto?: Presupuesto, fiesta?: FiestaEnPlanificacion): boolean {
  const contratoGenerado = asRecord(fiesta?.contratoGenerado);
  const contratoFirmaInfo = asRecord(fiesta?.contratoFirmaInfo);
  return Boolean(
    lead?.contractGeneratedType
    || hasText(contratoGenerado.tipo)
    || contratoFirmaInfo.isSigned === true
    || hasText(presupuesto?.fechaFirmaContrato)
  );
}

function getContractState(lead?: CrmLead, presupuesto?: Presupuesto, fiesta?: FiestaEnPlanificacion): string {
  if (!isContractReady(lead, presupuesto, fiesta)) return 'Falta contrato/firma';
  const contratoFirmaInfo = asRecord(fiesta?.contratoFirmaInfo);
  if (contratoFirmaInfo.isSigned === true || hasText(presupuesto?.fechaFirmaContrato)) return 'Firmado';
  if (lead?.contractGeneratedType || hasText(asRecord(fiesta?.contratoGenerado).tipo)) return 'Generado';
  return 'Cargado';
}

function statusFromScore(score: number): CommercialLifecycleStatus {
  if (score >= 92) return 'listo';
  if (score >= 55) return 'falta_cerrar';
  return 'pendiente';
}

function buildMainAction(input: { lead?: CrmLead; presupuesto?: Presupuesto; fiesta?: FiestaEnPlanificacion; contractReady: boolean }) {
  const { lead, presupuesto, fiesta, contractReady } = input;
  if (!lead) return { label: 'Vincular a CRM', href: '/contabilidad/crm' };
  if (!presupuesto) return { label: 'Crear presupuesto', href: `/presupuestos/nuevo?leadId=${encodeURIComponent(lead.id)}` };
  if (!contractReady) return { label: 'Preparar contrato', href: `/presupuestos/${encodeURIComponent(presupuesto.id)}/recibo-contrato` };
  if (!fiesta) return { label: 'Crear/activar fiesta', href: '/contabilidad/crm' };
  return { label: 'Abrir fiesta', href: `/fiestas/nueva?fiestaId=${encodeURIComponent(fiesta.id)}` };
}

function buildRow(input: { lead?: CrmLead; presupuesto?: Presupuesto; fiesta?: FiestaEnPlanificacion; stages: CrmStage[]; fallbackId: string }): CommercialLifecycleRow {
  const { lead, presupuesto, fiesta, stages, fallbackId } = input;
  const contractReady = isContractReady(lead, presupuesto, fiesta);
  const hasLead = Boolean(lead);
  const hasBudget = Boolean(presupuesto);
  const hasAcceptedBudget = isBudgetAccepted(presupuesto);
  const hasFiesta = Boolean(fiesta);
  const hasCliente = hasText(fiesta?.configuracion?.clienteId) || hasText(asRecord(fiesta?.configuracion).clienteNombre);

  const steps: CommercialLifecycleStep[] = [
    { id: 'crm', label: 'CRM', ready: hasLead, href: '/contabilidad/crm' },
    { id: 'presupuesto', label: 'Presupuesto', ready: hasBudget, href: presupuesto ? `/presupuestos/${encodeURIComponent(presupuesto.id)}/ver` : '/presupuestos/nuevo' },
    { id: 'contrato', label: 'Contrato', ready: contractReady, href: presupuesto ? `/presupuestos/${encodeURIComponent(presupuesto.id)}/recibo-contrato` : undefined },
    { id: 'fiesta', label: 'Fiesta', ready: hasFiesta, href: fiesta ? `/fiestas/nueva?fiestaId=${encodeURIComponent(fiesta.id)}` : '/eventos' },
    { id: 'cliente', label: 'Cliente', ready: hasCliente, href: '/customers' },
  ];

  const score = Math.round((steps.filter((step) => step.ready).length / steps.length) * 100);
  const missing = [
    !hasLead ? 'Falta prospecto en CRM.' : '',
    !hasBudget ? 'Falta presupuesto vinculado.' : '',
    hasBudget && !hasAcceptedBudget ? 'El presupuesto no está aceptado/facturado todavía.' : '',
    !contractReady ? 'Falta contrato generado o firma registrada.' : '',
    !hasFiesta ? 'Falta fiesta creada desde la contratación.' : '',
    hasFiesta && !hasCliente ? 'La fiesta no tiene cliente vinculado claramente.' : '',
  ].filter(Boolean);
  const action = buildMainAction({ lead, presupuesto, fiesta, contractReady });

  return {
    id: lead?.id ?? presupuesto?.id ?? fiesta?.id ?? fallbackId,
    customerName: textOr(lead?.name, textOr(presupuesto?.clienteNombre, textOr(fiesta?.configuracion?.clienteNombre, 'Cliente sin nombre'))),
    phone: lead?.phone ?? presupuesto?.clienteContacto,
    partyType: lead?.partyType ?? presupuesto?.eventoTipo ?? fiesta?.configuracion?.tipoCelebracion,
    eventDate: presupuesto?.eventoFecha ?? fiesta?.configuracion?.fechaEvento,
    venueName: lead?.venueName ?? presupuesto?.salonFiestas ?? fiesta?.configuracion?.nombreLugar,
    stageName: lead ? getStageName(stages, lead.currentStageId) : 'Sin CRM',
    score,
    status: statusFromScore(score),
    presupuestoId: presupuesto?.id,
    presupuestoEstado: presupuesto?.estado,
    presupuestoTotal: getBudgetTotal(presupuesto),
    fiestaId: fiesta?.id,
    fiestaEstado: fiesta?.estado,
    contratoEstado: getContractState(lead, presupuesto, fiesta),
    mainActionLabel: action.label,
    mainActionHref: action.href,
    missing,
    steps,
  };
}

function rowDateValue(row: CommercialLifecycleRow): number {
  const date = new Date(row.eventDate || '');
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function buildCommercialLifecycleDashboard(input: BuildInput): CommercialLifecycleDashboard {
  const budgetById = new Map(input.presupuestos.map((presupuesto) => [presupuesto.id, presupuesto]));
  const leadByBudget = new Map(input.leads.filter((lead) => lead.presupuestoId).map((lead) => [lead.presupuestoId as string, lead]));
  const fiestaByBudget = new Map(input.fiestas.filter((fiesta) => fiesta.presupuestoId).map((fiesta) => [fiesta.presupuestoId as string, fiesta]));
  const seenBudgetIds = new Set<string>();

  const rows: CommercialLifecycleRow[] = input.leads.map((lead) => {
    const presupuesto = lead.presupuestoId ? budgetById.get(lead.presupuestoId) : undefined;
    if (presupuesto) seenBudgetIds.add(presupuesto.id);
    const fiesta = presupuesto ? fiestaByBudget.get(presupuesto.id) : undefined;
    return buildRow({ lead, presupuesto, fiesta, stages: input.stages, fallbackId: lead.id });
  });

  input.presupuestos.forEach((presupuesto) => {
    if (seenBudgetIds.has(presupuesto.id)) return;
    const lead = leadByBudget.get(presupuesto.id);
    const fiesta = fiestaByBudget.get(presupuesto.id);
    rows.push(buildRow({ lead, presupuesto, fiesta, stages: input.stages, fallbackId: presupuesto.id }));
    seenBudgetIds.add(presupuesto.id);
  });

  input.fiestas.forEach((fiesta) => {
    if (fiesta.presupuestoId && seenBudgetIds.has(fiesta.presupuestoId)) return;
    rows.push(buildRow({ fiesta, stages: input.stages, fallbackId: fiesta.id }));
  });

  const sortedRows = rows.sort((a, b) => rowDateValue(b) - rowDateValue(a));
  const total = sortedRows.length;
  const ready = sortedRows.filter((row) => row.status === 'listo').length;
  const missingBudget = sortedRows.filter((row) => !row.presupuestoId).length;
  const missingContract = sortedRows.filter((row) => row.contratoEstado === 'Falta contrato/firma').length;
  const missingFiesta = sortedRows.filter((row) => !row.fiestaId).length;
  const orphanBudgets = sortedRows.filter((row) => row.stageName === 'Sin CRM' && row.presupuestoId).length;
  const acceptedWithoutFiesta = sortedRows.filter((row) => (row.presupuestoEstado === 'Aceptado' || row.presupuestoEstado === 'Facturado') && !row.fiestaId).length;
  const globalScore = total === 0 ? 0 : Math.round(sortedRows.reduce((sum, row) => sum + row.score, 0) / total);

  return {
    globalScore,
    status: statusFromScore(globalScore),
    message: globalScore >= 92
      ? 'El flujo comercial está cerrado: CRM, presupuesto, contrato, cliente y fiesta están alineados.'
      : globalScore >= 55
        ? 'El flujo comercial está encaminado, pero todavía hay clientes cortados entre módulos.'
        : 'Faltan conexiones base entre CRM, presupuesto, contrato y fiesta.',
    stats: { total, ready, missingBudget, missingContract, missingFiesta, orphanBudgets, acceptedWithoutFiesta },
    rows: sortedRows,
    nextWork: [
      missingBudget > 0 ? `Crear o vincular presupuesto en ${missingBudget} prospecto(s).` : '',
      missingContract > 0 ? `Generar o registrar firma de contrato en ${missingContract} caso(s).` : '',
      missingFiesta > 0 ? `Crear/activar fiesta en ${missingFiesta} caso(s).` : '',
      orphanBudgets > 0 ? `Revisar ${orphanBudgets} presupuesto(s) sin CRM claro.` : '',
      acceptedWithoutFiesta > 0 ? `Atender ${acceptedWithoutFiesta} presupuesto(s) aceptado(s) sin fiesta activa.` : '',
    ].filter(Boolean),
  };
}
