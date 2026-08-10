'use server';

import { readData, writeData } from '@/lib/data-service';
import type { ReciboFirmado } from '@/types/empleado';
import { randomUUID } from 'crypto';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { AsyncMutex } from '@/lib/mutex';

const RECIBOS_PERSONAL_FILE = 'personal-recibos.json';
const recibosMutex = new AsyncMutex();

const ESTADOS_VALIDOS: ReciboFirmado['estado'][] = ['pendiente', 'pagado', 'firmado_subido'];

function generateReciboId(): string {
  return `recibo_${randomUUID()}`;
}

function normalizeEstado(value: unknown): ReciboFirmado['estado'] {
  return ESTADOS_VALIDOS.includes(value as ReciboFirmado['estado'])
    ? (value as ReciboFirmado['estado'])
    : 'pendiente';
}

function normalizeMonto(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeRecibo(raw: Partial<ReciboFirmado>): ReciboFirmado {
  const now = new Date().toISOString();
  return {
    id: String(raw.id || generateReciboId()),
    fiestaId: String(raw.fiestaId || ''),
    empleadoId: String(raw.empleadoId || ''),
    monto: normalizeMonto(raw.monto),
    fecha: typeof raw.fecha === 'string' ? raw.fecha : '',
    archivoUrl: typeof raw.archivoUrl === 'string' ? raw.archivoUrl : undefined,
    archivoNombre: typeof raw.archivoNombre === 'string' ? raw.archivoNombre : undefined,
    estado: normalizeEstado(raw.estado),
    notas: typeof raw.notas === 'string' ? raw.notas : undefined,
    pagadoPor: typeof raw.pagadoPor === 'string' ? raw.pagadoPor : undefined,
    pagadoEn: typeof raw.pagadoEn === 'string' ? raw.pagadoEn : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

export async function getRecibosFirmados(): Promise<ReciboFirmado[]> {
  // Los recibos dicen cuanto cobra cada persona del equipo. Eso es del dueno: la
  // secretaria factura y cobra, pero no tiene por que ver el sueldo de sus
  // companeros. Antes alcanzaba con tener sesion.
  const permiso = await requirePermiso(PERMISOS.SUELDOS);
  if (!permiso.ok) throw new Error(permiso.error);
  const raw = await readData<Partial<ReciboFirmado>[]>(RECIBOS_PERSONAL_FILE, []);
  return (Array.isArray(raw) ? raw : [])
    .map(normalizeRecibo)
    .filter((item) => item.fiestaId && item.empleadoId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getRecibosFirmadosByEmpleado(empleadoId: string): Promise<ReciboFirmado[]> {
  const all = await getRecibosFirmados();
  return all.filter((item) => item.empleadoId === empleadoId);
}

export async function saveReciboFirmado(
  payload: Partial<ReciboFirmado> & Pick<ReciboFirmado, 'fiestaId' | 'empleadoId'>
): Promise<{ success: boolean; recibo?: ReciboFirmado; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.SUELDOS);
  if (!permiso.ok) return { success: false, error: permiso.error };
  if (!payload.empleadoId?.trim()) {
    return { success: false, error: 'El empleado es obligatorio.' };
  }
  if (!payload.fiestaId?.trim()) {
    return { success: false, error: 'La fiesta es obligatoria.' };
  }

  const username = permiso.user?.email || 'Administrador';

  return recibosMutex.runExclusive(async () => {
    const all = await getRecibosFirmados();
    const now = new Date().toISOString();
    const existingIndex = all.findIndex(
      (item) =>
        (payload.id && item.id === payload.id) ||
        (item.empleadoId === payload.empleadoId && item.fiestaId === payload.fiestaId)
    );

    const auditFields = payload.estado === 'pagado' ? {
      pagadoPor: payload.pagadoPor || (existingIndex >= 0 ? all[existingIndex].pagadoPor : undefined) || username,
      pagadoEn: payload.pagadoEn || (existingIndex >= 0 ? all[existingIndex].pagadoEn : undefined) || now,
    } : {};

    if (existingIndex >= 0) {
      const merged = normalizeRecibo({
        ...all[existingIndex],
        ...payload,
        ...auditFields,
        updatedAt: now,
      });
      all[existingIndex] = merged;
      await writeData(RECIBOS_PERSONAL_FILE, all);
      return { success: true, recibo: merged };
    }

    const nuevo = normalizeRecibo({
      ...payload,
      ...auditFields,
      id: payload.id || generateReciboId(),
      createdAt: now,
      updatedAt: now,
    });

    all.push(nuevo);
    await writeData(RECIBOS_PERSONAL_FILE, all);
    return { success: true, recibo: nuevo };
  });
}
