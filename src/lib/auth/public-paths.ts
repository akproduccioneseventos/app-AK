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
  '/blog',
  '/portal-cliente',
  '/simulador',
  '/simulador-ak',
  '/proveedor',
  // Catalogo digital por tipo de fiesta: es material de venta pensado para
  // compartirle el enlace a un prospecto. Vive fuera del grupo (app), no
  // consulta la sesion y solo carga textos publicos y el WhatsApp de contacto,
  // pero faltaba declararlo aca, asi que el visitante chocaba con el login.
  '/catalogo',
  '/presentacion',
  '/presentacion-led',
  // La presentacion LED, que es publica, manda al visitante aca desde tres de
  // sus laminas (`/galeria-led?categoria=Regalo exclusivo`, `Entrada`,
  // `Catering`) para que vea fotos. Sin declararla, el prospecto tocaba "ver
  // fotos" y caia en la pantalla de ingreso.
  '/galeria-led',
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
  '/pago',
] as const;

export const PUBLIC_EXACT_PATHS = new Set([
  '/',
  '/api/health',
  '/api/whatsapp/webhook',
  '/api/payments/mercadopago/checkout',
  '/api/payments/mercadopago/status',
  '/api/payments/mercadopago/webhook',
]);

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
