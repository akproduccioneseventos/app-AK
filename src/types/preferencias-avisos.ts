export interface NotificationPreferences {
  eventReminders: { email: boolean; app: boolean };
  taskUpdates: { email: boolean; app: boolean };
  clientMessages: { email: boolean; app: boolean };
  systemAlerts: { email: boolean; app: boolean };
  crmUpdates: { email: boolean; app: boolean };
}

export const initialNotificationPreferences: NotificationPreferences = {
  eventReminders: { email: true, app: true },
  taskUpdates: { email: true, app: false },
  clientMessages: { email: true, app: true },
  systemAlerts: { email: false, app: true },
  crmUpdates: { email: true, app: false },
};
