import 'server-only';

import { readData } from '@/lib/data-service';
import type { FuncionConCosto } from '@/lib/ai/consumo';
import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';

const GEMINI_DECISIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/decisions';
const GEMINI_DECISIONS_MODEL = 'gemini-decision-1';
const DECISIONS_TIMEOUT_MS = 3000;
const AI_ASSISTANT_SETTINGS_FILE = 'ai-assistant-settings.json';
const DEFINITIVE_REJECTION_STATUSES = new Set([400, 401, 403, 404, 413, 429]);

export type EntradaDecision =
  | string
  | { texto: string }
  | { text: string }
  | { base64: string; mimeType: string }
  | { buffer: Buffer; mimeType: string }
  | { url: string; mimeType?: string };

export type PreguntaDecision =
  | { tipo: 'si_no' | 'noul'; instruccion: string }
  | { tipo: 'opcion' | 'choice'; instruccion: string; opciones: Record<string, string> }
  | { tipo: 'nota' | 'score'; instruccion: string; escala?: Record<string, string> };

export interface RespuestaDecision {
  valor: boolean | string | number;
  siNo?: boolean;
  opcion?: string;
  nota?: number;
  confianza?: number;
  crudo?: unknown;
}

export interface DecidirParams {
  entradas: EntradaDecision[];
  preguntas: Record<string, PreguntaDecision>;
  funcion?: FuncionConCosto;
  timeoutMs?: number;
}

type GeminiInputPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { fileUri: string; mimeType?: string } };

const MAX_DECISIONS_IMAGE_BYTES = 10 * 1024 * 1024;
const GEMINI_FILES_PREFIX = 'https://generativelanguage.googleapis.com/';

async function descargarUrlAInlineData(
  url: string,
  mimeTypeHint?: string,
  timeoutMs = DECISIONS_TIMEOUT_MS,
): Promise<GeminiInputPart | null> {
  if (!url.startsWith('https://')) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) return null;
    const headerLength = Number(res.headers.get('content-length'));
    if (Number.isFinite(headerLength) && headerLength > MAX_DECISIONS_IMAGE_BYTES) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_DECISIONS_IMAGE_BYTES) return null;
    const contentType = res.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
      || mimeTypeHint
      || 'image/jpeg';
    return { inlineData: { mimeType: contentType, data: buffer.toString('base64') } };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function normalizarParteAsync(entrada: EntradaDecision, timeoutMs: number): Promise<GeminiInputPart | null> {
  if (typeof entrada === 'object' && entrada && 'url' in entrada) {
    const url = String(entrada.url ?? '').trim();
    if (!url) return null;
    const dataMatch = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (dataMatch) {
      return { inlineData: { mimeType: dataMatch[1], data: dataMatch[2] } };
    }
    if (url.startsWith(GEMINI_FILES_PREFIX)) {
      return { fileData: { fileUri: url, ...(entrada.mimeType ? { mimeType: entrada.mimeType } : {}) } };
    }
    return descargarUrlAInlineData(url, entrada.mimeType, timeoutMs);
  }
  return normalizarParte(entrada);
}

function normalizarParte(entrada: EntradaDecision): GeminiInputPart | null {
  if (typeof entrada === 'string') {
    const limpio = entrada.trim();
    return limpio ? { text: limpio } : null;
  }
  if ('texto' in entrada) {
    const limpio = String(entrada.texto ?? '').trim();
    return limpio ? { text: limpio } : null;
  }
  if ('text' in entrada) {
    const limpio = String(entrada.text ?? '').trim();
    return limpio ? { text: limpio } : null;
  }
  if ('base64' in entrada) {
    const base64Limpio = String(entrada.base64 ?? '').replace(/^data:[^;]+;base64,/, '').trim();
    if (!base64Limpio || !entrada.mimeType) return null;
    return { inlineData: { mimeType: entrada.mimeType, data: base64Limpio } };
  }
  if ('buffer' in entrada) {
    if (!entrada.buffer?.length || !entrada.mimeType) return null;
    return { inlineData: { mimeType: entrada.mimeType, data: entrada.buffer.toString('base64') } };
  }
  if ('url' in entrada) {
    const url = String(entrada.url ?? '').trim();
    if (!url) return null;
    const dataMatch = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (dataMatch) {
      return { inlineData: { mimeType: dataMatch[1], data: dataMatch[2] } };
    }
    return { fileData: { fileUri: url, ...(entrada.mimeType ? { mimeType: entrada.mimeType } : {}) } };
  }
  return null;
}

