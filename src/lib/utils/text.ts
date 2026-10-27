/**
 * Utilidades de formato y capitalización para textos de cara al usuario.
 */

const TECHNICAL_ACRONYMS = [
  'AK',
  'DJs',
  'DJ',
  'LEDs',
  'LED',
  'QR',
  'IA',
  'VIP',
  'TV',
  'HD',
  '4K',
  'PWA',
  'PDF',
  'DMX',
  'RSVP',
  'OFF',
];

const ESSENTIAL_ACCENT_WORDS = [
  'mantelería',
  'menú',
  'menús',
  'guarnición',
  'recepción',
  'salón',
  'animación',
  'iluminación',
  'ambientación',
  'decoración',
  'fotografía',
  'gastronomía',
  'música',
];

/**
 * Convierte un texto a Sentence Case ("Primera mayúscula y después minúscula bien escrito"),
 * corrigiendo abreviaturas informales como "c/" -> "con", preservando siglas técnicas (AK, DJ, LED, etc.)
 * y asegurando tildes esenciales (Mantelería, Menú, Guarnición).
 */
export function toSentenceCase(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';

  let trimmed = text.trim();
  if (!trimmed) return '';

  // 1. Reemplazar abreviatura informal "c/" o "c/ " por "con "
  trimmed = trimmed.replace(/(^|\s)[cC]\/(?:\s*)/g, '$1con ');

  // 2. Normalizar espacios
  trimmed = trimmed.replace(/\s+/g, ' ');

  // 3. Convertir a minúsculas
  let lower = trimmed.toLowerCase();

  // 4. Primera letra en mayúscula
  let result = lower.charAt(0).toUpperCase() + lower.slice(1);

  // 5. Capitalizar luego de dos puntos o punto y espacio ("Entrada: Arrolladitos...")
  result = result.replace(/([.:?!]\s+)([a-záéíóúñ])/gi, (_, p1, p2) => p1 + p2.toUpperCase());

  // 6. Preservar siglas técnicas
  for (const acronym of TECHNICAL_ACRONYMS) {
    const pattern = new RegExp(`\\b${acronym}\\b`, 'gi');
    result = result.replace(pattern, acronym);
  }
  // Marca comercial AK Producciones
  result = result.replace(/\bAK\s+producciones\b/gi, 'AK Producciones');

  // 7. Corregir tildes esenciales respetando mayúscula inicial si corresponde
  for (const wordWithAccent of ESSENTIAL_ACCENT_WORDS) {
    const unaccented = wordWithAccent.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pattern = new RegExp(`\\b(${wordWithAccent}|${unaccented})\\b`, 'gi');
    result = result.replace(pattern, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        return wordWithAccent.charAt(0).toUpperCase() + wordWithAccent.slice(1);
      }
      return wordWithAccent;
    });
  }

  // 8. Normalizar "bufet" a "buffet" en contexto gastronómico
  result = result.replace(/\b([Mm]esa|[Cc]atering)\s+bufet\b/gi, (match) => {
    return match.replace(/bufet/i, 'buffet');
  });

  return result;
}
