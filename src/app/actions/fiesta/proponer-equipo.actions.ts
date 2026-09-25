'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { getEmpleados } from '@/app/actions/empleados';
import { getRoles } from '@/app/actions/roles';
import { getFiestas, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { readActiveFiestasForStaffAgenda } from '@/lib/staff-agenda-data';
import {
  proponerEquipoParaFiesta,
  type RequiredRoleItem,
} from '@/lib/personal/proponer-equipo';
import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';

export async function obtenerPropuestaEquipoAction(
  fiestaId: string,
  requiredRoles: RequiredRoleItem[],
): Promise<{
  success: boolean;
  propuesta?: PersonalAsignadoDetalleStorage[];
  error?: string;
}> {
  await requireAppSession();

  try {
    const fiestaActual = await getFiestaById(fiestaId);
    if (!fiestaActual) {
      return { success: false, error: 'Fiesta no encontrada' };
    }

    const [empleados, roles, todasLasFiestas] = await Promise.all([
      getEmpleados(),
      getRoles(),
      readActiveFiestasForStaffAgenda(() => getFiestas(false)).catch(() => getFiestas(false)),
    ]);

    const propuesta = proponerEquipoParaFiesta({
      fiestaActual,
      todasLasFiestas,
      empleados,
      roles,
      requiredRoles,
    });

    return { success: true, propuesta };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al proponer equipo' };
  }
}
