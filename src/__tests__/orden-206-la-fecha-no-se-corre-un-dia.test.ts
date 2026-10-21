import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
import { parseEventDate, formatEventDate } from '@/lib/public-experience/event-date';

describe('Orden 206 - La fecha de la fiesta no se corre un día en las pantallas', () => {
  it('un día de agosto no retrocede al día anterior en hora de Uruguay', () => {
    const texto = formatearFechaEvento('2027-08-08');
    expect(texto).toContain('8 de agosto de 2027');
    expect(texto).not.toContain('7 de agosto de 2027');
  });

  it('un día con horario humano preserva el día y el sufijo', () => {
    const texto = formatearFechaEvento('2027-08-08 de 21 a 04 hs');
    expect(texto).toContain('8 de agosto de 2027 de 21 a 04 hs');
  });

  it('parseEventDate devuelve el día civil exacto sin desfase UTC', () => {
    const parsed = parseEventDate('2027-08-08');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2027);
    expect(parsed?.getMonth()).toBe(7); // Agosto (0-indexed)
    expect(parsed?.getDate()).toBe(8);
  });

  it('formatEventDate formatea el día correctamente', () => {
    const texto = formatEventDate('2027-08-08');
    expect(texto).toContain('8 de agosto');
    expect(texto).toContain('2027');
  });
});
