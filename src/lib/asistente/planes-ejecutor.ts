import 'server-only';

import { createHash } from 'crypto';
import { readDataConDetalle } from '@/lib/data-service';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { toWhatsAppNumber } from '@/lib/commercial/contact';
import type { Presupuesto } from '@/types/presupuesto';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { AsistentePropuesta } from './propuestas-service';

export async function prepararMensajeDelPlan(propuesta: AsistentePropuesta): Promise<{ mensajeId?: string; resultado: string }> {
  if (await getReglaParaTarea('plan_multi_paso') === 'apagada') throw new Error('Los planes están apagados en Tus reglas.');
  const datos = propuesta.accion?.data;
  const tipo = datos?.planTipo;
  if (tipo === 'preparar_semana_fiesta') {
    return { resultado: 'Revisión interna aprobada. Las tareas y documentos siguen en la ficha; no se cambiaron fechas ni asignaciones.' };
  }
  if (tipo !== 'reunion_cliente' && tipo !== 'seguimiento_presupuestos') throw new Error('El tipo de plan no es válido.');
  if (tipo === 'seguimiento_presupuestos' && await getReglaParaTarea('perseguidor_presupuestos') === 'apagada') {
    throw new Error('El seguimiento está apagado; no se preparó ningún mensaje.');
  }
  const borrador = datos?.borrador;
  if (!borrador || typeof borrador.texto !== 'string' || !borrador.texto.trim() || borrador.texto.length > 4000
    || typeof borrador.presupuestoId !== 'string' || typeof borrador.telefono !== 'string' || !toWhatsAppNumber(borrador.telefono)) {
    throw new Error('Falta el contacto o el borrador del plan. Pedí prepararlo de nuevo con los datos completos.');
  }
  const { valor: presupuestos, huboFalla } = await readDataConDetalle<Presupuesto[]>('presupuestos.json', []);
  if (huboFalla) throw new Error('No se pudo verificar el presupuesto; no se preparó el mensaje.');
  const presupuesto = presupuestos.find(p => p.id === borrador.presupuestoId);
  if (!presupuesto || toWhatsAppNumber(presupuesto.clienteContacto) !== toWhatsAppNumber(borrador.telefono)) {
    throw new Error('El contacto del presupuesto cambió. Revisá el plan antes de continuar.');
  }
  if (tipo === 'seguimiento_presupuestos' && presupuesto.estado !== 'Enviado') {
    throw new Error('El presupuesto ya no está Enviado. No corresponde preparar este seguimiento.');
  }
  if (tipo === 'reunion_cliente') {
    const fiestas = await readDataConDetalle<FiestaEnPlanificacion[]>('fiestas.json', []);
    if (fiestas.huboFalla || !fiestas.valor.some(f => f.id === propuesta.fiestaId && f.presupuestoId === presupuesto.id)) {
      throw new Error('No se pudo corroborar la fiesta y su presupuesto; prepará el plan de nuevo.');
    }
  }
  const id = `plan_mensaje_${createHash('sha256').update(propuesta.id).digest('hex')}`;
  const resultado = await saveScheduledMessage({
    channel: 'whatsapp', targetType: tipo === 'reunion_cliente' ? 'cliente' : 'prospecto',
    targetId: presupuesto.id, targetPhone: presupuesto.clienteContacto!, targetName: presupuesto.clienteNombre,
    templateType: 'personalizado', messageText: borrador.texto.trim(),
    scheduledAt: new Date().toISOString(), status: 'pendiente', sendingMode: 'manual_click',
    presupuestoId: presupuesto.id,
  }, WHATSAPP_AUTOMATION_INTERNAL_TOKEN, { idEstable: id });
  if (!resultado.success || !resultado.message?.id) throw new Error(resultado.error || 'El mensaje no quedó confirmado en la bandeja.');
  return { mensajeId: resultado.message.id, resultado: 'Mensaje preparado en la bandeja para envío manual. No se envió ni se agendó una reunión; el horario candidato requiere confirmación.' };
}
