import { cleanMojibakeString, cleanMojibakeValue } from '@/lib/text/mojibake';

describe('mojibake cleanup', () => {
  it('repairs common Spanish accents and symbols', () => {
    const broken = 'Sal\u00c3\u00b3n \u00e2\u20ac\u201c m\u00c3\u00basica y men\u00c3\u00ba';

    expect(cleanMojibakeString(broken)).toBe('Sal\u00f3n \u2013 m\u00fasica y men\u00fa');
  });

  it('repairs double-encoded text', () => {
    const broken = 'M\u00c3\u0192\u00c2\u00basica para quincea\u00c3\u0192\u00c2\u00b1era';

    expect(cleanMojibakeString(broken)).toBe('M\u00fasica para quincea\u00f1era');
  });

  it('keeps valid text untouched', () => {
    const valid = 'Sal\u00f3n AK Producciones - presupuesto formal';

    expect(cleanMojibakeString(valid)).toBe(valid);
  });

  it('repairs nested plain objects without touching dates', () => {
    const date = new Date('2026-07-06T12:00:00.000Z');
    const result = cleanMojibakeValue({
      nombre: 'Cumplea\u00c3\u00b1os',
      detalles: ['Entrada \u00e2\u20ac\u0153VIP\u00e2\u20ac\u009d'],
      fecha: date,
    });

    expect(result.changed).toBe(true);
    expect(result.value).toEqual({
      nombre: 'Cumplea\u00f1os',
      detalles: ['Entrada \u201cVIP\u201d'],
      fecha: date,
    });
  });
});
