'use server';

import type { CateringChangeRequest, CateringChangeStatus } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

function generateId(): string {
  return `cc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function submitCateringChangeRequest(
  fiestaId: string,
  request: Omit<CateringChangeRequest, 'id' | 'timestamp' | 'status'>
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };
    const existing: CateringChangeRequest[] = fiesta.cateringChangeRequests ?? [];
    const newReq: CateringChangeRequest = {
      ...request,
      id: generateId(),
      timestamp: new Date().toISOString(),
      status: 'pendiente',
    };
    const updated = { ...fiesta, cateringChangeRequests: [...existing, newReq] };
    await saveFiesta(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function resolveCateringChangeRequest(
  fiestaId: string,
  requestId: string,
  status: Exclude<CateringChangeStatus, 'pendiente'>,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };
    const requests: CateringChangeRequest[] = fiesta.cateringChangeRequests ?? [];
    const updatedRequests = requests.map(r =>
      r.id === requestId ? { ...r, status, adminNotes, resolvedAt: new Date().toISOString() } : r
    );
    const updated = { ...fiesta, cateringChangeRequests: updatedRequests };
    await saveFiesta(updated);
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getCateringChangeRequests(fiestaId: string): Promise<CateringChangeRequest[]> {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return [];
  return fiesta.cateringChangeRequests ?? [];
}
