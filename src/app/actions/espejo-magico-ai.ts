"use server";

import { getFiestaById } from "@/app/actions/fiesta/fiesta.actions";
import { hasEntertainmentGuestAccess } from "@/lib/auth/entertainment-token";
import { getEntertainmentStationConfig } from "@/lib/entertainment/station-config";
import { generateGeminiImage } from "@/lib/ai/gemini-image";
import * as logger from "@/lib/logger";

type FaceSwapCategoryId =
  | "showbiz"
  | "cinema"
  | "fantasy"
  | "corporate"
  | "fun";

interface CategoryDefinition {
  id: FaceSwapCategoryId;
  label: string;
  emoji: string;
}

const FACESWAP_CATEGORIES: CategoryDefinition[] = [
  { id: "showbiz", label: "Estrellas & Farándula", emoji: "🌟" },
  { id: "cinema", label: "Cine & Acción", emoji: "🎬" },
  { id: "fantasy", label: "Fantasía e Historia", emoji: "🏰" },
  { id: "corporate", label: "Estilo de Vida & Pro", emoji: "👔" },
  { id: "fun", label: "Divertidos & Niños", emoji: "🤪" },
];

interface EspejoTemplateDefinition {
  id: string;
  categoryId: FaceSwapCategoryId;
  label: string;
  promptDescription: string;
  previewUrl?: string; // Curated royalty-free fallback representations
}

