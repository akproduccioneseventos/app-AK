import { getContractedDownloads } from '@/lib/experience-ak/post-event-utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Bloque B: Álbum de la fiesta en el portal del cliente', () => {
  it('un cliente con una sola estación contratada ve sólo esa (Ej: Fotocabina)', () => {
    const fiesta: Partial<FiestaEnPlanificacion> = {
      modulosContratados: {
        muroSocial: false,
        videoVida: false,
        fotografia: false,
      },
      zonaDigitalAdolescentes: {
        enabled: true,
        features: [
          { id: 'fotocabina', enabled: true },
          { id: 'plataforma360', enabled: false },
          { id: 'muro_social', enabled: false }
        ]
      },
      socialGallerySettings: { showDedications: false }
    };

    const downloads = getContractedDownloads(fiesta as any);

    expect(downloads.fotocabina).toBe(true);
    // Otras no deben verse, previniendo secciones vacías
    expect(downloads.plataforma360).toBe(false);
    expect(downloads.invitadoPhotos).toBe(false);
    expect(downloads.recuerdosAudio).toBe(false);
  });

  it('un cliente con varias estaciones las ve todas', () => {
    const fiesta: Partial<FiestaEnPlanificacion> = {
      modulosContratados: {
        muroSocial: true, // Habilita fotos y videos
        videoVida: false,
        fotografia: false,
      },
      zonaDigitalAdolescentes: {
        enabled: true,
        features: [
          { id: 'fotocabina', enabled: true },
          { id: 'plataforma360', enabled: true },
        ]
      },
      buzonConfig: { enabled: true } // Habilita dedicatorias
    };

    const downloads = getContractedDownloads(fiesta as any);

    expect(downloads.fotocabina).toBe(true);
    expect(downloads.plataforma360).toBe(true);
    expect(downloads.invitadoPhotos).toBe(true);
    expect(downloads.videos).toBe(true);
    expect(downloads.recuerdosAudio).toBe(true);
  });

});
