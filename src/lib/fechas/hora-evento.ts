/**
 * Devuelve la hora de inicio configurada del evento o 'a confirmar'.
 * Nunca extrae la hora de una fecha ISO guardada en UTC (ej: 'T03:00:00Z').
 */
export function horaEventoOConfirmar(eventoHoraInicio?: string | null): string {
  const limpia = typeof eventoHoraInicio === 'string' ? eventoHoraInicio.trim() : '';
  return limpia || 'a confirmar';
}
