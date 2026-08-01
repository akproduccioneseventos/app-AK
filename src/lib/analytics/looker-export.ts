import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

export interface LookerExportRow {
  fecha: string;
  cotizaciones: number;
  leads_whatsapp: number;
  contratos_firmados: number;
}

function dateKey(value?: string): string | null {
  if (!value) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  if (match) return match[1];
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function isSimulatorBudget(budget: Presupuesto): boolean {
  return Boolean(budget.source && /simulator|simulador/.test(budget.source));
}

export function buildLookerExportRows(
  budgets: Presupuesto[],
  leads: CrmLead[],
): LookerExportRow[] {
  const rows = new Map<string, LookerExportRow>();
  const getRow = (date: string) => {
    const existing = rows.get(date);
    if (existing) return existing;
    const created = { fecha: date, cotizaciones: 0, leads_whatsapp: 0, contratos_firmados: 0 };
    rows.set(date, created);
    return created;
  };

  for (const budget of budgets) {
    if (budget.archived) continue;
    const createdDate = dateKey(budget.timestamp);
    if (createdDate && isSimulatorBudget(budget)) getRow(createdDate).cotizaciones += 1;

    const signedDate = dateKey(budget.fechaFirmaContrato || budget.timestamp);
    if (signedDate && ['Aceptado', 'Facturado'].includes(budget.estado)) {
      getRow(signedDate).contratos_firmados += 1;
    }
  }

  for (const lead of leads) {
    const createdDate = dateKey(lead.createdAt);
    if (createdDate && lead.acquisition?.source === 'whatsapp') {
      getRow(createdDate).leads_whatsapp += 1;
    }
  }

  return [...rows.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
