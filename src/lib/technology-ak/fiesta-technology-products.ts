export type AkTechnologyStatus = 'listo' | 'parcial' | 'pendiente';

export type AkTechnologyProductId =
  | 'demo_comercial'
  | 'pase_invitado'
  | 'fiesta_en_vivo'
  | 'zona_digital'
  | 'ia_operativa';

export type AkTechnologyProduct = {
  id: AkTechnologyProductId;
  title: string;
  salesName: string;
  clientPromise: string;
  score: number;
  status: AkTechnologyStatus;
  alreadyConnected: string[];
  missingToClose: string[];
  nextPrWork: string[];
  href: string;
};

export type AkTechnologySuite = {
  eventName: string;
  globalScore: number;
  status: AkTechnologyStatus;
  salesMessage: string;
  products: AkTechnologyProduct[];
  strongestProof: string[];
  nextWork: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOr(value: unknown, fallback: string): string {
  return hasText(value) ? String(value).trim() : fallback;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function countObjectOrArray(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return 0;
}

function statusFromScore(score: number): AkTechnologyStatus {
  if (score >= 80) return 'listo';
  if (score >= 45) return 'parcial';
  return 'pendiente';
}

function scoreFromChecks(checks: boolean[]): number {
  if (!checks.length) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function withFiestaId(href: string, fiestaId?: string) {
  if (!fiestaId) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}fiestaId=${encodeURIComponent(fiestaId)}`;
}

function eventHref(fiestaId: string, slug: string) {
  return `/fiestas/${encodeURIComponent(fiestaId)}/${slug}`;
}

function addIf(condition: boolean, value: string): string[] {
  return condition ? [value] : [];
}

export function buildAkTechnologySuite(fiestaInput: unknown): AkTechnologySuite {
  const fiesta = asRecord(fiestaInput);
  const fiestaId = textOr(fiesta.id, '');
  const cfg = asRecord(fiesta.configuracion);
  const clientPortal = asRecord(fiesta.clientPortalSettings);
  const guestSettings = asRecord(fiesta.guestExperienceSettings);
  const publicPage = asRecord(clientPortal.paginaPublica);
  const social = asRecord(fiesta.socialGallerySettings);
  const screenMode = asRecord(social.screenMode);
  const live = asRecord(fiesta.eventoEnVivo);
  const planPagos = asRecord(fiesta.planDePagos);
  const others = asRecord(fiesta.others);
  const entertainment = asRecord(others.entretenimiento);
  const zonaDigital = asRecord(fiesta.zonaDigitalAdolescentes);
  const modulosContratados = asRecord(fiesta.modulosContratados);
  const barraTecnologica = asRecord(others.barraTecnologica);
  const clientExperience = asRecord(fiesta.clientePortalExperience);

  const invitados = list(fiesta.invitados);
  const tareas = list(fiesta.tareas);
  const reuniones = list(fiesta.reuniones);
  const personal = list(fiesta.personalAsignado);
  const eventName = textOr(cfg.nombreEvento, textOr(cfg.tipoCelebracion, 'Fiesta AK'));

  const hasEventBase = hasText(cfg.nombreEvento) || hasText(cfg.tipoCelebracion);
  const hasDate = hasText(cfg.fechaEvento);
  const hasPlace = hasText(cfg.nombreLugar) || hasText(cfg.direccionLugar);
  const hasClientPortal = clientPortal.enabled === true || hasText(clientPortal.accessKey);
  const hasPublicInvite = hasText(fiesta.invitacionSlug) || publicPage.visible === true;
  const hasGuests = invitados.length > 0;
  const hasTables = invitados.some((guest) => {
    const record = asRecord(guest);
    return hasText(record.mesa) || hasText(record.mesaId) || hasText(record.numeroMesa);
  }) || countObjectOrArray(fiesta.menuMesa) > 0 || countObjectOrArray(fiesta.numerosMesa) > 0;
  const hasGuestQr = guestSettings.enabled === true || hasPublicInvite;
  const hasMusic = countObjectOrArray(fiesta.musica) > 0 || countObjectOrArray(fiesta.listaMusicaPortal) > 0 || countObjectOrArray(live.solicitudesCanciones) > 0;
  const hasLiveWall = social.enabled === true || countObjectOrArray(live.fotos) > 0 || countObjectOrArray(live.mensajes) > 0;
  const screenPlaylist = [...list(fiesta.screenPlaylist), ...list(screenMode.playlist)];
  const hasScreen = screenMode.enabled === true || screenPlaylist.length > 0 || countObjectOrArray(social.screenMediaLibrary) > 0;
  const hasVoting = countObjectOrArray(live.votaciones) > 0;
  const hasEntertainment = countObjectOrArray(entertainment.modules) > 0 || countObjectOrArray(entertainment) > 0;
  const hasZonaDigital = zonaDigital.enabled === true || modulosContratados.zonaDigital === true || countObjectOrArray(zonaDigital.features) > 0;
  const hasDigitalChallenges = countObjectOrArray(zonaDigital.challenges) > 0 || countObjectOrArray(zonaDigital.games) > 0 || hasVoting;
  const hasBarTechnology = modulosContratados.barraTecnologica === true || countObjectOrArray(barraTecnologica) > 0;
  const hasTotems = modulosContratados.pantallasTotem === true || countObjectOrArray(fiesta.totemScreens) > 0 || countObjectOrArray(social.totemScreens) > 0;
  const hasAudioRhythm = screenPlaylist.some(item => asRecord(item).type === 'audioritmico') || asRecord(fiesta.audioRhythm).enabled === true || asRecord(social.audioRhythm).enabled === true;
  const hasPostEvent = hasText(fiesta.galeriaUrl) || fiesta.galeriaEntregada === true || fiesta.postEventoCompletado === true;
  const hasDocs = countObjectOrArray(fiesta.othersDocumentos) > 0 || countObjectOrArray(fiesta.contratoGenerado) > 0;
  const hasPayments = countObjectOrArray(planPagos.cuotas) > 0 || countObjectOrArray(fiesta.clientPaymentNotifications) > 0 || countObjectOrArray(fiesta.pagos) > 0;
  const hasStaff = personal.length > 0;
  const hasTasks = tareas.length > 0;
  const hasMeetings = reuniones.length > 0;
  const hasProgram = countObjectOrArray(fiesta.programa) > 0 || countObjectOrArray(fiesta.timeline) > 0;
  const hasVisuals = hasText(cfg.protagonistaFotoUrl) || hasText(clientExperience.heroImageUrl) || countObjectOrArray(fiesta.mediaLibrary) > 0;

  const demoScore = scoreFromChecks([hasEventBase, hasDate, hasPlace, hasClientPortal, hasPublicInvite, hasVisuals, hasLiveWall || hasScreen, hasPostEvent]);
  const guestScore = scoreFromChecks([hasGuests, hasGuestQr, hasPublicInvite, hasTables, hasPlace, hasProgram, hasMusic, hasLiveWall, hasPostEvent]);
  const liveScore = scoreFromChecks([hasLiveWall, hasScreen, hasMusic, hasVoting, hasEntertainment, hasPostEvent]);
  const digitalZoneScore = scoreFromChecks([hasZonaDigital, hasLiveWall, hasScreen, hasDigitalChallenges, hasEntertainment, hasBarTechnology, hasTotems, hasAudioRhythm, hasPostEvent]);
  const aiScore = scoreFromChecks([hasGuests, hasTables, hasPayments, hasDocs, hasStaff, hasTasks, hasMeetings, hasProgram, hasLiveWall || hasScreen, hasPostEvent]);

  const products: AkTechnologyProduct[] = [
    {
      id: 'demo_comercial',
      title: 'Demo comercial de tecnología AK',
      salesName: 'Así se ve una fiesta organizada con plataforma propia e IA',
      clientPromise: 'El cliente entiende en una entrevista qué tecnología recibe y por qué AK no es un proveedor común.',
      score: demoScore,
      status: statusFromScore(demoScore),
      alreadyConnected: [
        ...addIf(hasClientPortal, 'Portal del cliente'),
        ...addIf(hasPublicInvite, 'Página/invitación pública'),
        ...addIf(hasLiveWall || hasScreen, 'Pantalla, muro social o experiencia en vivo'),
        ...addIf(hasPostEvent, 'Post-fiesta o galería final'),
        ...addIf(hasVisuals, 'Fotos/identidad visual de la fiesta'),
      ],
      missingToClose: [
        ...addIf(!hasClientPortal, 'Portal del cliente visible para mostrar en entrevista'),
        ...addIf(!hasPublicInvite, 'Invitación o página pública demostrable'),
        ...addIf(!hasLiveWall && !hasScreen, 'Prueba visual de pantalla/muro social'),
        ...addIf(!hasPostEvent, 'Bloque de recuerdos/post-fiesta para cerrar la venta'),
      ],
      nextPrWork: [
        'Crear vista demo que muestre la tecnología como producto, no como módulos sueltos.',
        'Mostrar antes, durante y después de la fiesta en una secuencia corta para vender.',
        'Agregar acceso rápido desde el comando total de cada fiesta.',
      ],
      href: fiestaId ? eventHref(fiestaId, 'experiencia-tecnologica-ak') : '/tecnologia-ak',
    },
    {
      id: 'pase_invitado',
      title: 'Pase digital del invitado',
      salesName: 'Cada invitado entra por QR y tiene su experiencia personalizada',
      clientPromise: 'El invitado confirma, ve ubicación, mesa, programa, música, fotos y recuerdos desde un solo lugar.',
      score: guestScore,
      status: statusFromScore(guestScore),
      alreadyConnected: [
        ...addIf(hasGuests, 'Lista de invitados'),
        ...addIf(hasPublicInvite, 'Invitación/página pública'),
        ...addIf(hasTables, 'Mesas o distribución'),
        ...addIf(hasMusic, 'Música o pedidos de canciones'),
        ...addIf(hasLiveWall, 'Fotos/mensajes para muro social'),
      ],
      missingToClose: [
        ...addIf(!hasGuestQr, 'QR/link personal por invitado'),
        ...addIf(!hasTables, 'Mesa visible para cada invitado'),
        ...addIf(!hasProgram, 'Programa corto de la fiesta'),
        ...addIf(!hasMusic, 'Pedido de canción desde el celular'),
        ...addIf(!hasPostEvent, 'Recuerdos después de la fiesta'),
      ],
      nextPrWork: [
        'Unificar invitación, RSVP, mesa, ubicación, programa, música y recuerdos en un solo link.',
        'Preparar vista de portero/check-in sin entorpecer el trabajo del evento.',
        'Dejar datos listos para que la IA detecte invitados sin confirmar o sin mesa.',
      ],
      href: withFiestaId('/fiestas/nueva/invitados', fiestaId),
    },
    {
      id: 'fiesta_en_vivo',
      title: 'Fiesta interactiva en vivo',
      salesName: 'La pantalla y el celular de los invitados trabajan juntos',
      clientPromise: 'La fiesta tiene participación: fotos, mensajes, canciones, votaciones, entretenimiento y galería final.',
      score: liveScore,
      status: statusFromScore(liveScore),
      alreadyConnected: [
        ...addIf(hasLiveWall, 'Muro social o evento en vivo'),
        ...addIf(hasScreen, 'Pantalla LED / modo pantalla'),
        ...addIf(hasMusic, 'Canciones o música'),
        ...addIf(hasEntertainment, 'Fotocabina, 360 u otra estación de entretenimiento'),
        ...addIf(hasPostEvent, 'Galería o post-fiesta'),
      ],
      missingToClose: [
        ...addIf(!hasLiveWall, 'Entrada simple de fotos/mensajes por QR'),
        ...addIf(!hasScreen, 'Modo pantalla final para operar en la fiesta'),
        ...addIf(!hasVoting, 'Votaciones/juegos simples para participación'),
        ...addIf(!hasEntertainment, 'Integrar entretenimiento con muro/pantalla'),
        ...addIf(!hasPostEvent, 'Guardar todo como recuerdo final'),
      ],
      nextPrWork: [
        'Crear modo operador en vivo: pendiente, aprobado, pantalla y guardado final.',
        'Conectar fotocabina/360/mensajes/canciones/votaciones al mismo flujo.',
        'Generar galería final automáticamente desde lo vivido en la fiesta.',
      ],
      href: withFiestaId('/fiestas/nueva/en-vivo', fiestaId),
    },
    {
      id: 'zona_digital',
      title: 'Zona tecnologica de fiesta',
      salesName: 'Zona digital, estaciones virales, barra, totems y pantalla en vivo',
      clientPromise: 'Los invitados participan con QR, retos, juegos, fotos, videos, pedidos de barra, totems y visuales de pista segun lo contratado.',
      score: digitalZoneScore,
      status: statusFromScore(digitalZoneScore),
      alreadyConnected: [
        ...addIf(hasZonaDigital, 'Zona digital adolescente'),
        ...addIf(hasLiveWall, 'Muro social para fotos y mensajes'),
        ...addIf(hasScreen, 'Pantalla LED o modo pantalla'),
        ...addIf(hasDigitalChallenges, 'Retos, juegos o votaciones'),
        ...addIf(hasEntertainment, 'Fotocabina, 360, Bogue o espejo magico'),
        ...addIf(hasBarTechnology, 'Barra tecnologica'),
        ...addIf(hasTotems, 'Totems o pantallas por sectores'),
        ...addIf(hasAudioRhythm, 'Modo audiorritmico para baile'),
        ...addIf(hasPostEvent, 'Galeria o recuerdo post-fiesta'),
      ],
      missingToClose: [
        ...addIf(!hasZonaDigital, 'Activar zona digital por fiesta'),
        ...addIf(!hasLiveWall, 'Conectar fotos/mensajes con muro social'),
        ...addIf(!hasScreen, 'Preparar pantalla LED o totem visible'),
        ...addIf(!hasDigitalChallenges, 'Configurar retos, juegos, votaciones o emojis'),
        ...addIf(!hasEntertainment, 'Definir estaciones: fotocabina, 360, Bogue o espejo'),
        ...addIf(!hasBarTechnology, 'Conectar barra tecnologica si se vende ese servicio'),
        ...addIf(!hasTotems, 'Configurar totems si se muestran por sectores'),
        ...addIf(!hasAudioRhythm, 'Agregar modo visual audiorritmico para pista'),
        ...addIf(!hasPostEvent, 'Dejar salida de galeria/recuerdos para despues'),
      ],
      nextPrWork: [
        'Mostrar la zona tecnologica como paquete comercial activable.',
        'Separar lo incluido, opcional y apagado para no prometer modulos no contratados.',
        'Usar pantalla LED para explicar como invitados, barra, fotos y totems trabajan juntos.',
      ],
      href: withFiestaId('/fiestas/nueva/zona-digital', fiestaId),
    },
    {
      id: 'ia_operativa',
      title: 'IA operativa por fiesta',
      salesName: 'Cada fiesta tiene control inteligente de pendientes reales',
      clientPromise: 'La IA revisa invitados, pagos, documentos, salón, personal, música, tareas y post-fiesta.',
      score: aiScore,
      status: statusFromScore(aiScore),
      alreadyConnected: [
        ...addIf(hasGuests, 'Invitados'),
        ...addIf(hasPayments, 'Pagos o plan de pagos'),
        ...addIf(hasDocs, 'Documentos o contrato'),
        ...addIf(hasStaff, 'Personal asignado'),
        ...addIf(hasTasks, 'Tareas'),
        ...addIf(hasMeetings, 'Reuniones'),
      ],
      missingToClose: [
        ...addIf(!hasPayments, 'Pagos/plan de pagos conectado al control IA'),
        ...addIf(!hasDocs, 'Documentos/contratos conectados a la fiesta'),
        ...addIf(!hasStaff, 'Personal y responsables cargados'),
        ...addIf(!hasTasks, 'Tareas reales para que la IA pueda accionar'),
        ...addIf(!hasPostEvent, 'Cierre post-fiesta para aprendizaje y marketing'),
      ],
      nextPrWork: [
        'Crear panel IA que detecte faltantes sin que el usuario pregunte.',
        'Agregar botones: crear tarea, preparar WhatsApp, marcar resuelto y abrir módulo.',
        'Guardar aprendizaje de cada fiesta para mejorar futuras fiestas.',
      ],
      href: fiestaId ? eventHref(fiestaId, 'ia-operativa-ak') : '/multiagente',
    },
  ];

  const globalScore = Math.round(products.reduce((total, product) => total + product.score, 0) / products.length);

  return {
    eventName,
    globalScore,
    status: statusFromScore(globalScore),
    salesMessage: globalScore >= 80
      ? 'Esta fiesta ya se puede mostrar como experiencia tecnológica AK.'
      : globalScore >= 45
        ? 'La base tecnológica existe, pero falta cerrar conexiones para venderla con fuerza.'
        : 'La fiesta todavía necesita cargar datos base para mostrar tecnología real.',
    products,
    strongestProof: products.flatMap((product) => product.alreadyConnected.map((proof) => `${product.title}: ${proof}`)).slice(0, 8),
    nextWork: products.flatMap((product) => product.nextPrWork).slice(0, 8),
  };
}
