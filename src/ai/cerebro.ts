import 'server-only';

import {
  MODELOS_GEMINI,
  esErrorCuotaIA,
  esErrorModeloRetirado,
  isRecoverableGeminiModelError,
} from './modelos';
import {
  anotarFalloIA,
  hayPresupuestoParaIA,
  registrarConsumoIA,
  reservarConsumoIA,
} from '@/lib/ai/consumo-servidor';
import type { FuncionConCosto } from '@/lib/ai/consumo';
import { buildSofiaBusinessContext } from '@/lib/ai/sofia-context';
import { serializeUntrustedPromptData } from '@/lib/ai/intelligence-guardrails';
import { generateWithGeminiFallback, type GeminiGenerateRequest } from './genkit';
import {
  GEMINI_DECISIONS_ENDPOINT,
  GEMINI_FILES_PREFIX,
  GEMINI_IMAGE_API_BASE,
  construirUrlModeloV1Beta,
} from './direcciones-google';
import { readData } from '@/lib/data-service';

export const MENSAJE_TOPE_IA = 'Se llegó al tope de IA del mes';

/**
 * Las cuatro reglas del dueño que nunca se automatizan ni se delegan a la IA.
 */
export const REGLAS_INMUTABLES_IA = [
  'Nunca cobrar plata ni marcar pagos como recibidos sin aprobación humana.',
  'Nunca enviar mensajes a clientes por cuenta propia sin autorización explícita.',
  'Nunca dar por aceptado o confirmado un presupuesto automáticamente.',
  'Nunca modificar permisos, roles ni accesos de usuarios.',
] as const;

export interface ContextoNegocioCerebro {
  config: Parameters<typeof buildSofiaBusinessContext>[0];
  services: Parameters<typeof buildSofiaBusinessContext>[1];
  menus: Parameters<typeof buildSofiaBusinessContext>[2];
}

export interface ConstruirPromptOpciones {
  prompt: string;
  incluirReglas?: boolean;
  incluirContextoNegocio?: boolean;
  contextoNegocio?: ContextoNegocioCerebro | string;
  datosNoConfiables?: unknown;
}

export function construirPromptConReglasYNegocio({
  prompt,
  incluirReglas = true,
  incluirContextoNegocio = false,
  contextoNegocio,
  datosNoConfiables,
}: ConstruirPromptOpciones): string {
  const bloques: string[] = [];

  if (incluirReglas) {
    bloques.push(
      `REGLAS INMUTABLES DEL NEGOCIO:\n${REGLAS_INMUTABLES_IA.map((r) => `- ${r}`).join('\n')}`,
    );
  }

  if ((incluirContextoNegocio || contextoNegocio !== undefined) && contextoNegocio !== undefined) {
    const contextoTexto =
      typeof contextoNegocio === 'string'
        ? contextoNegocio
        : buildSofiaBusinessContext(
            contextoNegocio.config,
            contextoNegocio.services,
            contextoNegocio.menus,
          );
    if (contextoTexto.trim()) {
      bloques.push(`CONTEXTO DEL NEGOCIO:\n${contextoTexto}`);
    }
  }

  if (datosNoConfiables !== undefined) {
    bloques.push(
      `DATOS DE ENTRADA (NO CONFIABLES):\n${serializeUntrustedPromptData(datosNoConfiables)}`,
    );
  }

  bloques.push(prompt);
  return bloques.filter(Boolean).join('\n\n');
}

function extraerStatusError(error: unknown): number {
  const candidate = error as { status?: number; code?: number | string };
  const status = Number(candidate?.status || candidate?.code);
  return Number.isFinite(status) ? status : 0;
}

function extraerMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  const candidate = error as { message?: string };
  if (candidate?.message) return String(candidate.message);
  return String(error || 'Error desconocido de IA');
}

