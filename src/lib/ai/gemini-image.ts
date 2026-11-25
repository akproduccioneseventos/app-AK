import "server-only";

import { pedirImagen } from "@/ai/cerebro";
import type { FuncionConCosto } from "@/lib/ai/consumo";

export interface GeminiImageReference {
  base64: string;
  contentType: string;
}

interface GenerateGeminiImageOptions {
  prompt: string;
  images?: GeminiImageReference[];
  aspectRatio?: string;
  imageSize?: "512" | "1K" | "2K" | "4K";
  timeoutMs?: number;
  quien?: FuncionConCosto;
}

function resolveConfiguredImageModels(): string[] | undefined {
  const configured = (
    process.env.GEMINI_IMAGE_EDIT_MODEL ||
    process.env.GEMINI_IMAGE_MODEL ||
    ""
  )
    .trim()
    .replace(/^googleai\//, "")
    .replace(/^models\//, "");

  if (
    !configured ||
    configured.toLowerCase().includes("imagen") ||
    configured.toLowerCase().includes("preview")
  ) {
    return undefined;
  }

  if (!/^[a-z0-9._-]+$/i.test(configured)) {
    throw new Error("El modelo de imagen configurado no es valido.");
  }

  return [configured];
}

export async function generateGeminiImage({
  prompt,
  images = [],
  aspectRatio = "3:4",
  imageSize = "1K",
  timeoutMs = 60_000,
  quien,
}: GenerateGeminiImageOptions): Promise<string | null> {
  const modelos = resolveConfiguredImageModels();
  const consumoYaGestionado = quien === undefined;
  const res = await pedirImagen({
    prompt,
    images,
    aspectRatio,
    imageSize,
    timeoutMs,
    consumoYaGestionado,
    ...(modelos ? { modelos } : {}),
    ...(quien ? { quien } : {}),
  });

  if (!res.ok) {
    throw new Error(res.error || "Gemini no pudo generar la imagen.");
  }

  return res.base64;
}
