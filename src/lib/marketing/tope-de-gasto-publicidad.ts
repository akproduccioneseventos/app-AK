import { readData, writeData } from '@/lib/data-service';

/**
 * **El freno de mano del agente de publicidad.**
 *
 * El dueno decidio el 27 de agosto de 2026 que el agente maneje la publicidad **solo**:
 * que cree, ajuste y pause campanas sin preguntarle. Se le planteo el riesgo y eligio
 * igual. Es su plata y es su decision.
 *
 * Lo que cambia entonces no es *si* puede gastar, sino **que sea imposible pasarse**. La
 * diferencia importa: un agente que "trata de no pasarse" del tope se pasa el dia que se
 * equivoca en una cuenta. Este modulo no aconseja: **niega**. Toda plata que el agente
 * quiera comprometer pasa por aca, y lo que no entra en el tope no se ejecuta.
 *
 * Tres decisiones de fondo, con su por que:
 *
 * 1. **Se cuenta lo COMPROMETIDO, no lo gastado.** Un presupuesto diario de $500 puesto un
 *    dia 10 no gasto nada todavia, pero ya compromete $500 por cada dia que queda del mes.
 *    Contar solo lo gastado dejaria subir presupuestos toda la primera semana y descubrir
 *    el desastre el dia 28, cuando ya no se puede deshacer.
 *
 * 2. **Pausar siempre se permite, aunque no haya tope disponible.** Pausar baja el gasto:
 *    frenarlo por falta de presupuesto seria exactamente al reves de lo que protege esto.
 *
 * 3. **El tope vive en pesos uruguayos**, como todo el resto de la app.
 */

const ARCHIVO_TOPE = 'publicidad-tope-de-gasto.json';

/** Tope por defecto mientras el dueno no ponga el suyo. Deliberadamente chico. */
export const TOPE_MENSUAL_POR_DEFECTO = 0;

export interface TopeDeGastoPublicidad {
  /** Tope mensual en pesos uruguayos. En cero, el agente no puede comprometer nada. */
  topeMensualUYU: number;
  /** Cuando lo cambio el dueno por ultima vez. */
  actualizadoEn?: string;
}

export interface EstadoDelTope {
  topeMensualUYU: number;
  /** Lo que las campanas activas ya se van a llevar en lo que queda del mes. */
  comprometidoUYU: number;
  /** Lo que queda disponible. Nunca menos de cero. */
  disponibleUYU: number;
  diasQueQuedanDelMes: number;
}

export interface CampanaConPresupuesto {
  nombre: string;
  /** Presupuesto diario en pesos uruguayos. */
  presupuestoDiarioUYU: number;
  activa: boolean;
}

export type Veredicto =
  | { permitido: true; disponibleDespuesUYU: number }
  | { permitido: false; motivo: string };

/**
 * Lo que el agente puede querer hacerle a una campana.
 *
 * - `pausar` y `bajar-presupuesto` **bajan** el gasto.
 * - `subir-presupuesto` lo aumenta: pasa por el tope.
 * - `encender` y `crear` **ponen una campana al aire**.
 */
export type TipoDeCambio =
  | 'pausar'
  | 'bajar-presupuesto'
  | 'subir-presupuesto'
  | 'encender'
  | 'crear';

/**
 * **Poner una campana al aire es la mano del dueno. El agente no prende nada.**
 *
 * Lo decidio el 27 de agosto de 2026, y **corrige** lo que habia dicho unas horas antes.
 * Sus palabras: *"el tema de poner campanas las activo yo, no se pongan solas."*
 *
 * La linea que quedo es la misma que rige en toda la app —**automatico para mirar,
 * detectar, preparar y avisar; mano humana para lo que sale para afuera**— y aca cae
 * justo: apagar y moderar es cuidar; **encender es salir a la calle a gastar**, y eso lo
 * decide el.
 *
 * Entonces el agente puede, solo:
 * - **pausar** lo que esta quemando plata,
 * - **bajar** un presupuesto,
 * - **subir** un presupuesto de algo que ya esta al aire, siempre dentro del tope.
 *
 * Y no puede, nunca:
 * - **crear** una campana,
 * - **reactivar** una que estaba pausada.
 *
 * Esas dos las prepara y las deja listas para que el las apruebe de un toque.
 *
 * **Por que esta escrito en el codigo y no solo en la orden de trabajo:** una instruccion
 * escrita se olvida o se "mejora"; esto **niega**. Es la misma razon por la que el tope no
 * aconseja: lo que protege plata no puede depender de que alguien se acuerde.
 */
export function elAgentePuedeHacerloSolo(tipo: TipoDeCambio): Veredicto | null {
  if (tipo === 'encender' || tipo === 'crear') {
    return {
      permitido: false,
      motivo:
        tipo === 'crear'
          ? 'El agente no crea campanas. Queda preparada para que la apruebes vos.'
          : 'El agente no reactiva campanas pausadas. Queda preparada para que la enciendas vos.',
    };
  }
  return null;
}

