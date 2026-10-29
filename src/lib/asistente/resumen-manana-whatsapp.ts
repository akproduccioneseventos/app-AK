import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import type { ParteDeLaManana } from '@/lib/automatico/parte-manana';

const ARCHIVO_RESERVAS = 'asistente/resumen-manana.json';

function fechaHoraUruguay(fecha: Date): { fecha: string; hora: number; minuto: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Montevideo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)?.value || '';
  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    hora: Number(valor('hour')),
    minuto: Number(valor('minute')),
  };
}

export async function enviarResumenMananaWhatsApp(
  parte: ParteDeLaManana,
  ahora: Date = new Date(),
): Promise<{ enviado: boolean; fallbackPush: boolean; motivo?: string }> {
  const momento = fechaHoraUruguay(ahora);
  if (momento.hora !== 8 || momento.minuto < 30) {
    return { enviado: false, fallbackPush: false, motivo: 'Fuera de la ventana matutina.' };
  }

  let reservado = false;
  await mutarDocumentoConTransaccion<{ fecha?: string; estado?: string }>(
    ARCHIVO_RESERVAS,
    {},
    (actual) => {
      if (actual.fecha === momento.fecha) return null;
      reservado = true;
      return { fecha: momento.fecha, estado: 'reservado' };
    },
  );
  if (!reservado) return { enviado: false, fallbackPush: false, motivo: 'El resumen de hoy ya se procesó.' };

  const ajustes = await getAsistenteSettings().catch(() => null);
  const lineas = (parte.itemsPrincipales || []).slice(0, 4).map((item, index) => `${index + 1}. ${item.titulo}`);
  if (!lineas.length) lineas.push('1. Por hoy está todo al día.');
  const texto = [`Asistente AK · ${momento.fecha}`, ...lineas].slice(0, 5).join('\n');
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  let motivo = ajustes ? 'WhatsApp del dueño está apagado en Ajustes.' : 'No se pudieron leer los ajustes de WhatsApp.';
  let enviado = false;

  if (ajustes?.whatsappDuenioHabilitado && apiToken && phoneNumberId && ajustes.numeroDuenio) {
    const respuesta = await sendMetaWhatsAppMessage({ to: ajustes.numeroDuenio, text: texto, apiToken, phoneNumberId })
      .catch((error) => ({ success: false, error: error instanceof Error ? error.message : 'No se pudo contactar a WhatsApp Meta.' }));
    enviado = respuesta.success;
    motivo = respuesta.error || 'Meta no confirmó el envío.';
  } else if (!apiToken || !phoneNumberId) {
    motivo = 'Falta la conexión con WhatsApp Meta.';
  }

  if (enviado) {
    await mutarDocumentoConTransaccion(ARCHIVO_RESERVAS, {}, (actual: any) =>
      actual?.fecha === momento.fecha ? { ...actual, estado: 'whatsapp_enviado' } : null,
    );
    return { enviado: true, fallbackPush: false };
  }

  await sendPushNotificationToAll({
    title: 'Resumen del asistente AK',
    body: 'El resumen de hoy está listo. Abrí la app para verlo con los permisos de tu perfil.',
    url: '/mi-dia?hablar=1',
  });
  await mutarDocumentoConTransaccion(ARCHIVO_RESERVAS, {}, (actual: any) =>
    actual?.fecha === momento.fecha ? { ...actual, estado: 'push_fallback', motivo } : null,
  );
  return { enviado: false, fallbackPush: true, motivo };
}
