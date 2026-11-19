import type { FiestaEnPlanificacion } from '@/types/fiesta';

export const STATION_IDS = [
  'fotocabina',
  'plataforma360',
  'bogue',
  'espejoMagicoFoto',
  'espejoMagicoFirma',
  'espejoMagicoIA',
  'totems',
  'capsulaTiempo',
] as const;

export type StationId = (typeof STATION_IDS)[number];

export function stationScore(station: any): number {
  if (!station) return 0;
  const checklist = Array.isArray(station.checklist) ? station.checklist : [];
  const checksDone = checklist.filter((item: any) => item?.done).length;
  const checksScore = checklist.length ? Math.round((checksDone / checklist.length) * 35) : 0;
  let score = checksScore;
  if (station.enabled) score += 15;
  if (station.status === 'listo' || station.status === 'en-vivo') score += 15;
  if (station.operatorName?.trim()) score += 10;
  if (station.location?.trim()) score += 10;
  if (station.overlayName?.trim()) score += 5;
  if (Array.isArray(station.deliveryChannels) && station.deliveryChannels.length >= 2) score += 10;
  return Math.min(100, score);
}

/**
 * Cálculo compartido de puesta a punto de estaciones de entretenimiento.
 * Tanto el Tablero de Control como la Configuración de Estaciones usan este mismo cálculo.
 */
export function calcularPuestaAPuntoEstaciones(
  fiesta?: FiestaEnPlanificacion | null,
  storedData?: any,
): { totalModulos: number; modulosActivos: number; overallScore: number; scoresPorModulo: Record<string, number> } {
  const modulesObj = storedData?.modules || fiesta?.others?.entretenimiento?.modules;
  const scoresPorModulo: Record<string, number> = {};
  let totalScore = 0;
  let modulosActivos = 0;

  for (const id of STATION_IDS) {
    let station = typeof modulesObj === 'object' && modulesObj !== null && !Array.isArray(modulesObj) ? modulesObj[id] : null;

    // Si no está guardado, calculamos con los defaults del sistema (checklist parcial y preparando)
    if (!station) {
      station = {
        id,
        enabled: true,
        status: 'preparando',
        operatorName: '',
        location: 'Salón Principal',
        overlayName: `${fiesta?.configuracion?.nombreEvento || 'Evento AK'} - Overlay AK`,
        deliveryChannels: ['qr', 'whatsapp', 'galeria'],
        checklist: [
          { id: 'c1', done: true },
          { id: 'c2', done: true },
          { id: 'c3', done: false },
          { id: 'c4', done: false },
          { id: 'c5', done: false },
        ],
      };
    }

    const isEnabled = station.enabled !== false;
    if (isEnabled) modulosActivos++;
    const s = stationScore(station);
    scoresPorModulo[id] = s;
    totalScore += s;
  }

  const overallScore = Math.round(totalScore / STATION_IDS.length);

  return {
    totalModulos: STATION_IDS.length,
    modulosActivos,
    overallScore,
    scoresPorModulo,
  };
}
