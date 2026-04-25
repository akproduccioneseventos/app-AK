/**
 * Utility to parse a pasted AK Producciones budget text into structured data.
 *
 * Important business rule for AK:
 * - Labels, columns and administrative fields from a copied PDF/table are NOT services.
 * - The declared total must be detected as the real total to pay, not added as an item.
 * - Regalos/bonificados are saved as items but never add to the total.
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

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Parse a numeric string that may include currency, thousands, decimals or k suffix.
 */
function cleanNumber(raw: string): number {
  let s = raw
    .replace(/\$/g, '')
    .replace(/UYU/gi, '')
    .replace(/USD/gi, '')
    .replace(/\$U/gi, '')
    .replace(/U\$S/gi, '')
    .trim();

  const kMatch = s.match(/^([\d.,\s]+)[kK]$/);
  if (kMatch) {
    const base = kMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return (parseFloat(base) || 0) * 1000;
  }

  s = s.replace(/\s/g, '');
  if (!s.includes(',') && /\.\d{3}$/.test(s)) {
    s = s.replace(/\./g, '');
  } else {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(s) || 0;
}

function parseEventDate(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim();

  const monthNames: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };

  const monthYearMatch = clean.match(/^([a-záéíóúüñ]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const month = monthNames[monthYearMatch[1].toLowerCase()];
    const year = parseInt(monthYearMatch[2], 10);
    if (month !== undefined) return new Date(year, month, 1).toISOString();
  }

  const dmyMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    return new Date(year, month, day).toISOString();
  }

  const longDateMatch = clean.match(/^(\d{1,2})\s+de\s+([a-záéíóúüñ]+)\s+de\s+(\d{4})$/i);
  if (longDateMatch) {
    const day = parseInt(longDateMatch[1], 10);
    const month = monthNames[longDateMatch[2].toLowerCase()];
    const year = parseInt(longDateMatch[3], 10);
    if (month !== undefined) return new Date(year, month, day).toISOString();
  }

  return '';
}

function looksLikeDate(value: string): boolean {
  return !!parseEventDate(value) || /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/i.test(value);
}

function extractFirstNumber(line: string): number {
  const match = line.match(/\$?\s*([\d.,\s]+[kK]?)/);
  return match ? cleanNumber(match[1]) : 0;
}

function isStartOfItems(line: string): boolean {
  const lower = normalizeText(line);
  return (
    lower.includes('detalle de articulos') ||
    lower.includes('detalle del presupuesto') ||
    lower.includes('detalle de presupuesto') ||
    lower.startsWith('articulos') ||
    lower.startsWith('items') ||
    lower.includes('servicios incluidos') ||
    lower.includes('detalle de servicios')
  );
}

function isGiftSection(line: string): boolean {
  const lower = normalizeText(line);
  return lower.includes('regalos') || lower.includes('bonificados') || lower.includes('incluidos sin costo');
}

function isKnownCategory(line: string): boolean {
  const lower = normalizeText(line);
  const categories = [
    'personal y servicio',
    'vajilla, manteleria y mesa buffet',
    'vajilla manteleria y mesa buffet',
    'catering',
    'servicios tecnicos y fotografia',
    'bebidas',
    'torta y mesa de postres',
    'regalos exclusivos incluidos',
    'otros',
    'condiciones de reserva',
    'notas y observaciones',
    'carteleria y material impreso',
  ];
  return categories.includes(lower);
}

function isAdministrativeLine(line: string): boolean {
  const lower = normalizeText(line).replace(/:$/, '');
  const exact = new Set([
    'logo', 'presupuesto', 'cliente', 'pagina', 'fecha', 'valido hasta', 'valido hasta',
    'nº de cliente', 'no de cliente', 'numero de cliente', 'nº de documento', 'no de documento',
    'numero de documento', 'fecha evento', 'hora inicio', 'invitados', 'tipo evento', 'salon',
    'articulo', 'cantidad', 'unidad', 'precio', 'desc.%', 'desc', 'importe total',
    'precio unitario', 'valor', 'total', 'por la empresa', 'tec. alexander knuth',
    'ak producciones', 'sr. alexander knuth', 'salto, 50000 salto',
  ]);
  if (exact.has(lower)) return true;
  if (lower.includes('akproduccionessalto@gmail.com')) return true;
  if (lower.includes('akproduccioneseventos.com')) return true;
  if (lower.startsWith('el presupuesto es valido')) return true;
  if (lower.startsWith('para asegurar el presupuesto')) return true;
  if (lower.startsWith('seña correspondiente')) return true;
  if (lower.startsWith('sena correspondiente')) return true;
  if (lower.startsWith('saldo restante')) return true;
  if (lower.startsWith('precios 2026')) return true;
  return false;
}

function isUnsafeItemName(name: string): boolean {
  const lower = normalizeText(name).replace(/:$/, '');
  return [
    'cantidad', 'precio unitario', 'importe total', 'valor', 'total', 'numero de cliente',
    'nº de cliente', 'numero de documento', 'nº de documento', 'pagina', 'fecha',
  ].includes(lower);
}

