import type { ArmadoRapidoConfig } from '@/types/armado-rapido';
import type { ServicioEmpresa } from '@/types/empresa';
import type { ItemPresupuestado } from '@/types/presupuesto';
import { getGuestCountForItem, recalcularCostoItem } from '@/lib/calculations';
import {
  buildAnnualAdjustmentProjection,
  calculatePricePerPerson,
  type AnnualAdjustmentProjection,
} from '@/lib/budget/formal-budget';

export type SimulatorSelectedService = {
  id: string;
  esRegalo?: boolean;
};

export type SimulatorDetailedService = {
  id: string;
  nombre: string;
  esRegalo: boolean;
  cantidad: number;
  precioUnitario: number;
  costoTotal: number;
  categoria: string;
  unidad?: string;
  subcategoria?: string;
  calculationMethod?: ServicioEmpresa['calculationMethod'];
  precioBase?: number;
  precioPorPersona?: number;
  invitadosPorUnidad?: number;
  tramosDePrecio?: ServicioEmpresa['tramosDePrecio'];
  imageUrl?: string;
  esRecomendado?: boolean;
};

export type SimulatorPriceStats = {
  subtotalBruto: number;
  subtotalVenta: number;
  descPromo: number;
  ahorroRegalos: number;
  totalSinAjuste: number;
  ajusteAnual: number;
  totalFinal: number;
  totalProyectado: number;
  aniosDiferencia: number;
  agrupados: Record<string, SimulatorDetailedService[]>;
  detallados: SimulatorDetailedService[];
  annualProjection: AnnualAdjustmentProjection;
  precioPorPersona: number;
  discountPercentage: number;
};

type CalculateSimulatorPricingInput = {
  config: ArmadoRapidoConfig;
  services: ServicioEmpresa[];
  adultos: number;
  ninosYAdolescentes: number;
  selectedPaqueteId?: string;
  selectedServices?: SimulatorSelectedService[];
  syntheticServices?: Array<{ servicio: ServicioEmpresa; esRegalo?: boolean }>;
  eventoFecha?: string | Date | null;
  annualAdjustmentPercentage: number;
  currentYear?: number;
};

export function getSimulatorServiceCalculatedData(
  servicio: ServicioEmpresa,
  adultos: number,
  ninosYAdolescentes: number,
): { qty: number; unitPrice: number; total: number } {
  const basePrice = servicio.precioVenta || servicio.precioPorPersona || servicio.precioBase || 0;
  const itemDataForCalc: ItemPresupuestado = {
    idServicioCatalogo: servicio.id,
    nombreServicio: servicio.nombre,
    cantidad: 1,
    precioUnitario: basePrice,
    precioUnitarioPresupuesto: basePrice,
    costoTotalItem: 0,
    categoriaServicio: servicio.categoria,
    subcategoria: servicio.subcategoria,
    calculationMethod: servicio.calculationMethod,
    precioBase: servicio.precioBase,
    precioPorPersona: servicio.precioPorPersona,
    invitadosPorUnidad: servicio.invitadosPorUnidad,
    tramosDePrecio: servicio.tramosDePrecio,
  };

  const total = recalcularCostoItem(itemDataForCalc, adultos, 0, ninosYAdolescentes);
  const guestTarget = getGuestCountForItem(itemDataForCalc, adultos, 0, ninosYAdolescentes);

  if (servicio.calculationMethod === 'porPersona') {
    return { qty: guestTarget, unitPrice: servicio.precioPorPersona || basePrice, total };
  }
  if (servicio.calculationMethod === 'ratio') {
    const ratio = Number(servicio.invitadosPorUnidad) || 1;
    return { qty: Math.ceil(guestTarget / ratio), unitPrice: servicio.precioBase || basePrice, total };
  }
  if (servicio.calculationMethod === 'tramos') {
    return { qty: 1, unitPrice: total, total };
  }
  return { qty: 1, unitPrice: servicio.precioVenta || basePrice, total };
}

