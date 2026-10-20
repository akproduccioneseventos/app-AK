/**
 * Redirecciones de módulos históricos y atajos del portal del cliente.
 * Garantiza que ninguna ruta mande al cliente a pantallas privadas del equipo (/fiestas/nueva).
 */
export const moduleRedirects: Record<string, (fiestaId: string) => string> = {
  'tareas': (fiestaId) => `/portal?fiestaId=${fiestaId}`,
  'musica': (fiestaId) => `/portal-cliente/${fiestaId}/musica`,
  'video-vida': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
  'documentos': (fiestaId) => `/portal/${fiestaId}/contrato`,
  'fotografia': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
};
