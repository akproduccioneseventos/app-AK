import { buildGoogleCalendarUrl } from '@/lib/calendar-links';

describe('Google Calendar enlace con hora de Uruguay (Orden 285 - Bloque 1)', () => {
  const originalTZ = process.env.TZ;

  beforeAll(() => {
    // Simulamos entorno de servidor en Greenwich (UTC)
    process.env.TZ = 'UTC';
  });

  afterAll(() => {
    process.env.TZ = originalTZ;
  });

  it('arma la fecha sin pasar por hora local ni toISOString y sin Z con ctz America/Montevideo', () => {
    const url = buildGoogleCalendarUrl({
      startDate: '2026-10-15',
      startTime: '21:00',
      durationHours: 5,
    });

    expect(url).not.toBeNull();
    expect(url).toContain('dates=20261015T210000/20261016T020000');
    expect(url).toContain('ctz=America%2FMontevideo');
    expect(url).not.toContain('Z');
  });

  it('si startDate es null devuelve null', () => {
    expect(buildGoogleCalendarUrl({ title: 'Test', startDate: null })).toBeNull();
  });
});
