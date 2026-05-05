export interface PreparationCheck {
  id: string;
  label: string;
  completed: boolean;
  detail: string;
  href?: string;
}

export interface PreparationScore {
  score: number;
  level: 'alta' | 'media' | 'inicial';
  label: string;
  summary: string;
  checks: PreparationCheck[];
  importantPending: PreparationCheck[];
}

function hasText(value?: unknown) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function hasArray(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function hasUsefulValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return hasText(value);
  if (typeof value === 'number') return Number.isFinite(value) && value !== 0;
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasUsefulValue);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).some(hasUsefulValue);
  return false;
}

function hasObjectData(value: unknown) {
  return Boolean(value && typeof value === 'object' && hasUsefulValue(value));
}

function hasAssignedStaff(fiesta: any) {
  return Array.isArray(fiesta?.personalAsignado)
    && fiesta.personalAsignado.some((item: any) => hasText(item?.empleadoId));
}

function hasMenuMesaData(menuMesa: any) {
  return Boolean(menuMesa && (
    hasText(menuMesa.entrada)
    || hasText(menuMesa.platoPrincipal)
    || hasText(menuMesa.adolescentes)
    || hasText(menuMesa.postres)
    || hasText(menuMesa.bebidas)
    || hasText(menuMesa.titulo)
  ));
}

function hasPortalMenuData(menuSeleccionPortal: any) {
  return Boolean(menuSeleccionPortal && (
    hasText(menuSeleccionPortal.entrada)
    || hasText(menuSeleccionPortal.principal)
    || hasText(menuSeleccionPortal.postre)
    || hasText(menuSeleccionPortal.bebidas)
    || hasText(menuSeleccionPortal.restriccionesAlimentarias)
    || menuSeleccionPortal.confirmado === true
  ));
}

function hasFoodCategoryData(value: any) {
  return Array.isArray(value?.categorias)
    && value.categorias.some((category: any) => category?.activada === true || hasArray(category?.items));
}

function hasMenuData(fiesta: any) {
  return hasText(fiesta?.menuAsignadoId)
    || hasMenuMesaData(fiesta?.menuMesa)
    || hasPortalMenuData(fiesta?.menuSeleccionPortal)
    || hasFoodCategoryData(fiesta?.bebidas)
    || hasFoodCategoryData(fiesta?.reposteria)
    || hasObjectData(fiesta?.cartaTragos)
    || hasObjectData(fiesta?.catering);
}

function hasDocumentPaymentData(fiesta: any) {
  return hasText(fiesta?.presupuestoId)
    || hasArray(fiesta?.invoiceIds)
    || hasObjectData(fiesta?.contratoGenerado)
    || fiesta?.contratoFirmaInfo?.isSigned === true
    || hasObjectData(fiesta?.contratoDatos)
    || hasArray(fiesta?.othersDocumentos)
    || hasArray(fiesta?.planDePagos?.cuotas)
    || hasArray(fiesta?.clientPaymentNotifications);
}

function eventHref(fiestaId: string | undefined, path: string) {
  return fiestaId ? `${path}?fiestaId=${fiestaId}` : path;
}

export function calculateFiestaPreparationScore(fiesta: any): PreparationScore {
  const fiestaId = fiesta?.id;
  const config = fiesta?.configuracion || {};
  const tareas = fiesta?.tareas || [];
  const pendientes = Array.isArray(tareas) ? tareas.filter((t: any) => !t.completada) : [];
  const tareasCompletadas = Array.isArray(tareas) && tareas.length > 0 && pendientes.length <= Math.ceil(tareas.length * 0.35);

  const checks: PreparationCheck[] = [
    {
      id: 'configuracion',
      label: 'Datos principales',
      completed: hasText(config.nombreEvento) && hasText(config.fechaEvento) && hasText(config.nombreLugar),
      detail: 'Nombre, fecha y lugar del evento.',
      href: eventHref(fiestaId, '/fiestas/nueva/configuracion'),
    },
    {
      id: 'cliente',
      label: 'Cliente vinculado',
      completed: hasText(config.clienteId) || hasText(config.clienteNombre),
      detail: 'Cliente o responsable identificado.',
      href: eventHref(fiestaId, '/fiestas/nueva/configuracion'),
    },
    {
      id: 'invitados',
      label: 'Invitados',
      completed: hasArray(fiesta?.invitados) || Number(config.invitadosEstimados || 0) > 0,
      detail: 'Cantidad estimada o lista de invitados cargada.',
      href: eventHref(fiestaId, '/fiestas/nueva/invitados'),
    },
    {
      id: 'catering',
      label: 'Catering / menú',
      completed: hasMenuData(fiesta),
      detail: 'Menú, catering o datos gastronómicos definidos.',
      href: eventHref(fiestaId, '/fiestas/nueva/catering'),
    },
    {
      id: 'decoracion',
      label: 'Decoración',
      completed: hasObjectData(fiesta?.decoracion),
      detail: 'Paleta, ideas, zonas o elementos de decoración.',
      href: eventHref(fiestaId, '/fiestas/nueva/decoracion'),
    },
    {
      id: 'musica',
      label: 'Música',
      completed: hasObjectData(fiesta?.musica) || hasObjectData(fiesta?.listaMusicaPortal),
      detail: 'Entrada, vals, canciones o indicaciones musicales.',
      href: eventHref(fiestaId, '/fiestas/nueva/musica'),
    },
    {
      id: 'personal',
      label: 'Personal asignado',
      completed: hasAssignedStaff(fiesta),
      detail: 'Equipo asignado para el evento.',
      href: eventHref(fiestaId, '/fiestas/nueva/personal'),
    },
    {
      id: 'documentos',
      label: 'Documentos / pagos',
      completed: hasDocumentPaymentData(fiesta),
      detail: 'Contrato, pagos, documentos o gestión financiera.',
      href: eventHref(fiestaId, '/fiestas/nueva/gestion-documental'),
    },
    {
      id: 'tareas',
      label: 'Tareas internas',
      completed: tareasCompletadas,
      detail: tareas.length > 0 ? `${pendientes.length} pendiente(s) de ${tareas.length}.` : 'Todavía no hay tareas cargadas.',
      href: eventHref(fiestaId, '/fiestas/nueva/tareas'),
    },
    {
      id: 'portal',
      label: 'Portal cliente',
      completed: Boolean(fiesta?.portalSettings?.enabled || fiesta?.clientPortalSettings?.enabled),
      detail: 'Portal del cliente activado o configurado.',
      href: eventHref(fiestaId, '/fiestas/nueva/portal-cliente'),
    },
  ];

  const completed = checks.filter(c => c.completed).length;
  const score = Math.round((completed / checks.length) * 100);
  const importantPending = checks.filter(c => !c.completed).slice(0, 5);

  const level = score >= 75 ? 'alta' : score >= 45 ? 'media' : 'inicial';
  const label = level === 'alta' ? 'Muy encaminada' : level === 'media' ? 'En proceso' : 'Para ordenar';
  const summary = importantPending.length
    ? `Hay ${importantPending.length} punto(s) importantes para revisar.`
    : 'La fiesta está muy bien encaminada.';

  return { score, level, label, summary, checks, importantPending };
}
