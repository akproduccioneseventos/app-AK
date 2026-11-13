import { aFechaHoraLocal, aIsoUruguay } from '@/lib/fechas/fecha-local';

describe('Hora de la publicación es la de Uruguay', () => {
  beforeAll(() => {
    process.env.TZ = 'America/Montevideo';
  });

  it('con TZ=America/Montevideo y "ahora" 12:38, aFechaHoraLocal da …T12:38', () => {
    // 12:38 hora de Montevideo (UTC-3) equivale a 15:38 UTC
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-13T15:38:00.000Z'));
    try {
      const resultado = aFechaHoraLocal();
      expect(resultado).toMatch(/T12:38$/);
    } finally {
      jest.useRealTimers();
    }
  });

  it('recibiendo una fecha con hora 12:38 de Montevideo, aFechaHoraLocal da …T12:38', () => {
    const fecha = new Date('2026-11-13T15:38:00.000Z');
    expect(aFechaHoraLocal(fecha)).toBe('2026-11-13T12:38');
  });

  it('una publicación guardada a las 21:00 se muestra 21:00 al editar', () => {
    const fechaInput = '2026-11-13T21:00';
    const fechaIsoEnDb = aIsoUruguay(fechaInput);

    const alEditar = aFechaHoraLocal(fechaIsoEnDb);
    expect(alEditar).toBe('2026-11-13T21:00');

    // Si se guarda de nuevo al editar, sigue exactamente en 21:00
    const reGuardada = aIsoUruguay(alEditar);
    expect(aFechaHoraLocal(reGuardada)).toBe('2026-11-13T21:00');
  });
});
