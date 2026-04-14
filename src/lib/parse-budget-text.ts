/**
 * Utility to parse a pasted AK Producciones budget text into structured data.
 * Supports the format used in the Vana Rodríguez case and similar exports,
 * plus free-form lines like "Hielo — 2.000 UYU", "5 x 400 UYU", "100k", etc.
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

/**
 * Parse a numeric string that may include:
 * - "$" currency prefix
 * - "." or " " as thousand separators
 * - "," as decimal separator
 * - "UYU" / "USD" / "$U" / "U$S" currency suffixes
 * - "k" / "K" suffix meaning × 1000
 */
function cleanNumber(raw: string): number {
  let s = raw
    .replace(/\$/g, '')
    .replace(/UYU/gi, '')
    .replace(/USD/gi, '')
    .replace(/\$U/gi, '')
    .replace(/U\$S/gi, '')
    .trim();

  // Handle "100k" / "2.5k"
  const kMatch = s.match(/^([\d.,\s]+)[kK]$/);
  if (kMatch) {
    const base = kMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return (parseFloat(base) || 0) * 1000;
  }

  // Remove spaces used as thousand separators ("2 000" → "2000")
  s = s.replace(/\s/g, '');
  // Remove dots used as thousand separators only when followed by 3 digits and no comma
  // Rule: if there's no comma and a dot followed by exactly 3 digits at end → thousand separator
  if (!s.includes(',') && /\.\d{3}$/.test(s)) {
    s = s.replace(/\./g, '');
  } else {
    // Otherwise: dots are thousand separators, comma is decimal
    s = s.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(s) || 0;
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
 * Try to parse a free-form line into an item.
 * Supports patterns like:
 *   "Hielo — 2.000 UYU"                → name + price
 *   "5 x 400 UYU"                      → qty × unitPrice (inferred name from next context)
 *   "Mozos (6) — $17.400"              → name with qty in parentheses
 *   "Servicio de DJ: $8.000"           → name: price
 *   "15% de descuento en Decoración"   → discount hint (not an item, just noted)
 * Returns null if the line doesn't look like an item.
 */
function parseFreeFormLine(
  line: string,
): { nombre: string; cantidad: number; precioUnitario: number; descuento: number; total: number } | null {
  // Separators: em dash (—), en dash (–), colon, or " - "
  const sepMatch = line.match(/^(.+?)(?:\s*[—–]\s*|\s*:\s*|\s+-\s+)(\$?[\d.,\s]+[kK]?\s*(?:UYU|USD|\$U|U\$S)?)$/i);
  if (sepMatch) {
    const namePart = sepMatch[1].trim();
    const pricePart = sepMatch[2].trim();
    const price = cleanNumber(pricePart);
    if (price > 0 && namePart.length > 0) {
      // Check if name contains qty in parens: "Mozos (6)"
      const qtyInName = namePart.match(/^(.+?)\s*\((\d+)\)$/);
      if (qtyInName) {
        const qty = parseInt(qtyInName[2], 10);
        return { nombre: qtyInName[1].trim(), cantidad: qty, precioUnitario: price / qty, descuento: 0, total: price };
      }
      return { nombre: namePart, cantidad: 1, precioUnitario: price, descuento: 0, total: price };
    }
  }

  // "5 x 400 UYU" or "5x400"
  const qtyTimesPrice = line.match(/^(\d+)\s*[xX]\s*([\d.,\s]+[kK]?\s*(?:UYU|USD|\$U|U\$S)?)$/i);
  if (qtyTimesPrice) {
    const qty = parseInt(qtyTimesPrice[1], 10);
    const unitPrice = cleanNumber(qtyTimesPrice[2]);
    if (qty > 0 && unitPrice > 0) {
      return { nombre: '', cantidad: qty, precioUnitario: unitPrice, descuento: 0, total: qty * unitPrice };
    }
  }

  return null;
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
    // recalcularCostoItem for 'fijo' = precioUnitario * cantidad.
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
      if (lower.startsWith('nombre:') && !clienteNombre) {
        clienteNombre = line.replace(/^nombre:\s*/i, '').trim();
        continue;
      }
      if (lower.startsWith('fecha del evento:')) {
        eventoFechaRaw = line.replace(/^fecha del evento:\s*/i, '').trim();
        eventoFecha = parseEventDate(eventoFechaRaw);
        continue;
      }
      if (lower.startsWith('fecha:') && !eventoFechaRaw) {
        eventoFechaRaw = line.replace(/^fecha:\s*/i, '').trim();
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
        lower.startsWith('articulos') ||
        lower.includes('servicios incluidos') ||
        lower.includes('ítems') ||
        lower.startsWith('items')
      ) {
        inItems = true;
        continue;
      }

      // Free-form item line before formal section header — try to parse
      const freeLine = parseFreeFormLine(line);
      if (freeLine && freeLine.total > 0 && freeLine.nombre) {
        items.push({
          idServicioCatalogo: `imported_${items.length}`,
          nombreServicio: freeLine.nombre,
          cantidad: freeLine.cantidad,
          precioUnitario: freeLine.precioUnitario,
          precioUnitarioPresupuesto: freeLine.precioUnitario,
          esRegalo: false,
          calculationMethod: 'fijo',
        } as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>);
      }
    }

    // Parse items (structured format with field labels)
    if (inItems) {
      // Total line
      if (lower.includes('importe total') || lower.includes('total general') || lower.match(/^total\s*:/)) {
        const totalMatch = line.match(/\$?\s*([\d.,\s]+[kK]?)/);
        if (totalMatch) totalDeclarado = cleanNumber(totalMatch[1]);
        inItems = false;
        continue;
      }

      if (lower.startsWith('cantidad:')) {
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

      // Free-form item lines inside the items section
      const freeLine = parseFreeFormLine(line);
      if (freeLine && (freeLine.total > 0 || freeLine.precioUnitario > 0)) {
        flushItem(); // flush any pending structured item
        const nombre = freeLine.nombre || currentItemName || `Ítem ${items.length + 1}`;
        items.push({
          idServicioCatalogo: `imported_${items.length}`,
          nombreServicio: nombre,
          cantidad: freeLine.cantidad,
          precioUnitario: freeLine.precioUnitario,
          precioUnitarioPresupuesto: freeLine.precioUnitario,
          esRegalo: false,
          calculationMethod: 'fijo',
        } as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>);
        currentItemName = '';
        continue;
      }

      // Inline discount note: "15% de descuento" — note as warning and skip
      const discountNote = line.match(/(\d+)%\s+de\s+descuento/i);
      if (discountNote && !currentItemName) {
        warnings.push(`Nota de descuento detectada: "${line}" — aplicar manualmente.`);
        continue;
      }

      // Lines that don't match field patterns are item names.
      if (line && !line.match(/^[-=*]+$/)) {
        if (!currentItemName) {
          currentItemName = line;
        } else if (currentQty > 0 || currentUnitPrice > 0 || currentImporte > 0) {
          flushItem();
          currentItemName = line;
        }
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

  if (!clienteNombre) warnings.push('No se encontró el nombre del cliente en el texto. Se usará "Cliente" como nombre provisional.');
  if (!eventoFecha) warnings.push(`Fecha del evento "${eventoFechaRaw}" no pudo parsearse automáticamente. Revisá y ajustá manualmente.`);
  if (items.length === 0) warnings.push('No se detectaron ítems en el texto. Verificá el formato.');

  const notas = [
    'Importado desde texto pegado.',
    eventoFechaRaw ? `Fecha original: ${eventoFechaRaw}` : '',
  ].filter(Boolean).join(' ');

  return {
    clienteNombre: clienteNombre || 'Cliente',
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
