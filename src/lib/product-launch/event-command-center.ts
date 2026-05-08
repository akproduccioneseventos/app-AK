import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { buildExperienceCenter, type ExperienceNextStep } from '@/lib/experience-center/experience-center';
import { buildWorldClassExperience, type WorldExperienceCheck } from '@/lib/world-class-experience/world-class-experience';

export type CommandStatus = 'listo' | 'revisar' | 'pendiente';

export type CommandRoute = {
  label: string;
  href: string;
  goal: string;
  area: 'venta' | 'cliente' | 'invitados' | 'operacion' | 'vivo' | 'post' | 'ajustes';
  priority: 'alta' | 'media' | 'baja';
};

export type CommandSignal = {
  label: string;
  value: string;
  detail: string;
  status: CommandStatus;
};

export type CommandAgentBrief = {
  agent: string;
  mission: string;
  nextAction: string;
  href: string;
  status: CommandStatus;
};

export type EventCommandCenter = {
  eventName: string;
  eventDateLabel: string;
  eventPlaceLabel: string;
  globalScore: number;
  status: CommandStatus;
  message: string;
  signals: CommandSignal[];
  routes: CommandRoute[];
  agentBriefs: CommandAgentBrief[];
  urgent: Array<{
    label: string;
    detail: string;
    href: string;
    source: string;
  }>;
};

function statusFromScore(score: number): CommandStatus {
  if (score >= 86) return 'listo';
  if (score >= 58) return 'revisar';
  return 'pendiente';
}

