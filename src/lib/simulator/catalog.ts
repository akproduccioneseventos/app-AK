import type { FullMenu, MenuItem } from '@/types/catering';
import type { ServicioEmpresa } from '@/types/empresa';

export const BUFFET_PRICE_SURCHARGE = 200;

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
  let sellingPrice = getMenuItemSellingPrice(item);
  if (
    item.id &&
    item.id.endsWith(SUFIJO_VARIANTE_BUFET) &&
    (!item.suggestedSellingPrice || item.suggestedSellingPrice <= 0)
  ) {
    sellingPrice += BUFFET_PRICE_SURCHARGE;
  }
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

/**
 * Las cuatro variantes con mesa buffet salen de su plato base con guarnición,
 * costando exactamente 200 pesos uruguayos más que la versión base con guarnición.
 */
export const CONFIG_VARIANTES_BUFET = [
  {
    baseName: 'ASADO COMPLETO C/ GUARNICIÓN',
    cleanBuffetName: 'Asado completo con mesa buffet',
  },
  {
    baseName: 'POLLO ARROLLADO C/ GUARNICIÓN',
    cleanBuffetName: 'Pollo arrollado con mesa buffet',
  },
  {
    baseName: 'CORDERO ASADO C/ GUARNICIÓN',
    cleanBuffetName: 'Cordero asado con mesa buffet',
  },
  {
    baseName: 'CERDO ARROLLADO C/ GUARNICIÓN',
    cleanBuffetName: 'Cerdo arrollado con mesa buffet',
  },
];

export const SUFIJO_VARIANTE_BUFET = '_virtual_buffet';

export function agregarVariantesBufet(menus: FullMenu[]): FullMenu[] {
  return menus.map((menu) => {
    if (menu.id !== 'menu_principales_maestro') return menu;
    const items = menu.items || [];
    const variantes: MenuItem[] = [];
    const norm = (s: string) =>
      s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

    for (const config of CONFIG_VARIANTES_BUFET) {
      const targetNorm = norm(config.baseName);
      const base = items.find((item) => norm(item.name) === targetNorm);
      if (!base) continue;

      const id = `${base.id}${SUFIJO_VARIANTE_BUFET}`;
      const nombreBufet = config.cleanBuffetName;

      if (items.some((item) => item.id === id || norm(item.name) === norm(nombreBufet))) continue;

      const baseSellingPrice = getMenuItemSellingPrice(base);
      const buffetSellingPrice = baseSellingPrice + BUFFET_PRICE_SURCHARGE;

      variantes.push({
        ...base,
        id,
        name: nombreBufet,
        suggestedSellingPrice: buffetSellingPrice,
      });
    }
    return variantes.length ? { ...menu, items: [...items, ...variantes] } : menu;
  });
}

export function buildAuthoritativeSimulatorServices(
  services: ServicioEmpresa[],
  menus: FullMenu[],
): ServicioEmpresa[] {
  const byId = new Map<string, ServicioEmpresa>();

  for (const service of services) {
    if (service.tipoItem === 'Servicio') byId.set(service.id, service);
  }

  for (const menu of agregarVariantesBufet(menus)) {
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
