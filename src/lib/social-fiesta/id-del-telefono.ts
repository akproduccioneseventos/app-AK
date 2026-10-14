/**
 * Identidad anónima de este teléfono para votar, como hacen las apps de votación en eventos
 * (Slido, Mentimeter): no pide datos al invitado y deja contar un voto por teléfono aunque todos
 * estén en el mismo wifi del salón. Si el navegador no deja guardarla, se vota igual y el servidor
 * sólo aplica el tope general de la red.
 */
const CLAVE = 'ak_id_telefono';

export function idDelTelefono(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const guardado = window.localStorage.getItem(CLAVE);
    if (guardado && /^[a-zA-Z0-9-]{8,64}$/.test(guardado)) return guardado;
    const nuevo = window.crypto?.randomUUID?.();
    if (!nuevo) return undefined;
    window.localStorage.setItem(CLAVE, nuevo);
    return nuevo;
  } catch {
    return undefined;
  }
}
