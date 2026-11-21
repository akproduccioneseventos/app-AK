export const MOMENTOS_GALERIA = [
  'Todos',
  'Entrada',
  'Vals',
  'Torta',
  'Fiesta',
  'Exterior',
] as const;

export type MomentoGaleria = (typeof MOMENTOS_GALERIA)[number];
export type MomentoFoto = Exclude<MomentoGaleria, 'Todos'>;

function normalizarTextoMomento(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza el `momentTag` de una foto a uno de los momentos oficiales de la galería.
 * Si no tiene momento o no coincide con otro específico, cae en `'Fiesta'`.
 */
export function normalizarMomentoPost(momentTag?: string | null): MomentoFoto {
  const norm = normalizarTextoMomento(momentTag || '');
  if (!norm) return 'Fiesta';

  if (
    norm === 'entrada' ||
    norm.includes('entrada') ||
    norm.includes('ingreso') ||
    norm.includes('recepcion') ||
    norm.includes('llegada')
  ) {
    return 'Entrada';
  }
  if (norm === 'vals' || norm.includes('vals')) {
    return 'Vals';
  }
  if (
    norm === 'torta' ||
    norm.includes('torta') ||
    norm.includes('pastel') ||
    norm.includes('mesa dulce')
  ) {
    return 'Torta';
  }
  if (
    norm === 'exterior' ||
    norm.includes('exterior') ||
    norm.includes('jardin') ||
    norm.includes('parque') ||
    norm.includes('aire libre') ||
    norm.includes('sesion')
  ) {
    return 'Exterior';
  }
  return 'Fiesta';
}

export function filtrarPostsPorMomento<T extends { momentTag?: string | null }>(
  posts: readonly T[],
  momento: MomentoGaleria,
): T[] {
  if (momento === 'Todos') return [...posts];
  return posts.filter((post) => normalizarMomentoPost(post.momentTag) === momento);
}
