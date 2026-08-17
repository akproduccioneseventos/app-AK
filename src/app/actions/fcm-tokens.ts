'use server';

/**
 * Server Action para guardar tokens FCM usando Firebase Admin SDK.
 *
 * El cliente (navegador) NO puede escribir directamente en la colección `fcm_tokens`
 * porque las reglas de Firestore bloquean todo acceso client-side
 * (`allow read, write: if false;`).
 *
 * Esta Server Action corre en el servidor y usa el Admin SDK, que tiene acceso
 * completo independientemente de las reglas de seguridad del cliente.
 */

import { dbAdmin } from '@/lib/firebase/server';
import admin from 'firebase-admin';
import { verifySession } from '@/lib/auth/session-token';

export interface SaveFcmTokenResult {
  success: boolean;
  error?: string;
}

/**
 * Guarda (o actualiza) un token FCM en la colección `fcm_tokens` de Firestore.
 * @param token  Token FCM generado por el navegador.
 * @param userId ID del usuario autenticado (opcional).
 * @param userAgent User-agent enviado desde el cliente.
 */
export async function saveFcmToken(
  token: string,
  userId?: string,
  userAgent?: string
): Promise<SaveFcmTokenResult> {
  // Sin sesion cualquiera podia anotar un aparato en esta lista, y peor: elegir
  // a nombre de QUIEN quedaba anotado, porque el `userId` venia del navegador.
  // Hoy nada manda avisos desde esta lista, asi que no hay nada filtrandose;
  // pero el dia que se enchufen los avisos, un extrano habria recibido los del
  // equipo. La pantalla que la usa es la del panel interno, que ya pide sesion:
  // pedirla aca no le cambia nada a nadie.
  const sesion = await verifySession();
  if (!sesion.success) {
    return { success: false, error: 'Sesion no autorizada.' };
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, error: 'Token inválido.' };
  }

  if (!dbAdmin) {
    // Firebase no disponible — guardar falla silenciosamente para no romper la UX
    console.warn('[fcm-tokens] Firebase Admin no disponible. Token FCM no guardado.');
    return { success: false, error: 'Base de datos no disponible.' };
  }

  try {
    await dbAdmin.collection('fcm_tokens').doc(token).set(
      {
        token,
        // Manda quien inicio sesion, no lo que dice el navegador: si no,
        // alguien podria anotar su propio aparato a nombre del dueno.
        userId: sesion.user?.userId ?? userId ?? null,
        userAgent: userAgent ?? null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (err) {
    console.error('[fcm-tokens] Error guardando token FCM:', err);
    return { success: false, error: 'Error al guardar el token.' };
  }
}
