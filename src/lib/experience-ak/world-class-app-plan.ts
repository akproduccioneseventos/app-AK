import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type AkDemoAudience = 'prospecto' | 'cliente' | 'invitado' | 'operador';

export type AkDemoSurface = {
  id: string;
  title: string;
  audience: AkDemoAudience;
  promise: string;
  demoScript: string;
  href: string;
  proof: string[];
};

export type AkLiveControlItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  screen: 'celular' | 'tablet' | 'pc' | 'pantalla-gigante';
  priority: 'alta' | 'media';
};

export type AkQualityCheck = {
  id: string;
  title: string;
  ready: boolean;
  detail: string;
  href: string;
  owner: 'ventas' | 'cliente' | 'invitados' | 'operacion' | 'pantalla' | 'post-fiesta';
};

export type AkExperiencePlan = {
  globalMessage: string;
  demoSurfaces: AkDemoSurface[];
  liveControl: AkLiveControlItem[];
  qualityChecks: AkQualityCheck[];
  score: number;
  blockers: AkQualityCheck[];
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function count(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return 0;
}

function withFiestaId(href: string, fiestaId?: string): string {
  if (!fiestaId) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function eventHref(fiestaId: string | undefined, slug: string, fallback = '/eventos'): string {
  return fiestaId ? `/fiestas/${encodeURIComponent(fiestaId)}/${slug}` : fallback;
}

function readyScore(items: AkQualityCheck[]): number {
  if (!items.length) return 0;
  return Math.round((items.filter((item) => item.ready).length / items.length) * 100);
}

export function buildAkExperiencePlan(fiesta?: FiestaEnPlanificacion | null): AkExperiencePlan {
  const fiestaId = fiesta?.id;
  const hasEventName = hasText(fiesta?.configuracion?.nombreEvento) || hasText(fiesta?.configuracion?.tipoCelebracion);
  const hasDate = hasText(fiesta?.configuracion?.fechaEvento);
  const hasPlace = hasText(fiesta?.configuracion?.nombreLugar) || hasText(fiesta?.configuracion?.direccionLugar);
  const hasGuests = count(fiesta?.invitados) > 0;
  const hasPortal = fiesta?.clientPortalSettings?.enabled === true || hasText(fiesta?.clientPortalSettings?.accessKey);
  const hasPublicPage = hasText(fiesta?.invitacionSlug) || fiesta?.clientPortalSettings?.paginaPublica?.visible === true;
  const hasSocial = fiesta?.socialGallerySettings?.enabled === true || fiesta?.socialGallerySettings?.uploadsActive === true || count(fiesta?.eventoEnVivo?.fotos) > 0;
  const hasScreen = fiesta?.socialGallerySettings?.screenMode?.enabled === true || count(fiesta?.screenPlaylist?.items) > 0;
  const hasStaff = count(fiesta?.personalAsignado) > 0;
  const hasTasks = count(fiesta?.tareas) > 0;
  const hasMeetings = count(fiesta?.reuniones) > 0;
  const hasVisuals = hasText(fiesta?.configuracion?.protagonistaFotoUrl) || hasText(fiesta?.clientePortalExperience?.heroImageUrl) || count(fiesta?.mediaLibrary) > 0;
  const hasPostEvent = hasText(fiesta?.galeriaUrl) || fiesta?.galeriaEntregada === true || fiesta?.postEventoCompletado === true;

  const demoSurfaces: AkDemoSurface[] = [
    {
      id: 'venta-5-minutos',
      title: 'Demo de venta en 5 minutos',
      audience: 'prospecto',
      promise: 'Mostrar antes, durante y despues de la fiesta sin entrar modulo por modulo.',
      demoScript: 'Empezar por portafolio, seguir por portal cliente, invitado, muro social, barra y cierre post-fiesta.',
      href: '/experiencia-ak',
      proof: ['Mapa visual de tecnologia', 'Servicios conectados', 'Pantalla grande adaptable'],
    },
    {
      id: 'portal-cliente',
      title: 'Portal del cliente impecable',
      audience: 'cliente',
      promise: 'El cliente ve lo que contrato, lo que falta y lo que puede decidir desde el celular.',
      demoScript: 'Abrir resumen, pagos, documentos, invitados, musica, reuniones y mensajes.',
      href: withFiestaId('/fiestas/nueva/portal-cliente', fiestaId),
      proof: ['Botones grandes', 'Secciones desplegables', 'Un solo canal claro de contacto'],
    },
    {
      id: 'pase-invitado',
      title: 'Pase digital del invitado',
      audience: 'invitado',
      promise: 'El invitado confirma, ve ubicacion, mesa, programa y participa en la fiesta.',
      demoScript: 'Mostrar invitacion web, RSVP, QR/check-in, mesa y muro social.',
      href: withFiestaId('/fiestas/nueva/modulo-invitado', fiestaId),
      proof: ['Celular primero', 'QR claro', 'Participacion social'],
    },
    {
      id: 'control-en-vivo',
      title: 'Centro de control en vivo',
      audience: 'operador',
      promise: 'AK controla pantallas, fotos, pedidos, invitados y operacion desde un lugar.',
      demoScript: 'Abrir el control en vivo, pantalla LED, muro, barra, check-in y tareas criticas.',
      href: eventHref(fiestaId, 'show-control'),
      proof: ['Pantalla gigante', 'Operador de fiesta', 'Accesos rapidos'],
    },
  ];

  const liveControl: AkLiveControlItem[] = [
    { id: 'muro', title: 'Muro social', description: 'Fotos, mensajes y momentos para pantalla gigante.', href: fiestaId ? `/evento/muro-en-vivo/${encodeURIComponent(fiestaId)}` : '/fiestas/nueva/muro-social', screen: 'pantalla-gigante', priority: 'alta' },
    { id: 'social', title: 'Red social privada', description: 'Publicaciones, comentarios y contenido de invitados.', href: fiestaId ? `/evento/social/${encodeURIComponent(fiestaId)}` : '/fiestas/nueva/social-fiesta-pro', screen: 'celular', priority: 'alta' },
    { id: 'barra', title: 'Barra tecnologica', description: 'Pantalla tactil de tragos y pantalla del barman.', href: fiestaId ? `/evento/barra/${encodeURIComponent(fiestaId)}` : '/fiestas/nueva/barra-tecnologica', screen: 'tablet', priority: 'alta' },
    { id: 'barman', title: 'Pantalla barman', description: 'Pedidos entrantes, en preparacion y entregados.', href: fiestaId ? `/evento/barra/${encodeURIComponent(fiestaId)}/barman` : '/fiestas/nueva/barra-tecnologica', screen: 'tablet', priority: 'media' },
    { id: 'checkin', title: 'Check-in QR', description: 'Ingreso de invitados sin listas en papel.', href: withFiestaId('/fiestas/nueva/invitados/checkin-scanner', fiestaId), screen: 'celular', priority: 'alta' },
    { id: 'mission', title: 'Mission Control', description: 'Tareas, tiempos, avisos y seguimiento del equipo.', href: withFiestaId('/fiestas/nueva/mission-control', fiestaId), screen: 'pc', priority: 'alta' },
    { id: 'led', title: 'Pantalla LED', description: 'Contenido visual para vender y para usar durante la fiesta.', href: '/presentacion-led/portafolio', screen: 'pantalla-gigante', priority: 'media' },
    { id: 'post', title: 'Post-fiesta', description: 'Galeria, feedback y recuerdos despues del evento.', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId), screen: 'pc', priority: 'media' },
  ];

  const qualityChecks: AkQualityCheck[] = [
    { id: 'evento-base', title: 'Evento con nombre, fecha y lugar', ready: hasEventName && hasDate && hasPlace, detail: 'Sin estos datos la experiencia no se puede vender ni operar con seguridad.', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId), owner: 'ventas' },
    { id: 'identidad-visual', title: 'Identidad visual cargada', ready: hasVisuals, detail: 'Portada, foto o color propio para que no parezca una plantilla vacia.', href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId), owner: 'ventas' },
    { id: 'portal-cliente', title: 'Portal cliente activo', ready: hasPortal, detail: 'El cliente debe tener un lugar simple para ver todo.', href: withFiestaId('/fiestas/nueva/portal-cliente', fiestaId), owner: 'cliente' },
    { id: 'invitados', title: 'Invitados cargados', ready: hasGuests, detail: 'Sin invitados no se puede probar RSVP, check-in, mesas ni muro social real.', href: withFiestaId('/fiestas/nueva/invitados', fiestaId), owner: 'invitados' },
    { id: 'invitacion', title: 'Invitacion o pagina publica lista', ready: hasPublicPage, detail: 'Es la puerta de entrada del invitado desde el celular.', href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId), owner: 'invitados' },
    { id: 'social', title: 'Muro/red social activa', ready: hasSocial, detail: 'La parte visible de la fiesta necesita fotos, mensajes o subida social.', href: withFiestaId('/fiestas/nueva/muro-social', fiestaId), owner: 'pantalla' },
    { id: 'pantalla', title: 'Pantalla gigante preparada', ready: hasScreen, detail: 'Debe existir un modo claro para LED/proyector/TV.', href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId), owner: 'pantalla' },
    { id: 'equipo', title: 'Responsables y equipo asignados', ready: hasStaff, detail: 'Cada fiesta necesita responsables reales: general, contable, marketing, operativo.', href: withFiestaId('/fiestas/nueva/personal', fiestaId), owner: 'operacion' },
    { id: 'tareas', title: 'Tareas y reuniones reales', ready: hasTasks && hasMeetings, detail: 'La IA y secretaria solo ayudan bien si hay tareas y acuerdos cargados.', href: withFiestaId('/fiestas/nueva/reuniones', fiestaId), owner: 'operacion' },
    { id: 'post-fiesta', title: 'Post-fiesta pensado', ready: hasPostEvent, detail: 'La experiencia debe terminar con galeria, feedback, recuerdos y posibles referidos.', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId), owner: 'post-fiesta' },
  ];

  const score = readyScore(qualityChecks);
  return {
    globalMessage: score >= 85
      ? 'La experiencia esta lista para mostrar como tecnologia AK.'
      : score >= 60
        ? 'La experiencia esta encaminada, pero faltan cierres visibles antes de decir 100%.'
        : 'La app tiene motores fuertes, pero necesita datos y conexiones visibles para venderse como experiencia completa.',
    demoSurfaces,
    liveControl,
    qualityChecks,
    score,
    blockers: qualityChecks.filter((item) => !item.ready).slice(0, 6),
  };
}
