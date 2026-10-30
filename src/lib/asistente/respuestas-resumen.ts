import 'server-only';

import { readDataConDetalle } from '@/lib/data-service';
import { mutarDocumentoConTransaccion } from '@/lib/generic-json-store';
import { hoyEnUruguay } from '@/lib/utils';
import { toWhatsAppDigits } from '@/lib/commercial/contact';
import type { ItemParteManana } from '@/lib/automatico/parte-manana';

export interface RegistroResumenManana {
  fecha?: string;
  estado?: string;
  destinatario?: string;
  items?: ItemParteManana[];
  pospuestosIds?: string[];
  motivo?: string;
}

/** Los numeros remiten al resumen realmente entregado, nunca a una accion inferida por la IA. */
export async function atenderRespuestaResumen(
  texto: string,
  from: string,
  esDueno: boolean,
  ahora = new Date(),
): Promise<string | null> {
  const comando = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  if (!/^[1-4]$/.test(comando) && comando !== 'despues') return null;
  if (!esDueno) return 'Los puntos del resumen diario los revisa el dueño desde su número autorizado.';
  const { valor: resumen, huboFalla } = await readDataConDetalle<RegistroResumenManana>('asistente/resumen-manana.json', {});
  const fecha = hoyEnUruguay(ahora);
  if (huboFalla) return 'No pude verificar el resumen de hoy. No ejecuté ninguna acción; revisalo en la app.';
  if (resumen.fecha !== fecha || resumen.estado !== 'whatsapp_enviado'
    || !resumen.destinatario || toWhatsAppDigits(resumen.destinatario) !== toWhatsAppDigits(from)) {
    return 'No tengo un resumen de hoy entregado a este número. Decime qué necesitás o revisá el Centro de control.';
  }
  if (comando === 'despues') {
    let pospuesto = false;
    await mutarDocumentoConTransaccion<RegistroResumenManana>('asistente/resumen-manana.json', {}, actual => {
      pospuesto = false;
      if (actual.fecha !== fecha || actual.destinatario !== resumen.destinatario || actual.estado !== 'whatsapp_enviado') return null;
      const ids = (actual.items || []).map(item => item.id);
      if (!ids.length) return null;
      pospuesto = true;
      return { ...actual, pospuestosIds: Array.from(new Set([...(actual.pospuestosIds || []), ...ids])) };
    });
    return pospuesto
      ? 'Los vuelvo a priorizar mañana si siguen pendientes. No cambié fechas, cobros ni mensajes.'
      : 'No pude posponer esos puntos; revisá el resumen de hoy en la app.';
  }
  const item = resumen.items?.[Number(comando) - 1];
  if (!item) return 'Ese número no corresponde a un punto del resumen de hoy.';
  let enlace = '';
  if (item.accionHref?.startsWith('/') && !/[\\\r\n]/.test(item.accionHref)) {
    const destino = new URL(item.accionHref, 'https://akproducciones.uy');
    if (destino.origin === 'https://akproducciones.uy') enlace = destino.toString();
  }
  return `${item.titulo}\n${enlace || 'Revisá este punto en el Centro de control de la app.'}\nNo ejecuté cambios ni envié mensajes: la acción se confirma en su pantalla.`;
}
