/**
 * Los marcadores que se pueden usar en las plantillas de contrato.
 *
 * Problema real que motivó esto: había DOS nombres para lo mismo. El editor de
 * plantillas ofrece `{{CLIENTE_DIRECCION}}` y el contrato original usa
 * `{{CLIENTE_DOMICILIO}}`. El generador sólo reemplazaba el primero, así que una
 * plantilla copiada del contrato original salía impresa con
 * `{{CLIENTE_DOMICILIO}}` escrito en el papel que firma el cliente.
 *
 * Acá viven los dos: el nombre bueno y los sinónimos que hay que aceptar. Si
 * agregás un marcador nuevo al generador, agregalo también acá o el editor lo va
 * a marcar como inventado.
 */

/**
 * Sinónimos aceptados. La clave es el nombre viejo o alternativo; el valor, el
 * nombre que el generador sabe reemplazar.
 */
export const SINONIMOS_DE_MARCADORES: Record<string, string> = {
  '{{CLIENTE_DOMICILIO}}': '{{CLIENTE_DIRECCION}}',
  '{{FECHA_EVENTO}}': '{{EVENTO_FECHA}}',
  '{{SALON}}': '{{EVENTO_SALON}}',
  '{{MONTO_SENA}}': '{{SENIA}}',
  '{{CIUDAD_FECHA}}': '{{FECHA_HOY}}',
};

/** Marcadores que el generador sabe completar. */
export const MARCADORES_CONOCIDOS = [
  '{{FECHA_HOY}}',
  '{{EMPRESA_NOMBRE}}',
  '{{EMPRESA_RUT}}',
  '{{EMPRESA_DIRECCION}}',
  '{{EMPRESA_EMAIL}}',
  '{{CLIENTE_NOMBRE}}',
  '{{CLIENTE_DIRECCION}}',
  '{{CLIENTE_CI}}',
  '{{CLIENTE_TELEFONO}}',
  '{{EVENTO_FECHA}}',
  '{{EVENTO_SALON}}',
  '{{PRESUPUESTO_TOTAL}}',
  '{{SENIA}}',
  '{{MOTIVO_CANCELACION}}',
  '{{NUEVA_FECHA}}',
  '{{PENALIZACION_PORCENTAJE}}',
  '{{NOMBRE_SALON}}',
] as const;

/**
 * Suma a la tabla de reemplazos los sinónimos, apuntando al mismo valor que el
 * nombre bueno. Así una plantilla vieja se completa igual que una nueva.
 */
export function conSinonimos(reemplazos: Record<string, string>): Record<string, string> {
  const completo = { ...reemplazos };
  for (const [sinonimo, nombreBueno] of Object.entries(SINONIMOS_DE_MARCADORES)) {
    if (completo[sinonimo] === undefined && reemplazos[nombreBueno] !== undefined) {
      completo[sinonimo] = reemplazos[nombreBueno];
    }
  }
  return completo;
}

/**
 * Devuelve los marcadores de un texto que el sistema NO sabe completar. Se usa
 * al guardar la plantilla, para avisar antes y no cuando el contrato ya salió
 * impreso con el hueco.
 */
export function marcadoresDesconocidos(texto: string): string[] {
  const encontrados = texto.match(/\{\{[^}]+\}\}/g) ?? [];
  const validos = new Set<string>([
    ...MARCADORES_CONOCIDOS,
    ...Object.keys(SINONIMOS_DE_MARCADORES),
  ]);
  return Array.from(new Set(encontrados.filter(m => !validos.has(m))));
}
