'use server';

import { readData, writeData } from '@/lib/data-service';
import { requireAppSession } from '@/lib/auth/require-session';

export interface CrowdSyncState {
  fiestaId: string;
  active: boolean;
  mode: 'coldplay_pulsing' | 'vals_dorado' | 'fiesta_neon' | 'tanda_roja' | 'strobe';
  title: string;
  subtitle: string;
  primaryColor: string; // ej: #eab308, #ec4899, #3b82f6
  secondaryColor?: string;
  bpm: number; // pulsos por minuto
  startedAt: string;
  updatedAt: string;
}

const CROWD_SYNC_FILE = 'fiesta-crowd-sync.json';

export async function getCrowdSyncStateAction(fiestaId: string): Promise<{
  success: boolean;
  state?: CrowdSyncState;
}> {
  try {
    const list = await readData<Record<string, CrowdSyncState>>(CROWD_SYNC_FILE, {});
    const state = list[fiestaId] || {
      fiestaId,
      active: false,
      mode: 'coldplay_pulsing',
      title: '¡Sinfonía de Luces en Vivo!',
      subtitle: 'Sostené tu celular en alto con la pantalla hacia la pista',
      primaryColor: '#eab308',
      bpm: 120,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { success: true, state };
  } catch {
    return { success: false };
  }
}

export async function setCrowdSyncStateAction(params: {
  fiestaId: string;
  active: boolean;
  mode?: CrowdSyncState['mode'];
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  bpm?: number;
}): Promise<{ success: boolean; state?: CrowdSyncState; error?: string }> {
  try {
    await requireAppSession();
    const list = await readData<Record<string, CrowdSyncState>>(CROWD_SYNC_FILE, {});
    const prev = list[params.fiestaId] || {
      fiestaId: params.fiestaId,
      active: false,
      mode: 'coldplay_pulsing',
      title: '¡Sinfonía de Luces en Vivo!',
      subtitle: 'Sostené tu celular en alto con la pantalla hacia la pista',
      primaryColor: '#eab308',
      bpm: 120,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextState: CrowdSyncState = {
      ...prev,
      active: params.active,
      mode: params.mode || prev.mode,
      title: params.title || prev.title,
      subtitle: params.subtitle || prev.subtitle,
      primaryColor: params.primaryColor || prev.primaryColor,
      bpm: params.bpm || prev.bpm,
      updatedAt: new Date().toISOString(),
      startedAt: params.active ? new Date().toISOString() : prev.startedAt,
    };

    list[params.fiestaId] = nextState;
    await writeData(CROWD_SYNC_FILE, list);
    return { success: true, state: nextState };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al actualizar CrowdSync.' };
  }
}
