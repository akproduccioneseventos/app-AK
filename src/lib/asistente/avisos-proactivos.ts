import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { getAsistenteSettings, getHoraUruguay } from '@/lib/asistente/avisar-al-duenio';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { readData, writeData } from '@/lib/data-service';

export interface ParametrosAvisoProactivo {
  destinatario: { id?: string; email?: string; role?: string; roles?: string[]; permissions?: string[] };
  tipo: 'cobros' | 'fiestas' | 'ventas' | 'general';
  titulo: string;
  cuerpo: string;
  fechaActual?: Date;
}

const ARCHIVO_AVISOS = 'asistente/avisos-diarios.json';

/**
 * Envía avisos proactivos respetando perfil, horarios, topes e interruptores.
 * Regla de Oro:
 * - A la contadora, lo que falta cobrar; al organizador, lo que falta de una fiesta.
 * - El aviso de cobros NO le llega al operador.
 * - Máximo 3 avisos por persona por día.
 * - Nunca entre las 23:00 y las 08:00 (hora de Uruguay).
 * - Interruptor en Ajustes -> Asistente (prendido por omisión).
 */
export async function enviarAvisoProactivoSegunPerfil(params: ParametrosAvisoProactivo): Promise<{
  enviado: boolean;
  motivo?: string;
}> {
  const { destinatario, tipo, titulo, cuerpo, fechaActual = new Date() } = params;

  // 1. Candado de Permisos por perfil
  if (tipo === 'cobros' && !puede(destinatario, PERMISOS.CONTABILIDAD)) {
    return { enviado: false, motivo: 'perfil_sin_permiso_de_cobros' };
  }

  // 2. Interruptor de Ajustes
  const ajustes = await getAsistenteSettings().catch(() => ({ avisosProactivosActivos: true }));
  if ((ajustes as any).avisosProactivosActivos === false) {
    return { enviado: false, motivo: 'interruptor_apagado' };
  }

  // 3. Horario de descanso: nunca entre las 23 y las 8 en Uruguay
  const horaUy = getHoraUruguay(fechaActual);
  if (horaUy >= 23 || horaUy < 8) {
    return { enviado: false, motivo: 'horario_descanso' };
  }

  // 4. Tope de 3 avisos diarios por persona
  const fechaStr = fechaActual.toISOString().split('T')[0];
  const userKey = destinatario.id || destinatario.email || destinatario.role || 'general';
  const tracking = await readData<Record<string, { fecha: string; count: number }>>(ARCHIVO_AVISOS, {});
  const actual = tracking[userKey] || { fecha: fechaStr, count: 0 };
  const count = actual.fecha === fechaStr ? actual.count : 0;

  if (count >= 3) {
    return { enviado: false, motivo: 'tope_diario_alcanzado' };
  }

  // 5. Envío mediante server-messaging
  try {
    await sendPushNotificationToAll({
      title: `Asistente AK: ${titulo}`,
      body: cuerpo,
      url: '/mi-dia?hablar=1',
    });

    tracking[userKey] = { fecha: fechaStr, count: count + 1 };
    await writeData(ARCHIVO_AVISOS, tracking).catch(() => {});

    return { enviado: true };
  } catch (err: any) {
    return { enviado: false, motivo: err?.message || 'error_envio' };
  }
}