function withFiestaId(href: string, fiestaId?: string | null): string {
  if (!fiestaId) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function eventHref(fiestaId: string, slug: string): string {
  return `/fiestas/${encodeURIComponent(fiestaId)}/${slug}`;
}

function topExperienceSteps(steps: ExperienceNextStep[], limit: number) {
  return steps.slice(0, limit).map((step) => ({
    label: step.label,
    detail: step.detail,
    href: step.href ?? '#',
    source: step.area,
  }));
}

function topWorldFixes(fixes: WorldExperienceCheck[], limit: number) {
  return fixes.slice(0, limit).map((fix) => ({
    label: fix.label,
    detail: fix.detail,
    href: fix.href ?? '#',
    source: 'Cierre mundial',
  }));
}

export function buildEventCommandCenter(fiesta: FiestaEnPlanificacion): EventCommandCenter {
  const fiestaId = fiesta.id;
  const experience = buildExperienceCenter(fiesta);
  const world = buildWorldClassExperience(fiesta);
  const globalScore = Math.round((experience.overallScore * 0.58) + (world.overallScore * 0.42));
  const status = statusFromScore(globalScore);
  const urgent = [
    ...topWorldFixes(world.urgentFixes, 6),
    ...topExperienceSteps(experience.nextSteps, 6),
  ].slice(0, 10);

  const message = status === 'listo'
    ? 'La fiesta esta lista para vender, mostrar y operar con una experiencia completa.'
    : status === 'revisar'
      ? 'La fiesta esta encaminada, pero todavia tiene pendientes concretos antes de mostrarla como 100%.'
      : 'La fiesta necesita cerrar piezas base antes de venderse o ejecutarse como experiencia AK.';

  return {
    eventName: experience.eventName,
    eventDateLabel: experience.eventDateLabel,
    eventPlaceLabel: experience.eventPlaceLabel,
    globalScore,
    status,
    message,
    signals: [
      {
        label: 'Centro de experiencia',
        value: `${experience.overallScore}%`,
        detail: 'Cliente, invitados, social, LED, agenda, operacion, visuales y post-fiesta.',
        status: experience.status,
      },
      {
        label: 'Cierre mundial',
        value: `${world.overallScore}%`,
        detail: 'Demo, comunicaciones, vivo, post-fiesta y plan B.',
        status: world.status,
      },
      {
        label: 'Invitados',
        value: `${experience.stats.guestsConfirmed}/${experience.stats.guestsTotal}`,
        detail: `${experience.stats.guestsPending} pendientes por confirmar.`,
        status: experience.stats.guestsTotal === 0 ? 'pendiente' : experience.stats.guestsPending === 0 ? 'listo' : 'revisar',
      },
      {
        label: 'Visuales',
        value: `${experience.stats.visualAssets}`,
        detail: 'Fotos, portada, galeria, decoracion y recursos para venta o recuerdos.',
        status: experience.stats.visualAssets >= 6 ? 'listo' : experience.stats.visualAssets >= 2 ? 'revisar' : 'pendiente',
      },
      {
        label: 'Comunicacion',
        value: `${world.stats.communicationsReady}/6`,
        detail: 'Google Calendar, Gmail, WhatsApp y portal.',
        status: world.stats.communicationsReady >= 5 ? 'listo' : world.stats.communicationsReady >= 3 ? 'revisar' : 'pendiente',
      },
      {
        label: 'Plan B',
        value: `${world.stats.planBReady}/5`,
        detail: 'Clima, llegada, accesibilidad, pantalla/sonido, personal y carga.',
        status: world.stats.planBReady >= 4 ? 'listo' : world.stats.planBReady >= 2 ? 'revisar' : 'pendiente',
      },
    ],
    routes: [
      { label: 'Centro de experiencia', href: eventHref(fiestaId, 'centro-experiencia'), goal: 'Ver score general y pendientes por area.', area: 'venta', priority: 'alta' },
      { label: 'Cierre mundial', href: eventHref(fiestaId, 'cierre-mundial'), goal: 'Revisar demo, comunicaciones, vivo y plan B.', area: 'venta', priority: 'alta' },
      { label: 'Portal cliente', href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId), goal: 'Ver lo que usara el cliente desde el celular.', area: 'cliente', priority: 'alta' },
      { label: 'Pagina e invitacion', href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId), goal: 'Preparar invitacion, fotos, QR y datos publicos.', area: 'invitados', priority: 'alta' },
      { label: 'Invitados y mesas', href: withFiestaId('/fiestas/nueva/invitados', fiestaId), goal: 'Controlar RSVP, pendientes y cambios.', area: 'invitados', priority: 'alta' },
      { label: 'Muro social', href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId), goal: 'Preparar red social privada y moderacion.', area: 'vivo', priority: 'alta' },
      { label: 'Pantalla en vivo', href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId), goal: 'Probar LED, contenido y modo pantalla grande.', area: 'vivo', priority: 'alta' },
      { label: 'Personal', href: withFiestaId('/fiestas/nueva/personal', fiestaId), goal: 'Confirmar responsables y roles.', area: 'operacion', priority: 'alta' },
      { label: 'Carga operativa', href: withFiestaId('/fiestas/nueva/carga-operativa', fiestaId), goal: 'Cerrar equipos, materiales y plan de llegada.', area: 'operacion', priority: 'media' },
      { label: 'Fotografia y post-fiesta', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId), goal: 'Cerrar recuerdos, feedback y material reutilizable.', area: 'post', priority: 'media' },
      { label: 'Google Workspace', href: withFiestaId('/settings/google-workspace', fiestaId), goal: 'Revisar Gmail, Calendar y recordatorios utiles.', area: 'ajustes', priority: 'media' },
      { label: 'Biblioteca visual AK', href: '/settings/biblioteca-visual-ak', goal: 'Ordenar fotos por uso: venta, cliente, LED, invitacion y post.', area: 'ajustes', priority: 'media' },
    ],
    agentBriefs: [
      {
        agent: 'Secretaria AK',
        mission: 'Que cliente, reuniones, invitados y recordatorios esten claros.',
        nextAction: urgent.find((item) => item.source.includes('Agenda') || item.label.toLowerCase().includes('reunion'))?.label ?? 'Revisar agenda, portal cliente y comunicaciones.',
        href: withFiestaId('/fiestas/nueva/reuniones', fiestaId),
        status: world.stats.communicationsReady >= 4 ? 'listo' : 'revisar',
      },
      {
        agent: 'Coordinador general',
        mission: 'Que personal, carga, cronograma y Plan B esten cerrados.',
        nextAction: urgent.find((item) => item.source.includes('operacion') || item.label.toLowerCase().includes('carga'))?.label ?? 'Revisar personal, carga operativa y plan B.',
        href: withFiestaId('/fiestas/nueva/personal', fiestaId),
        status: world.stats.planBReady >= 4 ? 'listo' : 'revisar',
      },
      {
        agent: 'Contable',
        mission: 'Que pagos, documentos y presupuesto no queden sueltos.',
        nextAction: 'Revisar plan de pagos, documentos y comprobantes antes del evento.',
        href: withFiestaId('/fiestas/nueva/plan-pagos', fiestaId),
        status: experience.stats.clientScore >= 75 ? 'listo' : 'revisar',
      },
      {
        agent: 'Marketing',
        mission: 'Que la fiesta genere material de venta y post-fiesta.',
        nextAction: experience.stats.visualAssets >= 6 ? 'Seleccionar mejores piezas para portfolio y redes.' : 'Cargar fotos reales y portada del evento.',
        href: withFiestaId('/fiestas/nueva/fotografia', fiestaId),
        status: experience.stats.visualAssets >= 6 ? 'listo' : 'revisar',
      },
      {
        agent: 'Operador LED/Social',
        mission: 'Que muro, playlist, contenido y moderacion funcionen en vivo.',
        nextAction: world.stats.liveReady >= 80 ? 'Hacer prueba final en pantalla grande.' : 'Completar contenido para LED y muro social.',
        href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
        status: world.stats.liveReady >= 80 ? 'listo' : 'revisar',
      },
    ],
    urgent,
  };
}
