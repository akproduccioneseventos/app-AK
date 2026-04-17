'use server';

import { readData, writeData } from '@/lib/data-service';
import type { ReciboFirmado } from '@/types/empleado';

const RECIBOS_PERSONAL_FILE = 'personal-recibos.json';

const ESTADOS_VALIDOS: ReciboFirmado['estado'][] = ['pendiente', 'pagado', 'firmado_subido'];

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
    id: String(raw.id || `recibo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    fiestaId: String(raw.fiestaId || ''),
    empleadoId: String(raw.empleadoId || ''),
    monto: normalizeMonto(raw.monto),
    fecha: typeof raw.fecha === 'string' ? raw.fecha : '',
    archivoUrl: typeof raw.archivoUrl === 'string' ? raw.archivoUrl : undefined,
    archivoNombre: typeof raw.archivoNombre === 'string' ? raw.archivoNombre : undefined,
    estado: normalizeEstado(raw.estado),
    notas: typeof raw.notas === 'string' ? raw.notas : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

export async function getRecibosFirmados(): Promise<ReciboFirmado[]> {
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
  if (!payload.empleadoId?.trim()) {
    return { success: false, error: 'El empleado es obligatorio.' };
  }
  if (!payload.fiestaId?.trim()) {
    return { success: false, error: 'La fiesta es obligatoria.' };
  }

  const all = await getRecibosFirmados();
  const now = new Date().toISOString();
  const existingIndex = all.findIndex(
    (item) =>
      (payload.id && item.id === payload.id) ||
      (item.empleadoId === payload.empleadoId && item.fiestaId === payload.fiestaId)
  );

  if (existingIndex >= 0) {
    const merged = normalizeRecibo({
      ...all[existingIndex],
      ...payload,
      updatedAt: now,
    });
    all[existingIndex] = merged;
    await writeData(RECIBOS_PERSONAL_FILE, all);
    return { success: true, recibo: merged };
  }

  const nuevo = normalizeRecibo({
    ...payload,
    id: payload.id || `recibo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  });

  all.push(nuevo);
  await writeData(RECIBOS_PERSONAL_FILE, all);
  return { success: true, recibo: nuevo };
}
