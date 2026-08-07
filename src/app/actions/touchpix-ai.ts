"use server";

/**
 * Touchpix AI — Face Swap & Theme Transformation Server Actions.
 *
 * Uses Gemini multimodal image editing to:
 *   1. Apply artistic theme transformations to photos (disco, neon, pop art, etc.)
 *   2. Generate face-swap images (person onto character templates)
 *   3. Upload transformed photos to the social gallery
 *
 * When the model doesn't support image output (or generation fails), a fallback
 * returns the original image with `themeApplied: false` so the client can apply
 * CSS filters instead.
 */

import { uploadSocialPost } from "@/app/actions/social-gallery";
import { getFiestaById } from "@/app/actions/fiesta/fiesta.actions";
import { hasEntertainmentGuestAccess } from "@/lib/auth/entertainment-token";
import { getEntertainmentStationConfig } from "@/lib/entertainment/station-config";
import { generateGeminiImage } from "@/lib/ai/gemini-image";
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import * as logger from "@/lib/logger";

// ──────────────────── Theme Definitions ────────────────────

export type TouchpixThemeId =
  | "disco_glam"
  | "neon_retro"
  | "fantasy_enchanted"
  | "pop_art"
  | "golden_luxury"
  | "cosmic_galaxy"
  | "carnival_fiesta";

interface ThemeDefinition {
  label: string;
  promptDescription: string;
  /** CSS-like filter hint sent to the client when AI generation is unavailable. */
  cssFallbackHint: string;
}

const THEME_DEFINITIONS: Record<TouchpixThemeId, ThemeDefinition> = {
  disco_glam: {
    label: "Disco Glamour",
    promptDescription:
      "Apply a dazzling disco glamour transformation: add shimmering sparkles and glitter particles floating around the person, disco ball light reflections casting colorful prismatic patterns on their skin and clothes, warm glamorous studio lighting with a soft golden glow, and a subtle bokeh background with rotating disco ball highlights. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint:
      "saturate(1.3) brightness(1.1) contrast(1.1) hue-rotate(15deg)",
  },
  neon_retro: {
    label: "Neon Retro 80s",
    promptDescription:
      "Apply an 80s neon retro transformation: add vibrant neon glow outlines in hot pink, electric cyan, and purple tracing around the person's silhouette and features, a retro synthwave grid floor fading into the background, retro color grading with deep magentas and teals, scanline overlay effects, and subtle VHS-style chromatic aberration. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint:
      "saturate(1.5) contrast(1.3) hue-rotate(280deg) brightness(1.05)",
  },
  fantasy_enchanted: {
    label: "Fantasy Enchanted Forest",
    promptDescription:
      "Apply a magical enchanted forest transformation: surround the person with floating magical fairy dust particles that emit a soft golden-green glow, add an ethereal luminous aura around them, place them in a mystical forest backdrop with bioluminescent plants and fireflies, add subtle lens flares and dreamy soft-focus edges. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint:
      "saturate(1.2) brightness(1.05) sepia(0.15) hue-rotate(90deg)",
  },
  pop_art: {
    label: "Pop Art Warhol",
    promptDescription:
      "Apply a bold Andy Warhol-style pop art transformation: convert the image to use flat, highly saturated primary colors (bright red, yellow, blue, green), add thick black comic-book outlines around the person's features, apply Ben-Day dot halftone patterns in the background and shadow areas, use a high-contrast posterized color palette. Keep the person's face clearly recognizable despite the stylization.",
    cssFallbackHint: "saturate(2.0) contrast(1.6) brightness(1.1)",
  },
  golden_luxury: {
    label: "Golden Luxury",
    promptDescription:
      "Apply a luxurious golden transformation: overlay delicate gold leaf textures and flakes gently floating around the person, add a rich warm golden color grade with deep amber highlights, place subtle golden baroque ornamental frames or flourishes at the edges, apply a premium soft-glow lighting that makes skin look radiant. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint: "sepia(0.4) saturate(1.3) brightness(1.1) contrast(1.05)",
  },
  cosmic_galaxy: {
    label: "Cosmic Galaxy",
    promptDescription:
      "Apply a cosmic galaxy transformation: replace the background with a stunning deep-space nebula scene filled with colorful gas clouds in purple, blue, and pink, add twinkling distant stars and subtle galaxy spiral formations, make the person appear to float in space with gentle cosmic light reflections on their skin, add a faint stellar lens flare. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint:
      "saturate(1.4) contrast(1.2) hue-rotate(240deg) brightness(0.95)",
  },
  carnival_fiesta: {
    label: "Carnival Fiesta",
    promptDescription:
      "Apply a vibrant carnival fiesta transformation: shower the scene with colorful confetti and streamers falling around the person, add festive party lights (bokeh circles in rainbow colors) in the background, include subtle party elements like a feathered mask silhouette or bunting flags at the top, apply a warm and joyful color grade with boosted vibrancy. Keep the person's face, body, and pose completely intact and recognizable.",
    cssFallbackHint:
      "saturate(1.5) brightness(1.1) contrast(1.1) hue-rotate(30deg)",
  },
};

