/**
 * Única fuente de verdad para las direcciones HTTP y WebSocket de Google Gemini.
 *
 * Sin `import 'server-only'` porque también lo usan utilidades compartidas o
 * importadas en el cliente (por ejemplo `voz-en-vivo.ts`).
 */

export const GEMINI_IMAGE_API_BASE = 'https://generativelanguage.googleapis.com/v1/models';

export const GEMINI_DECISIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/decisions';

export const GEMINI_FILES_PREFIX = 'https://generativelanguage.googleapis.com/';

function limpiarNombreModelo(modelo: string): string {
  return (modelo || '').trim().replace(/^googleai\//, '').replace(/^models\//, '');
}

export function construirUrlModeloV1Beta(modelo: string): string {
  const limpio = limpiarNombreModelo(modelo);
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(limpio)}:generateContent`;
}

export function construirUrlFichaVozEnVivo(apiKey: string, version = 'v1beta'): string {
  return `https://generativelanguage.googleapis.com/${version}/auth_tokens?key=${encodeURIComponent(apiKey)}`;
}

export function construirUrlSocketVozEnVivo(ficha: string, version = 'v1beta'): string {
  return (
    `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.${version}` +
    `.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(ficha)}`
  );
}
