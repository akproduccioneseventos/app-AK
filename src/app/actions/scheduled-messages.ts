'use server';

import { readData, writeData, createDataItem, mutateDataItem } from '@/lib/data-service';
import type { ScheduledMessage, ScheduledMessageStatus } from '@/types/whatsapp-automation';
import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { AsyncMutex } from '@/lib/mutex';

import { requireAppSession } from '@/lib/auth/require-session';
const SCHEDULED_MESSAGES_FILE = 'scheduled-messages.json';
const SCHEDULED_MESSAGES_COLLECTION = 'scheduled_messages';
const scheduledMessagesMutex = new AsyncMutex();
const SIN_BASE = () => process.env.AK_USE_LOCAL_JSON_ONLY === 'true';

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
    const newMessage: ScheduledMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    if (!SIN_BASE()) {
      await createDataItem(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, newMessage.id, newMessage);
    } else {
      await scheduledMessagesMutex.runExclusive(async () => {
        const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
        await writeData(SCHEDULED_MESSAGES_FILE, [...messages, newMessage]);
      });
    }

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
    if (!SIN_BASE()) {
      const actualizado = await mutateDataItem<ScheduledMessage>(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, messageId, (m) => ({
        ...m,
        status: 'enviado' as ScheduledMessageStatus,
        sentAt: new Date().toISOString(),
        sentBy,
      }));
      if (!actualizado) return { success: false, error: 'Mensaje no encontrado' };
      return { success: true };
    }

    return scheduledMessagesMutex.runExclusive(async () => {
      const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx === -1) return { success: false, error: 'Mensaje no encontrado' };
      messages[idx] = { ...messages[idx], status: 'enviado', sentAt: new Date().toISOString(), sentBy };
      await writeData(SCHEDULED_MESSAGES_FILE, messages);
      return { success: true };
    });
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
    if (!SIN_BASE()) {
      const actualizado = await mutateDataItem<ScheduledMessage>(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, messageId, (m) => ({
        ...m,
        status: 'reprogramado' as ScheduledMessageStatus,
        rescheduledTo: newDate,
        scheduledAt: newDate,
      }));
      if (!actualizado) return { success: false, error: 'Mensaje no encontrado' };
      return { success: true };
    }

    return scheduledMessagesMutex.runExclusive(async () => {
      const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx === -1) return { success: false, error: 'Mensaje no encontrado' };
      messages[idx] = { ...messages[idx], status: 'reprogramado', rescheduledTo: newDate, scheduledAt: newDate };
      await writeData(SCHEDULED_MESSAGES_FILE, messages);
      return { success: true };
    });
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
    if (!SIN_BASE()) {
      const actualizado = await mutateDataItem<ScheduledMessage>(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, messageId, (m) => ({
        ...m,
        status: 'cancelado' as ScheduledMessageStatus,
        cancelReason: reason || 'Cancelado manualmente',
      }));
      if (!actualizado) return { success: false, error: 'Mensaje no encontrado' };
      return { success: true };
    }

    return scheduledMessagesMutex.runExclusive(async () => {
      const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx === -1) return { success: false, error: 'Mensaje no encontrado' };
      messages[idx] = { ...messages[idx], status: 'cancelado', cancelReason: reason || 'Cancelado manualmente' };
      await writeData(SCHEDULED_MESSAGES_FILE, messages);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function unmarkMessageAsSent(
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    if (!SIN_BASE()) {
      const actualizado = await mutateDataItem<ScheduledMessage>(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, messageId, (m) => {
        const next = { ...m, status: 'pendiente' as ScheduledMessageStatus };
        delete next.sentAt;
        delete next.sentBy;
        return next;
      });
      if (!actualizado) return { success: false, error: 'Mensaje no encontrado' };
      return { success: true };
    }

    return scheduledMessagesMutex.runExclusive(async () => {
      const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx === -1) return { success: false, error: 'Mensaje no encontrado' };
      const next = { ...messages[idx], status: 'pendiente' as ScheduledMessageStatus };
      delete next.sentAt;
      delete next.sentBy;
      messages[idx] = next;
      await writeData(SCHEDULED_MESSAGES_FILE, messages);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateScheduledMessageText(
  messageId: string,
  newMessageText: string
): Promise<{ success: boolean; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.CRM);
  if (!permiso.ok) return { success: false, error: permiso.error };
  try {
    if (!SIN_BASE()) {
      const actualizado = await mutateDataItem<ScheduledMessage>(SCHEDULED_MESSAGES_FILE, SCHEDULED_MESSAGES_COLLECTION, messageId, (m) => ({
        ...m,
        messageText: newMessageText,
      }));
      if (!actualizado) return { success: false, error: 'Mensaje no encontrado' };
      return { success: true };
    }

    return scheduledMessagesMutex.runExclusive(async () => {
      const messages = await readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
      const idx = messages.findIndex(m => m.id === messageId);
      if (idx === -1) return { success: false, error: 'Mensaje no encontrado' };
      messages[idx] = { ...messages[idx], messageText: newMessageText };
      await writeData(SCHEDULED_MESSAGES_FILE, messages);
      return { success: true };
    });
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function generateWhatsAppClickUrl(
  messageText: string,
  targetPhone?: string
): Promise<string> {
  await requireAppSession();
  const { toWhatsAppNumber } = await import('@/lib/commercial/contact');
  const cleanPhone = toWhatsAppNumber(targetPhone);
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
