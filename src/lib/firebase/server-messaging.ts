import 'server-only';

import admin from 'firebase-admin';
import { dbAdmin } from './server';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: Record<string, string>;
}

export interface PushNotificationResult {
  success: boolean;
  sentCount: number;
  failureCount: number;
  error?: string;
}

/**
 * Sends a push notification to all registered admin devices in Firestore.
 * Automatically removes invalid or expired FCM tokens to maintain hygiene.
 */
export async function sendPushNotificationToAll(
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  if (!dbAdmin || !admin.apps.length) {
    return { success: false, sentCount: 0, failureCount: 0, error: 'Firebase Admin no disponible.' };
  }

  try {
    const tokensSnapshot = await dbAdmin.collection('fcm_tokens').get();
    if (tokensSnapshot.empty) {
      return { success: true, sentCount: 0, failureCount: 0 };
    }

    const tokens: string[] = [];
    tokensSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data?.token && typeof data.token === 'string') {
        tokens.push(data.token);
      }
    });

    if (tokens.length === 0) {
      return { success: true, sentCount: 0, failureCount: 0 };
    }

    const messaging = admin.messaging();
    const messagePayload: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192.png',
          badge: '/icon-192.png',
        },
        fcmOptions: {
          link: payload.url || 'https://akproducciones.uy/mi-dia',
        },
      },
      data: {
        ...(payload.data || {}),
        url: payload.url || 'https://akproducciones.uy/mi-dia',
        timestamp: String(Date.now()),
      },
    };

    const response = await messaging.sendEachForMulticast(messagePayload);

    // Clean up stale or unregistered tokens
    const tokensToDelete: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/registration-token-not-registered'
        ) {
          tokensToDelete.push(tokens[idx]);
        }
      }
    });

    if (tokensToDelete.length > 0) {
      const batch = dbAdmin.batch();
      tokensToDelete.forEach((t) => {
        batch.delete(dbAdmin!.collection('fcm_tokens').doc(t));
      });
      await batch.commit().catch((err) => {
        console.warn('[FCM] Error limpiando tokens vencidos:', err);
      });
    }

    return {
      success: response.successCount > 0 || response.failureCount === 0,
      sentCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error: any) {
    console.warn('[FCM] Error enviando notificaciones push:', error?.message);
    return { success: false, sentCount: 0, failureCount: 0, error: error?.message };
  }
}
