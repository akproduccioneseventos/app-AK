'use server';

import { readData, writeData } from '@/lib/data-service';
import {
  createDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
  batchWrite,
  COLLECTIONS,
} from '@/lib/firebase/firestore';
import type { Notificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { getFiestas } from './fiesta/fiesta.actions';
import { differenceInDays, isToday, startOfToday, isFuture, parseISO } from 'date-fns';

const NOTIFICATIONS_FILE = 'notifications.json';
const PRESUPUESTOS_FILE = 'presupuestos.json';
const MAX_LOCAL_NOTIFICATIONS = 50;

// ============================================================
// Helper: generate a unique notification ID
// ============================================================
function generateNotifId(): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
  return `notif_${uuid}`;
}

// ============================================================
// CORE CRUD – Firestore primary, local-file fallback
// ============================================================

export async function getNotifications(): Promise<Notificacion[]> {
  try {
    // Try Firestore first
    const result = await getAllDocuments<Notificacion>(COLLECTIONS.NOTIFICACIONES, {
      orderBy: 'fecha',
      orderDirection: 'desc',
      limit: 100,
    });
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
  } catch (e) {
    console.warn('Firestore unavailable for getNotifications, falling back to local file:', e);
  }

  // Fallback: local JSON file
  try {
    const notifications = await readData<Notificacion[]>(NOTIFICATIONS_FILE, []);
    if (!Array.isArray(notifications)) return [];
    return [...notifications].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  } catch (e) {
    console.error('Error reading local notifications file:', e);
    return [];
  }
}

export async function createNotification(
  data: Omit<Notificacion, 'id' | 'fecha' | 'leida'>
): Promise<{ success: boolean; notification?: Notificacion; error?: string }> {
  const newNotification: Notificacion = {
    ...data,
    id: generateNotifId(),
    fecha: new Date().toISOString(),
    leida: false,
  };

  try {
    // Try Firestore first
    const firestoreResult = await createDocument<Notificacion>(
      COLLECTIONS.NOTIFICACIONES,
      newNotification,
      newNotification.id
    );
    if (firestoreResult.success) {
      return { success: true, notification: newNotification };
    }
  } catch (e) {
    console.warn('Firestore unavailable for createNotification, falling back to local file:', e);
  }

  // Fallback: local JSON file with deduplication
  try {
    const notifications = await getNotificationsFromLocal();

    const existingNotification = notifications.find(
      n => n.mensaje === data.mensaje && new Date(n.fecha) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (existingNotification) {
      return { success: true, notification: existingNotification };
    }

    notifications.unshift(newNotification);
    const limited = notifications.slice(0, MAX_LOCAL_NOTIFICATIONS);
    await writeData(NOTIFICATIONS_FILE, limited);
    return { success: true, notification: newNotification };
  } catch (e: any) {
    console.error('Error creating notification:', e);
    return { success: false, error: 'No se pudo crear la notificación.' };
  }
}

export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await updateDocument<Notificacion>(COLLECTIONS.NOTIFICACIONES, notificationId, { leida: true });
    if (result.success) return { success: true };
  } catch (e) {
    console.warn('Firestore unavailable for markNotificationAsRead, falling back to local file:', e);
  }

  // Fallback
  try {
    const notifications = await getNotificationsFromLocal();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      notifications[index].leida = true;
      await writeData(NOTIFICATIONS_FILE, notifications);
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'No se pudo marcar la notificación como leída.' };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const unreadResult = await getAllDocuments<Notificacion>(COLLECTIONS.NOTIFICACIONES, {
      where: [{ field: 'leida', op: '==', value: false }],
    });
    if (unreadResult.success && Array.isArray(unreadResult.data) && unreadResult.data.length > 0) {
      const batchResult = await batchWrite(
        unreadResult.data.map(n => ({
          type: 'update' as const,
          collection: COLLECTIONS.NOTIFICACIONES,
          docId: n.id,
          data: { leida: true },
        }))
      );
      if (batchResult.success) return { success: true };
    } else if (unreadResult.success) {
      return { success: true }; // nothing to mark
    }
  } catch (e) {
    console.warn('Firestore unavailable for markAllNotificationsAsRead, falling back to local file:', e);
  }

  // Fallback
  try {
    const notifications = await getNotificationsFromLocal();
    notifications.forEach(n => (n.leida = true));
    await writeData(NOTIFICATIONS_FILE, notifications);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'No se pudieron marcar todas las notificaciones como leídas.' };
  }
}

export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await deleteDocument(COLLECTIONS.NOTIFICACIONES, notificationId);
    if (result.success) return { success: true };
  } catch (e) {
    console.warn('Firestore unavailable for deleteNotification, falling back to local file:', e);
  }

  // Fallback
  try {
    const notifications = await getNotificationsFromLocal();
    const updated = notifications.filter(n => n.id !== notificationId);
    await writeData(NOTIFICATIONS_FILE, updated);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: 'No se pudo eliminar la notificación.' };
  }
}

