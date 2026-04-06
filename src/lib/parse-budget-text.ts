/**
 * Utility to parse a pasted AK Producciones budget text into structured data.
 * Supports the format used in the Vana Rodríguez case and similar exports.
 */

import type { ItemPresupuestado } from '@/types/presupuesto';

export interface ParsedBudget {
  clienteNombre: string;
  eventoFecha: string; // ISO string, may be approximate
  eventoFechaRaw: string; // original text
  eventoTipo: string;
  invitadosCantidad: number;
  salonFiestas: string;
  items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[];
  totalDeclarado: number; // Total as stated in the text
  senaCondicion: number; // Percentage for deposit (default 20)
  notas: string;
  warnings: string[];
}

function cleanNumber(raw: string): number {
  // Remove currency symbols, dots used as thousand separators, replace comma with dot
  const cleaned = raw
    .replace(/\$/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Parses a date like "Mayo 2026" or "09/05/26" or "09/05/2026" to ISO string.
 * Returns empty string if unparseable.
 */
function parseEventDate(raw: string): string {
  if (!raw) return '';

  const monthNames: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  // "Mayo 2026" → first day of month
  const monthYearMatch = raw.match(/^([a-záéíóúüñ]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const month = monthNames[monthYearMatch[1].toLowerCase()];
    const year = parseInt(monthYearMatch[2], 10);
    if (month !== undefined) {
      return new Date(year, month, 1).toISOString();
    }
  }

  // "09/05/26" or "09/05/2026"
  const dmyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day).toISOString();
  }

  return '';
}

/**
 * Main parser. Accepts the full pasted text and returns a ParsedBudget.
 */
export function parseBudgetText(text: string): ParsedBudget {
  const warnings: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let clienteNombre = '';
  let eventoFechaRaw = '';
  let eventoFecha = '';
  let eventoTipo = 'Otro';
  let salonFiestas = '';
  let totalDeclarado = 0;
  let senaCondicion = 20;
  const items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] = [];

  // Extract header fields (before DETALLE DE ARTÍCULOS)
  let inItems = false;
  let currentItemName = '';
  let currentQty = 0;
  let currentUnitPrice = 0;
  let currentDiscount = 0;
  let currentImporte = 0;

  const flushItem = () => {
    if (!currentItemName) return;
    const esRegalo = currentDiscount >= 100;
    const precioUnitario = currentUnitPrice;
    // Use importe as the declared total; store as costoTotalItem placeholder
    items.push({
      idServicioCatalogo: `imported_${items.length}`,
      nombreServicio: currentItemName,
      cantidad: currentQty || 1,
      precioUnitario,
      precioUnitarioPresupuesto: precioUnitario,
      esRegalo,
      calculationMethod: 'fijo',
    } as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>);
    // Ensure the stored unit price produces the declared importe when multiplied by qty.
    // recalcularCostoItem for 'fijo' = precioUnitario * cantidad, so we set precioUnitario = importe/qty.
    if (currentImporte > 0 && !esRegalo && currentQty > 0) {
      items[items.length - 1].precioUnitario = currentImporte / currentQty;
      items[items.length - 1].precioUnitarioPresupuesto = currentImporte / currentQty;
    } else if (esRegalo) {
      items[items.length - 1].precioUnitario = currentUnitPrice;
      items[items.length - 1].precioUnitarioPresupuesto = currentUnitPrice;
    }
    currentItemName = '';
    currentQty = 0;
    currentUnitPrice = 0;
    currentDiscount = 0;
    currentImporte = 0;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Detect header info
    if (!inItems) {
      if (lower.startsWith('cliente:')) {
        clienteNombre = line.replace(/^cliente:\s*/i, '').trim();
        continue;
      }
      if (lower.startsWith('fecha del evento:')) {
        eventoFechaRaw = line.replace(/^fecha del evento:\s*/i, '').trim();
        eventoFecha = parseEventDate(eventoFechaRaw);
        continue;
      }
      if (lower.startsWith('tipo de evento:') || lower.startsWith('evento:')) {
        eventoTipo = line.replace(/^(tipo de evento|evento):\s*/i, '').trim() || 'Otro';
        continue;
      }
      if (lower.startsWith('salón:') || lower.startsWith('salon:') || lower.startsWith('lugar:')) {
        salonFiestas = line.replace(/^(sal[oó]n|lugar):\s*/i, '').trim();
        continue;
      }
      if (lower.includes('20%') && (lower.includes('seña') || lower.includes('sena'))) {
        senaCondicion = 20;
        continue;
      }
      const senaPctMatch = line.match(/(\d+)%.*se[ñn]a/i) || line.match(/se[ñn]a.*(\d+)%/i);
      if (senaPctMatch) {
        senaCondicion = parseInt(senaPctMatch[1], 10);
        continue;
      }

      // Detect start of items section
      if (
        lower.includes('detalle de artículos') ||
        lower.includes('detalle de articulos') ||
        lower.startsWith('artículos') ||
        lower.startsWith('articulos')
      ) {
        inItems = true;
        continue;
      }
    }

    // Parse items
    if (inItems) {
      // Total line
      if (lower.includes('importe total') || lower.includes('total general') || lower.match(/^total\s*:/)) {
        const totalMatch = line.match(/\$?\s*([\d.,]+)/);
        if (totalMatch) totalDeclarado = cleanNumber(totalMatch[1]);
        inItems = false;
        continue;
      }

      if (lower.startsWith('cantidad:')) {
        // Start of a new item: flush previous
        // (item name is the previous non-field line)
        const val = line.replace(/^cantidad:\s*/i, '');
        currentQty = parseFloat(val.replace(/\./g, '').replace(',', '.')) || 1;
        continue;
      }
      if (lower.startsWith('precio unitario:')) {
        const val = line.replace(/^precio unitario:\s*/i, '');
        if (val.toLowerCase().includes('no figura') || val.toLowerCase().includes('ilegible')) {
          currentUnitPrice = 0;
          warnings.push(`Precio unitario no legible para "${currentItemName}"`);
        } else {
          currentUnitPrice = cleanNumber(val);
        }
        continue;
      }
      if (lower.startsWith('descuento:')) {
        const val = line.replace(/^descuento:\s*/i, '').replace('%', '');
        if (val.toLowerCase().includes('no figura') || val.toLowerCase().includes('ilegible')) {
          currentDiscount = 0;
          warnings.push(`Descuento no legible para "${currentItemName}"`);
        } else {
          currentDiscount = parseFloat(val) || 0;
        }
        continue;
      }
      if (lower.startsWith('importe:')) {
        const val = line.replace(/^importe:\s*/i, '');
        currentImporte = cleanNumber(val);
        // Flush item when we've collected importe (last field)
        flushItem();
        continue;
      }

      // Lines that don't match field patterns are item names.
      // Only treat as item name if we're not currently mid-parsing an item's fields
      // (i.e., after a previous item's Importe: was processed or at the start).
      if (line && !line.match(/^[-=*]+$/)) {
        // A new item name begins when we encounter a non-field line without a pending item name,
        // OR when the current item name is set but we haven't collected any fields yet.
        // The safest check: if currentItemName is empty, this line is a new item name.
        // If currentItemName is set but we already have quantity/price data, this is unexpected -
        // flush what we have (partial item) and start a new one.
        if (!currentItemName) {
          currentItemName = line;
        } else if (currentQty > 0 || currentUnitPrice > 0 || currentImporte > 0) {
          // Mid-item and we see another non-field line: flush partial item and start new
          flushItem();
          currentItemName = line;
        }
        // else: currentItemName is set but no fields yet - ignore duplicate name lines
      }
    }
  }

  // Flush last item
  flushItem();

  // Determine event type from items if not set
  if (eventoTipo === 'Otro' || !eventoTipo) {
    eventoTipo = 'Fiesta/Evento';
  }

  // Infer invitados from items
  const invCandidates = items
    .filter(it => it.cantidad >= 50 && it.cantidad <= 500)
    .map(it => it.cantidad);
  const invitadosCantidad = invCandidates.length > 0 ? Math.max(...invCandidates) : 0;

  if (!clienteNombre) warnings.push('No se encontró el nombre del cliente en el texto.');
  if (!eventoFecha) warnings.push(`Fecha del evento "${eventoFechaRaw}" no pudo parsearse automáticamente. Revisá y ajustá manualmente.`);
  if (items.length === 0) warnings.push('No se detectaron ítems en el texto. Verificá el formato.');

  const notas = [
    'Importado desde texto pegado.',
    eventoFechaRaw ? `Fecha original: ${eventoFechaRaw}` : '',
  ].filter(Boolean).join(' ');

  return {
    clienteNombre,
    eventoFecha,
    eventoFechaRaw,
    eventoTipo,
    invitadosCantidad,
    salonFiestas,
    items,
    totalDeclarado,
    senaCondicion,
    notas,
    warnings,
  };
}
