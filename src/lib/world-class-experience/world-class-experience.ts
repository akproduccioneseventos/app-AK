import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { buildExperienceCenter } from '@/lib/experience-center/experience-center';

export type WorldExperienceStatus = 'listo' | 'revisar' | 'pendiente';
export type WorldExperienceSectionId = 'demo' | 'comunicaciones' | 'en_vivo' | 'post_fiesta' | 'plan_b';
export type WorldExperiencePriority = 'alta' | 'media' | 'baja';

export type WorldExperienceCheck = {
  label: string;
  ready: boolean;
  detail: string;
  priority: WorldExperiencePriority;
  href?: string;
};

export type WorldExperienceAction = {
  label: string;
  href: string;
  detail: string;
};

export type WorldExperienceSection = {
  id: WorldExperienceSectionId;
  title: string;
  subtitle: string;
  score: number;
  status: WorldExperienceStatus;
  result: string;
  href: string;
  checks: WorldExperienceCheck[];
  actions: WorldExperienceAction[];
};

export type DemoCommercialStep = {
  order: number;
  title: string;
  goal: string;
  href: string;
  speakerNote: string;
  ready: boolean;
};

export type CommunicationTouchpoint = {
  audience: 'Cliente' | 'Invitados' | 'Personal' | 'AK';
  channel: 'Gmail' | 'Google Calendar' | 'WhatsApp' | 'Portal';
  title: string;
  timing: string;
  message: string;
  href: string;
  ready: boolean;
};

export type PlanBItem = {
  title: string;
  owner: string;
  trigger: string;
  action: string;
  ready: boolean;
  href: string;
};

export type WorldClassExperience = {
  eventName: string;
  eventDateLabel: string;
  eventPlaceLabel: string;
  overallScore: number;
  status: WorldExperienceStatus;
  headline: string;
  sections: WorldExperienceSection[];
  demoSteps: DemoCommercialStep[];
  touchpoints: CommunicationTouchpoint[];
  planB: PlanBItem[];
  launchScript: string[];
  urgentFixes: WorldExperienceCheck[];
  stats: {
    guestsTotal: number;
    confirmedGuests: number;
    staffAssigned: number;
    visualAssets: number;
    communicationsReady: number;
    liveReady: number;
    postReady: number;
    planBReady: number;
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
  const record = asRecord(value);
  return keys.reduce((total, key) => total + collectionLength(record[key]), 0);
}

function scoreChecks(checks: WorldExperienceCheck[]): number {
  if (checks.length === 0) return 0;
  const weighted = checks.reduce((total, check) => total + (check.priority === 'alta' ? 3 : check.priority === 'media' ? 2 : 1), 0);
  const ready = checks.reduce((total, check) => {
    if (!check.ready) return total;
    return total + (check.priority === 'alta' ? 3 : check.priority === 'media' ? 2 : 1);
  }, 0);
  return Math.round((ready / weighted) * 100);
}

function statusFromScore(score: number): WorldExperienceStatus {
  if (score >= 86) return 'listo';
  if (score >= 58) return 'revisar';
  return 'pendiente';
}

function resultFromScore(score: number): string {
  if (score >= 86) return 'Listo para usar y mostrar.';
  if (score >= 58) return 'Funciona como base, pero conviene cerrar detalles.';
  return 'Necesita completar piezas antes de venderlo o usarlo en vivo.';
}

function makeSection(input: Omit<WorldExperienceSection, 'score' | 'status' | 'result'>): WorldExperienceSection {
  const score = scoreChecks(input.checks);
  return {
    ...input,
    score,
    status: statusFromScore(score),
    result: resultFromScore(score),
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

function formatDateLabel(value: unknown): string {
  if (!hasText(value)) return 'Sin fecha definida';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'long' }).format(date);
}

function normalizeEmail(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0]?.toLowerCase();
}

function getClientEmail(fiesta: FiestaEnPlanificacion): string | undefined {
  const config = asRecord(fiesta.configuracion);
  const portal = asRecord(fiesta.clientePortalExperience);
  const other = asRecord(fiesta.others);
  const candidates = [
    config.clienteEmail,
    config.emailCliente,
    config.email,
    config.contactoCliente,
    config.clienteContacto,
    portal.clienteEmail,
    portal.emailCliente,
    other.clienteEmail,
    other.emailCliente,
    other.email,
  ];

  for (const candidate of candidates) {
    const email = normalizeEmail(typeof candidate === 'string' ? candidate : undefined);
    if (email) return email;
  }

  return undefined;
}

