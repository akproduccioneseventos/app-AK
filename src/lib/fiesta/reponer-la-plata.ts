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
