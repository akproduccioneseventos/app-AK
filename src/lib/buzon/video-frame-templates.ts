export const BUZON_FRAME_TEMPLATE_IDS = [
  'default',
  'neon',
  'elegante',
  'cumple-infantil',
  'quince',
  'vintage',
  'glamour',
  'floral',
  'urbano',
  'minimalista',
] as const;

export type FrameTemplateId = typeof BUZON_FRAME_TEMPLATE_IDS[number];

export interface FrameOption {
  id: FrameTemplateId;
  label: string;
  description: string;
  badge: string;
}

export const FRAME_TEMPLATES: FrameOption[] = [
  { id: 'default', label: 'Sin Marco', description: 'Video limpio sin bordes ni overlays.', badge: 'Standard' },
  { id: 'neon', label: 'Neón Party', description: 'Efecto cyber neón fucsia y cian con resplandor.', badge: 'Popular' },
  { id: 'elegante', label: 'Boda Elegante', description: 'Borde dorado metálico con esquinas ornamentadas.', badge: 'Premium' },
  { id: 'quince', label: 'Mis 15', description: 'Corona brillante rosa glamour con filigranas.', badge: 'Fav' },
  { id: 'cumple-infantil', label: 'Cumple Infantil', description: 'Borde festivo multicolor con globos y estrellitas.', badge: 'Fun' },
  { id: 'vintage', label: 'Retro Vintage', description: 'Cinta de película 35mm con código VHS.', badge: 'Retro' },
  { id: 'glamour', label: 'VIP Glamour', description: 'Alfombra roja con luces de estudio de cine.', badge: 'VIP' },
  { id: 'floral', label: 'Romántico Floral', description: 'Marco botánico en tonos pasteles y esmeralda.', badge: 'Chic' },
  { id: 'urbano', label: 'Urbano Trap', description: 'Estilo callejero oscuro con bordes industriales.', badge: 'New' },
  { id: 'minimalista', label: 'Minimalista Blanco', description: 'Borde paspartú blanco tipo galería de arte.', badge: 'Clean' },
];

export function isFrameTemplateId(value: unknown): value is FrameTemplateId {
  return BUZON_FRAME_TEMPLATE_IDS.includes(value as FrameTemplateId);
}

export function normalizeFrameTemplateId(value: unknown): FrameTemplateId {
  return isFrameTemplateId(value) ? value : 'default';
}