function countGuestEmails(fiesta: FiestaEnPlanificacion): number {
  return (fiesta.invitados ?? []).filter((guest) => normalizeEmail(guest.contacto)).length;
}

function countConfirmedGuests(fiesta: FiestaEnPlanificacion): number {
  return (fiesta.invitados ?? []).filter((guest) => {
    const rsvp = String(guest.rsvp ?? '').toLowerCase();
    return rsvp.includes('confirm') || rsvp === 'si' || rsvp === 'sí';
  }).length;
}

function countStaff(fiesta: FiestaEnPlanificacion): number {
  return (fiesta.personalAsignado ?? []).filter((assignment) => hasText(assignment.empleadoId) || hasText(assignment.rolId)).length;
}

function countProgramItems(fiesta: FiestaEnPlanificacion): number {
  return collectionLength(fiesta.programa) + collectionLength(fiesta.timeline);
}

function countLoadItems(fiesta: FiestaEnPlanificacion): number {
  const categorias = fiesta.listaDeCargaOperativa?.categorias ?? [];
  return categorias.reduce((total, categoria) => total + (categoria.items?.length ?? 0), 0);
}

function countScreenItems(fiesta: FiestaEnPlanificacion): number {
  return collectionLength(fiesta.screenPlaylist?.items)
    + collectionLength(fiesta.socialGallerySettings?.screenMode?.playlist)
    + collectionLength(fiesta.socialGallerySettings?.screenMediaLibrary)
    + collectionLength(fiesta.mediaLibrary);
}

function countLiveItems(fiesta: FiestaEnPlanificacion): number {
  return collectionLength(fiesta.eventoEnVivo?.fotos)
    + collectionLength(fiesta.eventoEnVivo?.mensajes)
    + collectionLength(fiesta.eventoEnVivo?.solicitudesCanciones)
    + collectionLength(fiesta.eventoEnVivo?.votaciones);
}

function countVisualAssets(fiesta: FiestaEnPlanificacion): number {
  return [
    fiesta.configuracion?.protagonistaFotoUrl,
    fiesta.clientePortalExperience?.heroImageUrl,
    fiesta.galeriaUrl,
    fiesta.socialGallerySettings?.mobileControlCoverUrl,
  ].filter(hasText).length
    + nestedCount(fiesta.invitacionConfig, ['galeriaFotos'])
    + nestedCount(fiesta.invitacionDigital, ['fotos', 'galeria'])
    + nestedCount(fiesta.decoracion, ['moodboardItems', 'moodboardImages', 'items', 'itemsDecoracion'])
    + collectionLength(fiesta.mediaLibrary)
    + collectionLength(fiesta.socialGallerySettings?.screenMediaLibrary);
}

function hasEventIdentity(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(
    (hasText(fiesta.configuracion?.nombreEvento) || hasText(fiesta.configuracion?.tipoCelebracion))
    && hasText(fiesta.configuracion?.fechaEvento)
    && (hasText(fiesta.configuracion?.nombreLugar) || hasText(fiesta.configuracion?.direccionLugar))
  );
}

function hasEventVisual(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(
    hasText(fiesta.configuracion?.protagonistaFotoUrl)
    || hasText(fiesta.clientePortalExperience?.heroImageUrl)
    || hasText(fiesta.configuracion?.primaryColor)
    || hasText(fiesta.clientePortalExperience?.primaryColor)
  );
}

function hasGuestAccess(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(
    hasText(fiesta.invitacionSlug)
    || fiesta.clientPortalSettings?.paginaPublica?.visible === true
    || fiesta.guestExperienceSettings?.enabled === true
  );
}

function hasClientPortal(fiesta: FiestaEnPlanificacion): boolean {
  return Boolean(fiesta.clientPortalSettings?.enabled && hasText(fiesta.clientPortalSettings?.accessKey));
}

