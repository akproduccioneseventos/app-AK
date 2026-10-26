import type { SuggestPaletteInput, SuggestPaletteOutput } from '@/ai/types/suggest-palette-types';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';

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

function getFallback(input: SuggestPaletteInput): SuggestPaletteOutput {
  const text = `${normalize(input.eventType)} ${normalize(input.mood)} ${normalize(input.season)} ${normalize(input.style)}`;
  let base = FALLBACK_PALETTES.quince;
  if (text.includes('boda') || text.includes('casamiento')) base = FALLBACK_PALETTES.boda;
  else if (text.includes('corpor') || text.includes('empresa')) base = FALLBACK_PALETTES.corporativo;

  if (input.baseColor) {
    const colors = base.colors.map((c, i) => (i === 0 ? { ...c, hex: input.baseColor! } : { ...c }));
    return {
      ...base,
      colors,
    };
  }

  return base;
}

export async function suggestPalette(input: SuggestPaletteInput): Promise<SuggestPaletteOutput> {
  const fallback = getFallback(input);

  // Regla Bloque 12 / Caso 12: Sin tope de IA, no llama al modelo
  const canUseAI = await hayPresupuestoParaIA().catch(() => false);
  if (!canUseAI) {
    return fallback;
  }

  try {
    const model = getGeminiModelForAgent('fiesta');
    const prompt = `Sos un diseñador experto en ambientación y colorimetría para eventos en AK Producciones (Salto, Uruguay).
Creá una paleta armónica de 3 a 4 colores para la siguiente fiesta:
- Tipo de fiesta: ${input.eventType || 'Evento'}
- Estilo decorativo deseado: ${input.style || input.mood || 'Moderno y elegante'}
- Color base preferido: ${input.baseColor || 'No especificado'}
${input.referencePhotos && input.referencePhotos.length ? `- Fotos de referencia provistas: ${input.referencePhotos.length} fotos adjuntas.` : ''}

Devolvé SOLO un objeto JSON válido con esta estructura exacta:
{
  "paletteName": "Nombre creativo de la paleta (ej: 'Atardecer Dorado', 'Noche Estrellada')",
  "colors": [
    { "name": "Nombre color 1", "hex": "#HEXHEX", "usage": "Uso principal en telas y mantelería" },
    { "name": "Nombre color 2", "hex": "#HEXHEX", "usage": "Uso secundario en centros de mesa y luces" },
    { "name": "Nombre color 3", "hex": "#HEXHEX", "usage": "Acento en servilletas y detalles" }
  ],
  "rationale": "Breve explicación de 1 o 2 oraciones del por qué combina con el evento"
}`;

    const res = await generateWithGeminiFallback({ model, prompt });
    const raw = res?.text?.trim() || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (parsed.paletteName && Array.isArray(parsed.colors) && parsed.colors.length >= 3) {
        await registrarConsumoIA('sugerir-paleta').catch(() => {});
        return {
          paletteName: parsed.paletteName,
          colors: parsed.colors,
          rationale: parsed.rationale || fallback.rationale,
        };
      }
    }
    return fallback;
  } catch (err) {
    console.warn('[suggestPalette] Error llamando a Gemini, usando paleta fallback:', err);
    return fallback;
  }
}

export const suggestPaletteFlow = suggestPalette;