export function calculateSimulatorPricing(input: CalculateSimulatorPricingInput): SimulatorPriceStats {
  const selected = new Map<string, { servicio: ServicioEmpresa; esRegalo: boolean }>();
  const serviceById = new Map(input.services.map((service) => [service.id, service]));

  const includeService = (servicio: ServicioEmpresa | undefined, esRegalo = false) => {
    if (!servicio) return;
    const existing = selected.get(servicio.id);
    selected.set(servicio.id, {
      servicio,
      // A service included as a package gift must never become chargeable because
      // the same id was also selected manually.
      esRegalo: Boolean(existing?.esRegalo || esRegalo),
    });
  };

  const paquete = input.config.paquetes.find((item) => item.id === input.selectedPaqueteId);
  paquete?.serviciosIncluidos.forEach((item) => includeService(serviceById.get(item.id), item.esRegalo));
  input.selectedServices?.forEach((item) => includeService(serviceById.get(item.id), item.esRegalo));
  input.syntheticServices?.forEach((item) => includeService(item.servicio, item.esRegalo));

  input.config.serviceDependencies?.forEach((dependency) => {
    if (selected.has(dependency.triggerServiceId) && !selected.has(dependency.requiredServiceId)) {
      includeService(serviceById.get(dependency.requiredServiceId));
    }
  });

  const recommendedIds = new Set<string>(input.config.recommendedDishIds || []);
  input.config.platosVisibles?.forEach((item) => {
    if (item.recommended) recommendedIds.add(item.id);
  });

  let subtotalBruto = 0;
  let subtotalVenta = 0;
  let ahorroRegalos = 0;
  const detallados: SimulatorDetailedService[] = [];

  selected.forEach(({ servicio, esRegalo }) => {
    const calculated = getSimulatorServiceCalculatedData(
      servicio,
      input.adultos,
      input.ninosYAdolescentes,
    );
    subtotalBruto += calculated.total;
    if (esRegalo) ahorroRegalos += calculated.total;
    else subtotalVenta += calculated.total;

    detallados.push({
      id: servicio.id,
      nombre: servicio.nombre,
      esRegalo,
      cantidad: calculated.qty,
      precioUnitario: calculated.unitPrice,
      costoTotal: calculated.total,
      categoria: esRegalo ? 'Regalos Incluidos' : (servicio.categoria || 'Varios'),
      unidad: servicio.unidad,
      subcategoria: servicio.subcategoria,
      calculationMethod: servicio.calculationMethod,
      precioBase: servicio.precioBase,
      precioPorPersona: servicio.precioPorPersona,
      invitadosPorUnidad: servicio.invitadosPorUnidad,
      tramosDePrecio: servicio.tramosDePrecio,
      imageUrl: servicio.imageUrl,
      esRecomendado: recommendedIds.has(servicio.id) || Boolean(servicio.isFeatured),
    });
  });

  const discountPercentage = Math.max(0, Number(input.config.descuentoGeneral ?? 15) || 0);
  const descPromo = Math.round(subtotalVenta * (discountPercentage / 100));
  const totalFinal = Math.max(0, Math.round(subtotalVenta - descPromo));
  const annualProjection = buildAnnualAdjustmentProjection({
    baseTotal: totalFinal,
    eventDate: input.eventoFecha,
    adjustmentPct: input.annualAdjustmentPercentage,
    currentYear: input.currentYear,
  });

  detallados.sort((a, b) => {
    if (a.categoria === 'Regalos Incluidos') return 1;
    if (b.categoria === 'Regalos Incluidos') return -1;
    return a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre);
  });

  const agrupados = detallados.reduce<Record<string, SimulatorDetailedService[]>>((groups, item) => {
    (groups[item.categoria] ||= []).push(item);
    return groups;
  }, {});

  return {
    subtotalBruto,
    subtotalVenta,
    descPromo,
    ahorroRegalos,
    totalSinAjuste: totalFinal,
    ajusteAnual: 0,
    totalFinal,
    totalProyectado: totalFinal,
    aniosDiferencia: 0,
    agrupados,
    detallados,
    annualProjection,
    precioPorPersona: calculatePricePerPerson(
      totalFinal,
      input.adultos + input.ninosYAdolescentes,
    ),
    discountPercentage,
  };
}

export function simulatorDetailsToBudgetItems(
  details: SimulatorDetailedService[],
): Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] {
  return details.map((item) => ({
    idServicioCatalogo: item.id,
    nombreServicio: item.nombre,
    cantidad: item.cantidad,
    unidad: item.unidad,
    precioUnitario: item.precioUnitario,
    precioUnitarioPresupuesto: item.precioUnitario,
    categoriaServicio: item.categoria,
    subcategoria: item.subcategoria,
    esRegalo: item.esRegalo,
    calculationMethod: item.calculationMethod,
    precioBase: item.precioBase,
    precioPorPersona: item.precioPorPersona,
    invitadosPorUnidad: item.invitadosPorUnidad,
    tramosDePrecio: item.tramosDePrecio,
  }));
}
