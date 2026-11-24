/**
 * Limpia la URL actual de Touchpix antes de mostrarla como QR para invitados.
 *
 * Nunca debe incluir el token de operador (`scope === 'operator'`), el parámetro
 * `role=operator`, `kiosk` ni credenciales personales de otro invitado.
 */
function decodificarPayloadToken(token: string): Record<string, unknown> | null {
  try {
    const separator = token.lastIndexOf('.');
    if (separator <= 0) return null;
    const payloadB64 = token.slice(0, separator).replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function esTokenOperadorTouchpix(token: string | null | undefined): boolean {
  if (!token) return false;
  const payload = decodificarPayloadToken(token);
  if (!payload) return true;
  return payload.scope !== 'guest';
}

export function sanitizarUrlCompartirTouchpix(href: string): string {
  if (!href) return '';
  try {
    const url = new URL(href);
    const roleParam = url.searchParams.get('role');
    url.searchParams.delete('role');
    url.searchParams.delete('kiosk');
    url.searchParams.delete('guestId');
    url.searchParams.delete('guestAccessToken');
    url.searchParams.delete('token');

    const access = url.searchParams.get('access');
    if (roleParam === 'operator' || (access && esTokenOperadorTouchpix(access))) {
      url.searchParams.delete('access');
    }

    return url.toString();
  } catch {
    return '';
  }
}
