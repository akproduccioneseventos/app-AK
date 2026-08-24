/**
 * Asistente de Publicación en Modo "1 Toque":
 * Para cuando una red no tiene API configurada o es manual (WhatsApp, X, etc.),
 * este módulo adapta el texto, prepara la descarga de la foto/video y genera el enlace
 * directo a la pantalla de publicación de la red en 1 solo clic.
 */

import type { SocialPlatform } from '@/types/social-media';

export interface OneTouchPlatformConfig {
  name: SocialPlatform;
  displayName: string;
  webUrl: string;
  mobileDeepLink?: string;
  maxCharacters: number;
  instructions: string;
}

export const ONE_TOUCH_CONFIGS: Record<SocialPlatform, OneTouchPlatformConfig> = {
  Instagram: {
    name: 'Instagram',
    displayName: 'Instagram',
    webUrl: 'https://www.instagram.com/create/style/',
    mobileDeepLink: 'instagram://camera',
    maxCharacters: 2200,
    instructions: 'Pegá el texto en el pie de foto y seleccioná la imagen que se acaba de descargar.',
  },
  Facebook: {
    name: 'Facebook',
    displayName: 'Facebook',
    webUrl: 'https://www.facebook.com/',
    mobileDeepLink: 'fb://feed',
    maxCharacters: 5000,
    instructions: 'Pegá el texto en la publicación de tu página y adjuntá la foto.',
  },
  TikTok: {
    name: 'TikTok',
    displayName: 'TikTok',
    webUrl: 'https://www.tiktok.com/upload',
    mobileDeepLink: 'snssdk1233://',
    maxCharacters: 2200,
    instructions: 'Subí el video descargado, pegá la descripción y tocá Publicar.',
  },
  WhatsApp: {
    name: 'WhatsApp',
    displayName: 'Estados de WhatsApp',
    webUrl: 'https://web.whatsapp.com/',
    mobileDeepLink: 'whatsapp://status',
    maxCharacters: 700,
    instructions: 'Abrí Estados en WhatsApp, seleccioná la foto y pegá el texto.',
  },
  YouTube: {
    name: 'YouTube',
    displayName: 'YouTube Shorts',
    webUrl: 'https://studio.youtube.com/channel/upload',
    maxCharacters: 1000,
    instructions: 'Subí el video a Shorts, pegá el título y descripción.',
  },
  Threads: {
    name: 'Threads',
    displayName: 'Threads',
    webUrl: 'https://threads.net/',
    mobileDeepLink: 'threads://create',
    maxCharacters: 500,
    instructions: 'Pegá el texto en el nuevo hilo y adjuntá la imagen.',
  },
  X: {
    name: 'X',
    displayName: 'X (Twitter)',
    webUrl: 'https://x.com/compose/post',
    mobileDeepLink: 'twitter://post',
    maxCharacters: 280,
    instructions: 'Pegá el texto resumido y publicá el tweet.',
  },
  Pinterest: {
    name: 'Pinterest',
    displayName: 'Pinterest',
    webUrl: 'https://www.pinterest.com/pin-builder/',
    maxCharacters: 500,
    instructions: 'Subí la imagen descargada, pegá el título y guardalo en tu tablero.',
  },
  Google: {
    name: 'Google',
    displayName: 'Google Mi Negocio',
    webUrl: 'https://business.google.com/',
    maxCharacters: 1500,
    instructions: 'Creá una novedad en tu perfil de Google Maps y pegá el texto.',
  },
};

/**
 * Adapta el texto y los hashtags según las limitaciones y estilo de cada red.
 */
export function adaptTextForPlatform(platform: SocialPlatform, rawText: string, link?: string): string {
  const config = ONE_TOUCH_CONFIGS[platform];
  let text = rawText.trim();

  if (platform === 'X') {
    // Reducción estricta para 280 caracteres
    const linkStr = link ? `\n${link}` : '';
    const maxLen = 275 - linkStr.length;
    if (text.length > maxLen) {
      text = text.slice(0, maxLen - 3) + '...';
    }
    return `${text}${linkStr}`;
  }

  if (platform === 'WhatsApp') {
    // Formato con negritas para WhatsApp
    const header = '*AK Producciones Eventos* ✨\n\n';
    const linkStr = link ? `\n\n👉 Más info: ${link}` : '';
    return `${header}${text}${linkStr}`;
  }

  if (platform === 'Threads') {
    if (text.length > 490) {
      text = text.slice(0, 487) + '...';
    }
    if (link) text += `\n\n${link}`;
    return text;
  }

  if (platform === 'TikTok') {
    // Asegurar hashtags de impacto para TikTok
    if (!text.includes('#')) {
      text += '\n\n#eventos #fiestas #fotocabina #plataforma360 #uruguay';
    }
    return text;
  }

  if (link && !text.includes(link)) {
    text += `\n\n🔗 ${link}`;
  }

  return text;
}

/**
 * Retorna la URL de apertura directa para la red (con texto prefijado si lo soporta).
 */
export function getOneTouchActionUrl(platform: SocialPlatform, adaptedText: string): string {
  if (platform === 'X') {
    return `https://x.com/compose/post?text=${encodeURIComponent(adaptedText)}`;
  }
  if (platform === 'WhatsApp') {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(adaptedText)}`;
  }
  return ONE_TOUCH_CONFIGS[platform]?.webUrl || 'https://google.com';
}