function limpiarPrefijoModelo(modelo: string): string {
  return (modelo || '').trim().replace(/^googleai\//, '').replace(/^models\//, '');
}

async function anotarFalloSeguro(funcion: FuncionConCosto | 'gemini-modelo-retirado', motivo: string): Promise<void> {
  if (typeof anotarFalloIA === 'function') {
    // no pasa nada si falla: anotar el fallo en telemetría no debe tumbar la respuesta de la IA.
    await anotarFalloIA(funcion, motivo).catch(() => {});
  }
}

function debeLiberarReserva(error: unknown): boolean {
  const status = extraerStatusError(error);
  if (status === 408 || status >= 500) return false;
  if ([400, 401, 403, 404, 413, 429].includes(status)) return true;
  if (!status) return false;
  return esErrorModeloRetirado(error) || esErrorCuotaIA(error);
}

export interface PedirTextoOpciones {
  prompt: string;
  system?: string;
  quien?: FuncionConCosto;
  consumoYaGestionado?: boolean;
  incluirReglas?: boolean;
  incluirContextoNegocio?: boolean;
  contextoNegocio?: ContextoNegocioCerebro | string;
  datosNoConfiables?: unknown;
  modelos?: string[];
  maxOutputTokens?: number;
  fetchFn?: typeof fetch;
  ejecutarModelo?: (request: GeminiGenerateRequest) => Promise<{ text?: string | null }>;
}

export type ResultadoTextoCerebro =
  | { ok: true; texto: string; modelo: string; topeAlcanzado: false }
  | { ok: false; texto: ''; error: string; topeAlcanzado: boolean };

async function llamarModeloTextoPorFetch(
  fetchFn: typeof fetch,
  modelo: string,
  prompt: GeminiGenerateRequest['prompt'],
  system?: string,
  maxOutputTokens?: number,
): Promise<{ text?: string }> {
  const apiKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  const parts: Array<Record<string, unknown>> = [];

  if (typeof prompt === 'string') {
    parts.push({ text: prompt });
  } else if (Array.isArray(prompt)) {
    for (const item of prompt as Array<{ text?: string; media?: { url?: string; contentType?: string } }>) {
      if (typeof item?.text === 'string') {
        parts.push({ text: item.text });
      } else if (item?.media?.url) {
        const match = item.media.url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: item.media.contentType || match[1], data: match[2] } });
        }
      }
    }
  }

  const body: Record<string, unknown> = {
    contents: [{ parts }],
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }
  if (maxOutputTokens && Number.isFinite(maxOutputTokens)) {
    body.generationConfig = { maxOutputTokens };
  }

  const resp = await fetchFn(construirUrlModeloV1Beta(modelo), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'x-goog-api-key': apiKey } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!resp.ok) {
    const data = typeof resp.json === 'function' ? await resp.json().catch(() => ({})) : {};
    const msg = (data as { error?: { message?: string } })?.error?.message || resp.statusText || `HTTP ${resp.status}`;
    throw Object.assign(new Error(msg), { status: resp.status });
  }

  const data = (await resp.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p?.text || '')
    .join('');
  return { text };
}

