import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { PREMIUM_EXPERIENCE_TEMPLATES } from './premium-templates';

export type FiestaListaOwner = 'venta' | 'cliente' | 'invitado' | 'operacion' | 'pantalla' | 'post-fiesta';
export type FiestaListaPriority = 'critica' | 'alta' | 'media';

export type FiestaListaCheck = {
  id: string;
  title: string;
  ready: boolean;
  detail: string;
  href: string;
  owner: FiestaListaOwner;
  priority: FiestaListaPriority;
};

export type FiestaListaReport = {
  score: number;
  status: 'lista' | 'casi' | 'incompleta';
  headline: string;
  checks: FiestaListaCheck[];
  blockers: FiestaListaCheck[];
  readyCount: number;
  totalCount: number;
  templatesReady: number;
  templatesTotal: number;
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function count(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function withFiestaId(href: string, fiestaId?: string): string {
  if (!fiestaId) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function enabled(value: unknown): boolean {
  return value === true;
}

function score(checks: FiestaListaCheck[]): number {
  if (!checks.length) return 0;
  return Math.round((checks.filter((check) => check.ready).length / checks.length) * 100);
}

export function buildFiestaListaReport(fiesta: FiestaEnPlanificacion): FiestaListaReport {
  const fiestaId = fiesta.id;
  const visiblePortalModules = fiesta.clientPortalSettings
    ? Object.values(fiesta.clientPortalSettings).filter((value) => value && typeof value === 'object' && (value as { visible?: boolean }).visible === true).length
    : 0;
  const guests = fiesta.invitados ?? [];
  const confirmedGuests = guests.filter((guest) => String(guest.rsvp || '').toLowerCase().includes('confirm')).length;
  const tasks = fiesta.tareas ?? [];
  const pendingTasks = tasks.filter((task) => !task.completada).length;
  const visualAssets = [
    fiesta.configuracion?.protagonistaFotoUrl,
    fiesta.clientePortalExperience?.heroImageUrl,
    fiesta.galeriaUrl,
  ].filter(hasText).length + count(fiesta.mediaLibrary);
  const hasScreen = enabled(fiesta.socialGallerySettings?.screenMode?.enabled) || count(fiesta.screenPlaylist?.items) > 0;
  const hasSocial = enabled(fiesta.socialGallerySettings?.enabled) || enabled(fiesta.socialGallerySettings?.uploadsActive) || count(fiesta.eventoEnVivo?.fotos) > 0;

  const checks: FiestaListaCheck[] = [
    {
      id: 'datos-base',
      title: 'Datos base completos',
      ready: hasText(fiesta.configuracion?.nombreEvento) && hasText(fiesta.configuracion?.fechaEvento) && hasText(fiesta.configuracion?.nombreLugar),
      detail: 'Nombre, fecha y lugar tienen que estar claros antes de vender o ejecutar.',
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
      owner: 'venta',
      priority: 'critica',
    },
    {
      id: 'identidad',
      title: 'Identidad visual de la fiesta',
      ready: visualAssets > 0 || hasText(fiesta.configuracion?.primaryColor) || hasText(fiesta.clientePortalExperience?.primaryColor),
      detail: `${visualAssets} recurso(s) visual(es) detectados. La portada evita que se vea como plantilla vacia.`,
      href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId),
      owner: 'venta',
      priority: 'alta',
    },
    {
      id: 'portal-cliente',
      title: 'Portal cliente listo para celular',
      ready: enabled(fiesta.clientPortalSettings?.enabled) && (hasText(fiesta.clientPortalSettings?.accessKey) || visiblePortalModules >= 5),
      detail: `${visiblePortalModules} modulo(s) visibles para cliente. Debe tener acceso, resumen, pagos, documentos e invitados.`,
      href: withFiestaId('/fiestas/nueva/portal-cliente', fiestaId),
      owner: 'cliente',
      priority: 'critica',
    },
    {
      id: 'invitados-rsvp',
      title: 'Invitados y RSVP probables',
      ready: guests.length > 0 && confirmedGuests > 0,
      detail: `${confirmedGuests}/${guests.length} invitado(s) confirmados. Sirve para probar portal, QR y check-in.`,
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
      owner: 'invitado',
      priority: 'critica',
    },
    {
      id: 'pagina-invitacion',
      title: 'Invitacion web o link publico',
      ready: hasText(fiesta.invitacionSlug) || enabled(fiesta.clientPortalSettings?.paginaPublica?.visible),
      detail: 'La fiesta necesita una entrada clara para invitados y prospectos.',
      href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId),
      owner: 'invitado',
      priority: 'alta',
    },
    {
      id: 'muro-social',
      title: 'Muro social o red privada activa',
      ready: hasSocial,
      detail: 'La parte visible de la noche necesita fotos, mensajes o carga social controlada.',
      href: withFiestaId('/fiestas/nueva/muro-social', fiestaId),
      owner: 'pantalla',
      priority: 'alta',
    },
    {
      id: 'pantalla-led',
      title: 'Pantalla gigante preparada',
      ready: hasScreen,
      detail: 'Debe existir un modo claro para TV, proyector o LED, con texto grande y poco ruido.',
      href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
      owner: 'pantalla',
      priority: 'alta',
    },
    {
      id: 'operacion',
      title: 'Operacion con responsables',
      ready: count(fiesta.personalAsignado) > 0 && tasks.length > 0,
      detail: `${count(fiesta.personalAsignado)} responsable(s), ${pendingTasks} tarea(s) pendiente(s).`,
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
      owner: 'operacion',
      priority: 'critica',
    },
    {
      id: 'reuniones',
      title: 'Reuniones y acuerdos cargados',
      ready: count(fiesta.reuniones) > 0 || hasText(fiesta.clientNotes),
      detail: 'Sin acuerdos cargados, la secretaria y el asistente no tienen base real para ayudar.',
      href: withFiestaId('/fiestas/nueva/reuniones', fiestaId),
      owner: 'operacion',
      priority: 'media',
    },
    {
      id: 'post-fiesta',
      title: 'Post-fiesta pensado',
      ready: hasText(fiesta.galeriaUrl) || enabled(fiesta.galeriaEntregada) || enabled(fiesta.postEventoCompletado),
      detail: 'Despues de la fiesta deberia haber galeria, feedback, recuerdos y material para redes.',
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
      owner: 'post-fiesta',
      priority: 'media',
    },
  ];

  const finalScore = score(checks);
  return {
    score: finalScore,
    status: finalScore >= 90 ? 'lista' : finalScore >= 70 ? 'casi' : 'incompleta',
    headline: finalScore >= 90
      ? 'Esta fiesta esta lista para mostrar y operar.'
      : finalScore >= 70
        ? 'Esta fiesta esta cerca, pero faltan algunos cierres visibles.'
        : 'Todavia faltan piezas importantes antes de decir 100%.',
    checks,
    blockers: checks.filter((check) => !check.ready).sort((a, b) => {
      const rank = { critica: 0, alta: 1, media: 2 };
      return rank[a.priority] - rank[b.priority];
    }),
    readyCount: checks.filter((check) => check.ready).length,
    totalCount: checks.length,
    templatesReady: PREMIUM_EXPERIENCE_TEMPLATES.length,
    templatesTotal: PREMIUM_EXPERIENCE_TEMPLATES.length,
  };
}
