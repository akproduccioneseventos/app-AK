/**
 * LADO SERVIDOR DE LA IDENTIDAD DEL INTENTO (pregunta 58 de COMO-AUDITAR.md, 13 de octubre de 2026).
 *
 * La pantalla manda el id que armó `obtenerIntento` (src/lib/intento-de-guardado.ts). Acá se valida
 * y se convierte en el id del registro: si la respuesta se perdió y la persona reintenta, el
 * registro YA existe con ese id y la acción devuelve ese mismo en vez de crear otro.
 * Sin id (o con uno inválido) devuelve undefined y la acción sigue como siempre.
 */
const FORMATO_VALIDO = /^[a-zA-Z0-9_-]{8,80}$/;

export function idDelIntento(prefijo: string, crudo: unknown): string | undefined {
  if (typeof crudo !== 'string' || !FORMATO_VALIDO.test(crudo)) return undefined;
  return `${prefijo}_${crudo}`;
}

export type OpcionesDeIntento = { idIntento?: string };

/** La base rechazo crear un id que ya existe (dos intentos casi a la vez). */
export function esIdYaExistente(error: unknown): boolean {
  const e = error as { code?: unknown; message?: unknown } | null;
  return e?.code === 6 || /already.?exists|ya existe/i.test(String(e?.message ?? ''));
}