export async function getTopeDeGasto(): Promise<TopeDeGastoPublicidad> {
  try {
    const guardado = await readData<TopeDeGastoPublicidad | null>(ARCHIVO_TOPE, null);
    if (!guardado || typeof guardado.topeMensualUYU !== 'number') {
      return { topeMensualUYU: TOPE_MENSUAL_POR_DEFECTO };
    }
    return guardado;
  } catch {
    // Si no se puede leer el tope, se asume cero: **ante la duda no se gasta**.
    return { topeMensualUYU: TOPE_MENSUAL_POR_DEFECTO };
  }
}

export async function guardarTopeDeGasto(topeMensualUYU: number): Promise<void> {
  const limpio = Number.isFinite(topeMensualUYU) && topeMensualUYU > 0 ? topeMensualUYU : 0;
  await writeData(ARCHIVO_TOPE, {
    topeMensualUYU: limpio,
    actualizadoEn: new Date().toISOString(),
  } satisfies TopeDeGastoPublicidad);
}

/** Cuantos dias quedan del mes contando el de hoy. */
export function diasQueQuedanDelMes(ahora = new Date()): number {
  const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate();
  return ultimoDia - ahora.getDate() + 1;
}

/**
 * Lo que las campanas activas se van a llevar en lo que queda del mes.
 * Las pausadas no cuentan: no gastan.
 */
export function calcularComprometido(
  campanas: CampanaConPresupuesto[],
  ahora = new Date()
): number {
  const dias = diasQueQuedanDelMes(ahora);
  return campanas
    .filter((c) => c.activa)
    .reduce((total, c) => total + Math.max(0, c.presupuestoDiarioUYU) * dias, 0);
}

export async function getEstadoDelTope(
  campanas: CampanaConPresupuesto[],
  ahora = new Date()
): Promise<EstadoDelTope> {
  const { topeMensualUYU } = await getTopeDeGasto();
  const comprometidoUYU = calcularComprometido(campanas, ahora);
  return {
    topeMensualUYU,
    comprometidoUYU,
    disponibleUYU: Math.max(0, topeMensualUYU - comprometidoUYU),
    diasQueQuedanDelMes: diasQueQuedanDelMes(ahora),
  };
}

/**
 * **La unica puerta por donde el agente puede comprometer plata.**
 *
 * `nuevoPresupuestoDiarioUYU` es como quedaria la campana despues del cambio, y
 * `presupuestoDiarioActualUYU` como esta hoy. La diferencia es lo que se agrega al
 * compromiso del mes: bajar un presupuesto o pausar una campana da diferencia negativa
 * y siempre se permite.
 */
export async function puedeComprometer(
  opciones: {
    campanas: CampanaConPresupuesto[];
    presupuestoDiarioActualUYU: number;
    nuevoPresupuestoDiarioUYU: number;
    /**
     * Que se le esta por hacer a la campana. Encender y crear se niegan siempre,
     * antes de mirar el tope: no es una cuestion de cuanta plata queda, es del dueno.
     */
    tipo?: TipoDeCambio;
  },
  ahora = new Date()
): Promise<Veredicto> {
  const { campanas, presupuestoDiarioActualUYU, nuevoPresupuestoDiarioUYU, tipo } = opciones;

  if (tipo) {
    const prohibido = elAgentePuedeHacerloSolo(tipo);
    if (prohibido) return prohibido;
  }

  if (!Number.isFinite(nuevoPresupuestoDiarioUYU) || nuevoPresupuestoDiarioUYU < 0) {
    return { permitido: false, motivo: 'El presupuesto pedido no es un numero valido.' };
  }

  const dias = diasQueQuedanDelMes(ahora);
  const diferenciaDiaria = nuevoPresupuestoDiarioUYU - presupuestoDiarioActualUYU;

  const estado = await getEstadoDelTope(campanas, ahora);

  // Bajar o pausar siempre se permite: reduce el gasto, que es lo que esto protege.
  if (diferenciaDiaria <= 0) {
    return {
      permitido: true,
      disponibleDespuesUYU: Math.max(0, estado.disponibleUYU - diferenciaDiaria * dias),
    };
  }

  if (estado.topeMensualUYU <= 0) {
    return {
      permitido: false,
      motivo:
        'No hay ningun tope de gasto mensual cargado, asi que el agente no puede comprometer plata. '
        + 'Cargalo en la pantalla de publicidad y a partir de ahi puede trabajar solo.',
    };
  }

  const extra = diferenciaDiaria * dias;
  if (extra > estado.disponibleUYU) {
    return {
      permitido: false,
      motivo:
        `Ese cambio comprometeria $${Math.round(extra)} mas hasta fin de mes y solo quedan `
        + `$${Math.round(estado.disponibleUYU)} del tope de $${Math.round(estado.topeMensualUYU)}. `
        + 'No se ejecuta.',
    };
  }

  return { permitido: true, disponibleDespuesUYU: estado.disponibleUYU - extra };
}