// Internal helper: always reads from local file (used in fallback paths)
async function getNotificationsFromLocal(): Promise<Notificacion[]> {
  const data = await readData<Notificacion[]>(NOTIFICATIONS_FILE, []);
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

// ============================================================
// SMART NOTIFICATION GENERATORS (time-based alerts)
// ============================================================


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

export async function checkAndCreateEventAlerts(): Promise<{ success: boolean; created: number }> {
    try {
        const fiestasActivas = await getFiestas(false);
        if (!fiestasActivas || fiestasActivas.length === 0) {
            return { success: true, created: 0 };
        }

        const today = startOfToday();
        let createdCount = 0;

        for (const fiesta of fiestasActivas) {
            if (!fiesta.configuracion.fechaEvento) continue;

            const eventDate = parseISO(fiesta.configuracion.fechaEvento);
            if (!isFuture(eventDate) && !isToday(eventDate)) continue;

            const daysUntilEvent = differenceInDays(eventDate, today);
            const eventName = fiesta.configuracion.nombreEvento || `Evento ${fiesta.id.substring(0, 6)}`;

            // Alert: event in 7 days
            if (daysUntilEvent === 7) {
                const hasStaff = fiesta.personalAsignado && fiesta.personalAsignado.length > 0;
                const mensaje = hasStaff
                    ? `📅 El evento "${eventName}" es en 7 días. Personal asignado: ${fiesta.personalAsignado.length} personas.`
                    : `⚠️ El evento "${eventName}" es en 7 días. Personal sin confirmar.`;
                const result = await createNotification({
                    mensaje,
                    href: `/fiestas/nueva/personal?fiestaId=${fiesta.id}`,
                    icono: 'KanbanSquare',
                });
                if (result.success) createdCount++;
            }

            // Alert: event in 3 days
            if (daysUntilEvent === 3) {
                const invitados = fiesta.configuracion.invitadosEstimados || 0;
                const mensaje = `🎉 El evento "${eventName}" es en 3 días. ${invitados} invitados esperados.`;
                const result = await createNotification({
                    mensaje,
                    href: `/fiestas/nueva?fiestaId=${fiesta.id}`,
                    icono: 'KanbanSquare',
                });
                if (result.success) createdCount++;
            }

            // Alert: event is today
            if (isToday(eventDate)) {
                const mensaje = `🚀 ¡HOY es el evento "${eventName}"! ¡Mucho éxito!`;
                const result = await createNotification({
                    mensaje,
                    href: `/fiestas/nueva/en-vivo?fiestaId=${fiesta.id}`,
                    icono: 'KanbanSquare',
                });
                if (result.success) createdCount++;
            }
        }

        return { success: true, created: createdCount };
    } catch (e) {
        console.error("Failed to check and create event alerts:", e);
        return { success: false, created: 0 };
    }
}

export async function checkAndCreatePendingBalanceAlerts(): Promise<{ success: boolean; created: number }> {
    try {
        const presupuestos = await readData<Presupuesto[]>(PRESUPUESTOS_FILE, []);
        if (!presupuestos || presupuestos.length === 0) {
            return { success: true, created: 0 };
        }

        const today = startOfToday();
        let createdCount = 0;

        for (const pres of presupuestos) {
            if (pres.estado !== 'Aceptado' && pres.estado !== 'Enviado') continue;
            if (!pres.eventoFecha) continue;

            const eventDate = parseISO(pres.eventoFecha);
            if (!isFuture(eventDate) && !isToday(eventDate)) continue;

            const daysUntilEvent = differenceInDays(eventDate, today);
            const total = pres.totalConDescuento ?? pres.costoTotalEstimado;
            const clientName = pres.clienteNombre;

            // Alert: accepted quote with event in ≤ 7 days → remind about balance
            if (pres.estado === 'Aceptado' && daysUntilEvent <= 7 && daysUntilEvent >= 0) {
                const formattedTotal = new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(total);
                const mensaje = `💰 Saldo pendiente de ${formattedTotal} para el evento de ${clientName} (en ${daysUntilEvent === 0 ? 'HOY' : `${daysUntilEvent} día(s)`}).`;
                const result = await createNotification({
                    mensaje,
                    href: `/fiestas/nueva/gestion-documental`,
                    icono: 'ListChecks',
                });
                if (result.success) createdCount++;
            }

            // Alert: sent quote expiring soon (vigenciaPromocion)
            if (pres.estado === 'Enviado' && pres.vigenciaPromocion) {
                const expiryDate = parseISO(pres.vigenciaPromocion);
                const daysUntilExpiry = differenceInDays(expiryDate, today);
                if (daysUntilExpiry >= 0 && daysUntilExpiry <= 1) {
                    const expiryLabel = daysUntilExpiry === 0 ? 'HOY' : 'mañana';
                    const numero = pres.numero ? `#${pres.numero}` : '';
                    const mensaje = `⏰ El presupuesto ${numero} para ${clientName} vence ${expiryLabel}. Enviar recordatorio.`;
                    const result = await createNotification({
                        mensaje,
                        href: `/presupuestos`,
                        icono: 'ListChecks',
                    });
                    if (result.success) createdCount++;
                }
            }
        }

        return { success: true, created: createdCount };
    } catch (e) {
        console.error("Failed to check and create balance alerts:", e);
        return { success: false, created: 0 };
    }
}

export async function generateAllSmartNotifications(): Promise<{ success: boolean; totalCreated: number }> {
    try {
        const [tasks, meetings, events, balances] = await Promise.all([
            checkAndCreateTaskReminders(),
            checkAndCreateReunionReminders(),
            checkAndCreateEventAlerts(),
            checkAndCreatePendingBalanceAlerts(),
        ]);
        const totalCreated = (tasks.created || 0) + (meetings.created || 0) + (events.created || 0) + (balances.created || 0);
        return { success: true, totalCreated };
    } catch (e) {
        console.error("Failed to generate smart notifications:", e);
        return { success: false, totalCreated: 0 };
    }
}
