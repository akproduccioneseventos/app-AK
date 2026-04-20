import type { DecoCanvasTemplate, ElementoDecorativo } from '@/types/fiesta';

const PRESET_DATE = '2026-01-01T00:00:00.000Z';

function el(
  id: string,
  tipo: ElementoDecorativo['tipo'],
  x: number,
  y: number,
  colores: string[],
  zIndex: number,
  rotacion = 0,
  escala = 1
): ElementoDecorativo {
  return { id, tipo, x, y, colores, zIndex, rotacion, escala, opacity: 1 };
}

export const DECO_PREBUILT_TEMPLATES: DecoCanvasTemplate[] = [
  {
    id: 'preset_cumple_infantil',
    nombre: 'Cumpleaños infantil',
    fondoColor: '#FFF6D6',
    creadoEn: PRESET_DATE,
    elementos: [
      el('ci_1', 'globosMacizos', 180, 150, ['#FF6B6B', '#4D96FF', '#FFDD57'], 1),
      el('ci_2', 'mesaTorta', 450, 320, ['#FF9ECA'], 3),
      el('ci_3', 'globo', 700, 170, ['#6BCB77'], 2),
      el('ci_4', 'estrella', 320, 110, ['#FFD700'], 4, 15, 0.9),
      el('ci_5', 'estrella', 590, 110, ['#FFD700'], 4, -15, 0.9),
    ],
  },
  {
    id: 'preset_cumple_elegante',
    nombre: 'Cumpleaños elegante',
    fondoColor: '#F8F4EE',
    creadoEn: PRESET_DATE,
    elementos: [
      el('ce_1', 'arco', 450, 180, ['#C9A96E', '#2C2C2C', '#F5F0E8'], 1),
      el('ce_2', 'mesaTorta', 450, 330, ['#FFFFFF'], 2),
      el('ce_3', 'candelabro', 300, 340, ['#C9A96E'], 3),
      el('ce_4', 'candelabro', 600, 340, ['#C9A96E'], 3),
      el('ce_5', 'lazo', 450, 120, ['#2C2C2C'], 4),
    ],
  },
  {
    id: 'preset_baby_shower_nino',
    nombre: 'Baby Shower niño',
    fondoColor: '#EAF5FF',
    creadoEn: PRESET_DATE,
    elementos: [
      el('bn_1', 'globosMacizos', 220, 180, ['#87CEEB', '#4D96FF', '#FFFFFF'], 1),
      el('bn_2', 'globosMacizos', 680, 180, ['#87CEEB', '#4D96FF', '#FFFFFF'], 1),
      el('bn_3', 'mesaTorta', 450, 330, ['#BDE0FE'], 2),
      el('bn_4', 'corona', 450, 120, ['#4D96FF'], 3),
    ],
  },
  {
    id: 'preset_baby_shower_nina',
    nombre: 'Baby Shower niña',
    fondoColor: '#FFF0F7',
    creadoEn: PRESET_DATE,
    elementos: [
      el('bg_1', 'globosMacizos', 220, 180, ['#FF69B4', '#FF9ECA', '#FFFFFF'], 1),
      el('bg_2', 'globosMacizos', 680, 180, ['#FF69B4', '#FF9ECA', '#FFFFFF'], 1),
      el('bg_3', 'mesaTorta', 450, 330, ['#FCE4EC'], 2),
      el('bg_4', 'corona', 450, 120, ['#FF69B4'], 3),
    ],
  },
  {
    id: 'preset_boda_clasica',
    nombre: 'Boda clásica',
    fondoColor: '#FAFAF5',
    creadoEn: PRESET_DATE,
    elementos: [
      el('bc_1', 'arco', 450, 180, ['#F5F0E8', '#D4C5A9', '#FFFFFF'], 1),
      el('bc_2', 'flor', 350, 250, ['#FFFFFF', '#F5F0E8'], 2, -20, 1.4),
      el('bc_3', 'flor', 550, 250, ['#FFFFFF', '#F5F0E8'], 2, 20, 1.4),
      el('bc_4', 'corazon', 450, 130, ['#DC143C'], 3),
      el('bc_5', 'mesaTorta', 450, 330, ['#FFFFFF'], 2),
    ],
  },
  {
    id: 'preset_fiesta_tropical',
    nombre: 'Fiesta tropical',
    fondoColor: '#E8FFF7',
    creadoEn: PRESET_DATE,
    elementos: [
      el('ft_1', 'tela', 190, 180, ['#20B2AA'], 1, -12, 1.6),
      el('ft_2', 'tela', 710, 180, ['#00FA9A'], 1, 12, 1.6),
      el('ft_3', 'flor', 420, 130, ['#FF8C00', '#FFD700'], 2, -8, 1.2),
      el('ft_4', 'flor', 490, 130, ['#FF007F', '#FF8E53'], 2, 8, 1.2),
      el('ft_5', 'mesaTorta', 450, 330, ['#F5F0E8'], 3),
    ],
  },
  {
    id: 'preset_graduacion',
    nombre: 'Graduación',
    fondoColor: '#F3F6FF',
    creadoEn: PRESET_DATE,
    elementos: [
      el('gr_1', 'corona', 340, 170, ['#1A1A2E'], 1, -12, 1.1),
      el('gr_2', 'corona', 560, 170, ['#1A1A2E'], 1, 12, 1.1),
      el('gr_3', 'mesaTorta', 450, 330, ['#2C2C2C'], 2),
      el('gr_4', 'estrella', 450, 120, ['#FFD700'], 3),
      el('gr_5', 'lazo', 450, 210, ['#4A90D9'], 4),
    ],
  },
  {
    id: 'preset_fiesta_15',
    nombre: 'Fiesta de 15',
    fondoColor: '#FFF3FA',
    creadoEn: PRESET_DATE,
    elementos: [
      el('q15_1', 'arco', 450, 180, ['#F8D7E8', '#D9B8FF', '#FFFFFF'], 1),
      el('q15_2', 'globosMacizos', 230, 190, ['#F7C6E0', '#E8B4D3', '#FFFFFF'], 2),
      el('q15_3', 'globosMacizos', 670, 190, ['#F7C6E0', '#E8B4D3', '#FFFFFF'], 2),
      el('q15_4', 'corona', 450, 115, ['#D4AF37'], 4, 0, 1.1),
      el('q15_5', 'mesaTorta', 450, 335, ['#FFFFFF'], 3),
    ],
  },
  {
    id: 'preset_navidad',
    nombre: 'Navidad',
    fondoColor: '#F2FFF4',
    creadoEn: PRESET_DATE,
    elementos: [
      el('nv_1', 'arco', 450, 180, ['#2E8B57', '#DC143C', '#FFFFFF'], 1),
      el('nv_2', 'estrella', 450, 120, ['#FFD700'], 3),
      el('nv_3', 'lazo', 350, 300, ['#DC143C'], 2),
      el('nv_4', 'lazo', 550, 300, ['#DC143C'], 2),
      el('nv_5', 'mesaTorta', 450, 340, ['#FFFFFF'], 2),
    ],
  },
  {
    id: 'preset_ano_nuevo',
    nombre: 'Año Nuevo',
    fondoColor: '#0F172A',
    creadoEn: PRESET_DATE,
    elementos: [
      el('an_1', 'globosMacizos', 220, 180, ['#FFD700', '#FFFFFF', '#C9A96E'], 1),
      el('an_2', 'globosMacizos', 680, 180, ['#FFD700', '#FFFFFF', '#C9A96E'], 1),
      el('an_3', 'estrella', 450, 110, ['#FFD700'], 3, 0, 1.4),
      el('an_4', 'candelabro', 350, 340, ['#FFD700'], 2),
      el('an_5', 'candelabro', 550, 340, ['#FFD700'], 2),
    ],
  },
];