// ──────────────────── Character Definitions ────────────────────

export type TouchpixCharacterId =
  | "superhero"
  | "astronaut"
  | "royalty"
  | "pirate"
  | "rockstar"
  | "fairy"
  | "dj"
  | "cyberpunk"
  | "medieval_knight"
  | "gatsby_guest"
  | "f1_driver"
  | "gourmet_chef"
  | "kpop_idol"
  | "pop_art"
  | "oil_portrait"
  | "steampunk_pilot"
  | "viking"
  | "anime_character"
  | "ninja"
  | "samurai"
  | "detective"
  | "explorer"
  | "wizard"
  | "cyber_elf"
  | "travel_blogger"
  | "toy_figurine"
  | "chibi_character"
  | "glamour_model"
  | "skater"
  | "pilot";

interface CharacterDefinition {
  label: string;
  promptDescription: string;
}

const CHARACTER_DEFINITIONS: Record<TouchpixCharacterId, CharacterDefinition> =
  {
    superhero: {
      label: "Superhero",
      promptDescription:
        "a powerful superhero wearing a vibrant skintight suit with a bold emblem on the chest, a flowing cape billowing behind them, standing in a heroic power pose on a city rooftop at sunset",
    },
    astronaut: {
      label: "Astronaut",
      promptDescription:
        "a space astronaut wearing a detailed white NASA-style spacesuit with a reflective visor helmet (visor open to show the face), floating weightlessly with Earth visible through a space station window behind them",
    },
    royalty: {
      label: "King / Queen",
      promptDescription:
        "a regal king or queen wearing luxurious royal robes of crimson velvet trimmed with ermine fur, a magnificent golden jeweled crown on their head, holding an ornate scepter, seated on an elaborate golden throne in a grand palace",
    },
    pirate: {
      label: "Pirate Captain",
      promptDescription:
        "a daring pirate captain wearing a weathered leather tricorn hat with a skull emblem, a long dramatic coat, standing at the helm of a grand wooden sailing ship with the Jolly Roger flag flying overhead and ocean waves crashing around",
    },
    rockstar: {
      label: "Rock Star",
      promptDescription:
        "an electrifying rock star on a massive concert stage, wearing a leather jacket covered in studs and patches, holding an iconic electric guitar mid-riff, surrounded by dramatic stage lighting with pyrotechnics and a roaring crowd in the background",
    },
    fairy: {
      label: "Magical Fairy",
      promptDescription:
        "a magical fairy with large iridescent butterfly wings that shimmer with rainbow light, wearing an elegant flowing dress made of flower petals, hovering above a moonlit enchanted garden with glowing mushrooms and twinkling fairy lights everywhere",
    },
    dj: {
      label: "Electronic DJ",
      promptDescription:
        "a professional electronic music DJ wearing cool headphones around the neck, standing behind a glowing high-tech Pioneer DJ deck and mixer setup in a premium nightclub with laser beams and dancing crowd in background",
    },
    cyberpunk: {
      label: "Cyberpunk Warrior",
      promptDescription:
        "a futuristic cyberpunk mercenary with glowing blue cybernetic implants on the face and arms, wearing a technical high-collar jacket, standing on a rainy neo-tokyo street filled with neon signs and flying vehicles",
    },
    medieval_knight: {
      label: "Medieval Knight",
      promptDescription:
        "a brave knight in detailed shining silver armor holding a sword, standing in a dreamy enchanted meadow next to an old stone castle",
    },
    gatsby_guest: {
      label: "Gatsby Guest 1920s",
      promptDescription:
        "a glamorous guest at a 1920s Gatsby party, wearing a black tuxedo or a sparkling flapper dress with pearl necklaces and a feathered headband, holding a champagne glass, gold art deco background pattern with warm luxury lighting",
    },
    f1_driver: {
      label: "F1 Driver",
      promptDescription:
        "a professional racing car driver wearing a detailed red racing suit covered in sponsor patches, holding a helmet under one arm, standing in the pit lane of a race track with garage and F1 car blurred in background",
    },
    gourmet_chef: {
      label: "Gourmet Chef",
      promptDescription:
        "a professional gourmet master chef wearing a clean double-breasted white chef jacket and a tall white chef hat, standing in a premium modern stainless steel restaurant kitchen preparing a beautifully plated dish",
    },
    kpop_idol: {
      label: "K-Pop Star",
      promptDescription:
        "a famous K-pop music idol performing on a massive stage under colorful spotlights and flashing purple neon lasers, wearing a highly stylish modern streetwear outfit with chains, shiny makeup, dynamic concert crowd in background",
    },
    pop_art: {
      label: "Pop Art Portrait",
      promptDescription:
        "a bold Andy Warhol-style pop art illustration using flat, highly saturated primary colors (bright red, yellow, blue, green), thick black comic-book outlines around the features, and a high-contrast posterized style",
    },
    oil_portrait: {
      label: "Oil Painting",
      promptDescription:
        "a classical renaissance oil painting portrait, showing rich brush strokes, fine canvas texture, warm Rembrandt-style chiascuro lighting, rich classical clothing, looking like a museum masterpiece",
    },
    steampunk_pilot: {
      label: "Steampunk Pilot",
      promptDescription:
        "a steampunk pilot wearing brass goggles, a leather vest with gears, standing on the deck of a wooden flying airship amidst high altitude clouds and mechanical details, warm brass and copper tones",
    },
    viking: {
      label: "Viking Warrior",
      promptDescription:
        "a rugged viking warrior with braided hair, wearing fur-lined leather armor, standing on the deck of a longship under a spectacular green aurora borealis sky with ocean waves crashing",
    },
    anime_character: {
      label: "Anime Hero",
      promptDescription:
        "a powerful 2D anime hero with spiky hair, wearing detailed combat robes, surrounded by an intense glowing blue energy aura, standing in a dynamic action pose in a fantasy valley landscape",
    },
    ninja: {
      label: "Shadow Ninja",
      promptDescription:
        "a stealthy ninja dressed in black, standing in a dynamic stance on a tiled rooftop of a traditional Japanese temple at night under a giant glowing full moon",
    },
    samurai: {
      label: "Noble Samurai",
      promptDescription:
        "a noble samurai warrior wearing detailed traditional armor, holding a katana, standing under a beautiful cherry blossom tree with falling pink petals in a serene Japanese garden",
    },
    detective: {
      label: "Noir Detective",
      promptDescription:
        "a classic film noir detective wearing a trench coat and fedora hat, standing under a dim street lamp on a rainy city street at night, moody cinematic lighting with dramatic shadows",
    },
    explorer: {
      label: "Jungle Explorer",
      promptDescription:
        "a brave jungle explorer wearing a khaki safari outfit, standing in front of a massive ancient stone temple hidden deep inside a lush green tropical rainforest with sunlight filtering through leaves",
    },
    wizard: {
      label: "Grand Wizard",
      promptDescription:
        "a powerful old wizard with a long white beard, wearing deep blue robes decorated with silver stars, holding a glowing magical wooden staff in a mystical stone library filled with ancient scrolls",
    },
    cyber_elf: {
      label: "Cyber Elf",
      promptDescription:
        "a high-tech cyber elf with pointed ears, wearing glowing holographic garments, standing in a magical bioluminescent futuristic garden under neon-colored alien trees",
    },
    travel_blogger: {
      label: "Travel Influencer",
      promptDescription:
        "a stylish travel blogger wearing fashionable sunglasses and summer outfit, standing on a luxury terrace in Santorini overlooking the deep blue Aegean sea at golden sunset",
    },
    toy_figurine: {
      label: "Action Figurine",
      promptDescription:
        "a vintage plastic action figure toy inside an unopened retro collector box with colorful packaging and retro brand logo, plastic glossy texture, toy store display lighting",
    },
    chibi_character: {
      label: "Chibi 3D Avatar",
      promptDescription:
        "a cute 3D chibi character with oversized head and big expressive eyes, wearing pastel-colored clothes, standing in a dreamy wonderland filled with candy canes, giant lollipops, and cotton candy clouds",
    },
    glamour_model: {
      label: "Fashion Runway Model",
      promptDescription:
        "a high-fashion supermodel walking down a premium fashion runway, flashing camera lights from photographers in the dark background, wearing an elegant designer outfit, haute couture aesthetic",
    },
    skater: {
      label: "Street Skater",
      promptDescription:
        "a cool urban skater doing a trick on a skateboard in a concrete skatepark at vibrant sunset, wearing streetwear, city buildings blurred in the background",
    },
    pilot: {
      label: "Airline Pilot",
      promptDescription:
        "a professional airline pilot wearing a classic dark blue uniform with gold stripes, standing on the airport runway at sunrise with a large commercial jet aircraft in the background",
    },
  };

