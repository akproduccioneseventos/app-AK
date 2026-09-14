'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { readData, writeData } from '@/lib/data-service';
import { createNotification } from './notifications';
import type { Notificacion } from '@/types/fiesta';

import {
  initialNotificationPreferences,
  type NotificationPreferences,
} from '@/types/preferencias-avisos';
import {
  getArchivoPreferencias,
  debeEnviarAvisoInterno,
} from '@/lib/notifications/preferencias-avisos';

export type { NotificationPreferences };

/**
 * Lee las preferencias de avisos guardadas en el servidor para el usuario autenticado.
 */
export async function leerPreferenciasDeAvisos(): Promise<{
  success: boolean;
  preferences?: NotificationPreferences;
  error?: string;
}> {
  await requireAppSession();
  try {
    const session = await verifySession();
    const userId = session.user?.userId || 'admin';
    const archivo = getArchivoPreferencias(userId);
    const stored = await readData<NotificationPreferences>(archivo, initialNotificationPreferences);
    return {
      success: true,
      preferences: {
        ...initialNotificationPreferences,
        ...(stored || {}),
      },
    };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error al leer preferencias de avisos' };
  }
}

/**
 * Guarda las preferencias de avisos en el servidor para el usuario autenticado.
 */
export async function guardarPreferenciasDeAvisos(
  prefs: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    if (!prefs || typeof prefs !== 'object') {
      return { success: false, error: 'Preferencias no válidas' };
    }
    const session = await verifySession();
    const userId = session.user?.userId || 'admin';
    const archivo = getArchivoPreferencias(userId);
    await writeData(archivo, prefs);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Error al guardar preferencias de avisos' };
  }
}

/**
 * Consulta si un usuario tiene habilitado un tipo de aviso específico antes de enviarlo.
 */
export async function debeEnviarAviso(
  categoria: keyof NotificationPreferences,
  canal: 'email' | 'app',
  userId: string = 'admin'
): Promise<boolean> {
  await requireAppSession();
  try {
    const archivo = getArchivoPreferencias(userId);
    const prefs = await readData<NotificationPreferences>(archivo, initialNotificationPreferences);
    if (!prefs || !prefs[categoria]) return true;
    return prefs[categoria][canal] ?? true;
  } catch {
    return true;
  }
}

/**
 * Envía una notificación respetando estrictamente las preferencias del usuario.
 * Si el usuario apagó el aviso, no se envía y se devuelve status deshabilitado.
 */
export async function enviarAvisoConPreferencia(params: {
  userId?: string;
  categoria: keyof NotificationPreferences;
  canal?: 'email' | 'app';
  notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>;
}): Promise<{
  success: boolean;
  enviado: boolean;
  motivo?: string;
  notification?: Notificacion;
  error?: string;
}> {
  await requireAppSession();
  const canal = params.canal || 'app';
  const userId = params.userId || 'admin';

  const habilitado = await debeEnviarAviso(params.categoria, canal, userId);
  if (!habilitado) {
    return {
      success: true,
      enviado: false,
      motivo: `El usuario tiene desactivados los avisos de tipo ${params.categoria} por canal ${canal}`,
    };
  }

  const res = await createNotification(params.notificacion);
  return {
    success: res.success,
    enviado: res.success,
    notification: res.notification,
    error: res.error,
  };
}

/**
 * Despacha un aviso por email o por app respetando las preferencias del usuario.
 * Si el usuario apagó el aviso, no se envía y se devuelve enviado: false.
 */
export async function enviarAviso(params: {
  categoria: keyof NotificationPreferences;
  canal: 'email' | 'app';
  mensaje: string;
  titulo?: string;
  userId?: string;
  destinatarioEmail?: string;
  href?: string;
}): Promise<{
  success: boolean;
  enviado: boolean;
  motivo?: string;
  notification?: Notificacion;
  error?: string;
}> {
  await requireAppSession();
  const canal = params.canal;
  const userId = params.userId || 'admin';

  const habilitado = await debeEnviarAviso(params.categoria, canal, userId);
  if (!habilitado) {
    return {
      success: true,
      enviado: false,
      motivo: `El usuario tiene desactivados los avisos de tipo ${params.categoria} por canal ${canal}`,
    };
  }

  if (canal === 'email') {
    if (!params.destinatarioEmail) {
      return {
        success: false,
        enviado: false,
        error: 'No se especificó destinatario de correo electrónico.',
      };
    }
    try {
      const { readData: readAccounts } = await import('@/lib/data-service');
      const { ensureFreshGoogleAccount, sendGoogleGmailMessage } = await import('@/lib/google-workspace');
      const accounts = await readAccounts<any[]>('google-accounts.json', []);
      const companyAccount = accounts.find((acc) => acc.kind === 'company' || acc.status === 'connected');

      if (!companyAccount) {
        return {
          success: false,
          enviado: false,
          motivo: 'No hay ninguna cuenta de Google Workspace conectada para enviar correos electrónicos.',
          error: 'Cuenta de correo no conectada.',
        };
      }

      const freshAccount = await ensureFreshGoogleAccount(companyAccount).catch(() => undefined);
      const activeAccount = freshAccount || companyAccount;

      if (!activeAccount?.accessToken) {
        return {
          success: false,
          enviado: false,
          motivo: 'La cuenta de Google conectada no tiene un token de acceso válido.',
          error: 'Token de acceso no disponible.',
        };
      }

      await sendGoogleGmailMessage(
        activeAccount,
        params.destinatarioEmail,
        params.titulo || 'Notificación AK Producciones',
        `<p>${params.mensaje}</p>`
      );

      return {
        success: true,
        enviado: true,
      };
    } catch (err: any) {
      return {
        success: false,
        enviado: false,
        error: err?.message || 'Error al enviar el correo a través de Google Workspace.',
      };
    }
  }

  const res = await createNotification({
    titulo: params.titulo,
    mensaje: params.mensaje,
    href: params.href,
  });

  return {
    success: res.success,
    enviado: res.success,
    notification: res.notification,
    error: res.error,
  };
}
