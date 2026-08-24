import 'server-only';
import { readData, writeData } from '@/lib/data-service';

const LOCK_FILE = 'tareas-lock.json';
const TIMEOUT_LOCK_MS = 5 * 60 * 1000; // 5 minutos máximo de bloqueo por seguridad

export type OrigenDisparo = 'despertador' | 'visita' | 'app' | 'manual';

export interface EstadoLock {
  enCurso: boolean;
  iniciadoEn?: string;
  origen?: OrigenDisparo;
}

// Candado en memoria para peticiones simultáneas dentro del mismo proceso
let memoryLock = false;
let memoryLockTimestamp = 0;

/**
 * Intenta adquirir el candado atómico de ejecución de tareas automáticas.
 * Si ya hay otra tarea corriendo y no ha expirado su tiempo de gracia (5 min),
 * devuelve false para evitar carreras y dobles corridas simultáneas.
 *
 * REGLA ESTRICTA: La marca de "ya estoy corriendo" se toma ANTES de trabajar,
 * no después. El que llega y ve que otro está corriendo, se va sin hacer nada.
 */
export async function intentarAdquirirLock(origen: OrigenDisparo): Promise<boolean> {
  const ahora = Date.now();

  // 1. Candado sincrónico en memoria: atómico e inmediato en el event loop de Node.js
  if (memoryLock && ahora - memoryLockTimestamp < TIMEOUT_LOCK_MS) {
    return false;
  }

  // Se adquiere inmediatamente en memoria ANTES de cualquier tick asíncrono
  memoryLock = true;
  memoryLockTimestamp = ahora;

  // 2. Verificación y persistencia en archivo de datos para procesos / instancias múltiples
  try {
    const estado = await readData<EstadoLock>(LOCK_FILE, { enCurso: false });
    if (estado.enCurso && estado.iniciadoEn) {
      const inicio = new Date(estado.iniciadoEn).getTime();
      // Si otra instancia ya tenía un lock activo hace menos de 5 minutos
      if (Number.isFinite(inicio) && ahora - inicio < TIMEOUT_LOCK_MS) {
        memoryLock = false;
        return false;
      }
    }

    await writeData(
      LOCK_FILE,
      {
        enCurso: true,
        iniciadoEn: new Date(ahora).toISOString(),
        origen,
      },
      undefined,
      { skipAutoBackup: true },
    );

    return true;
  } catch {
    // Si falla el archivo, conservamos el candado de memoria activo
    return true;
  }
}

/**
 * Libera el candado de ejecución al terminar el trabajo (en bloque finally).
 */
export async function liberarLock(): Promise<void> {
  memoryLock = false;
  memoryLockTimestamp = 0;

  try {
    await writeData(
      LOCK_FILE,
      { enCurso: false },
      undefined,
      { skipAutoBackup: true },
    );
  } catch {
    // No dejamos que un fallo de escritura de liberación rompa el flujo
  }
}

/**
 * Para pruebas unitarias: permite forzar el reseteo del candado en memoria.
 */
export function resetearLockEnMemoria(): void {
  memoryLock = false;
  memoryLockTimestamp = 0;
}
