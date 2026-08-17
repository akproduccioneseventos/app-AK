export type CommercialSource =
  | 'direct'
  | 'landing'
  | 'landing_bodas'
  | 'landing_xv'
  | 'landing_eventos'
  | 'guest_portal'
  | 'campaign'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'portal_led'
  | 'social_guest';

export type CommercialSimulatorMode = 'assistant' | 'visual';

export interface CommercialAttribution {
  source: CommercialSource;
  campaign?: string;
  refFiestaId?: string;
  refGuestId?: string;
  entryPath?: string;
  simulatorMode?: CommercialSimulatorMode;
}

type SearchParamsReader = {
  get(name: string): string | null;
};

type SearchParamsRecord = Record<string, string | string[] | undefined>;

const VALID_SOURCES = new Set<CommercialSource>([
  'direct',
  'landing',
  'landing_bodas',
  'landing_xv',
  'landing_eventos',
  'guest_portal',
  'campaign',
  'instagram',
  'facebook',
  'youtube',
  'whatsapp',
  'portal_led',
  'social_guest',
]);

function cleanValue(value: string | null | undefined, maxLength: number): string | undefined {
  const cleaned = value?.trim().replace(/[^\p{L}\p{N}\-_.:/ ]/gu, '').slice(0, maxLength);
  return cleaned || undefined;
}

function normalizeSource(value: string | null | undefined, fallback: CommercialSource): CommercialSource {
  const normalized = value?.trim().toLowerCase().replace(/-/g, '_') as CommercialSource | undefined;
  return normalized && VALID_SOURCES.has(normalized) ? normalized : fallback;
}

function firstRecordValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function sanitizeCommercialAttribution(
  input?: Partial<CommercialAttribution> | null,
  fallbackSource: CommercialSource = 'direct'
): CommercialAttribution {
  const simulatorMode = input?.simulatorMode === 'assistant' || input?.simulatorMode === 'visual'
    ? input.simulatorMode
    : undefined;

  return {
    source: normalizeSource(input?.source, fallbackSource),
    campaign: cleanValue(input?.campaign, 80),
    refFiestaId: cleanValue(input?.refFiestaId, 100),
    refGuestId: cleanValue(input?.refGuestId, 100),
    entryPath: cleanValue(input?.entryPath, 160),
    simulatorMode,
  };
}

export function commercialAttributionFromSearchParams(
  params: SearchParamsReader,
  fallbackSource: CommercialSource = 'direct'
): CommercialAttribution {
  return sanitizeCommercialAttribution({
    source: normalizeSource(params.get('source'), fallbackSource),
    campaign: params.get('campaign') || undefined,
    refFiestaId: params.get('refFiesta') || undefined,
    refGuestId: params.get('refGuest') || undefined,
    entryPath: params.get('entry') || undefined,
  }, fallbackSource);
}

export function commercialAttributionFromRecord(
  params: SearchParamsRecord | undefined,
  fallbackSource: CommercialSource = 'direct'
): CommercialAttribution {
  return sanitizeCommercialAttribution({
    source: normalizeSource(firstRecordValue(params?.source), fallbackSource),
    campaign: firstRecordValue(params?.campaign),
    refFiestaId: firstRecordValue(params?.refFiesta),
    refGuestId: firstRecordValue(params?.refGuest),
    entryPath: firstRecordValue(params?.entry),
  }, fallbackSource);
}

export function appendCommercialAttribution(
  href: string,
  attribution: Partial<CommercialAttribution>
): string {
  const sanitized = sanitizeCommercialAttribution(attribution, 'direct');
  const isAbsolute = /^https?:\/\//i.test(href);
  const url = new URL(href, 'https://ak.local');

  url.searchParams.set('source', sanitized.source);
  if (sanitized.campaign) url.searchParams.set('campaign', sanitized.campaign);
  if (sanitized.refFiestaId) url.searchParams.set('refFiesta', sanitized.refFiestaId);
  if (sanitized.refGuestId) url.searchParams.set('refGuest', sanitized.refGuestId);
  if (sanitized.entryPath) url.searchParams.set('entry', sanitized.entryPath);

  return isAbsolute ? url.toString() : `${url.pathname}${url.search}${url.hash}`;
}

export function describeCommercialSource(attribution?: Partial<CommercialAttribution> | null): string {
  const source = sanitizeCommercialAttribution(attribution, 'direct').source;
  const labels: Record<CommercialSource, string> = {
    direct: 'Acceso directo',
    landing: 'Landing principal',
    landing_bodas: 'Landing de bodas',
    landing_xv: 'Landing de XV anos',
    landing_eventos: 'Landing de eventos',
    guest_portal: 'Experiencia de invitado',
    campaign: 'Campana publicitaria',
    instagram: 'Instagram',
    facebook: 'Facebook',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
    portal_led: 'Portal LED',
  };
  return labels[source];
}
