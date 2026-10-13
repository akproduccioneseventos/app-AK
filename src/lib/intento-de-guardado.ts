/**
 * IDENTIDAD DEL INTENTO (pregunta 58 de COMO-AUDITAR.md, 13 de octubre de 2026).
 *
 * Si la respuesta del servidor se pierde (se cortó la señal) y la persona vuelve a tocar "Guardar",
 * el servidor tiene que reconocer que es EL MISMO intento y no crear otro. Para eso la pantalla manda
 * un id que se arma una vez por borrador y se repite en cada reintento, aunque recargue la pestaña.
 *
 * - Mismo contenido → mismo id (un reintento).
 * - Contenido distinto → id nuevo (es otro registro de verdad).
 * - Al confirmarse el guardado se llama `terminarIntento(alcance)` y el próximo arranca con id nuevo.
 *
 * Es la misma idea que `src/lib/budget/intento-configurador.ts`, para cualquier pantalla.
 */
async function huella(carga: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(carga ?? null));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('');
}

const clave = (alcance: string) => `ak-intento-v1:${alcance}`;

export async function obtenerIntento(alcance: string, carga: unknown): Promise<string> {
  const fingerprint = await huella(carga);
  let previo: { fingerprint?: string; id?: string } | null = null;
  try {
    const raw = window.sessionStorage.getItem(clave(alcance));
    previo = raw ? JSON.parse(raw) : null;
  } catch {
    previo = null;
  }
  if (previo?.fingerprint === fingerprint && typeof previo.id === 'string') return previo.id;
  const id = crypto.randomUUID();
  try {
    window.sessionStorage.setItem(clave(alcance), JSON.stringify({ id, fingerprint }));
  } catch {
    // Sin almacenamiento el id vale para esta pestaña abierta (cubre el reintento sin recargar).
  }
  return id;
}

export function terminarIntento(alcance: string): void {
  try {
    window.sessionStorage.removeItem(clave(alcance));
  } catch {
    // no pasa nada si falla: el próximo contenido distinto arma otro id igual.
  }
}
