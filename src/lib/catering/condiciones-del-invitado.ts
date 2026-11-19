import type { DietaryRestriction } from '@/types/fiesta';

/**
 * Todas las condiciones alimentarias de un invitado, sin perder ninguna.
 *
 * El alta rápida marca celíaco con `isCeliac` y deja la restricción en "Ninguna"; la pantalla de alergias y la copia para
 * cocina sólo miraban la restricción: un celíaco contaba en el contador y no estaba en el reporte, y uno "Vegano + celíaco"
 * salía sólo vegano (auditoría del 18/11/2026, R18-01).
 */
export function condicionesDelInvitado(invitado: { dietaryRestriction?: DietaryRestriction | null; isCeliac?: boolean | null }): DietaryRestriction[] {
  const condiciones: DietaryRestriction[] = [];
  const principal = invitado.dietaryRestriction;
  if (principal && principal !== 'Ninguna') condiciones.push(principal);
  if (invitado.isCeliac && !condiciones.includes('Celiaco')) condiciones.push('Celiaco');
  return condiciones;
}

export function tieneCondicionAlimentaria(invitado: { dietaryRestriction?: DietaryRestriction | null; isCeliac?: boolean | null }): boolean {
  return condicionesDelInvitado(invitado).length > 0;
}
