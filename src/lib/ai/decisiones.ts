import 'server-only';

import {
  decidirConCerebro,
  type DecidirParams,
  type EntradaDecision,
  type PreguntaDecision,
  type RespuestaDecision,
} from '@/ai/cerebro';

export type {
  EntradaDecision,
  PreguntaDecision,
  RespuestaDecision,
  DecidirParams,
};

/**
 * Llama a la API de Gemini Decisions mediante `decidirConCerebro` respetando
 * el interruptor de Ajustes de IA, la clave de API, el tope mensual de consumo
 * y un corte estricto de 3 segundos. Ante cualquier falta o demora devuelve `null`.
 */
export async function decidir(
  params: DecidirParams,
): Promise<Record<string, RespuestaDecision> | null> {
  return decidirConCerebro(params);
}
