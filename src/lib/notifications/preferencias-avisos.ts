import 'server-only';
import { readData } from '@/lib/data-service';
import { initialNotificationPreferences, type NotificationPreferences } from '@/types/preferencias-avisos';

export function getArchivoPreferencias(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `preferencias-avisos/user_${safeId}.json`;
}

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

export async function debeEnviarAvisoInterno(
  categoria: keyof NotificationPreferences,
  canal: 'email' | 'app',
  userId: string = 'admin'
): Promise<boolean> {
  try {
    const archivo = getArchivoPreferencias(userId);
    const stored = await readData<NotificationPreferences | null>(archivo, null);
    if (!stored) return true;
    if (stored[categoria] === undefined) return true;
    return stored[categoria][canal] ?? true;
  } catch {
    return true;
  }
}
