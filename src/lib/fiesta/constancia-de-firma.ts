import type { FiestaEnPlanificacion } from '@/types/fiesta';

/**
 * La constancia de la firma digital la escribe SÓLO `signContractDigitally`. El guardado general
 * (entero o parcial, del portal o del equipo) la deja como está guardada: antes el cliente
 * la podía reemplazar con otro nombre y otra fecha desde el guardado parcial (Codex 240, C2).
 */
export function conLaConstanciaGuardada(
  data: FiestaEnPlanificacion,
  stored: FiestaEnPlanificacion | null,
): FiestaEnPlanificacion {
  const copia = { ...data };
  if (stored?.firmaDigitalConstancia) copia.firmaDigitalConstancia = stored.firmaDigitalConstancia;
  else delete copia.firmaDigitalConstancia;
  return copia;
}