const ESPEJO_TEMPLATES: Record<string, EspejoTemplateDefinition> = {
  // Estrellas & farandula
  kpop_stars: {
    id: "kpop_stars",
    categoryId: "showbiz",
    label: "K-Pop Star",
    promptDescription:
      "a famous K-pop music idol performing on a massive stage under colorful spotlights and flashing purple neon lasers, wearing a highly stylish modern streetwear outfit with chains, shiny makeup, dynamic concert crowd in background",
  },
  rockstar: {
    id: "rockstar",
    categoryId: "showbiz",
    label: "Rock Star",
    promptDescription:
      "an electrifying rock star on stage, wearing a black studded leather jacket and distressed jeans, holding a vintage electric guitar, surrounded by smoke machines, warm backlighting, and a roaring concert audience",
  },
  pop_idol: {
    id: "pop_idol",
    categoryId: "showbiz",
    label: "Pop Icon",
    promptDescription:
      "a glamorous pop music icon dancing under glittering disco ball reflections, wearing a sparkling metallic silver outfit, holding a glowing wireless microphone, bokeh light circles in background",
  },
  dj_premium: {
    id: "dj_premium",
    categoryId: "showbiz",
    label: "DJ Set Club",
    promptDescription:
      "a professional electronic music DJ wearing cool headphones around the neck, standing behind a glowing high-tech Pioneer DJ deck and mixer setup in a premium nightclub with laser beams and dancing crowd in background",
  },

  // Cine & accion
  movie_poster: {
    id: "movie_poster",
    categoryId: "cinema",
    label: "Afiche de Cine",
    promptDescription:
      "a heroic protagonist inside an epic action movie poster billboard, dramatic orange fire and blue sparks explosion in the background, debris flying, cinematic high contrast lighting, movie title text overlay simulated at the bottom",
  },
  superhero: {
    id: "superhero",
    categoryId: "cinema",
    label: "Superhéroe",
    promptDescription:
      "a powerful superhero wearing a detailed high-tech metallic skintight suit with a glowing emblem on the chest, a long cape flowing dramatically in the wind, standing in a heroic power pose on a skyscraper rooftop overlooking a city skyline at sunset",
  },
  secret_agent: {
    id: "secret_agent",
    categoryId: "cinema",
    label: "Agente Secreto",
    promptDescription:
      "a sophisticated secret agent wearing a classic tailored black tuxedo or an elegant evening gown, standing in a high-tech modern glass building looking over a city at night, holding a prop, James Bond aesthetic",
  },
  cyberpunk_warrior: {
    id: "cyberpunk_warrior",
    categoryId: "cinema",
    label: "Guerrero Cyberpunk",
    promptDescription:
      "a futuristic cyberpunk mercenary with glowing blue cybernetic implants on the face and arms, wearing a technical high-collar jacket, standing on a rainy neo-tokyo street filled with neon signs and flying vehicles",
  },

  // Fantasia e historia
  medieval_legends: {
    id: "medieval_legends",
    categoryId: "fantasy",
    label: "Caballero / Hada",
    promptDescription:
      "a legendary medieval figure: either a brave knight in detailed shining silver armor holding a sword, or a magical fairy with iridescent wings, standing in a dreamy enchanted meadow next to an old stone castle",
  },
  royalty: {
    id: "royalty",
    categoryId: "fantasy",
    label: "Regal / Realeza",
    promptDescription:
      "a grand royal king or queen wearing heavy red velvet robes trimmed with luxurious white fur, a magnificent golden crown adorned with rubies and emeralds, holding a royal scepter, sitting on a massive carved golden throne inside a grand castle hall",
  },
  gatsby_1920s: {
    id: "gatsby_1920s",
    categoryId: "fantasy",
    label: "Gran Gatsby 1920s",
    promptDescription:
      "a glamorous guest at a 1920s Gatsby party, wearing a black tuxedo or a sparkling flapper dress with pearl necklaces and a feathered headband, holding a champagne glass, gold art deco background pattern with warm luxury lighting",
  },
  pirate_captain: {
    id: "pirate_captain",
    categoryId: "fantasy",
    label: "Capitán Pirata",
    promptDescription:
      "a pirate captain wearing a weathered leather tricorn hat, a long dramatic coat, standing at the wooden helm of a grand pirate ship with the ocean waves crashing around and a dark storm brewing in the background",
  },
  oil_painting: {
    id: "oil_painting",
    categoryId: "fantasy",
    label: "Pintura al Óleo",
    promptDescription:
      "a classical renaissance oil painting portrait, showing rich brush strokes, fine canvas texture, warm Rembrandt-style chiascuro lighting, rich classical clothing, making the person look like a masterpiece hanging in a museum",
  },

  // Estilo de vida & pro
  space_commander: {
    id: "space_commander",
    categoryId: "corporate",
    label: "Astronauta",
    promptDescription:
      "a space commander wearing a detailed white NASA spacesuit with patches, helmet visor open to reveal the face, floating in zero gravity inside a space station cockpit with planet Earth visible through the window behind them",
  },
  master_chef: {
    id: "master_chef",
    categoryId: "corporate",
    label: "Master Chef",
    promptDescription:
      "a professional gourmet master chef wearing a clean double-breasted white chef jacket and a tall white chef hat, standing in a premium modern stainless steel restaurant kitchen preparing a beautifully plated dish",
  },
  linkedin_premium: {
    id: "linkedin_premium",
    categoryId: "corporate",
    label: "LinkedIn Premium",
    promptDescription:
      "a confident professional wearing a smart tailored blazer and crisp white shirt, standing in a modern sunlit corporate office building, warm professional corporate headshot photography",
  },
  f1_driver: {
    id: "f1_driver",
    categoryId: "corporate",
    label: "Piloto de F1",
    promptDescription:
      "a professional racing car driver wearing a detailed red racing suit covered in sponsor patches, holding a helmet under one arm, standing in the pit lane of a race track with garage and F1 car blurred in background",
  },

  // Divertidos & ninos
  tiny_pirate: {
    id: "tiny_pirate",
    categoryId: "fun",
    label: "Pequeño Pirata",
    promptDescription:
      "a cute cartoon pirate character wearing an oversized floppy pirate hat with a friendly skull illustration, standing next to a wooden treasure chest filled with gold coins on a bright sunny tropical beach, fun friendly cartoon style",
  },
  cartoon_3d: {
    id: "cartoon_3d",
    categoryId: "fun",
    label: "Avatar 3D Pixar",
    promptDescription:
      "a highly expressive 3D cartoon character in the style of a modern animated movie, clean rendering, soft lighting, friendly features, vibrant colorful clothing, standing in a cheerful fantasy park background",
  },
  classic_comic: {
    id: "classic_comic",
    categoryId: "fun",
    label: "Pop Art Comic",
    promptDescription:
      "a classic comic book illustration with bold black outlines, high contrast pop art colors (bright cyan, yellow, magenta), retro dot halftone pattern background, speech bubble next to the person with party sparkles",
  },
  supermodel: {
    id: "supermodel",
    categoryId: "showbiz",
    label: "Supermodelo Pasarela",
    promptDescription:
      "a high-fashion supermodel walking down a premium fashion runway, flashing camera lights from photographers in the dark background, wearing an elegant designer outfit, haute couture aesthetic",
  },
  rock_legend: {
    id: "rock_legend",
    categoryId: "showbiz",
    label: "Leyenda del Rock",
    promptDescription:
      "a legendary rock singer performing live on a huge stadium stage with dramatic red and orange spotlights, pyrotechnics fire erupting, holding a vintage microphone stand, massive cheering crowd in background",
  },
  steampunk_explorer: {
    id: "steampunk_explorer",
    categoryId: "cinema",
    label: "Viajero Steampunk",
    promptDescription:
      "a steampunk explorer wearing brass goggles, a leather vest with gears, standing on the deck of a wooden flying airship amidst high altitude clouds and mechanical details, warm brass and copper tones",
  },
  anime_hero: {
    id: "anime_hero",
    categoryId: "cinema",
    label: "Héroe Anime",
    promptDescription:
      "a powerful 2D anime hero with spiky hair, wearing detailed combat robes, surrounded by an intense glowing blue energy aura, standing in a dynamic action pose in a fantasy valley landscape",
  },
  cyber_elf: {
    id: "cyber_elf",
    categoryId: "fantasy",
    label: "Elfo Cyberpunk",
    promptDescription:
      "a high-tech cyber elf with pointed ears, wearing glowing holographic garments, standing in a magical bioluminescent futuristic garden under neon-colored alien trees",
  },
  viking_warrior: {
    id: "viking_warrior",
    categoryId: "fantasy",
    label: "Guerrero Vikingo",
    promptDescription:
      "a rugged viking warrior with braided hair, wearing fur-lined leather armor, standing on the deck of a longship under a spectacular green aurora borealis sky with ocean waves crashing",
  },
  silicon_founder: {
    id: "silicon_founder",
    categoryId: "corporate",
    label: "Presentador Tech",
    promptDescription:
      "a confident tech founder giving a keynote presentation on a modern stage, wearing a smart casual blazer and t-shirt, warm stage lighting, large presentation screen blurred in the background",
  },
  influencer_travel: {
    id: "influencer_travel",
    categoryId: "corporate",
    label: "Influencer Viajes",
    promptDescription:
      "a stylish travel blogger wearing fashionable sunglasses and summer outfit, standing on a luxury terrace in Santorini overlooking the deep blue Aegean sea at golden sunset",
  },
  plastic_toy: {
    id: "plastic_toy",
    categoryId: "fun",
    label: "Muñeco de Acción",
    promptDescription:
      "a vintage plastic action figure toy inside an unopened retro collector box with colorful packaging and retro brand logo, plastic glossy texture, toy store display lighting",
  },
  chibi_avatar: {
    id: "chibi_avatar",
    categoryId: "fun",
    label: "Avatar Chibi 3D",
    promptDescription:
      "a cute 3D chibi character with oversized head and big expressive eyes, wearing pastel-colored clothes, standing in a dreamy wonderland filled with candy canes, giant lollipops, and cotton candy clouds",
  },
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const ESPEJO_AI_TIMEOUT_MS = 60_000;

async function ensureEspejoAccess(
  fiestaId: string,
  accessToken?: string,
): Promise<void> {
  const authorized = await hasEntertainmentGuestAccess(
    fiestaId,
    "espejoMagicoIA",
    accessToken,
  );
  if (!authorized)
    throw new Error("Acceso de cabina Face Swap IA no autorizado.");
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error("Evento no encontrado.");
  if (!getEntertainmentStationConfig(fiesta, "espejoMagicoIA").enabled) {
    throw new Error("La cabina Face Swap IA esta desactivada.");
  }
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

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
/**
 * Dice si la transformacion con IA esta realmente disponible.
 *
 * Existe por un problema de fiesta: sin clave configurada, la estacion no
 * fallaba, devolvia la foto original y decia apenas "modo prueba". El invitado
 * elegia "Superheroe", posaba, y se llevaba su foto comun. Nadie del equipo se
 * enteraba hasta que alguien se quejaba, en plena fiesta y sin margen para
 * arreglarlo. Con esto el operador lo sabe antes de que llegue el primero.
 */
export async function isEspejoIaDisponible(): Promise<{ disponible: boolean }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  return { disponible: Boolean(apiKey) };
}

export async function applyEspejoFaceSwap(
  formData: FormData,
): Promise<FaceSwapResult> {
  const fiestaId = formData.get("fiestaId") as string;
  const accessToken = formData.get("accessToken") as string | null;
  const templateId = formData.get("templateId") as string | null;
  const sourceFile = formData.get("sourceFile") as File | null;

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
    await ensureEspejoAccess(fiestaId, accessToken || undefined);
  } catch (error: any) {
    return { success: false, error: error.message || "Sesión no autorizada." };
  }

  const template = templateId ? ESPEJO_TEMPLATES[templateId] : null;
  if (!template) {
    return {
      success: false,
      error: "Debe seleccionar una plantilla de Face Swap IA válida.",
    };
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
  logger.info(
    `[espejo-magico-ai] applyEspejoFaceSwap: template=${templateId}, fiesta=${fiestaId}`,
  );

  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn(
        "[espejo-magico-ai] No API key configured — returning original.",
      );
      return {
        success: true,
        imageBase64: sourceBase64,
        faceSwapApplied: false,
      };
    }

    const transformedBase64 = await generateGeminiImage({
      images: [{ base64: sourceBase64, contentType: sourceContentType }],
      prompt: [
        "Use the provided event photo as the identity reference.",
        `Create one professional photorealistic portrait of ${template.promptDescription}.`,
        "Preserve the person's exact recognizable face, skin tone, expression, and facial proportions from the reference image.",
        "Blend the face naturally into the new character, matching angle, perspective, lighting, and shadows.",
        "Do not add text, logos, watermarks, borders, extra people, or distorted features.",
      ].join("\n"),
      timeoutMs: ESPEJO_AI_TIMEOUT_MS,
    });
    if (!transformedBase64) {
      throw new Error("El modelo de IA no devolvió una imagen válida.");
    }

    return {
      success: true,
      imageBase64: transformedBase64,
      faceSwapApplied: true,
    };
  } catch (error: any) {
    logger.error("[espejo-magico-ai] error during applyEspejoFaceSwap:", error);
    return {
      success: false,
      error:
        error.message ||
        "Error al procesar el Face Swap con Inteligencia Artificial.",
    };
  }
}
