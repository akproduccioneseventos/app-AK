'use server';

import type { AprobacionRequest, EstadoAprobacion } from '@/types/approval';
import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { PERMISOS } from '@/lib/auth/perfiles';
import { AsyncMutex } from '@/lib/mutex';
import { yaFueDecidida } from '@/lib/aprobaciones/decision';

import { requireAppSession } from '@/lib/auth/require-session';
const APROBACIONES_FILE = 'aprobaciones.json';

/**
 * Turnos para guardar. Sin esto, dos personas decidiendo al mismo tiempo leían
 * la misma lista y la segunda la pisaba: la decisión de la primera se perdía sin
 * aviso. Adentro del turno se usa `readData` directo y nunca `getAprobaciones`,
 * porque volver a pedir el mismo turno deja la pantalla colgada para siempre.
 */
const aprobacionesMutex = new AsyncMutex();

export async function getAprobaciones(fiestaId?: string): Promise<AprobacionRequest[]> {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return [];
  const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
  if (fiestaId) return all.filter(a => a.fiestaId === fiestaId);
  return all;
}

export async function getAprobacionById(id: string): Promise<AprobacionRequest | null> {
  await requireAppSession();
  const all = await getAprobaciones();
  return all.find(a => a.id === id) ?? null;
}

export async function createAprobacion(
  data: Omit<AprobacionRequest, 'id' | 'solicitadoEn' | 'estadoAprobacion' | 'version'>
): Promise<{ success: boolean; aprobacion?: AprobacionRequest; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    return await aprobacionesMutex.runExclusive(async () => {
      const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
      const newAprobacion: AprobacionRequest = {
        ...data,
        id: `apr_${Date.now()}`,
        solicitadoEn: new Date().toISOString(),
        estadoAprobacion: 'Pendiente',
        version: 1,
      };
      all.push(newAprobacion);
      await writeData(APROBACIONES_FILE, all);
      return { success: true, aprobacion: newAprobacion };
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function aprobarCambio(
  id: string,
  _aprobadoPor?: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  const session = await verifySession();
  if (!session.success || !session.user) return { success: false, error: session.error || 'Sesion no autorizada.' };
  const usuarioReal = session.user.email || session.user.userId || 'Usuario autenticado';
  try {
    return await aprobacionesMutex.runExclusive(async () => {
      const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
      const index = all.findIndex(a => a.id === id);
      if (index === -1) return { success: false, error: 'Solicitud no encontrada.' };

      const yaDecidida = yaFueDecidida(all[index]);
      if (yaDecidida) return { success: false, error: yaDecidida };

      all[index] = {
        ...all[index],
        estadoAprobacion: 'Aprobado' as EstadoAprobacion,
        aprobadoPor: usuarioReal,
        aprobadoEn: new Date().toISOString(),
      };
      await writeData(APROBACIONES_FILE, all);
      return { success: true };
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function rechazarCambio(
  id: string,
  motivoRechazo: string,
  _rechazadoPor?: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  const session = await verifySession();
  if (!session.success || !session.user) return { success: false, error: session.error || 'Sesion no autorizada.' };
  const usuarioReal = session.user.email || session.user.userId || 'Usuario autenticado';
  const motivo = motivoRechazo?.trim() || '';
  if (!motivo) {
    return { success: false, error: 'Hay que escribir por qué se rechaza el cambio.' };
  }

  try {
    return await aprobacionesMutex.runExclusive(async () => {
      const all = await readData<AprobacionRequest[]>(APROBACIONES_FILE, []);
      const index = all.findIndex(a => a.id === id);
      if (index === -1) return { success: false, error: 'Solicitud no encontrada.' };

      const yaDecidida = yaFueDecidida(all[index]);
      if (yaDecidida) return { success: false, error: yaDecidida };

      all[index] = {
        ...all[index],
        estadoAprobacion: 'Rechazado' as EstadoAprobacion,
        aprobadoPor: usuarioReal,
        aprobadoEn: new Date().toISOString(),
        motivoRechazo: motivo,
      };
      // Note: aprobadoPor stores whoever made the decision (approver or rejecter)
      await writeData(APROBACIONES_FILE, all);
      return { success: true };
    });
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