async function ejecutarTextoConRespaldo({
  prompt,
  system,
  quien,
  consumoYaGestionado = false,
  modelos,
  maxOutputTokens,
  fetchFn,
  ejecutarModelo,
}: {
  prompt: GeminiGenerateRequest['prompt'];
  system?: string;
  quien: FuncionConCosto;
  consumoYaGestionado?: boolean;
  modelos: string[];
  maxOutputTokens?: number;
  fetchFn?: typeof fetch;
  ejecutarModelo?: (request: GeminiGenerateRequest) => Promise<{ text?: string | null }>;
}): Promise<ResultadoTextoCerebro> {
  let reserva: Awaited<ReturnType<typeof reservarConsumoIA>> | null = null;

  if (!consumoYaGestionado) {
    const tienePresupuesto = await hayPresupuestoParaIA();
    if (!tienePresupuesto) {
      return { ok: false, topeAlcanzado: true, texto: '', error: MENSAJE_TOPE_IA };
    }

    reserva = await reservarConsumoIA(quien).catch(() => null);
    if (!reserva) {
      return { ok: false, topeAlcanzado: true, texto: '', error: MENSAJE_TOPE_IA };
    }
  }

  let lastError: unknown;
  let huboIntentoIncierto = false;

  for (const modelo of modelos) {
    const request: GeminiGenerateRequest = {
      model: modelo,
      prompt,
      ...(system ? { system } : {}),
      ...(maxOutputTokens ? { config: { maxOutputTokens } } : {}),
    };

    try {
      const res = ejecutarModelo
        ? await ejecutarModelo(request)
        : fetchFn
          ? await llamarModeloTextoPorFetch(fetchFn, modelo, prompt, system, maxOutputTokens)
          : await generateWithGeminiFallback(request);

      const texto = (res?.text || '').trim();
      if (!texto) {
        huboIntentoIncierto = true;
        lastError = new Error('Gemini devolvió una respuesta vacía.');
        continue;
      }

      return { ok: true, texto, modelo, topeAlcanzado: false };
    } catch (err) {
      lastError = err;
      if (!debeLiberarReserva(err)) {
        huboIntentoIncierto = true;
      }
      const msg = extraerMensajeError(err);

      if (esErrorModeloRetirado(err)) {
        await anotarFalloSeguro('gemini-modelo-retirado', `${modelo}: ${msg}`);
        continue;
      }

      if (isRecoverableGeminiModelError(err)) {
        await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
        continue;
      }

      await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
      break;
    }
  }

  if (!huboIntentoIncierto && debeLiberarReserva(lastError)) {
    if (typeof reserva?.liberar === 'function') {
      await reserva.liberar().catch(() => undefined);
    }
  }

  return {
    ok: false,
    error: extraerMensajeError(lastError) || 'No se pudo obtener respuesta de la IA.',
    topeAlcanzado: false,
    texto: '',
  };
}

export async function pedirTexto({
  prompt,
  system,
  quien = 'cerebro',
  consumoYaGestionado = false,
  incluirReglas = true,
  incluirContextoNegocio = false,
  contextoNegocio,
  datosNoConfiables,
  modelos,
  maxOutputTokens,
  fetchFn,
  ejecutarModelo,
}: PedirTextoOpciones): Promise<ResultadoTextoCerebro> {
  const systemFinal = incluirReglas
    ? [system, `REGLAS INMUTABLES DEL NEGOCIO:\n${REGLAS_INMUTABLES_IA.map((r) => `- ${r}`).join('\n')}`]
        .filter(Boolean)
        .join('\n\n')
    : system;

  const promptFinal =
    incluirContextoNegocio || contextoNegocio !== undefined || datosNoConfiables !== undefined
      ? construirPromptConReglasYNegocio({
          prompt,
          incluirReglas: false,
          incluirContextoNegocio,
          contextoNegocio,
          datosNoConfiables,
        })
      : prompt;

  const candidatos = modelos?.length ? [...modelos] : [...MODELOS_GEMINI.texto];

  return ejecutarTextoConRespaldo({
    prompt: promptFinal,
    system: systemFinal,
    quien,
    consumoYaGestionado,
    modelos: candidatos,
    maxOutputTokens,
    fetchFn,
    ejecutarModelo,
  });
}

export interface ImagenReferenciaCerebro {
  base64: string;
  contentType: string;
}

export interface PedirImagenOpciones {
  prompt: string;
  images?: ImagenReferenciaCerebro[];
  aspectRatio?: string;
  imageSize?: '512' | '1K' | '2K' | '4K';
  timeoutMs?: number;
  quien?: FuncionConCosto;
  consumoYaGestionado?: boolean;
  modelos?: string[];
  fetchFn?: typeof fetch;
}