function hasPlanB(fiesta: FiestaEnPlanificacion): boolean {
  const cfg = fiesta.configuracion;
  return Boolean(
    hasText(cfg?.protocoloLluvia)
    || hasText(cfg?.infoEstacionamiento)
    || hasText(cfg?.rutaAccesibilidad)
    || hasText(cfg?.telefonoAsistencia)
    || countLoadItems(fiesta) > 0
  );
}

function createTouchpoints(fiesta: FiestaEnPlanificacion): CommunicationTouchpoint[] {
  const fiestaId = fiesta.id;
  const hasClientMail = Boolean(getClientEmail(fiesta));
  const guestMails = countGuestEmails(fiesta);
  const hasDate = hasText(fiesta.configuracion?.fechaEvento);
  const staff = countStaff(fiesta);
  const meetingsWithDate = (fiesta.reuniones ?? []).filter((meeting) => hasText(meeting.fecha)).length;
  const hasPayments = collectionLength(fiesta.planDePagos?.cuotas) > 0 || collectionLength(fiesta.clientPaymentNotifications) > 0;

  return [
    {
      audience: 'Cliente',
      channel: 'Google Calendar',
      title: 'Fecha del evento y reuniones',
      timing: 'Al confirmar el evento y cada vez que se agenda reunion.',
      message: 'El cliente puede agregar la fiesta y las reuniones a Google Calendar.',
      href: withFiestaId('/settings/google-workspace', fiestaId),
      ready: hasDate && hasClientMail,
    },
    {
      audience: 'Cliente',
      channel: 'Gmail',
      title: 'Recordatorios y pagos',
      timing: 'Cuando se agenda reunion, se informa pago o se aprueba pago.',
      message: 'El motor existente de Gmail queda como canal formal para avisos importantes.',
      href: withFiestaId('/settings/google-workspace', fiestaId),
      ready: hasClientMail && hasPayments,
    },
    {
      audience: 'Invitados',
      channel: 'Gmail',
      title: 'Invitacion con calendario',
      timing: 'Cuando el invitado deja mail o se cargan mails en lista.',
      message: 'Los invitados con email reciben invitacion y link para agregar la fecha.',
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
      ready: guestMails > 0 && hasDate,
    },
    {
      audience: 'Personal',
      channel: 'Google Calendar',
      title: 'Agenda por rol',
      timing: 'Cuando se asigna personal a una fiesta.',
      message: 'Cada integrante puede ver su fiesta y rol conectado a calendario.',
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
      ready: staff > 0 && hasDate,
    },
    {
      audience: 'AK',
      channel: 'WhatsApp',
      title: 'Fallback simple',
      timing: 'Cuando no hay email o el cliente prefiere celular.',
      message: 'WhatsApp queda como camino corto, pero la informacion central vive en la app.',
      href: withFiestaId('/settings/whatsapp-business', fiestaId),
      ready: hasText(fiesta.configuracion?.telefonoAsistencia) || hasClientMail || meetingsWithDate > 0,
    },
    {
      audience: 'Cliente',
      channel: 'Portal',
      title: 'Centro unico de consulta',
      timing: 'Durante toda la organizacion y despues de la fiesta.',
      message: 'El portal evita repetir la misma informacion por varios canales.',
      href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId),
      ready: hasClientPortal(fiesta),
    },
  ];
}

