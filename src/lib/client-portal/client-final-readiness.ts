import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type ClientFinalAreaId = 'portada' | 'organizacion' | 'contable' | 'invitados' | 'contacto' | 'post_evento';

export type ClientFinalArea = {
  id: ClientFinalAreaId;
  title: string;
  simpleGoal: string;
  clientWords: string;
  href: string;
  required: Array<(fiesta?: FiestaEnPlanificacion | null) => boolean>;
};

export type ClientFinalAreaResult = Omit<ClientFinalArea, 'required'> & {
  ready: boolean;
  completedChecks: number;
  totalChecks: number;
};

function hasPortal(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientPortalSettings?.enabled);
}

function hasAccessKey(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientPortalSettings?.accessKey?.trim());
}

function hasEventName(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientePortalExperience?.eventDisplayName || fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.tipoCelebracion);
}

function hasCoverOrColor(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientePortalExperience?.heroImageUrl || fiesta?.clientePortalExperience?.primaryColor || fiesta?.configuracion?.protagonistaFotoUrl);
}

function visibleModule(moduleName: keyof NonNullable<FiestaEnPlanificacion['clientPortalSettings']>) {
  return (fiesta?: FiestaEnPlanificacion | null) => {
    const moduleValue = fiesta?.clientPortalSettings?.[moduleName];
    return Boolean(moduleValue && typeof moduleValue === 'object' && 'visible' in moduleValue && moduleValue.visible);
  };
}

export const CLIENT_FINAL_AREAS: ClientFinalArea[] = [
  {
    id: 'portada',
    title: 'Portada y bienvenida',
    simpleGoal: 'Que el cliente entre desde el celular y entienda que esta en su evento.',
    clientWords: 'Nombre, foto/color, mensaje inicial y link privado.',
    href: '/fiestas/nueva/portal-cliente',
    required: [hasPortal, hasAccessKey, hasEventName, hasCoverOrColor],
  },
  {
    id: 'organizacion',
    title: 'Organizacion del evento',
    simpleGoal: 'Que musica, cronograma, reuniones, menu y fotos aparezcan ordenados por bloques.',
    clientWords: 'El cliente participa solo donde tiene que participar.',
    href: '/fiestas/nueva/itinerario',
    required: [visibleModule('itinerario'), visibleModule('musica'), visibleModule('fotografiaYFilmacion')],
  },
  {
    id: 'contable',
    title: 'Contable claro',
    simpleGoal: 'Que presupuesto, contrato, pagos, saldo y servicios no esten repartidos.',
    clientWords: 'El cliente sabe que contrato tiene, que compro y que falta pagar.',
    href: '/fiestas/nueva/plan-pagos',
    required: [visibleModule('pagos'), visibleModule('contrato'), visibleModule('serviciosContratados')],
  },
  {
    id: 'invitados',
    title: 'Invitados y cambios',
    simpleGoal: 'Que se vea cuantos confirmaron y que pedir mas invitados no sea por mensajes sueltos.',
    clientWords: 'Confirmados, pendientes y simulador para agregar personas.',
    href: '/fiestas/nueva/invitados',
    required: [visibleModule('invitados'), visibleModule('simuladorInvitados')],
  },
  {
    id: 'contacto',
    title: 'Un solo contacto con AK',
    simpleGoal: 'Que no haya tres botones distintos para escribir lo mismo.',
    clientWords: 'Un lugar claro para mandar mensaje y consultar dudas.',
    href: '/fiestas/nueva/portal-cliente',
    required: [visibleModule('notasCliente'), visibleModule('faq')],
  },
  {
    id: 'post_evento',
    title: 'Despues de la fiesta',
    simpleGoal: 'Que fotos, video, album y entregas finales tengan lugar propio.',
    clientWords: 'El cliente vuelve al portal para ver recuerdos y entregas.',
    href: '/fiestas/nueva/post-evento',
    required: [visibleModule('fotografiaYFilmacion'), visibleModule('documentos')],
  },
];

export function buildClientFinalReadiness(fiesta?: FiestaEnPlanificacion | null): ClientFinalAreaResult[] {
  return CLIENT_FINAL_AREAS.map((area) => {
    const completedChecks = area.required.filter((check) => check(fiesta)).length;
    return {
      id: area.id,
      title: area.title,
      simpleGoal: area.simpleGoal,
      clientWords: area.clientWords,
      href: area.href,
      completedChecks,
      totalChecks: area.required.length,
      ready: completedChecks === area.required.length,
    };
  });
}

export function getClientFinalScore(fiesta?: FiestaEnPlanificacion | null): number {
  const areas = buildClientFinalReadiness(fiesta);
  const total = areas.reduce((sum, area) => sum + area.totalChecks, 0);
  const completed = areas.reduce((sum, area) => sum + area.completedChecks, 0);
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