export type ResultadoImagenCerebro =
  | { ok: true; base64: string; modelo: string; topeAlcanzado: false }
  | { ok: false; base64: null; error: string; topeAlcanzado: boolean };

export async function pedirImagen({
  prompt,
  images = [],
  aspectRatio = '3:4',
  imageSize = '1K',
  timeoutMs = 60_000,
  quien = 'papeleria',
  consumoYaGestionado = false,
  modelos,
  fetchFn,
}: PedirImagenOpciones): Promise<ResultadoImagenCerebro> {
  let reserva: Awaited<ReturnType<typeof reservarConsumoIA>> | null = null;

  if (!consumoYaGestionado) {
    const tienePresupuesto = await hayPresupuestoParaIA();
    if (!tienePresupuesto) {
      return { ok: false, topeAlcanzado: true, base64: null, error: MENSAJE_TOPE_IA };
    }

    reserva = await reservarConsumoIA(quien).catch(() => null);
    if (!reserva) {
      return { ok: false, topeAlcanzado: true, base64: null, error: MENSAJE_TOPE_IA };
    }
  }

  const apiKey = (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey || apiKey === 'dummy') {
    if (typeof reserva?.liberar === 'function') {
      await reserva.liberar().catch(() => undefined);
    }
    return { ok: false, topeAlcanzado: false, base64: null, error: 'Falta configurar la clave de Gemini.' };
  }

  const fetchImpl = fetchFn || globalThis.fetch;
  if (!fetchImpl) {
    if (typeof reserva?.liberar === 'function') {
      await reserva.liberar().catch(() => undefined);
    }
    return { ok: false, topeAlcanzado: false, base64: null, error: 'No se puede llamar a Gemini: falta fetch.' };
  }

  const candidatos = (modelos?.length ? modelos : [...MODELOS_GEMINI.imagen])
    .map(limpiarPrefijoModelo)
    .filter(Boolean);

  let lastError: unknown;
  let huboIntentoIncierto = false;

  for (const modelo of candidatos) {
    const urlImagen = `${GEMINI_IMAGE_API_BASE}/${encodeURIComponent(modelo)}:generateContent`;
    try {
      const response = await fetchImpl(urlImagen, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
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
            responseModalities: ['IMAGE'],
            responseFormat: {
              image: {
                aspectRatio,
                imageSize,
              },
            },
          },
        }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });

      if (!response.ok) {
        const detail =
          typeof response.text === 'function'
            ? (await response.text().catch(() => '')).slice(0, 500)
            : '';
        const msg = `Gemini no pudo generar la imagen (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`;
        const err = Object.assign(new Error(msg), { status: response.status });
        lastError = err;
        if (!debeLiberarReserva(err)) {
          huboIntentoIncierto = true;
        }

        if (esErrorModeloRetirado(err)) {
          await anotarFalloSeguro('gemini-modelo-retirado', `${modelo}: ${msg}`);
          continue;
        }
        if (isRecoverableGeminiModelError(err)) {
          await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
          continue;
        }
        await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
        break;
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

      let base64: string | null = null;
      for (const candidate of result.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          const found = part.inlineData?.data || part.inline_data?.data;
          if (found) {
            base64 = found;
            break;
          }
        }
        if (base64) break;
      }

      if (!base64) {
        huboIntentoIncierto = true;
        lastError = new Error('Gemini no devolvió ninguna imagen.');
        continue;
      }

      return { ok: true, base64, modelo, topeAlcanzado: false };
    } catch (err) {
      lastError = err;
      if (!debeLiberarReserva(err)) {
        huboIntentoIncierto = true;
      }
      const msg = extraerMensajeError(err);
      if (esErrorModeloRetirado(err)) {
        await anotarFalloSeguro('gemini-modelo-retirado', `${modelo}: ${msg}`);
        continue;
      }
      if (isRecoverableGeminiModelError(err)) {
        await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
        continue;
      }
      await anotarFalloSeguro(quien, `${modelo}: ${msg}`);
      break;
    }
  }

  if (!huboIntentoIncierto && debeLiberarReserva(lastError)) {
    if (typeof reserva?.liberar === 'function') {
      await reserva.liberar().catch(() => undefined);
    }
  }

  return {
    ok: false,
    base64: null,
    error: extraerMensajeError(lastError) || 'Gemini no pudo generar la imagen.',
    topeAlcanzado: false,
  };
}

