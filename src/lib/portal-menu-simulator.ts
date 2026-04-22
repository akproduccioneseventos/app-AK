import type { ItemPresupuestado, Presupuesto } from '@/types/presupuesto';

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
