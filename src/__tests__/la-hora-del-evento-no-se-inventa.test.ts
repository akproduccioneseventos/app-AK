import { horaEventoOConfirmar } from '@/lib/fechas/hora-evento';
import { getDaysUntilEvent } from '@/lib/public-experience/event-date';
import { diasHastaEnUruguay } from '@/lib/utils';

describe('Orden 318 Bloque 1: la hora del evento no se inventa', () => {
  it('sin eventoHoraInicio y con fecha "2026-12-19T03:00:00Z", devuelve "a confirmar" y nunca "03:00"', () => {
    const hora = horaEventoOConfirmar(undefined);
    expect(hora).toBe('a confirmar');
    expect(hora).not.toContain('03:00');
  });

  it('con eventoHoraInicio cargado, devuelve esa hora exacta', () => {
    expect(horaEventoOConfirmar('21:30')).toBe('21:30');
  });

  it('la cuenta regresiva da lo mismo en el portal del invitado y en el panel a las 23:30 de Uruguay', () => {
    // 23:30 de Uruguay (-03:00) = 02:30Z del día siguiente
    const ahora = new Date('2026-12-10T02:30:00.000Z');
    const fechaEvento = '2026-12-19T03:00:00Z';
    expect(getDaysUntilEvent(fechaEvento, ahora)).toBe(diasHastaEnUruguay(fechaEvento, ahora));
  });
});
