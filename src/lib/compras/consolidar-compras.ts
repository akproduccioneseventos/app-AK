/**
 * Junta los renglones crudos de las recetas y pedidos en la lista de compras.
 *
 * Lo encontro Codex el 10 de octubre de 2026 (orden 139): la clave juntaba 200 g y 2 kg
 * en el mismo renglon, pero las pantallas sumaban los numeros crudos ("202 G", $20 en
 * vez de 2,20 kg, $220). Aca se convierte TODO a la unidad del renglon antes de sumar:
 * cantidad, stock y precio. Las dos pantallas (lista-compras y resumen-planificacion)
 * usan esta misma funcion, asi lo que se calcula es lo que se prueba.
 *
 * Reglas: unidad desconocida queda en su propio renglon; peso y volumen nunca se
 * mezclan; los pedidos fijos (`isOrder`) no descuentan stock.
 */
import { claveDeConsolidado, convertir, normalizarUnidad, unidadDeMuestra } from './unidades';

export type CompraCruda = {
  nombre: string;
  cantidadNecesaria: number;
  unit: string;
  costoUnitario: number;
  /** Unidad en la que esta expresado el precio (la del catalogo). Si falta, la de la receta. */
  unidadCosto?: string;
  proveedor: string;
  /** Si falta, se junta por `proveedor`. */
  proveedorId?: string;
  origen: string;
  origenId?: string;
  isOrder?: boolean;
  /** Stock del catalogo, en `unidadStock` (si falta la unidad, se toma la de la receta). */
  stockDisponible?: number;
  unidadStock?: string;
};

export type CompraConsolidada = {
  id: string;
  nombre: string;
  cantidadNecesaria: number;
  stockDisponible: number;
  cantidadAComprar: number;
  unit: string;
  /** Precio por `unit` (ya convertido desde la unidad del catalogo). */
  costoUnitario: number;
  costoTotalFaltante: number;
  proveedor: string;
  proveedorId: string;
  origen: string;
  origenId?: string;
  isOrder?: boolean;
};

export type OpcionesConsolidado = {
  /** 'arriba': se compra entero (lista de compras). 'ninguno': cantidad exacta (resumen). */
  redondeo: 'arriba' | 'ninguno';
  /** Redondear la plata a pesos enteros. */
  plataEntera?: boolean;
  /** Anotar de que recetas viene cada renglon. */
  juntarOrigenes?: boolean;
};

const limpiar = (n: number) => Math.round(n * 1e9) / 1e9;

export function consolidarCompras(crudos: CompraCruda[], opciones: OpcionesConsolidado): CompraConsolidada[] {
  const grupos = new Map<string, { item: CompraConsolidada; fuente: CompraCruda; granularidad: number }>();

  crudos.forEach(raw => {
    const proveedorId = raw.proveedorId ?? raw.proveedor;
    const key = claveDeConsolidado(raw.nombre, proveedorId, raw.unit);
    const { factor } = normalizarUnidad(raw.unit);
    const base = unidadDeMuestra(raw.unit);
    // Se suma en la unidad del renglon. Una unidad desconocida tiene factor 1.
    const enBase = convertir(raw.cantidadNecesaria, raw.unit, base) ?? raw.cantidadNecesaria;
    const existente = grupos.get(key);
    if (existente) {
      existente.item.cantidadNecesaria += enBase;
      existente.granularidad = Math.min(existente.granularidad, factor);
      if (opciones.juntarOrigenes && !existente.item.origen.includes(raw.origen)) {
        existente.item.origen += `, ${raw.origen}`;
      }
      return;
    }
    let stock = 0;
    const stockCrudo = raw.stockDisponible || 0;
    if (stockCrudo) {
      const unidadStock = raw.unidadStock?.trim() ? raw.unidadStock : raw.unit;
      stock = convertir(stockCrudo, unidadStock, base) ?? 0;
    }
    grupos.set(key, {
      fuente: raw,
      granularidad: factor,
      item: {
        id: key,
        nombre: raw.nombre,
        cantidadNecesaria: enBase,
        stockDisponible: stock,
        cantidadAComprar: 0,
        unit: base,
        costoUnitario: raw.costoUnitario,
        costoTotalFaltante: 0,
        proveedor: raw.proveedor,
        proveedorId,
        origen: raw.origen,
        origenId: raw.origenId,
        isOrder: raw.isOrder,
      },
    });
  });

  return Array.from(grupos.values()).map(({ item, fuente, granularidad }) => {
    const necesidad = limpiar(item.cantidadNecesaria);
    const faltante = item.isOrder ? necesidad : Math.max(0, limpiar(necesidad - item.stockDisponible));
    // Se compra para arriba, en el escalon mas chico que aparecio (200 g + 2 kg se
    // redondea al gramo, no al kilo). Una sola unidad se redondea a entero como siempre.
    const paso = granularidad > 0 ? granularidad : 1;
    const aComprar =
      opciones.redondeo === 'arriba' ? limpiar(Math.ceil(faltante / paso - 1e-9) * paso) : faltante;
    // El precio viene en la unidad del catalogo: se pasa a la unidad del renglon.
    const porUnidad = convertir(1, item.unit, fuente.unidadCosto?.trim() ? fuente.unidadCosto : fuente.unit);
    const precio = porUnidad === null ? fuente.costoUnitario : fuente.costoUnitario * porUnidad;
    const total = precio * aComprar;
    return {
      ...item,
      cantidadNecesaria: necesidad,
      cantidadAComprar: aComprar,
      costoUnitario: precio,
      costoTotalFaltante: opciones.plataEntera ? Math.round(total) : total,
    };
  });
}
