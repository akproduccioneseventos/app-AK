'use server';

import { requireAdminSession, requireAppSession } from '@/lib/auth/require-session';
import {
  estadoDeLasTareas,
  estadoDelDespertador,
  type EstadoDeTarea,
  type EstadoDespertador,
} from '@/lib/automatico/tareas-automaticas';
import { runMarketingAutomation } from '@/lib/marketing-automation';
import { procesarPosteosProgramados } from '@/lib/presencia-digital/publicador';
import { syncCommentsFromNetworks } from '@/lib/social-media/comments-backfill';
import { guardarMetricasDelDia } from '@/lib/presencia-digital/guardado-diario';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';

export async function getEstadoTareasAutomaticas(): Promise<EstadoDeTarea[]> {
  await requireAppSession();
  return estadoDeLasTareas();
}

export async function getEstadoDespertadorAction(): Promise<EstadoDespertador> {
  await requireAppSession();
  return estadoDelDespertador();
}

/**
 * Dispara tareas automáticas desatendidas si están atrasadas o nunca corrieron.
 * Se invoca al ingresar al panel para mantener los números y posteos al día.
 *
 * REGLA ESTRICTA DE SEGURIDAD:
 * Los recordatorios de cobro y mensajes a clientes NUNCA se disparan solos.
 */
export async function dispararTareasVencidasDeFondo(): Promise<{
  ejecutadas: string[];
  errores: string[];
}> {
  // Pide cuenta de ADMINISTRADOR, no cualquier cuenta del equipo. Esto publica en
  // el Instagram y el Facebook de la empresa y gasta inteligencia artificial: no
  // puede dispararse porque alguien de recepcion abrio la aplicacion. Antes de este
  // cambio lo mismo lo hacia una direccion que si pedia administrador, asi que
  // dejarlo abierto al equipo entero era ampliar el permiso sin querer.
  const admin = await requireAdminSession();
  if (!admin.ok) return { ejecutadas: [], errores: [] };

  const estados = await estadoDeLasTareas();
  const ejecutadas: string[] = [];
  const errores: string[] = [];

  for (const tarea of estados) {
    if (tarea.estado === 'al-dia') continue;

    // Solo tareas que NO contactan a clientes
    if (tarea.id === 'generate-blog-post') {
      try {
        // `includeRecontacto: false` NO es un detalle: sin esto, esta misma llamada
        // le manda el mensaje de recontacto al prospecto que no seno, que es
        // justo lo que dice arriba que nunca pasa solo. Hoy no se nota porque ese
        // recontacto viene apagado; el dia que el dueno lo prenda, saldrian
        // mensajes con solo abrir la aplicacion.
        await runMarketingAutomation({ includeRecontacto: false });
        ejecutadas.push(tarea.id);
      } catch (err: any) {
        errores.push(`${tarea.id}: ${err.message}`);
      }
    } else if (tarea.id === 'metricas-de-redes') {
      try {
        await Promise.all([
          guardarMetricasDelDia().catch(() => null),
          syncCommentsFromNetworks().catch(() => null),
        ]);
        await marcarCorrida(tarea.id);
        ejecutadas.push(tarea.id);
      } catch (err: any) {
        errores.push(`${tarea.id}: ${err.message}`);
      }
    } else if (tarea.id === 'publicar-programados') {
      try {
        await procesarPosteosProgramados();
        await marcarCorrida(tarea.id);
        ejecutadas.push(tarea.id);
      } catch (err: any) {
        errores.push(`${tarea.id}: ${err.message}`);
      }
    }
  }

  return { ejecutadas, errores };
}

/**
 * Ejecuta una tarea puntual a pedido del operador desde el panel.
 */
export async function ejecutarTareaManual(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();

  try {
    if (id === 'generate-blog-post') {
      // El boton dice "nota del blog" y hace la nota del blog. Sin esto tambien
      // saldrian los mensajes de recontacto a los prospectos, que no es lo que el
      // operador aprieta ni lo que la pantalla le anuncia.
      await runMarketingAutomation({ includeRecontacto: false });
      return { success: true };
    }

    if (id === 'metricas-de-redes') {
      await Promise.all([
        guardarMetricasDelDia().catch(() => null),
        syncCommentsFromNetworks().catch(() => null),
      ]);
      await marcarCorrida(id);
      return { success: true };
    }

    if (id === 'publicar-programados') {
      await procesarPosteosProgramados();
      await marcarCorrida(id);
      return { success: true };
    }

    if (id === 'recordatorios-de-pago') {
      // El operador apretó explícitamente el botón en el panel
      await marcarCorrida(id);
      return { success: true };
    }

    return { success: false, error: 'Tarea no reconocida.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al ejecutar la tarea.' };
  }
}
