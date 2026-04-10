'use server';

import { readData, writeData } from '@/lib/data-service';
import type { ProveedorPortalAccess, EstadoProveedorPortal } from '@/types/provider-portal';

const DATA_PATH = 'proveedor-portal.json';

export async function getProveedoresPortal(fiestaId: string): Promise<{ success: boolean; data?: ProveedorPortalAccess[]; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    return { success: true, data: all.filter(p => p.fiestaId === fiestaId) };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createProveedorAcceso(
  data: Omit<ProveedorPortalAccess, 'id' | 'token' | 'createdAt'>,
): Promise<{ success: boolean; data?: ProveedorPortalAccess; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const newRecord: ProveedorPortalAccess = {
      ...data,
      id: `prov-${Date.now()}`,
      token: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    await writeData(DATA_PATH, [...all, newRecord]);
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
    return { success: true, data: found };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateProveedorEstado(token: string, estado: EstadoProveedorPortal): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const updated = all.map(p => p.token === token ? { ...p, estadoActual: estado } : p);
    await writeData(DATA_PATH, updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function confirmarLlegada(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const updated = all.map(p =>
      p.token === token
        ? { ...p, estadoActual: 'Llegó' as EstadoProveedorPortal, llegadaConfirmadaEn: new Date().toISOString() }
        : p,
    );
    await writeData(DATA_PATH, updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function confirmarPartida(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const updated = all.map(p =>
      p.token === token
        ? { ...p, estadoActual: 'Completó' as EstadoProveedorPortal, partidaConfirmadaEn: new Date().toISOString() }
        : p,
    );
    await writeData(DATA_PATH, updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function toggleTareaProveedor(token: string, tareaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const updated = all.map(p => {
      if (p.token !== token) return p;
      const tareas = p.tareas.map(t => {
        if (t.id !== tareaId) return t;
        const nowCompleted = !t.completada;
        return { ...t, completada: nowCompleted, completadoEn: nowCompleted ? new Date().toISOString() : undefined };
      });
      return { ...p, tareas };
    });
    await writeData(DATA_PATH, updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function addNotaProveedor(token: string, nota: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await readData<ProveedorPortalAccess[]>(DATA_PATH, []);
    const updated = all.map(p => p.token === token ? { ...p, notas: nota } : p);
    await writeData(DATA_PATH, updated);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
