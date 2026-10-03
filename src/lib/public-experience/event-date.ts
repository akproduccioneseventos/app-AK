const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

export function parseEventDate(value?: string): Date | null {
  if (!value) return null;

  const conBarras = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const parsed = new Date(Number(conBarras[3]), Number(conBarras[2]) - 1, Number(conBarras[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const dateOnly = value.match(DATE_ONLY_PATTERN);
  const parsed = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDaysUntilEvent(value?: string, now = new Date()): number | null {
  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  return Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
}

export function formatEventDate(value?: string): string | null {
  if (!value) return null;
  const texto = value.trim();

  // 1. Barras: "15/12/2026 a las 21:00"
  const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (conBarras) {
    const d = new Date(Number(conBarras[3]), Number(conBarras[2]) - 1, Number(conBarras[1]));
    if (!Number.isNaN(d.getTime())) {
      const fechaTexto = d.toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return texto.replace(conBarras[0], fechaTexto);
    }
  }

  // 2. ISO / guiones: "2026-10-15 a las 21:00" o "2026-09-05T03:00:00Z"
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?/);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      const fechaTexto = d.toLocaleDateString('es-UY', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      const resto = texto.slice(iso[0].length).trim();
      return resto ? `${fechaTexto} ${resto}` : fechaTexto;
    }
  }

  const eventDate = parseEventDate(value);
  if (!eventDate) return null;

  return eventDate.toLocaleDateString('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
