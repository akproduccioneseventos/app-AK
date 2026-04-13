'use server';

import type { EventoInvitacionConfig } from '@/types/evento-invitacion';
import { defaultEventoInvitacionConfig } from '@/types/evento-invitacion';
import { readData, writeData } from '@/lib/data-service';
import * as logger from '@/lib/logger';

const INVITACION_CONFIG_FILE = 'invitacion-configs.json';

type InvitacionConfigStore = Record<string, EventoInvitacionConfig>;

/**
 * Get the invitation config for a specific fiesta/event.
 */
export async function getInvitacionConfig(
  fiestaId: string
): Promise<EventoInvitacionConfig> {
  const store = await readData<InvitacionConfigStore>(INVITACION_CONFIG_FILE, {});
  return store[fiestaId] || { ...defaultEventoInvitacionConfig };
}

/**
 * Save the invitation config for a specific fiesta/event.
 */
export async function saveInvitacionConfig(
  fiestaId: string,
  config: EventoInvitacionConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const store = await readData<InvitacionConfigStore>(INVITACION_CONFIG_FILE, {});
    store[fiestaId] = config;
    await writeData(INVITACION_CONFIG_FILE, store);
    logger.info('[InvitacionConfig] Guardado exitoso para fiesta:', fiestaId);
    return { success: true };
  } catch (error: any) {
    logger.error('[InvitacionConfig] Error al guardar:', error.message || error);
    return { success: false, error: 'No se pudo guardar la configuración. Intentá de nuevo.' };
  }
}

/**
 * Get all invitation configs (for listing/admin purposes).
 */
export async function getAllInvitacionConfigs(): Promise<InvitacionConfigStore> {
  return readData<InvitacionConfigStore>(INVITACION_CONFIG_FILE, {});
}
