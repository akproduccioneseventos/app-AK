'use server';

import { readData, writeData } from '@/lib/data-service';
import type { ScheduledMessage, ScheduledMessageStatus } from '@/types/whatsapp-automation';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

const SCHEDULED_MESSAGES_FILE = 'scheduled-messages.json';

export async function getScheduledMessages(internalToken?: symbol): Promise<ScheduledMessage[]> {
  if (internalToken !== WHATSAPP_AUTOMATION_INTERNAL_TOKEN) {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return [];
  }
  return readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
}

export async function saveScheduledMessage(
  message: Omit<ScheduledMessage, 'id' | 'createdAt'>,
  internalToken?: symbol,
): Promise<{ success: boolean; message?: ScheduledMessage; error?: string }> {
  if (internalToken !== WHATSAPP_AUTOMATION_INTERNAL_TOKEN) {
    const permiso = await requirePermiso(PERMISOS.CRM);
    if (!permiso.ok) return { success: false, error: permiso.error };
  }

  // Sin telefono el aviso se guardaba igual y nadie se enteraba hasta el dia que
  // alguien abria la cola para mandarlo: recien ahi aparecia el error, con el
  // cliente ya sin haber recibido nada. Se avisa al programarlo, que es cuando
  // todavia se puede cargar el numero.
  if (!String(message.targetPhone ?? '').replace(/\D/g, '')) {
    return {
      success: false,
      error: 'Falta el celular de esta persona. Cargalo en su ficha y volvé a programar el aviso.',
    };
  }

  try {
    const messages = await getScheduledMessages(internalToken);
    const newMessage: ScheduledMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
    };
    await writeData(SCHEDULED_MESSAGES_FILE, [...messages, newMessage]);
    return { success: true, message: newMessage };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function markMessageAsSent(
  messageId: string,
  sentBy: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const messages = await getScheduledMessages();
    const updated = messages.map(m =>
      m.id === messageId
        ? { ...m, status: 'enviado' as ScheduledMessageStatus, sentAt: new Date().toISOString(), sentBy }
        : m
    );
    await writeData(SCHEDULED_MESSAGES_FILE, updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function rescheduleMessage(
  messageId: string,
  newDate: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const messages = await getScheduledMessages();
    const updated = messages.map(m =>
      m.id === messageId
        ? {
            ...m,
            status: 'reprogramado' as ScheduledMessageStatus,
            rescheduledTo: newDate,
            scheduledAt: newDate,
          }
        : m
    );
    await writeData(SCHEDULED_MESSAGES_FILE, updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function cancelScheduledMessage(
  messageId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    const messages = await getScheduledMessages();
    const updated = messages.map(m =>
      m.id === messageId
        ? {
            ...m,
            status: 'cancelado' as ScheduledMessageStatus,
            cancelReason: reason || 'Cancelado manualmente',
          }
        : m
    );
    await writeData(SCHEDULED_MESSAGES_FILE, updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function generateWhatsAppClickUrl(
  messageText: string,
  targetPhone?: string
): Promise<string> {
  const phone = (targetPhone || '').replace(/[^\d]/g, '');
  const cleanPhone = phone.startsWith('598') ? phone : `598${phone.replace(/^0/, '')}`;
  return `https://wa.me/${cleanPhone || '59898355530'}?text=${encodeURIComponent(messageText)}`;
}

export async function getPendingMessagesForToday(): Promise<ScheduledMessage[]> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return [];
  const messages = await getScheduledMessages();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return messages.filter(m => {
    if (m.status !== 'pendiente' && m.status !== 'reprogramado') return false;
    const scheduled = new Date(m.scheduledAt);
    return scheduled < tomorrow;
  });
}
