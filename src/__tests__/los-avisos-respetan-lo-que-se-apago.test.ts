/**
 * Control Orden 56 — Los avisos respetan lo que se apagó.
 *
 * Se probó rompiéndolo a propósito:
 * Se forzó que `debeEnviarAvisoInterno` siempre devuelva `true` ignorando
 * las preferencias apagadas, y la prueba falló en rojo. Al restaurar la
 * consulta real a las preferencias del usuario, pasó a verde.
 */

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';

import {
  guardarPreferenciasUsuario,
  getPreferenciasUsuario,
  debeEnviarAvisoInterno,
  inferirCategoriaAviso,
} from '@/lib/notifications/preferencias-avisos';
import { initialNotificationPreferences } from '@/types/preferencias-avisos';
import { createNotification } from '@/app/actions/notifications';
import { NOTIFICATION_INTERNAL_TOKEN } from '@/lib/notifications/internal-token';

describe('Orden 56: Los avisos respetan lo que se apagó', () => {
  const testUserId = 'test_user_orden_56';

  beforeEach(async () => {
    // Restaurar preferencias iniciales para el usuario de prueba
    await guardarPreferenciasUsuario(testUserId, {
      ...initialNotificationPreferences,
    });
  });

  it('infiere correctamente las categorías de aviso a partir del contenido o tipo', () => {
    expect(inferirCategoriaAviso({ mensaje: '🚨 VENCE HOY: Tarea de sonido' })).toBe('taskUpdates');
    expect(inferirCategoriaAviso({ mensaje: 'Nuevo prospecto en el CRM' })).toBe('crmUpdates');
    expect(inferirCategoriaAviso({ mensaje: 'Mensaje de WhatsApp recibido' })).toBe('clientMessages');
    expect(inferirCategoriaAviso({ mensaje: 'Alerta del sistema: error de conexión' })).toBe('systemAlerts');
    expect(inferirCategoriaAviso({ mensaje: 'Recordatorio de la fiesta de 15' })).toBe('eventReminders');
    expect(inferirCategoriaAviso({ categoria: 'crmUpdates' })).toBe('crmUpdates');
  });

  it('guarda y lee las preferencias del usuario en el servidor', async () => {
    const customPrefs = {
      ...initialNotificationPreferences,
      taskUpdates: { email: false, app: false },
      systemAlerts: { email: true, app: true },
    };

    await guardarPreferenciasUsuario(testUserId, customPrefs);
    const leidas = await getPreferenciasUsuario(testUserId);

    expect(leidas.taskUpdates.app).toBe(false);
    expect(leidas.taskUpdates.email).toBe(false);
    expect(leidas.systemAlerts.email).toBe(true);
  });

  it('si el usuario apaga un tipo de aviso, debeEnviarAvisoInterno devuelve false', async () => {
    await guardarPreferenciasUsuario(testUserId, {
      ...initialNotificationPreferences,
      taskUpdates: { email: false, app: false },
    });

    const habilitadoApp = await debeEnviarAvisoInterno('taskUpdates', 'app', testUserId);
    const habilitadoEmail = await debeEnviarAvisoInterno('taskUpdates', 'email', testUserId);

    expect(habilitadoApp).toBe(false);
    expect(habilitadoEmail).toBe(false);
  });

  it('apagar un aviso en la app hace que createNotification NO lo guarde ni lo cree', async () => {
    // 1. Apagar taskUpdates para la app
    await guardarPreferenciasUsuario(testUserId, {
      ...initialNotificationPreferences,
      taskUpdates: { email: false, app: false },
    });

    // 2. Disparar creación de notificación de tarea para ese usuario
    const resApagado = await createNotification(
      {
        mensaje: '🚨 VENCE HOY: Tarea de prueba de sonido',
        categoria: 'taskUpdates',
        userId: testUserId,
      } as any,
      NOTIFICATION_INTERNAL_TOKEN
    );

    // Debe retornar éxito pero SIN notificación creada
    expect(resApagado.success).toBe(true);
    expect(resApagado.notification).toBeUndefined();

    // 3. Encender y verificar que ahora sí se crea
    await guardarPreferenciasUsuario(testUserId, {
      ...initialNotificationPreferences,
      taskUpdates: { email: false, app: true },
    });

    const resEncendido = await createNotification(
      {
        mensaje: '🚨 VENCE HOY: Tarea de iluminación',
        categoria: 'taskUpdates',
        userId: testUserId,
      } as any,
      NOTIFICATION_INTERNAL_TOKEN
    );

    expect(resEncendido.success).toBe(true);
    expect(resEncendido.notification).toBeDefined();
    expect(resEncendido.notification?.mensaje).toContain('iluminación');
  });
});
