import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[Genkit] Advertencia: No se encontró GOOGLE_API_KEY ni GEMINI_API_KEY. El Asistente AK no funcionará hasta que se configure la API key.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey }),
  ],
});
