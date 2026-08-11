'use server';

import type { PersonalAsignadoDetalleStorage } from '@/types/fiesta';
import { syncFiestaToGoogleWorkspace } from '../google-workspace';
import { getFiestaById, saveFiesta } from './fiesta.actions';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

export async function updatePersonal(
  fiestaId: string,
  personal: PersonalAsignadoDetalleStorage[]
): Promise<{ success: boolean; error?: string; googleSyncWarning?: string }> {
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

    // Verificar en el servidor que ningún empleado tenga solapamiento de horario con otro evento
    const fecha = currentData.configuracion?.fechaEvento;
    if (fecha) {
      const { verificarAgendaEmpleado, getEmpleados } = await import('../empleados');
      const empleados = await getEmpleados();
      for (const p of personal) {
        if (!p.empleadoId) continue;
        const agenda = await verificarAgendaEmpleado(
          p.empleadoId,
          fecha,
          fiestaId,
          currentData.configuracion?.horaInicio,
          currentData.configuracion?.horaFin
        );
        if (agenda.solapadas.length > 0) {
          const emp = empleados.find(e => e.id === p.empleadoId);
          const empNombre = emp?.nombre || 'El empleado';
          const conflicto = agenda.solapadas[0];
          return {
            success: false,
            error: `No se puede asignar a ${empNombre} porque se solapa en horario con "${conflicto.nombreEvento}" (${conflicto.horaInicio} a ${conflicto.horaFin}hs).`,
          };
        }
      }
    }

    // PRIMERO se guarda, DESPUES se sincroniza. El orden no es un detalle:
    // `syncFiestaToGoogleWorkspace` vuelve a leer la fiesta de la base, asi que
    // si corre antes del guardado manda los avisos con la asignacion VIEJA. El
    // mozo nuevo no se entera de que trabaja, y al que sacaron le llega el
    // correo igual.
    const result = await saveFiesta({ ...currentData, personalAsignado: personal });
    if (!result.success) throw new Error(result.error);

    let googleSyncWarning = '';
    try {
      const syncRes = await syncFiestaToGoogleWorkspace(fiestaId, {
        reason: 'personal',
        sendEmails: true,
      });
      if (syncRes.warnings && syncRes.warnings.length > 0) {
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

    return { success: true, googleSyncWarning: googleSyncWarning || undefined };
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
