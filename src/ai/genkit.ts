import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { AkAgentType } from '@/types/multiagent';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const DEFAULT_GEMINI_MODEL = 'googleai/gemini-2.5-flash';
const DEFAULT_GEMINI_PRO_MODEL = 'googleai/gemini-2.5-pro';
const GEMINI_MODEL_PATTERN = /^googleai\/gemini-[a-z0-9]+(?:[.-][a-z0-9]+)*$/i;

type GeminiModelRole = 'default' | 'fast' | 'pro' | 'marketing' | 'commercial';

type GeminiGenerationConfig = {
  temperature: number;
};

const configuredGeminiModel = process.env.GEMINI_MODEL?.trim();

function resolveGeminiModel(value: string | undefined, fallback: string, label: GeminiModelRole): string {
  const configured = value?.trim();
  if (!configured) return fallback;
  if (GEMINI_MODEL_PATTERN.test(configured)) return configured;

  console.warn(`[Genkit] Advertencia: ${label}="${configured}" no es válido o no está soportado. Usando fallback "${fallback}".`);
  return fallback;
}

export const geminiModel = resolveGeminiModel(configuredGeminiModel, DEFAULT_GEMINI_MODEL, 'default');
export const geminiFastModel = resolveGeminiModel(process.env.GEMINI_MODEL_FAST, geminiModel, 'fast');
export const geminiProModel = resolveGeminiModel(process.env.GEMINI_MODEL_PRO, DEFAULT_GEMINI_PRO_MODEL, 'pro');
export const geminiMarketingModel = resolveGeminiModel(process.env.GEMINI_MODEL_MARKETING, geminiFastModel, 'marketing');
export const geminiCommercialModel = resolveGeminiModel(process.env.GEMINI_MODEL_COMMERCIAL, geminiFastModel, 'commercial');

export function getGeminiModelForAgent(agentType?: AkAgentType, options?: { deep?: boolean }): string {
  if (options?.deep) return geminiProModel;
  if (agentType === 'marketing') return geminiMarketingModel;
  if (agentType === 'comercial') return geminiCommercialModel;
  if (agentType === 'fiestas_general' || agentType === 'contable') return geminiProModel;
  return geminiFastModel;
}

export function getGeminiGenerationConfigForAgent(agentType?: AkAgentType, options?: { deep?: boolean }): GeminiGenerationConfig {
  if (agentType === 'marketing') return { temperature: 0.7 };
  if (agentType === 'comercial') return { temperature: 0.3 };
  if (options?.deep || agentType === 'fiestas_general' || agentType === 'contable') return { temperature: 0.15 };
  return { temperature: 0.2 };
}

if (!apiKey) {
  console.warn('[Genkit] Advertencia: No se encontró GOOGLE_API_KEY ni GEMINI_API_KEY. El Asistente AK no funcionará hasta que se configure la API key.');
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : {}),
  ],
});
