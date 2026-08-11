import type { Trago } from '@/types/fiesta';
import type { BarDrinkOrderStatus } from '@/types/barra-tecnologica';
import type { BarTechnologySettings } from '@/types/barra-tecnologica';

type DrinkMarketingFields = Pick<Trago, 'nombre' | 'ingredientes' | 'descripcion' | 'description' | 'videoUrl'>;

const BAR_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const BAR_ORDER_TRANSITIONS: Record<BarDrinkOrderStatus, BarDrinkOrderStatus[]> = {
  nuevo: ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo: ['entregado'],
  entregado: [],
  cancelado: [],
};

export function isValidBarOrderTransition(
  previousStatus: BarDrinkOrderStatus,
  nextStatus: BarDrinkOrderStatus,
): boolean {
  return previousStatus === nextStatus || BAR_ORDER_TRANSITIONS[previousStatus].includes(nextStatus);
}

/**
 * El stock se descuenta al CREAR el pedido, que es cuando se abre la botella, y
 * no se vuelve a tocar al entregarlo. Lo unico que queda por resolver en los
 * cambios de estado es la vuelta atras: si el pedido se cancela sin haberse
 * servido, la bebida vuelve al stock.
 */
export function shouldRestoreBarStock(
  previousStatus: BarDrinkOrderStatus,
  nextStatus: BarDrinkOrderStatus,
): boolean {
  return nextStatus === 'cancelado' && previousStatus !== 'cancelado' && previousStatus !== 'entregado';
}

export function getDrinkDescription(drink: DrinkMarketingFields): string {
  const customDescription = (drink.descripcion || drink.description || '').trim();
  if (customDescription) return customDescription;

  const ingredients = drink.ingredientes?.filter(Boolean) || [];
  if (ingredients.length) {
    return `${drink.nombre} combina ${ingredients.join(', ')} en una propuesta pensada para elegir rapido desde la barra y disfrutar durante la fiesta.`;
  }

  return `${drink.nombre} esta disponible en la barra interactiva AK. Toca la tarjeta, confirma el pedido y el barman lo recibe al instante.`;
}

export function getDrinkTags(drink: DrinkMarketingFields): string[] {
  const text = `${drink.nombre} ${drink.ingredientes?.join(' ') || ''} ${drink.descripcion || drink.description || ''}`.toLowerCase();
  const tags = new Set<string>();

  if (text.includes('sin alcohol') || text.includes('mocktail') || text.includes('virgen')) tags.add('Sin alcohol');
  if (text.includes('limon') || text.includes('lima') || text.includes('citr')) tags.add('Citrico');
  if (text.includes('frut') || text.includes('durazno') || text.includes('anana') || text.includes('frutilla')) tags.add('Frutal');
  if (text.includes('sprite') || text.includes('coca') || text.includes('te') || text.includes('jugo')) tags.add('Refrescante');
  if (text.includes('granadina') || text.includes('azucar') || text.includes('dulce')) tags.add('Dulce');
  if (text.includes('ron') || text.includes('vodka') || text.includes('tequila') || text.includes('fernet')) tags.add('Con alcohol');

  if (!tags.size) tags.add('AK Bar');
  return Array.from(tags).slice(0, 4);
}

export function normalizeSocialHandle(handle?: string): string {
  const clean = String(handle || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .split(/[/?#]/)[0]
    .replace(/[^\w.]/g, '');
  return clean || 'akproducciones';
}

export function buildInstagramUrl(handle?: string): string {
  return `https://www.instagram.com/${normalizeSocialHandle(handle)}/`;
}

export function isTruthyFollowConfirmation(value: FormDataEntryValue | null): boolean {
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

export function normalizeBarTime(value?: string): string | undefined {
  const match = String(value || '').trim().match(BAR_TIME_PATTERN);
  if (!match) return undefined;
  return `${match[1]}:${match[2]}`;
}

export function getMontevideoMinutes(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Montevideo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === 'hour')?.value || '0') % 24;
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || '0');
  return hour * 60 + minute;
}

function timeToMinutes(time?: string): number | null {
  const normalized = normalizeBarTime(time);
  if (!normalized) return null;
  const [hour, minute] = normalized.split(':').map(Number);
  return hour * 60 + minute;
}

export function getBarScheduleError(
  settings: Pick<BarTechnologySettings, 'openingTime' | 'closingTime'>,
  nowMinutes = getMontevideoMinutes(),
): string | null {
  const openingTime = normalizeBarTime(settings.openingTime);
  const closingTime = normalizeBarTime(settings.closingTime);
  const openingMinutes = timeToMinutes(openingTime);
  const closingMinutes = timeToMinutes(closingTime);

  if (openingMinutes === null && closingMinutes === null) return null;

  if (openingMinutes !== null && closingMinutes !== null) {
    if (openingMinutes === closingMinutes) return null;

    const isSameDayWindow = openingMinutes < closingMinutes;
    const isOpen = isSameDayWindow
      ? nowMinutes >= openingMinutes && nowMinutes <= closingMinutes
      : nowMinutes >= openingMinutes || nowMinutes <= closingMinutes;

    if (isOpen) return null;
    if (nowMinutes < openingMinutes) return `La barra abre a las ${openingTime} hs.`;
    return 'La barra esta cerrada por hoy.';
  }

  if (openingMinutes !== null && nowMinutes < openingMinutes) {
    return `La barra abre a las ${openingTime} hs.`;
  }

  if (closingMinutes !== null && nowMinutes > closingMinutes) {
    return 'La barra esta cerrada por hoy.';
  }

  return null;
}
