import { getEntertainmentStationConfig, getPublicEntertainmentEvent } from '@/lib/entertainment/station-config';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 19: Ajustes de estaciones de entretenimiento', () => {
  const fiestaBase: FiestaEnPlanificacion = {
    id: 'fiesta-test-orden-19',
    configuracion: {
      nombreEvento: 'Mis 15 Valentina',
      fechaEvento: '2026-11-20',
      nombreAgasajado: 'Valentina',
      tipoCelebracion: '15_anos',
      primaryColor: '#db2777',
    },
    guestPortalSettings: {
      showBuzon: true,
      coverImageUrl: 'https://ejemplo.com/portada.jpg',
    },
    socialGallerySettings: {
      enabled: true,
    },
    others: {
      entretenimiento: {
        modules: {
          plataforma360: {
            enabled: true,
            brandText: 'Valentina 360 VIP',
            footerText: 'Recuerdo de mis 15',
            accentColor: '#7c3aed',
            qrCallout: 'Escaneá para tu video 360',
            shareMessage: '¡Mirá mi video 360 en los 15 de Valen!',
            countdownSeconds: 5,
            reviewSeconds: 15,
          },
          bogue: {
            enabled: true,
            brandText: 'Bogue Valen',
            footerText: 'AK Producciones - Bogue',
            accentColor: '#db2777',
            qrCallout: 'Descargá tu Boomerang acá',
            shareMessage: '¡Mi boomerang de la fiesta!',
            reviewSeconds: 25,
            marcosHabilitados: ['none', 'neon-glow'],
          },
          touchpix: {
            enabled: true,
            brandText: 'Touchpix Valen',
            footerText: 'AK Touchpix',
            accentColor: '#c026d3',
            qrCallout: 'Llevate tu foto mágica',
            activeTemplateId: 'disco_glam',
            reviewSeconds: 30,
          },
          capsulaTiempo: {
            enabled: true,
            brandText: 'Cápsula de Valentina',
            countdownSeconds: 6,
            allowGuestRetake: true,
          },
        },
      },
    },
  } as unknown as FiestaEnPlanificacion;

  it('Plataforma 360 lee los ajustes reales configurados', () => {
    const config = getEntertainmentStationConfig(fiestaBase, 'plataforma360');
    expect(config.brandText).toBe('Valentina 360 VIP');
    expect(config.footerText).toBe('Recuerdo de mis 15');
    expect(config.accentColor).toBe('#7c3aed');
    expect(config.qrCallout).toBe('Escaneá para tu video 360');
    expect(config.shareMessage).toBe('¡Mirá mi video 360 en los 15 de Valen!');
    expect(config.countdownSeconds).toBe(5);
    expect(config.reviewSeconds).toBe(15);
  });

  it('Bogue lee marcos habilitados, tiempos y textos de marca', () => {
    const config = getEntertainmentStationConfig(fiestaBase, 'bogue');
    expect(config.brandText).toBe('Bogue Valen');
    expect(config.footerText).toBe('AK Producciones - Bogue');
    expect(config.qrCallout).toBe('Descargá tu Boomerang acá');
    expect(config.shareMessage).toBe('¡Mi boomerang de la fiesta!');
    expect(config.reviewSeconds).toBe(25);
    expect(config.marcosHabilitados).toEqual(['none', 'neon-glow']);
  });

  it('Touchpix respeta plantilla activa, color de acento y textos', () => {
    const event = getPublicEntertainmentEvent(fiestaBase, 'espejoMagicoIA');
    expect(event.station.brandText).toBe('Mis 15 Valentina');
    expect(event.station.accentColor).toBe('#c026d3');
  });

  it('Cápsula del Tiempo lee la cuenta regresiva y retoma configurada', () => {
    const config = getEntertainmentStationConfig(fiestaBase, 'capsulaTiempo');
    expect(config.brandText).toBe('Cápsula de Valentina');
    expect(config.countdownSeconds).toBe(6);
    expect(config.allowGuestRetake).toBe(true);
  });
});
