/**
 * Medición segura: controla qué pantallas y qué datos de URL se mandan a Google y Meta.
 *
 * **Por qué existe.** Google Analytics y el Pixel de Meta se montaban en todas las pantallas,
 * incluyendo las privadas como /invitacion/<fiesta>/invitado/<invitado>?token=… o
 * /portal/c/<accessKey>. Con eso, los tokens y las llaves de acceso le llegaban a Google
 * y a Meta con cada cambio de pantalla.
 *
 * **Cómo funciona.** Lista de permitidas (allowlist), no de prohibidas. Una pantalla privada
 * nueva queda afuera automáticamente.
 */

/** Prefijos de pathname que se pueden medir. Todo lo demás queda afuera. */
const PAGINAS_DE_VENTA: readonly string[] = [
  '/',
  '/blog',
  '/bodas',
  '/quinceaneras',
  '/cumpleanos',
  '/catalogo',
  '/club-uruguay',
  '/experiencia',
  '/experiencia-ak',
  '/tecnologia',
  '/landing',
  '/public',
  '/simulador',
  '/simulador-ak',
  '/simulador-de-presupuesto',
  '/privacidad',
];

/** Parámetros de URL que se pueden mandar a Google y Meta. Todo lo demás se descarta. */
const PARAMS_SEGUROS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'tipo',
  'eventType',
  'salon',
]);

/**
 * Devuelve `true` sólo si la pantalla es de venta pública y se puede medir.
 * Cualquier pantalla que no esté en la lista queda afuera sin necesidad de agregarla
 * a una lista de prohibidas.
 */
export function sePuedeMedir(pathname: string): boolean {
  if (pathname === '/') return true;
  return PAGINAS_DE_VENTA.some((prefijo) => {
    if (prefijo === '/') return false; // ya manejado arriba
    return pathname === prefijo || pathname.startsWith(prefijo + '/') || pathname.startsWith(prefijo + '?');
  });
}

/**
 * Construye la dirección que se puede mandar a Google o Meta: el pathname más
 * sólo los parámetros de URL seguros. Descarta tokens, llaves de acceso, etc.
 *
 * @param pathname  El pathname de la URL actual (sin origin, sin query string).
 * @param search    La query string de la URL actual (ej. "?utm_source=ig&token=abc").
 * @returns         El pathname + los parámetros seguros que haya, sin los privados.
 */
export function direccionParaMedir(pathname: string, search: string): string {
  if (!search) return pathname;

  const params = new URLSearchParams(search);
  const seguros = new URLSearchParams();

  for (const [clave, valor] of params.entries()) {
    if (PARAMS_SEGUROS.has(clave)) {
      seguros.set(clave, valor);
    }
  }

  const query = seguros.toString();
  return query ? `${pathname}?${query}` : pathname;
}
