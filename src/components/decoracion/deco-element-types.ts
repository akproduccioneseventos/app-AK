import type { ElementoDecorativo } from '@/types/fiesta';

export type TipoElemento = ElementoDecorativo['tipo'];

export const TIPOS_ELEMENTOS: { tipo: TipoElemento; emoji: string; label: string; maxColores: number }[] = [
  { tipo: 'panelCircular', emoji: '⭕', label: 'Panel Circular', maxColores: 2 },
  { tipo: 'arcoRomano', emoji: '🏛️', label: 'Arco Romano', maxColores: 2 },
  { tipo: 'paredFollaje', emoji: '🌿', label: 'Pared Follaje', maxColores: 2 },
  { tipo: 'shimmerWall', emoji: '✨', label: 'Shimmer Wall', maxColores: 2 },
  { tipo: 'trioCilindros', emoji: '🛢️', label: 'Trío Cilindros', maxColores: 3 },
  { tipo: 'mesaCandyBar', emoji: '🍬', label: 'Mesa Candy Bar', maxColores: 2 },
  { tipo: 'cartelNeon', emoji: '💡', label: 'Cartel Neón', maxColores: 1 },
  { tipo: 'lucesEdison', emoji: '🕯️', label: 'Luces Edison', maxColores: 1 },
  { tipo: 'estructuraGeometria', emoji: '⬡', label: 'Hexágono Metal', maxColores: 1 },
  { tipo: 'sillon15s', emoji: '👑', label: 'Sillón Throne 15s', maxColores: 2 },
  { tipo: 'globo', emoji: '🎈', label: 'Globo', maxColores: 1 },
  { tipo: 'globosMacizos', emoji: '🫧', label: 'Racimo Globos', maxColores: 3 },
  { tipo: 'flor', emoji: '🌸', label: 'Flor', maxColores: 2 },
  { tipo: 'centroMesa', emoji: '💐', label: 'Centro de Mesa', maxColores: 2 },
  { tipo: 'arco', emoji: '🌈', label: 'Arco Globos', maxColores: 3 },
  { tipo: 'lazo', emoji: '🎀', label: 'Lazo', maxColores: 1 },
  { tipo: 'candelabro', emoji: '🕯️', label: 'Candelabro', maxColores: 1 },
  { tipo: 'mesaTorta', emoji: '🎂', label: 'Mesa Torta', maxColores: 1 },
  { tipo: 'tela', emoji: '🪩', label: 'Tela/Cortina', maxColores: 1 },
  { tipo: 'corazon', emoji: '💖', label: 'Corazón', maxColores: 1 },
  { tipo: 'estrella', emoji: '⭐', label: 'Estrella', maxColores: 1 },
  { tipo: 'mariposa', emoji: '🦋', label: 'Mariposa', maxColores: 2 },
  { tipo: 'corona', emoji: '👑', label: 'Corona', maxColores: 1 },
];

export const MAX_COLORES_POR_TIPO = TIPOS_ELEMENTOS.reduce<Record<string, number>>((acc, item) => {
  acc[item.tipo] = item.maxColores;
  return acc;
}, {});

export function getMaxColoresByTipo(tipo: string | undefined, fallback = 1): number {
  if (!tipo) return fallback;
  return MAX_COLORES_POR_TIPO[tipo] ?? fallback;
}