function traducirPregunta(pregunta: PreguntaDecision): Record<string, unknown> {
  if (pregunta.tipo === 'si_no' || pregunta.tipo === 'noul') {
    return { type: 'noul', instructions: pregunta.instruccion };
  }
  if (pregunta.tipo === 'opcion' || pregunta.tipo === 'choice') {
    return {
      type: 'choice',
      instructions: pregunta.instruccion,
      criteria: pregunta.opciones,
    };
  }
  if (pregunta.tipo === 'nota' || pregunta.tipo === 'score') {
    return {
      type: 'score',
      instructions: pregunta.instruccion,
      ...(pregunta.escala ? { criteria: pregunta.escala } : {}),
    };
  }
  return {
    type: 'score',
    instructions: '',
  };
}

function mejorClavePorProbabilidad(probabilidades: unknown): string | undefined {
  if (!probabilidades || typeof probabilidades !== 'object') return undefined;
  let mejorClave: string | undefined;
  let mejorProb = -Infinity;
  for (const [clave, valor] of Object.entries(probabilidades as Record<string, unknown>)) {
    const num = Number(valor);
    if (Number.isFinite(num) && num > mejorProb) {
      mejorProb = num;
      mejorClave = clave;
    }
  }
  return mejorClave;
}

function normalizarRespuesta(raw: any, pregunta: PreguntaDecision): RespuestaDecision | null {
  if (raw === undefined || raw === null) return null;

  const confianzaRaw = typeof raw === 'object'
    ? (raw.confidence ?? raw.probability ?? raw.confianza)
    : undefined;
  const confianza = Number.isFinite(Number(confianzaRaw)) ? Number(confianzaRaw) : undefined;

  if (pregunta.tipo === 'si_no' || pregunta.tipo === 'noul') {
    let siNo: boolean | undefined;
    if (typeof raw === 'boolean') {
      siNo = raw;
    } else if (typeof raw === 'string') {
      const lower = raw.trim().toLowerCase();
      if (['si', 'sí', 'yes', 'true', '1'].includes(lower)) siNo = true;
      else if (['no', 'false', '0'].includes(lower)) siNo = false;
    } else if (typeof raw === 'object') {
      if (typeof raw.noul === 'boolean') siNo = raw.noul;
      else if (typeof raw.siNo === 'boolean') siNo = raw.siNo;
      else if (typeof raw.valor === 'boolean') siNo = raw.valor;
      else if (typeof raw.answer === 'boolean') siNo = raw.answer;
      else if (typeof raw.result === 'boolean') siNo = raw.result;
      else if (typeof raw.choice === 'string') {
        const lower = raw.choice.trim().toLowerCase();
        if (['si', 'sí', 'yes', 'true'].includes(lower)) siNo = true;
        else if (['no', 'false'].includes(lower)) siNo = false;
      } else if (Number.isFinite(Number(raw.probability))) {
        siNo = Number(raw.probability) >= 0.5;
      } else if (Number.isFinite(Number(raw.score))) {
        siNo = Number(raw.score) >= 0.5;
      }
    }
    if (siNo === undefined) return null;
    return { valor: siNo, siNo, confianza, crudo: raw };
  }

  if (pregunta.tipo === 'opcion' || pregunta.tipo === 'choice') {
    let opcion: string | undefined;
    if (typeof raw === 'string') {
      opcion = raw;
    } else if (typeof raw === 'object') {
      opcion =
        (typeof raw.choice === 'string' && raw.choice) ||
        (typeof raw.opcion === 'string' && raw.opcion) ||
        (typeof raw.answer === 'string' && raw.answer) ||
        (typeof raw.result === 'string' && raw.result) ||
        (typeof raw.valor === 'string' && raw.valor) ||
        mejorClavePorProbabilidad(raw.probabilities);
    }
    if (!opcion) return null;
    return { valor: opcion, opcion, confianza, crudo: raw };
  }

  // nota / score
  let notaNum: number | undefined;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    notaNum = raw;
  } else if (typeof raw === 'string' && Number.isFinite(Number(raw))) {
    notaNum = Number(raw);
  } else if (typeof raw === 'object') {
    const candidato = raw.score ?? raw.expectedScore ?? raw.nota ?? raw.valor ?? raw.answer;
    if (Number.isFinite(Number(candidato))) {
      notaNum = Number(candidato);
    } else {
      const mejor = mejorClavePorProbabilidad(raw.probabilities);
      if (mejor && Number.isFinite(Number(mejor))) notaNum = Number(mejor);
    }
  }
  if (notaNum === undefined || !Number.isFinite(notaNum)) return null;
  const nota = Math.round(notaNum);
  return { valor: nota, nota, confianza, crudo: raw };
}

