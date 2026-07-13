import 'server-only';

import { createNotification as createNotificationAction } from '@/app/actions/notifications';
import { NOTIFICATION_INTERNAL_TOKEN } from './internal-token';
import type { Notificacion } from '@/types/fiesta';

export function createNotification(data: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) {
  return createNotificationAction(data, NOTIFICATION_INTERNAL_TOKEN);
}
