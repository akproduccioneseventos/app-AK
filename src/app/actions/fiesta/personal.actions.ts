'use server';

import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { syncFiestaToGoogleWorkspace } from '../google-workspace';
import { getFiestaById, getFiestas, saveFiesta } from './fiesta.actions';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { readActiveFiestasForStaffAgenda } from '@/lib/staff-agenda-data';

export async function updatePersonal(
  fiestaId: string,
  personal: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; error?: string; googleSyncWarning?: string; agendaWarning?: string }> {
  // Lo que se guarda aca incluye `eventSalary`: cuanto cobra cada persona por esa
  // fiesta. Es el mismo dato que protegen los recibos, asi que pide el mismo
  // permiso. Antes no comprobaba NADA: con solo conocer el codigo de una fiesta se
  // podian cambiar los sueldos desde afuera, y ademas se disparaban los correos de
  // asignacion al equipo.
  const permiso = await requirePermiso(PERMISOS.SUELDOS);
  if (!permiso.ok) return { success: false, error: permiso.error };

  try {
    for (const p of personal) {
      if (p.eventSalary !== undefined && p.eventSalary !== null && p.eventSalary < 0) {
        return { success: false, error: 'El sueldo de un empleado no puede ser un valor negativo.' };
      }
    }

    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");

    const contarAsignaciones = (items: PersonalAsignadoDetalleStorage[]) => {
      const counts = new Map<string, number>();
      for (const item of items) {
        if (!item.empleadoId) continue;
        counts.set(item.empleadoId, (counts.get(item.empleadoId) || 0) + 1);
      }
      return counts;
    };
    const anteriores = contarAsignaciones(currentData.personalAsignado || []);
    const siguientes = contarAsignaciones(personal);
    const empleadosNuevos = [...siguientes.keys()].filter(
      empleadoId => (siguientes.get(empleadoId) || 0) > (anteriores.get(empleadoId) || 0),
    );

    // Solo una asignación nueva necesita revisar agenda. Editar un sueldo o rol
    // existente no vuelve a leer todas las fiestas en cada pulsación.
    const fecha = currentData.configuracion?.fechaEvento;
    const avisosAgenda: string[] = [];
    let releaseAgendaLocks: () => Promise<void> = async () => undefined;
    if (fecha && empleadosNuevos.length > 0) {
      const { acquireStaffAgendaLocks } = await import('@/lib/staff-agenda-lock');
      releaseAgendaLocks = await acquireStaffAgendaLocks(empleadosNuevos);
    }
    let result: Awaited<ReturnType<typeof saveFiesta>>;

    try {
      if (fecha && empleadosNuevos.length > 0) {
        const { getEmpleados } = await import('../empleados');
        const { evaluarAgendaEmpleado } = await import('@/lib/staff-agenda-conflicts');
        const [empleados, fiestas] = await Promise.all([
          getEmpleados(),
          readActiveFiestasForStaffAgenda(() => getFiestas(false)),
        ]);

        for (const empleadoId of empleadosNuevos) {
          const agenda = evaluarAgendaEmpleado(fiestas, empleadoId, currentData, fiestaId);
          if (agenda.solapadas.length > 0) {
            const emp = empleados.find(e => e.id === empleadoId);
            const empNombre = emp?.nombre || 'El empleado';
            const conflictos = agenda.solapadas
              .slice(0, 3)
              .map(conflicto => `"${conflicto.nombreEvento}" (${conflicto.horaInicio} a ${conflicto.horaFin}hs)`)
              .join(', ');
            const restantes = agenda.solapadas.length > 3 ? ` y ${agenda.solapadas.length - 3} evento(s) más` : '';
            return {
              success: false,
              error: `No se puede asignar a ${empNombre}: su horario se solapa con ${conflictos}${restantes}.`,
            };
          }

          const empNombre = empleados.find(e => e.id === empleadoId)?.nombre || 'El empleado';
          if (agenda.horarioSinConfirmar.length > 0) {
            avisosAgenda.push(
              `${empNombre}: hay otra asignación ese día con horario a confirmar. Completá ambos horarios para descartar un choque.`,
            );
          } else if (agenda.mismoDiaNoSolapado.length > 0) {
            avisosAgenda.push(`${empNombre}: también trabaja ese día, en un horario que no se solapa.`);
          }
        }
      }

      // La lectura y el guardado quedan dentro del mismo bloqueo por empleado.
      result = await saveFiesta({ ...currentData, personalAsignado: personal });
    } finally {
      await releaseAgendaLocks();
    }

    if (!result.success) throw new Error(result.error);

    let googleSyncWarning = '';
    try {
      const syncRes = await syncFiestaToGoogleWorkspace(fiestaId, {
        reason: 'personal',
        sendEmails: true,
      });
      if (!syncRes.success) {
        googleSyncWarning = syncRes.error || syncRes.warnings?.join(' | ') || 'Google Workspace rechazo la sincronización.';
      } else if (syncRes.warnings && syncRes.warnings.length > 0) {
        googleSyncWarning = syncRes.warnings.join(' | ');
      }
    } catch (syncError: any) {
      console.warn('[personal.actions] Google Workspace sync failed:', syncError);
      googleSyncWarning = syncError?.message || 'No se pudo sincronizar los avisos por correo con Google Workspace.';
    }

    // El aviso queda anotado en la fiesta para que el equipo lo vea al volver a
    // entrar, no solo en el momento. Si esta segunda escritura falla no cambia
    // el resultado: la asignacion ya quedo guardada, que es lo que importa.
    if (googleSyncWarning) {
      const conAviso = await getFiestaById(fiestaId);
      if (conAviso) await saveFiesta({ ...conAviso, googleSyncWarning });
    }

    return {
      success: true,
      googleSyncWarning: googleSyncWarning || undefined,
      agendaWarning: avisosAgenda.length > 0 ? avisosAgenda.join(' ') : undefined,
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function retryPersonalGoogleSync(
  fiestaId: string
): Promise<{ success: boolean; warning?: string; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");

    let warning = '';
    try {
      const syncRes = await syncFiestaToGoogleWorkspace(fiestaId, {
        reason: 'personal',
        sendEmails: true,
        forceEmail: true,
      });
      if (syncRes.warnings && syncRes.warnings.length > 0) {
        warning = syncRes.warnings.join(' | ');
      }
    } catch (err: any) {
      warning = err?.message || 'No se pudo completar el aviso por correo con Google Workspace.';
    }

    await saveFiesta({
      ...currentData,
      googleSyncWarning: warning,
    });

    return { success: !warning, warning: warning || undefined };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
