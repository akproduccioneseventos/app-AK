/**
 * Lo que hay que comprar para el menú asignado a la fiesta (Catering → asignar menú).
 *
 * Vive aparte de la pantalla porque el arreglo del 17/11 quedó adentro del bloque que sólo corre con presupuesto, y el
 * auditor lo probó sin presupuesto: la lista seguía vacía (auditoría del 18/11/2026, N26). La pantalla lo llama siempre.
 */
type Ingrediente = {
  name: string;
  quantityPerPerson?: unknown;
  unit?: string;
  porEvento?: boolean;
  costoUnitario?: number;
  proveedor?: string;
  origenId?: string;
};
type Plato = { id: string; name: string; ingredients?: Ingrediente[] };
type Insumo = { id: string; valorUnitarioEstimado?: number; proveedor?: string; porEvento?: boolean; unidad?: string };

export type CompraDelMenu = {
  nombre: string;
  cantidadNecesaria: number;
  unit?: string;
  porEvento?: boolean;
  costoUnitario?: number;
  proveedor: string;
  origen: string;
  origenId?: string;
};

function numero(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : parseFloat(String(valor ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function esPorEvento(ing: Ingrediente, insumo?: Insumo): boolean {
  return Boolean(
    ing.porEvento ||
    insumo?.porEvento ||
    (ing.unit || '').trim().toLowerCase() === 'por evento' ||
    (insumo?.unidad || '').trim().toLowerCase() === 'por evento'
  );
}

export function comprasDelMenuAsignado(
  menu: { items?: Plato[] } | undefined,
  platosYaContados: Set<string>,
  totalInvitados: number,
  catalogoInsumos: Insumo[],
): { compras: CompraDelMenu[]; sinIngredientes: string[] } {
  const compras: CompraDelMenu[] = [];
  const sinIngredientes: string[] = [];
  if (!menu) return { compras, sinIngredientes };
  for (const plato of menu.items || []) {
    if (platosYaContados.has(plato.id)) continue;
    if (!plato.ingredients?.length) {
      sinIngredientes.push(plato.name);
      continue;
    }
    for (const ing of plato.ingredients) {
      const porPersona = numero(ing.quantityPerPerson);
      if (porPersona <= 0) continue;
      const insumo = catalogoInsumos.find(ci => ci.id === ing.origenId);
      const porEvento = esPorEvento(ing, insumo);
      compras.push({
        nombre: ing.name,
        cantidadNecesaria: porEvento ? porPersona : porPersona * totalInvitados,
        unit: ing.unit,
        ...(porEvento ? { porEvento: true } : {}),
        costoUnitario: insumo?.valorUnitarioEstimado || ing.costoUnitario,
        proveedor: ing.proveedor || insumo?.proveedor || 'Sin especificar',
        origen: `Menú asignado: ${plato.name}`,
        origenId: ing.origenId,
      });
    }
  }
  return { compras, sinIngredientes };
}
