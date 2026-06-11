import type { ClientPaymentNotification } from '@/types/fiesta';

type PaymentDecision = 'aprobado' | 'rechazado';

export interface PaymentNotificationTransition {
  notifications: ClientPaymentNotification[];
  notification: ClientPaymentNotification;
  changed: boolean;
}

export function transitionPaymentNotification(
  notifications: ClientPaymentNotification[],
  notificationId: string,
  decision: PaymentDecision,
  now = new Date().toISOString()
): PaymentNotificationTransition {
  const index = notifications.findIndex((notification) => notification.id === notificationId);
  if (index === -1) throw new Error('Notificacion no encontrada');

  const current = notifications[index];
  if (current.estado === decision) {
    return { notifications, notification: current, changed: false };
  }
  if (current.estado !== 'pendiente') {
    throw new Error('La notificacion ya fue procesada.');
  }

  const notification: ClientPaymentNotification = {
    ...current,
    estado: decision,
    ...(decision === 'aprobado' ? { approvedAt: now } : {}),
  };
  const updated = [...notifications];
  updated[index] = notification;
  return { notifications: updated, notification, changed: true };
}
