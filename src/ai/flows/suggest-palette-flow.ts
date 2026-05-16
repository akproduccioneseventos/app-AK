import type { SuggestPaletteInput, SuggestPaletteOutput } from '@/ai/types/suggest-palette-types';

const FALLBACK_PALETTES: Record<string, SuggestPaletteOutput> = {
  quince: {
    paletteName: 'Quince glam moderno',
    colors: [
      { name: 'Blanco escenario', hex: '#FFFFFF', usage: 'Base limpia para lectura y fotos.' },
      { name: 'Rojo AK', hex: '#D71920', usage: 'Acentos, botones y detalles de marca.' },
      { name: 'Rosa flash', hex: '#FF4D8D', usage: 'Momentos juveniles, retos y zona digital.' },
      { name: 'Azul noche', hex: '#111827', usage: 'Contraste premium en pantallas y LED.' },
    ],
    rationale: 'Combina identidad AK con energia adolescente sin usar fondos rojos pesados.',
  },
  boda: {
    paletteName: 'Boda elegante AK',
    colors: [
      { name: 'Marfil', hex: '#FFF7ED', usage: 'Fondos suaves y tarjetas.' },
      { name: 'Rojo AK', hex: '#D71920', usage: 'Acentos de marca.' },
      { name: 'Champagne', hex: '#D6B36A', usage: 'Detalles premium y separadores.' },
      { name: 'Grafito', hex: '#1F2937', usage: 'Texto y contraste.' },
    ],
    rationale: 'Mantiene blanco y rojo como base con un tono elegante para eventos formales.',
  },
  corporativo: {
    paletteName: 'Corporativo premium',
    colors: [
      { name: 'Blanco operativo', hex: '#FFFFFF', usage: 'Fondo principal.' },
      { name: 'Rojo AK', hex: '#D71920', usage: 'Acciones principales.' },
      { name: 'Azul tinta', hex: '#0F172A', usage: 'Titulos y pantallas.' },
      { name: 'Verde confirmacion', hex: '#10B981', usage: 'Estados correctos y aprobaciones.' },
    ],
    rationale: 'Prioriza claridad, lectura y sensacion profesional.',
  },
};

function normalize(value?: string) {
  return (value || '').toLowerCase();
}

export async function suggestPalette(input: SuggestPaletteInput): Promise<SuggestPaletteOutput> {
  const text = `${normalize(input.eventType)} ${normalize(input.mood)} ${normalize(input.season)}`;
  if (text.includes('boda')) return FALLBACK_PALETTES.boda;
  if (text.includes('corpor')) return FALLBACK_PALETTES.corporativo;

  const palette = FALLBACK_PALETTES.quince;
  if (!input.baseColor) return palette;

  return {
    ...palette,
    colors: [
      { name: 'Color elegido', hex: input.baseColor, usage: 'Personalizacion principal del cliente.' },
      ...palette.colors.filter((color) => color.hex.toLowerCase() !== input.baseColor?.toLowerCase()).slice(0, 3),
    ],
    rationale: `${palette.rationale} Se respeta el color base elegido por el cliente.`,
  };
}

export const suggestPaletteFlow = suggestPalette;
