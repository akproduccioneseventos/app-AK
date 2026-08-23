import type { GestionCostosData, PagoProveedor } from '@/types/fiesta';

/**
 * Cuánta plata dejó una fiesta.
 *
 * **Por qué esto vive en un solo archivo.** Ya pasó que dos pantallas mostraban
 * números distintos para la misma fiesta, porque cada una hacía la cuenta por su
 * cuenta y una se olvidaba de descontar la merma de bebidas duplicada. Cualquier
 * pantalla nueva que muestre ganancia tiene que usar esto y no rehacer la suma.
 *
 * **Dos trampas que hay que respetar, y están puestas acá adentro:**
 *
 * 1. La merma de bebidas está contada dos veces en los datos: el total de bebidas
 *    ya viene con el 5% adentro, y además figura como un renglón aparte. Se
 *    descuenta el renglón.
 * 2. El costo de proveedores **no** se suma aparte: ya está adentro de los
 *    renglones, como items `auto_prov_*`. Sumar el subtotal seria contarlo dos
 *    veces.
 *
 * **Estimado contra real.** Hasta ahora la ganancia se calculaba siempre contra lo
 * que se *estimaba* gastar. Si el evento se fue de gasto, el número seguía
 * mostrándose lindo. Ahora, cuando hay pagos cargados a un renglón, manda **lo que
 * salió de verdad**; donde no hay pagos, se usa el estimado y se avisa que es
 * estimado. Nunca se inventa un número intermedio.
 *
 * **Fix 23-ago-2026 (bloque 1 orden nueva):** los bloques automáticos
 * (cat_catering, cat_bebidas, cat_reposteria, cat_personal) tenían el mismo
 * problema que antes tenían los renglones: si el dueño cargaba un pago contra
 * "Catering (Automático)", ese pago entraba como `pagosSueltos` Y el estimado
 * del bloque se sumaba igual. El gasto aparecía el doble de lo real. Ahora se
 * aplica la misma lógica que los renglones manuales: si hay pagos contra un
 * bloque automático, se usa lo pagado; si no, se usa el estimado.
 */

/** El renglón de merma que ya está incluido en el total de bebidas. */
const MERMA_DUPLICADA = 'auto_merma_bebidas';

/**
 * IDs de los bloques automáticos que ofrece la pantalla de gestión de costos
 * como destino de pago, junto con su función que saca el estimado de `others`.
 */
const BLOQUES_AUTOMATICOS: ReadonlyArray<{
  id: string;
  getEstimado: (others: GestionCostosData['others']) => number;
}> = [
  { id: 'cat_catering',   getEstimado: (o) => aNumero(o?.totalCateringCost) },
  { id: 'cat_bebidas',    getEstimado: (o) => aNumero(o?.totalBebidasCost) },
  { id: 'cat_reposteria', getEstimado: (o) => aNumero(o?.totalReposteriaCost) },
  { id: 'cat_personal',   getEstimado: (o) => aNumero(o?.totalPersonalCost) },
];

export interface GananciaDeEvento {
  /** Lo pactado con el cliente. */
  ingreso: number;
  /** Lo que se estimó que iba a costar. */
  costoEstimado: number;
  /** Lo que costó de verdad donde hay pagos cargados, estimado donde no. */
  costoReal: number;
  gananciaEstimada: number;
  gananciaReal: number;
  /** Porcentaje de la ganancia sobre lo cobrado. Cero si no se cobró nada. */
  margenEstimado: number;
  margenReal: number;
  /** Total efectivamente pagado a proveedores. */
  pagadoAProveedores: number;
  /**
   * Si hay al menos un pago cargado. Cuando es `false`, el costo real es el
   * estimado y **no hay que mostrarlo como si fuera real**.
   */
  hayGastoCargado: boolean;
  /** Cuánto de lo estimado todavía no tiene ningún pago cargado. */
  sinRendir: number;
}

function aNumero(valor: unknown): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

function porcentaje(ganancia: number, ingreso: number): number {
  if (ingreso <= 0) return 0;
  return (ganancia / ingreso) * 100;
}

export function calcularGananciaDeEvento(
  gestionCostos: GestionCostosData | undefined | null,
  pagosProveedores: PagoProveedor[] | undefined | null,
): GananciaDeEvento {
  const items = (gestionCostos?.costosItems ?? []).filter((item) => item.id !== MERMA_DUPLICADA);
  const pagos = pagosProveedores ?? [];
  const others = gestionCostos?.others;

  // Suma de estimados de los cuatro bloques automáticos (se usa en costoEstimado).
  const estimadoBloques = BLOQUES_AUTOMATICOS.reduce(
    (suma, bloque) => suma + bloque.getEstimado(others),
    0,
  );

  const estimadoDeItems = items.reduce((suma, item) => suma + aNumero(item.montoEstimado), 0);
  const costoEstimado = estimadoDeItems + estimadoBloques;

  // Lo pagado, agrupado por el renglón al que corresponde.
  const pagadoPorItem = new Map<string, number>();
  for (const pago of pagos) {
    const clave = pago?.costoAsociadoId ?? '';
    pagadoPorItem.set(clave, (pagadoPorItem.get(clave) ?? 0) + aNumero(pago?.monto));
  }
  const pagadoAProveedores = [...pagadoPorItem.values()].reduce((s, monto) => s + monto, 0);

  const idsDeItems = new Set(items.map((item) => item.id));
  const idsDeBloques = new Set(BLOQUES_AUTOMATICOS.map((b) => b.id));

  // --- Renglones manuales: pagado si existe, estimado si no ---
  let realDeItems = 0;
  let sinRendir = 0;

  for (const item of items) {
    const pagado = pagadoPorItem.get(item.id) ?? 0;
    if (pagado > 0) {
      realDeItems += pagado;
    } else {
      realDeItems += aNumero(item.montoEstimado);
      sinRendir += aNumero(item.montoEstimado);
    }
  }

  // --- Bloques automáticos: misma lógica ---
  let realDeBloques = 0;

  for (const bloque of BLOQUES_AUTOMATICOS) {
    const pagado = pagadoPorItem.get(bloque.id) ?? 0;
    const estimado = bloque.getEstimado(others);
    if (pagado > 0) {
      realDeBloques += pagado;
    } else {
      realDeBloques += estimado;
      sinRendir += estimado;
    }
  }

  // Pagos que no corresponden a ningún renglón conocido (ni manual ni de bloque).
  // Son plata que salió igual: se suman, nunca se esconden.
  let pagosSueltos = 0;
  for (const [clave, monto] of pagadoPorItem) {
    if (!idsDeItems.has(clave) && !idsDeBloques.has(clave)) pagosSueltos += monto;
  }

  const costoReal = realDeItems + realDeBloques + pagosSueltos;
  const ingreso = aNumero(gestionCostos?.ingresosTotalesEstimados);

  const gananciaEstimada = ingreso - costoEstimado;
  const gananciaReal = ingreso - costoReal;

  return {
    ingreso,
    costoEstimado,
    costoReal,
    gananciaEstimada,
    gananciaReal,
    margenEstimado: porcentaje(gananciaEstimada, ingreso),
    margenReal: porcentaje(gananciaReal, ingreso),
    pagadoAProveedores,
    hayGastoCargado: pagadoAProveedores > 0,
    sinRendir,
  };
}
