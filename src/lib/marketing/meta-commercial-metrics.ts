import 'server-only';

import { readData } from '@/lib/data-service';
import { buildMetaCommercialMetrics, type MetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

export type { MetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';

export async function loadMetaCommercialMetrics(now = new Date()): Promise<MetaCommercialMetrics> {
  const since = new Date(now);
  since.setDate(since.getDate() - 30);
  const [leads, budgets] = await Promise.all([
    readData<CrmLead[]>('crm-leads.json', []),
    readData<Presupuesto[]>('presupuestos.json', []),
  ]);
  return buildMetaCommercialMetrics(leads, budgets, {
    since,
    revenueCurrency: process.env.AK_BUDGET_CURRENCY || 'UYU',
  });
}
