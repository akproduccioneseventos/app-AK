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
 */

/** El renglón de merma que ya está incluido en el total de bebidas. */
const MERMA_DUPLICADA = 'auto_merma_bebidas';

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

  const bloques =
    aNumero(gestionCostos?.others?.totalCateringCost) +
    aNumero(gestionCostos?.others?.totalBebidasCost) +
    aNumero(gestionCostos?.others?.totalReposteriaCost) +
    aNumero(gestionCostos?.others?.totalPersonalCost);

  const estimadoDeItems = items.reduce((suma, item) => suma + aNumero(item.montoEstimado), 0);
  const costoEstimado = estimadoDeItems + bloques;

  // Lo pagado, agrupado por el renglón al que corresponde.
  const pagadoPorItem = new Map<string, number>();
  for (const pago of pagos) {
    const clave = pago?.costoAsociadoId ?? '';
    pagadoPorItem.set(clave, (pagadoPorItem.get(clave) ?? 0) + aNumero(pago?.monto));
  }
  const pagadoAProveedores = [...pagadoPorItem.values()].reduce((s, monto) => s + monto, 0);

  const idsDeItems = new Set(items.map((item) => item.id));
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

  // Pagos que no corresponden a ningún renglón (o al renglón de merma que se
  // descuenta). Son plata que salió igual: se suman, nunca se esconden.
  let pagosSueltos = 0;
  for (const [clave, monto] of pagadoPorItem) {
    if (!idsDeItems.has(clave)) pagosSueltos += monto;
  }

  const costoReal = realDeItems + pagosSueltos + bloques;
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
    sinRendir: sinRendir + bloques,
  };
}
