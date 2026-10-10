import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { AkAgentType } from '@/types/multiagent';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

/**
 * Modelos oficiales de Google Gemini (Verificados: 22 de agosto de 2026).
 *
 * 1. gemini-flash-latest: Atajo oficial de Google que apunta siempre a la última
 *    versión estable de Gemini Flash. Se actualiza solo sin tocar código.
 * 2. gemini-2.5-pro: Modelo con capacidad de razonamiento profundo para análisis
 *    comercial, presupuestos complejos y planificación.
 */
export const DEFAULT_GEMINI_LATEST_MODEL = 'googleai/gemini-flash-latest';
export const DEFAULT_GEMINI_MODEL = 'googleai/gemini-flash-latest';
export const DEFAULT_GEMINI_PRO_MODEL = 'googleai/gemini-pro-latest';
/** Primer respaldo del modelo profundo: si el atajo "latest" no responde, se prueba éste. */
export const DEFAULT_GEMINI_PRO_FALLBACK_MODEL = 'googleai/gemini-2.5-pro';

// Sin el 1.5 flash: Google lo retiró y sólo agregaba un intento que siempre fallaba.
const DEFAULT_GEMINI_FALLBACK_MODELS = [
  DEFAULT_GEMINI_LATEST_MODEL,
  'googleai/gemini-2.5-flash',
  'googleai/gemini-2.0-flash',
] as const;

const GEMINI_MODEL_PATTERN = /^googleai\/gemini-[a-z0-9]+(?:[.-][a-z0-9]+)*$/i;

type GeminiModelRole = 'default' | 'fast' | 'pro' | 'marketing' | 'commercial';
type GeminiGenerationConfig = { maxOutputTokens: number };

const configuredGeminiModel = process.env.GEMINI_MODEL?.trim();

function resolveGeminiModel(value: string | undefined, fallback: string, label: GeminiModelRole): string {
  const configured = value?.trim();
  if (!configured) return fallback;
  if (GEMINI_MODEL_PATTERN.test(configured)) return configured;

  console.warn(`[Genkit] Advertencia: ${label}="${configured}" no es válido o no está soportado. Usando fallback "${fallback}".`);
  return fallback;
}

export const geminiModel = resolveGeminiModel(configuredGeminiModel, DEFAULT_GEMINI_MODEL, 'default');
export const geminiLatestModel = resolveGeminiModel(process.env.GEMINI_MODEL_LATEST, DEFAULT_GEMINI_LATEST_MODEL, 'default');
// Rápido y profundo se eligen por variable de entorno (GEMINI_MODEL_RAPIDO / GEMINI_MODEL_PROFUNDO);
// los nombres viejos (_FAST / _PRO) siguen andando para no romper un despliegue ya configurado.
export const geminiFastModel = resolveGeminiModel(process.env.GEMINI_MODEL_RAPIDO || process.env.GEMINI_MODEL_FAST, geminiLatestModel, 'fast');
export const geminiProModel = resolveGeminiModel(process.env.GEMINI_MODEL_PROFUNDO || process.env.GEMINI_MODEL_PRO, DEFAULT_GEMINI_PRO_MODEL, 'pro');
export const geminiMarketingModel = resolveGeminiModel(process.env.GEMINI_MODEL_MARKETING, geminiFastModel, 'marketing');
export const geminiCommercialModel = resolveGeminiModel(process.env.GEMINI_MODEL_COMMERCIAL, geminiFastModel, 'commercial');

export function getGeminiModelForAgent(agentType?: AkAgentType, options?: { deep?: boolean }): string {
  if (options?.deep || agentType === 'fiestas_general' || agentType === 'contable') {
    return geminiProModel;
  }
  if (agentType === 'marketing') return geminiMarketingModel;
  if (agentType === 'comercial') return geminiCommercialModel;
  return geminiFastModel;
}

/**
 * Resuelve el modelo efectivo cuidando el presupuesto mensual de IA.
 * Si el modelo pro fue solicitado pero el presupuesto está alcanzado o frenado,
 * cae automáticamente al modelo rápido para no fallar ni generar sobrecostos.
 */
export async function getEffectiveGeminiModelForAgent(
  agentType?: AkAgentType,
  options?: { deep?: boolean }
): Promise<string> {
  const preferred = getGeminiModelForAgent(agentType, options);
  if (preferred === geminiProModel) {
    try {
      const tienePresupuesto = await hayPresupuestoParaIA();
      if (!tienePresupuesto) {
        return geminiFastModel;
      }
    } catch {
      return geminiFastModel;
    }
  }
  return preferred;
}

/**
 * Tope de salida explícito. Sin `maxOutputTokens` en la configuración, `conLugarParaPensar` no
 * tenía nada que subir y el modelo usaba su tope por defecto: las respuestas largas (listas,
 * totales) salían cortadas. Con el piso puesto acá, el análisis profundo tiene el doble.
 * No se mandan temperatura ni topP/topK: Gemini 3 los deprecó.
 */
