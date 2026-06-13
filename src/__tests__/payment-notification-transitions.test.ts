import { transitionPaymentNotification } from '@/lib/client-portal/payment-notifications';
import type { ClientPaymentNotification } from '@/types/fiesta';

const pending: ClientPaymentNotification[] = [
  {
    id: 'payment_1',
    monto: 1000,
    estado: 'pendiente',
    timestamp: '2026-06-11T10:00:00.000Z',
  },
  {
    id: 'payment_2',
    monto: 2000,
    estado: 'pendiente',
    timestamp: '2026-06-11T10:01:00.000Z',
  },
];

describe('payment notification transitions', () => {
  it('updates only the selected notification and preserves concurrent entries', () => {
    const result = transitionPaymentNotification(
      pending,
      'payment_1',
      'rechazado',
      '2026-06-11T11:00:00.000Z'
    );

    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].estado).toBe('rechazado');
    expect(result.notifications[1]).toEqual(pending[1]);
  });

  it('adds approval time and is idempotent', () => {
    const approved = transitionPaymentNotification(
      pending,
      'payment_1',
      'aprobado',
      '2026-06-11T11:00:00.000Z'
    );
    expect(approved.notification.approvedAt).toBe('2026-06-11T11:00:00.000Z');

    const repeated = transitionPaymentNotification(approved.notifications, 'payment_1', 'aprobado');
    expect(repeated.changed).toBe(false);
  });

  it('does not reverse a completed decision', () => {
    const approved = transitionPaymentNotification(pending, 'payment_1', 'aprobado');
    expect(() =>
      transitionPaymentNotification(approved.notifications, 'payment_1', 'rechazado')
    ).toThrow('procesada');
  });
});
