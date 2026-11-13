/**
 * El porcentaje que deshace un ajuste: si se subió +10% (100 → 110), para volver a 100 hay que bajar 9,0909%.
 *
 * Antes la cuenta multiplicaba de más por 100 (-909%) y revertir un +10% dejaba los precios del catálogo en
 * -890 (prueba funcional del auditor, 12/11/2026). Lo frena `revertir-un-ajuste-vuelve-al-precio.test.ts`.
 */
export function porcentajeInverso(porcentaje: number): number {
  return -porcentaje / (1 + porcentaje / 100);
}

/** Un ajuste de -100% o menos deja precios en cero o negativos: nunca se acepta. */
export function porcentajeDeAjusteValido(porcentaje: number): string | null {
  if (!Number.isFinite(porcentaje) || porcentaje === 0) return 'El porcentaje debe ser un número distinto de cero.';
  if (porcentaje <= -100) return 'No se puede bajar un 100% o más: los precios quedarían en cero o negativos.';
  if (porcentaje > 1000) return 'El porcentaje es demasiado alto.';
  return null;
}
