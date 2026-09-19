'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { createNotification } from './notifications';
import type { Notificacion } from '@/types/fiesta';
import {
  initialNotificationPreferences,
  type NotificationPreferences,
} from '@/types/preferencias-avisos';
import {
  getPreferenciasUsuario,
  guardarPreferenciasUsuario,
  debeEnviarAvisoInterno,
} from '@/lib/notifications/preferencias-avisos';

export type { NotificationPreferences };

/**
 * Lee las preferencias de avisos guardadas en el servidor para el usuario autenticado.
 */
export async function leerPreferenciasDeAvisos(): Promise<{
  success: boolean;
  preferences?: NotificationPreferences;
  error?: string;
}> {
  await requireAppSession();
  try {
    const session = await verifySession();
    const userId = session.user?.userId || 'admin';
    const preferences = await getPreferenciasUsuario(userId);
    return {
      success: true,
      preferences,
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error al leer preferencias de avisos' };
  }
}

/**
 * Guarda las preferencias de avisos en el servidor para el usuario autenticado.
 */
export async function guardarPreferenciasDeAvisos(
  prefs: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
      return { success: false, error: 'Preferencias no válidas' };
    }
    const categories: (keyof NotificationPreferences)[] = [
      'eventReminders',
      'taskUpdates',
      'clientMessages',
      'systemAlerts',
      'crmUpdates',
    ];
    for (const cat of categories) {
      const item = prefs[cat];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return { success: false, error: `Estructura no válida para categoría ${cat}` };
      }
      if (typeof item.email !== 'boolean' || typeof item.app !== 'boolean') {
        return { success: false, error: `Valores booleanos inválidos en ${cat}` };
      }
    }
    const session = await verifySession();
    const userId = session.user?.userId || 'admin';
    await guardarPreferenciasUsuario(userId, prefs);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error al guardar preferencias de avisos' };
  }
}

/**
 * Consulta si un usuario tiene habilitado un tipo de aviso específico antes de enviarlo.
 */
export async function debeEnviarAviso(
  categoria: keyof NotificationPreferences,
  canal: 'email' | 'app',
  userId: string = 'admin'
): Promise<boolean> {
  await requireAppSession();
  return debeEnviarAvisoInterno(categoria, canal, userId);
}

/**
 * Envía una notificación respetando estrictamente las preferencias del usuario.
 * Si el usuario apagó el aviso, no se envía y se devuelve status deshabilitado.
 */
export async function enviarAvisoConPreferencia(params: {
  userId?: string;
  categoria: keyof NotificationPreferences;
  canal?: 'email' | 'app';
  notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>;
}): Promise<{
  success: boolean;
  enviado: boolean;
  motivo?: string;
  notification?: Notificacion;
  error?: string;
}> {
  await requireAppSession();
  const canal = params.canal || 'app';
  const userId = params.userId || 'admin';

  const habilitado = await debeEnviarAviso(params.categoria, canal, userId);
  if (!habilitado) {
    return {
      success: true,
      enviado: false,
      motivo: `El usuario tiene desactivados los avisos de tipo ${params.categoria} por canal ${canal}`,
    };
  }

  const res = await createNotification({
    ...params.notificacion,
    userId,
    categoria: params.categoria,
  } as any);

  const enviado = Boolean(res.success && res.notification);
  return {
    success: res.success,
    enviado,
    motivo: !enviado && res.success ? 'Aviso omitido por preferencias' : undefined,
    notification: res.notification,
    error: res.error,
  };
}
