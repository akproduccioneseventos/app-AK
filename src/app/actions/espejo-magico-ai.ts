'use server';

import { ai } from '@/ai/genkit';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { hasEntertainmentControlAccess } from '@/lib/auth/entertainment-token';
import * as logger from '@/lib/logger';

export type FaceSwapCategoryId =
  | 'showbiz'
  | 'cinema'
  | 'fantasy'
  | 'corporate'
  | 'fun';

export interface CategoryDefinition {
  id: FaceSwapCategoryId;
  label: string;
  emoji: string;
}

export const FACESWAP_CATEGORIES: CategoryDefinition[] = [
  { id: 'showbiz', label: 'Estrellas & Farándula', emoji: '🌟' },
  { id: 'cinema', label: 'Cine & Acción', emoji: '🎬' },
  { id: 'fantasy', label: 'Fantasía e Historia', emoji: '🏰' },
  { id: 'corporate', label: 'Estilo de Vida & Pro', emoji: '👔' },
  { id: 'fun', label: 'Divertidos & Niños', emoji: '🤪' },
];

export interface EspejoTemplateDefinition {
  id: string;
  categoryId: FaceSwapCategoryId;
  label: string;
  promptDescription: string;
  previewUrl?: string; // Curated royalty-free fallback representations
}

