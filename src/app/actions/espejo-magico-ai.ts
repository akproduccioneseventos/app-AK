"use server";

import { getFiestaById } from "@/app/actions/fiesta/fiesta.actions";
import { hasEntertainmentGuestAccess } from "@/lib/auth/entertainment-token";
import { getEntertainmentStationConfig } from "@/lib/entertainment/station-config";
import { generateGeminiImage } from "@/lib/ai/gemini-image";
import * as logger from "@/lib/logger";

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import {
  ESPEJO_TEMPLATES,
  FACESWAP_CATEGORIES,
  type FaceSwapCategoryId,
  type CategoryDefinition,
  type EspejoTemplateDefinition,
} from '@/lib/entertainment/espejo-magico-templates';

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

    // Limitar a 3 generaciones por sesión/invitado.
    // Se utiliza el sourceFile como identidad de la sesión de foto.
    // Así se evita el bloqueo de estación y el invitado tiene su propio tope.
    const photoSessionId = formData.get("photoSessionId") as string | null;
    const guestIdentity = photoSessionId
      ? `espejo-${fiestaId}-${photoSessionId}`
      : sourceFile
      ? `${sourceFile.name}-${sourceFile.size}`
      : `fiesta-${fiestaId}`;
    try {
      await enforcePublicRateLimit({
        scope: "espejo-magico-ai",
        identity: guestIdentity,
        limit: 3,
        windowMs: 15 * 60_000,
      });

      // Red de contencion por estacion.
      //
      // El tope de arriba cuenta por sesion de foto, y la sesion se renueva
      // cuando el invitado se saca una foto nueva. Eso esta bien: el que
      // vuelve a posar merece elegir de nuevo. Pero tambien deja la puerta
      // abierta a que alguien se quede parado ahi repitiendo el ciclo toda la
      // noche, y cada generacion se paga.
      //
      // Este segundo tope esta muy por encima del uso normal: una estacion no
      // llega a atender ni cuarenta personas por hora, asi que 150 no molesta
      // a nadie que este usandola de verdad. Solo corta el abuso.
      await enforcePublicRateLimit({
        scope: "espejo-magico-ai-estacion",
        identity: `fiesta-${fiestaId}`,
        limit: 150,
        windowMs: 60 * 60_000,
      });
    } catch (error: any) {
      if (error.message === "Rate limit exceeded") {
        return { success: false, error: "Límite de 3 intentos alcanzado para esta foto. Por favor, toma una nueva foto." };
      }
      return { success: false, error: error.message || "Sesión no autorizada." };
    }
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
