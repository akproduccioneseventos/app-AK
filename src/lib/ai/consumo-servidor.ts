import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import { AsyncMutex } from '@/lib/mutex';
import {
  calcularConsumo,
  claveDelMes,
  resumirGasto,
  COSTO_ESTIMADO_UYU,
  type ConteoPorFuncion,
  type FuncionConCosto,
  type ResumenDeGasto,
} from '@/lib/ai/consumo';

/**
 * Guardado del consumo de inteligencia artificial.
 *
 * Se anota una línea por mes con cuántas veces se usó cada función, no un registro
 * por foto: alcanza para ver el gasto y no llena la base con miles de renglones
 * en una sola fiesta.
 *
 * **Anotar nunca puede romper la fiesta.** Si falla el guardado, la foto del
 * invitado sale igual: se pierde un número del contador, que es mucho menos grave
 * que una pantalla colgada en medio del evento.
 */

const CONSUMO_FILE = 'ai-consumo.json';
const GENERIC_JSON_COLLECTION = 'json_documents';
const consumoLocalMutex = new AsyncMutex();

interface ConsumoGuardado {
  meses?: Record<string, ConteoPorFuncion>;
  topeMensualUYU?: number;
}

const VACIO: ConsumoGuardado = { meses: {}, topeMensualUYU: 0 };

function normalizarConsumo(datos: any): ConsumoGuardado {
  const contenido = datos?._data ?? datos?._value ?? datos ?? VACIO;
  return {
    meses: contenido?.meses ?? {},
    topeMensualUYU: Number(contenido?.topeMensualUYU) > 0 ? Number(contenido.topeMensualUYU) : 0,
  };
}

async function leer(): Promise<ConsumoGuardado> {
  const datos = await readData<ConsumoGuardado>(CONSUMO_FILE, VACIO);
  return normalizarConsumo(datos);
}

async function cambiarConsumo<T>(
  cambiar: (datos: ConsumoGuardado) => { siguiente: ConsumoGuardado | null; resultado: T },
): Promise<T> {
  if (process.env.AK_USE_LOCAL_JSON_ONLY === 'true' ||
      (process.env.NODE_ENV === 'test' && !process.env.FIRESTORE_EMULATOR_HOST)) {
    return consumoLocalMutex.runExclusive(async () => {
      const { siguiente, resultado } = cambiar(await leer());
      if (siguiente) {
        await writeData(CONSUMO_FILE, siguiente, undefined, { skipAutoBackup: true });
      }
      return resultado;
    });
  }

  const { dbAdmin } = await import('@/lib/firebase/server');
  if (!dbAdmin) throw new Error('No está disponible el guardado seguro del consumo de IA.');
  const ref = dbAdmin.collection(GENERIC_JSON_COLLECTION).doc(encodeURIComponent(CONSUMO_FILE));

  return dbAdmin.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const { siguiente, resultado } = cambiar(normalizarConsumo(snapshot.exists ? snapshot.data() : null));
    if (siguiente) {
      transaction.set(ref, {
        _filePath: CONSUMO_FILE,
        _data: siguiente,
        _syncedAt: new Date().toISOString(),
      });
    }
    return resultado;
  });
}

/** Suma una generación al contador del mes. Nunca lanza. */
export async function registrarConsumoIA(
  funcion: FuncionConCosto,
  cantidad = 1,
  ahora: Date = new Date(),
): Promise<void> {
  try {
    const incremento = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;
    if (!incremento) return;
    await cambiarConsumo((datos) => {
      const mes = claveDelMes(ahora);
      const delMes = { ...(datos.meses?.[mes] ?? {}) };
      delMes[funcion] = (delMes[funcion] ?? 0) + incremento;
      return { siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } }, resultado: undefined };
    });
  } catch {
    // A propósito en silencio: ver el gasto no vale una fiesta cortada.
  }
}

export interface ReservaConsumoIA {
  /** Libera una reserva solo cuando el proveedor confirma que rechazó el pedido sin procesarlo. */
  liberar(): Promise<void>;
}

/** Reserva el costo estimado dentro de la misma transacción que lee el tope mensual. */
export async function reservarConsumoIA(
  funcion: FuncionConCosto,
  cantidad = 1,
  ahora: Date = new Date(),
): Promise<ReservaConsumoIA | null> {
  const incremento = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;
  if (!incremento) return null;

  const mes = claveDelMes(ahora);
  const reservada = await cambiarConsumo((datos) => {
    const delMes = { ...(datos.meses?.[mes] ?? {}) };
    const consumoActual = calcularConsumo(mes, delMes).gastadoUYU;
    const costoReserva = (COSTO_ESTIMADO_UYU[funcion] ?? 0) * incremento;
    const tope = datos.topeMensualUYU ?? 0;
    if (tope > 0 && consumoActual + costoReserva > tope) {
      return { siguiente: null, resultado: false };
    }
    delMes[funcion] = (delMes[funcion] ?? 0) + incremento;
    return {
      siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } },
      resultado: true,
    };
  });
  if (!reservada) return null;

  let liberarPromise: Promise<void> | null = null;
  return {
    liberar() {
      liberarPromise ??= cambiarConsumo((datos) => {
        const delMes = { ...(datos.meses?.[mes] ?? {}) };
        const restante = Math.max(0, (delMes[funcion] ?? 0) - incremento);
        if (restante) delMes[funcion] = restante;
        else delete delMes[funcion];
        return {
          siguiente: { ...datos, meses: { ...datos.meses, [mes]: delMes } },
          resultado: undefined,
        };
      });
      return liberarPromise;
    },
  };
}

export async function getResumenDeGasto(ahora: Date = new Date()): Promise<ResumenDeGasto> {
  const datos = await leer();
  const mes = claveDelMes(ahora);
  return resumirGasto(calcularConsumo(mes, datos.meses?.[mes] ?? {}), datos.topeMensualUYU ?? 0);
}

export async function setTopeMensual(topeUYU: number): Promise<ResumenDeGasto> {
  const tope = Number.isFinite(topeUYU) && topeUYU > 0 ? Math.round(topeUYU) : 0;
  return cambiarConsumo((datos) => ({
    siguiente: { ...datos, topeMensualUYU: tope },
    resultado: resumirGasto(
      calcularConsumo(claveDelMes(), datos.meses?.[claveDelMes()] ?? {}),
      tope,
    ),
  }));
}

/**
 * ¿Se puede seguir gastando en efectos de fotos?
 *
 * Si el mes se pasó del tope, devuelve `false` y quien llama tiene que caer al
 * mismo camino que cuando no hay servicio configurado: **la foto sale igual, sin
 * el efecto**. Nunca se le corta la foto al invitado.
 *
 * Ante cualquier duda devuelve `true`: quedarse sin efectos por un error de
 * lectura, en medio de una fiesta, es peor que gastar de más una noche.
 */
export async function hayPresupuestoParaIA(ahora: Date = new Date()): Promise<boolean> {
  try {
    return !(await getResumenDeGasto(ahora)).frenado;
  } catch {
    return true;
  }
}
