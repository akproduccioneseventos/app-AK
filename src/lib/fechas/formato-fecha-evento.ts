/**
 * Formatea la fecha de un evento respetando el día del calendario local
 * sin desfasaje por zona horaria de Greenwich/UTC.
 *
 * Ejemplo: "2026-09-30" se muestra siempre como "30 de septiembre de 2026",
 * nunca como el día anterior (Orden 68 - Bloque 1).
 */
export function formatearFechaEvento(dateString?: string): string {
  if (!dateString) return 'Fecha no definida';
  try {
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day).toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    const fecha = new Date(dateString);
    if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';
    return fecha.toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Fecha inválida';
  }
}
