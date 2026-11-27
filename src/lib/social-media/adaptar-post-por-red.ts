import type { SocialPlatform } from '@/types/social-media';

export interface AdaptedPlatformVersion {
  text: string;
  title?: string;
  ctaLabel?: string;
  link?: string;
}

export function sanitizarTextoPublicacion(texto: string): string {
  return String(texto || '')
    .replace(/(?:\$|u\$s|usd|pesos|uyu|dólares|dolares)\s*\d+([.,]\d+)?|\d+([.,]\d+)?\s*(?:\$|u\$s|usd|pesos|uyu|dólares|dolares)|\b\d{1,3}(?:\.\d{3})+(?:[.,]\d+)?\b/gi, '')
    .replace(/garant[íi]a\w*/gi, '')
    .replace(/garantiz\w*/gi, 'asegurar')
    .replace(/\b24\/7\b/gi, '')
    .replace(/\b24\s*hs?\b/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function getFaltaMediaPorRed(
  platform: SocialPlatform,
  hasImage: boolean,
  hasVideo: boolean,
): string | null {
  if (platform === 'Instagram' && !hasImage && !hasVideo) {
    return 'falta la foto';
  }
  if (platform === 'Pinterest' && !hasImage) {
    return 'falta la foto';
  }
  if ((platform === 'TikTok' || platform === 'YouTube') && !hasVideo) {
    return 'falta el video';
  }
  return null;
}

export function armarFeedbackPublicacionMultiRed(params: {
  publicadas: number;
  total: number;
  motivosFallo: Array<{ platform: SocialPlatform; reason: string }>;
}): string {
  const { publicadas, total, motivosFallo } = params;
  if (motivosFallo.length === 0 && publicadas === total) {
    return `Publicado en ${publicadas} de ${total} redes.`;
  }
  const detalles = motivosFallo.map((m) => `${m.platform}: ${m.reason}`).join('. ');
  return `Publicado en ${publicadas} de ${total}. ${detalles}`.trim();
}

export function adaptarPostParaRedes(params: {
  textoBase: string;
  plataformas: SocialPlatform[];
  link?: string;
}): Partial<Record<SocialPlatform, AdaptedPlatformVersion>> {
  const { textoBase, plataformas, link } = params;
  const versions: Partial<Record<SocialPlatform, AdaptedPlatformVersion>> = {};
  for (const p of plataformas) {
    versions[p] = adaptarTextoFallbackPorRed(textoBase, p, link);
  }
  return versions;
}

export function adaptarTextoFallbackPorRed(
  textoBase: string,
  platform: SocialPlatform,
  link?: string,
): AdaptedPlatformVersion {
  const limpio = sanitizarTextoPublicacion(textoBase);
  const webLink = link?.trim() || 'https://akproducciones.uy';

  switch (platform) {
    case 'X': {
      const sinHashtags = limpio.replace(/#\S+/g, '').replace(/\s{2,}/g, ' ').trim();
      return {
        text: sinHashtags.slice(0, 260),
      };
    }
    case 'Instagram': {
      const tieneHashtags = /#\w+/.test(limpio);
      const hashtags = tieneHashtags ? '' : '\n\n#AKProducciones #EventosSalto #FiestasUruguay #MomentosUnicos';
      return {
        text: `${limpio}${hashtags}`.trim(),
      };
    }
    case 'TikTok': {
      const tieneHashtags = /#\w+/.test(limpio);
      const hashtags = tieneHashtags ? '' : '\n\n#AKProducciones #FiestasSalto #EventosUruguay #TikTokUruguay';
      return {
        text: `${limpio}${hashtags}`.trim(),
      };
    }
    case 'Google': {
      const sinHashtags = limpio.replace(/#\S+/g, '').replace(/\s{2,}/g, ' ').trim();
      return {
        text: sinHashtags,
        ctaLabel: 'Consultar',
        link: webLink,
      };
    }
    case 'Pinterest': {
      const primeraLinea = limpio.split('\n')[0]?.slice(0, 80) || 'Ideas para tu fiesta con AK Producciones';
      return {
        title: primeraLinea,
        text: limpio,
        link: webLink,
      };
    }
    default:
      return {
        text: limpio,
        ...(link ? { link: webLink } : {}),
      };
  }
}
