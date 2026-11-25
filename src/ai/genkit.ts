import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import type { AkAgentType } from '@/types/multiagent';
import { hayPresupuestoParaIA, reservarRespuestaProfunda, anotarFalloIA } from '@/lib/ai/consumo-servidor';
import {
  DEFAULT_GEMINI_FALLBACK_MODELS,
  DEFAULT_GEMINI_LATEST_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PRO_FALLBACK_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
  GEMINI_MODEL_PATTERN,
  MODELOS_GEMINI,
  esErrorCuotaIA,
  esErrorModeloRetirado,
  isRecoverableGeminiModelError,
} from './modelos';

export {
  DEFAULT_GEMINI_FALLBACK_MODELS,
  DEFAULT_GEMINI_LATEST_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_PRO_FALLBACK_MODEL,
  DEFAULT_GEMINI_PRO_MODEL,
  MODELOS_GEMINI,
  esErrorCuotaIA,
  esErrorModeloRetirado,
  isRecoverableGeminiModelError,
};

const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

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
  if (options?.deep || agentType === 'contable') {
    return geminiProModel;
  }
  if (agentType === 'marketing') return geminiMarketingModel;
  if (agentType === 'comercial') return geminiCommercialModel;
  return geminiFastModel;
}

/**
 * Resuelve el modelo efectivo cuidando el presupuesto mensual y el tope diario del cerebro.
 * Si el modelo pro fue solicitado pero el presupuesto mensual está alcanzado o se llegó
 * al tope diario de respuestas profundas, cae automáticamente al modelo rápido.
 * Si la reserva tira error, atrapa la excepción y devuelve el rápido (nunca se queda sin contestar).
 */
export async function getEffectiveGeminiModelForAgent(
  agentType?: AkAgentType,
  options?: { deep?: boolean; ahora?: Date | string } | Date | string,
  ahoraDirect?: Date | string,
): Promise<string> {
  const opts = (options && typeof options === 'object' && !(options instanceof Date)) ? options : undefined;
  const ahora = (options instanceof Date || typeof options === 'string') ? options : (opts?.ahora ?? ahoraDirect);
  const preferred = getGeminiModelForAgent(agentType, opts);
  if (preferred !== geminiFastModel) {
    try {
      const fecha = ahora ? (typeof ahora === 'string' ? new Date(ahora) : ahora) : undefined;
      const tienePresupuesto = await hayPresupuestoParaIA(fecha);
      if (!tienePresupuesto) {
        return geminiFastModel;
      }
      const reservado = await reservarRespuestaProfunda(ahora);
      if (!reservado) {
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

export type GeminiGenerateRequest = Awaited<Parameters<typeof ai.generate>[0]>;

function configuredFallbackModels(): string[] {
  const configured = (process.env.GEMINI_MODEL_FALLBACKS || '')
    .split(',')
    .map(model => model.trim())
    .filter(model => GEMINI_MODEL_PATTERN.test(model));

  return [...configured, ...DEFAULT_GEMINI_FALLBACK_MODELS];
}

export function getGeminiFallbackCandidates(preferredModel: string): string[] {
  const isPro = /gemini-[a-z0-9.]*-?pro/i.test(preferredModel) || preferredModel === geminiProModel || preferredModel === DEFAULT_GEMINI_PRO_MODEL;
  if (isPro) {
    const prefix = preferredModel.startsWith('googleai/') ? 'googleai/' : '';
    const sinPrefijo = (m: string) => m.replace(/^googleai\//, '');
    return Array.from(new Set([
      preferredModel,
      ...MODELOS_GEMINI.profundo.slice(1).map((m) => `${prefix}${sinPrefijo(m)}`),
    ]));
  }
  return Array.from(new Set([preferredModel, ...configuredFallbackModels()]));
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
      if (esErrorModeloRetirado(error)) {
        const motivoRetirado = error instanceof Error
          ? error.message
          : String((error as { message?: string })?.message || error || 'Modelo no disponible');
        // no pasa nada si falla: anotar el modelo retirado es accesorio y el flujo sigue con el modelo de respaldo.
        await anotarFalloIA('gemini-modelo-retirado', `${model}: ${motivoRetirado}`).catch(() => {});
      }
      console.warn(`[Genkit] El modelo "${model}" no respondió. Probando fallback compatible.`);
    }
  }

  const motivo = lastError instanceof Error ? lastError.message : String(lastError || 'Sin respuesta del modelo');
  // no pasa nada si falla: anotar el fallo es accesorio; el error real se tira igual abajo (pregunta 133).
  await anotarFalloIA('gemini-fallback', motivo).catch(() => {});
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
      if (esErrorModeloRetirado(error)) {
        const motivoRetirado = error instanceof Error
          ? error.message
          : String((error as { message?: string })?.message || error || 'Modelo no disponible');
        // no pasa nada si falla: anotar el modelo retirado es accesorio y el flujo sigue con el modelo de respaldo.
        await anotarFalloIA('gemini-modelo-retirado', `${model}: ${motivoRetirado}`).catch(() => {});
      }
      console.warn(`[Genkit] El modelo "${model}" no respondió. Probando fallback compatible.`);
    }
  }
  const motivo = lastError instanceof Error ? lastError.message : String(lastError || 'Sin respuesta del modelo');
  // no pasa nada si falla: anotar el fallo es accesorio; el error real se tira igual abajo (pregunta 133).
  await anotarFalloIA('gemini-fallback', motivo).catch(() => {});
  throw lastError;
}
