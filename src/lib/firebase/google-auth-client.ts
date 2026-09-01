'use client';

import {
  browserSessionPersistence,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { app } from '@/lib/firebase/config';

function getGoogleAuth() {
  if (!app) {
    const error = new Error('El ingreso con Google no esta disponible.') as Error & { code?: string };
    error.code = 'auth/configuration-not-found';
    throw error;
  }
  return getAuth(app);
}

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

async function prepareGoogleAuth() {
  const auth = getGoogleAuth();
  await setPersistence(auth, browserSessionPersistence);
  return auth;
}

export async function signInWithGooglePopup(): Promise<string> {
  const auth = await prepareGoogleAuth();
  const result = await signInWithPopup(auth, createGoogleProvider());
  return result.user.getIdToken(true);
}

export async function startGoogleSignInRedirect(): Promise<void> {
  const auth = await prepareGoogleAuth();
  await signInWithRedirect(auth, createGoogleProvider());
}

export async function consumeGoogleRedirectToken(): Promise<string | null> {
  const auth = await prepareGoogleAuth();
  const result = await getRedirectResult(auth);
  return result ? result.user.getIdToken(true) : null;
}

export async function clearGoogleAuthSession(): Promise<void> {
  if (!app) return;
  try {
    const auth = getAuth(app);
    await signOut(auth).catch(() => undefined);
  } catch {
    // Si auth no está disponible en este entorno, ignorar de forma segura
  }
}

/**
 * **Ya no se manda al celular por el camino del desvio, y este es el motivo.**
 *
 * Antes, cualquier pantalla angosta —o sea, todo telefono— iba directo al desvio a
 * Google en vez de abrir la ventanita. Y el desvio **falla en silencio** en los
 * navegadores que bloquean el guardado de datos de otros sitios: Safari en iPhone lo
 * hace de fabrica, y Chrome tambien cuando la app esta instalada como aplicacion.
 * "Falla en silencio" quiere decir literalmente eso: la pagina no se va a ningun lado,
 * no aparece ningun error, **el boton no hace nada**. Es lo que reporto el dueno.
 *
 * La ventanita, en cambio, anda en los telefonos de hoy. Y si el navegador llegara a
 * bloquearla, avisa con un error que si se puede reconocer —`auth/popup-blocked`— y ahi
 * recien se prueba el desvio, que es para lo que sirve: como plan B, no como plan A.
 *
 * Se deja la funcion en vez de borrarla para que quede escrito por que devuelve `false`
 * siempre: si alguien vuelve a mirar esto, que no lo "arregle" al reves.
 */
export function shouldPreferGoogleRedirect(): boolean {
  return false;
}

export function shouldFallbackToGoogleRedirect(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === 'auth/popup-blocked'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/operation-not-supported-in-this-environment';
}

export function getGoogleAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/unauthorized-domain':
      return 'Este dominio todavia no esta autorizado en Firebase Authentication.';
    case 'auth/operation-not-allowed':
      return 'El acceso con Google todavia no esta habilitado en Firebase Authentication.';
    case 'auth/popup-closed-by-user':
      return 'Se cerro la ventana de Google antes de terminar. Proba de nuevo.';
    case 'auth/network-request-failed':
      return 'No se pudo conectar con Google. Revisa internet e intenta nuevamente.';
    case 'auth/configuration-not-found':
      // Le habla al usuario, no al programador: antes decia "Firebase no esta
      // configurado", que no le dice nada a nadie y ademas asusta.
      return 'El ingreso con Google no esta disponible. Entra con tu correo y contrasena.';
    default:
      return 'No se pudo completar el ingreso con Google.';
  }
}
