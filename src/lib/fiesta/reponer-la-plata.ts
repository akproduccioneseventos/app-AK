import type { FiestaEnPlanificacion } from '@/types/fiesta';

export const CAMPOS_DE_PLATA_Y_CONTRATO = [
  'estado',
  'presupuestoId',
  'invoiceIds',
  'contratoFirmaInfo',
  'planDePagos',
  'pagosProveedores',
  'clientPaymentNotifications',
  'contratoDatos',
  'contratoServicioTexto',
] as const;

export const PAGO_DE_LA_COMPRA = ['pagado', 'montoPagado'] as const;

/** Deja lo de plata como está guardado. Para el guardado de quien no tiene permisos suficientes. */
export function reponerLaPlata(
  nueva: FiestaEnPlanificacion,
  guardada: FiestaEnPlanificacion | null,
  permisos?: { puedeContabilidad?: boolean; puedeSueldos?: boolean; puedeGanancias?: boolean }
): FiestaEnPlanificacion {
  const copia: Record<string, unknown> = { ...nueva };

  // 1. Contabilidad: protege pagosProveedores, planDePagos, clientPaymentNotifications, contratoDatos, contratoServicioTexto, estadosCompra
  if (!permisos?.puedeContabilidad) {
    for (const campo of CAMPOS_DE_PLATA_Y_CONTRATO) {
      if (guardada && campo in guardada) copia[campo] = (guardada as unknown as Record<string, unknown>)[campo];
      else delete copia[campo];
    }
    if (Array.isArray(copia.estadosCompra)) {
      const antes = guardada?.estadosCompra || [];
      copia.estadosCompra = (copia.estadosCompra as Record<string, unknown>[]).map((e) => {
        const previo = antes.find((o) => (o.proveedorId && o.proveedorId === e.proveedorId) || o.proveedor === e.proveedor) as Record<string, unknown> | undefined;
        const r = { ...e };
        for (const k of PAGO_DE_LA_COMPRA) {
          if (previo && k in previo) r[k] = previo[k]; else delete r[k];
        }
        return r;
      });
    }
  }

  // 2. Ganancias: protege gestionCostos
  if (!permisos?.puedeGanancias) {
    if (guardada && 'gestionCostos' in guardada) {
      copia.gestionCostos = guardada.gestionCostos;
    } else {
      delete copia.gestionCostos;
    }
  }

  // 3. Sueldos: protege eventSalary en personalAsignado (se conserva el guardado de cada empleadoId y no se acepta uno nuevo)
  if (!permisos?.puedeSueldos) {
    if (Array.isArray(copia.personalAsignado)) {
      const antes = guardada?.personalAsignado || [];
      const antesPorId = new Map(antes.map((p) => [p.empleadoId, p]));
      copia.personalAsignado = copia.personalAsignado.map((p) => {
        const previo = antesPorId.get(p.empleadoId);
        return {
          ...p,
          eventSalary: previo?.eventSalary,
        };
      });
    } else if (guardada?.personalAsignado) {
      copia.personalAsignado = guardada.personalAsignado;
    }
  }

  return copia as unknown as FiestaEnPlanificacion;
}
