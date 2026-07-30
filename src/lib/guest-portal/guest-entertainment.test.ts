import { isGuestEntertainmentAvailable } from './guest-entertainment';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

function eventWith(
  moduleFlags: Partial<FiestaEnPlanificacion['modulosContratados']>,
  stations: Record<string, { enabled?: boolean }> = {},
): FiestaEnPlanificacion {
  return {
    modulosContratados: moduleFlags,
    others: {
      entretenimiento: {
        modules: stations,
      },
    },
  } as unknown as FiestaEnPlanificacion;
}

describe('guest entertainment availability', () => {
  it('does not expose every station from the broad entertainment flag', () => {
    const fiesta = eventWith({ entretenimiento: true });

    expect(isGuestEntertainmentAvailable(fiesta, 'fotocabina')).toBe(false);
    expect(isGuestEntertainmentAvailable(fiesta, 'plataforma360')).toBe(false);
  });

  it('requires the contracted module and the explicitly enabled station', () => {
    const fiesta = eventWith(
      { entretenimiento: true },
      {
        fotocabina: { enabled: true },
        plataforma360: { enabled: false },
      },
    );

    expect(isGuestEntertainmentAvailable(fiesta, 'fotocabina')).toBe(true);
    expect(isGuestEntertainmentAvailable(fiesta, 'plataforma360')).toBe(false);
  });

  it('keeps display-only totems out of the guest phone portal', () => {
    const fiesta = eventWith(
      { pantallasTotem: true },
      { totems: { enabled: true } },
    );

    expect(isGuestEntertainmentAvailable(fiesta, 'totems')).toBe(false);
  });

  it('exposes the memory box only when its specific module is contracted', () => {
    expect(isGuestEntertainmentAvailable(eventWith({ buzon: true }), 'capsulaTiempo')).toBe(true);
    expect(isGuestEntertainmentAvailable(eventWith({ buzon: false }), 'capsulaTiempo')).toBe(false);
  });
});
