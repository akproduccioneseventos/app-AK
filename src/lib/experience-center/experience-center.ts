import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { buildClientFinalReadiness, getClientFinalScore } from '@/lib/client-portal/client-final-readiness';
import { buildSocialFinalReadiness, getSocialFinalScore } from '@/lib/social-fiesta/social-final-readiness';

export type ExperienceStatus = 'listo' | 'revisar' | 'pendiente';

export type ExperienceCheck = {
  label: string;
  ready: boolean;
  detail: string;
  href?: string;
};

export type ExperienceAreaId =
  | 'identidad'
  | 'cliente'
  | 'invitados'
  | 'social_led'
  | 'agenda'
  | 'operacion'
  | 'visuales'
  | 'post_evento';

export type ExperienceArea = {
  id: ExperienceAreaId;
  title: string;
  simpleGoal: string;
  summary: string;
  href: string;
  score: number;
  status: ExperienceStatus;
  checks: ExperienceCheck[];
};

export type ExperienceQuickAction = {
  label: string;
  description: string;
  href: string;
};

export type ExperienceNextStep = {
  area: string;
  label: string;
  detail: string;
  href?: string;
};

export type ExperienceCenter = {
  eventName: string;
  eventDateLabel: string;
  eventPlaceLabel: string;
  overallScore: number;
  status: ExperienceStatus;
  message: string;
  areas: ExperienceArea[];
  quickActions: ExperienceQuickAction[];
  nextSteps: ExperienceNextStep[];
  stats: {
    clientScore: number;
    socialScore: number;
    guestsTotal: number;
    guestsConfirmed: number;
    guestsPending: number;
    staffAssigned: number;
    meetings: number;
    visualAssets: number;
    pendingChecks: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOr(value: unknown, fallback: string): string {
  return hasText(value) ? String(value).trim() : fallback;
}

function collectionLength(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (isRecord(value)) return Object.keys(value).length;
  return 0;
}

function nestedCount(value: unknown, keys: string[]): number {
  if (!isRecord(value)) return 0;
  return keys.reduce((total, key) => total + collectionLength(value[key]), 0);
}

function scoreChecks(checks: ExperienceCheck[]): number {
  if (checks.length === 0) return 0;
  const ready = checks.filter((check) => check.ready).length;
  return Math.round((ready / checks.length) * 100);
}

function statusFromScore(score: number): ExperienceStatus {
  if (score >= 85) return 'listo';
  if (score >= 55) return 'revisar';
  return 'pendiente';
}

function messageFromScore(score: number): string {
  if (score >= 85) return 'La experiencia esta lista para mostrar con confianza.';
  if (score >= 65) return 'La experiencia esta muy encaminada, pero conviene cerrar algunos puntos antes de venderla o ejecutarla.';
  return 'Todavia hay piezas importantes sin conectar o sin cargar.';
}

function makeArea(input: Omit<ExperienceArea, 'score' | 'status'>): ExperienceArea {
  const score = scoreChecks(input.checks);
  return {
    ...input,
    score,
    status: statusFromScore(score),
  };
}

function withFiestaId(href: string, fiestaId?: string | null): string {
  if (!fiestaId) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function eventHref(fiestaId: string, slug: string): string {
  return `/fiestas/${encodeURIComponent(fiestaId)}/${slug}`;
}

function publicPortalHref(fiesta: FiestaEnPlanificacion): string {
  const accessKey = fiesta.clientPortalSettings?.accessKey;
  return hasText(accessKey) ? `/portal/c/${encodeURIComponent(String(accessKey).trim())}` : withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiesta.id);
}

function formatDateLabel(value: unknown): string {
  if (!hasText(value)) return 'Sin fecha definida';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' }).format(date);
}

function visibleClientModules(fiesta: FiestaEnPlanificacion): number {
  const settings = fiesta.clientPortalSettings;
  if (!isRecord(settings)) return 0;
  return Object.values(settings).filter((value) => isRecord(value) && value.visible === true).length;
}

function countConfirmedGuests(fiesta: FiestaEnPlanificacion): number {
  // Cuenta PERSONAS, no filas: un invitado con acompanantes son varios.
  const guests = fiesta.invitados ?? [];
  return guests
    .filter((guest) => {
      const rsvp = String(asRecord(guest).rsvp ?? '').toLowerCase();
      return rsvp.includes('confirm') || rsvp === 'si' || rsvp === 'sí';
    })
    .reduce((total, guest) => total + (Number(asRecord(guest).partySize) || 1), 0);
}

function countRejectedGuests(fiesta: FiestaEnPlanificacion): number {
  const guests = fiesta.invitados ?? [];
  return guests.filter((guest) => {
    const rsvp = String(asRecord(guest).rsvp ?? '').toLowerCase();
    return rsvp.includes('rechaz') || rsvp.includes('no asiste') || rsvp === 'no';
  }).length;
}

function countFilledStaff(fiesta: FiestaEnPlanificacion): number {
  return (fiesta.personalAsignado ?? []).filter((assignment) => {
    if (!isRecord(assignment)) return true;
    return hasText(assignment.empleadoId) || hasText(assignment.rolId);
  }).length;
}

function countCompletedTasks(fiesta: FiestaEnPlanificacion): number {
  return (fiesta.tareas ?? []).filter((task) => isRecord(task) && task.completada === true).length;
}

function countUpcomingMeetings(fiesta: FiestaEnPlanificacion): number {
  const now = Date.now();
  return (fiesta.reuniones ?? []).filter((meeting) => {
    if (!isRecord(meeting) || !hasText(meeting.fecha)) return false;
    const date = new Date(String(meeting.fecha));
    return !Number.isNaN(date.getTime()) && date.getTime() >= now - 1000 * 60 * 60 * 24;
  }).length;
}

function countLoadItems(fiesta: FiestaEnPlanificacion): number {
  const categorias = fiesta.listaDeCargaOperativa?.categorias ?? [];
  const items = categorias.reduce((total, categoria) => total + (categoria.items?.length ?? 0), 0);
  return items > 0 ? items : collectionLength(fiesta.listaDeCargaOperativa);
}

function countLiveContent(fiesta: FiestaEnPlanificacion): number {
  const live = fiesta.eventoEnVivo;
  return collectionLength(live?.fotos)
    + collectionLength(live?.mensajes)
    + collectionLength(live?.solicitudesCanciones)
    + collectionLength(live?.votaciones);
}

function countScreenPlaylistItems(fiesta: FiestaEnPlanificacion): number {
  return collectionLength(fiesta.screenPlaylist?.items) + collectionLength(fiesta.socialGallerySettings?.screenMode?.playlist);
}

function countVisualAssets(fiesta: FiestaEnPlanificacion): number {
  const invitacionConfig = fiesta.invitacionConfig as unknown;
  const invitacionDigital = fiesta.invitacionDigital as unknown;
  const decoracion = fiesta.decoracion as unknown;
  const socialSettings = fiesta.socialGallerySettings as unknown;

  return [
    fiesta.configuracion?.protagonistaFotoUrl,
    fiesta.clientePortalExperience?.heroImageUrl,
    fiesta.galeriaUrl,
  ].filter(hasText).length
    + nestedCount(invitacionConfig, ['galeriaFotos', 'fotos', 'imagenes'])
    + nestedCount(invitacionDigital, ['galeria', 'fotos', 'imagenes'])
    + nestedCount(decoracion, ['moodboardItems', 'moodboardImages', 'elementos'])
    + collectionLength(fiesta.mediaLibrary)
    + nestedCount(socialSettings, ['screenMediaLibrary', 'mediaLibrary']);
}

function hasVisualIdentity(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(
    hasText(fiesta.configuracion?.protagonistaFotoUrl)
    || hasText(fiesta.configuracion?.primaryColor)
    || hasText(fiesta.clientePortalExperience?.heroImageUrl)
    || hasText(fiesta.clientePortalExperience?.primaryColor)
  );
}

function hasInvitationAccess(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(
    hasText(fiesta.invitacionSlug)
    || hasText(fiesta.clientPortalSettings?.accessKey)
    || fiesta.clientPortalSettings?.paginaPublica?.visible === true
  );
}

function hasPostEventFeedback(fiesta: FiestaEnPlanificacion): boolean {
  if (typeof fiesta.npsScore === 'number') return true;
  const others = fiesta.others as unknown;
  return isRecord(others) && (hasText(others.testimonioCliente) || hasText(others.feedbackCliente));
}

function buildQuickActions(fiesta: FiestaEnPlanificacion): ExperienceQuickAction[] {
  const fiestaId = fiesta.id;
  return [
    {
      label: 'Control en vivo AK',
      description: 'Abrir cabina de mando para pantallas, barra, QR, social y tareas.',
      href: eventHref(fiestaId, 'show-control'),
    },
    {
      label: 'Demo tecnologia AK',
      description: 'Mostrar la historia completa para vender la experiencia.',
      href: eventHref(fiestaId, 'experiencia-tecnologica-ak'),
    },
    {
      label: 'Portal cliente',
      description: 'Abrir lo que vera el cliente desde el celular.',
      href: publicPortalHref(fiesta),
    },
    {
      label: 'Pagina e invitacion',
      description: 'Revisar portada, QR y pagina publica del evento.',
      href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId),
    },
    {
      label: 'Invitados',
      description: 'Ver confirmados, pendientes y cambios de lista.',
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
    },
    {
      label: 'Muro social',
      description: 'Preparar lo que se vera durante la fiesta.',
      href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId),
    },
    {
      label: 'Pantalla LED',
      description: 'Probar contenido en modo presentacion y pantalla grande.',
      href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
    },
    {
      label: 'Reuniones',
      description: 'Ordenar acuerdos, llamadas y proximos pasos.',
      href: withFiestaId('/fiestas/nueva/reuniones', fiestaId),
    },
    {
      label: 'Personal',
      description: 'Confirmar responsables y roles por fiesta.',
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
    },
    {
      label: 'Post-fiesta',
      description: 'Controlar entregas finales, fotos y experiencia posterior.',
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
    },
  ];
}

