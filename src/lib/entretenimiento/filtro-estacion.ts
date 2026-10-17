/**
 * Filtro unificado de estaciones de entretenimiento para Galería en Vivo, Álbum Digital y Kiosk.
 * Asegura que todas las fotos y videos se asocien y filtren correctamente sin perderse por diferencias
 * de camelCase o guiones bajos.
 */

export type PestanaEstacion =
  | 'todas'
  | 'cabina'
  | 'vogue'
  | '360'
  | 'espejo'
  | 'totem'
  | 'descartable'
  | 'webar';

export function normalizarModuloEstacion(sourceModule?: string | null): string {
  const mod = (sourceModule || '').toLowerCase().replace(/[-_\s]/g, '').trim();
  if (mod === 'fotocabina') return 'cabina';
  if (mod === 'bogue' || mod === 'vogue') return 'vogue';
  if (mod === 'plataforma360') return '360';
  if (mod.startsWith('espejomagico')) return 'espejo';
  if (mod === 'touchpix' || mod === 'totem' || mod === 'totems') return 'totem';
  if (mod === 'descartable' || mod === 'camaradescartable') return 'descartable';
  if (mod === 'webar' || mod === 'ar') return 'webar';
  return mod;
}

export function filtrarPorEstacion(
  sourceModule: string | null | undefined,
  pestana: PestanaEstacion = 'todas'
): boolean {
  if (pestana === 'todas') return true;
  const normalizado = normalizarModuloEstacion(sourceModule);
  return normalizado === pestana;
}
