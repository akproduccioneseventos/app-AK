import 'server-only';

import { getEmpleados } from '@/app/actions/empleados';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { perfilDe, puede, type Permiso } from '@/lib/auth/perfiles';
import { verifySession } from '@/lib/auth/session-token';

export async function requireEventPermission(fiestaId: string, permiso: Permiso | readonly Permiso[]) {
  // Con una lista alcanza con uno: las estaciones las abre la noche (operador) o la organización
  // (dueño, secretaria).
  const permisos = Array.isArray(permiso) ? permiso : [permiso as Permiso];
  const session = await verifySession();
  if (!session.success || !session.user || !permisos.some((p) => puede(session.user, p))) {
    throw new Error('Tu usuario no tiene permiso para controlar este evento.');
  }

  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada.');
  if (perfilDe(session.user) !== 'operador') return fiesta;

  const email = session.user.email?.trim().toLowerCase();
  const empleados = await getEmpleados();
  const employee = empleados.find(item =>
    item.id === session.user?.userId
    || [item.email, item.googleWorkspaceEmail]
      .filter(Boolean)
      .some(candidate => candidate?.trim().toLowerCase() === email)
  );
  const assigned = employee && (fiesta.personalAsignado || []).some(item => item.empleadoId === employee.id);
  if (!assigned) throw new Error('Este evento no está asignado a tu usuario.');
  return fiesta;
}
