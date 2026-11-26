/**
 * "Sí" como palabra suelta, no como pedazo de otra: "visita" o "sistema" confirmaban solos una
 * reunión en el calendario o un mail preparado.
 */
export function esUnSi(mensaje: string): boolean {
  return /(^|[^a-záéíóúñü])(s[ií]|dale|confirmo|confirmado|ok|okay)([^a-záéíóúñü]|$)/i.test((mensaje || '').trim());
}

/**
 * Confirmación explícita real: el mensaje entero (con signos opcionales) es un "sí",
 * evitando confirmar automáticamente pedidos que dicen "si puede ser a las 10".
 */
export function esConfirmacionSola(mensaje: string): boolean {
  return /^[\s¡!¿?"'.,]*(s[ií]|dale|confirmo|confirmado|ok|okay|de acuerdo)[\s.!?"']*$/i.test((mensaje || '').trim());
}
