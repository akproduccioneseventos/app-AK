import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { EntertainmentModuleId } from '@/lib/entertainment/station-config';

const PERSONAL_STATIONS = new Set<EntertainmentModuleId>([
  'fotocabina',
  'plataforma360',
  'bogue',
  'espejoMagicoFoto',
  'espejoMagicoFirma',
  'espejoMagicoIA',
]);

export function isGuestEntertainmentAvailable(
  fiesta: FiestaEnPlanificacion,
  moduleId: EntertainmentModuleId,
): boolean {
  const storedStation = fiesta.others?.entretenimiento?.modules?.[moduleId];

  if (moduleId === 'capsulaTiempo') {
    return fiesta.modulosContratados?.buzon === true && storedStation?.enabled !== false;
  }

  if (!PERSONAL_STATIONS.has(moduleId)) return false;

  return fiesta.modulosContratados?.entretenimiento === true
    && storedStation?.enabled === true;
}