export function getGeminiGenerationConfigForAgent(
  _agentType?: AkAgentType,
  options?: { deep?: boolean },
): GeminiGenerationConfig {
  return { maxOutputTokens: options?.deep ? PISO_DE_TOKENS_DE_SALIDA * 2 : PISO_DE_TOKENS_DE_SALIDA };
}

if (!apiKey) {
  console.warn('[Genkit] Advertencia: No se encontró GOOGLE_API_KEY ni GEMINI_API_KEY. El Asistente AK no funcionará hasta que se configure la API key.');
}

export const ai = genkit({
  plugins: apiKey ? [googleAI({ apiKey })] : [],
});

type GeminiGenerateRequest = Awaited<Parameters<typeof ai.generate>[0]>;

function configuredFallbackModels(): string[] {
  const configured = (process.env.GEMINI_MODEL_FALLBACKS || '')
    .split(',')
    .map(model => model.trim())
    .filter(model => GEMINI_MODEL_PATTERN.test(model));

  return [...configured, ...DEFAULT_GEMINI_FALLBACK_MODELS];
}

export function getGeminiFallbackCandidates(preferredModel: string): string[] {
  // Si lo que falló es un modelo "pro", el primer respaldo es el pro estable, no uno chico.
  const respaldoPro = /gemini-[a-z0-9.]*-?pro/i.test(preferredModel) ? [DEFAULT_GEMINI_PRO_FALLBACK_MODEL] : [];
  return Array.from(new Set([preferredModel, ...respaldoPro, ...configuredFallbackModels()]));
}

export function isRecoverableGeminiModelError(error: unknown): boolean {
  const candidate = error as { status?: number; code?: number | string; message?: string };
  const status = Number(candidate?.status || candidate?.code);
  const message = String(candidate?.message || error || '').toLowerCase();

  return (
    [404, 408, 429, 500, 502, 503, 504].includes(status) ||
    /(model.+(?:not found|unavailable)|resource_exhausted|overloaded|capacity|deadline exceeded|temporarily unavailable)/i.test(message)
  );
}

/**
 * Los modelos "flash" nuevos piensan antes de contestar, y ese pensamiento se descuenta del tope
 * de `maxOutputTokens`. Con topes chicos (500, 600) la respuesta salía cortada en la primera
 * línea ("Mirá, lo más urgente es esto: 🚨 • **XV"), que es lo que vio el dueño en el Encargado
 * General (9/10/2026). El largo de la respuesta lo marca el pedido ("máximo 4-5 líneas"), no el
 * tope: se le da un piso alto para que nunca corte a la mitad.
 */
export const PISO_DE_TOKENS_DE_SALIDA = 4096;

export function conLugarParaPensar(request: GeminiGenerateRequest): GeminiGenerateRequest {
  const config = (request as { config?: Record<string, unknown> }).config;
  const tope = Number(config?.maxOutputTokens);
  if (!config || !Number.isFinite(tope) || tope >= PISO_DE_TOKENS_DE_SALIDA) return request;
  return { ...request, config: { ...config, maxOutputTokens: PISO_DE_TOKENS_DE_SALIDA } } as GeminiGenerateRequest;
}

export async function generateWithGeminiFallback(request: GeminiGenerateRequest) {
  const preferredModel = typeof request.model === 'string' ? request.model : geminiFastModel;
  const candidates = getGeminiFallbackCandidates(preferredModel);
  let lastError: unknown;

  const pedido = conLugarParaPensar(request);
  for (const model of candidates) {
    try {
      return await ai.generate({ ...pedido, model });
    } catch (error) {
      lastError = error;
      if (!isRecoverableGeminiModelError(error)) throw error;
      console.warn(`[Genkit] El modelo "${model}" no respondió. Probando fallback compatible.`);
    }
  }

  throw lastError;
}

/**
 * Corre un `ai.definePrompt` (que trae UN solo modelo fijo) probando los modelos de respaldo si el
 * principal no responde. Los flujos con esquema de salida (contratos, reuniones) quedaban sin red
 * de seguridad: si el modelo se retiraba o se saturaba, fallaban de punta a punta.
 */
export async function ejecutarPromptConFallback<I, R>(
  prompt: (input: I, opts?: { model?: string }) => Promise<R>,
  input: I,
  preferredModel: string = geminiModel,
): Promise<R> {
  let lastError: unknown;
  for (const model of getGeminiFallbackCandidates(preferredModel)) {
    try {
      return await prompt(input, { model });
    } catch (error) {
      lastError = error;
      if (!isRecoverableGeminiModelError(error)) throw error;
      console.warn(`[Genkit] El modelo "${model}" no respondió. Probando fallback compatible.`);
    }
  }
  throw lastError;
}
