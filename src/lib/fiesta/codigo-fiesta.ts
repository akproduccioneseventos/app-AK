import { randomInt } from 'crypto';

/**
 * Alfabeto sin caracteres ambiguos (sin 0, O, 1, I ni L) para los códigos
 * cortos de 6 caracteres que identifican a cada fiesta.
 */
export const ALFABETO_CODIGO_FIESTA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const LONGITUD_CODIGO_FIESTA = 6;

export function normalizarCodigoFiesta(codigo?: string | null): string {
  return String(codigo || '').trim().toUpperCase();
}

export function generarCodigoFiesta(longitud = LONGITUD_CODIGO_FIESTA): string {
  let codigo = '';
  for (let i = 0; i < longitud; i++) {
    codigo += ALFABETO_CODIGO_FIESTA[randomInt(0, ALFABETO_CODIGO_FIESTA.length)];
  }
  return codigo;
}

export function generarCodigoFiestaUnico(
  codigosExistentes: Iterable<string | undefined | null>,
): string {
  const usados = new Set<string>();
  for (const c of codigosExistentes) {
    const norm = normalizarCodigoFiesta(c);
    if (norm) usados.add(norm);
  }

  for (let intento = 0; intento < 500; intento++) {
    const candidato = generarCodigoFiesta();
    if (!usados.has(candidato)) {
      return candidato;
    }
  }

  return generarCodigoFiesta(LONGITUD_CODIGO_FIESTA);
}
