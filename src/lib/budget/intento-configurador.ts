const STORAGE_KEY = 'ak-configurador-solicitud-v1';

export async function obtenerIntentoConfigurador(carga: Record<string, unknown>): Promise<string> {
  const { timestamp: _timestamp, ...estable } = carga;
  const bytes = new TextEncoder().encode(JSON.stringify(estable));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(n => n.toString(16).padStart(2, '0')).join('');
  // Sin almacenamiento no enviar: despues de recargar se perderia el intento incierto.
  const raw = sessionStorage.getItem(STORAGE_KEY);
  let previous: { fingerprint?: string; id?: string } | null = null;
  try { previous = raw ? JSON.parse(raw) : null; } catch { /* Sustituir solo una marca corrupta. */ }
  if (previous?.fingerprint === fingerprint && typeof previous.id === 'string') return previous.id;
  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id, fingerprint }));
  return id;
}

export function terminarIntentoConfigurador(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
