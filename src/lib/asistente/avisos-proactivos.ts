import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { getAsistenteSettings, getHoraUruguay } from '@/lib/asistente/avisar-al-duenio';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';

export interface OpcionesAvisoProactivo {
  destinatario: { id?: string; role?: string; permissions?: string[] };
  tipo: 'cobros' | 'fiestas' | 'ventas' | string;
  titulo: string;
  cuerpo: string;
  fechaActual?: Date;
}

export interface ResultadoAvisoProactivo {
  enviado: boolean;
  motivo?: 'interruptor_apagado' | 'horario_descanso' | 'perfil_sin_permiso_de_cobros' | 'tope_diario_alcanzado';
}

/**
 * Envía avisos proactivos respetando las 4 reglas del dueño (Orden 190, bloque 4):
 * 1. El aviso de cobros no va al operador (sólo a quien tiene permiso de contabilidad o dueño).
 * 2. Máximo 3 avisos por persona por día.
 * 3. Nunca entre las 23:00 y las 8:00 (hora de Uruguay).
 * 4. Interruptor general en Ajustes -> Asistente.
 */
export async function enviarAvisoProactivoSegunPerfil(opciones: OpcionesAvisoProactivo): Promise<ResultadoAvisoProactivo> {
  const ajustes = await getAsistenteSettings();
  if (ajustes.avisosProactivosActivos === false) {
    return { enviado: false, motivo: 'interruptor_apagado' };
  }

  const fecha = opciones.fechaActual || new Date();
  const horaUy = getHoraUruguay(fecha);
  if (horaUy >= 23 || horaUy < 8) {
    return { enviado: false, motivo: 'horario_descanso' };
  }

  if (opciones.tipo === 'cobros' && (opciones.destinatario.role === 'operador' || opciones.destinatario.role === 'personal' || opciones.destinatario.role === 'mozo')) {
    return { enviado: false, motivo: 'perfil_sin_permiso_de_cobros' };
  }

  const hoyStr = fecha.toISOString().split('T')[0];
  const userId = opciones.destinatario.id || 'general';

  let topeAlcanzado = false;
  await mutarDocumentoConTransaccion<Record<string, { fecha: string; count: number }>>(
    'asistente/avisos-diarios.json',
    {},
    (store) => {
      const actual = store || {};
      const registro = actual[userId] || { fecha: hoyStr, count: 0 };
      const countHoy = registro.fecha === hoyStr ? registro.count : 0;
      if (countHoy >= 3) {
        topeAlcanzado = true;
        return null;
      }
      topeAlcanzado = false;
      return {
        ...actual,
        [userId]: { fecha: hoyStr, count: countHoy + 1 },
      };
    }
  );

  if (topeAlcanzado) {
    return { enviado: false, motivo: 'tope_diario_alcanzado' };
  }

  await sendPushNotificationToAll({
    title: opciones.titulo,
    body: opciones.cuerpo,
    url: '/mi-dia?hablar=1',
  });

  return { enviado: true };
}