export const ESPEJO_TEMPLATES: Record<string, EspejoTemplateDefinition> = {
  // Estrellas & farandula
  kpop_stars: {
    id: 'kpop_stars',
    categoryId: 'showbiz',
    label: 'K-Pop Star',
    promptDescription:
      'a famous K-pop music idol performing on a massive stage under colorful spotlights and flashing purple neon lasers, wearing a highly stylish modern streetwear outfit with chains, shiny makeup, dynamic concert crowd in background',
  },
  rockstar: {
    id: 'rockstar',
    categoryId: 'showbiz',
    label: 'Rock Star',
    promptDescription:
      'an electrifying rock star on stage, wearing a black studded leather jacket and distressed jeans, holding a vintage electric guitar, surrounded by smoke machines, warm backlighting, and a roaring concert audience',
  },
  pop_idol: {
    id: 'pop_idol',
    categoryId: 'showbiz',
    label: 'Pop Icon',
    promptDescription:
      'a glamorous pop music icon dancing under glittering disco ball reflections, wearing a sparkling metallic silver outfit, holding a glowing wireless microphone, bokeh light circles in background',
  },
  dj_premium: {
    id: 'dj_premium',
    categoryId: 'showbiz',
    label: 'DJ Set Club',
    promptDescription:
      'a professional electronic music DJ wearing cool headphones around the neck, standing behind a glowing high-tech Pioneer DJ deck and mixer setup in a premium nightclub with laser beams and dancing crowd in background',
  },

  // Cine & accion
  movie_poster: {
    id: 'movie_poster',
    categoryId: 'cinema',
    label: 'Afiche de Cine',
    promptDescription:
      'a heroic protagonist inside an epic action movie poster billboard, dramatic orange fire and blue sparks explosion in the background, debris flying, cinematic high contrast lighting, movie title text overlay simulated at the bottom',
  },
  superhero: {
    id: 'superhero',
    categoryId: 'cinema',
    label: 'Superhéroe',
    promptDescription:
      'a powerful superhero wearing a detailed high-tech metallic skintight suit with a glowing emblem on the chest, a long cape flowing dramatically in the wind, standing in a heroic power pose on a skyscraper rooftop overlooking a city skyline at sunset',
  },
  secret_agent: {
    id: 'secret_agent',
    categoryId: 'cinema',
    label: 'Agente Secreto',
    promptDescription:
      'a sophisticated secret agent wearing a classic tailored black tuxedo or an elegant evening gown, standing in a high-tech modern glass building looking over a city at night, holding a prop, James Bond aesthetic',
  },
  cyberpunk_warrior: {
    id: 'cyberpunk_warrior',
    categoryId: 'cinema',
    label: 'Guerrero Cyberpunk',
    promptDescription:
      'a futuristic cyberpunk mercenary with glowing blue cybernetic implants on the face and arms, wearing a technical high-collar jacket, standing on a rainy neo-tokyo street filled with neon signs and flying vehicles',
  },

  // Fantasia e historia
  medieval_legends: {
    id: 'medieval_legends',
    categoryId: 'fantasy',
    label: 'Caballero / Hada',
    promptDescription:
      'a legendary medieval figure: either a brave knight in detailed shining silver armor holding a sword, or a magical fairy with iridescent wings, standing in a dreamy enchanted meadow next to an old stone castle',
  },
  royalty: {
    id: 'royalty',
    categoryId: 'fantasy',
    label: 'Regal / Realeza',
    promptDescription:
      'a grand royal king or queen wearing heavy red velvet robes trimmed with luxurious white fur, a magnificent golden crown adorned with rubies and emeralds, holding a royal scepter, sitting on a massive carved golden throne inside a grand castle hall',
  },
  gatsby_1920s: {
    id: 'gatsby_1920s',
    categoryId: 'fantasy',
    label: 'Gran Gatsby 1920s',
    promptDescription:
      'a glamorous guest at a 1920s Gatsby party, wearing a black tuxedo or a sparkling flapper dress with pearl necklaces and a feathered headband, holding a champagne glass, gold art deco background pattern with warm luxury lighting',
  },
  pirate_captain: {
    id: 'pirate_captain',
    categoryId: 'fantasy',
    label: 'Capitán Pirata',
    promptDescription:
      'a pirate captain wearing a weathered leather tricorn hat, a long dramatic coat, standing at the wooden helm of a grand pirate ship with the ocean waves crashing around and a dark storm brewing in the background',
  },
  oil_painting: {
    id: 'oil_painting',
    categoryId: 'fantasy',
    label: 'Pintura al Óleo',
    promptDescription:
      'a classical renaissance oil painting portrait, showing rich brush strokes, fine canvas texture, warm Rembrandt-style chiascuro lighting, rich classical clothing, making the person look like a masterpiece hanging in a museum',
  },

  // Estilo de vida & pro
  space_commander: {
    id: 'space_commander',
    categoryId: 'corporate',
    label: 'Astronauta',
    promptDescription:
      'a space commander wearing a detailed white NASA spacesuit with patches, helmet visor open to reveal the face, floating in zero gravity inside a space station cockpit with planet Earth visible through the window behind them',
  },
  master_chef: {
    id: 'master_chef',
    categoryId: 'corporate',
    label: 'Master Chef',
    promptDescription:
      'a professional gourmet master chef wearing a clean double-breasted white chef jacket and a tall white chef hat, standing in a premium modern stainless steel restaurant kitchen preparing a beautifully plated dish',
  },
  linkedin_premium: {
    id: 'linkedin_premium',
    categoryId: 'corporate',
    label: 'LinkedIn Premium',
    promptDescription:
      'a confident professional wearing a smart tailored blazer and crisp white shirt, standing in a modern sunlit corporate office building, warm professional corporate headshot photography',
  },
  f1_driver: {
    id: 'f1_driver',
    categoryId: 'corporate',
    label: 'Piloto de F1',
    promptDescription:
      'a professional racing car driver wearing a detailed red racing suit covered in sponsor patches, holding a helmet under one arm, standing in the pit lane of a race track with garage and F1 car blurred in background',
  },

  // Divertidos & ninos
  tiny_pirate: {
    id: 'tiny_pirate',
    categoryId: 'fun',
    label: 'Pequeño Pirata',
    promptDescription:
      'a cute cartoon pirate character wearing an oversized floppy pirate hat with a friendly skull illustration, standing next to a wooden treasure chest filled with gold coins on a bright sunny tropical beach, fun friendly cartoon style',
  },
  cartoon_3d: {
    id: 'cartoon_3d',
    categoryId: 'fun',
    label: 'Avatar 3D Pixar',
    promptDescription:
      'a highly expressive 3D cartoon character in the style of a modern animated movie, clean rendering, soft lighting, friendly features, vibrant colorful clothing, standing in a cheerful fantasy park background',
  },
  classic_comic: {
    id: 'classic_comic',
    categoryId: 'fun',
    label: 'Pop Art Comic',
    promptDescription:
      'a classic comic book illustration with bold black outlines, high contrast pop art colors (bright cyan, yellow, magenta), retro dot halftone pattern background, speech bubble next to the person with party sparkles',
  },
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ESPEJO_AI_TIMEOUT_MS = 60_000;
export const ESPEJO_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL?.trim() || 'googleai/gemini-3.1-flash-image-preview';

async function ensureEspejoAccess(fiestaId: string, accessToken?: string): Promise<void> {
  const authorized = await hasEntertainmentControlAccess(
    fiestaId,
    'espejoMagicoIA',
    accessToken
  );
  if (!authorized) throw new Error('Acceso de cabina Face Swap IA no autorizado.');
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Evento no encontrado.');
}

async function generateEspejoImage(options: Parameters<typeof ai.generate>[0]): Promise<any> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      ai.generate(options),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error('La generación de imagen superó el tiempo máximo.')),
          ESPEJO_AI_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString('base64');
}

