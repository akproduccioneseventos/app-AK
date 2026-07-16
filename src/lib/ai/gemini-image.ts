import "server-only";

const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";
const GEMINI_IMAGE_API_BASE =
  "https://generativelanguage.googleapis.com/v1/models";

export interface GeminiImageReference {
  base64: string;
  contentType: string;
}

interface GenerateGeminiImageOptions {
  prompt: string;
  images: GeminiImageReference[];
  aspectRatio?: string;
  imageSize?: "512" | "1K" | "2K" | "4K";
  timeoutMs?: number;
}

function resolveImageModel(): string {
  const configured = (
    process.env.GEMINI_IMAGE_EDIT_MODEL ||
    process.env.GEMINI_IMAGE_MODEL ||
    ""
  )
    .trim()
    .replace(/^googleai\//, "")
    .replace(/^models\//, "");

  if (!configured || configured.toLowerCase().includes("imagen")) {
    return DEFAULT_GEMINI_IMAGE_MODEL;
  }

  if (!/^[a-z0-9._-]+$/i.test(configured)) {
    throw new Error("El modelo de imagen configurado no es valido.");
  }

  return configured;
}

export async function generateGeminiImage({
  prompt,
  images,
  aspectRatio = "3:4",
  imageSize = "1K",
  timeoutMs = 60_000,
}: GenerateGeminiImageOptions): Promise<string | null> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta configurar la clave de Gemini.");
  if (!images.length)
    throw new Error("Se necesita al menos una imagen de referencia.");

  const model = resolveImageModel();
  const response = await fetch(
    `${GEMINI_IMAGE_API_BASE}/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              ...images.map((image) => ({
                inlineData: {
                  mimeType: image.contentType,
                  data: image.base64,
                },
              })),
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE"],
          responseFormat: {
            image: {
              aspectRatio,
              imageSize,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `Gemini no pudo generar la imagen (HTTP ${response.status})${detail ? `: ${detail}` : "."}`,
    );
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string };
          inline_data?: { data?: string };
        }>;
      };
    }>;
  };

  for (const candidate of result.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const base64 = part.inlineData?.data || part.inline_data?.data;
      if (base64) return base64;
    }
  }

  return null;
}
