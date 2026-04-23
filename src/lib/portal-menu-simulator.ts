import type { ItemPresupuestado, Presupuesto } from '@/types/presupuesto';
import { recalcularCostoItem } from '@/lib/calculations';

const ADULT_KEYWORDS = ['adult', 'mayor', 'menu adulto', 'menú adulto'];
const KIDS_KEYWORDS = ['niñ', 'nin', 'adolesc', 'teen', 'juvenil'];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function scoreItem(item: ItemPresupuestado, keywords: string[]) {
  const text = normalize(`${item.nombreServicio} ${item.categoriaServicio ?? ''} ${item.subcategoria ?? ''}`);
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}

function getUnitPrice(item: ItemPresupuestado) {
  if (item.cantidad > 0 && item.costoTotalItem > 0) return item.costoTotalItem / item.cantidad;
  if (item.precioUnitario > 0) return item.precioUnitario;
  if (item.precioPorPersona && item.precioPorPersona > 0) return item.precioPorPersona;
  return 0;
}

export function resolveMenuUnitPrices(presupuesto?: Presupuesto | null) {
  const items = presupuesto?.itemsPresupuestados ?? [];
  const invitadosTotales = presupuesto?.invitadosCantidad ?? 0;
  const fallbackUnit = invitadosTotales > 0
    ? ((presupuesto?.totalConDescuento ?? presupuesto?.costoTotalEstimado ?? 0) / invitadosTotales)
    : 0;

  const adultItems = items.filter((item) => scoreItem(item, ADULT_KEYWORDS));
  const kidsItems = items.filter((item) => scoreItem(item, KIDS_KEYWORDS));

  const adultUnit = adultItems.length
    ? adultItems.reduce((acc, item) => acc + getUnitPrice(item), 0) / adultItems.length
    : fallbackUnit;
  const kidsUnit = kidsItems.length
    ? kidsItems.reduce((acc, item) => acc + getUnitPrice(item), 0) / kidsItems.length
    : fallbackUnit;

  return {
    adultUnit: Number.isFinite(adultUnit) ? adultUnit : 0,
    kidsUnit: Number.isFinite(kidsUnit) ? kidsUnit : 0,
  };
}

export function calculateMenuSimulationTotals({
  adultosDelta,
  ninosAdolescentesDelta,
  adultUnitPrice,
  kidsUnitPrice,
  currentTotal,
}: {
  adultosDelta: number;
  ninosAdolescentesDelta: number;
  adultUnitPrice: number;
  kidsUnitPrice: number;
  currentTotal: number;
}) {
  const aumentoAdultos = Math.max(0, adultosDelta) * Math.max(0, adultUnitPrice);
  const aumentoKids = Math.max(0, ninosAdolescentesDelta) * Math.max(0, kidsUnitPrice);
  const aumentoTotal = aumentoAdultos + aumentoKids;
  const nuevoTotal = currentTotal + aumentoTotal;

  return {
    aumentoAdultos,
    aumentoKids,
    aumentoTotal,
    nuevoTotal,
  };
}

/**
 * SIMULADOR DE INVITADOS SINCRONIZADO CON PRESUPUESTO REAL
 *
 * Recalcula el costo total del evento usando la lógica real del presupuesto,
 * diferenciando estrictamente servicios fijos (que no cambian) vs servicios
 * por persona (que escalan con la cantidad de invitados).
 */
export interface GuestSimulationResult {
  // Invitados actuales
  adultosActuales: number;
  ninosActuales: number;
  totalActual: number;
  // Invitados nuevos
  adultosNuevos: number;
  ninosNuevos: number;
  totalNuevo: number;
  // Impacto económico
  costoActual: number;
  costoNuevo: number;
  impacto: number;
  // Desglose por tipo de servicio
  costosFijosActuales: number;
  costoVariableActual: number;
  costoVariableNuevo: number;
  serviciosFijos: Array<{ nombre: string; costo: number }>;
  serviciosVariables: Array<{ nombre: string; costoActual: number; costoNuevo: number; delta: number }>;
}

