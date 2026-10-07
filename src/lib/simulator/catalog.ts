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

/**
 * Las cuatro variantes "CON MESA BUFET" no se guardan: salen de su plato con guarnicion, con
 * el mismo precio y receta. Antes se armaban solo al MOSTRAR los menus y el servidor, al
 * guardar el presupuesto, no las conocia: el simulador las ofrecia y despues las rechazaba
 * (Codex, auditoria 78). Ahora las dos puntas usan esta funcion.
 */
const PLATOS_CON_VARIANTE_BUFET = [
  'ASADO COMPLETO C/ GUARNICIÓN',
  'POLLO ARROLLADO C/ GUARNICIÓN',
  'CORDERO ASADO C/ GUARNICIÓN',
  'CERDO ARROLLADO C/ GUARNICIÓN',
];

export const SUFIJO_VARIANTE_BUFET = '_virtual_buffet';

export function agregarVariantesBufet(menus: FullMenu[]): FullMenu[] {
  return menus.map((menu) => {
    if (menu.id !== 'menu_principales_maestro') return menu;
    const items = menu.items || [];
    const variantes: MenuItem[] = [];
    for (const nombre of PLATOS_CON_VARIANTE_BUFET) {
      const base = items.find((item) => item.name === nombre);
      if (!base) continue;
      const nombreBufet = nombre.replace('C/ GUARNICIÓN', 'CON MESA BUFET');
      const id = `${base.id}${SUFIJO_VARIANTE_BUFET}`;
      if (items.some((item) => item.name === nombreBufet || item.id === id)) continue;
      variantes.push({ ...base, id, name: nombreBufet });
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
