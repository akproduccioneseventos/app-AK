import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type PublicSocialEvent = Pick<
  FiestaEnPlanificacion,
  | 'id'
  | 'socialGallerySettings'
  | 'modulosContratados'
  | 'zonaDigitalAdolescentes'
  | 'buzonConfig'
  | 'galeriaUrl'
> & {
  configuracion: Pick<FiestaEnPlanificacion['configuracion'], 'nombreEvento' | 'fechaEvento'>;
  clientAccessGranted: boolean;
};

export function toPublicSocialEvent(
  fiesta: FiestaEnPlanificacion,
  clientAccessGranted = false,
): PublicSocialEvent {
  return {
    id: fiesta.id,
    configuracion: {
      nombreEvento: fiesta.configuracion.nombreEvento,
      fechaEvento: fiesta.configuracion.fechaEvento,
    },
    socialGallerySettings: fiesta.socialGallerySettings,
    modulosContratados: fiesta.modulosContratados,
    zonaDigitalAdolescentes: fiesta.zonaDigitalAdolescentes,
    buzonConfig: fiesta.buzonConfig,
    galeriaUrl: fiesta.galeriaUrl,
    clientAccessGranted,
  };
}