// ──────────────────── Helpers ────────────────────

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const TOUCHPIX_AI_TIMEOUT_MS = 60_000;

async function ensureTouchpixAccess(
  fiestaId: string,
  accessToken?: string,
): Promise<void> {
  const authorized = await hasEntertainmentGuestAccess(
    fiestaId,
    "espejoMagicoIA",
    accessToken,
  );
  if (!authorized) throw new Error("Acceso de cabina IA no autorizado.");
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error("Evento no encontrado.");
  if (!getEntertainmentStationConfig(fiesta, "espejoMagicoIA").enabled) {
    throw new Error("La cabina IA esta desactivada.");
  }
}

/** Convert a File (from FormData) to a base64-encoded string. */
async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

/** Determine the MIME content type from a File, defaulting to image/jpeg. */
function resolveContentType(file: File): string {
  if (file.type && file.type.startsWith("image/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}

/** Validate an uploaded image file and return its base64 + content type. */
async function validateAndExtractImage(
  file: File | null,
  fieldName: string,
): Promise<
  | { ok: true; base64: string; contentType: string }
  | { ok: false; error: string }
> {
  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: `No se recibió un archivo válido en "${fieldName}".`,
    };
  }
  if (!file.type.startsWith("image/")) {
    return {
      ok: false,
      error: `El archivo "${fieldName}" no es una imagen válida.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      ok: false,
      error: `La imagen "${fieldName}" supera el límite de 10 MB.`,
    };
  }
  const base64 = await fileToBase64(file);
  const contentType = resolveContentType(file);
  return { ok: true, base64, contentType };
}

// ──────────────────── 1. Apply Theme ────────────────────

export interface ApplyThemeResult {
  success: boolean;
  imageBase64?: string;
  themeApplied?: boolean;
  cssFallbackHint?: string;
  error?: string;
}

export async function applyTouchpixTheme(
  formData: FormData,
): Promise<ApplyThemeResult> {
  const themeId = formData.get("themeId") as string;
  const fiestaId = formData.get("fiestaId") as string;
  const accessToken = formData.get("accessToken") as string | null;
  const file = formData.get("file") as File | null;

  // ── Validate inputs ──
  if (!themeId || !fiestaId) {
    return {
      success: false,
      error: "Faltan datos requeridos (themeId o fiestaId).",
    };
  }
  if (formData.get("consentAccepted") !== "true") {
    return {
      success: false,
      error: "Debes aceptar el procesamiento temporal con IA.",
    };
  }

  try {
    await ensureTouchpixAccess(fiestaId, accessToken || undefined);

    // Limitar a 3 generaciones por sesión/invitado.
    // Se utiliza el file como identidad de la sesión de foto.
    // Así se evita el bloqueo de estación y el invitado tiene su propio tope.
    const photoSessionId = formData.get("photoSessionId") as string | null;
    const guestIdentity = photoSessionId
      ? `touchpix-${fiestaId}-${photoSessionId}`
      : file
      ? `${file.name}-${file.size}`
      : `fiesta-${fiestaId}`;
    try {
      await enforcePublicRateLimit({
        scope: "touchpix-ai",
        identity: guestIdentity,
        limit: 3,
        windowMs: 15 * 60_000,
      });
    } catch (error: any) {
      if (error.message === "Rate limit exceeded") {
        return { success: false, error: "Límite de 3 intentos alcanzado para esta foto. Por favor, toma una nueva foto." };
      }
      return { success: false, error: error.message || "Sesión no autorizada." };
    }
  } catch (error: any) {
    return { success: false, error: error.message || "Sesion no autorizada." };
  }

  const theme = THEME_DEFINITIONS[themeId as TouchpixThemeId];
  if (!theme) {
    return { success: false, error: `Tema "${themeId}" no reconocido.` };
  }

  const extraction = await validateAndExtractImage(file, "file");
  if (!extraction.ok) {
    return { success: false, error: extraction.error };
  }

  const { base64, contentType } = extraction;
  logger.info(
    `[touchpix-ai] applyTouchpixTheme: theme=${themeId}, fiesta=${fiestaId}, size=${file!.size}`,
  );

  // ── Attempt AI generation ──
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn("[touchpix-ai] No API key configured — returning fallback.");
      return {
        success: true,
        imageBase64: base64,
        themeApplied: false,
        cssFallbackHint: theme.cssFallbackHint,
      };
    }

    const generatedImage = await generateGeminiImage({
      images: [{ base64, contentType }],
      prompt: [
        "Edit the provided event photo directly.",
        `Apply the "${theme.label}" visual treatment: ${theme.promptDescription}`,
        "Keep the same person fully recognizable: preserve their exact face, skin tone, hair, body proportions, expression, clothing, and pose.",
        "Only change the lighting, atmosphere, background, and artistic effects requested by the theme.",
        "Return one professional photorealistic image without text, logos, watermarks, or borders.",
      ].join("\n"),
      timeoutMs: TOUCHPIX_AI_TIMEOUT_MS,
    });

    if (generatedImage) {
      logger.info(
        `[touchpix-ai] Theme "${themeId}" applied successfully via AI.`,
      );
      return {
        success: true,
        imageBase64: generatedImage,
        themeApplied: true,
      };
    }

    // Model responded but didn't produce an image — fall back to CSS.
    logger.warn(
      `[touchpix-ai] Model did not return an image for theme "${themeId}". Using CSS fallback.`,
    );
    return {
      success: true,
      imageBase64: base64,
      themeApplied: false,
      cssFallbackHint: theme.cssFallbackHint,
    };
  } catch (err: any) {
    logger.error(
      `[touchpix-ai] applyTouchpixTheme error for theme "${themeId}":`,
      err?.message || err,
    );

    // Graceful degradation: return the original image so the user isn't stuck.
    return {
      success: true,
      imageBase64: base64,
      themeApplied: false,
      cssFallbackHint: theme.cssFallbackHint,
    };
  }
}

// ──────────────────── 2. Face Swap ────────────────────

export interface FaceSwapResult {
  success: boolean;
  imageBase64?: string;
  faceSwapApplied?: boolean;
  error?: string;
}

export async function applyFaceSwap(
  formData: FormData,
): Promise<FaceSwapResult> {
  const fiestaId = formData.get("fiestaId") as string;
  const accessToken = formData.get("accessToken") as string | null;
  const characterId = formData.get("characterId") as string | null;
  const sourceFile = formData.get("sourceFile") as File | null;
  const targetFile = formData.get("targetFile") as File | null;

  // ── Validate ──
  if (!fiestaId) {
    return { success: false, error: "Falta el ID de fiesta." };
  }
  if (formData.get("consentAccepted") !== "true") {
    return {
      success: false,
      error: "Debes aceptar el procesamiento temporal con IA.",
    };
  }

  try {
    await ensureTouchpixAccess(fiestaId, accessToken || undefined);
  } catch (error: any) {
    return { success: false, error: error.message || "Sesion no autorizada." };
  }

  const sourceExtraction = await validateAndExtractImage(
    sourceFile,
    "sourceFile",
  );
  if (!sourceExtraction.ok) {
    return { success: false, error: sourceExtraction.error };
  }

  const { base64: sourceBase64, contentType: sourceContentType } =
    sourceExtraction;

  // We need either a target image OR a character ID.
  const hasTargetFile =
    targetFile && targetFile instanceof File && targetFile.size > 0;
  const hasCharacterId = characterId && characterId in CHARACTER_DEFINITIONS;

  if (!hasTargetFile && !hasCharacterId) {
    return {
      success: false,
      error:
        "Se necesita una imagen de destino (targetFile) o un personaje (characterId).",
    };
  }

  logger.info(
    `[touchpix-ai] applyFaceSwap: fiesta=${fiestaId}, character=${characterId || "custom"}, hasTarget=${!!hasTargetFile}`,
  );

  // ── Attempt AI generation ──
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn(
        "[touchpix-ai] No API key configured — returning original image.",
      );
      return {
        success: true,
        imageBase64: sourceBase64,
        faceSwapApplied: false,
      };
    }

    const imageReferences = [
      { base64: sourceBase64, contentType: sourceContentType },
    ];
    let imagePrompt: string;

    if (hasTargetFile) {
      const targetExtraction = await validateAndExtractImage(
        targetFile,
        "targetFile",
      );
      if (!targetExtraction.ok) {
        return { success: false, error: targetExtraction.error };
      }
      imageReferences.push({
        base64: targetExtraction.base64,
        contentType: targetExtraction.contentType,
      });

      imagePrompt = [
        "Create one professional face-swap image using both references.",
        "The FIRST image is the identity reference: preserve that person's exact facial features, skin tone, expression, and proportions.",
        "The SECOND image is the scene reference: preserve its body, clothing, pose, background, framing, and lighting.",
        "Replace only the face in the second image with the face from the first image, blending angle, light, shadows, and skin naturally.",
        "Do not add text, logos, watermarks, borders, extra people, or distorted features.",
      ].join("\n");
    } else {
      const character =
        CHARACTER_DEFINITIONS[characterId as TouchpixCharacterId]!;
      imagePrompt = [
        "Use the provided photo as the identity reference.",
        `Create a professional photorealistic portrait of ${character.promptDescription}.`,
        "Preserve the person's exact recognizable face, skin tone, expression, and facial proportions from the reference image.",
        "Blend the face naturally into the new character, matching angle, perspective, lighting, and shadows.",
        "Do not add text, logos, watermarks, borders, extra people, or distorted features.",
      ].join("\n");
    }

    const generatedImage = await generateGeminiImage({
      images: imageReferences,
      prompt: imagePrompt,
      timeoutMs: TOUCHPIX_AI_TIMEOUT_MS,
    });

    if (generatedImage) {
      logger.info("[touchpix-ai] Face swap applied successfully via AI.");
      return {
        success: true,
        imageBase64: generatedImage,
        faceSwapApplied: true,
      };
    }

    // Model responded but didn't produce an image.
    logger.warn(
      "[touchpix-ai] Model did not return an image for face swap. Returning original.",
    );
    return {
      success: true,
      imageBase64: sourceBase64,
      faceSwapApplied: false,
    };
  } catch (err: any) {
    logger.error("[touchpix-ai] applyFaceSwap error:", err?.message || err);

    return {
      success: true,
      imageBase64: sourceBase64,
      faceSwapApplied: false,
    };
  }
}

// ──────────────────── 3. Upload Touchpix Photo ────────────────────

export interface UploadTouchpixResult {
  success: boolean;
  post?: any;
  error?: string;
}

export async function uploadTouchpixPhoto(
  formData: FormData,
): Promise<UploadTouchpixResult> {
  const fiestaId = formData.get("fiestaId") as string;
  const accessToken = formData.get("accessToken") as string | null;
  const authorName =
    (formData.get("authorName") as string) || "Cabina Touchpix";
  const file = formData.get("file") as File | null;
  const themeLabel = (formData.get("themeLabel") as string) || undefined;
  const characterLabel =
    (formData.get("characterLabel") as string) || undefined;

  if (!fiestaId || !file) {
    return {
      success: false,
      error: "Faltan datos para subir la foto (fiestaId o archivo).",
    };
  }

  try {
    await ensureTouchpixAccess(fiestaId, accessToken || undefined);
  } catch (error: any) {
    return { success: false, error: error.message || "Sesion no autorizada." };
  }

  logger.info(
    `[touchpix-ai] uploadTouchpixPhoto: fiesta=${fiestaId}, author=${authorName}`,
  );

  try {
    // Build a FormData that matches what uploadSocialPost expects, adding
    // the sourceModule and a descriptive dedication.
    const socialFormData = new FormData();
    socialFormData.set("fiestaId", fiestaId);
    socialFormData.set("file", file);
    socialFormData.set("authorName", authorName);
    socialFormData.set("momentTag", "touchpix");
    socialFormData.set("source", "entertainment");
    socialFormData.set("sourceModule", "espejoMagicoIA");
    socialFormData.set("moduleId", "espejoMagicoIA");
    if (accessToken) socialFormData.set("accessToken", accessToken);

    // Compose a dedication describing the transformation.
    const parts: string[] = ["📸 Touchpix AI"];
    if (themeLabel) parts.push(`🎨 Tema: ${themeLabel}`);
    if (characterLabel) parts.push(`🦸 Personaje: ${characterLabel}`);
    socialFormData.set("dedication", parts.join(" · "));

    const result = await uploadSocialPost(socialFormData);

    if (!result.success) {
      logger.warn("[touchpix-ai] uploadSocialPost failed:", result.error);
      return {
        success: false,
        error: result.error || "Error al publicar la foto en la galería.",
      };
    }

    logger.info(
      `[touchpix-ai] Photo uploaded successfully: postId=${result.post?.id}`,
    );
    return { success: true, post: result.post };
  } catch (err: any) {
    logger.error(
      "[touchpix-ai] uploadTouchpixPhoto error:",
      err?.message || err,
    );
    return { success: false, error: "Error inesperado al subir la foto." };
  }
}

// ──────────────────── Exports for client usage ────────────────────

/** Returns the list of available themes with their labels and IDs. */
export async function getTouchpixThemes(): Promise<
  Array<{ id: TouchpixThemeId; label: string; cssFallbackHint: string }>
> {
  return (
    Object.entries(THEME_DEFINITIONS) as [TouchpixThemeId, ThemeDefinition][]
  ).map(([id, def]) => ({
    id,
    label: def.label,
    cssFallbackHint: def.cssFallbackHint,
  }));
}

/** Returns the list of available characters with their labels and IDs. */
export async function getTouchpixCharacters(): Promise<
  Array<{ id: TouchpixCharacterId; label: string }>
> {
  return (
    Object.entries(CHARACTER_DEFINITIONS) as [
      TouchpixCharacterId,
      CharacterDefinition,
    ][]
  ).map(([id, def]) => ({
    id,
    label: def.label,
  }));
}
