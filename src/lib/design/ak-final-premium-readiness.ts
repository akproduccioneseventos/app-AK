export type AkFinalPremiumArea =
  | 'invitacion'
  | 'portal_invitado'
  | 'portal_cliente'
  | 'muro_social'
  | 'panel_operador'
  | 'app_interna';

export type AkFinalPremiumReadinessItem = {
  area: AkFinalPremiumArea;
  title: string;
  description: string;
  priority: number;
  mustHave: boolean;
};

export const AK_FINAL_PREMIUM_READINESS: AkFinalPremiumReadinessItem[] = [
  { area: 'invitacion', title: 'Portada fuerte', description: 'Foto/video, fecha, lugar y CTA de confirmar en primer impacto.', priority: 1, mustHave: true },
  { area: 'invitacion', title: 'RSVP simple', description: 'Confirmación individual clara, sin acompañantes libres.', priority: 2, mustHave: true },
  { area: 'portal_invitado', title: 'Acciones grandes', description: 'QR, mapa, muro y música como botones visibles en celular.', priority: 1, mustHave: true },
  { area: 'portal_invitado', title: 'Datos esenciales', description: 'Mesa, hora, ubicación, estado y dress code sin buscar demasiado.', priority: 2, mustHave: true },
  { area: 'portal_cliente', title: 'Resumen VIP', description: 'Portada personalizada con próximo paso, pagos y organización.', priority: 1, mustHave: true },
  { area: 'portal_cliente', title: 'Post-evento', description: 'Álbum, fotos, filmación, entregas y recordatorio de descarga.', priority: 2, mustHave: true },
  { area: 'muro_social', title: 'Pantalla show', description: 'Visual oscuro/neón, QR, carrusel, ranking, sorteos y contenido aprobado.', priority: 1, mustHave: true },
  { area: 'panel_operador', title: 'Moderación rápida', description: 'Pendientes primero, aprobar, ocultar, destacar y quitar de pantalla.', priority: 1, mustHave: true },
  { area: 'app_interna', title: 'Mission Control', description: 'Vista diaria con alertas, tareas, pagos, eventos y próximos pasos.', priority: 1, mustHave: true },
  { area: 'app_interna', title: 'Módulos limpios', description: 'CRM, planificador, finanzas y documentos con jerarquía visual consistente.', priority: 2, mustHave: true },
];

export function getAkFinalPremiumReadinessByArea(area: AkFinalPremiumArea): AkFinalPremiumReadinessItem[] {
  return AK_FINAL_PREMIUM_READINESS
    .filter(item => item.area === area)
    .sort((a, b) => a.priority - b.priority);
}

export function buildAkFinalPremiumSummary(): string {
  const areas = Array.from(new Set(AK_FINAL_PREMIUM_READINESS.map(item => item.area)));
  return areas
    .map(area => `${area}: ${getAkFinalPremiumReadinessByArea(area as AkFinalPremiumArea).map(item => item.title).join(', ')}`)
    .join(' | ');
}

export function isAkFinalPremiumReady(completedTitles: string[]): boolean {
  const completed = new Set(completedTitles);
  return AK_FINAL_PREMIUM_READINESS
    .filter(item => item.mustHave)
    .every(item => completed.has(item.title));
}
