/**
 * Enlace de documento del cliente (Orden 285 - Bloque 3).
 *
 * Si el dato guardado es una ruta de computadora (contiene /, \ o :),
 * no se arma un enlace roto a /api/... sino que devuelve null para que
 * la pantalla deshabilite el botón con el mensaje de que quedó en una computadora.
 * Si ya es una URL https:// se devuelve tal cual.
 * Si es un nombre suelto de archivo, apunta a /api/${tipo}/${valor}.
 */
export function enlaceDeDocumentoDelCliente(
  valor: string | undefined | null,
  tipo: 'contracts' | 'budgets' | 'salon-contracts'
): string | null {
  if (!valor || typeof valor !== 'string') return null;
  const limpio = valor.trim();
  if (!limpio) return null;

  if (limpio.startsWith('https://')) {
    return limpio;
  }

  if (limpio.includes('/') || limpio.includes('\\') || limpio.includes(':')) {
    return null;
  }

  return `/api/${tipo}/${limpio}`;
}
