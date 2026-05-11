export type Ak100Status = 'listo' | 'falta_cerrar' | 'pendiente';

export type Ak100AreaId =
  | 'venta'
  | 'cliente'
  | 'invitado'
  | 'operacion'
  | 'ia'
  | 'tecnologia'
  | 'post_fiesta'
  | 'instalacion';

export type Ak100Area = {
  id: Ak100AreaId;
  title: string;
  score: number;
  status: Ak100Status;
  promise: string;
  ready: string[];
  missing: string[];
  actionLabel: string;
  href: string;
};

export type Ak100Readiness = {
  eventName: string;
  globalScore: number;
  status: Ak100Status;
  message: string;
  areas: Ak100Area[];
  nextWork: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function count(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length;
  return 0;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function textOr(value: unknown, fallback: string): string {
  return hasText(value) ? String(value).trim() : fallback;
}

function score(checks: boolean[]): number {
  if (!checks.length) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function statusFromScore(value: number): Ak100Status {
  if (value >= 90) return 'listo';
  if (value >= 55) return 'falta_cerrar';
  return 'pendiente';
}

function addIf(condition: boolean, text: string): string[] {
  return condition ? [text] : [];
}

function eventHref(fiestaId: string, path: string): string {
  return fiestaId ? `/fiestas/${encodeURIComponent(fiestaId)}/${path}` : '/eventos';
}

function eventQueryHref(fiestaId: string, path: string): string {
  return fiestaId ? `${path}?fiestaId=${encodeURIComponent(fiestaId)}` : path;
}

function portalHref(fiestaId: string, accessKey: unknown): string {
  if (hasText(accessKey)) return `/portal/c/${encodeURIComponent(String(accessKey).trim())}`;
  return eventHref(fiestaId, 'comando-total');
}

export function buildAk100Readiness(fiestaInput: unknown): Ak100Readiness {
  const fiesta = asRecord(fiestaInput);
  const cfg = asRecord(fiesta.configuracion);
  const fiestaId = textOr(fiesta.id, '');
  const portal = asRecord(fiesta.clientPortalSettings);
  const portalExperience = asRecord(fiesta.clientePortalExperience);
  const social = asRecord(fiesta.socialGallerySettings);
  const live = asRecord(fiesta.eventoEnVivo);
  const planPagos = asRecord(fiesta.planDePagos);
  const contratoFirma = asRecord(fiesta.contratoFirmaInfo);
  const contratoGenerado = asRecord(fiesta.contratoGenerado);
  const guestSettings = asRecord(fiesta.guestExperienceSettings);
  const others = asRecord(fiesta.others);

  const invitados = list(fiesta.invitados);
  const tareas = list(fiesta.tareas);
  const personal = list(fiesta.personalAsignado);
  const eventName = textOr(cfg.nombreEvento, textOr(cfg.tipoCelebracion, 'Fiesta AK'));

  const hasBudget = hasText(fiesta.presupuestoId) || count(planPagos.cuotas) > 0;
  const hasContract = contratoFirma.isSigned === true || hasText(contratoGenerado.tipo) || hasText(contratoFirma.signedAt);
  const hasClient = hasText(cfg.clienteId) || hasText(cfg.clienteNombre) || portal.enabled === true;
  const hasPortal = portal.enabled === true || hasText(portal.accessKey) || hasText(portalExperience.heroImageUrl);
  const hasPayments = count(planPagos.cuotas) > 0 || count(fiesta.pagos) > 0 || count(fiesta.clientPaymentNotifications) > 0;
  const hasDocs = count(fiesta.othersDocumentos) > 0 || hasContract;
  const hasGuests = invitados.length > 0;
  const hasTables = invitados.some((guest) => {
    const item = asRecord(guest);
    return hasText(item.mesa) || hasText(item.mesaId) || hasText(item.numeroMesa) || hasText(item.tableNumber);
  }) || count(fiesta.numerosMesa) > 0 || count(fiesta.menuMesa) > 0;
  const hasInvite = hasText(fiesta.invitacionSlug) || guestSettings.enabled === true;
  const hasCheckin = count(fiesta.checkin) > 0 || count(fiesta.portero) > 0 || guestSettings.checkinEnabled === true;
  const hasMusic = count(fiesta.musica) > 0 || count(fiesta.listaMusicaPortal) > 0 || count(live.solicitudesCanciones) > 0;
  const hasProgram = count(fiesta.programa) > 0 || count(fiesta.timeline) > 0;
  const hasFood = count(fiesta.menu) > 0 || count(fiesta.planGastronomico) > 0 || count(fiesta.catering) > 0;
  const hasStaff = personal.length > 0;
  const hasCarga = count(fiesta.listaDeCargaOperativa) > 0 || count(fiesta.cargaOperativa) > 0;
  const hasScreen = count(social.screenMediaLibrary) > 0 || asRecord(social.screenMode).enabled === true || count(fiesta.screenPlaylist) > 0;
  const hasLiveWall = social.enabled === true || count(live.fotos) > 0 || count(live.mensajes) > 0;
  const hasEntertainment = count(asRecord(others.entretenimiento)) > 0 || count(fiesta.entertainmentModules) > 0;
  const hasAiTasks = tareas.length > 0 || count(fiesta.controlTowerItems) > 0 || count(fiesta.agentActions) > 0;
  const hasPlanB = count(fiesta.planB) > 0 || count(fiesta.contingencias) > 0;
  const hasPost = hasText(fiesta.galeriaUrl) || fiesta.galeriaEntregada === true || fiesta.postEventoCompletado === true;
  const hasTestimonial = hasText(fiesta.testimonioCliente) || hasText(fiesta.reviewUrl);
  const hasInstall = true;

  const areaInputs: Ak100Area[] = [];

  const ventaScore = score([hasBudget, hasContract, hasClient, hasPayments, hasDocs]);
  areaInputs.push({
    id: 'venta', title: 'Venta cerrada y sincronizada', score: ventaScore, status: statusFromScore(ventaScore),
    promise: 'El cliente pasa de prospecto a presupuesto, contrato, pagos y fiesta sin quedar cortado.',
    ready: [...addIf(hasBudget, 'Presupuesto vinculado'), ...addIf(hasContract, 'Contrato o firma registrada'), ...addIf(hasClient, 'Cliente vinculado'), ...addIf(hasPayments, 'Pagos o cuotas visibles'), ...addIf(hasDocs, 'Documentos conectados')],
    missing: [...addIf(!hasBudget, 'Falta presupuesto vinculado'), ...addIf(!hasContract, 'Falta contrato/firma'), ...addIf(!hasClient, 'Falta cliente claro'), ...addIf(!hasPayments, 'Falta plan de pagos'), ...addIf(!hasDocs, 'Faltan documentos')],
    actionLabel: 'Abrir ciclo comercial', href: '/contabilidad/crm/ciclo-comercial',
  });

  const clienteScore = score([hasPortal, hasPayments, hasDocs, hasProgram, hasGuests]);
  areaInputs.push({
    id: 'cliente', title: 'Portal cliente premium', score: clienteScore, status: statusFromScore(clienteScore),
    promise: 'El cliente ve avance, pagos, documentos, programa e invitados sin perseguir al organizador.',
    ready: [...addIf(hasPortal, 'Portal activo'), ...addIf(hasPayments, 'Pagos visibles'), ...addIf(hasDocs, 'Documentos visibles'), ...addIf(hasProgram, 'Programa cargado'), ...addIf(hasGuests, 'Invitados cargados')],
    missing: [...addIf(!hasPortal, 'Falta portal activo'), ...addIf(!hasPayments, 'Faltan pagos visibles'), ...addIf(!hasDocs, 'Faltan documentos'), ...addIf(!hasProgram, 'Falta programa'), ...addIf(!hasGuests, 'Faltan invitados')],
    actionLabel: 'Abrir portal cliente', href: portalHref(fiestaId, portal.accessKey),
  });

  const invitadoScore = score([hasGuests, hasInvite, hasTables, hasCheckin, hasMusic, hasLiveWall]);
  areaInputs.push({
    id: 'invitado', title: 'Experiencia real del invitado', score: invitadoScore, status: statusFromScore(invitadoScore),
    promise: 'El invitado confirma, ve mesa, usa QR, participa con música/fotos y queda en recuerdos.',
    ready: [...addIf(hasGuests, 'Lista de invitados'), ...addIf(hasInvite, 'Invitación o QR'), ...addIf(hasTables, 'Mesas'), ...addIf(hasCheckin, 'Check-in/portero'), ...addIf(hasMusic, 'Música'), ...addIf(hasLiveWall, 'Muro social')],
    missing: [...addIf(!hasGuests, 'Faltan invitados'), ...addIf(!hasInvite, 'Falta invitación/QR'), ...addIf(!hasTables, 'Faltan mesas'), ...addIf(!hasCheckin, 'Falta check-in'), ...addIf(!hasMusic, 'Falta música del invitado'), ...addIf(!hasLiveWall, 'Falta muro social')],
    actionLabel: 'Abrir invitados', href: eventQueryHref(fiestaId, '/fiestas/nueva/invitados'),
  });

  const operacionScore = score([hasFood, hasStaff, hasCarga, hasProgram, hasPlanB]);
  areaInputs.push({
    id: 'operacion', title: 'Operación del evento', score: operacionScore, status: statusFromScore(operacionScore),
    promise: 'El equipo llega con comida, personal, carga, horarios y plan B claros.',
    ready: [...addIf(hasFood, 'Comida/menú'), ...addIf(hasStaff, 'Personal'), ...addIf(hasCarga, 'Carga operativa'), ...addIf(hasProgram, 'Programa'), ...addIf(hasPlanB, 'Plan B')],
    missing: [...addIf(!hasFood, 'Falta comida/menú'), ...addIf(!hasStaff, 'Falta personal'), ...addIf(!hasCarga, 'Falta carga operativa'), ...addIf(!hasProgram, 'Falta programa'), ...addIf(!hasPlanB, 'Falta plan B')],
    actionLabel: 'Abrir comando total', href: eventHref(fiestaId, 'comando-total'),
  });

  const iaScore = score([hasAiTasks, hasBudget, hasGuests, hasPayments, hasStaff, hasPost]);
  areaInputs.push({
    id: 'ia', title: 'IA operativa real', score: iaScore, status: statusFromScore(iaScore),
    promise: 'La IA detecta faltantes y empuja tareas/mensajes reales por fiesta.',
    ready: [...addIf(hasAiTasks, 'Tareas/acciones'), ...addIf(hasBudget, 'Presupuesto'), ...addIf(hasGuests, 'Invitados'), ...addIf(hasPayments, 'Pagos'), ...addIf(hasStaff, 'Personal'), ...addIf(hasPost, 'Post-fiesta')],
    missing: [...addIf(!hasAiTasks, 'Faltan acciones IA'), ...addIf(!hasBudget, 'Falta presupuesto'), ...addIf(!hasGuests, 'Faltan invitados'), ...addIf(!hasPayments, 'Faltan pagos'), ...addIf(!hasStaff, 'Falta personal'), ...addIf(!hasPost, 'Falta post-fiesta')],
    actionLabel: 'Abrir control IA', href: eventHref(fiestaId, 'comando-total'),
  });

  const tecnologiaScore = score([hasPortal, hasInvite, hasScreen, hasLiveWall, hasEntertainment]);
  areaInputs.push({
    id: 'tecnologia', title: 'Tecnología vendible AK', score: tecnologiaScore, status: statusFromScore(tecnologiaScore),
    promise: 'La tecnología se muestra como diferencial comercial, no como módulos escondidos.',
    ready: [...addIf(hasPortal, 'Portal'), ...addIf(hasInvite, 'QR/invitación'), ...addIf(hasScreen, 'Pantalla'), ...addIf(hasLiveWall, 'Muro social'), ...addIf(hasEntertainment, 'Entretenimiento conectado')],
    missing: [...addIf(!hasPortal, 'Falta portal'), ...addIf(!hasInvite, 'Falta QR/invitación'), ...addIf(!hasScreen, 'Falta pantalla'), ...addIf(!hasLiveWall, 'Falta muro social'), ...addIf(!hasEntertainment, 'Falta entretenimiento conectado')],
    actionLabel: 'Abrir Tecnología AK', href: eventHref(fiestaId, 'experiencia-tecnologica-ak'),
  });

  const postScore = score([hasPost, hasLiveWall, hasTestimonial]);
  areaInputs.push({
    id: 'post_fiesta', title: 'Post-fiesta y marketing', score: postScore, status: statusFromScore(postScore),
    promise: 'Después de la fiesta quedan recuerdos, testimonio y material para vender mejor.',
    ready: [...addIf(hasPost, 'Galería/recuerdos'), ...addIf(hasLiveWall, 'Contenido generado'), ...addIf(hasTestimonial, 'Testimonio/reseña')],
    missing: [...addIf(!hasPost, 'Falta galería final'), ...addIf(!hasLiveWall, 'Falta contenido de invitados'), ...addIf(!hasTestimonial, 'Falta testimonio/reseña')],
    actionLabel: 'Abrir recuerdos y tecnología', href: eventHref(fiestaId, 'experiencia-tecnologica-ak'),
  });

  const installScore = score([hasInstall]);
  areaInputs.push({
    id: 'instalacion', title: 'Instalación Android y PC', score: installScore, status: statusFromScore(installScore),
    promise: 'La plataforma puede instalarse como app en Android y PC cuando el navegador lo permite.',
    ready: ['PWA preparada para instalación'], missing: [], actionLabel: 'Instalar app', href: '/settings/instalar-app',
  });

  const globalScore = Math.round(areaInputs.reduce((sum, area) => sum + area.score, 0) / areaInputs.length);

  return {
    eventName,
    globalScore,
    status: statusFromScore(globalScore),
    message: globalScore >= 90
      ? 'Esta fiesta está prácticamente lista para venderse y operarse como experiencia tecnológica AK.'
      : globalScore >= 55
        ? 'La base está creada, pero faltan cierres concretos antes de prometer 100% operativo.'
        : 'Faltan datos base para usar esta fiesta como experiencia AK completa.',
    areas: areaInputs,
    nextWork: areaInputs.flatMap((area) => area.missing.map((item) => `${area.title}: ${item}`)).slice(0, 10),
  };
}
