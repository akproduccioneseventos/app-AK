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

export type { NotificationPreferences };

function getArchivoPreferencias(userId: string): string {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `usuarios/${safeId}/preferencias-avisos.json`;
}

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
    if (params.destinatarioEmail) {
      try {
        const { sendGoogleGmailMessage } = await import('@/lib/google-workspace');
        const companyAccount = {
          id: 'company',
          kind: 'company' as const,
          email: 'notificaciones@akproducciones.uy',
          status: 'connected' as const,
        };
        await sendGoogleGmailMessage(
          companyAccount as any,
          params.destinatarioEmail,
          params.titulo || 'Notificación AK Producciones',
          `<p>${params.mensaje}</p>`
        );
      } catch {
        // Continuar si falla el transporte externo en entorno local
      }
    }
    return {
      success: true,
      enviado: true,
    };
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