function parsePercent(raw: string): number {
  const match = raw.match(/(\d+(?:[.,]\d+)?)\s*%/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
}

function parseFreeFormLine(line: string): { nombre: string; cantidad: number; precioUnitario: number; total: number } | null {
  if (isAdministrativeLine(line)) return null;
  const sepMatch = line.match(/^(.+?)(?:\s*[—–]\s*|\s+-\s+)(\$?[\d.,\s]+[kK]?\s*(?:UYU|USD|\$U|U\$S)?)$/i);
  if (!sepMatch) return null;
  const nombre = sepMatch[1].trim();
  if (!nombre || isUnsafeItemName(nombre)) return null;
  const total = cleanNumber(sepMatch[2]);
  if (total <= 0) return null;
  return { nombre, cantidad: 1, precioUnitario: total, total };
}

export function parseBudgetText(text: string): ParsedBudget {
  const warnings: string[] = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let clienteNombre = '';
  let eventoFechaRaw = '';
  let eventoFecha = '';
  let eventoTipo = 'Fiesta/Evento';
  let salonFiestas = '';
  let totalDeclarado = 0;
  let senaCondicion = 20;
  let invitadosHeader = 0;

  const items: Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>[] = [];

  let inItems = false;
  let inGiftSection = false;
  let currentItemName = '';
  let currentQty = 0;
  let currentUnitPrice = 0;
  let currentDiscount = 0;
  let currentImporte = Number.NaN;

  const resetCurrent = () => {
    currentItemName = '';
    currentQty = 0;
    currentUnitPrice = 0;
    currentDiscount = 0;
    currentImporte = Number.NaN;
  };

  const flushItem = () => {
    const name = currentItemName.trim();
    if (!name || isUnsafeItemName(name) || isAdministrativeLine(name) || isKnownCategory(name)) {
      resetCurrent();
      return;
    }

    const qty = currentQty > 0 ? currentQty : 1;
    const declaredTotal = Number.isFinite(currentImporte) ? currentImporte : (currentUnitPrice * qty);
    const esRegalo = inGiftSection || currentDiscount >= 100 || declaredTotal === 0;
    const unitForBudget = esRegalo
      ? currentUnitPrice
      : declaredTotal > 0
        ? declaredTotal / qty
        : currentUnitPrice;

    items.push({
      idServicioCatalogo: `imported_${items.length}`,
      nombreServicio: name,
      cantidad: qty,
      precioUnitario: unitForBudget,
      precioUnitarioPresupuesto: unitForBudget,
      esRegalo,
      calculationMethod: 'fijo',
    } as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>);

    resetCurrent();
  };

  for (const line of lines) {
    const lower = normalizeText(line);

    // Header / general data, valid anywhere.
    if (lower.startsWith('cliente:')) {
      clienteNombre = line.replace(/^cliente:\s*/i, '').trim();
      continue;
    }
    if (lower.startsWith('nombre:') && !clienteNombre) {
      clienteNombre = line.replace(/^nombre:\s*/i, '').trim();
      continue;
    }
    if (lower.startsWith('evento:')) {
      const value = line.replace(/^evento:\s*/i, '').trim();
      if (looksLikeDate(value)) {
        eventoFechaRaw = value;
        eventoFecha = parseEventDate(value);
      } else {
        eventoTipo = value || eventoTipo;
      }
      continue;
    }
    if (lower.startsWith('tipo evento:') || lower.startsWith('tipo de evento:')) {
      eventoTipo = line.replace(/^(tipo evento|tipo de evento):\s*/i, '').trim() || eventoTipo;
      continue;
    }
    if (lower.startsWith('fecha del evento:')) {
      eventoFechaRaw = line.replace(/^fecha del evento:\s*/i, '').trim();
      eventoFecha = parseEventDate(eventoFechaRaw);
      continue;
    }
    if (lower.startsWith('fecha:') && !eventoFechaRaw) {
      const value = line.replace(/^fecha:\s*/i, '').trim();
      if (looksLikeDate(value)) {
        eventoFechaRaw = value;
        eventoFecha = parseEventDate(value);
      }
      continue;
    }
    if (lower.startsWith('invitados:')) {
      invitadosHeader = Math.max(0, Math.round(extractFirstNumber(line)));
      continue;
    }
    if (lower.startsWith('salon:') || lower.startsWith('salón:') || lower.startsWith('lugar:')) {
      salonFiestas = line.replace(/^(sal[oó]n|lugar):\s*/i, '').trim();
      continue;
    }

    const senaPctMatch = line.match(/(\d+)%.*se[ñn]a/i) || line.match(/se[ñn]a.*(\d+)%/i);
    if (senaPctMatch) {
      senaCondicion = parseInt(senaPctMatch[1], 10);
      continue;
    }

    if (isStartOfItems(line)) {
      inItems = true;
      continue;
    }

    if (isGiftSection(line)) {
      inItems = true;
      inGiftSection = true;
      continue;
    }

    // End/summary area. Do not let totals become services.
    if (lower.includes('importe total del presupuesto') || lower.includes('total a pagar')) {
      flushItem();
      const amount = extractFirstNumber(line);
      if (amount > 0) totalDeclarado = amount;
      inItems = false;
      continue;
    }
    if (lower.match(/^total\s*:/)) {
      flushItem();
      const amount = extractFirstNumber(line);
      if (amount > 0) totalDeclarado = amount;
      inItems = false;
      continue;
    }

    if (!inItems) {
      const freeLine = parseFreeFormLine(line);
      if (freeLine) {
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
      continue;
    }

    if (isAdministrativeLine(line)) continue;
    if (isKnownCategory(line)) continue;

    if (lower.startsWith('cantidad:')) {
      currentQty = extractFirstNumber(line) || 1;
      continue;
    }
    if (lower.startsWith('precio unitario:') || lower.startsWith('valor:')) {
      currentUnitPrice = extractFirstNumber(line);
      continue;
    }
    if (lower.startsWith('descuento:')) {
      currentDiscount = parsePercent(line) || extractFirstNumber(line);
      continue;
    }
    if (/^\d+(?:[.,]\d+)?\s*%\s+de\s+descuento/i.test(line)) {
      // Usually comes after the importe line in AK text. Keep it as note only.
      if (currentItemName && !Number.isFinite(currentImporte)) currentDiscount = parsePercent(line);
      continue;
    }
    if (lower.startsWith('importe total:') || lower.startsWith('importe:')) {
      currentImporte = extractFirstNumber(line);
      flushItem();
      continue;
    }

    const freeLine = parseFreeFormLine(line);
    if (freeLine) {
      flushItem();
      items.push({
        idServicioCatalogo: `imported_${items.length}`,
        nombreServicio: freeLine.nombre,
        cantidad: freeLine.cantidad,
        precioUnitario: freeLine.precioUnitario,
        precioUnitarioPresupuesto: freeLine.precioUnitario,
        esRegalo: false,
        calculationMethod: 'fijo',
      } as Omit<ItemPresupuestado, 'id' | 'costoTotalItem'>);
      continue;
    }

    // Remaining meaningful lines are service names.
    if (line && !line.match(/^[-=*]+$/)) {
      if (currentItemName && (currentQty > 0 || currentUnitPrice > 0 || Number.isFinite(currentImporte))) {
        flushItem();
      }
      if (!isUnsafeItemName(line) && !isAdministrativeLine(line) && !isKnownCategory(line)) {
        currentItemName = line;
      }
    }
  }

  flushItem();

  const sumaItemsCobrados = Math.round(items
    .filter(it => !it.esRegalo)
    .reduce((sum, it) => sum + ((it.precioUnitarioPresupuesto ?? it.precioUnitario ?? 0) * (it.cantidad || 1)), 0));

  if (totalDeclarado <= 0 && sumaItemsCobrados > 0) {
    totalDeclarado = sumaItemsCobrados;
    warnings.push('No se detectó total declarado. Se usó la suma de ítems cobrados.');
  }

  const diff = Math.round(totalDeclarado - sumaItemsCobrados);
  if (totalDeclarado > 0 && Math.abs(diff) > 1) {
    warnings.push(`La suma de ítems cobrados (${sumaItemsCobrados.toLocaleString('es-UY')}) no coincide con el total declarado (${totalDeclarado.toLocaleString('es-UY')}). Diferencia: ${diff.toLocaleString('es-UY')}.`);
  }

  const invCandidates = items
    .filter(it => !it.esRegalo && it.cantidad >= 50 && it.cantidad <= 500)
    .map(it => it.cantidad);
  const invitadosCantidad = invitadosHeader > 0
    ? invitadosHeader
    : invCandidates.length > 0
      ? Math.max(...invCandidates)
      : 0;

  const garbageItems = items.filter(it => isUnsafeItemName(it.nombreServicio)).length;
  if (garbageItems > 0) {
    warnings.push(`Se ignoraron ${garbageItems} líneas que parecían etiquetas de tabla, no servicios.`);
  }
  if (!clienteNombre) warnings.push('No se encontró el nombre del cliente en el texto. Se usará "Cliente" como nombre provisional.');
  if (!eventoFecha) warnings.push(`Fecha del evento "${eventoFechaRaw}" no pudo parsearse automáticamente. Revisá y ajustá manualmente.`);
  if (items.length === 0) warnings.push('No se detectaron ítems reales en el texto. Verificá el formato.');

  const notas = [
    'Importado desde texto pegado.',
    eventoFechaRaw ? `Fecha original: ${eventoFechaRaw}` : '',
    `Auditoría importador: suma ítems cobrados $${sumaItemsCobrados.toLocaleString('es-UY')} / total declarado $${totalDeclarado.toLocaleString('es-UY')}`,
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
