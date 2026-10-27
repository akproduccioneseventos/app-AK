/**
 * Un aviso interno "de plata" es el que habla de cobros, pagos, saldos, cuotas, facturas, señas o
 * trae un importe. Esos avisos los ve sólo quien tiene permiso de contabilidad, y nunca viajan con
 * su texto en el aviso al teléfono, porque ese aviso llega a TODOS los teléfonos del equipo
 * (sendPushNotificationToAll). Pregunta 102 del método (26/10/2026).
 */
const PALABRAS_DE_PLATA = /\$\s?\d|\buyu\b|\bpag[oóa]|\bcobr|\bsaldo|\bcuota|\bfactur|\bseña\b|\bsena\b|\bdeuda|\bimporte|\bmonto|\bsueldo|\bmercado ?pago/i;

export function esAvisoDePlata(aviso: { titulo?: string; mensaje?: string; href?: string }): boolean {
  return PALABRAS_DE_PLATA.test(`${aviso.titulo || ''} ${aviso.mensaje || ''} ${aviso.href || ''}`);
}

/** Lo que dice el aviso al teléfono: el texto real sólo si no es de plata. */
export function textoParaElTelefono(aviso: { titulo?: string; mensaje?: string; href?: string }): string {
  return esAvisoDePlata(aviso) ? 'Tenés un aviso nuevo en AK. Abrí la app para verlo.' : aviso.mensaje || '';
}
