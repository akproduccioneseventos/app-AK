export const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/landing',
  '/evento/actual',
  '/evento/social',
  '/evento/barra',
  '/evento/totem',
  '/evento/muro-en-vivo',
  '/evento/logistica',
  '/evento/video-vida',
  '/evento/zona-digital',
  '/invitacion',
  '/portal-invitado',
  '/i',
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
  '/evento/galeria',
  '/evento/dj',
  '/evento/hub',
  '/evento/fotocabina',
  '/evento/plataforma-360',
  '/evento/touchpix',
  '/evento/espejo-magico',
  '/evento/bogue',
  '/evento/buzon',
  '/invitado',
  '/club-uruguay',
] as const;

export const PUBLIC_EXACT_PATHS = new Set(['/', '/api/health']);

export const BUDGET_VIEW_REGEX = /^\/presupuestos\/[^/]+\/ver\/?$/;

const PROTECTED_EVENT_ROUTES = [
  /^\/evento\/actual\/(?:checkin|mesa)\/?$/,
  /^\/evento\/barra\/[^/]+\/(?:barman|stats)\/?$/,
  /^\/evento\/dj\/[^/]+\/?$/,
  /^\/evento\/video-vida\/[^/]+\/?$/,
  /^\/evento\/en-vivo\/[^/]+\/organizador\/?$/,
] as const;

export function isPublicPathPrefix(pathname: string) {
  if (PROTECTED_EVENT_ROUTES.some((pattern) => pattern.test(pathname))) return false;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}
