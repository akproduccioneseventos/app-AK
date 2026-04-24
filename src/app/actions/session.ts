'use server';

/**
 * Server Actions para gestionar la cookie de sesión HTTP-only.
 *
 * La cookie `ak_session` permite que el middleware de Next.js pueda
 * validar la sesión del lado servidor y proteger rutas privadas.
 * Se establece en paralelo al almacenamiento en localStorage/sessionStorage.
 */

import { cookies } from 'next/headers';

const SESSION_COOKIE = 'ak_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 días

/**
 * Establece la cookie de sesión HTTP-only.
 * Llamar después de verificar la contraseña correctamente.
 */
export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Elimina la cookie de sesión.
 * Llamar durante el logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
