import { getAsistenteSettings } from '@/lib/asistente/avisar-al-duenio';
import { sendPushNotificationToAll } from '@/lib/firebase/server-messaging';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { toWhatsAppNumber } from '@/lib/commercial/contact';
import { aprenderDeLoAprobado, resumirGuiaDeEstilo } from '@/lib/ia/aprender-de-lo-aprobado';
import type { ItemParteManana, ParteDeLaManana } from '@/lib/automatico/parte-manana';
import type { RegistroResumenManana } from '@/lib/asistente/respuestas-resumen';

const ARCHIVO_RESERVAS = 'asistente/resumen-manana.json';
type ReservaResumenConItemsPendientes = RegistroResumenManana & {
  itemsPendientes?: ItemParteManana[];
  entregaWhatsApp?: 'sent' | 'not_sent' | 'uncertain';
  messageId?: string;
};

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

  const ajustes = await getAsistenteSettings().catch(() => null);
  const destinoConfigurado = toWhatsAppNumber(ajustes?.numeroDuenio);
  const destinoAutorizado = ajustes?.numerosEquipo?.some((miembro) =>
    toWhatsAppNumber(miembro.telefono) === destinoConfigurado
    && ['dueno', 'duena'].includes(miembro.rol.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())
  ) ? destinoConfigurado : '';
  const puedeEnviarWhatsApp = Boolean(
    ajustes?.whatsappDuenioHabilitado && destinoAutorizado
    && (process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN)
    && (process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID),
  );
  const reserva = await mutarDocumentoConTransaccion<ReservaResumenConItemsPendientes>(
    ARCHIVO_RESERVAS,
    {},
    (actual) => {
      if (actual.fecha === momento.fecha && actual.estado !== 'error') return null;
      const actuales = parte.items ?? parte.itemsPrincipales ?? [];
      const idsPospuestos = new Set(actual.pospuestosIds || []);
      const itemsPrioritarios = actuales.filter((item) => idsPospuestos.has(item.id));
      const itemsRestantes = actuales.filter((item) => !idsPospuestos.has(item.id));
      const itemsPendientes = [...itemsPrioritarios, ...itemsRestantes].slice(0, 4);
      return {
        fecha: momento.fecha,
        estado: 'reservado',
        destinatario: puedeEnviarWhatsApp ? destinoAutorizado : undefined,
        itemsPendientes,
        pospuestosIds: actual.pospuestosIds || [],
      };
    },
  );
  if (!reserva) return { enviado: false, fallbackPush: false, motivo: 'El resumen de hoy ya se procesó.' };

  const itemsParaEnviar = reserva.itemsPendientes || [];
  const lineas = itemsParaEnviar.map((item, index) => `${index + 1}. ${item.titulo}`);
  if (!lineas.length) lineas.push('1. Por hoy está todo al día.');
  const ejemplosEstilo = await aprenderDeLoAprobado('resumen_de_la_manana');
  const guiaEstilo = ejemplosEstilo.length ? resumirGuiaDeEstilo(ejemplosEstilo) : '';
  const encabezado = guiaEstilo.includes('cálido') ? `Buen día · ${momento.fecha}` : `Asistente AK · ${momento.fecha}`;
  const texto = [encabezado, ...lineas].slice(0, 5).join('\n');
  const apiToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '';
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  let motivo = ajustes ? 'WhatsApp del dueño está apagado o el destinatario no está autorizado como dueño.' : 'No se pudieron leer los ajustes de WhatsApp.';
  let entregaWhatsApp: 'sent' | 'not_sent' | 'uncertain' = 'not_sent';
  let messageId: string | undefined;

  if (puedeEnviarWhatsApp && reserva.destinatario && apiToken && phoneNumberId) {
    const respuesta = await sendMetaWhatsAppMessage({ to: reserva.destinatario, text: texto, apiToken, phoneNumberId })
      .catch((error) => ({ success: false, delivery: 'uncertain' as const, messageId: undefined, error: error instanceof Error ? error.message : 'No se pudo contactar a WhatsApp Meta.' }));
    messageId = respuesta.messageId;
    entregaWhatsApp = respuesta.success
      ? messageId ? 'sent' : 'uncertain'
      : respuesta.delivery || 'uncertain';
    motivo = respuesta.error || 'Meta no confirmó el envío.';
  } else if (!apiToken || !phoneNumberId) {
    motivo = 'Falta la conexión con WhatsApp Meta.';
  }

  if (entregaWhatsApp === 'sent' && messageId) {
    await mutarDocumentoConTransaccion<ReservaResumenConItemsPendientes>(ARCHIVO_RESERVAS, {}, (actual) =>
      actual.fecha === reserva.fecha && actual.estado === 'reservado'
        ? {
            ...actual,
            estado: 'whatsapp_enviado',
            destinatario: reserva.destinatario,
            items: itemsParaEnviar,
            messageId,
            entregaWhatsApp: 'sent',
            itemsPendientes: undefined,
            pospuestosIds: (actual.pospuestosIds || []).filter((id) => !itemsParaEnviar.some((item) => item.id === id)),
          }
        : null,
    );
    return { enviado: true, fallbackPush: false };
  }

  const push = await sendPushNotificationToAll({
    title: 'Resumen del asistente AK',
    body: 'El resumen de hoy está listo. Abrí la app para verlo con los permisos de tu perfil.',
    url: '/mi-dia?hablar=1',
  }).catch((error) => ({
    success: false, sentCount: 0, failureCount: 0,
    error: error instanceof Error ? error.message : 'No se pudo confirmar el envío push.',
  }));
  const pushEnviado = push.success && push.sentCount > 0;
  const errorFinal = pushEnviado
    ? motivo
    : `${motivo} El aviso push tampoco se confirmó${push.error ? `: ${push.error}` : '.'}`;
  const estadoFallback = pushEnviado
    ? entregaWhatsApp === 'uncertain' ? 'push_fallback_incierto' : 'push_fallback'
    : entregaWhatsApp === 'uncertain' ? 'envio_incierto' : 'error';
  await mutarDocumentoConTransaccion<ReservaResumenConItemsPendientes>(ARCHIVO_RESERVAS, {}, (actual) =>
    actual.fecha === reserva.fecha && actual.estado === 'reservado'
      ? { ...actual, estado: estadoFallback, motivo: errorFinal, entregaWhatsApp, itemsPendientes: undefined }
      : null,
  );
  return { enviado: false, fallbackPush: pushEnviado, motivo: errorFinal };
}
