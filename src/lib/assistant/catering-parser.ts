/**
 * Parser de menús de catering.
 * Convierte texto libre de menús en objetos estructurados listos para el
 * catálogo de servicios de la empresa.
 *
 * Formatos soportados:
 *   "Hamburguesa completa  $350"
 *   "- Mini croissant jamón y queso — 2.500 UYU"
 *   "Tabla de quesos y fiambres x 10 pax   $1.800"
 *   "ENTRADAS:\n- ..."
 */

export interface CateringItem {
  nombre: string;
  descripcion?: string;
  precio?: number;
  unidad?: string;  // "por persona", "por bandeja", etc.
  categoria: string;
  pax?: number;     // cantidad de personas incluidas en el precio
}

export interface ParsedCateringMenu {
  items: CateringItem[];
  warnings: string[];
}

// Palabras que indican categoría
const CATEGORY_HEADERS: Array<[RegExp, string]> = [
  [/entradas?/i, 'Entradas'],
  [/plato\s*principal|principales?|segundos?/i, 'Platos principales'],
  [/postres?/i, 'Postres'],
  [/bebidas?/i, 'Bebidas'],
  [/extra|adicional/i, 'Extras'],
  [/desayuno|merienda|coffee/i, 'Desayunos y meriendas'],
  [/cena|almuerzo|banquete|buffet/i, 'Servicio de mesa'],
  [/tragos?|cocktail|aperitivo/i, 'Tragos y aperitivos'],
  [/barra\s+libre/i, 'Barra libre'],
  [/torta|pastel|cupcake/i, 'Repostería'],
  [/men[uú]/i, 'Menú'],
];

/** Limpia y parsea un valor numérico de precio. */
function cleanPrice(raw: string): number {
  let s = raw
    .replace(/\$/g, '')
    .replace(/UYU/gi, '')
    .replace(/USD/gi, '')
    .replace(/\$U/gi, '')
    .replace(/U\$S/gi, '')
    .trim();

  // "100k"
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

/** Detecta si una línea es un encabezado de categoría. */
function detectCategory(line: string): string | null {
  for (const [pattern, label] of CATEGORY_HEADERS) {
    if (pattern.test(line)) return label;
  }
  // Línea en MAYÚSCULAS con pocos tokens → probablemente es un encabezado
  if (line === line.toUpperCase() && line.length > 2 && line.length < 40 && !/\d/.test(line)) {
    return line.trim();
  }
  // "Sección:" (termina en dos puntos)
  if (/^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+:$/.test(line.trim())) {
    return line.replace(/:$/, '').trim();
  }
  return null;
}

/** Extrae pax de expresiones como "x 10 pax", "para 8 personas". */
function extractPax(text: string): number | undefined {
  const m =
    text.match(/\bx?\s*(\d+)\s*pax\b/i) ||
    text.match(/\bpara\s+(\d+)\s+personas?\b/i) ||
    text.match(/\b(\d+)\s+personas?\b/i);
  return m ? parseInt(m[1], 10) : undefined;
}

/** Extrae unidad de precio de expresiones como "por persona", "por bandeja". */
function extractUnidad(text: string): string | undefined {
  const m = text.match(/\bpor\s+(persona|bandeja|unidad|porci[oó]n|pax)\b/i);
  return m ? m[0] : undefined;
}

/**
 * Parsea texto libre de menú de catering y devuelve items estructurados.
 */
export function parseCateringMenu(text: string): ParsedCateringMenu {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items: CateringItem[] = [];
  const warnings: string[] = [];
  let currentCategory = 'General';

  // Price separators: em dash, en dash, colon, tab, multiple spaces
  const priceSepPat =
    /^(.*?)\s*(?:[—–]|\s{2,}|\t)\s*(\$?[\d.,\s]+[kK]?\s*(?:UYU|USD|\$U|U\$S)?)\s*$/;
  // Inline price: "Nombre $350" or "Nombre: $350"
  const inlinePricePat = /^(.*?)\s*[:.]?\s*\$\s*([\d.,\s]+[kK]?)\s*$/;

  for (const line of lines) {
    // Skip decorative dividers
    if (/^[-=*_]+$/.test(line)) continue;

    // Detect category header
    const catLabel = detectCategory(line);
    if (catLabel) {
      currentCategory = catLabel;
      continue;
    }

    // Clean leading bullets
    const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
    if (!cleanLine) continue;

    let nombre = '';
    let precio: number | undefined;

    // Try separator pattern first
    const sepMatch = cleanLine.match(priceSepPat);
    if (sepMatch) {
      nombre = sepMatch[1].replace(/^[-•*]\s*/, '').trim();
      precio = cleanPrice(sepMatch[2]);
    } else {
      // Try inline price
      const inlineMatch = cleanLine.match(inlinePricePat);
      if (inlineMatch) {
        nombre = inlineMatch[1].replace(/^[-•*]\s*/, '').trim();
        precio = cleanPrice(inlineMatch[2]);
      }
    }

    if (!nombre) {
      // Line with no detectable price — treat as item name with no price
      nombre = cleanLine.replace(/^[-•*]\s*/, '').trim();
    }

    // Skip lines that are too short or clearly not items
    if (nombre.length < 3) continue;
    if (/^(total|subtotal|seña|sena|iva|nota|observ|precio|descripci[oó]n)/i.test(nombre)) continue;

    const pax = extractPax(cleanLine);
    const unidad = extractUnidad(cleanLine);

    // Remove pax/unidad info from name
    const nombreClean = nombre
      .replace(/\bx?\s*\d+\s*pax\b/gi, '')
      .replace(/\bpara\s+\d+\s+personas?\b/gi, '')
      .replace(/\bpor\s+(?:persona|bandeja|unidad|porci[oó]n|pax)\b/gi, '')
      .trim();

    if (nombreClean.length < 2) continue;

    if (!precio) {
      warnings.push(`"${nombreClean}" detectado sin precio.`);
    }

    items.push({
      nombre: nombreClean,
      precio,
      unidad,
      pax,
      categoria: currentCategory,
    });
  }

  if (items.length === 0) {
    warnings.push(
      'No se detectaron ítems de catering en el texto. Verificá el formato: cada ítem debe estar en su propia línea con nombre y precio.'
    );
  }

  return { items, warnings };
}
