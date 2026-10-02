/**
 * Formatea la fecha de un evento respetando el día del calendario local
 * sin desfasaje por zona horaria de Greenwich/UTC y SIN perder lo que
 * venga al lado escrito por una persona (la hora, "de 21 a 04 hs").
 * (Orden 68 - Bloque 1 y Orden 109).
 *
 * Ejemplo:
 * - "2026-09-30" -> "30 de setiembre de 2026"
 * - "15/12/2026 a las 21:00" -> "15 de diciembre de 2026 a las 21:00"
 * - "2026-12-15 de 21 a 04 hs" -> "15 de diciembre de 2026 de 21 a 04 hs"
 */
export function formatearFechaEvento(dateString?: string): string {
  if (!dateString) return 'Fecha no definida';
  const texto = dateString.trim();

  try {
    // 1. Con formato de barras: "15/12/2026 a las 21:00"
    const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (conBarras) {
      const day = parseInt(conBarras[1], 10);
      const month = parseInt(conBarras[2], 10) - 1;
      const year = parseInt(conBarras[3], 10);
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) {
        const fechaTexto = d.toLocaleDateString('es-UY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return texto.replace(conBarras[0], fechaTexto);
      }
    }

    // 2. Con formato ISO / guiones: "2026-12-15 de 21 a 04 hs" o "2026-09-05T03:00:00Z"
    const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?/);
    if (iso) {
      const year = parseInt(iso[1], 10);
      const month = parseInt(iso[2], 10) - 1;
      const day = parseInt(iso[3], 10);
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) {
        const fechaTexto = d.toLocaleDateString('es-UY', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const resto = texto.slice(iso[0].length).trim();
        return resto ? `${fechaTexto} ${resto}` : fechaTexto;
      }
    }

    const fecha = new Date(dateString);
    if (Number.isNaN(fecha.getTime())) return 'Fecha inválida';
    return fecha.toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return 'Fecha inválida';
  }
}

/**
 * Formatea la fecha para el Hub del Evento conservando horarios y texto escrito.
 */
export function formatEventDateHub(value?: string): string | null {
  if (!value) return null;
  const texto = value.trim();

  const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const date = new Date(Number(conBarras[3]), Number(conBarras[2]) - 1, Number(conBarras[1]), 12, 0, 0);
    if (!Number.isNaN(date.getTime())) {
      const fechaTexto = new Intl.DateTimeFormat('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
      return texto.replace(conBarras[0], fechaTexto);
    }
  }

  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?/);
  if (iso) {
    const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 12, 0, 0);
    if (!Number.isNaN(date.getTime())) {
      const fechaTexto = new Intl.DateTimeFormat('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
      const resto = texto.slice(iso[0].length).trim();
      return resto ? `${fechaTexto} ${resto}` : fechaTexto;
    }
  }

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}
