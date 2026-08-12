
'use server';

import type { Empleado, NuevoEmpleadoFormData } from '@/types/empleado';
import { createDataItem, deleteDataItem, readData, updateDataItem } from '@/lib/data-service';
import { randomUUID } from 'crypto';
import { uploadToStorage, deleteFromStorage } from '@/lib/firebase/storage';
import { requireAppSession, requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { readActiveFiestasForStaffAgenda } from '@/lib/staff-agenda-data';

const EMPLEADOS_FILE = 'empleados.json';
const EMPLEADOS_COLLECTION = 'empleados';

export async function getEmpleados(): Promise<Empleado[]> {
  const empleados = await readData<Empleado[]>(EMPLEADOS_FILE, []);
  return [...empleados].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
}

export async function getEmpleadoById(id: string): Promise<Empleado | null> {
  const empleados = await getEmpleados();
  return empleados.find(e => e.id === id) || null;
}

export async function saveEmpleado(
  empleadoData: NuevoEmpleadoFormData | Empleado | FormData
): Promise<{ success: boolean; id?: string; empleado?: Empleado; error?: string }> {
  await requireAppSession();

  let empleados = await getEmpleados();
  let empleadoId: string;
  let empleadoToSave: Partial<Empleado> = {};
  let contractFile: File | null = null;
  let previousContractFileName: string | undefined;
  let uploadedContractUrl: string | undefined;

  if (empleadoData instanceof FormData) {
    empleadoToSave.id = empleadoData.get('id') as string | undefined;
    empleadoToSave.nombre = empleadoData.get('nombre') as string;
    empleadoToSave.cedula = empleadoData.get('cedula') as string | undefined;
    empleadoToSave.fechaNacimiento = empleadoData.get('fechaNacimiento') as string | undefined;
    empleadoToSave.telefono = empleadoData.get('telefono') as string | undefined;
    empleadoToSave.email = empleadoData.get('email') as string | undefined;
    empleadoToSave.googleWorkspaceEmail = empleadoData.get('googleWorkspaceEmail') as string | undefined;
    empleadoToSave.googleCalendarId = empleadoData.get('googleCalendarId') as string | undefined;
    empleadoToSave.portalNotas = empleadoData.get('portalNotas') as string | undefined;
    const rolIdsStr = empleadoData.get('rolIds') as string | null;
    empleadoToSave.rolIds = rolIdsStr ? rolIdsStr.split(',') : [];
    contractFile = empleadoData.get('contract') as File | null;
    empleadoToSave.contractFileName = empleadoData.get('existingContract') as string || undefined;
    empleadoToSave.photoUrl = empleadoData.get('photoUrl') as string | undefined || undefined;

  } else {
    empleadoToSave = { ...empleadoData };
  }
  
  if (!empleadoToSave.nombre?.trim()) {
    return { success: false, error: 'El nombre del empleado es obligatorio.' };
  }

  let isNewEmployee = false;

  if (empleadoToSave.id) { // Update
    empleadoId = empleadoToSave.id;
    const index = empleados.findIndex(e => e.id === empleadoId);
    if (index === -1) {
      return { success: false, error: `Empleado con ID ${empleadoId} no encontrado.` };
    }
    const existingEmpleado = empleados[index];
    previousContractFileName = existingEmpleado.contractFileName;
    empleados[index] = {
      ...existingEmpleado,
      ...empleadoToSave,
    };
    empleadoToSave = empleados[index];
  } else { // Create
    const isDuplicate = empleados.some(emp => emp.nombre && emp.nombre.trim().toLowerCase() === empleadoToSave.nombre!.trim().toLowerCase());
    if (isDuplicate) {
        return { success: false, error: `Ya existe un empleado con el nombre "${empleadoToSave.nombre!.trim()}".` };
    }
    empleadoId = `emp_${randomUUID()}`;
    empleadoToSave.id = empleadoId;
    empleados.push(empleadoToSave as Empleado);
    isNewEmployee = true;
  }

  if (contractFile && contractFile.size > 0) {
    try {
      if (contractFile.type !== 'application/pdf') {
        // Rollback in-memory addition for new employees before returning
        if (isNewEmployee) {
          empleados = empleados.filter(e => e.id !== empleadoId);
        }
        return { success: false, error: 'El contrato debe ser un archivo PDF.' };
      }
      const bytes = await contractFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uniqueFilename = `contract_${empleadoId}_${Date.now()}_${contractFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storagePath = `employee-contracts/${uniqueFilename}`;
      const fileUrl = await uploadToStorage(buffer, storagePath, 'application/pdf', false);
      empleadoToSave.contractFileName = fileUrl;
      uploadedContractUrl = fileUrl;
    } catch (fileError: any) {
      console.error("Error saving employee contract file:", fileError);
      // Rollback in-memory addition for new employees before returning
      if (isNewEmployee) {
        empleados = empleados.filter(e => e.id !== empleadoId);
      }
      return { success: false, error: `Error al guardar archivo de contrato: ${fileError.message}` };
    }
  }
  
  const finalIndex = empleados.findIndex(e => e.id === empleadoId);
  if (finalIndex !== -1) empleados[finalIndex] = empleadoToSave as Empleado;

  try {
    if (isNewEmployee) {
      await createDataItem(EMPLEADOS_FILE, EMPLEADOS_COLLECTION, empleadoId, empleadoToSave);
    } else {
      const updated = await updateDataItem(
        EMPLEADOS_FILE,
        EMPLEADOS_COLLECTION,
        empleadoId,
        empleadoToSave,
      );
      if (!updated) {
        if (uploadedContractUrl) await deleteFromStorage(uploadedContractUrl).catch(() => undefined);
        return { success: false, error: `Empleado con ID ${empleadoId} no encontrado.` };
      }
    }
  } catch (writeError: any) {
    if (uploadedContractUrl) await deleteFromStorage(uploadedContractUrl).catch(() => undefined);
    console.error("Error writing empleados data:", writeError);
    return { success: false, error: `Error al guardar los datos del empleado: ${writeError.message}` };
  }
  if (uploadedContractUrl && previousContractFileName && previousContractFileName !== uploadedContractUrl) {
    deleteFromStorage(previousContractFileName).catch((fileError: any) => {
      console.warn(`Error deleting replaced contract ${previousContractFileName}:`, fileError.message);
    });
  }
  return { success: true, id: empleadoId, empleado: empleadoToSave as Empleado };
}

/**
 * Nombres de las fiestas que todavia no pasaron y tienen a este empleado asignado.
 * Las fiestas ya realizadas no cuentan: ahi el trabajo ya se hizo y lo que importa
 * es el historial de pagos, que se guarda aparte.
 */
async function fiestasFuturasConEsteEmpleado(empleadoId: string): Promise<string[]> {
  try {
    const { getAllFiestas } = await import('./fiesta/fiesta.actions');
    const fiestas = await getAllFiestas();
    const hoy = new Date().toISOString().slice(0, 10);

    return fiestas
      .filter((fiesta: any) => {
        const fecha = String(fiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
        if (!fecha || fecha < hoy) return false;
        return (fiesta?.personalAsignado ?? []).some((p: any) => p?.empleadoId === empleadoId);
      })
      .map((fiesta: any) => String(fiesta?.configuracion?.nombreEvento || 'una fiesta sin nombre'));
  } catch {
    // Si no se puede leer la agenda, no se inventa una respuesta: se deja pasar
    // el borrado como antes en vez de bloquearlo por un problema de lectura.
    return [];
  }
}

export interface ConflictoAgendaEmpleado {
  nombreEvento: string;
  horaInicio: string;
  horaFin: string;
  solapaHorario: boolean;
}

export interface ResultadoAgendaEmpleado {
  mismoDiaNoSolapado: ConflictoAgendaEmpleado[];
  solapadas: ConflictoAgendaEmpleado[];
  horarioSinConfirmar: ConflictoAgendaEmpleado[];
}

export interface FiestaTimeRange {
  startMs: number;
  endMs: number;
  horaInicio: string;
  horaFin: string;
  fechaStr: string;
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MONTEVIDEO_UTC_OFFSET_MINUTES = 3 * 60;

function localDateTimeToUtcMs(fecha: string, hora: string): number | null {
  const dateMatch = DATE_ONLY_PATTERN.exec(fecha);
  const timeMatch = TIME_PATTERN.exec(hora);
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const dateOnlyMs = Date.UTC(year, month - 1, day);
  const normalized = new Date(dateOnlyMs);

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return null;
  }

  // Toda la agenda AK usa la hora local de Uruguay (UTC-3).
  return dateOnlyMs + (hour * 60 + minute + MONTEVIDEO_UTC_OFFSET_MINUTES) * 60_000;
}

export function getFiestaTimeRange(fiesta: any): FiestaTimeRange | null {
  const rawFecha = String(fiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
  const horaInicio = String(fiesta?.configuracion?.horaInicio ?? '');
  const horaFin = String(fiesta?.configuracion?.horaFin ?? '');
  const startMs = localDateTimeToUtcMs(rawFecha, horaInicio);
  let endMs = localDateTimeToUtcMs(rawFecha, horaFin);

  if (startMs === null || endMs === null || endMs === startMs) return null;
  if (endMs < startMs) endMs += 24 * 60 * 60 * 1000;

  return { startMs, endMs, horaInicio, horaFin, fechaStr: rawFecha };
}

export function evaluarAgendaEmpleado(
  fiestas: any[],
  empleadoId: string,
  targetFiesta: any,
  exceptoFiestaId?: string,
): ResultadoAgendaEmpleado {
  const dia = String(targetFiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
  const targetRange = getFiestaTimeRange(targetFiesta);
  const mismoDiaNoSolapado: ConflictoAgendaEmpleado[] = [];
  const solapadas: ConflictoAgendaEmpleado[] = [];
  const horarioSinConfirmar: ConflictoAgendaEmpleado[] = [];

  for (const fiesta of fiestas) {
    if (exceptoFiestaId && fiesta?.id === exceptoFiestaId) continue;
    const tieneEmpleado = (fiesta?.personalAsignado ?? []).some(
      (personal: any) => personal?.empleadoId === empleadoId,
    );
    if (!tieneEmpleado) continue;

    const fechaExistente = String(fiesta?.configuracion?.fechaEvento ?? '').slice(0, 10);
    const existingRange = getFiestaTimeRange(fiesta);
    const conflictoBase = {
      nombreEvento: String(fiesta?.configuracion?.nombreEvento || 'Evento sin nombre'),
      horaInicio: existingRange?.horaInicio || 'A confirmar',
      horaFin: existingRange?.horaFin || 'A confirmar',
    };

    if (targetRange && existingRange) {
      const solapa = targetRange.startMs < existingRange.endMs && existingRange.startMs < targetRange.endMs;
      if (solapa) {
        solapadas.push({ ...conflictoBase, solapaHorario: true });
      } else if (fechaExistente === dia) {
        mismoDiaNoSolapado.push({ ...conflictoBase, solapaHorario: false });
      }
    } else if (fechaExistente === dia) {
      horarioSinConfirmar.push({ ...conflictoBase, solapaHorario: false });
    }
  }

  return { mismoDiaNoSolapado, solapadas, horarioSinConfirmar };
}

export async function verificarAgendaEmpleado(
  empleadoId: string,
  fechaEvento: string,
  exceptoFiestaId?: string,
  horaInicioTarget?: string,
  horaFinTarget?: string,
): Promise<ResultadoAgendaEmpleado> {
  const permiso = await requirePermiso(PERMISOS.SUELDOS);
  if (!permiso.ok) throw new Error(permiso.error);
  const dia = String(fechaEvento ?? '').slice(0, 10);
  if (!empleadoId || !dia) {
    return { mismoDiaNoSolapado: [], solapadas: [], horarioSinConfirmar: [] };
  }

  const { getFiestas } = await import('./fiesta/fiesta.actions');
  const fiestas = await readActiveFiestasForStaffAgenda(() => getFiestas(false));
  return evaluarAgendaEmpleado(
    fiestas,
    empleadoId,
    {
      configuracion: {
        fechaEvento: dia,
        horaInicio: horaInicioTarget || '',
        horaFin: horaFinTarget || '',
      },
    },
    exceptoFiestaId,
  );
}

/**
 * Otras fiestas del MISMO DIA que ya tienen a este empleado asignado.
 *
 * Sirve para avisar al asignarlo: una persona no puede estar en dos salones a la
 * vez, y si pasa con el DJ hay dos eventos y un solo DJ. Se avisa, no se bloquea:
 * a veces son dos eventos en horarios distintos y el equipo sabe lo que hace.
 */
export async function fiestasDelMismoDiaConEmpleado(
  empleadoId: string,
  fechaEvento: string,
  exceptoFiestaId?: string,
): Promise<string[]> {
  const agenda = await verificarAgendaEmpleado(empleadoId, fechaEvento, exceptoFiestaId);
  return [...agenda.solapadas, ...agenda.mismoDiaNoSolapado, ...agenda.horarioSinConfirmar]
    .map(conflicto => conflicto.nombreEvento);
}

export async function deleteEmpleado(id: string): Promise<{ success: boolean; error?: string }> {
  // Dar de baja a alguien del equipo va con el mismo permiso que ver lo que cobra:
  // es la ficha de una persona, con su contrato adjunto. Antes alcanzaba con tener
  // sesion, asi que cualquiera del equipo podia borrar a un companero de la lista.
  const permiso = await requirePermiso(PERMISOS.SUELDOS);
  if (!permiso.ok) return { success: false, error: permiso.error };

  let empleados = await getEmpleados();
  const empleadoToDelete = empleados.find(e => e.id === id);
  if (!empleadoToDelete) {
    return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };
  }

  // Borrar a alguien que esta asignado a una fiesta que todavia no paso deja esa
  // fiesta sin esa persona y sin que nadie se entere: la noche del evento falta
  // un mozo y en la lista figura un asignado que ya no existe. En vez de sacarlo
  // en silencio, se avisa cual es la fiesta para que se resuelva el reemplazo.
  const comprometido = await fiestasFuturasConEsteEmpleado(id);
  if (comprometido.length > 0) {
    const listado = comprometido.slice(0, 3).join(', ');
    const resto = comprometido.length > 3 ? ` y ${comprometido.length - 3} más` : '';
    return {
      success: false,
      error: `${empleadoToDelete.nombre} está asignado a ${listado}${resto}. Sacalo de esas fiestas (o asigná un reemplazo) antes de eliminarlo.`,
    };
  }

  const deleted = await deleteDataItem(EMPLEADOS_FILE, EMPLEADOS_COLLECTION, id);
  if (!deleted) return { success: false, error: `Empleado con ID ${id} no encontrado para eliminar.` };

  if (empleadoToDelete?.contractFileName) {
    deleteFromStorage(empleadoToDelete.contractFileName).catch((fileError: any) => {
      console.warn(`Error deleting contract file ${empleadoToDelete.contractFileName}:`, fileError.message);
    });
  }
  return { success: true };
}