function createDemoSteps(fiesta: FiestaEnPlanificacion, centerScore: number): DemoCommercialStep[] {
  const fiestaId = fiesta.id;
  return [
    {
      order: 1,
      title: 'Abrir con la experiencia completa',
      goal: 'Mostrar que AK no vende solo servicios, vende organizacion y tecnologia.',
      href: eventHref(fiestaId, 'centro-experiencia'),
      speakerNote: 'Arranca por el puntaje general y muestra como cada modulo habla con los demas.',
      ready: centerScore >= 65,
    },
    {
      order: 2,
      title: 'Mostrar portal cliente desde celular',
      goal: 'Que el cliente entienda pagos, documentos, reuniones e invitados sin computadora.',
      href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId),
      speakerNote: 'Explica que el cliente ve bloques desplegables, claros y personalizados.',
      ready: hasClientPortal(fiesta),
    },
    {
      order: 3,
      title: 'Mostrar invitacion e invitados',
      goal: 'Que la familia vea que RSVP, QR, mesa y pagina de fiesta no son piezas sueltas.',
      href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId),
      speakerNote: 'Abre la invitacion, luego invitados, y remata con confirmaciones.',
      ready: hasGuestAccess(fiesta) && (fiesta.invitados?.length ?? 0) > 0,
    },
    {
      order: 4,
      title: 'Cerrar con pantalla LED y muro social',
      goal: 'Vender el momento wow que se vera durante la fiesta.',
      href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId),
      speakerNote: 'Muestra contenido para pantalla gigante, moderacion y participacion de invitados.',
      ready: countScreenItems(fiesta) > 0 || countLiveItems(fiesta) > 0 || fiesta.socialGallerySettings?.enabled === true,
    },
    {
      order: 5,
      title: 'Rematar con post-fiesta',
      goal: 'Mostrar que AK acompana antes, durante y despues.',
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
      speakerNote: 'Cierra hablando de fotos, recuerdos, feedback y seguimiento posterior.',
      ready: fiesta.clientPortalSettings?.fotografiaYFilmacion?.visible === true || hasText(fiesta.galeriaUrl),
    },
  ];
}

function createPlanB(fiesta: FiestaEnPlanificacion): PlanBItem[] {
  const fiestaId = fiesta.id;
  return [
    {
      title: 'Lluvia o cambio de clima',
      owner: 'Coordinador general',
      trigger: 'Pronostico malo o evento exterior.',
      action: textOr(fiesta.configuracion?.protocoloLluvia, 'Definir alternativa de salon, techo, ingreso y comunicacion al cliente.'),
      ready: hasText(fiesta.configuracion?.protocoloLluvia),
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
    },
    {
      title: 'Llegada de invitados',
      owner: 'Secretaria / recepcion',
      trigger: 'Invitados no saben donde estacionar o como entrar.',
      action: textOr(fiesta.configuracion?.infoEstacionamiento || fiesta.configuracion?.instruccionesLlegada, 'Cargar estacionamiento, llegada, mapa y telefono de asistencia.'),
      ready: hasText(fiesta.configuracion?.infoEstacionamiento) || hasText(fiesta.configuracion?.instruccionesLlegada),
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
    },
    {
      title: 'Accesibilidad',
      owner: 'Responsable del salon',
      trigger: 'Invitados mayores, ninos o necesidades especiales.',
      action: textOr(fiesta.configuracion?.rutaAccesibilidad, 'Definir ruta de ingreso, bano, mesa y apoyo si alguien necesita ayuda.'),
      ready: hasText(fiesta.configuracion?.rutaAccesibilidad),
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
    },
    {
      title: 'Falla de pantalla o sonido',
      owner: 'Tecnico LED / DJ',
      trigger: 'Problema con pantalla, video, Wi-Fi o reproduccion.',
      action: countScreenItems(fiesta) > 0 ? 'Hay contenido preparado; falta dejar un respaldo descargado para el dia del evento.' : 'Cargar playlist, piezas visuales y respaldo offline.',
      ready: countScreenItems(fiesta) > 0,
      href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
    },
    {
      title: 'Falta de personal o proveedor',
      owner: 'Produccion AK',
      trigger: 'Alguien llega tarde, falta o cambia de rol.',
      action: countStaff(fiesta) > 0 ? 'Hay personal asignado; conviene tener suplente y contacto por rol.' : 'Asignar personal y responsable general de la fiesta.',
      ready: countStaff(fiesta) > 0 && countLoadItems(fiesta) > 0,
      href: withFiestaId('/fiestas/nueva/personal', fiestaId),
    },
  ];
}

function createLaunchScript(fiesta: FiestaEnPlanificacion): string[] {
  const eventName = textOr(fiesta.configuracion?.nombreEvento, textOr(fiesta.configuracion?.tipoCelebracion, 'este evento'));
  return [
    `Hoy te muestro ${eventName} como lo vive AK: antes, durante y despues de la fiesta.`,
    'Primero vemos el portal del cliente: todo claro desde el celular, sin depender de computadora.',
    'Despues vemos invitados e invitacion: confirmaciones, acceso, QR y datos de la fiesta en un solo lugar.',
    'Luego pasamos al vivo: muro social, pantalla LED, contenido moderado y participacion de la gente.',
    'Cerramos con operacion y post-fiesta: personal, carga, fotos, recuerdos y plan B para que nada quede suelto.',
  ];
}

