export const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/landing',
  '/evento/actual',
  '/evento/social',
  '/evento/accesos',
  '/evento/barra',
  '/evento/totem',
  '/evento/muro-en-vivo',
  '/evento/logistica',
  '/evento/video-vida',
  '/evento/zona-digital',
  '/invitacion',
  '/video-vida',
  '/feedback',
  '/portal',
  '/simulador-de-presupuesto',
  '/acceso-personal',
  '/public',
  '/portal-cliente',
  '/simulador',
  '/simulador-ak',
  '/simulador-v2',
  '/proveedor',
  '/presentacion',
  '/presentacion-led',
  '/evento/mi-mesa',
  '/evento/en-vivo',
  '/evento/dj',
  '/evento/hub',
  '/evento/fotocabina',
  '/evento/plataforma-360',
  '/evento/touchpix',
  '/evento/espejo-magico',
  '/evento/bogue',
  '/evento/buzon',
  '/invitado',
  '/portal-proveedor',
  '/club-uruguay',
] as const;

export const PUBLIC_EXACT_PATHS = new Set(['/', '/evento', '/evento/', '/api/health']);

export const BUDGET_VIEW_REGEX = /^\/presupuestos\/[^/]+\/ver\/?$/;

export function isPublicPathPrefix(pathname: string) {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}
