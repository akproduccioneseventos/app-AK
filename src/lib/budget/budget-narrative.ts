import type { Presupuesto, ItemPresupuestado } from '@/types/presupuesto';

/**
 * Genera un resumen narrativo claro y fidedigno de lo contratado en el presupuesto.
 *
 * REGLA DURA: Describe únicamente los servicios, cantidades y características
 * efectivamente presentes en el presupuesto. NO inventa precios, cálculos ni conceptos
 * inexistentes.
 */
export function buildPresupuestoNarrative(presupuesto: Presupuesto): string {
  if (!presupuesto) return '';

  const totalInvitados =
    (Number(presupuesto.invitadosAdultos) || 0) +
    (Number(presupuesto.invitadosNinos) || 0) +
    (Number(presupuesto.invitadosAdolescentes) || 0) ||
    Number(presupuesto.invitadosCantidad) ||
    0;

  const tipoEventoRaw = (presupuesto.eventoTipo || 'evento').trim().toLowerCase();
  const tipoEventoMap: Record<string, string> = {
    '15_anos': 'quince años',
    '15 años': 'quince años',
    'xv': 'quince años',
    'xv años': 'quince años',
    '15 anos': 'quince años',
    'quince': 'quince años',
    'boda': 'boda',
    'casamiento': 'casamiento',
    'cumpleaños': 'cumpleaños',
    'cumpleanos': 'cumpleaños',
    'cumpleaños infantil': 'cumpleaños infantil',
    'infantil': 'cumpleaños infantil',
    'evento corporativo': 'evento corporativo',
    'empresarial': 'evento empresarial',
    'corporativo': 'evento corporativo',
    'graduacion': 'fiesta de graduación',
  };
  const tipoEventoLabel = tipoEventoMap[tipoEventoRaw] || tipoEventoRaw;

  const salonNombre = (presupuesto.salonFiestas || '').trim();
  const esClubUruguay =
    salonNombre.toLowerCase().includes('club uruguay') ||
    salonNombre.toLowerCase().includes('uruguay');

  const items: ItemPresupuestado[] = Array.isArray(presupuesto.itemsPresupuestados)
    ? presupuesto.itemsPresupuestados
    : [];

  const highlights: string[] = [];

  const itemNames: string[] = items.map((it: ItemPresupuestado) =>
    (it.nombreServicio || it.nombre || '').toLowerCase()
  );
  const itemCats: string[] = items.map((it: ItemPresupuestado) =>
    (it.categoriaServicio || it.subcategoria || '').toLowerCase()
  );

  // 1. Gastronomía / Catering
  const hasCatering = itemCats.some((c: string) => c.includes('gastronom') || c.includes('catering') || c.includes('menu'))
    || itemNames.some((n: string) => n.includes('menú') || n.includes('menu') || n.includes('cena') || n.includes('plato') || n.includes('asado') || n.includes('pizza') || n.includes('entrada'));
  if (hasCatering) {
    highlights.push('servicio gastronómico completo con atención');
  }

  // 2. Bebidas / Barra
  const hasBebidas = itemCats.some((c: string) => c.includes('bebida') || c.includes('barra'))
    || itemNames.some((n: string) => n.includes('barra de trago') || n.includes('bebida') || n.includes('cerveza') || n.includes('cocteler'));
  if (hasBebidas) {
    highlights.push('servicio de bebidas y barra');
  }

  // 3. Discoteca / Sonido / Luces / DJ
  const hasDJ = itemCats.some((c: string) => c.includes('discoteca') || c.includes('dj') || c.includes('sonido') || c.includes('iluminac'))
    || itemNames.some((n: string) => n.includes('dj') || n.includes('discoteca') || n.includes('sonido') || n.includes('luces') || n.includes('pantalla'));
  if (hasDJ) {
    highlights.push('discoteca profesional, iluminación y ambientación acústica');
  }

  // 4. Fotografía / Video / Cabina / Plataforma 360
  const hasPhotoVideo = itemCats.some((c: string) => c.includes('foto') || c.includes('video') || c.includes('cabina') || c.includes('entretenimiento'))
    || itemNames.some((n: string) => n.includes('fotograf') || n.includes('fotocabina') || n.includes('360') || n.includes('video') || n.includes('cobertura'));
  if (hasPhotoVideo) {
    const photoDetails: string[] = [];
    if (itemNames.some((n: string) => n.includes('fotocabina') || n.includes('cabina'))) photoDetails.push('fotocabina interactiva');
    if (itemNames.some((n: string) => n.includes('360'))) photoDetails.push('plataforma 360');
    if (itemNames.some((n: string) => n.includes('foto') || n.includes('video'))) photoDetails.push('cobertura audiovisual');
    if (photoDetails.length > 0) {
      highlights.push(photoDetails.join(' y '));
    }
  }

  // 5. Decoración / Ambientación
  const hasDeco = itemCats.some((c: string) => c.includes('decor') || c.includes('ambientac') || c.includes('mobiliario'))
    || itemNames.some((n: string) => n.includes('decorac') || n.includes('living') || n.includes('mesas') || n.includes('mantel'));
  if (hasDeco) {
    highlights.push('decoración y ambientación de salón');
  }

  // Construcción del párrafo
  let intro = '';
  if (totalInvitados > 0 && salonNombre) {
    intro = `Para tu fiesta de ${tipoEventoLabel} de ${totalInvitados} invitados en ${salonNombre}, esta propuesta incluye`;
  } else if (totalInvitados > 0) {
    intro = `Para tu fiesta de ${tipoEventoLabel} estimada en ${totalInvitados} invitados, esta propuesta incluye`;
  } else if (salonNombre) {
    intro = `Para tu fiesta de ${tipoEventoLabel} en ${salonNombre}, esta propuesta incluye`;
  } else {
    intro = `Para tu fiesta de ${tipoEventoLabel}, esta propuesta integral incluye`;
  }

  let body = '';
  if (highlights.length === 0) {
    body = ` la selección detallada de servicios que figura a continuación`;
  } else if (highlights.length === 1) {
    body = ` ${highlights[0]}`;
  } else if (highlights.length === 2) {
    body = ` ${highlights[0]} y ${highlights[1]}`;
  } else {
    const allExceptLast = highlights.slice(0, -1).join(', ');
    const last = highlights[highlights.length - 1];
    body = ` ${allExceptLast} y ${last}`;
  }

  let conclusion = '.';
  if (esClubUruguay) {
    conclusion = ', con la ventaja de que el salón Club Uruguay ya incluye la limpieza completa previa y posterior al evento.';
  } else if (salonNombre) {
    conclusion = ', coordinado de punta a punta para que disfrutes de la noche sin preocupaciones.';
  }

  return `${intro}${body}${conclusion}`;
}
