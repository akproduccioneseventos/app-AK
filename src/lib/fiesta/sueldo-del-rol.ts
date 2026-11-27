export interface AsignacionSueldoInput {
  eventSalary?: number | null;
  sueldo?: number | null;
}

export interface RolSueldoInput {
  sueldoPorEvento?: number | null;
}

/**
 * Resuelve el sueldo efectivo de una asignación usando el sueldo acordado si existe
 * y, cuando quedó en 0/sin definir, el sueldo base del rol en Ajustes.
 */
export function resolverSueldoDelRol(
  asignacion?: AsignacionSueldoInput | null,
  rol?: RolSueldoInput | null,
): number {
  const acordado = Number(asignacion?.eventSalary || 0);
  if (Number.isFinite(acordado) && acordado > 0) return acordado;

  const alternativo = Number(asignacion?.sueldo || 0);
  if (Number.isFinite(alternativo) && alternativo > 0) return alternativo;

  const baseRol = Number(rol?.sueldoPorEvento || 0);
  return Number.isFinite(baseRol) && baseRol > 0 ? baseRol : 0;
}
