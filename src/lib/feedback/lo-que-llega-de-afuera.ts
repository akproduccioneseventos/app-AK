/**
 * LA ENCUESTA LA CONTESTA CUALQUIERA, ASI QUE NO SE LE CREE NADA.
 *
 * **Lo encontro Codex el 17 de septiembre de 2026.** La encuesta post fiesta es publica a
 * proposito: el cliente la contesta desde el celular sin cuenta. El problema era que lo que
 * llegaba se guardaba **tal cual venia**, sin mirar nada:
 *
 * - Una nota podia venir en 99 o en -5, y el panel del dueno mostraba promedios inventados.
 * - Podian venir **campos internos** que no son del cliente. El peor: `googleReviewRequested`.
 *   Mandandolo en true, la app cree que a ese cliente ya se le pidio la resena en Google y
 *   **no se la pide nunca mas**. Se pierden resenas sin que nadie se entere.
 *
 * Por eso ahora se copia campo por campo lo que si es del cliente, y lo demas se tira. No se
 * "limpia" lo que viene mal: se rechaza, porque una nota fuera de rango es una encuesta que
 * no la mando la pantalla.
 */
import type { FeedbackSubmission } from '@/types/feedback';

export type EncuestaDeAfuera = Omit<FeedbackSubmission, 'id' | 'timestamp'>;

const LARGO_MAXIMO_TEXTO = 2000;
const LARGO_MAXIMO_NOMBRE = 120;

function textoLimpio(valor: unknown, maximo: number): string {
  if (typeof valor !== 'string') return '';
  return valor.trim().slice(0, maximo);
}

function notaEntera(valor: unknown, minimo: number, maximo: number): { ok: boolean; valor?: number } {
  if (valor === undefined || valor === null || valor === '') return { ok: true, valor: undefined };
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) return { ok: false };
  return { ok: true, valor: numero };
}

export function limpiarEncuesta(
  loQueLlego: unknown,
): { ok: true; encuesta: EncuestaDeAfuera } | { ok: false; error: string } {
  if (!loQueLlego || typeof loQueLlego !== 'object') {
    return { ok: false, error: 'No llego ninguna respuesta.' };
  }
  const crudo = loQueLlego as Record<string, unknown>;

  const fiestaId = textoLimpio(crudo.fiestaId, 200);
  const clientName = textoLimpio(crudo.clientName, LARGO_MAXIMO_NOMBRE);
  const enjoyedMost = textoLimpio(crudo.enjoyedMost, LARGO_MAXIMO_TEXTO);
  const toImprove = textoLimpio(crudo.toImprove, LARGO_MAXIMO_TEXTO);

  if (!fiestaId) return { ok: false, error: 'Falta saber de que fiesta es la encuesta.' };
  if (!clientName) return { ok: false, error: 'Falta tu nombre.' };
  // Los dos textos largos los pide la pantalla, pero aca NO se rechazan si vienen vacios: una
  // respuesta del cliente que llego a medias se guarda igual. Perder lo que escribio para
  // castigar un campo vacio seria peor que guardarlo incompleto.

  const nps = notaEntera(crudo.npsScore, 0, 10);
  if (!nps.ok) return { ok: false, error: 'La nota tiene que ser un numero del 0 al 10.' };

  const estrellas: Record<string, number | undefined> = {};
  for (const campo of ['ratingComida', 'ratingMusica', 'ratingOrganizacion', 'ratingLugar'] as const) {
    const nota = notaEntera(crudo[campo], 1, 5);
    if (!nota.ok) return { ok: false, error: 'Las estrellas tienen que ir del 1 al 5.' };
    estrellas[campo] = nota.valor;
  }

  // Campo por campo, a proposito: lo que no este en esta lista NO entra, venga como venga.
  return {
    ok: true,
    encuesta: {
      fiestaId,
      fiestaNombre: textoLimpio(crudo.fiestaNombre, LARGO_MAXIMO_NOMBRE),
      clientName,
      enjoyedMost,
      toImprove,
      generalComments: textoLimpio(crudo.generalComments, LARGO_MAXIMO_TEXTO) || undefined,
      npsScore: nps.valor,
      ratingComida: estrellas.ratingComida,
      ratingMusica: estrellas.ratingMusica,
      ratingOrganizacion: estrellas.ratingOrganizacion,
      ratingLugar: estrellas.ratingLugar,
    },
  };
}
