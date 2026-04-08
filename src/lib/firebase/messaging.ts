// src/lib/firebase/messaging.ts
// Client-side Firebase Cloud Messaging (FCM) utilities.
// Must only be imported in client components (browser environment).

import { app } from './config';
import type { Messaging } from 'firebase/messaging';

let messagingInstance: Messaging | null = null;

/**
 * Lazily initialize and return the FCM Messaging instance.
 * Returns null if FCM is not supported in this environment.
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === 'undefined' || !app) return null;
  if (messagingInstance) return messagingInstance;

  try {
    const { getMessaging, isSupported } = await import('firebase/messaging');
    const supported = await isSupported();
    if (!supported) return null;
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Request notification permission, obtain the FCM token and save it to Firestore.
 * Returns the token string on success, or null if permission was denied / not supported.
 */
export async function requestAndSaveFcmToken(userId?: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const { getToken } = await import('firebase/messaging');

    // VAPID key should be set in env; fall back to undefined (tokens still work without it for basic FCM)
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.ready,
    });

    if (!token) return null;

    // Persist the token in Firestore for server-side send operations
    await saveFcmTokenToFirestore(token, userId);

    return token;
  } catch {
    return null;
  }
}

/**
 * Save an FCM token to the `fcm_tokens` Firestore collection.
 */
async function saveFcmTokenToFirestore(token: string, userId?: string): Promise<void> {
  try {
    const { db } = await import('./config');
    if (!db) return;

    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    await setDoc(
      doc(db, 'fcm_tokens', token),
      {
        token,
        userId: userId ?? null,
        userAgent: navigator.userAgent,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch {
    // Non-critical — ignore errors silently
  }
}

export interface FcmMessagePayload {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
  };
  data?: Record<string, string>;
  from?: string;
  collapseKey?: string;
  messageId?: string;
}

/**
 * Register a foreground message listener.
 * Returns an unsubscribe function.
 */
export async function onForegroundMessage(
  handler: (payload: FcmMessagePayload) => void
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};

  try {
    const { onMessage } = await import('firebase/messaging');
    const unsubscribe = onMessage(messaging, handler);
    return unsubscribe;
  } catch {
    return () => {};
  }
}
