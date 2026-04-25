/**
 * Utility to parse a pasted AK Producciones budget text into structured data.
 * Supports the format used in the Vana Rodríguez case and similar exports,
 * plus free-form lines like "Hielo — 2.000 UYU", "5 x 400 UYU", "100k", etc.
 */

import type { ItemPresupuestado } from '@/types/presupuesto';

/**
 * Exact-match set of label lines that appear in AK Producciones budget headers/footers
 * and must NEVER be treated as service/item names.
 */
const SKIP_LINES_EXACT = new Set([
  'número de cliente', 'nº de cliente', 'numero de cliente', 'n° de cliente',
  'número de documento', 'nº de documento', 'numero de documento', 'n° de documento',
  'página', 'pagina',
  'fecha', 'fecha del evento', 'fecha del presupuesto',
  'válido hasta', 'valido hasta', 'validez',
  'cliente',
  'hora inicio', 'hora de inicio',
  'invitados',
  'tipo evento', 'tipo de evento',
  'salón', 'salon', 'lugar',
  'artículo', 'articulo',
  'cantidad',
  'unidad',
  'precio', 'precio unitario',
  'desc.%', 'desc %', 'descuento',
  'importe total', 'importe', 'valor', 'total',
  'otros',
  'logo',
  'presupuesto', 'presupuesto para fiestas o eventos',
  'condiciones de reserva', 'condiciones',
  'notas y observaciones', 'notas', 'observaciones',
  'por la empresa', 'por la empresa:', 'firma',
  'tec. alexander knuth', 'alexander knuth',
  'ak producciones', 'ak producciones eventos',
  'artículos', 'servicios', 'ítems', 'items',
]);

/**
 * Prefix-match patterns for lines that are header/footer metadata.
 * If a lowercased line STARTS WITH any of these, skip it.
 * These cover both bare labels and labels followed by a value (e.g. "Número de cliente: 1235").
 */
const SKIP_LINE_PREFIXES = [
  // Document header identifiers with values
  'número de cliente:', 'nº de cliente:', 'numero de cliente:', 'n° de cliente:',
  'número de documento:', 'nº de documento:', 'numero de documento:', 'n° de documento:',
  'nro. de cliente:', 'nro. de documento:',
  'página:', 'pagina:',
  'válido hasta:', 'valido hasta:', 'validez:',
  'hora inicio:', 'hora de inicio:',
  'invitados:',
  'tipo evento:', 'tipo de evento:',
  'salón:', 'salon:', 'lugar:',
  // Contact/company metadata
  'presupuesto para',
  'condición:', 'condicion:',
  'tel:', 'telefono:', 'teléfono:', 'celular:', 'cel:',
  'email:', 'e-mail:', 'correo:',
  'www.', 'http', '@',
  'dirección:', 'direccion:', 'domicilio:',
  'cuit:', 'rut:', 'r.u.t.', 'ruc:',
  'banco:', 'cuenta:', 'alias:', 'cbu:',
];

/**
 * Returns true if the line should be completely ignored as a potential item name.
 */
function shouldSkipLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (!lower) return true;
  if (SKIP_LINES_EXACT.has(lower)) return true;
  for (const prefix of SKIP_LINE_PREFIXES) {
    if (lower.startsWith(prefix)) return true;
  }
  // Lines that are all dashes, equals, or asterisks (dividers)
  if (/^[-=*_]{2,}$/.test(lower)) return true;
  // Lines that are just numbers (e.g. page numbers)
  if (/^\d+$/.test(lower)) return true;
  return false;
}

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
 * Keywords in item names that indicate a gift/bonus with no charge.
 */
const GIFT_KEYWORD_PATTERN = /regalo|bonificado|incluido|sin costo/i;

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
  // Whether the current items block is a "Regalos exclusivos incluidos" block
  let inRegalosBlock = false;
  let currentItemName = '';
  let currentQty = 0;
  let currentUnitPrice = 0;
  let currentDiscount = 0;
  let currentImporte = 0;

  const flushItem = () => {
    if (!currentItemName) return;
    // An item is a gift if: discount = 100%, or we're in the regalos block,
    // or the item name mentions regalo/bonificado/incluido sin costo.
    const esRegaloByDiscount = currentDiscount >= 100;
    const esRegaloByBlock = inRegalosBlock;
    const esRegaloByName = GIFT_KEYWORD_PATTERN.test(currentItemName);
    const esRegalo = esRegaloByDiscount || esRegaloByBlock || esRegaloByName;
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
    const lower = line.toLowerCase().trim();

    // Always skip pure metadata/header/footer labels
    if (shouldSkipLine(line)) continue;

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

      // Detect total declared in header area — be specific to avoid false positives
      if (
        lower.match(/^total\s*:/) ||
        lower.includes('importe total del presupuesto') ||
        lower.includes('total del presupuesto') ||
        lower.match(/^total a pagar\s*:/)
      ) {
        const totalMatch = line.match(/\$?\s*([\d.,\s]+[kK]?)/);
        if (totalMatch) totalDeclarado = cleanNumber(totalMatch[1]);
        continue;
      }

      // Detect start of items section
      if (
        lower.includes('detalle del presupuesto') ||
        lower.includes('detalle de artículos') ||
        lower.includes('detalle de articulos') ||
        lower.includes('servicios incluidos')
      ) {
        inItems = true;
        inRegalosBlock = false;
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
      // Detect "Regalos exclusivos incluidos" sub-section
      if (
        lower.includes('regalos exclusivos incluidos') ||
        lower.includes('regalos incluidos') ||
        lower.includes('bonificaciones incluidas')
      ) {
        flushItem();
        inRegalosBlock = true;
        continue;
      }

      // Total declaration inside items area.
      // IMPORTANT: Only treat as the document total for explicit multi-word phrases
      // ("importe total del presupuesto", "total a pagar", "total general") or a
      // standalone "total: ..." that is NOT inside an active item block.
      // "Importe total: $X" by itself is the item's own total (treated as Importe:).
      const isDocumentTotalLine =
        lower.includes('importe total del presupuesto') ||
        lower.includes('total del presupuesto') ||
        lower.includes('total general') ||
        lower.match(/^total a pagar\s*:/) !== null ||
        lower.match(/^total\s*:/) !== null;

      if (isDocumentTotalLine) {
        flushItem();
        const totalMatch = line.match(/\$?\s*([\d.,\s]+[kK]?)/);
        if (totalMatch) totalDeclarado = cleanNumber(totalMatch[1]);
        inItems = false;
        continue;
      }

      // "Importe total: $X" within an item block — treat as the item's importe (last field)
      if (lower.startsWith('importe total:')) {
        const val = line.replace(/^importe total:\s*/i, '');
        currentImporte = cleanNumber(val);
        flushItem();
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
        const esRegalo = inRegalosBlock || GIFT_KEYWORD_PATTERN.test(nombre);
        items.push({
          idServicioCatalogo: `imported_${items.length}`,
          nombreServicio: nombre,
          cantidad: freeLine.cantidad,
          precioUnitario: freeLine.precioUnitario,
          precioUnitarioPresupuesto: freeLine.precioUnitario,
          esRegalo,
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
