/**
 * @fileOverview El Guardián de la Plata — Seguridad estricta para el Asistente AI de AK Producciones.
 *
 * Clasifica cualquier comando de voz, WhatsApp o chat en 3 puertas infranqueables:
 * - Puerta 1: Lo hace solo, con botón de deshacer durante 24 horas.
 * - Puerta 2: Te lo deja para confirmar dentro de la app (plata, fechas, mensajes). Contestar "sí" por WhatsApp NO alcanza.
 * - Puerta 3: Nunca lo hace (cobros, facturación, cierres, borrados, permisos). Inmutable.
 */

export type TipoPuerta = 1 | 2 | 3;

export const ACCIONES_PUERTA_1 = [
  'anotar_tarea',
  'anotar_nota',
  'anotar_recordatorio',
  'responder_consulta',
  'preparar_borrador_presupuesto',
  'preparar_borrador_mail',
  'preparar_borrador_whatsapp',
] as const;

export const ACCIONES_PUERTA_2 = [
  'cargar_gasto',
  'comprar_insumo',
  'cambiar_invitados',
  'cambiar_fecha_evento',
  'cambiar_servicio',
  'cambiar_precio',
  'enviar_mensaje_cliente',
  'enviar_mensaje_proveedor',
  'pedir_cotizaciones_proveedores',
] as const;

export const ACCIONES_PUERTA_3_PROHIBIDAS = [
  'cobrar',
  'marcar_pagado',
  'emitir_factura',
  'cerrar_presupuesto',
  'borrar_registro',
  'borrar_fiesta',
  'borrar_cliente',
  'modificar_permisos',
  'alterar_roles',
] as const;

export interface ResultadoGuardian {
  puerta: TipoPuerta;
  autorizado: boolean;
  requiereApp: boolean;
  explicacionCriolla: string;
  urlConfirmacion?: string;
}

export interface RegistroDeshacer {
  id: string;
  accion: string;
  descripcion: string;
  timestamp: string;
  expiraEn: string;
  datosReversion: Record<string, any>;
  deshecho: boolean;
}

export function clasificarAccion(tipoAccion: string, propuestaId?: string): ResultadoGuardian {
  const normalizado = tipoAccion.trim().toLowerCase();

  // Puerta 3: Prohibición absoluta
  if (ACCIONES_PUERTA_3_PROHIBIDAS.some((p) => normalizado.includes(p))) {
    return {
      puerta: 3,
      autorizado: false,
      requiereApp: false,
      explicacionCriolla:
        'Por seguridad estricta, la IA tiene prohibido cobrar, marcar pagos, facturar, cerrar presupuestos o tocar permisos. Hacelo a mano desde la app.',
    };
  }

  // Puerta 2: Confirmación obligatoria dentro de la app
  if (ACCIONES_PUERTA_2.some((p) => normalizado.includes(p))) {
    const url = propuestaId ? `/asistente?propuestaId=${encodeURIComponent(propuestaId)}` : '/asistente';
    return {
      puerta: 2,
      autorizado: false,
      requiereApp: true,
      explicacionCriolla:
        'Esto toca plata, fechas o contactos externos. No se puede confirmar por WhatsApp; tenés que entrar a la app para confirmarlo.',
      urlConfirmacion: url,
    };
  }

  // Puerta 1: Lo hace solo con deshacer
  return {
    puerta: 1,
    autorizado: true,
    requiereApp: false,
    explicacionCriolla: 'Acción ejecutada automáticamente. Tenés 24 horas para deshacerla si te equivocaste.',
  };
}

/**
 * Cuando el usuario manda "sí" por WhatsApp a una propuesta que toca plata o fechas,
 * el guardián frena la confirmación y le manda el link directo para que entre a la app.
 */
export function responderConfirmacionWhatsApp(propuestaId: string, tipoAccion: string): { puedeConfirmar: boolean; mensaje: string } {
  const evaluacion = clasificarAccion(tipoAccion, propuestaId);
  if (evaluacion.puerta === 2) {
    return {
      puedeConfirmar: false,
      mensaje: `⚠️ Por seguridad de la plata y las fechas, responder "sí" por WhatsApp no confirma la acción. Entrá a la app para revisarla y confirmarla con un toque: https://akproducciones.uy/asistente?propuestaId=${encodeURIComponent(propuestaId)}`,
    };
  }
  if (evaluacion.puerta === 3) {
    return {
      puedeConfirmar: false,
      mensaje: '⛔ Acción no permitida: la IA nunca puede cobrar, facturar ni cerrar presupuestos.',
    };
  }
  return {
    puedeConfirmar: true,
    mensaje: '✅ Listo, quedó hecho. Podés deshacerlo durante las próximas 24 horas desde la app.',
  };
}
