import {
  getEntertainmentGuestPath,
  getEntertainmentOperatorPath,
  getEntertainmentStationConfig,
} from '@/lib/entertainment/station-config';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function buildFiesta(overrides: Record<string, unknown> = {}): FiestaEnPlanificacion {
  return {
    id: 'fiesta_123',
    configuracion: {
      nombreEvento: 'XV de Sofia',
      fechaEvento: '2027-08-14',
    } as FiestaEnPlanificacion['configuracion'],
    personalAsignado: [],
    ...overrides,
  };
}

describe('entertainment station configuration', () => {
  it('normalizes professional defaults for a photo booth', () => {
    const config = getEntertainmentStationConfig(buildFiesta(), 'fotocabina');

    expect(config.brandText).toBe('XV de Sofia');
    expect(config.countdownSeconds).toBe(4);
    expect(config.allowGuestRetake).toBe(true);
    expect(config.autoPublish).toBe(false);
  });

  it('uses stored event configuration and clamps unsafe timing values', () => {
    const fiesta = buildFiesta({
      others: {
        entretenimiento: {
          modules: {
            plataforma360: {
              operatorName: 'Martin',
              accentColor: '#112233',
              countdownSeconds: 99,
              recordingDurationSeconds: 1,
            },
          },
        },
      },
    });

    const config = getEntertainmentStationConfig(fiesta, 'plataforma360');

    expect(config.operatorName).toBe('Martin');
    expect(config.accentColor).toBe('#112233');
    expect(config.countdownSeconds).toBe(10);
    expect(config.recordingDurationSeconds).toBe(2);
  });

  it('builds separate guest and operator links instead of redirecting to social', () => {
    const guestPath = getEntertainmentGuestPath('fiesta_123', 'fotocabina', 'token');
    const operatorPath = getEntertainmentOperatorPath('fiesta_123', 'fotocabina', 'token');

    expect(guestPath).toBe('/evento/fotocabina/fiesta_123?access=token');
    expect(operatorPath).toContain('/evento/fotocabina/fiesta_123?');
    expect(operatorPath).toContain('role=operator');
    expect(operatorPath).toContain('access=token');
    expect(guestPath).not.toContain('/evento/social/');
  });
});
