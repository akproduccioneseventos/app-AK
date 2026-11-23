/**
 * El código corto de una fiesta, SIN escribir nada (auditoría 23/11/2026): si la fiesta tiene uno guardado, ése;
 * si no, uno fijo que sale de su número interno, así que es siempre el mismo para la misma fiesta. Antes, mirar la
 * lista de fiestas inventaba y guardaba códigos uno por uno: con el perfil de auditor cada lectura reintentaba todas
 * las escrituras y la lista no llegaba a cargar. Sin dependencias del servidor: lo usan también las pantallas.
 */
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LONGITUD = 6;

export function codigoDeFiesta(fiesta: { id?: string | null; codigoFiesta?: string | null } | null | undefined): string {
  const guardado = String(fiesta?.codigoFiesta || '').trim().toUpperCase();
  if (guardado) return guardado;
  const id = String(fiesta?.id || '');
  if (!id) return '';
  let codigo = '';
  for (let i = 0; i < LONGITUD; i++) {
    // FNV-1a con una semilla distinta por letra: siempre da lo mismo para el mismo número de fiesta.
    let h = (2166136261 ^ (i * 16777619)) >>> 0;
    const texto = `codigo-fiesta|${i}|${id}`;
    for (let j = 0; j < texto.length; j++) {
      h ^= texto.charCodeAt(j);
      h = Math.imul(h, 16777619) >>> 0;
    }
    codigo += ALFABETO[h % ALFABETO.length];
  }
  return codigo;
}
