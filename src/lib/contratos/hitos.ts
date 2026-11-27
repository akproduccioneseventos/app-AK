/**
 * Las fechas de la CLÁUSULA 3 del contrato (30% al primer tercio, 50% a la mitad, total treinta días antes).
 *
 * Vivía adentro de la pantalla del contrato, y el recibo —que adjunta el contrato como anexo— no la tenía: el anexo
 * salía impreso con `{{HITO_30}}`, `{{HITO_50}}` y `{{FECHA_SALDO_TOTAL}}` escritos en el papel (auditoría del
 * 18/11/2026, A18-02). Ahora las dos pantallas usan ésta.
 */
import { parseUruguayDate } from '@/lib/utils';

const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];

export function formatFechaEnEspanol(d: Date): string {
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function calcularHitosDeContrato(fechaEventoStr?: string, fechaFirmaStr?: string) {
  let hito30 = '';
  let hito50 = '';
  let fechaSaldoTotal = '';

  if (!fechaEventoStr) return { hito30, hito50, fechaSaldoTotal };
  const eventoDate = parseUruguayDate(fechaEventoStr);
  if (isNaN(eventoDate.getTime())) return { hito30, hito50, fechaSaldoTotal };

  const dSaldo = new Date(eventoDate.getFullYear(), eventoDate.getMonth(), eventoDate.getDate() - 30, 12, 0, 0);
  fechaSaldoTotal = formatFechaEnEspanol(dSaldo);

  const firmaDate = fechaFirmaStr ? parseUruguayDate(fechaFirmaStr) : new Date();
  if (!isNaN(firmaDate.getTime())) {
    const diffDias = Math.round((eventoDate.getTime() - firmaDate.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDias > 0) {
      const d30 = new Date(firmaDate.getFullYear(), firmaDate.getMonth(), firmaDate.getDate() + Math.floor(diffDias / 3), 12, 0, 0);
      hito30 = formatFechaEnEspanol(d30);
      const d50 = new Date(firmaDate.getFullYear(), firmaDate.getMonth(), firmaDate.getDate() + Math.floor(diffDias / 2), 12, 0, 0);
      hito50 = formatFechaEnEspanol(d50);
    }
  }

  return { hito30, hito50, fechaSaldoTotal };
}

/** Los reemplazos de la cláusula 3 y de la fecha de firma, con su texto de respaldo si falta una fecha. */
export function reemplazosDeFechasDelContrato(
  fechaEventoStr: string | undefined,
  fechaFirmaStr: string | undefined,
  hoyTexto: string,
): Record<string, string> {
  const hitos = calcularHitosDeContrato(fechaEventoStr, fechaFirmaStr);
  return {
    '{{FECHA_FIRMA_TEXTO}}': `a los ${hoyTexto}`,
    '{{CIUDAD_FECHA}}': `Salto, a los ${hoyTexto}`,
    '{{HITO_30}}': hitos.hito30 || 'al primer tercio del plazo',
    '{{HITO_50}}': hitos.hito50 || 'a la mitad del plazo',
    '{{FECHA_SALDO_TOTAL}}': hitos.fechaSaldoTotal || '30 días antes del evento',
  };
}

/**
 * Completa en un texto ya guardado los marcadores que quedaron sin llenar. Sólo toca `{{…}}` que tienen reemplazo;
 * el resto del texto queda igual.
 */
export function completarMarcadoresPendientes(texto: string, reemplazos: Record<string, string>): string {
  if (!texto.includes('{{')) return texto;
  let resultado = texto;
  for (const [marcador, valor] of Object.entries(reemplazos)) {
    if (valor === undefined || valor === null) continue;
    resultado = resultado.split(marcador).join(String(valor));
  }
  return resultado;
}
