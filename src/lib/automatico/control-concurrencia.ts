import 'server-only';
import { randomUUID } from 'crypto';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

/**
 * El candado de las tareas automáticas, entre servidores (Codex, auditoría 66, AUTO01, 5/10/2026).
 *
 * Antes se leía y se escribía por separado: dos servidores leían "libre" a la vez y corrían los
 * dos. Y al vencer, el dueño viejo podía liberar el candado del nuevo. Ahora:
 * - Se toma en UNA operación de la base, con la identidad del que lo toma.
 * - Sólo lo libera quien lo tomó.
 * - Un trabajo largo lo renueva (`renovarLock`) para que no venza mientras corre.
 * - Si la base no contesta, NO se afirma que se tiene: sin candado no se corre.
 */
const LOCK_FILE = 'automatico/tareas-lock.json';
const TIMEOUT_LOCK_MS = 5 * 60 * 1000;

export type OrigenDisparo = 'despertador' | 'visita' | 'app' | 'manual';

export interface EstadoLock {
  enCurso: boolean;
  dueno?: string;
  iniciadoEn?: string;
  origen?: OrigenDisparo;
}

// En el mismo proceso, el segundo pedido ni siquiera va a la base.
let memoryLock: string | null = null;
let memoryLockTimestamp = 0;

function vigente(estado: EstadoLock, ahora: number): boolean {
  if (!estado.enCurso || !estado.iniciadoEn) return false;
  const inicio = new Date(estado.iniciadoEn).getTime();
  return Number.isFinite(inicio) && ahora - inicio < TIMEOUT_LOCK_MS;
}

/**
 * Intenta tomar el candado. Devuelve la identidad del dueño si lo tomó, o `null` si otro lo tiene
 * (o si no se pudo consultar la base). La identidad se pasa a `liberarLock` y `renovarLock`.
 */
export async function intentarAdquirirLock(origen: OrigenDisparo): Promise<string | null> {
  const ahora = Date.now();
  if (memoryLock && ahora - memoryLockTimestamp < TIMEOUT_LOCK_MS) return null;
  const dueno = randomUUID();
  memoryLock = dueno;
  memoryLockTimestamp = ahora;

  try {
    let tomado = false;
    await mutarDocumentoConTransaccion<EstadoLock>(LOCK_FILE, { enCurso: false }, (estado) => {
      tomado = false;
      if (vigente(estado, ahora)) return null;
      tomado = true;
      return { enCurso: true, dueno, iniciadoEn: new Date(ahora).toISOString(), origen };
    });
    if (tomado) return dueno;
  } catch {
    // Sin la base no se sabe si otro servidor está corriendo: no se corre.
  }
  if (memoryLock === dueno) memoryLock = null;
  return null;
}

/** Extiende el candado mientras el trabajo sigue vivo. Sólo si sigue siendo de este dueño. */
export async function renovarLock(dueno: string): Promise<boolean> {
  try {
    let renovado = false;
    await mutarDocumentoConTransaccion<EstadoLock>(LOCK_FILE, { enCurso: false }, (estado) => {
      renovado = false;
      if (!estado.enCurso || estado.dueno !== dueno) return null;
      renovado = true;
      return { ...estado, iniciadoEn: new Date().toISOString() };
    });
    if (renovado && memoryLock === dueno) memoryLockTimestamp = Date.now();
    return renovado;
  } catch {
    return false;
  }
}

/** Libera el candado, sólo si lo sigue teniendo este dueño. Un dueño vencido no libera al nuevo. */
export async function liberarLock(dueno: string): Promise<void> {
  if (memoryLock === dueno) {
    memoryLock = null;
    memoryLockTimestamp = 0;
  }
  try {
    await mutarDocumentoConTransaccion<EstadoLock>(LOCK_FILE, { enCurso: false }, (estado) =>
      estado.dueno === dueno ? { enCurso: false } : null,
    );
  } catch {
    // Si no se pudo escribir, vence solo a los cinco minutos.
  }
}

/**
 * Para pruebas unitarias: permite forzar el reseteo del candado en memoria.
 */
export function resetearLockEnMemoria(): void {
  memoryLock = null;
  memoryLockTimestamp = 0;
}
