/**
 * @fileOverview La voz real del Asistente AK, con la voz de Gemini (3 de octubre de 2026).
 *
 * Decisión del dueño: la voz de Gemini, que tiene una parte gratis por día, y la voz del teléfono,
 * cada una con su interruptor en Ajustes. Antes se usaba la voz de Google Cloud, que es otro
 * servicio y cobra pasado un tope mensual.
 *
 * Si no hay clave, la voz está apagada, se pasó el tope del día o Gemini no contesta, tira un
 * error explícito y el reproductor usa la voz del teléfono (si está prendida). NUNCA devuelve un
 * tono haciéndose pasar por voz (orden 110).
 */

import { MODELOS_GEMINI } from '@/ai/modelos';
import { pedirVoz, pcmAWav, limpiarTextoParaVoz } from '@/ai/cerebro';
import { VOCES_IA_DISPONIBLES, VOZ_POR_OMISION } from './voces-ia';

export { VOCES_IA_DISPONIBLES, VOZ_POR_OMISION, pcmAWav, limpiarTextoParaVoz };

export interface OpcionesVozGemini {
  voz?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
  verificarTope?: boolean;
}

const modelosVozEnv = (process.env.GEMINI_TTS_MODEL || '')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** El modelo se puede cambiar sin tocar código si Google lo renombra. */
export const MODELOS_DE_VOZ: string[] = modelosVozEnv.length
  ? modelosVozEnv
  : [...MODELOS_GEMINI.voz];

/**
 * Pide la voz a Gemini a través del cerebro y devuelve un WAV listo para reproducir.
 * Tira un error si no hay clave o Gemini no contesta (por ejemplo, tope gratis del día: 429).
 */
export async function sintetizarVozGemini(texto: string, opciones?: OpcionesVozGemini): Promise<Buffer> {
  return pedirVoz({
    texto,
    voz: opciones?.voz,
    apiKey: opciones?.apiKey,
    fetchFn: opciones?.fetchFn,
    modelos: MODELOS_DE_VOZ,
    verificarTope: opciones?.verificarTope ?? true,
  });
}
