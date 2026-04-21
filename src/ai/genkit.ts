import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'googleai/gemini-2.5-flash';
const GEMINI_MODEL_PATTERN = /^googleai\/gemini-[a-z0-9.-]+$/i;

const configuredGeminiModel = process.env.GEMINI_MODEL?.trim();

export const geminiModel = configuredGeminiModel
  ? GEMINI_MODEL_PATTERN.test(configuredGeminiModel)
    ? configuredGeminiModel
    : DEFAULT_GEMINI_MODEL
  : DEFAULT_GEMINI_MODEL;

if (!apiKey) {
  console.warn('[Genkit] Advertencia: No se encontró GOOGLE_API_KEY ni GEMINI_API_KEY. El Asistente AK no funcionará hasta que se configure la API key.');
}
if (configuredGeminiModel && !GEMINI_MODEL_PATTERN.test(configuredGeminiModel)) {
  console.warn(`[Genkit] Advertencia: GEMINI_MODEL="${configuredGeminiModel}" no es válido o no está soportado. Usando fallback "${DEFAULT_GEMINI_MODEL}".`);
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : {}),
  ],
});