export function simulateGuestCostImpact({
  presupuesto,
  adultDelta,
  kidsDelta,
}: {
  presupuesto: Presupuesto;
  adultDelta: number;
  kidsDelta: number;
}): GuestSimulationResult {
  const items = presupuesto.itemsPresupuestados ?? [];

  const adultosActuales = presupuesto.invitadosAdultos ?? presupuesto.invitadosCantidad ?? 0;
  const adolescentesActuales = presupuesto.invitadosAdolescentes ?? 0;
  const ninosActualesRaw = presupuesto.invitadosNinos ?? 0;

  /**
   * The UI combines adolescentes + niños into one "menores" input for simplicity.
   * Internally, recalcularCostoItem needs the two buckets separately, so kidsDelta is
   * applied entirely to the niños bucket (adolescentes stay fixed). This preserves the
   * original adolescentes/niños split while correctly scaling any per-person cost for
   * the newly added minors.
   */
  const menoresActuales = ninosActualesRaw + adolescentesActuales;
  const adultosNuevos = Math.max(0, adultosActuales + adultDelta);
  const menoresNuevos = Math.max(0, menoresActuales + kidsDelta);

  const serviciosFijos: GuestSimulationResult['serviciosFijos'] = [];
  const serviciosVariables: GuestSimulationResult['serviciosVariables'] = [];

  let costoActual = 0;
  let costoNuevo = 0;
  let costosFijosActuales = 0;
  let costoVariableActual = 0;
  let costoVariableNuevo = 0;

  for (const item of items) {
    if (item.esRegalo) continue;

    // Apply the kid delta entirely to the niños bucket; adolescentes remain unchanged
    // because they are already factored into menoresActuales and we preserve the split.
    const ninosNuevosItem = Math.max(0, ninosActualesRaw + kidsDelta);

    const itemCostoActual = recalcularCostoItem(item, adultosActuales, adolescentesActuales, ninosActualesRaw);
    const itemCostoNuevo = recalcularCostoItem(item, adultosNuevos, adolescentesActuales, ninosNuevosItem);

    costoActual += itemCostoActual;
    costoNuevo += itemCostoNuevo;

    // Classify as fixed when the calculation method is explicitly 'fijo', or when the item
    // lacks a calculationMethod and has no per-person pricing (legacy flat-fee items).
    const isFijo =
      item.calculationMethod === 'fijo' ||
      (!item.calculationMethod && item.precioPorPersona === undefined);

    if (isFijo || Math.abs(itemCostoNuevo - itemCostoActual) < 1) {
      costosFijosActuales += itemCostoActual;
      serviciosFijos.push({ nombre: item.nombreServicio, costo: itemCostoActual });
    } else {
      costoVariableActual += itemCostoActual;
      costoVariableNuevo += itemCostoNuevo;
      serviciosVariables.push({
        nombre: item.nombreServicio,
        costoActual: itemCostoActual,
        costoNuevo: itemCostoNuevo,
        delta: itemCostoNuevo - itemCostoActual,
      });
    }
  }

  // Fallback: if no items, use total from presupuesto header
  if (items.length === 0) {
    costoActual = presupuesto.totalConDescuento ?? presupuesto.costoTotalEstimado ?? 0;
    costoNuevo = costoActual;
  }

  return {
    adultosActuales,
    ninosActuales: menoresActuales,
    totalActual: adultosActuales + menoresActuales,
    adultosNuevos,
    ninosNuevos: menoresNuevos,
    totalNuevo: adultosNuevos + menoresNuevos,
    costoActual,
    costoNuevo,
    impacto: costoNuevo - costoActual,
    costosFijosActuales,
    costoVariableActual,
    costoVariableNuevo,
    serviciosFijos,
    serviciosVariables,
  };
}
