import type { CrmLead } from '@/types/crm';

const SIMULATOR_BUDGET_SOURCES = new Set([
  'simulator',
  'simulator_common',
  'simulator_assistant',
]);

export type CrmLeadSourceBadge = {
  text: string;
  className: string;
};

export function isSimulatorCrmLead(lead: CrmLead): boolean {
  return SIMULATOR_BUDGET_SOURCES.has(lead.budgetSource || '')
    || Boolean(lead.acquisition?.simulatorMode);
}

export function isDirectCrmLead(lead: CrmLead): boolean {
  if (isSimulatorCrmLead(lead)) return false;

  const source = lead.acquisition?.source;
  return lead.budgetSource === 'manual'
    || (!lead.budgetSource && Boolean(lead.presupuestoId))
    || source === 'whatsapp'
    || source === 'direct'
    || (!lead.budgetSource && !source);
}

export function getCrmLeadSourceBadge(lead: CrmLead): CrmLeadSourceBadge {
  if (isSimulatorCrmLead(lead)) {
    return {
      text: 'Simulador',
      className: 'border border-amber-300 bg-amber-100 font-bold text-amber-900',
    };
  }

  if (lead.budgetSource === 'portal_led' || lead.acquisition?.source === 'portal_led') {
    return {
      text: 'Portal LED',
      className: 'border border-fuchsia-300 bg-fuchsia-100 font-bold text-fuchsia-800',
    };
  }

  if (lead.budgetSource === 'manual' || (!lead.budgetSource && lead.presupuestoId)) {
    return {
      text: 'Presupuesto manual',
      className: 'border border-slate-300 bg-slate-100 font-bold text-slate-700',
    };
  }

  if (lead.acquisition?.source === 'whatsapp') {
    return {
      text: 'Consulta WhatsApp',
      className: 'border border-emerald-300 bg-emerald-100 font-bold text-emerald-800',
    };
  }

  return {
    text: 'Consulta',
    className: 'border border-sky-300 bg-sky-100 font-bold text-sky-800',
  };
}