export function buildExperienceCenter(fiesta: FiestaEnPlanificacion): ExperienceCenter {
  const fiestaId = fiesta.id;
  const clientScore = getClientFinalScore(fiesta);
  const socialScore = getSocialFinalScore(fiesta);
  const clientAreas = buildClientFinalReadiness(fiesta);
  const socialAreas = buildSocialFinalReadiness(fiesta);
  const guestsTotal = fiesta.invitados?.length ?? 0;
  const guestsConfirmed = countConfirmedGuests(fiesta);
  const guestsRejected = countRejectedGuests(fiesta);
  const guestsPending = Math.max(guestsTotal - guestsConfirmed - guestsRejected, 0);
  const staffAssigned = countFilledStaff(fiesta);
  const meetings = fiesta.reuniones?.length ?? 0;
  const upcomingMeetings = countUpcomingMeetings(fiesta);
  const taskCount = fiesta.tareas?.length ?? 0;
  const completedTasks = countCompletedTasks(fiesta);
  const visualAssets = countVisualAssets(fiesta);
  const clientModuleCount = visibleClientModules(fiesta);
  const programItems = collectionLength(fiesta.programa);
  const loadItems = countLoadItems(fiesta);
  const liveContent = countLiveContent(fiesta);
  const playlistItems = countScreenPlaylistItems(fiesta);
  const socialEnabled = fiesta.socialGallerySettings?.enabled === true || liveContent > 0;
  const screenReady = Boolean(
    fiesta.socialGallerySettings?.screenMode?.enabled
    || playlistItems > 0
    || collectionLength(fiesta.socialGallerySettings?.screenMediaLibrary) > 0
    || liveContent > 0
  );

  const areas: ExperienceArea[] = [
    makeArea({
      id: 'identidad',
      title: 'Identidad y venta',
      simpleGoal: 'Que cualquier persona entienda que evento es, cuando es, donde es y por que se ve premium.',
      summary: textOr(fiesta.configuracion?.tipoCelebracion, 'Evento') + ' preparado para revisar como experiencia comercial.',
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
      checks: [
        {
          label: 'Nombre o tipo de evento cargado',
          ready: hasText(fiesta.configuracion?.nombreEvento) || hasText(fiesta.configuracion?.tipoCelebracion),
          detail: textOr(fiesta.configuracion?.nombreEvento, 'Todavia falta un nombre claro para mostrar.'),
        },
        {
          label: 'Fecha definida',
          ready: hasText(fiesta.configuracion?.fechaEvento),
          detail: formatDateLabel(fiesta.configuracion?.fechaEvento),
        },
        {
          label: 'Lugar y direccion claros',
          ready: hasText(fiesta.configuracion?.nombreLugar) || hasText(fiesta.configuracion?.direccionLugar),
          detail: textOr(fiesta.configuracion?.nombreLugar || fiesta.configuracion?.direccionLugar, 'Falta lugar o direccion.'),
        },
        {
          label: 'Imagen o color propio del evento',
          ready: hasVisualIdentity(fiesta),
          detail: hasVisualIdentity(fiesta) ? 'La fiesta tiene identidad visual.' : 'Falta portada, foto o color personalizado.',
          href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId),
        },
        {
          label: 'Acceso digital preparado',
          ready: hasInvitationAccess(fiesta),
          detail: hasInvitationAccess(fiesta) ? 'Hay acceso para portal, pagina o invitacion.' : 'Falta preparar link, QR o pagina publica.',
          href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId),
        },
      ],
    }),
    makeArea({
      id: 'cliente',
      title: 'Cliente en celular',
      simpleGoal: 'Que el cliente vea todo simple desde su telefono: pagos, documentos, reuniones, invitados y mensajes.',
      summary: `Portal cliente ${clientScore}% con ${clientModuleCount} modulos visibles.`,
      href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId),
      checks: [
        {
          label: 'Portal activado',
          ready: fiesta.clientPortalSettings?.enabled === true,
          detail: fiesta.clientPortalSettings?.enabled === true ? 'El portal esta encendido.' : 'El portal todavia no esta activo.',
        },
        {
          label: 'Clave o link de acceso',
          ready: hasText(fiesta.clientPortalSettings?.accessKey),
          detail: hasText(fiesta.clientPortalSettings?.accessKey) ? 'El cliente tiene un acceso privado.' : 'Falta generar acceso privado.',
        },
        {
          label: 'Modulos principales visibles',
          ready: clientModuleCount >= 5,
          detail: `${clientModuleCount} modulos visibles para el cliente.`,
        },
        {
          label: 'Readiness del cliente fuerte',
          ready: clientScore >= 70,
          detail: `${clientAreas.filter((area) => area.ready).length}/${clientAreas.length} bloques del cliente estan listos.`,
        },
        {
          label: 'FAQ, notas o checklist de seguimiento',
          ready: collectionLength(fiesta.faqPortal) > 0 || collectionLength(fiesta.clientChecklist) > 0 || hasText(fiesta.clientNotes),
          detail: 'Ayuda a que el cliente no dependa de mensajes sueltos.',
        },
      ],
    }),
    makeArea({
      id: 'invitados',
      title: 'Invitados y RSVP',
      simpleGoal: 'Que confirmados, pendientes y cambios esten visibles sin perseguir mensajes.',
      summary: `${guestsConfirmed} confirmados, ${guestsPending} pendientes, ${guestsTotal} invitados cargados.`,
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
      checks: [
        {
          label: 'Lista de invitados cargada',
          ready: guestsTotal > 0,
          detail: `${guestsTotal} invitados en la fiesta.`,
        },
        {
          label: 'Confirmaciones registradas',
          ready: guestsConfirmed > 0 || guestsTotal === 0,
          detail: guestsTotal === 0 ? 'Primero hay que cargar invitados.' : `${guestsConfirmed} invitados confirmados.`,
        },
        {
          label: 'Pendientes detectados',
          ready: guestsTotal === 0 || guestsPending < guestsTotal,
          detail: `${guestsPending} invitados siguen pendientes.`,
        },
        {
          label: 'Modulo de invitados visible para cliente o pagina',
          ready: fiesta.clientPortalSettings?.invitados?.visible === true || fiesta.clientPortalSettings?.paginaPublica?.visible === true,
          detail: 'Permite que el cliente acompanhe el avance.',
        },
        {
          label: 'Diseno de salon conectado a invitados',
          ready: collectionLength(fiesta.menuMesa) > 0 || collectionLength(fiesta.numerosMesa) > 0,
          detail: 'Mesas y numeros ayudan a pasar del RSVP a la operacion real.',
          href: withFiestaId('/fiestas/nueva/invitados/layout', fiestaId),
        },
      ],
    }),
    makeArea({
      id: 'social_led',
      title: 'Social, red privada y LED',
      simpleGoal: 'Que lo que ve la gente en la fiesta se sienta vivo, lindo y controlado.',
      summary: `Social ${socialScore}% y pantalla ${screenReady ? 'preparada' : 'sin prueba final'}.`,
      href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId),
      checks: [
        {
          label: 'Modulo social o evento en vivo activo',
          ready: socialEnabled,
          detail: socialEnabled ? 'Hay experiencia social encendida.' : 'Falta activar social, muro o evento en vivo.',
        },
        {
          label: 'Pantalla LED preparada',
          ready: screenReady,
          detail: screenReady ? 'Hay configuracion o contenido para pantalla.' : 'Falta playlist, modo pantalla o contenido de prueba.',
          href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
        },
        {
          label: 'Readiness social fuerte',
          ready: socialScore >= 70,
          detail: `${socialAreas.filter((area) => area.ready).length}/${socialAreas.length} bloques sociales estan listos.`,
        },
        {
          label: 'Carga de fotos y mensajes controlada',
          ready: fiesta.socialGallerySettings?.uploadsActive === true || fiesta.socialGallerySettings?.allowComments === true || fiesta.socialGallerySettings?.chatEnabled === true,
          detail: 'Define que puede subir la gente y que revisa AK.',
        },
        {
          label: 'Contenido para pantalla o muro',
          ready: collectionLength(fiesta.mediaLibrary) > 0 || collectionLength(fiesta.socialGallerySettings?.screenMediaLibrary) > 0 || playlistItems > 0,
          detail: `${visualAssets} recursos visuales detectados en la fiesta.`,
        },
      ],
    }),
    makeArea({
      id: 'agenda',
      title: 'Agenda, reuniones y acuerdos',
      simpleGoal: 'Que los acuerdos con cliente y equipo no queden perdidos en conversaciones.',
      summary: `${meetings} reuniones cargadas y ${programItems} momentos en programa.`,
      href: withFiestaId('/fiestas/nueva/reuniones', fiestaId),
      checks: [
        {
          label: 'Reuniones cargadas',
          ready: meetings > 0,
          detail: `${meetings} reuniones o llamadas registradas.`,
        },
        {
          label: 'Proxima reunion detectable',
          ready: upcomingMeetings > 0 || meetings > 0,
          detail: upcomingMeetings > 0 ? `${upcomingMeetings} reuniones proximas.` : 'No hay proxima reunion con fecha futura.',
        },
        {
          label: 'Cronograma de fiesta cargado',
          ready: programItems > 0,
          detail: `${programItems} momentos en el programa.`,
          href: withFiestaId('/fiestas/nueva/itinerario', fiestaId),
        },
        {
          label: 'Tareas de seguimiento',
          ready: taskCount > 0,
          detail: `${completedTasks}/${taskCount} tareas completadas.`,
          href: withFiestaId('/fiestas/nueva/tareas', fiestaId),
        },
        {
          label: 'Acuerdos o notas del cliente',
          ready: hasText(fiesta.clientNotes) || (fiesta.reuniones ?? []).some((meeting) => isRecord(meeting) && (hasText(meeting.notas) || hasText(meeting.acuerdos))),
          detail: 'Sirve para que secretaria, vendedor y produccion trabajen con la misma informacion.',
        },
      ],
    }),
    makeArea({
      id: 'operacion',
      title: 'Personal y operacion',
      simpleGoal: 'Que cada fiesta tenga responsables claros y una lista real de trabajo.',
      summary: `${staffAssigned} personas asignadas y ${loadItems} items operativos detectados.`,
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
      checks: [
        {
          label: 'Personal asignado',
          ready: staffAssigned > 0,
          detail: `${staffAssigned} asignaciones de personal.`,
        },
        {
          label: 'Tareas operativas creadas',
          ready: taskCount > 0,
          detail: `${taskCount} tareas cargadas para la fiesta.`,
          href: withFiestaId('/fiestas/nueva/tareas', fiestaId),
        },
        {
          label: 'Lista de carga o equipos',
          ready: loadItems > 0,
          detail: `${loadItems} items de carga/equipo detectados.`,
          href: withFiestaId('/fiestas/nueva/carga-operativa', fiestaId),
        },
        {
          label: 'Menu o catering vinculado',
          ready: hasText(fiesta.menuAsignadoId) || collectionLength(fiesta.menuSeleccionPortal) > 0,
          detail: 'Ayuda a que cocina y salon no trabajen separados.',
          href: withFiestaId('/fiestas/nueva/catering', fiestaId),
        },
        {
          label: 'Costos o rentabilidad controlados',
          ready: collectionLength(fiesta.gestionCostos) > 0 || hasText(fiesta.presupuestoId),
          detail: 'Permite ver si la fiesta esta ordenada tambien por dentro.',
          href: withFiestaId('/fiestas/nueva/gestion-costos-rentabilidad', fiestaId),
        },
      ],
    }),
    makeArea({
      id: 'visuales',
      title: 'Contenido visual y decoracion',
      simpleGoal: 'Que cliente, invitados y ventas vean una fiesta atractiva, no solo datos.',
      summary: `${visualAssets} recursos visuales, portada o elementos decorativos detectados.`,
      href: withFiestaId('/fiestas/nueva/decoracion', fiestaId),
      checks: [
        {
          label: 'Portada o foto principal',
          ready: hasText(fiesta.configuracion?.protagonistaFotoUrl) || hasText(fiesta.clientePortalExperience?.heroImageUrl),
          detail: 'La primera impresion del evento depende de esto.',
        },
        {
          label: 'Galeria o biblioteca visual',
          ready: visualAssets >= 3,
          detail: `${visualAssets} recursos visuales encontrados.`,
        },
        {
          label: 'Decoracion o moodboard',
          ready: collectionLength(fiesta.decoracion) > 0 || nestedCount(fiesta.decoracion, ['moodboardItems', 'moodboardImages', 'elementos']) > 0,
          detail: 'Conecta la idea visual con el planificador de fiesta.',
        },
        {
          label: 'Foto y video visibles para cliente',
          ready: fiesta.clientPortalSettings?.fotografiaYFilmacion?.visible === true || collectionLength(fiesta.fotografiaYFilmacion) > 0,
          detail: 'Hace que la experiencia siga despues del evento.',
          href: withFiestaId('/fiestas/nueva/fotografia', fiestaId),
        },
        {
          label: 'Colores personalizados',
          ready: hasText(fiesta.configuracion?.primaryColor) || hasText(fiesta.clientePortalExperience?.primaryColor),
          detail: 'La estetica puede cambiar por cliente sin perder la base AK.',
        },
      ],
    }),
    makeArea({
      id: 'post_evento',
      title: 'Post-fiesta y memoria',
      simpleGoal: 'Que despues de la fiesta tambien haya una experiencia clara: fotos, entrega, feedback y referidos.',
      summary: fiesta.postEventoCompletado ? 'Post-fiesta marcado como completado.' : 'Post-fiesta todavia no esta cerrado.',
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
      checks: [
        {
          label: 'Galeria final o link de entrega',
          ready: hasText(fiesta.galeriaUrl) || fiesta.galeriaEntregada === true,
          detail: hasText(fiesta.galeriaUrl) ? 'Hay link de galeria final.' : 'Falta galeria final o marca de entrega.',
        },
        {
          label: 'Post-evento completado',
          ready: fiesta.postEventoCompletado === true,
          detail: fiesta.postEventoCompletado === true ? 'La fiesta tiene cierre marcado.' : 'Falta marcar cierre post-fiesta.',
        },
        {
          label: 'Feedback o NPS registrado',
          ready: hasPostEventFeedback(fiesta),
          detail: typeof fiesta.npsScore === 'number' ? `NPS registrado: ${fiesta.npsScore}.` : 'Falta feedback o testimonio.',
        },
        {
          label: 'Documentos finales ubicados',
          ready: collectionLength(fiesta.othersDocumentos) > 0 || collectionLength(fiesta.contratoGenerado) > 0,
          detail: 'Evita perder comprobantes, contrato o archivos finales.',
        },
        {
          label: 'Recuerdos visibles para cliente',
          ready: fiesta.clientPortalSettings?.documentos?.visible === true || fiesta.clientPortalSettings?.fotografiaYFilmacion?.visible === true,
          detail: 'El cliente vuelve al portal para ver entregas y recuerdos.',
        },
      ],
    }),
  ];

  const overallScore = Math.round(areas.reduce((sum, area) => sum + area.score, 0) / Math.max(areas.length, 1));
  const nextSteps = areas.flatMap((area) => area.checks
    .filter((check) => !check.ready)
    .map((check) => ({
      area: area.title,
      label: check.label,
      detail: check.detail,
      href: check.href ?? area.href,
    })));

  return {
    eventName: textOr(fiesta.configuracion?.nombreEvento, textOr(fiesta.configuracion?.tipoCelebracion, 'Fiesta sin nombre')),
    eventDateLabel: formatDateLabel(fiesta.configuracion?.fechaEvento),
    eventPlaceLabel: textOr(fiesta.configuracion?.nombreLugar || fiesta.configuracion?.direccionLugar, 'Lugar sin definir'),
    overallScore,
    status: statusFromScore(overallScore),
    message: messageFromScore(overallScore),
    areas,
    quickActions: buildQuickActions(fiesta),
    nextSteps,
    stats: {
      clientScore,
      socialScore,
      guestsTotal,
      guestsConfirmed,
      guestsPending,
      staffAssigned,
      meetings,
      visualAssets,
      pendingChecks: nextSteps.length,
    },
  };
}
