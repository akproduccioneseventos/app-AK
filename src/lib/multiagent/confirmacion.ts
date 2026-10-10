/**
 * "Sí" como palabra suelta, no como pedazo de otra: "visita" o "sistema" confirmaban solos una
 * reunión en el calendario o un mail preparado.
 */
export function esUnSi(mensaje: string): boolean {
  return /(^|[^a-záéíóúñü])(s[ií]|dale|confirmo|confirmado|ok|okay)([^a-záéíóúñü]|$)/i.test((mensaje || '').trim());
}
