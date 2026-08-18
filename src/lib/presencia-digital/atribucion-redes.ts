import type { CrmLead, CrmStage } from '@/types/crm';
import type { Presupuesto } from '@/types/presupuesto';
import { idsDeEtapaGanadora } from '@/lib/crm/etapas-finales';

export type RedSocialOrigen =
  | 'Instagram'
  | 'Facebook'
  | 'TikTok'
  | 'YouTube'
  | 'WhatsApp'
  | 'Google / Web'
  | 'Otros / Orgánico';

export interface RedComercialResumen {
  red: RedSocialOrigen;
  consultasCount: number;
  contratosCount: number;
  montoTotalUYU: number;
  tasaConversionPct: number;
  mensajeSinConsultas?: string;
  hasData: boolean;
}

export interface ReporteAtribucionPorRed {
  periodoDias: number; // 30, 90, 365
  fechaDesdeIso: string;
  totalConsultas: number;
  totalContratos: number;
  totalMontoUYU: number;
  redes: RedComercialResumen[];
}

export const TODAS_LAS_REDES: RedSocialOrigen[] = [
  'Instagram',
  'Facebook',
  'TikTok',
  'YouTube',
  'WhatsApp',
  'Google / Web',
  'Otros / Orgánico',
];

/**
 * Normaliza el origen de atribución comercial a una de las redes reconocidas.
 */
export function normalizarOrigenRed(source?: string): RedSocialOrigen {
  if (!source) return 'Otros / Orgánico';
  const s = source.toLowerCase().trim();

  if (s.includes('instagram') || s.startsWith('ig') || s.includes('_ig')) return 'Instagram';
  if (s.includes('facebook') || s.startsWith('fb') || s.includes('_fb')) return 'Facebook';
  if (s.includes('tiktok') || s.startsWith('tik')) return 'TikTok';
  if (s.includes('youtube') || s.startsWith('yt')) return 'YouTube';
  if (s.includes('whatsapp') || s.startsWith('wa')) return 'WhatsApp';
  if (s.includes('google') || s.includes('seo') || s.includes('search')) return 'Google / Web';

  return 'Otros / Orgánico';
}

/**
 * Bloque 3: Calcula qué red le trae clientes de verdad (consultas, contratos cerrados y plata real).
 *
 * Reglas:
 * 1. Cruza prospectos con presupuestos reales aceptados/facturados.
 * 2. Cero números inventados: si no vino nadie, muestra 0 y el cartel explícito.
 * 3. Filtrado por período exacto (30, 90, 365 días).
 */
export function calcularAtribucionComercialPorRed(params: {
  leads: CrmLead[];
  budgets: Presupuesto[];
  stages?: CrmStage[];
  periodoDias?: number; // 30, 90, 365 (default: 90)
  ahora?: Date;
}): ReporteAtribucionPorRed {
  const { leads, budgets, stages = [], periodoDias = 90, ahora = new Date() } = params;

  const fechaLimite = new Date(ahora.getTime() - periodoDias * 24 * 60 * 60 * 1000);
  const fechaLimiteIso = fechaLimite.toISOString();

  const winningStages = idsDeEtapaGanadora(stages);

  // Mapear presupuestos por ID
  const budgetsMap = new Map<string, Presupuesto>(budgets.map((b) => [b.id, b]));

  // Filtrar prospectos dentro del período
  const leadsEnPeriodo = leads.filter((l) => {
    if (!l.createdAt) return false;
    return l.createdAt >= fechaLimiteIso;
  });

  // Agrupar contadores por red
  const acumulador = new Map<
    RedSocialOrigen,
    { consultas: number; contratos: number; monto: number }
  >();

  for (const red of TODAS_LAS_REDES) {
    acumulador.set(red, { consultas: 0, contratos: 0, monto: 0 });
  }

  for (const lead of leadsEnPeriodo) {
    const rawSource = lead.acquisition?.source || (lead as any).source || (lead as any).canal;
    const red = normalizarOrigenRed(rawSource);
    const item = acumulador.get(red)!;

    item.consultas++;

    // Verificar si el prospecto contrató
    let esContratado = false;
    let montoPresupuesto = 0;

    const budget = lead.presupuestoId ? budgetsMap.get(lead.presupuestoId) : undefined;

    if (budget) {
      const estado = budget.estado || '';
      const tienePagos = (budget.pagosCliente && budget.pagosCliente.length > 0) || Boolean((budget as any).pagos?.length);
      if (
        estado === 'Aceptado' ||
        estado === 'Facturado' ||
        budget.fechaFirmaContrato ||
        tienePagos
      ) {
        esContratado = true;
        montoPresupuesto = Number((budget as any).costoFinal || budget.totalFinal || budget.totalConDescuento || budget.costoTotalEstimado || (budget as any).total || 0);
      }
    }

    if (!esContratado) {
      const stageId = lead.currentStageId || '';
      if (
        winningStages.has(stageId) ||
        stageId === 'ganado' ||
        stageId === 's4' ||
        lead.presupuestoEstado === 'Aceptado' ||
        lead.presupuestoEstado === 'Facturado' ||
        Boolean(lead.invoiceId)
      ) {
        esContratado = true;
        if (budget) {
          montoPresupuesto = Number((budget as any).costoFinal || budget.totalFinal || budget.totalConDescuento || budget.costoTotalEstimado || (budget as any).total || 0);
        }
      }
    }

    if (esContratado) {
      item.contratos++;
      item.monto += Math.max(0, montoPresupuesto);
    }
  }

  let totalConsultas = 0;
  let totalContratos = 0;
  let totalMontoUYU = 0;

  const redesResultado: RedComercialResumen[] = TODAS_LAS_REDES.map((red) => {
    const stats = acumulador.get(red)!;
    totalConsultas += stats.consultas;
    totalContratos += stats.contratos;
    totalMontoUYU += stats.monto;

    const conversion = stats.consultas > 0 ? (stats.contratos / stats.consultas) * 100 : 0;
    const hasData = stats.consultas > 0;

    return {
      red,
      consultasCount: stats.consultas,
      contratosCount: stats.contratos,
      montoTotalUYU: stats.monto,
      tasaConversionPct: Math.round(conversion * 10) / 10,
      hasData,
      mensajeSinConsultas:
        stats.consultas === 0
          ? `De ${red} no vino ninguna consulta en estos ${periodoDias} días.`
          : undefined,
    };
  });

  return {
    periodoDias,
    fechaDesdeIso: fechaLimiteIso,
    totalConsultas,
    totalContratos,
    totalMontoUYU,
    redes: redesResultado,
  };
}
