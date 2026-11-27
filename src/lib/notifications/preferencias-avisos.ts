import 'server-only';
import { readData } from '@/lib/data-service';
import { mutarDocumento } from '@/lib/generic-json-store';
import { initialNotificationPreferences, type NotificationPreferences } from '@/types/preferencias-avisos';

export const NOTIFICATION_PREFERENCES_FILE = 'notification-preferences.json';

export function inferirCategoriaAviso(data: { titulo?: string; mensaje?: string; href?: string; categoria?: string }): keyof NotificationPreferences {
  if (data.categoria && ['eventReminders', 'taskUpdates', 'clientMessages', 'systemAlerts', 'crmUpdates'].includes(data.categoria)) {
    return data.categoria as keyof NotificationPreferences;
  }
  const text = `${data.titulo || ''} ${data.mensaje || ''} ${data.href || ''}`.toLowerCase();
  if (text.includes('tarea') || text.includes('task') || text.includes('vencim')) return 'taskUpdates';
  if (text.includes('prospecto') || text.includes('crm') || text.includes('lead') || text.includes('presupuesto') || text.includes('pago') || text.includes('cobro') || text.includes('mercadopago')) return 'crmUpdates';
  if (text.includes('mensaje') || text.includes('whatsapp') || text.includes('chat') || text.includes('conversaci') || text.includes('cliente')) return 'clientMessages';
  if (text.includes('sistema') || text.includes('error') || text.includes('seguridad') || text.includes('alerta') || text.includes('backup') || text.includes('mantenim')) return 'systemAlerts';
  return 'eventReminders';
}

export async function getPreferenciasUsuario(userId: string = 'admin'): Promise<NotificationPreferences> {
  try {
    const allPrefs = await readData<Record<string, NotificationPreferences>>(
      NOTIFICATION_PREFERENCES_FILE,
      {}
    );
    const userPrefs = allPrefs?.[userId];
    if (!userPrefs) {
      return { ...initialNotificationPreferences };
    }
    return {
      ...initialNotificationPreferences,
      ...userPrefs,
    };
  } catch {
    return { ...initialNotificationPreferences };
  }
}

export async function guardarPreferenciasUsuario(
  userId: string,
  prefs: NotificationPreferences
): Promise<void> {
  await mutarDocumento<Record<string, NotificationPreferences>>(
    NOTIFICATION_PREFERENCES_FILE,
    {},
    (allPrefs) => ({
      ...(allPrefs || {}),
      [userId]: prefs,
    })
  );
}

export async function debeEnviarAvisoInterno(
  categoria: keyof NotificationPreferences,
  canal: 'email' | 'app',
  userId: string = 'admin'
): Promise<boolean> {
  try {
    const prefs = await getPreferenciasUsuario(userId);
    if (!prefs || !prefs[categoria]) {
      return initialNotificationPreferences[categoria]?.[canal] ?? true;
    }
    return Boolean(prefs[categoria][canal]);
  } catch {
    return initialNotificationPreferences[categoria]?.[canal] ?? true;
  }
}
