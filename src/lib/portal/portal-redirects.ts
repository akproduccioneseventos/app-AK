export const moduleRedirects: Record<string, (fiestaId: string) => string> = {
  'tareas': (fiestaId) => `/portal?fiestaId=${fiestaId}`,
  'musica': (fiestaId) => `/portal-cliente/${fiestaId}/musica`,
  'video-vida': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
  'documentos': (fiestaId) => `/portal/${fiestaId}/contrato`,
  'fotografia': (fiestaId) => `/portal-cliente/${fiestaId}/fotos-video`,
};
