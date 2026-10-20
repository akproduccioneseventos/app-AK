import 'server-only';

import { readData } from '@/lib/data-service';
import type { Rol } from '@/types/rol';

/**
 * LOS ROLES CON SU SUELDO, PARA LAS CUENTAS DEL SERVIDOR (20/10/2026, entrega de la orden 197).
 *
 * `getRoles()` ahora le devuelve el sueldo en 0 a quien no tiene permiso de sueldos. Las cuentas que
 * hace el servidor por su lado —los costos de la fiesta, el equipo propuesto, los reportes— lo usaban,
 * y con una secretaria o un operador del otro lado **calculaban y guardaban el personal a $0**.
 * Esas cuentas leen de acá. No es una acción de servidor: el navegador no la puede llamar.
 */
export async function leerRolesInterno(): Promise<Rol[]> {
  return readData<Rol[]>('roles.json', []);
}
