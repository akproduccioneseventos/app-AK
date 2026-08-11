import type { ServicioEmpresa } from '@/types/empresa';
import { recalcularCostoItem } from '@/lib/calculations';

export function calcularTotalServicioLed(
  servicio: ServicioEmpresa,
  adultos: number,
  adolescentes: number,
): number {
  const precio = servicio.calculationMethod === 'porPersona'
    ? Number(servicio.precioPorPersona ?? servicio.precioVenta) || 0
    : servicio.calculationMethod === 'ratio'
      ? Number(servicio.precioBase ?? servicio.precioVenta) || 0
      : Number(servicio.precioVenta) || 0;

  return recalcularCostoItem({
    idServicioCatalogo: servicio.id,
    nombreServicio: servicio.nombre,
    cantidad: Number(servicio.cantidad) || 1,
    precioUnitario: precio,
    precioUnitarioPresupuesto: precio,
    costoTotalItem: 0,
    categoriaServicio: servicio.categoria,
    subcategoria: servicio.subcategoria,
    calculationMethod: servicio.calculationMethod || 'fijo',
    invitadosPorUnidad: servicio.invitadosPorUnidad,
    tramosDePrecio: servicio.tramosDePrecio,
  }, adultos, adolescentes, 0);
}
