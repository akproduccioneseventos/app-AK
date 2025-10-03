
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Notificacion } from '@/types/fiesta';

const NOTIFICATIONS_FILE = 'notifications.json';

export async function getNotifications(): Promise<Notificacion[]> {
  const notifications = await readData<Notificacion[]>(NOTIFICATIONS_FILE, []);
  // Sort by date descending
  return notifications.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function createNotification(
  data: Omit<Notificacion, 'id' | 'fecha' | 'leida'>
): Promise<{ success: boolean; notification?: Notificacion; error?: string }> {
  try {
    const notifications = await getNotifications();
    const newNotification: Notificacion = {
      ...data,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fecha: new Date().toISOString(),
      leida: false,
    };
    notifications.unshift(newNotification); // Add to the beginning
    
    // Keep only the latest 50 notifications to prevent the file from growing too large
    const limitedNotifications = notifications.slice(0, 50);
    
    await writeData(NOTIFICATIONS_FILE, limitedNotifications);
    return { success: true, notification: newNotification };
  } catch (e: any) {
    console.error("Error creating notification:", e);
    return { success: false, error: "No se pudo crear la notificación." };
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    let notifications = await getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notifications[index].leida = true;
      await writeData(NOTIFICATIONS_FILE, notifications);
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: "No se pudo marcar la notificación como leída." };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    let notifications = await getNotifications();
    notifications.forEach(n => n.leida = true);
    await writeData(NOTIFICATIONS_FILE, notifications);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: "No se pudieron marcar todas las notificaciones como leídas." };
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        let notifications = await getNotifications();
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        await writeData(NOTIFICATIONS_FILE, updatedNotifications);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "No se pudo eliminar la notificación." };
    }
}
