'use server';

import { getCrmLeads, getCrmStages } from '@/app/actions/crm';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { buildCommercialLifecycleDashboard } from '@/lib/commercial-lifecycle/commercial-lifecycle';
import { requireAppSession } from '@/lib/auth/require-session';

export async function getCommercialLifecycleDashboard() {
  await requireAppSession();
  const [leads, stages, presupuestos, fiestas] = await Promise.all([
    getCrmLeads(),
    getCrmStages(),
    getPresupuestos(true),
    getFiestas(true),
  ]);

  return buildCommercialLifecycleDashboard({
    leads,
    stages,
    presupuestos,
    fiestas,
  });
}
