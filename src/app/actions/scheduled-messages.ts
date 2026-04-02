'use server';

import { readData, writeData } from '@/lib/data-service';
import type { ScheduledMessage, ScheduledMessageStatus } from '@/types/whatsapp-automation';

const SCHEDULED_MESSAGES_FILE = 'scheduled-messages.json';

export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  return readData<ScheduledMessage[]>(SCHEDULED_MESSAGES_FILE, []);
}

export async function saveScheduledMessage(
  message: Omit<ScheduledMessage, 'id' | 'createdAt'>
): Promise<{ success: boolean; message?: ScheduledMessage; error?: string }> {
  try {
    const messages = await getScheduledMessages();
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
  messageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const messages = await getScheduledMessages();
    const updated = messages.map(m =>
      m.id === messageId ? { ...m, status: 'cancelado' as ScheduledMessageStatus } : m
    );
    await writeData(SCHEDULED_MESSAGES_FILE, updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getPendingMessagesForToday(): Promise<ScheduledMessage[]> {
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