function resolveContentType(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

async function validateAndExtractImage(
  file: File | null,
  fieldName: string
): Promise<
  | { ok: true; base64: string; contentType: string }
  | { ok: false; error: string }
> {
  if (!file || !(file instanceof File) || file.size === 0) {
    return { ok: false, error: `No se recibió un archivo válido en "${fieldName}".` };
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: `El archivo "${fieldName}" no es una imagen válida.` };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { ok: false, error: `La imagen "${fieldName}" supera el límite de 10 MB.` };
  }
  const base64 = await fileToBase64(file);
  const contentType = resolveContentType(file);
  return { ok: true, base64, contentType };
}

function stripDataUri(dataUri: string): string | null {
  const commaIndex = dataUri.indexOf(',');
  return commaIndex !== -1 ? dataUri.substring(commaIndex + 1) : null;
}

function isLikelyBase64Image(value: string) {
  return value.length > 500 && /^[A-Za-z0-9+/\n\r]+=*$/.test(value.trim());
}

function extractImageFromResult(result: any): string | null {
  try {
    const topMedia = typeof result.media === 'function' ? result.media() : result.media;
    if (topMedia && typeof topMedia.url === 'string') {
      if (topMedia.url.startsWith('data:')) {
        return stripDataUri(topMedia.url);
      }
      if (isLikelyBase64Image(topMedia.url)) {
        return topMedia.url;
      }
    }

    const messageParts: any[] | undefined = result.message?.content;
    if (Array.isArray(messageParts)) {
      for (const part of messageParts) {
        if (part.media?.url && typeof part.media.url === 'string') {
          if (part.media.url.startsWith('data:')) {
            return stripDataUri(part.media.url);
          }
          if (isLikelyBase64Image(part.media.url)) return part.media.url;
        }
      }
    }

    const candidates = result.candidates;
    if (Array.isArray(candidates)) {
      for (const candidate of candidates) {
        const parts = candidate.message?.content ?? candidate.content ?? [];
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (part.media?.url && typeof part.media.url === 'string') {
              const url = part.media.url;
              if (url.startsWith('data:')) return stripDataUri(url);
              if (isLikelyBase64Image(url)) return url;
            }
            if (part.inlineData?.data && typeof part.inlineData.data === 'string') {
              return part.inlineData.data;
            }
          }
        }
      }
    }

    const text = typeof result.text === 'function' ? result.text() : result.text;
    if (
      typeof text === 'string' &&
      isLikelyBase64Image(text)
    ) {
      return text.trim();
    }
  } catch (e) {
    logger.warn('[espejo-magico-ai] extractImageFromResult error:', e);
  }
  return null;
}

