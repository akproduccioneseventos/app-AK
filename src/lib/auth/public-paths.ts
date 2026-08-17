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
  // Las cuatro paginas de venta del negocio. `src/lib/seo/paginas-publicas.ts`
  // se las ofrece a Google y les arma titulo y descripcion, pero faltaba
  // declararlas aca: el prospecto que llegaba desde Google o desde un enlace de
  // WhatsApp chocaba con la pantalla de ingreso, y Google tampoco podia leerlas.
  // Es la tercera vez que pasa lo mismo (ya habia pasado con `/catalogo` y con
  // `/galeria-led`), por eso ahora hay una prueba que mantiene las dos listas
  // atadas: `src/__tests__/paginas-de-venta-abiertas.test.ts`.
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/experiencia-ak',
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
  // La distribucion de mesas es una herramienta del equipo, enlazada desde el
  // planificador (`fiestas/nueva/invitados`). Vive bajo `/portal`, que es
  // publico por el portal del invitado, asi que sin esta linea cualquiera que
  // pusiera `/portal/mesas?fiestaId=...` veia la lista entera de invitados de
  // esa fiesta, con sus datos, sin estar logueado.
  /^\/portal\/mesas\/?$/,
] as const;

export function isPublicPathPrefix(pathname: string) {
  if (PROTECTED_EVENT_ROUTES.some((pattern) => pattern.test(pathname))) return false;
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}
