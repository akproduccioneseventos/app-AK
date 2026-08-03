/**
 * Rellena las plantillas de WhatsApp sin dejar marcadores a la vista.
 *
 * Las plantillas usan marcadores como `{{NOMBRE}}` o `{{SALDO}}`. El riesgo es
 * que un dato falte y el mensaje salga con el marcador crudo: el cliente recibe
 * "Hola {{NOMBRE}}" o "el saldo es {{SALDO}}", que es peor que no mandar nada.
 *
 * También pasa al revés: si el dato viene vacío o como `undefined`, el mensaje
 * dice "Hola undefined".
 *
 * Esta función se ocupa de las dos cosas: reemplaza lo que puede y limpia lo que
 * quedó sin llenar, dejando una frase que igual se entiende.
 */

export type ValoresDePlantilla = Record<string, string | number | null | undefined>;

/** Marcador sin llenar: `{{LO_QUE_SEA}}`. */
const MARCADOR = /\{\{\s*([A-Z_]+)\s*\}\}/g;

function limpiarEspacios(texto: string) {
  return texto
    .replace(/[ \t]{2,}/g, ' ')
    // Un marcador vacío suele dejar basura alrededor: " ,", " .", "( )".
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();
}

export function rellenarPlantilla(plantilla: string, valores: ValoresDePlantilla): string {
  const relleno = plantilla.replace(MARCADOR, (_, clave: string) => {
    const valor = valores[clave];
    if (valor === null || valor === undefined) return '';
    const texto = String(valor).trim();
    return texto === 'undefined' || texto === 'null' ? '' : texto;
  });
  return limpiarEspacios(relleno);
}

/**
 * Los marcadores que quedaron sin llenar. Sirve para avisarle al equipo antes de
 * mandar, en vez de que se entere el cliente.
 */
export function marcadoresSinLlenar(plantilla: string, valores: ValoresDePlantilla): string[] {
  const faltantes: string[] = [];
  for (const coincidencia of plantilla.matchAll(MARCADOR)) {
    const clave = coincidencia[1];
    const valor = valores[clave];
    if (valor === null || valor === undefined || String(valor).trim() === '') {
      if (!faltantes.includes(clave)) faltantes.push(clave);
    }
  }
  return faltantes;
}
