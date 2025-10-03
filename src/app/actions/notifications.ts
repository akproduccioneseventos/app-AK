
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Notificacion } from '@/types/fiesta';
import { getFiestaActual } from './fiesta-actual';
import { differenceInDays, isToday, startOfToday } from 'date-fns';

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
    
    // Prevent duplicate notifications for the same message in a short time frame
    const existingNotification = notifications.find(
      n => n.mensaje === data.mensaje && new Date(n.fecha) > new Date(Date.now() - 60 * 60 * 1000) // 1 hour window
    );
    if (existingNotification) {
        return { success: true, notification: existingNotification };
    }

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


export async function checkAndCreateTaskReminders(): Promise<{ success: boolean; created: number }> {
    try {
        const fiesta = await getFiestaActual();
        if (!fiesta || !fiesta.tareas) {
            return { success: true, created: 0 };
        }

        const today = startOfToday();
        let createdCount = 0;

        for (const tarea of fiesta.tareas) {
            if (tarea.completada || !tarea.fechaLimite) continue;
            
            const dueDate = new Date(tarea.fechaLimite);
            const daysUntilDue = differenceInDays(dueDate, today);

            if (daysUntilDue >= 0 && daysUntilDue <= 2) {
                let mensaje = '';
                if(isToday(dueDate)) {
                    mensaje = `Recordatorio: La tarea "${tarea.texto}" vence HOY.`;
                } else {
                    mensaje = `Recordatorio: La tarea "${tarea.texto}" vence en ${daysUntilDue + 1} día(s).`;
                }
                
                const result = await createNotification({
                    mensaje,
                    href: '/fiestas/nueva/tareas',
                    icono: 'ListChecks',
                });
                if(result.success && result.notification?.id.startsWith('notif_')) { // Check if it's a newly created one
                  createdCount++;
                }
            }
        }
        return { success: true, created: createdCount };
    } catch(e) {
        console.error("Failed to check and create task reminders:", e);
        return { success: false, created: 0 };
    }
}