export function buildWorldClassExperience(fiesta: FiestaEnPlanificacion): WorldClassExperience {
  const fiestaId = fiesta.id;
  const center = buildExperienceCenter(fiesta);
  const guestsTotal = fiesta.invitados?.length ?? 0;
  const confirmedGuests = countConfirmedGuests(fiesta);
  const guestEmails = countGuestEmails(fiesta);
  const staffAssigned = countStaff(fiesta);
  const visualAssets = countVisualAssets(fiesta);
  const screenItems = countScreenItems(fiesta);
  const liveItems = countLiveItems(fiesta);
  const touchpoints = createTouchpoints(fiesta);
  const demoSteps = createDemoSteps(fiesta, center.overallScore);
  const planB = createPlanB(fiesta);
  const hasClientMail = Boolean(getClientEmail(fiesta));
  const meetingsWithDate = (fiesta.reuniones ?? []).filter((meeting) => hasText(meeting.fecha)).length;
  const programItems = countProgramItems(fiesta);
  const loadItems = countLoadItems(fiesta);
  const postAssets = collectionLength(fiesta.mediaLibrary) + collectionLength(fiesta.fotografiaYFilmacion?.servicios) + (hasText(fiesta.galeriaUrl) ? 1 : 0);
  const planBReady = planB.filter((item) => item.ready).length;

  const sections: WorldExperienceSection[] = [
    makeSection({
      id: 'demo',
      title: 'Modo demo comercial',
      subtitle: 'Una forma ordenada de vender la experiencia tecnologica de AK sin improvisar.',
      href: eventHref(fiestaId, 'cierre-mundial'),
      actions: [
        { label: 'Abrir centro de experiencia', href: eventHref(fiestaId, 'centro-experiencia'), detail: 'Puntaje general y pendientes.' },
        { label: 'Abrir pantalla LED', href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId), detail: 'Remate visual para vender.' },
      ],
      checks: [
        { label: 'Centro de experiencia usable', ready: center.overallScore >= 60, detail: `Centro actual: ${center.overallScore}%.`, priority: 'alta', href: eventHref(fiestaId, 'centro-experiencia') },
        { label: 'Historia visual del evento', ready: hasEventIdentity(fiesta) && hasEventVisual(fiesta), detail: 'Nombre, fecha, lugar y portada/color son la primera impresion.', priority: 'alta', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Portal cliente demostrable', ready: hasClientPortal(fiesta), detail: 'El cliente debe poder entrar desde celular.', priority: 'alta', href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId) },
        { label: 'Invitacion o pagina de fiesta visible', ready: hasGuestAccess(fiesta), detail: 'La parte que ven invitados y familia tiene que estar lista.', priority: 'media', href: withFiestaId('/fiestas/nueva/pagina-web', fiestaId) },
        { label: 'Momento wow para cerrar venta', ready: screenItems > 0 || liveItems > 0 || fiesta.socialGallerySettings?.enabled === true, detail: `${screenItems + liveItems} piezas o datos para vivo/LED.`, priority: 'media', href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId) },
      ],
    }),
    makeSection({
      id: 'comunicaciones',
      title: 'Mail, Calendar, WhatsApp y recordatorios',
      subtitle: 'Un solo criterio para avisar a cliente, invitados, personal y AK.',
      href: withFiestaId('/settings/google-workspace', fiestaId),
      actions: [
        { label: 'Google Workspace', href: withFiestaId('/settings/google-workspace', fiestaId), detail: 'Conectar Gmail y Calendar.' },
        { label: 'WhatsApp Business', href: withFiestaId('/settings/whatsapp-business', fiestaId), detail: 'Usar como canal corto y fallback.' },
      ],
      checks: [
        { label: 'Fecha del evento para Calendar', ready: hasText(fiesta.configuracion?.fechaEvento), detail: formatDateLabel(fiesta.configuracion?.fechaEvento), priority: 'alta', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Mail del cliente detectable', ready: hasClientMail, detail: hasClientMail ? 'Hay email para avisos formales.' : 'Falta email de cliente para Gmail.', priority: 'alta', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Reuniones con fecha', ready: meetingsWithDate > 0, detail: `${meetingsWithDate} reuniones listas para calendario.`, priority: 'media', href: withFiestaId('/fiestas/nueva/reuniones', fiestaId) },
        { label: 'Invitados con email', ready: guestEmails > 0 || guestsTotal === 0, detail: `${guestEmails} invitados tienen email cargado.`, priority: 'media', href: withFiestaId('/fiestas/nueva/invitados', fiestaId) },
        { label: 'Personal asignado para agenda', ready: staffAssigned > 0, detail: `${staffAssigned} integrantes asignados.`, priority: 'media', href: withFiestaId('/fiestas/nueva/personal', fiestaId) },
        { label: 'Portal como respaldo de comunicacion', ready: hasClientPortal(fiesta), detail: 'El cliente puede revisar informacion sin esperar respuesta.', priority: 'baja', href: withFiestaId('/fiestas/nueva/portal-cliente/experiencia-mundial', fiestaId) },
      ],
    }),
    makeSection({
      id: 'en_vivo',
      title: 'Experiencia en vivo mundial',
      subtitle: 'Lo que se va a ver y usar en la fiesta: LED, muro, invitados, musica y operacion.',
      href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
      actions: [
        { label: 'Evento en vivo', href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId), detail: 'Pantalla y control del dia.' },
        { label: 'Muro social', href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId), detail: 'Contenido de invitados y moderacion.' },
      ],
      checks: [
        { label: 'Pantalla LED o playlist con contenido', ready: screenItems > 0, detail: `${screenItems} piezas para pantalla o biblioteca.`, priority: 'alta', href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId) },
        { label: 'Muro social activo o con datos', ready: fiesta.socialGallerySettings?.enabled === true || liveItems > 0, detail: `${liveItems} interacciones/fotos/mensajes en vivo.`, priority: 'alta', href: withFiestaId('/fiestas/nueva/social-fiesta-pro', fiestaId) },
        { label: 'Invitados y check-in preparados', ready: guestsTotal > 0 && confirmedGuests > 0, detail: `${confirmedGuests}/${guestsTotal} invitados confirmados.`, priority: 'media', href: withFiestaId('/fiestas/nueva/invitados', fiestaId) },
        { label: 'Cronograma o timeline cargado', ready: programItems > 0, detail: `${programItems} momentos del evento detectados.`, priority: 'media', href: withFiestaId('/fiestas/nueva/itinerario', fiestaId) },
        { label: 'Musica y momentos especiales', ready: collectionLength(fiesta.musica) > 0 || collectionLength(fiesta.listaMusicaPortal) > 0, detail: 'Entrada, vals, torta, no reproducir y sugerencias.', priority: 'media', href: withFiestaId('/fiestas/nueva/musica', fiestaId) },
        { label: 'Carga operativa para el dia', ready: loadItems > 0, detail: `${loadItems} items cargados en lista operativa.`, priority: 'alta', href: withFiestaId('/fiestas/nueva/carga-operativa', fiestaId) },
      ],
    }),
    makeSection({
      id: 'post_fiesta',
      title: 'Post-fiesta y biblioteca visual',
      subtitle: 'Fotos, video, feedback, recuerdos y material reutilizable para vender mejor.',
      href: withFiestaId('/fiestas/nueva/post-evento', fiestaId),
      actions: [
        { label: 'Post-fiesta', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId), detail: 'Cierre, entrega y feedback.' },
        { label: 'Fotografia y filmacion', href: withFiestaId('/fiestas/nueva/fotografia', fiestaId), detail: 'Material final del evento.' },
      ],
      checks: [
        { label: 'Foto y video visibles para cliente', ready: fiesta.clientPortalSettings?.fotografiaYFilmacion?.visible === true || collectionLength(fiesta.fotografiaYFilmacion?.servicios) > 0, detail: 'El cliente debe saber donde vera sus recuerdos.', priority: 'alta', href: withFiestaId('/fiestas/nueva/fotografia', fiestaId) },
        { label: 'Galeria o entrega final', ready: hasText(fiesta.galeriaUrl) || fiesta.galeriaEntregada === true, detail: hasText(fiesta.galeriaUrl) ? 'Hay link de galeria.' : 'Falta marcar o cargar entrega.', priority: 'alta', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId) },
        { label: 'Biblioteca visual reutilizable', ready: visualAssets >= 4 || collectionLength(fiesta.mediaLibrary) > 0, detail: `${visualAssets} recursos visuales detectados.`, priority: 'media', href: withFiestaId('/fiestas/nueva/decoracion', fiestaId) },
        { label: 'Feedback o NPS', ready: typeof fiesta.npsScore === 'number', detail: typeof fiesta.npsScore === 'number' ? `NPS: ${fiesta.npsScore}.` : 'Falta medir satisfaccion.', priority: 'media', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId) },
        { label: 'Cierre post-fiesta', ready: fiesta.postEventoCompletado === true, detail: fiesta.postEventoCompletado ? 'Post-fiesta cerrado.' : 'Falta cierre final.', priority: 'baja', href: withFiestaId('/fiestas/nueva/post-evento', fiestaId) },
      ],
    }),
    makeSection({
      id: 'plan_b',
      title: 'Plan B operativo',
      subtitle: 'Que la fiesta tenga respuestas si algo cambia: clima, llegada, accesibilidad, pantalla, personal.',
      href: withFiestaId('/fiestas/nueva/configuracion', fiestaId),
      actions: [
        { label: 'Configuracion', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId), detail: 'Lugar, clima, llegada y asistencia.' },
        { label: 'Personal', href: withFiestaId('/fiestas/nueva/personal', fiestaId), detail: 'Responsables y suplentes.' },
      ],
      checks: [
        { label: 'Protocolo de lluvia o cambio', ready: hasText(fiesta.configuracion?.protocoloLluvia), detail: 'Necesario para eventos exteriores o con riesgo de clima.', priority: 'alta', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Llegada, mapa o estacionamiento', ready: hasText(fiesta.configuracion?.googleMapsUrl) || hasText(fiesta.configuracion?.infoEstacionamiento) || hasText(fiesta.configuracion?.instruccionesLlegada), detail: 'Evita llamadas de ultimo momento.', priority: 'media', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Accesibilidad y asistencia', ready: hasText(fiesta.configuracion?.rutaAccesibilidad) || hasText(fiesta.configuracion?.telefonoAsistencia), detail: 'Ayuda a invitados que necesitan apoyo.', priority: 'media', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
        { label: 'Responsables asignados', ready: staffAssigned > 0, detail: `${staffAssigned} integrantes asignados.`, priority: 'alta', href: withFiestaId('/fiestas/nueva/personal', fiestaId) },
        { label: 'Lista de carga lista', ready: loadItems > 0, detail: `${loadItems} items operativos cargados.`, priority: 'alta', href: withFiestaId('/fiestas/nueva/carga-operativa', fiestaId) },
        { label: 'Base minima de contingencia', ready: hasPlanB(fiesta), detail: 'Hay al menos una pieza de plan B cargada.', priority: 'baja', href: withFiestaId('/fiestas/nueva/configuracion', fiestaId) },
      ],
    }),
  ];

  const overallScore = Math.round(sections.reduce((sum, section) => sum + section.score, 0) / Math.max(sections.length, 1));
  const urgentFixes = sections.flatMap((section) => section.checks.filter((check) => !check.ready && check.priority === 'alta'));

  return {
    eventName: textOr(fiesta.configuracion?.nombreEvento, textOr(fiesta.configuracion?.tipoCelebracion, 'Fiesta sin nombre')),
    eventDateLabel: formatDateLabel(fiesta.configuracion?.fechaEvento),
    eventPlaceLabel: textOr(fiesta.configuracion?.nombreLugar || fiesta.configuracion?.direccionLugar, 'Lugar sin definir'),
    overallScore,
    status: statusFromScore(overallScore),
    headline: resultFromScore(overallScore),
    sections,
    demoSteps,
    touchpoints,
    planB,
    launchScript: createLaunchScript(fiesta),
    urgentFixes,
    stats: {
      guestsTotal,
      confirmedGuests,
      staffAssigned,
      visualAssets,
      communicationsReady: touchpoints.filter((item) => item.ready).length,
      liveReady: sections.find((section) => section.id === 'en_vivo')?.score ?? 0,
      postReady: postAssets,
      planBReady,
    },
  };
}
