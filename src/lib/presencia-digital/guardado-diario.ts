import { readData, writeData } from '@/lib/data-service';
import { getMetaAdsSummary } from '@/lib/marketing/meta-ads';
import { buildMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics-core';
import { buildDailySnapshots, HISTORY_FILE } from '@/lib/presencia-digital/metricas-historicas';
import type { DailySocialMetricSnapshot } from '@/types/presencia-digital';
import type { SocialPost } from '@/types/social-media';
import type { SocialConnection } from '@/types/settings';
import type { CrmLead } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';

const CONNECTIONS_FILE = 'social-connections.json';
const POSTS_FILE = 'social-posts.json';
const LEADS_FILE = 'crm-leads.json';
const BUDGETS_FILE = 'presupuestos.json';

/**
 * Guarda los numeros de las redes del dia, si todavia no se guardaron.
 *
 * Por que esta aparte: las plataformas **no entregan los numeros viejos hacia
 * atras**, asi que el historial hay que construirlo dia por dia. Antes esto sólo
 * corria cuando alguien abria la pantalla: una semana sin entrar era una semana
 * de historia perdida para siempre. Ahora tambien lo llama la tarea diaria.
 *
 * No pide sesion porque la tarea programada no tiene una. La protege la clave de
 * las tareas, igual que los recordatorios de pago.
 */
export async function guardarMetricasDelDia(): Promise<{ guardado: boolean; fecha: string }> {
  const hoy = new Date().toISOString().split('T')[0];

  const [connections, posts, history, leads, budgets] = await Promise.all([
    readData<SocialConnection[]>(CONNECTIONS_FILE, []),
    readData<SocialPost[]>(POSTS_FILE, []),
    readData<DailySocialMetricSnapshot[]>(HISTORY_FILE, []),
    readData<CrmLead[]>(LEADS_FILE, []),
    readData<Presupuesto[]>(BUDGETS_FILE, []),
  ]);

  if (history.some((h) => h.date === hoy)) return { guardado: false, fecha: hoy };

  const desde30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const adsSummary = await getMetaAdsSummary(
    buildMetaCommercialMetrics(leads, budgets, { since: desde30Dias })
  ).catch(() => null);

  const nuevos = buildDailySnapshots({
    dateIso: hoy,
    connections,
    posts,
    adsSummary,
    leadsCountToday: leads.filter((l) => l.createdAt?.startsWith(hoy)).length,
    contractsCountToday: budgets.filter((b) => (b.fechaFirmaContrato || b.timestamp)?.startsWith(hoy)).length,
    revenueToday: 0,
    existingSnapshots: history,
  });

  await writeData(HISTORY_FILE, [...history, ...nuevos]);
  return { guardado: true, fecha: hoy };
}

