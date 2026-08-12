import 'server-only';

import { readData, writeData } from '@/lib/data-service';
import {
  calcularConsumo,
  claveDelMes,
  resumirGasto,
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

interface ConsumoGuardado {
  meses?: Record<string, ConteoPorFuncion>;
  topeMensualUYU?: number;
}

const VACIO: ConsumoGuardado = { meses: {}, topeMensualUYU: 0 };

async function leer(): Promise<ConsumoGuardado> {
  const datos = await readData<ConsumoGuardado>(CONSUMO_FILE, VACIO);
  return {
    meses: datos?.meses ?? {},
    topeMensualUYU: Number(datos?.topeMensualUYU) > 0 ? Number(datos.topeMensualUYU) : 0,
  };
}

/** Suma una generación al contador del mes. Nunca lanza. */
export async function registrarConsumoIA(
  funcion: FuncionConCosto,
  cantidad = 1,
  ahora: Date = new Date(),
): Promise<void> {
  try {
    const datos = await leer();
    const mes = claveDelMes(ahora);
    const delMes = { ...(datos.meses?.[mes] ?? {}) };
    delMes[funcion] = (delMes[funcion] ?? 0) + cantidad;

    await writeData(
      CONSUMO_FILE,
      { ...datos, meses: { ...datos.meses, [mes]: delMes } },
      undefined,
      { skipAutoBackup: true },
    );
  } catch {
    // A propósito en silencio: ver el gasto no vale una fiesta cortada.
  }
}

export async function getResumenDeGasto(ahora: Date = new Date()): Promise<ResumenDeGasto> {
  const datos = await leer();
  const mes = claveDelMes(ahora);
  return resumirGasto(calcularConsumo(mes, datos.meses?.[mes] ?? {}), datos.topeMensualUYU ?? 0);
}

export async function setTopeMensual(topeUYU: number): Promise<ResumenDeGasto> {
  const datos = await leer();
  const tope = Number.isFinite(topeUYU) && topeUYU > 0 ? Math.round(topeUYU) : 0;
  await writeData(CONSUMO_FILE, { ...datos, topeMensualUYU: tope }, undefined, {
    skipAutoBackup: true,
  });
  return getResumenDeGasto();
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