export interface LeerImagenOpciones {
  imagenBase64: string;
  mimeType: string;
  prompt: string;
  system?: string;
  quien?: FuncionConCosto;
  modelos?: string[];
  maxOutputTokens?: number;
  fetchFn?: typeof fetch;
  ejecutarModelo?: (request: GeminiGenerateRequest) => Promise<{ text?: string | null }>;
}

export async function leerImagen({
  imagenBase64,
  mimeType,
  prompt,
  system,
  quien = 'papeleria',
  modelos,
  maxOutputTokens,
  fetchFn,
  ejecutarModelo,
}: LeerImagenOpciones): Promise<ResultadoTextoCerebro> {
  const base64Limpio = imagenBase64.replace(/^data:[^;]+;base64,/, '').trim();
  const promptConMedia: GeminiGenerateRequest['prompt'] = [
    { media: { url: `data:${mimeType};base64,${base64Limpio}`, contentType: mimeType } },
    { text: prompt },
  ];

  const candidatos = modelos?.length
    ? [...modelos]
    : Array.from(
        new Set([
          'googleai/gemini-4-hydrogen',
          'googleai/gemini-2.5-flash',
          ...MODELOS_GEMINI.texto,
        ]),
      );

  return ejecutarTextoConRespaldo({
    prompt: promptConMedia,
    system,
    quien,
    modelos: candidatos,
    maxOutputTokens,
    fetchFn,
    ejecutarModelo,
  });
}

export const VOCES_IA_DISPONIBLES = [
  { id: 'Kore', nombre: 'Kore', genero: 'femenina', descripcion: 'Firme y clara, buena para el parte de la mañana.' },
  { id: 'Aoede', nombre: 'Aoede', genero: 'femenina', descripcion: 'Liviana y cercana.' },
  { id: 'Leda', nombre: 'Leda', genero: 'femenina', descripcion: 'Joven y amable.' },
  { id: 'Puck', nombre: 'Puck', genero: 'masculina', descripcion: 'Animada, con energía.' },
  { id: 'Charon', nombre: 'Charon', genero: 'masculina', descripcion: 'Informativa y tranquila.' },
  { id: 'Orus', nombre: 'Orus', genero: 'masculina', descripcion: 'Firme y segura.' },
] as const;

export const VOZ_POR_OMISION = 'Kore';

export function pcmAWav(pcm: Buffer, frecuencia = 24000): Buffer {
  const encabezado = Buffer.alloc(44);
  encabezado.write('RIFF', 0);
  encabezado.writeUInt32LE(36 + pcm.length, 4);
  encabezado.write('WAVE', 8);
  encabezado.write('fmt ', 12);
  encabezado.writeUInt32LE(16, 16);
  encabezado.writeUInt16LE(1, 20);
  encabezado.writeUInt16LE(1, 22);
  encabezado.writeUInt32LE(frecuencia, 24);
  encabezado.writeUInt32LE(frecuencia * 2, 28);
  encabezado.writeUInt16LE(2, 32);
  encabezado.writeUInt16LE(16, 34);
  encabezado.write('data', 36);
  encabezado.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([encabezado, pcm]);
}

