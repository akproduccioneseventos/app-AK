/**
 * @fileOverview Regla de Oro: Qué puede hacer solo el Asistente y qué no.
 *
 * Tres puertas infranqueables:
 * - 'solo': Tareas propias, notas, consultas, borradores (con deshacer por 24h).
 * - 'pregunta': Todo lo que toca plata, cambios de invitados/servicios, fechas, mensajes externos.
 *               Queda como propuesta en la bandeja "Tu asistente". NUNCA se confirma por WhatsApp.
 * - 'nunca': Cobrar, marcar pagado, facturar, cerrar presupuestos, borrar fiestas/clientes, roles/permisos.
 *            Inmutable en el código.
 */

import { readData, writeData } from '@/lib/data-service';

export type NivelDeRiesgo = 'solo' | 'pregunta' | 'nunca';

export const ACCIONES_NUNCA: readonly string[] = [
  'cobrar',
  'registrar_cobro',
  'marcar_pagado',
  'marcar_como_pagado',
  'marcar_cuota_pagada',
  'pagar_cuota',
  'emitir_factura',
  'anular_factura',
  'facturar',
  'cerrar_presupuesto',
  'aceptar_presupuesto',
  'borrar_fiesta',
  'eliminar_fiesta',
  'borrar_cliente',
  'eliminar_cliente',
  'borrar_registro',
  'cambiar_permisos',
  'tocar_permisos',
  'alterar_roles',
  'modificar_permisos',
  'mandar_mensaje_directo',
  'enviar_mensaje_cliente_directo',
];

export const ACCIONES_SOLO: readonly string[] = [
  'anotar_tarea',
  'crear_tarea',
  'completar_tarea',
  'anotar_nota',
  'crear_nota',
  'anotar_recordatorio',
  'crear_recordatorio',
  'consultar_deuda',
  'cuanto_me_deben',
  'ver_mi_semana',
  'consultar_agenda',
  'buscar_en_la_web',
  'preparar_borrador',
  'preparar_borrador_mail',
  'preparar_borrador_whatsapp',
  'preparar_mail',
  'draft_budget',
  'consultar_clima',
];

export const ACCIONES_PREGUNTA_CONOCIDAS: readonly string[] = [
  'cargar_gasto',
  'registrar_gasto',
  'cambiar_precio',
  'modificar_monto',
  'cambiar_cuota',
  'cambiar_invitados',
  'agregar_invitados',
  'modificar_invitados',
  'cambiar_servicios',
  'agregar_servicio',
  'quitar_servicio',
  'cambiar_fecha',
  'reprogramar_evento',
  'agendar_con_cliente',
  'agendar_reunion',
  'mensaje_cliente',
  'mensaje_prospecto',
  'mensaje_proveedor',
  'pedir_precio_proveedor',
  'pedir_cotizacion',
];

export interface RegistroAccionAsistente {
  id: string;
  pedido: string;
  accion: string;
  canal: 'whatsapp' | 'audio' | 'voz_en_vivo' | 'app' | 'email';
  nivel: NivelDeRiesgo;
  resultado: string;
  usuarioIdentificado?: string;
  telefono?: string;
  deshacerDisponibleHasta?: string;
  deshecho?: boolean;
  timestamp: string;
}

const ACCIONES_LOG_FILE = 'asistente-acciones.json';

/**
 * Función pura que determina el nivel de riesgo de una acción.
 * Regla de Oro: Lo que no esté explícitamente en 'solo' o 'nunca' es 'pregunta'.
 */
export function nivelDeRiesgo(accion: string): NivelDeRiesgo {
  if (!accion || typeof accion !== 'string') {
    return 'pregunta';
  }

  const normalizada = accion.trim().toLowerCase().replace(/[-\s]/g, '_');

  // 1. Puerta NUNCA (Prohibición absoluta inmutable)
  for (const prohibida of ACCIONES_NUNCA) {
    if (normalizada === prohibida || normalizada.includes(prohibida)) {
      return 'nunca';
    }
  }

  // 2. Puerta SOLO (Lista blanca estricta de tareas seguras)
  for (const permitida of ACCIONES_SOLO) {
    if (normalizada === permitida) {
      return 'solo';
    }
  }

  // 3. Todo lo demás es PREGUNTA (Por defecto por seguridad)
  return 'pregunta';
}

/**
 * Evalúa si una respuesta por WhatsApp intenta confirmar una acción que toca dinero o fechas.
 * Si es así, bloquea la confirmación y exige acceder a la app con sesión.
 */
export function puedeConfirmarPorWhatsApp(accion: string): { permitido: boolean; mensaje: string; urlApp: string } {
  const riesgo = nivelDeRiesgo(accion);
  const urlApp = 'https://akproducciones.uy/asistente';

  if (riesgo === 'nunca') {
    return {
      permitido: false,
      mensaje: `⛔ Eso lo tenés que hacer vos desde la app: ${urlApp}`,
      urlApp,
    };
  }

  if (riesgo === 'pregunta') {
    return {
      permitido: false,
      mensaje: `⚠️ Por seguridad de la plata y las fechas, responder "sí" por WhatsApp no confirma la acción. Entrá a la app para revisarla y confirmarla con sesión: ${urlApp}`,
      urlApp,
    };
  }

  return {
    permitido: true,
    mensaje: '✅ Acción confirmada. Podés deshacerla dentro de las próximas 24 horas desde la app.',
    urlApp,
  };
}

/**
 * Registra cada acción solicitada en el log de auditoría.
 */
export async function registrarAccionAsistente(registro: Omit<RegistroAccionAsistente, 'id' | 'timestamp'>): Promise<RegistroAccionAsistente> {
  const ahora = new Date();
  const completo: RegistroAccionAsistente = {
    ...registro,
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: ahora.toISOString(),
    deshacerDisponibleHasta: registro.nivel === 'solo'
      ? new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString()
      : undefined,
  };

  try {
    const logs = await readData<RegistroAccionAsistente[]>(ACCIONES_LOG_FILE, []);
    logs.unshift(completo);
    // Conservar últimos 200 logs
    const limitados = logs.slice(0, 200);
    await writeData(ACCIONES_LOG_FILE, limitados, undefined, { skipAutoBackup: true });
  } catch (err) {
    console.warn('[GuardiánPlata] Error guardando registro de acción:', err);
  }

  return completo;
}
