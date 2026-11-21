import type { ClientPaymentNotification, ClientPaymentRevisionIA, TipoComprobanteIA } from '@/types/fiesta';

type PaymentDecision = 'aprobado' | 'rechazado';

export interface PaymentNotificationTransition {
  notifications: ClientPaymentNotification[];
  notification: ClientPaymentNotification;
  changed: boolean;
}

export interface CartelRevisionComprobanteIA {
  nivel: 'ok' | 'atencion' | 'alerta';
  texto: string;
  tipoLabel: string;
}

const ETIQUETA_TIPO_COMPROBANTE: Record<TipoComprobanteIA, string> = {
  transferencia: 'Transferencia',
  deposito: 'Depósito',
  mercado_pago: 'Mercado Pago',
  otro: 'Otro medio',
};

export function resumenRevisionComprobanteIA(
  revisionIA?: ClientPaymentRevisionIA | null,
): CartelRevisionComprobanteIA | null {
  if (!revisionIA) return null;
  const tipoLabel = ETIQUETA_TIPO_COMPROBANTE[revisionIA.tipo] ?? 'Otro medio';

  if (!revisionIA.esComprobante) {
    return {
      nivel: 'alerta',
      texto: 'La IA no reconoce un comprobante válido',
      tipoLabel,
    };
  }
  if (!revisionIA.montoCoincide) {
    return {
      nivel: 'alerta',
      texto: 'La IA no encuentra el monto',
      tipoLabel,
    };
  }
  if (!revisionIA.tieneFecha) {
    return {
      nivel: 'atencion',
      texto: 'Comprobante sin fecha visible',
      tipoLabel,
    };
  }
  return {
    nivel: 'ok',
    texto: 'Parece un comprobante correcto',
    tipoLabel,
  };
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
