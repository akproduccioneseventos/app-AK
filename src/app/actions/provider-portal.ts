'use server';

import { createDataItem, readData, updateDataItem } from '@/lib/data-service';
import type { ProveedorPortalAccess, EstadoProveedorPortal } from '@/types/provider-portal';
import { randomUUID } from 'crypto';
import { requireAppSession, requirePermisoAlguno } from '@/lib/auth/require-session';

import { PERMISOS } from '@/lib/auth/perfiles';

const DATA_PATH = 'proveedor-portal.json';
const DATA_COLLECTION = 'proveedor_portal';
const VALID_STATES = new Set<EstadoProveedorPortal>([
  'Pendiente',
  'Confirmado',
  'En Camino',
  'Llegó',
  'Completó',
  'No Llegó',
]);

type ProviderMutationResult = {
  success: boolean;
  data?: ProveedorPortalAccess;
  error?: string;
};

async function persistProvider(access: ProveedorPortalAccess): Promise<ProviderMutationResult> {
  const updated = await updateDataItem(
    DATA_PATH,
    DATA_COLLECTION,
    access.id,
    access,
  );
  if (!updated) {
    return { success: false, error: 'El acceso del proveedor ya no existe.' };
  }
  return { success: true, data: access };
}

export async function getProveedoresPortal(fiestaId: string): Promise<{ success: boolean; data?: ProveedorPortalAccess[]; error?: string }> {
  try {
    await requirePermisoAlguno(PERMISOS.ORGANIZACION, PERMISOS.CONTABILIDAD);
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    return { success: true, data: all.filter(p => p.fiestaId === fiestaId) };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createProveedorAcceso(
  data: Omit<ProveedorPortalAccess, 'id' | 'token' | 'createdAt'>,
): Promise<{ success: boolean; data?: ProveedorPortalAccess; error?: string }> {
  await requirePermisoAlguno(PERMISOS.ORGANIZACION, PERMISOS.CONTABILIDAD);
  try {
    const nombreProveedor = data.nombreProveedor.trim();
    const fiestaId = data.fiestaId.trim();
    if (!nombreProveedor || !fiestaId) {
      return { success: false, error: 'El evento y el nombre del proveedor son obligatorios.' };
    }

    const newRecord: ProveedorPortalAccess = {
      ...data,
      fiestaId,
      nombreProveedor,
      id: `prov-${randomUUID()}`,
      token: randomUUID(),
      venceEl: (data as any).venceEl || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };
    await createDataItem(DATA_PATH, DATA_COLLECTION, newRecord.id, newRecord);
    return { success: true, data: newRecord };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getProveedorByToken(token: string): Promise<{ success: boolean; data?: ProveedorPortalAccess; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const found = all.find(p => p.token === token && p.activo);
    if (!found) return { success: false, error: 'Proveedor no encontrado o acceso inactivo' };
    if (found.venceEl && new Date(found.venceEl).getTime() < Date.now()) return { success: false, error: 'Acceso de proveedor vencido' };
    return { success: true, data: found };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateProveedorEstado(token: string, estado: EstadoProveedorPortal): Promise<ProviderMutationResult> {
  try {
    if (!VALID_STATES.has(estado)) {
      return { success: false, error: 'El estado indicado no es válido.' };
    }
    const access = await getProveedorByToken(token);
    if (!access.success || !access.data) return { success: false, error: access.error };
    return await persistProvider({ ...access.data, estadoActual: estado });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function confirmarLlegada(token: string): Promise<ProviderMutationResult> {
  try {
    const access = await getProveedorByToken(token);
    if (!access.success || !access.data) return { success: false, error: access.error };
    return await persistProvider({
      ...access.data,
      estadoActual: 'Llegó',
      llegadaConfirmadaEn: new Date().toISOString(),
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function confirmarPartida(token: string): Promise<ProviderMutationResult> {
  try {
    const access = await getProveedorByToken(token);
    if (!access.success || !access.data) return { success: false, error: access.error };
    return await persistProvider({
      ...access.data,
      estadoActual: 'Completó',
      partidaConfirmadaEn: new Date().toISOString(),
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function toggleTareaProveedor(token: string, tareaId: string): Promise<ProviderMutationResult> {
  try {
    const access = await getProveedorByToken(token);
    if (!access.success || !access.data) return { success: false, error: access.error };
    if (!access.data.tareas.some((task) => task.id === tareaId)) {
      return { success: false, error: 'La tarea indicada no existe.' };
    }
    const tareas = access.data.tareas.map((task) => {
      if (task.id !== tareaId) return task;
      const completada = !task.completada;
      return {
        ...task,
        completada,
        completadoEn: completada ? new Date().toISOString() : undefined,
      };
    });
    return await persistProvider({ ...access.data, tareas });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function addNotaProveedor(token: string, nota: string): Promise<ProviderMutationResult> {
  try {
    const access = await getProveedorByToken(token);
    if (!access.success || !access.data) return { success: false, error: access.error };
    const normalizedNote = nota.trim();
    if (normalizedNote.length > 2000) {
      return { success: false, error: 'La nota es demasiado extensa.' };
    }
    return await persistProvider({ ...access.data, notas: normalizedNote });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