export function limpiarTextoParaVoz(texto: string): string {
  return (texto || '')
    .replace(/[*#_`~>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

export interface PedirVozOpciones {
  texto: string;
  voz?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
  quien?: FuncionConCosto;
  modelos?: string[];
  verificarTope?: boolean;
}

export async function pedirVoz({
  texto,
  voz,
  apiKey: apiKeyOpcion,
  fetchFn,
  quien = 'voz-equipo',
  modelos,
  verificarTope = true,
}: PedirVozOpciones): Promise<Buffer> {
  const textoLimpio = limpiarTextoParaVoz(texto);
  if (!textoLimpio) throw new Error('El texto para la voz está vacío.');

  const rawKey = apiKeyOpcion !== undefined
    ? apiKeyOpcion
    : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const apiKey = rawKey && rawKey !== 'dummy' ? rawKey.trim() : '';
  if (!apiKey || apiKey.length < 10) throw new Error('No hay clave de Gemini para la voz.');

  if (verificarTope !== false) {
    const tienePresupuesto = await hayPresupuestoParaIA();
    if (!tienePresupuesto) {
      throw new Error(MENSAJE_TOPE_IA);
    }
  }

  const vozFinal = VOCES_IA_DISPONIBLES.some((v) => v.id === voz) ? (voz as string) : VOZ_POR_OMISION;
  const fetchImpl = fetchFn || globalThis.fetch;
  if (!fetchImpl) throw new Error('No se puede llamar a Gemini: falta fetch.');

  const candidatos = modelos?.length ? [...modelos] : [...MODELOS_GEMINI.voz];
  let ultimoError = 'Gemini no devolvió audio.';

  for (const modelo of candidatos) {
    const response = await fetchImpl(construirUrlModeloV1Beta(modelo), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Decilo en español rioplatense, con tono cálido y natural: ${textoLimpio}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: vozFinal } } },
        },
      }),
    });

    if (!response.ok) {
      const datos = typeof response.json === 'function' ? await response.json().catch(() => ({} as Record<string, unknown>)) : {};
      const mensajeError = (datos as { error?: { message?: string } })?.error?.message || response.statusText || '';
      if (esErrorModeloRetirado({ status: response.status, message: mensajeError })) {
        await anotarFalloSeguro('gemini-modelo-retirado', `${modelo}: ${mensajeError || 'Modelo no disponible'}`);
        ultimoError = `El modelo de voz ${modelo} no existe.`;
        continue;
      }
      await anotarFalloSeguro(quien, `${modelo}: HTTP ${response.status} ${mensajeError}`);
      throw new Error(`Gemini no dio la voz (${response.status}): ${mensajeError}`);
    }

    const datos = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }>;
    };
    const audio = datos?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data)?.inlineData?.data;
    if (!audio) throw new Error('La respuesta de Gemini no trae audio.');

    // no pasa nada si falla: el audio ya se generó y anotar el consumo no debe tumbar la respuesta.
    await registrarConsumoIA(quien).catch(() => {});
    return pcmAWav(Buffer.from(audio, 'base64'));
  }

  await anotarFalloSeguro(quien, ultimoError);
  throw new Error(ultimoError);
}

const GEMINI_DECISIONS_MODEL = 'gemini-decision-1';
const DECISIONS_TIMEOUT_MS = 3000;
const MAX_DECISIONS_IMAGE_BYTES = 10 * 1024 * 1024;
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
  fetchFn?: typeof fetch;
}

type GeminiInputPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { fileUri: string; mimeType?: string } };

