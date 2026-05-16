import type { GenerateSocialPostInput, GenerateSocialPostOutput } from '@/ai/types/generate-social-post-types';

function normalizeHashtag(tag: string) {
  const clean = tag.trim().replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '');
  return clean ? `#${clean}` : '';
}

export async function generateSocialPost(input: GenerateSocialPostInput): Promise<GenerateSocialPostOutput> {
  const eventName = input.eventName?.trim() || 'tu fiesta';
  const hashtags = [
    ...(input.hashtags || []),
    'AKProducciones',
    'ExperienciaAK',
    input.eventType || 'Evento',
  ]
    .map(normalizeHashtag)
    .filter(Boolean)
    .slice(0, 8);

  const caption = [
    `${eventName} no es solo una fiesta: es una experiencia completa.`,
    `En AK Producciones unimos organizacion, pantallas, invitados, fotos, musica y momentos digitales para que cada persona viva el evento desde el celular y desde la pista.`,
    `Objetivo: ${input.goal}.`,
    `Tono: ${input.tone}.`,
    'La tecnologia tambien puede emocionar.',
  ].join('\n\n');

  return {
    caption,
    shortCaption: `${eventName}: tecnologia, emocion y fiesta en una sola experiencia AK.`,
    hashtags,
    callToAction: 'Escribinos y armamos una experiencia a medida para tu evento.',
  };
}

export const generateSocialPostFlow = generateSocialPost;
