import 'server-only';
import { randomUUID } from 'crypto';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

/**
 * Un candado por trabajo, entre servidores, para lo que NO se puede hacer dos veces (mandar
 * WhatsApp a prospectos, pagar una nota con IA). Es el mismo mecanismo que el candado de las
 * tareas (`control-concurrencia.ts`), pero con nombre: así lo puede tomar adentro la función que
 * hace el trabajo, aunque quien la llame ya tenga el candado general (Codex, auditoría 81: el
 * candado estaba en un camino y el despertador y el botón del admin entraban por al lado).
 */
interface EstadoCandado {
  enCurso: boolean;
  dueno?: string;
  desde?: string;
}

const enMemoria = new Map<string, { dueno: string; desde: number }>();

export async function tomarCandado(nombre: string, venceMs = 15 * 60_000): Promise<string | null> {
  const ahora = Date.now();
  const local = enMemoria.get(nombre);
  if (local && ahora - local.desde < venceMs) return null;
  const dueno = randomUUID();
  enMemoria.set(nombre, { dueno, desde: ahora });
  try {
    let tomado = false;
    await mutarDocumentoConTransaccion<EstadoCandado>(`automatico/candado-${nombre}.json`, { enCurso: false }, (e) => {
      tomado = false;
      const desde = e.desde ? new Date(e.desde).getTime() : NaN;
      if (e.enCurso && Number.isFinite(desde) && ahora - desde < venceMs) return null;
      tomado = true;
      return { enCurso: true, dueno, desde: new Date(ahora).toISOString() };
    });
    if (tomado) return dueno;
  } catch {
    // Sin la base no se sabe si otro servidor lo está haciendo: no se hace.
  }
  if (enMemoria.get(nombre)?.dueno === dueno) enMemoria.delete(nombre);
  return null;
}

export async function soltarCandado(nombre: string, dueno: string): Promise<void> {
  if (enMemoria.get(nombre)?.dueno === dueno) enMemoria.delete(nombre);
  try {
    await mutarDocumentoConTransaccion<EstadoCandado>(`automatico/candado-${nombre}.json`, { enCurso: false }, (e) =>
      e.dueno === dueno ? { enCurso: false } : null,
    );
  } catch {
    // no pasa nada si falla: el candado vence solo.
  }
}

/** Para pruebas. */
export function soltarCandadosEnMemoria(): void {
  enMemoria.clear();
}
