'use server';

/**
 * Server Actions para gestionar la cookie de sesion HTTP-only.
 *
 * La cookie `ak_session` permite que el middleware de Next.js pueda
 * validar la sesion del lado servidor y proteger rutas privadas.
 * Se establece en paralelo al almacenamiento en localStorage/sessionStorage.
 */

import { cookies } from 'next/headers';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/session-token';

type SetSessionCookieResult = { success: true } | { success: false; error: string };

/**
 * Establece la cookie de sesion HTTP-only.
 * Llamar despues de verificar la contrasena correctamente.
 */
export async function setSessionCookie(): Promise<SetSessionCookieResult> {
  try {
    const token = await createSessionToken();
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return { success: true };
  } catch (error) {
    console.error('[session] could not create signed session cookie:', error);
    return {
      success: false,
      error: 'No se pudo iniciar una sesion segura. Revisa la configuracion del servidor.',
    };
  }
}

/**
 * Elimina la cookie de sesion.
 * Llamar durante el logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
