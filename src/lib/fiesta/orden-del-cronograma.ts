/**
 * Ordena los momentos de la noche desde el inicio del evento, no como texto.
 * "01:00" (torta después de medianoche) va DESPUÉS de "18:00" (llegada) si la fiesta empieza a las 18.
 * Auditoría 18/11/2026, A18-06 (orden 320, bloque 2).
 */
function minutosDelDia(hora: string | undefined | null): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec((hora || '').trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function ordenarPorHoraDelEvento<T extends { hora?: string | null }>(
  items: readonly T[],
  horaInicio?: string | null,
): T[] {
  const conHora = items.map((item) => minutosDelDia(item.hora)).filter((m): m is number => m !== null);
  const inicio = minutosDelDia(horaInicio) ?? (conHora.length ? Math.min(...conHora) : 0);
  const clave = (item: T) => {
    const m = minutosDelDia(item.hora);
    // Sin hora, al final y en el orden en que se cargó.
    return m === null ? Number.POSITIVE_INFINITY : (m - inicio + 1440) % 1440;
  };
  return items
    .map((item, i) => ({ item, i, k: clave(item) }))
    .sort((a, b) => a.k - b.k || a.i - b.i)
    .map(({ item }) => item);
}