async function decisionesRapidasHabilitadas(): Promise<boolean> {
  try {
    const settings = await readData<{ decisionesRapidasActivas?: boolean }>(
      AI_ASSISTANT_SETTINGS_FILE,
      {},
    );
    return settings?.decisionesRapidasActivas !== false;
  } catch {
    return true;
  }
}

/**
 * Llama a la API de Gemini Decisions (`v1beta`, `gemini-decision-1`) respetando
 * el interruptor de Ajustes de IA, la clave de API, el tope mensual de consumo y
 * un corte estricto de 3 segundos. Ante cualquier falta o demora devuelve `null`.
 */
export async function decidir({
  entradas,
  preguntas,
  funcion = 'decisiones',
  timeoutMs = DECISIONS_TIMEOUT_MS,
}: DecidirParams): Promise<Record<string, RespuestaDecision> | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'dummy') return null;

  if (!(await decisionesRapidasHabilitadas())) return null;

  const parts = (
    await Promise.all((entradas ?? []).map((entrada) => normalizarParteAsync(entrada, timeoutMs)))
  ).filter((p): p is GeminiInputPart => p !== null);
  const clavesPreguntas = Object.keys(preguntas ?? {});
  if (parts.length === 0 || clavesPreguntas.length === 0) return null;

  let reserva: Awaited<ReturnType<typeof reservarConsumoIA>> = null;
  try {
    reserva = await reservarConsumoIA(funcion, 1);
  } catch {
    return null;
  }
  if (!reserva) return null;

  const questionsPayload: Record<string, Record<string, unknown>> = {};
  for (const clave of clavesPreguntas) {
    questionsPayload[clave] = traducirPregunta(preguntas[clave]);
  }

  const inputPayload = parts.length === 1 && 'text' in parts[0]
    ? parts[0].text
    : { parts };

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const fetchPromise = fetch(GEMINI_DECISIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: GEMINI_DECISIONS_MODEL,
        input: inputPayload,
        questions: questionsPayload,
      }),
      signal: controller.signal,
      cache: 'no-store',
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve(null);
      }, timeoutMs);
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!response) return null;

    if (!response.ok) {
      if (DEFINITIVE_REJECTION_STATUSES.has(response.status)) {
        await reserva.liberar().catch(() => undefined);
      }
      return null;
    }

    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!data || typeof data !== 'object') return null;

    const contenedor = (
      (data.results as Record<string, unknown> | undefined) ??
      (data.answers as Record<string, unknown> | undefined) ??
      (data.decisions as Record<string, unknown> | undefined) ??
      data
    );

    const salida: Record<string, RespuestaDecision> = {};
    for (const clave of clavesPreguntas) {
      const normalizada = normalizarRespuesta(contenedor[clave], preguntas[clave]);
      if (normalizada) salida[clave] = normalizada;
    }

    return Object.keys(salida).length > 0 ? salida : null;
  } catch {
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
