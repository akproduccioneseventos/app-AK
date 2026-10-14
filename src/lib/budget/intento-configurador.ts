const STORAGE_KEY = 'ak-configurador-solicitud-v1';
const MANUAL_STORAGE_KEY = 'ak-presupuesto-manual-solicitud-v1';

async function obtenerIntento(carga: Record<string, unknown>, storageKey: string): Promise<string> {
  const { timestamp: _timestamp, ...estable } = carga;
  const bytes = new TextEncoder().encode(JSON.stringify(estable));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(n => n.toString(16).padStart(2, '0')).join('');
  // Sin almacenamiento no enviar: despues de recargar se perderia el intento incierto.
  const raw = sessionStorage.getItem(storageKey);
  let previous: { fingerprint?: string; id?: string } | null = null;
  try { previous = raw ? JSON.parse(raw) : null; } catch { /* Sustituir solo una marca corrupta. */ }
  if (previous?.fingerprint === fingerprint && typeof previous.id === 'string') return previous.id;
  const id = crypto.randomUUID();
  sessionStorage.setItem(storageKey, JSON.stringify({ id, fingerprint }));
  return id;
}

export function obtenerIntentoConfigurador(carga: Record<string, unknown>): Promise<string> {
  return obtenerIntento(carga, STORAGE_KEY);
}

export function terminarIntentoConfigurador(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function obtenerIntentoPresupuestoManual(carga: Record<string, unknown>): Promise<string> {
  return obtenerIntento(carga, MANUAL_STORAGE_KEY);
}

export function terminarIntentoPresupuestoManual(): void {
  sessionStorage.removeItem(MANUAL_STORAGE_KEY);
}

export function obtenerIntentoChat(carga: Record<string, unknown>, scope: string): Promise<string> {
  return obtenerIntentoChatPendiente(carga, scope);
}

type IntentoChat = { id: string; fingerprint: string };

function leerIntentosChat(key: string): IntentoChat[] {
  const raw = sessionStorage.getItem(key);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed?.attempts) ? parsed.attempts : [parsed];
  if (!list.every((item: IntentoChat) => typeof item?.id === 'string' && typeof item?.fingerprint === 'string')) {
    throw new Error('No se pueden recuperar los intentos pendientes del chat.');
  }
  return list;
}

async function obtenerIntentoChatPendiente(carga: Record<string, unknown>, scope: string): Promise<string> {
  const { timestamp: _timestamp, ...estable } = carga;
  const bytes = new TextEncoder().encode(JSON.stringify(estable));
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(n => n.toString(16).padStart(2, '0')).join('');
  const key = `ak-multiagent-solicitud-v1:${scope}`;
  // Una consulta nueva no reemplaza otra cuyo resultado sigue incierto.
  const attempts = leerIntentosChat(key);
  const previous = attempts.find(item => item.fingerprint === fingerprint);
  if (previous) return previous.id;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ attempts: [...attempts, { id, fingerprint }] }));
  return id;
}

export function terminarIntentoChat(scope: string, id: string): void {
  const key = `ak-multiagent-solicitud-v1:${scope}`;
  const attempts = leerIntentosChat(key).filter(item => item.id !== id);
  if (attempts.length) sessionStorage.setItem(key, JSON.stringify({ attempts }));
  else sessionStorage.removeItem(key);
}
