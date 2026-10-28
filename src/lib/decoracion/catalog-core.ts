import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AK_DECORATION_ELEMENTS } from './ak-library';
import type { DecorationSource } from './catalog-types';
import type { ElementoDecorativo } from '@/types/fiesta';
import { safeDecorationImageSource } from './asset-source';

export const hashDecoration = (text: string | Buffer): string => createHash('sha256').update(text).digest('hex');

export function canonicalDecorationUrl(value: string): string | null {
  try {
    const url = new URL(value, 'https://akproducciones.uy');
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (url.hostname === 'www.akproducciones.uy') url.hostname = 'akproducciones.uy';
    if (!['akproducciones.uy', 'storage.googleapis.com', 'firebasestorage.googleapis.com'].includes(url.hostname) &&
      !url.hostname.endsWith('.cdninstagram.com') && !url.hostname.endsWith('.fbcdn.net')) return null;
    if (url.hostname === 'akproducciones.uy' && !url.pathname.startsWith('/media/')) return null;
    if (!/\.(?:png|jpe?g|webp)$/i.test(url.pathname) && url.hostname === 'akproducciones.uy') return null;
    // Signed tokens expire, but the storage object and Meta media path identify the same source.
    url.search = ''; url.hash = '';
    return url.toString();
  } catch { return null; }
}

export function decorationSources(
  catalog: Array<{ id: string; url: string; titulo?: string; categoriaServicio: string }>,
  gallery: Array<{ id: string; url: string; titulo?: string; categoria: string; servicio?: string }>,
): DecorationSource[] {
  const sources = new Map<string, DecorationSource>();
  for (const row of [...catalog.map(c => ({ ...c, category: c.categoriaServicio })),
    ...gallery.map(g => ({ ...g, category: `${g.categoria} ${g.servicio || ''}` }))]) {
    if (!/decoraci[oó]n|ambientaci[oó]n|mesa principal/i.test(row.category)) continue;
    const canonical = canonicalDecorationUrl(row.url);
    if (!canonical) continue;
    const id = hashDecoration(canonical);
    if (!sources.has(id)) sources.set(id, { id, url: row.url, title: (row.titulo || 'Decoracion AK').slice(0, 140) });
  }
  return [...sources.values()];
}

export const DecorationAnalysisSchema = z.object({
  matches: z.array(z.object({
    assetId: z.string().max(80), x: z.number().min(0).max(1), y: z.number().min(0).max(1),
    width: z.number().min(0.01).max(1), height: z.number().min(0.01).max(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  })).max(40),
  unknowns: z.array(z.string().min(1).max(180)).max(20),
});

export function decorationAnalysisToElements(output: unknown): { elementos: ElementoDecorativo[]; unknowns: string[] } {
  const parsed = DecorationAnalysisSchema.parse(output);
  const unknowns = [...parsed.unknowns];
  const elementos: ElementoDecorativo[] = [];
  for (const [index, match] of parsed.matches.entries()) {
    const asset = AK_DECORATION_ELEMENTS.find(a => a.id === match.assetId);
    if (!asset) { unknowns.push(`Elemento sin correspondencia: ${match.assetId}`); continue; }
    const fit = Math.min(match.width * 900 / asset.width!, match.height * 550 / asset.height!);
    elementos.push({ id: `propuesta_${index}_${asset.id}`, tipo: asset.tipo,
      x: match.x * 900, y: match.y * 550, width: asset.width, height: asset.height,
      escala: Math.max(0.1, Math.min(6, fit)), colores: ['#ffffff'],
      rotacion: 0, zIndex: index + 1, isCustom: true, imageDataUri: asset.imageDataUri,
      ...(match.color ? { tintColor: match.color, tintOpacity: 0.25 } : {}),
    });
  }
  return { elementos, unknowns: [...new Set(unknowns)].slice(0, 20) };
}

export function validateApprovedDecorationElements(input: ElementoDecorativo[]): ElementoDecorativo[] {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) throw new Error('Revisar los elementos del diseno (1 a 100).');
  const ids = new Set<string>();
  return input.map(item => {
    const asset = AK_DECORATION_ELEMENTS.find(a => a.id === item.tipo);
    if (!asset || item.imageDataUri !== asset.imageDataUri || !safeDecorationImageSource(item.imageDataUri || '')) {
      throw new Error('La propuesta debe usar elementos de la biblioteca AK.');
    }
    if (typeof item.id !== 'string' || item.id.length > 120 || ids.has(item.id)) throw new Error('Identificador de elemento invalido.');
    ids.add(item.id);
    for (const key of ['x', 'y', 'escala', 'rotacion'] as const) {
      const val = item[key] ?? (key === 'rotacion' ? 0 : NaN);
      if (!Number.isFinite(val) || Math.abs(val) > 10000) throw new Error('Posicion o escala invalida.');
    }
    if (item.escala <= 0 || item.escala > 10) throw new Error('Escala invalida.');
    if (item.tintColor && !/^#[0-9a-f]{6}$/i.test(item.tintColor)) throw new Error('Color invalido.');
    return { id: item.id, tipo: asset.tipo, x: item.x, y: item.y, escala: item.escala,
      rotacion: item.rotacion ?? 0, colores: ['#ffffff'], width: asset.width, height: asset.height,
      isCustom: true, imageDataUri: asset.imageDataUri, zIndex: input.indexOf(item) + 1,
      ...(item.tintColor ? { tintColor: item.tintColor, tintOpacity: Math.max(0, Math.min(1, Number(item.tintOpacity) || 0.25)) } : {}),
    };
  });
}
