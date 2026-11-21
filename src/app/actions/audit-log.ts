'use server';

import type { AuditLog, ModuloSistema } from '@/types/audit-log';
import { readData, writeData } from '@/lib/data-service';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';

const AUDIT_LOGS_FILE = 'audit-logs.json';

export async function logAuditEvent(
  data: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<{ success: boolean; log?: AuditLog; error?: string }> {
  // El registro de auditoría es del dueño: con sólo tener sesión cualquiera del equipo podía leerlo entero y
  // escribir entradas falsas (auditoría externa 21/11/2026).
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const logs = await readData<AuditLog[]>(AUDIT_LOGS_FILE, []);
    const newLog: AuditLog = {
      ...data,
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    logs.push(newLog);
    await writeData(AUDIT_LOGS_FILE, logs);
    return { success: true, log: newLog };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function getAuditLogs(filters?: {
  fiestaId?: string;
  modulo?: ModuloSistema;
  desde?: string;
  hasta?: string;
}): Promise<AuditLog[]> {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return [];
  const logs = await readData<AuditLog[]>(AUDIT_LOGS_FILE, []);
  if (!filters) return logs;

  return logs.filter(log => {
    if (filters.fiestaId && log.fiestaId !== filters.fiestaId) return false;
    if (filters.modulo && log.modulo !== filters.modulo) return false;
    if (filters.desde && log.timestamp < filters.desde) return false;
    if (filters.hasta && log.timestamp > filters.hasta) return false;
    return true;
  });
}

export async function getAuditLogsByFiesta(fiestaId: string): Promise<AuditLog[]> {
  return getAuditLogs({ fiestaId });
}
