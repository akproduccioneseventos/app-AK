import type { FiestaEnPlanificacion } from '@/types/fiesta';

export interface ProgresoItem {
  label: string;
  completado: boolean;
}

export interface ProgresoResult {
  porcentaje: number;
  items: ProgresoItem[];
}

/**
 * Weights per progress item (must sum to 100):
 * [0] Evento creado       - 10%
 * [1] Seña pagada         - 15%
 * [2] Menú definido       - 15%
 * [3] Lista invitados 50% - 15%
 * [4] Pagos al día        - 15%
 * [5] Decoración aprobada - 10%
 * [6] Cronograma cargado  - 10%
 * [7] Pagos 100%          - 10%
 */
const PROGRESS_WEIGHTS = [10, 15, 15, 15, 15, 10, 10, 10];

export function calcularProgresoEvento(fiesta: FiestaEnPlanificacion): ProgresoResult {
  const hoy = new Date();
  const cuotas = fiesta.planDePagos?.cuotas ?? [];
  const allPaid = cuotas.length > 0 && cuotas.every(c => c.estado === 'pagado');
  const senaPagada = cuotas.some(c => c.descripcion?.toLowerCase().includes('seña') && c.estado === 'pagado');
  const menuDefinido = !!(fiesta.menuMesa?.entrada && fiesta.menuMesa?.platoPrincipal);
  const invitadosConfirmados = (fiesta.invitados ?? []).filter(i => i.rsvp === 'Confirmado').length;
  const invitadosEstimados = Number(fiesta.configuracion?.invitadosEstimados) || 0;
  const listaInvitadosOk = invitadosEstimados > 0 && invitadosConfirmados >= invitadosEstimados * 0.5;
  const pagosAlDia = cuotas.length === 0 || cuotas.filter(c => {
    if (c.estado === 'pagado') return false;
    if (!c.fechaVencimiento) return false;
    return new Date(c.fechaVencimiento) < hoy;
  }).length === 0;
  const decoracionAprobada = !!(fiesta.decoracion?.moodboardItems?.some(i => i.likedByClient));
  const cronogramaCargado = !!(fiesta.timeline && fiesta.timeline.length > 0);

  const items: ProgresoItem[] = [
    { label: 'Evento creado', completado: true },
    { label: 'Seña pagada', completado: senaPagada },
    { label: 'Menú definido', completado: menuDefinido },
    { label: 'Lista de invitados (+50%)', completado: listaInvitadosOk },
    { label: 'Pagos al día', completado: pagosAlDia },
    { label: 'Decoración aprobada', completado: decoracionAprobada },
    { label: 'Cronograma cargado', completado: cronogramaCargado },
    { label: 'Pagos completados 100%', completado: allPaid },
  ];

  const porcentaje = items.reduce((sum, item, i) => sum + (item.completado ? PROGRESS_WEIGHTS[i] : 0), 0);
  return { porcentaje, items };
}
