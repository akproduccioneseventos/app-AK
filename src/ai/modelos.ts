/**
 * Única fuente de verdad para los modelos oficiales de Google Gemini por tarea,
 * ordenados del más nuevo al más viejo.
 *
 * Reglas:
 * - `gemini-4-hydrogen` va primero en la lista de texto porque es el único Gemini 4 con capa gratis.
 * - Prohibido agregar modelos pagos (Carbon, Argon, Neon) o activar Google Search grounding pago.
 */
export const MODELOS_GEMINI = {
  texto: [
    'googleai/gemini-4-hydrogen',
    'googleai/gemini-flash-latest',
    'googleai/gemini-3.8-flash',
    'googleai/gemini-3.6-flash',
    'googleai/gemini-2.5-flash',
  ],
  profundo: [
    'googleai/gemini-pro-latest',
    'googleai/gemini-flash-latest',
    'googleai/gemini-3.8-flash',
  ],
  imagen: [
    'gemini-3.1-flash-image',
  ],
  voz: [
    'gemini-3.8-flash-tts',
    'gemini-2.5-flash-preview-tts',
  ],
  enVivo: [
    'gemini-3.8-live',
    'gemini-2.5-flash-native-audio-preview-12-2025',
  ],
} as const;

export const DEFAULT_GEMINI_LATEST_MODEL = 'googleai/gemini-flash-latest';
export const DEFAULT_GEMINI_MODEL = DEFAULT_GEMINI_LATEST_MODEL;
export const DEFAULT_GEMINI_PRO_MODEL = MODELOS_GEMINI.profundo[0];
/** Primer respaldo si el atajo "latest" no responde: modelo rápido estable. */
export const DEFAULT_GEMINI_PRO_FALLBACK_MODEL = DEFAULT_GEMINI_LATEST_MODEL;

export const DEFAULT_GEMINI_FALLBACK_MODELS = [
  'googleai/gemini-flash-latest',
  'googleai/gemini-3.8-flash',
  'googleai/gemini-3.6-flash',
  'googleai/gemini-2.5-flash',
] as const;

export const MODELOS_TEXTO_POR_OMISION = MODELOS_GEMINI.texto;
export const MODELOS_IMAGEN_POR_OMISION = MODELOS_GEMINI.imagen;
export const MODELOS_VOZ_POR_OMISION = MODELOS_GEMINI.voz;
export const MODELOS_EN_VIVO_POR_OMISION = MODELOS_GEMINI.enVivo;

export const GEMINI_MODEL_PATTERN = /^googleai\/gemini-[a-z0-9]+(?:[.-][a-z0-9]+)*$/i;

/**
 * Detecta si el error indica que el modelo no existe o fue retirado por Google
 * (404, not found, model not found, retired, deprecated, no existe).
 */
export function esErrorModeloRetirado(error: unknown): boolean {
  const candidate = error as { status?: number; code?: number | string; message?: string };
  const status = Number(candidate?.status || candidate?.code);
  const message = String(candidate?.message || error || '').toLowerCase();

  return (
    status === 404 ||
    /(?:model.+(?:not found|retired|deprecated|unavailable|does not exist|no existe)|not[_\s]+found|is not found|no existe|retired|deprecated|modelo.*retirado)/i.test(
      message,
    )
  );
}

/**
 * Detecta errores de cuota, saldo o límite de tasa en la API de Gemini.
 */
export function esErrorCuotaIA(error: unknown): boolean {
  const candidate = error as { status?: number; code?: number | string; message?: string };
  const status = Number(candidate?.status || candidate?.code);
  const message = String(candidate?.message || error || '').toLowerCase();

  return (
    status === 402 ||
    status === 429 ||
    /(?:resource_exhausted|payment required|out of credit|saldo|quota|rate limit|too many requests)/i.test(message)
  );
}

/**
 * Indica si conviene reintentar con el siguiente modelo de respaldo
 * (modelo retirado, sin cuota/saldo o falla transitoria del proveedor).
 */
export function isRecoverableGeminiModelError(error: unknown): boolean {
  const candidate = error as { status?: number; code?: number | string; message?: string };
  const status = Number(candidate?.status || candidate?.code);
  const message = String(candidate?.message || error || '').toLowerCase();

  return (
    esErrorModeloRetirado(error) ||
    esErrorCuotaIA(error) ||
    [408, 500, 502, 503, 504].includes(status) ||
    /(overloaded|capacity|deadline exceeded|temporarily unavailable|unavailable)/i.test(message)
  );
}
