/**
 * Para cada compra nueva, la misma compra guardada (Codex 147/185, orden 185). Primero por `proveedorId`;
 * sin id, por nombre Y por orden entre las del mismo nombre: con dos proveedores que se llaman igual, el
 * pago de uno no se le copia al otro. Una compra con id nunca se empareja por nombre con otra que tiene
 * un id distinto.
 */
export function compraGuardadaDeCadaUna<T extends Record<string, unknown>>(antes: T[], nuevas: Record<string, unknown>[]): (T | undefined)[] {
  const usadas = new Set<number>();
  return nuevas.map((e) => {
    if (e.proveedorId) {
      const i = antes.findIndex((o, idx) => !usadas.has(idx) && o.proveedorId === e.proveedorId);
      if (i >= 0) { usadas.add(i); return antes[i]; }
    }
    // La primera del mismo nombre que todavía no se emparejó: así quedan en el mismo orden.
    const nombre = String(e.proveedor ?? '');
    const i = antes.findIndex((o, idx) => !usadas.has(idx) && String(o.proveedor ?? '') === nombre
      && (!o.proveedorId || !e.proveedorId));
    if (i < 0) return undefined;
    usadas.add(i);
    return antes[i];
  });
}


export function reponerLaPlata(
  intento: any,
  guardada: any,
  permisos: { puedeContabilidad?: boolean; puedeSueldos?: boolean; puedeGanancias?: boolean }
): any {
  const resultado = { ...intento };

  // 1. Ganancias
  if (!permisos.puedeGanancias) {
    resultado.gestionCostos = guardada?.gestionCostos;
  }

  // 2. Sueldos
  if (!permisos.puedeSueldos) {
    if (intento?.personalAsignado && guardada?.personalAsignado) {
      resultado.personalAsignado = intento.personalAsignado.map((p: any) => {
        const previo = guardada.personalAsignado.find((orig: any) => orig.empleadoId === p.empleadoId);
        const copiaP = { ...p };
        if (previo && previo.eventSalary !== undefined) {
          copiaP.eventSalary = previo.eventSalary;
        } else {
          delete copiaP.eventSalary;
        }
        return copiaP;
      });
    } else {
      resultado.personalAsignado = guardada?.personalAsignado;
    }
  }

  // 3. Contabilidad
  if (!permisos.puedeContabilidad) {
    resultado.planDePagos = guardada?.planDePagos;
    resultado.contratoDatos = guardada?.contratoDatos;
    resultado.pagosProveedores = guardada?.pagosProveedores;
    resultado.clientPaymentNotifications = guardada?.clientPaymentNotifications;
    if (intento?.estadosCompra && guardada?.estadosCompra) {
      resultado.estadosCompra = intento.estadosCompra.map((ec: any) => {
        const previo = guardada.estadosCompra.find((orig: any) => orig.id === ec.id || orig.proveedorId === ec.proveedorId);
        const copiaEc = { ...ec };
        if (previo && previo.pagado !== undefined) {
          copiaEc.pagado = previo.pagado;
        } else {
          delete copiaEc.pagado;
        }
        if (previo && previo.montoPagado !== undefined) {
          copiaEc.montoPagado = previo.montoPagado;
        } else {
          delete copiaEc.montoPagado;
        }
        return copiaEc;
      });
    }
  }

  return resultado;
}
