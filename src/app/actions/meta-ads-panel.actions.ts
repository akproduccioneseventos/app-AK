'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { getMetaAdsSummary, generateMetaCommercialAIRecommendations } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';
import { getEstadoDelTope, type CampanaConPresupuesto } from '@/lib/marketing/tope-de-gasto-publicidad';
import { getAccionesPublicidadEjecutadas } from '@/lib/marketing/meta-ads-acciones';
import { calcularClienteIdeal } from '@/lib/marketing/cliente-ideal';

export async function getMarketingAdsPanelData() {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) {
    throw new Error(permiso.error || 'No autorizado para ver publicidad y métricas.');
  }
  const summary = await getMetaAdsSummary(await loadMetaCommercialMetrics());
  const recommendations = generateMetaCommercialAIRecommendations(summary);

  const campanasConPresupuesto: CampanaConPresupuesto[] = summary.campaigns.map((c) => ({
    nombre: c.name,
    presupuestoDiarioUYU: c.dailyBudgetUYU ?? 0,
    activa: c.activa === true,
    verificado: typeof c.dailyBudgetUYU === 'number' && c.activa !== undefined,
  }));

  const [estadoDelTope, historialAcciones, analisisClienteIdeal] = await Promise.all([
    getEstadoDelTope(campanasConPresupuesto),
    getAccionesPublicidadEjecutadas(),
    calcularClienteIdeal(),
  ]);

  return {
    summary,
    recommendations,
    estadoDelTope,
    historialAcciones,
    analisisClienteIdeal,
  };
}
