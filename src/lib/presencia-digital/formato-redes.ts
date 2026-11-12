import type { SocialPlatform } from '@/types/social-media';

export interface RedesVideoItem {
  estacion: string;
  formato: string;
  archivo?: string;
  nombre?: string;
  duracion?: number;
}

export function limpiarTextoRedes(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/\bgarant[ií]a[s]?\b/gi, 'compromiso')
    .replace(/\bgarantizado[s]?\b/gi, 'asegurado')
    .replace(/\b24\/7\b/gi, 'siempre')
    .replace(/[$€£]\s*\d+([.,]\d+)?\s*(uyu|pesos|usd|dolares|dólares)?/gi, '')
    .replace(/\b\d+([.,]\d+)?\s*(uyu|pesos|usd|dolares|dólares)\b/gi, '')
    .replace(/\b(uyu|pesos|usd|dolares|dólares)\b/gi, '')
    .replace(/\b(precio|costo|tarifa|promocion|promo)\s*[:=]?\s*\d+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function plataformasParaFormato(formato: string): SocialPlatform[] {
  const f = (formato || '').toLowerCase().trim();
  if (f.includes('reel') || f === '9:16' || f.includes('historia') || f.includes('story') || f.includes('tiktok')) {
    return ['Instagram', 'Facebook', 'TikTok'];
  }
  if (f.includes('cuadrado') || f === '1:1' || f.includes('square')) {
    return ['Facebook'];
  }
  if (f.includes('muro') || f === '4:5' || f.includes('vertical')) {
    return ['Instagram'];
  }
  return ['Instagram'];
}

export function contarBorradoresACrear(redesJson: any): number {
  if (!redesJson) return 0;
  let items: RedesVideoItem[] = [];
  if (typeof redesJson === 'string') {
    try {
      const parsed = JSON.parse(redesJson);
      items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.videos) ? parsed.videos : []);
    } catch {
      return 0;
    }
  } else if (Array.isArray(redesJson)) {
    items = redesJson;
  } else if (Array.isArray(redesJson?.videos)) {
    items = redesJson.videos;
  }

  let total = 0;
  for (const item of items) {
    const redes = plataformasParaFormato(item.formato);
    total += redes.length;
  }
  return total;
}
