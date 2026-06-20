import type { FullMenu, MenuItem } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';

export function getMenuItemSellingPrice(item: MenuItem): number {
  const explicitPrice = Number(item.suggestedSellingPrice);
  if (Number.isFinite(explicitPrice) && explicitPrice > 0) return Math.round(explicitPrice);

  const cost = Math.max(0, Number(item.totalDishCost) || 0);
  const margin = Math.max(0, Number(item.profitMargin ?? 120) || 0);
  return Math.round(cost * (1 + margin / 100));
}

export function menuItemToSimulatorService(
  item: MenuItem,
  options: { imageUrl?: string; featured?: boolean } = {},
): ServicioEmpresa {
  const sellingPrice = getMenuItemSellingPrice(item);
  return {
    id: item.id,
    nombre: item.name,
    tipoItem: 'Servicio',
    categoria: 'Servicio de catering',
    subcategoria: item.type,
    calculationMethod: 'porPersona',
    precioPorPersona: sellingPrice,
    precioVenta: sellingPrice,
    precioBase: sellingPrice,
    valorUnitarioEstimado: item.totalDishCost,
    imageUrl: options.imageUrl ?? item.imageUrl,
    isFeatured: Boolean(options.featured ?? item.isFeatured),
  };
}

export function buildAuthoritativeSimulatorServices(
  services: ServicioEmpresa[],
  menus: FullMenu[],
): ServicioEmpresa[] {
  const byId = new Map<string, ServicioEmpresa>();

  for (const service of services) {
    if (service.tipoItem === 'Servicio') byId.set(service.id, service);
  }

  for (const menu of menus) {
    for (const item of menu.items || []) {
      if (!byId.has(item.id)) {
        byId.set(item.id, menuItemToSimulatorService(item, {
          imageUrl: item.imageUrl || menu.imageUrl,
          featured: Boolean(item.isFeatured || menu.featured),
        }));
      }
    }
  }

  return Array.from(byId.values());
}
