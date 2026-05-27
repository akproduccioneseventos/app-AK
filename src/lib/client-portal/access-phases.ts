import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type ClientPortalAccessPhase = 'financiera' | 'organizacion' | 'en_vivo';

const PHASE_LABELS: Record<ClientPortalAccessPhase, string> = {
  financiera: 'Acceso inicial',
  organizacion: 'Organizacion',
  en_vivo: 'Fiesta en vivo',
};

const PHASE_RANK: Record<ClientPortalAccessPhase, number> = {
  financiera: 1,
  organizacion: 2,
  en_vivo: 3,
};

function parseEventDate(date?: string): Date | null {
  if (!date) return null;
  const parsed = new Date(date.includes('T') ? date : `${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveClientPortalAccess(fiesta: Pick<FiestaEnPlanificacion, 'configuracion' | 'clientPortalSettings'>, now = new Date()) {
  const settings = fiesta.clientPortalSettings;
  const configuredPhase = settings?.accessPhase ?? 'financiera';
  const liveDays = Math.max(0, Number(settings?.liveAccessDaysBefore ?? 7) || 0);
  const eventDate = parseEventDate(fiesta.configuracion?.fechaEvento);
  const daysUntilEvent = eventDate
    ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const liveWindowOpen = daysUntilEvent !== null && daysUntilEvent <= liveDays;
  const phase: ClientPortalAccessPhase = configuredPhase === 'en_vivo' || (configuredPhase === 'organizacion' && liveWindowOpen)
    ? 'en_vivo'
    : configuredPhase;

  return {
    phase,
    label: PHASE_LABELS[phase],
    daysUntilEvent,
    liveAccessDaysBefore: liveDays,
    canSeeFinancial: true,
    canSeeOrganization: PHASE_RANK[phase] >= PHASE_RANK.organizacion,
    canSeeLive: PHASE_RANK[phase] >= PHASE_RANK.en_vivo,
    organizationLocked: PHASE_RANK[phase] < PHASE_RANK.organizacion,
    liveLocked: PHASE_RANK[phase] < PHASE_RANK.en_vivo,
  };
}
