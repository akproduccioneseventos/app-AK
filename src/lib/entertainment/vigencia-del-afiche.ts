/**
 * Cuánto dura el permiso del QR del afiche impreso (28/09/2026).
 *
 * El afiche se imprime días antes de la fiesta, así que el permiso de 18 horas de las estaciones
 * no le sirve: el día de la fiesta ya estaría vencido y el invitado sólo podría mirar. Decisión del
 * dueño: vale **hasta que termina el día siguiente a la fiesta**, en hora de Uruguay. Las fotos
 * igual pasan por la moderación del muro.
 *
 * Devuelve los segundos que faltan, o 0 si ya venció o la fecha no se entiende.
 */
export function segundosDelPermisoDelAfiche(fechaEvento: string | undefined, ahora: Date = new Date()): number {
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaEvento || '');
  if (!partes) return 0;
  const [, y, m, d] = partes.map(Number);
  // Fin del día siguiente en Uruguay (UTC-3) = comienzo del día +2 a las 03:00 UTC.
  const vence = Date.UTC(y, m - 1, d + 2, 3, 0, 0);
  const segundos = Math.floor((vence - ahora.getTime()) / 1000);
  return segundos > 0 ? segundos : 0;
}
