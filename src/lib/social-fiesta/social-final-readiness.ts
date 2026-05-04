import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type SocialFinalAreaId = 'invitacion' | 'rsvp' | 'muro' | 'moderacion' | 'pantalla' | 'juegos' | 'post_evento';

export type SocialFinalArea = {
  id: SocialFinalAreaId;
  title: string;
  simpleGoal: string;
  operatorCheck: string;
  href: string;
  required: Array<(fiesta?: FiestaEnPlanificacion | null) => boolean>;
};

export type SocialFinalAreaResult = Omit<SocialFinalArea, 'required'> & {
  ready: boolean;
  completedChecks: number;
  totalChecks: number;
};

function hasEventName(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.configuracion?.nombreEvento || fiesta?.configuracion?.tipoCelebracion);
}

function hasGuestModule(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientPortalSettings?.invitados?.visible || fiesta?.clientPortalSettings?.paginaPublica?.visible);
}

function hasPortalAccess(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientPortalSettings?.accessKey?.trim());
}

function hasVisualIdentity(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientePortalExperience?.heroImageUrl || fiesta?.clientePortalExperience?.primaryColor || fiesta?.configuracion?.protagonistaFotoUrl);
}

function hasPhotoVideo(fiesta?: FiestaEnPlanificacion | null): boolean {
  return Boolean(fiesta?.clientPortalSettings?.fotografiaYFilmacion?.visible);
}

function alwaysReady(): boolean {
  return true;
}

export const SOCIAL_FINAL_AREAS: SocialFinalArea[] = [
  {
    id: 'invitacion',
    title: 'Invitacion y QR',
    simpleGoal: 'Que el invitado entre desde el celular sin pedir explicaciones.',
    operatorCheck: 'Probar link, QR, portada y nombre visible del evento.',
    href: '/fiestas/nueva/pagina-web',
    required: [hasEventName, hasPortalAccess, hasVisualIdentity],
  },
  {
    id: 'rsvp',
    title: 'Confirmaciones RSVP',
    simpleGoal: 'Saber cuantos vienen, cuantos faltan y que cambios pide el cliente.',
    operatorCheck: 'Revisar confirmados, pendientes, acompanantes y grupos.',
    href: '/fiestas/nueva/invitados',
    required: [hasGuestModule],
  },
  {
    id: 'muro',
    title: 'Muro social',
    simpleGoal: 'Fotos y mensajes de la gente en un lugar lindo y controlado.',
    operatorCheck: 'Abrir muro, probar carga de contenido y revisar estado vacio.',
    href: '/fiestas/nueva/muro-social',
    required: [hasEventName, hasVisualIdentity],
  },
  {
    id: 'moderacion',
    title: 'Moderacion',
    simpleGoal: 'Nada sale a pantalla gigante sin control de AK.',
    operatorCheck: 'Definir quien aprueba, oculta y destaca contenido durante la fiesta.',
    href: '/fiestas/nueva/social-fiesta-pro',
    required: [alwaysReady],
  },
  {
    id: 'pantalla',
    title: 'Pantalla gigante',
    simpleGoal: 'El contenido se ve profesional, sin textos cortados ni informacion sensible.',
    operatorCheck: 'Probar en monitor grande antes del evento.',
    href: '/fiestas/nueva/en-vivo',
    required: [hasEventName, hasVisualIdentity],
  },
  {
    id: 'juegos',
    title: 'Juegos y sorteos',
    simpleGoal: 'Activar dinamicas solo si aportan a la fiesta y no confunden.',
    operatorCheck: 'Elegir juegos por tipo de evento y dejar instrucciones simples.',
    href: '/fiestas/nueva/social-fiesta-pro',
    required: [alwaysReady],
  },
  {
    id: 'post_evento',
    title: 'Recuerdos despues',
    simpleGoal: 'Que fotos, videos y album final tengan continuidad despues de la fiesta.',
    operatorCheck: 'Dejar preparado donde se entregan recuerdos y archivos finales.',
    href: '/fiestas/nueva/post-evento',
    required: [hasPhotoVideo],
  },
];

export function buildSocialFinalReadiness(fiesta?: FiestaEnPlanificacion | null): SocialFinalAreaResult[] {
  return SOCIAL_FINAL_AREAS.map((area) => {
    const completedChecks = area.required.filter((check) => check(fiesta)).length;
    return {
      id: area.id,
      title: area.title,
      simpleGoal: area.simpleGoal,
      operatorCheck: area.operatorCheck,
      href: area.href,
      completedChecks,
      totalChecks: area.required.length,
      ready: completedChecks === area.required.length,
    };
  });
}

export function getSocialFinalScore(fiesta?: FiestaEnPlanificacion | null): number {
  const areas = buildSocialFinalReadiness(fiesta);
  const total = areas.reduce((sum, area) => sum + area.totalChecks, 0);
  const completed = areas.reduce((sum, area) => sum + area.completedChecks, 0);
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