function normalizarParteDecision(entrada: EntradaDecision): GeminiInputPart | null {
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

async function descargarUrlAInlineData(
  url: string,
  mimeTypeHint?: string,
  timeoutMs = DECISIONS_TIMEOUT_MS,
  fetchImpl: typeof fetch | undefined = globalThis.fetch,
): Promise<GeminiInputPart | null> {
  if (!url.startsWith('https://') || !fetchImpl) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: controller.signal, cache: 'no-store' });
    if (!res || !res.ok) return null;

    const contentLengthHeader = res.headers?.get?.('content-length');
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : NaN;
    if (Number.isFinite(contentLength) && contentLength > MAX_DECISIONS_IMAGE_BYTES) {
      return null;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_DECISIONS_IMAGE_BYTES) {
      return null;
    }

    const contentType =
      res.headers?.get?.('content-type')?.split(';')[0].trim().toLowerCase() ||
      mimeTypeHint ||
      'image/jpeg';

    return {
      inlineData: {
        mimeType: contentType,
        data: buffer.toString('base64'),
      },
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function normalizarParteDecisionAsync(
  entrada: EntradaDecision,
  timeoutMs: number,
  fetchImpl?: typeof fetch,
): Promise<GeminiInputPart | null> {
  if (typeof entrada === 'object' && entrada !== null && 'url' in entrada) {
    const url = String(entrada.url ?? '').trim();
    if (!url) return null;
    const dataMatch = url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (dataMatch) {
      return { inlineData: { mimeType: dataMatch[1], data: dataMatch[2] } };
    }
    if (url.startsWith(GEMINI_FILES_PREFIX)) {
      return { fileData: { fileUri: url, ...(entrada.mimeType ? { mimeType: entrada.mimeType } : {}) } };
    }
    return descargarUrlAInlineData(url, entrada.mimeType, timeoutMs, fetchImpl);
  }
  return normalizarParteDecision(entrada);
}

function traducirPreguntaDecision(pregunta: PreguntaDecision): Record<string, unknown> {
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

function normalizarRespuestaDecision(raw: unknown, pregunta: PreguntaDecision): RespuestaDecision | null {
  if (raw === undefined || raw === null) return null;
  const obj = typeof raw === 'object' ? (raw as Record<string, unknown>) : null;

  const confianzaRaw = obj
    ? (obj.confidence ?? obj.probability ?? obj.confianza)
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
    } else if (obj) {
      if (typeof obj.noul === 'boolean') siNo = obj.noul;
      else if (typeof obj.siNo === 'boolean') siNo = obj.siNo;
      else if (typeof obj.valor === 'boolean') siNo = obj.valor;
      else if (typeof obj.answer === 'boolean') siNo = obj.answer;
      else if (typeof obj.result === 'boolean') siNo = obj.result;
      else if (typeof obj.choice === 'string') {
        const lower = obj.choice.trim().toLowerCase();
        if (['si', 'sí', 'yes', 'true'].includes(lower)) siNo = true;
        else if (['no', 'false'].includes(lower)) siNo = false;
      } else if (Number.isFinite(Number(obj.probability))) {
        siNo = Number(obj.probability) >= 0.5;
      } else if (Number.isFinite(Number(obj.score))) {
        siNo = Number(obj.score) >= 0.5;
      }
    }
    if (siNo === undefined) return null;
    return { valor: siNo, siNo, confianza, crudo: raw };
  }

  if (pregunta.tipo === 'opcion' || pregunta.tipo === 'choice') {
    let opcion: string | undefined;
    if (typeof raw === 'string') {
      opcion = raw;
    } else if (obj) {
      opcion =
        (typeof obj.choice === 'string' && obj.choice) ||
        (typeof obj.opcion === 'string' && obj.opcion) ||
        (typeof obj.answer === 'string' && obj.answer) ||
        (typeof obj.result === 'string' && obj.result) ||
        (typeof obj.valor === 'string' && obj.valor) ||
        mejorClavePorProbabilidad(obj.probabilities);
    }
    if (!opcion) return null;
    return { valor: opcion, opcion, confianza, crudo: raw };
  }

  let notaNum: number | undefined;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    notaNum = raw;
  } else if (typeof raw === 'string' && Number.isFinite(Number(raw))) {
    notaNum = Number(raw);
  } else if (obj) {
    const candidato = obj.score ?? obj.expectedScore ?? obj.nota ?? obj.valor ?? obj.answer;
    if (Number.isFinite(Number(candidato))) {
      notaNum = Number(candidato);
    } else {
      const mejor = mejorClavePorProbabilidad(obj.probabilities);
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

export async function decidirConCerebro({
  entradas,
  preguntas,
  funcion = 'decisiones',
  timeoutMs = DECISIONS_TIMEOUT_MS,
  fetchFn,
}: DecidirParams): Promise<Record<string, RespuestaDecision> | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'dummy') return null;

  if (!(await decisionesRapidasHabilitadas())) return null;

  const fetchImpl = fetchFn || globalThis.fetch;
  const parts = (
    await Promise.all((entradas ?? []).map((entrada) => normalizarParteDecisionAsync(entrada, timeoutMs, fetchImpl)))
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
    questionsPayload[clave] = traducirPreguntaDecision(preguntas[clave]);
  }

  const inputPayload = parts.length === 1 && 'text' in parts[0]
    ? parts[0].text
    : { parts };

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  if (!fetchImpl) {
    if (typeof reserva?.liberar === 'function') {
      await reserva.liberar().catch(() => undefined);
    }
    return null;
  }

  try {
    const fetchPromise = fetchImpl(GEMINI_DECISIONS_ENDPOINT, {
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
    if (!response) {
      await anotarFalloSeguro(funcion, 'Tiempo de espera agotado en Gemini Decisions');
      return null;
    }

    if (!response.ok) {
      if (DEFINITIVE_REJECTION_STATUSES.has(response.status)) {
        if (typeof reserva?.liberar === 'function') {
          await reserva.liberar().catch(() => undefined);
        }
      }
      await anotarFalloSeguro(funcion, `Gemini Decisions HTTP ${response.status}`);
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
      const normalizada = normalizarRespuestaDecision(contenedor[clave], preguntas[clave]);
      if (normalizada) salida[clave] = normalizada;
    }

    return Object.keys(salida).length > 0 ? salida : null;
  } catch (err) {
    await anotarFalloSeguro(funcion, extraerMensajeError(err));
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export interface ProbarConexionGeminiOpciones {
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export async function probarConexionGeminiCerebro(
  opciones?: ProbarConexionGeminiOpciones,
): Promise<{ ok: boolean; error?: string; modelo?: string }> {
  const apiKey = opciones?.apiKey ?? (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY);
  if (!apiKey) {
    return {
      ok: false,
      error: 'La API key de Gemini no está configurada en el servidor. Verificá que el secreto "google-api-key" esté creado en Firebase y que el backend tenga acceso a él.',
    };
  }

  const fetchImpl = opciones?.fetchFn || globalThis.fetch;
  if (!fetchImpl) {
    return { ok: false, error: 'No se puede probar la conexión: falta fetch.' };
  }

  const timeoutMs = opciones?.timeoutMs ?? 15_000;

  try {
    let lastModelError = '';
    for (const rawModel of MODELOS_GEMINI.texto) {
      const modelo = limpiarPrefijoModelo(rawModel);
      const resp = await fetchImpl(construirUrlModeloV1Beta(modelo), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respondé solo la palabra: ok' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (resp.ok) return { ok: true, modelo };

      const errData = await resp.json().catch(() => ({}));
      const msg = (errData as { error?: { message?: string } })?.error?.message || `HTTP ${resp.status}`;
      lastModelError = `${modelo}: ${msg}`;

      if (esErrorModeloRetirado({ status: resp.status, message: msg })) {
        await anotarFalloSeguro('gemini-modelo-retirado', `${modelo}: ${msg}`);
        continue;
      }

      if (![404, 429, 500, 502, 503, 504].includes(resp.status) && !isRecoverableGeminiModelError({ status: resp.status, message: msg })) {
        return { ok: false, error: `Gemini respondió con error: ${msg}` };
      }
    }

    return { ok: false, error: `Gemini no respondió con ningún modelo compatible. ${lastModelError}` };
  } catch (error) {
    return { ok: false, error: extraerMensajeError(error) };
  }
}