export interface FaceSwapResult {
  success: boolean;
  imageBase64?: string;
  faceSwapApplied?: boolean;
  error?: string;
}

/**
 * Apply Face Swap IA to a captured guest photo.
 *
 * Combines the user photo with the specified template using advanced prompt engineering
 * that enforces Dynamic Landmark Mapping (facial alignment, lighting match, shadow blending).
 */
export async function applyEspejoFaceSwap(
  formData: FormData
): Promise<FaceSwapResult> {
  const fiestaId = formData.get('fiestaId') as string;
  const accessToken = formData.get('accessToken') as string | null;
  const templateId = formData.get('templateId') as string | null;
  const sourceFile = formData.get('sourceFile') as File | null;

  if (!fiestaId) {
    return { success: false, error: 'Falta el ID de fiesta.' };
  }

  try {
    await ensureEspejoAccess(fiestaId, accessToken || undefined);
  } catch (error: any) {
    return { success: false, error: error.message || 'Sesión no autorizada.' };
  }

  const template = templateId ? ESPEJO_TEMPLATES[templateId] : null;
  if (!template) {
    return { success: false, error: 'Debe seleccionar una plantilla de Face Swap IA válida.' };
  }

  const sourceExtraction = await validateAndExtractImage(sourceFile, 'sourceFile');
  if (!sourceExtraction.ok) {
    return { success: false, error: sourceExtraction.error };
  }

  const { base64: sourceBase64, contentType: sourceContentType } = sourceExtraction;
  logger.info(`[espejo-magico-ai] applyEspejoFaceSwap: template=${templateId}, fiesta=${fiestaId}`);

  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('[espejo-magico-ai] No API key configured — returning original.');
      return {
        success: true,
        imageBase64: sourceBase64,
        faceSwapApplied: false,
      };
    }

    const promptParts = [
      {
        media: {
          contentType: sourceContentType,
          url: `data:${sourceContentType};base64,${sourceBase64}`,
        },
      },
      {
        text: [
          'You are an expert digital portrait artist and AI image compositor.',
          'TASK: Perform a high-fidelity Face Swap by transferring the face of the person in the provided image into a new scene.',
          '',
          `SCENE TO GENERATE: ${template.promptDescription}`,
          '',
          'INSTRUCTIONS FOR DYNAMIC LANDMARK MAPPING:',
          '1. Identity Retention: Keep the user\'s facial features (eyes, nose, mouth, chin), skin tone, expression, and overall face structure identical to the input image.',
          '2. Face Alignment: Align the head and face angle naturally with the shoulders and posture of the character in the scene.',
          '3. Lighting and Shadow Blending: Match the lighting direction, ambient color, highlights, and shadows on the face with the lights of the generated scene so the face composites seamlessly.',
          '4. High Quality: The generated image must look clean, detailed, and photorealistic. No visible lines, blurred borders, or uncanny stretches around the face boundary.',
          '5. No text, logos, overlays, or watermarks.',
        ].join('\n'),
      },
    ];

    const response = await generateEspejoImage({
      model: ESPEJO_IMAGE_MODEL,
      prompt: promptParts,
    });

    const transformedBase64 = extractImageFromResult(response);
    if (!transformedBase64) {
      throw new Error('El modelo de IA no devolvió una imagen válida.');
    }

    return {
      success: true,
      imageBase64: transformedBase64,
      faceSwapApplied: true,
    };
  } catch (error: any) {
    logger.error('[espejo-magico-ai] error during applyEspejoFaceSwap:', error);
    return {
      success: false,
      error: error.message || 'Error al procesar el Face Swap con Inteligencia Artificial.',
    };
  }
}
