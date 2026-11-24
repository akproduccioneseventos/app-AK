/**
 * Elige UN registro por el nombre buscado: exige al menos 3 caracteres (vacío no coincide con todos)
 * y exige una sola coincidencia (primero exacta; si no hay, única coincidencia parcial).
 */
export function unoSoloPorNombre<T>(
  lista: T[],
  nombresDe: (item: T) => Array<string | undefined>,
  buscado?: string,
): T | undefined {
  const quiero = (buscado || '').trim().toLowerCase();
  if (quiero.length < 3) return undefined;
  const exactos = lista.filter((item) =>
    nombresDe(item).some((n) => (n || '').trim().toLowerCase() === quiero),
  );
  if (exactos.length === 1) return exactos[0];
  if (exactos.length > 1) return undefined;
  const parecidos = lista.filter((item) =>
    nombresDe(item).some((n) => (n || '').toLowerCase().includes(quiero)),
  );
  return parecidos.length === 1 ? parecidos[0] : undefined;
}
