import 'server-only';

import admin from 'firebase-admin';

async function getDbAdmin() {
  const { dbAdmin } = await import('./server');
  return dbAdmin;
}

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

export interface NotificationTargets {
  tokens?: string[];
  guestIds?: string[];
  userIds?: string[];
  fiestaId?: string;
}

async function enviarMulticastFcm(
  tokens: string[],
  payload: PushNotificationPayload,
): Promise<PushNotificationResult> {
  const dbAdmin = await getDbAdmin();
  if (!dbAdmin || !admin.apps.length) {
    return { success: false, sentCount: 0, failureCount: 0, error: 'Firebase Admin no disponible.' };
  }
  const uniqueTokens = Array.from(new Set(tokens.filter((t) => typeof t === 'string' && t.trim().length > 0)));
  if (uniqueTokens.length === 0) {
    return { success: true, sentCount: 0, failureCount: 0 };
  }

  const messaging = admin.messaging();
  const messagePayload: admin.messaging.MulticastMessage = {
    tokens: uniqueTokens,
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

  const tokensToDelete: string[] = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error) {
      const errCode = resp.error.code;
      if (
        errCode === 'messaging/invalid-registration-token' ||
        errCode === 'messaging/registration-token-not-registered'
      ) {
        tokensToDelete.push(uniqueTokens[idx]);
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
}

/**
 * Envía una notificación push únicamente a los destinatarios indicados (`tokens`, `guestIds`, `userIds`).
 */
export async function sendNotificationToTargets(
  targets: NotificationTargets,
  payload: PushNotificationPayload,
): Promise<PushNotificationResult> {
  const dbAdmin = await getDbAdmin();
  if (!dbAdmin || !admin.apps.length) {
    return { success: false, sentCount: 0, failureCount: 0, error: 'Firebase Admin no disponible.' };
  }

  try {
    const collected = [...(targets.tokens || [])];

    const guestIds = Array.from(new Set((targets.guestIds || []).filter(Boolean)));
    for (let i = 0; i < guestIds.length; i += 10) {
      const chunk = guestIds.slice(i, i + 10);
      const snap = await dbAdmin.collection('fcm_tokens').where('guestId', 'in', chunk).get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (targets.fiestaId && data?.fiestaId && data.fiestaId !== targets.fiestaId) return;
        if (data?.token && typeof data.token === 'string') collected.push(data.token);
      });
    }

    const userIds = Array.from(new Set((targets.userIds || []).filter(Boolean)));
    for (let i = 0; i < userIds.length; i += 10) {
      const chunk = userIds.slice(i, i + 10);
      const snap = await dbAdmin.collection('fcm_tokens').where('userId', 'in', chunk).get();
      snap.forEach((doc) => {
        const data = doc.data();
        if (data?.token && typeof data.token === 'string') collected.push(data.token);
      });
    }

    return await enviarMulticastFcm(collected, payload);
  } catch (error: any) {
    console.warn('[FCM] Error enviando notificación dirigida:', error?.message);
    return { success: false, sentCount: 0, failureCount: 0, error: error?.message };
  }
}

/**
 * Sends a push notification to all registered admin devices in Firestore.
 * Automatically removes invalid or expired FCM tokens to maintain hygiene.
 */
export async function sendPushNotificationToAll(
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  const dbAdmin = await getDbAdmin();
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
