
'use server';

import { readData, writeData } from '@/lib/data-service';
import type { Notificacion } from '@/types/fiesta';
import { getFiestas } from './fiesta/fiesta.actions';
import { differenceInDays, isToday, startOfToday } from 'date-fns';

const NOTIFICATIONS_FILE = 'notifications.json';

export async function getNotifications(): Promise<Notificacion[]> {
  try {
    const notifications = await readData<Notificacion[]>(NOTIFICATIONS_FILE, []);
    if (!Array.isArray(notifications)) return [];
    // Sort by date descending
    return [...notifications].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (e) {
    console.error("Error al obtener notificaciones:", e);
    return [];
  }
}

export async function createNotification(
  data: Omit<Notificacion, 'id' | 'fecha' | 'leida'>
): Promise<{ success: boolean; notification?: Notificacion; error?: string }> {
  try {
    const notifications = await getNotifications();
    
    // Prevent duplicate notifications for the same message in a short time frame
    const existingNotification = notifications.find(
      n => n.mensaje === data.mensaje && new Date(n.fecha) > new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hour window for daily reminders
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
        const fiestasActivas = await getFiestas(false); // Fetch all active events
        if (!fiestasActivas || fiestasActivas.length === 0) {
            return { success: true, created: 0 };
        }

        const today = startOfToday();
        let createdCount = 0;
        
        for (const fiesta of fiestasActivas) {
            if (!fiesta.tareas) continue;

            for (const tarea of fiesta.tareas) {
                if (tarea.completada || !tarea.fechaLimite) continue;
                
                const dueDate = new Date(tarea.fechaLimite);
                const daysUntilDue = differenceInDays(dueDate, today);

                // Reminder if due in 48 hours or less
                if (daysUntilDue >= 0 && daysUntilDue <= 2) {
                    let mensaje = '';
                    if(isToday(dueDate)) {
                        mensaje = `🚨 VENCE HOY: Tarea "${tarea.texto}" (${fiesta.configuracion.nombreEvento}).`;
                    } else {
                        mensaje = `📅 Recordatorio: La tarea "${tarea.texto}" de ${fiesta.configuracion.nombreEvento} vence en ${daysUntilDue + 1} día(s).`;
                    }
                    
                    const result = await createNotification({
                        mensaje,
                        href: `/fiestas/nueva/tareas?fiestaId=${fiesta.id}`,
                        icono: 'ListChecks',
                    });
                    if(result.success && result.notification?.id.startsWith('notif_')) {
                      createdCount++;
                    }
                }
            }
        }
        return { success: true, created: createdCount };
    } catch(e) {
        console.error("Failed to check and create task reminders:", e);
        return { success: false, created: 0 };
    }
}

export async function checkAndCreateReunionReminders(): Promise<{ success: boolean; created: number }> {
    try {
        const fiestasActivas = await getFiestas(false);
        if (!fiestasActivas || fiestasActivas.length === 0) {
            return { success: true, created: 0 };
        }

        const today = startOfToday();
        let createdCount = 0;
        
        for (const fiesta of fiestasActivas) {
            if (!fiesta.reuniones) continue;

            for (const reunion of fiesta.reuniones) {
                if (!reunion.fecha) continue;
                
                const meetingDate = new Date(reunion.fecha);
                const daysUntilMeeting = differenceInDays(meetingDate, today);

                if (daysUntilMeeting >= 0 && daysUntilMeeting <= 1) { // Reminder for today or tomorrow
                    let mensaje = '';
                     if(isToday(meetingDate)) {
                        mensaje = `🤝 Reunión HOY: "${reunion.titulo}" (${fiesta.configuracion.nombreEvento}) a las ${new Date(reunion.fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs.`;
                    } else {
                        mensaje = `🤝 Reunión Mañana: "${reunion.titulo}" (${fiesta.configuracion.nombreEvento}) a las ${new Date(reunion.fecha).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}hs.`;
                    }
                    
                    const result = await createNotification({
                        mensaje,
                        href: `/fiestas/nueva/reuniones?fiestaId=${fiesta.id}`,
                        icono: 'MessageSquareText',
                    });
                    if(result.success && result.notification?.id.startsWith('notif_')) {
                      createdCount++;
                    }
                }
            }
        }
        return { success: true, created: createdCount };
    } catch(e) {
        console.error("Failed to check and create meeting reminders:", e);
        return { success: false, created: 0 };
    }
}
