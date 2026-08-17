import type { SocialGalleryPost, SongRequest } from '@/types/social-gallery';
import type { BarDrinkOrder } from '@/types/barra-tecnologica';
import type { Invitado } from '@/types/fiesta';

export interface ActivityThermometerResult {
  currentRatePerMin: number; // Actividad últimos 10 min
  baselineRatePerMin: number; // Actividad promedio últimos 40 min
  trend: 'subiendo' | 'estable' | 'bajando' | 'fria';
  shouldShowAlert: boolean;
  alertMessage?: string;
  totalRecentEvents: number;
}

const STORAGE_LAST_ALERT_KEY = 'ak_termometro_last_alert_';
const ALERT_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutos de silencio obligatorio

/**
 * Calcula el pulso y la intensidad de la fiesta sumando señales reales con timestamp.
 */
export function calculatePartyActivityThermometer(
  fiestaId: string,
  data: {
    posts?: SocialGalleryPost[];
    orders?: BarDrinkOrder[];
    songRequests?: SongRequest[];
    invitados?: Invitado[];
  },
  nowDate = new Date()
): ActivityThermometerResult {
  const now = nowDate.getTime();
  const TEN_MIN_MS = 10 * 60 * 1000;
  const FORTY_MIN_MS = 40 * 60 * 1000;

  const timestamps: number[] = [];

  // 1. Fotos al muro
  (data.posts || []).forEach((p) => {
    if (p.timestamp) {
      const t = new Date(p.timestamp).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
  });

  // 2. Pedidos de la barra
  (data.orders || []).forEach((o) => {
    if (o.createdAt) {
      const t = new Date(o.createdAt).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
  });

  // 3. Canciones pedidas
  (data.songRequests || []).forEach((s) => {
    if (s.timestamp) {
      const t = new Date(s.timestamp).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
  });

  // 4. Llegada de invitados
  (data.invitados || []).forEach((i) => {
    if (i.checkInTimestamp) {
      const t = new Date(i.checkInTimestamp).getTime();
      if (!isNaN(t)) timestamps.push(t);
    }
  });

  // Conteo en ventanas
  const eventsInLast10Min = timestamps.filter((t) => now - t <= TEN_MIN_MS).length;
  const eventsInLast40Min = timestamps.filter((t) => now - t <= FORTY_MIN_MS).length;

  const currentRate = eventsInLast10Min / 10; // eventos por min en los ultimos 10m
  const baselineRate = (eventsInLast40Min - eventsInLast10Min) / 30; // eventos por min en los 30m anteriores

  let trend: ActivityThermometerResult['trend'] = 'estable';
  if (currentRate > baselineRate * 1.3) {
    trend = 'subiendo';
  } else if (currentRate < baselineRate * 0.5 && baselineRate >= 0.3) {
    trend = 'bajando';
  } else if (currentRate <= 0.1 && eventsInLast40Min > 5) {
    trend = 'fria';
  }

  // Verificar si amerita alerta y si se respeta el cooldown de 20 minutos
  let shouldShowAlert = false;
  let alertMessage: string | undefined;

  if (trend === 'bajando' || trend === 'fria') {
    if (typeof window !== 'undefined') {
      try {
        const lastAlertStr = localStorage.getItem(`${STORAGE_LAST_ALERT_KEY}${fiestaId}`);
        const lastAlertTime = lastAlertStr ? parseInt(lastAlertStr, 10) : 0;
        if (now - lastAlertTime > ALERT_COOLDOWN_MS) {
          shouldShowAlert = true;
          alertMessage = 'Bajó el movimiento en los últimos 10 minutos. Es momento de la tanda fuerte.';
        }
      } catch {
        shouldShowAlert = false;
      }
    }
  }

  return {
    currentRatePerMin: currentRate,
    baselineRatePerMin: baselineRate,
    trend,
    shouldShowAlert,
    alertMessage,
    totalRecentEvents: eventsInLast10Min,
  };
}

/**
 * Registra que se mostró o descartó la alerta para bloquear spam por 20 minutos.
 */
export function recordThermometerAlertAcknowledged(fiestaId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_LAST_ALERT_KEY}${fiestaId}`, Date.now().toString());
  } catch {
    // ignore
  }
}
