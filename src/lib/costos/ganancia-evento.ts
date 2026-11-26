import { isConfirmedClientPayment } from '@/lib/budget/financial-guardrails';
import { resolverSueldoDelRol } from '@/lib/fiesta/sueldo-del-rol';
import type { GestionCostosData, PagoProveedor } from '@/types/fiesta';
import type { PagoCliente } from '@/types/presupuesto';

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
  getEstimado: (others: GestionCostosData['others'], personalCalculado?: number) => number;
}> = [
  { id: 'cat_catering',   getEstimado: (o) => Math.max(0, aNumero(o?.totalCateringCost)) },
  { id: 'cat_bebidas',    getEstimado: (o) => Math.max(0, aNumero(o?.totalBebidasCost)) },
  { id: 'cat_reposteria', getEstimado: (o) => Math.max(0, aNumero(o?.totalReposteriaCost)) },
  { id: 'cat_personal',   getEstimado: (o, pCalc) => Math.max(Math.max(0, aNumero(o?.totalPersonalCost)), pCalc ?? 0) },
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
  /**
   * Mercado Pago (28/09/2026). Lo que se quedó de comisión, según su propio informe,
   * y el recargo por cuotas que pagó el cliente encima de lo pactado. Los dos entran
   * en la ganancia real: el recargo suma y la comisión resta. Sólo cuentan los cobros
   * que traen la comisión informada; los que no, se cuentan en
   * `cobrosSinComisionInformada` para avisar, y no se suma su recargo, para no
   * mostrar una ganancia más alta que la real.
   */
  comisionesMercadoPago: number;
  recargosCobrados: number;
  cobrosSinComisionInformada: number;
  /**
   * Lo que se estima de personal (sueldos + aportes): el mayor entre lo sincronizado y lo asignado en Personal.
   * Antes la pantalla mostraba sólo lo sincronizado, y la sincronización exige presupuesto: un sueldo cargado en una
   * fiesta sin presupuesto quedaba en $0 (auditoría del 18/11/2026, C18-01).
   */
  personalEstimado: number;
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
  pagosCliente?: PagoCliente[] | undefined | null,
  personalAsignado?: any[] | { personalAsignado?: any[]; roles?: any[] } | null,
  roles?: any[] | null,
): GananciaDeEvento {
  // Los renglones que se copian del presupuesto (`sync_budget_*`, `syncCostosFromBudget`) llevan el PRECIO DE VENTA de
  // cada servicio, no lo que le cuesta a AK. Contarlos como costo daba siempre "ganancia = − descuento" (auditor, pruebas
  // funcionales 17/11/2026: ingreso $1.200, inversión $1.500). Se listan para que se les cargue el costo, pero como costo
  // cuenta sólo lo que se le pagó al proveedor en ese renglón. Desde el 17/11 la copia trae el costo base del catálogo
  // (`costoDeCatalogo`); ese sí cuenta.
  const pagos = pagosProveedores ?? [];
  const others = gestionCostos?.others;

  // Lo pagado, agrupado por el renglón al que corresponde (se calcula antes para desduplicar).
  const pagadoPorItem = new Map<string, number>();
  for (const pago of pagos) {
    const clave = pago?.costoAsociadoId ?? '';
    pagadoPorItem.set(clave, (pagadoPorItem.get(clave) ?? 0) + Math.max(0, aNumero(pago?.monto)));
  }
  const pagadoAProveedores = [...pagadoPorItem.values()].reduce((s, monto) => s + monto, 0);

  // Si un servicio ya tiene `sync_budget_<id>` con costo base del catálogo y además quedó
  // un `auto_prov_<id>` viejo, contamos sólo uno (el que tenga pagos cargados, o el del catálogo).
  const rawItems = (gestionCostos?.costosItems ?? []).filter((item) => item.id !== MERMA_DUPLICADA);
  const syncConCostoPorServicio = new Set(
    rawItems
      .filter((item) => esPrecioDeVentaCopiado(item.id) && Boolean((item as { costoDeCatalogo?: boolean }).costoDeCatalogo))
      .map((item) => String(item.id).slice('sync_budget_'.length)),
  );
  const items = rawItems.map((item) => {
    const id = String(item.id || '');
    if (esPrecioDeVentaCopiado(id) && !(item as { costoDeCatalogo?: boolean }).costoDeCatalogo) {
      return { ...item, montoEstimado: 0 };
    }
    if (id.startsWith('auto_prov_')) {
      const servId = id.slice('auto_prov_'.length);
      if (syncConCostoPorServicio.has(servId) && (pagadoPorItem.get(id) ?? 0) === 0) {
        return { ...item, montoEstimado: 0 };
      }
    }
    if (esPrecioDeVentaCopiado(id) && (item as { costoDeCatalogo?: boolean }).costoDeCatalogo) {
      const servId = id.slice('sync_budget_'.length);
      const autoProvId = `auto_prov_${servId}`;
      if (rawItems.some((r) => r.id === autoProvId) && (pagadoPorItem.get(autoProvId) ?? 0) > 0 && (pagadoPorItem.get(id) ?? 0) === 0) {
        return { ...item, montoEstimado: 0 };
      }
    }
    return item;
  });

  const personalList = Array.isArray(personalAsignado)
    ? personalAsignado
    : personalAsignado?.personalAsignado ?? (gestionCostos as any)?.personalAsignado ?? [];
  const rolesList = Array.isArray(personalAsignado) ? (roles ?? []) : (personalAsignado?.roles ?? roles ?? []);

  const personalCalculado = personalList.reduce((sum: number, pa: any) => {
    const rol = rolesList.find((r: any) => r.id === pa.rolId);
    const sueldo = resolverSueldoDelRol(pa, rol);
    const aportes = Math.round((sueldo * Math.max(0, aNumero(rol?.porcentajeAportesPatronales || 0))) / 100);
    return sum + sueldo + aportes;
  }, 0);

  // Suma de estimados de los cuatro bloques automáticos (se usa en costoEstimado).
  const estimadoBloques = BLOQUES_AUTOMATICOS.reduce(
    (suma, bloque) => suma + bloque.getEstimado(others, personalCalculado),
    0,
  );

  const estimadoDeItems = items.reduce((suma, item) => suma + Math.max(0, aNumero(item.montoEstimado)), 0);
  const costoEstimado = estimadoDeItems + estimadoBloques;

  const idsDeItems = new Set(items.map((item) => item.id));
  const idsDeBloques = new Set(BLOQUES_AUTOMATICOS.map((b) => b.id));

  // --- Renglones manuales: pagado si existe, estimado si no ---
  let realDeItems = 0;
  let sinRendir = 0;

  for (const item of items) {
    const pagado = Math.max(0, pagadoPorItem.get(item.id) ?? 0);
    const estimado = Math.max(0, aNumero(item.montoEstimado));
    const estaCerrado = Boolean(item.cerrado);
    if (pagado > 0) {
      if (estaCerrado) {
        realDeItems += pagado;
      } else {
        const costoRenglon = Math.max(pagado, estimado);
        realDeItems += costoRenglon;
        if (estimado > pagado) {
          sinRendir += (estimado - pagado);
        }
      }
    } else {
      realDeItems += estimado;
      sinRendir += estimado;
    }
  }

  // --- Bloques automáticos: misma lógica ---
  let realDeBloques = 0;

  for (const bloque of BLOQUES_AUTOMATICOS) {
    const pagado = Math.max(0, pagadoPorItem.get(bloque.id) ?? 0);
    const estimado = Math.max(0, bloque.getEstimado(others, personalCalculado));
    if (pagado > 0) {
      realDeBloques += Math.max(pagado, estimado);
      sinRendir += Math.max(0, estimado - pagado);
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

  function esGastoManualDeComision(texto?: string): boolean {
    if (!texto) return false;
    const t = String(texto).toLowerCase();
    const tieneComision = t.includes('comision') || t.includes('comisión');
    const tieneMP = t.includes('mercado pago') || t.includes('mercadopago') || /\bmp\b/i.test(t);
    return tieneComision && tieneMP;
  }

  const gastoManualComision = [
    ...items.filter((i) => esGastoManualDeComision(i.nombre || (i as any).concepto)).map((i) => Math.max(0, aNumero(i.montoEstimado))),
    ...pagos.filter((p) => esGastoManualDeComision(p.costoAsociadoId || (p as any).concepto || (p as any).detalle || (p as any).notas)).map((p) => Math.max(0, aNumero(p.monto))),
  ].reduce((sum, m) => sum + m, 0);

  // Cobros por Mercado Pago confirmados: comisión real y recargo cobrado.
  let comisionesMercadoPago = 0;
  let recargosCobrados = 0;
  let cobrosSinComisionInformada = 0;
  for (const cobro of pagosCliente ?? []) {
    if (cobro?.proveedorPago !== 'mercadopago' || !isConfirmedClientPayment(cobro)) continue;
    if (typeof cobro.comisionProveedor !== 'number' || !Number.isFinite(cobro.comisionProveedor)) {
      cobrosSinComisionInformada += 1;
      continue;
    }
    comisionesMercadoPago += Math.max(0, cobro.comisionProveedor);
    recargosCobrados += Math.max(0, aNumero(cobro.recargoFinanciero));
  }

  if (gastoManualComision > 0) {
    comisionesMercadoPago = Math.max(0, comisionesMercadoPago - gastoManualComision);
  }

  const costoReal = realDeItems + realDeBloques + pagosSueltos + comisionesMercadoPago;
  const ingreso = Math.max(0, aNumero(gestionCostos?.ingresosTotalesEstimados));

  const gananciaEstimada = ingreso - costoEstimado;
  const gananciaReal = ingreso + recargosCobrados - costoReal;

  return {
    personalEstimado: Math.max(Math.max(0, aNumero(others?.totalPersonalCost)), personalCalculado),
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
    comisionesMercadoPago,
    recargosCobrados,
    cobrosSinComisionInformada,
  };
}

/** Renglón copiado del presupuesto: su monto es el precio de venta, no un costo. */
export function esPrecioDeVentaCopiado(id: string | undefined): boolean {
  return String(id || '').startsWith('sync_budget_');
}
