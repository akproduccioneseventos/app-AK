/**
 * El día de la fiesta se cuenta en Uruguay (Codex, auditoría 69, PORTAL01).
 *
 * `new Date('2026-10-05')` es la medianoche de Greenwich: en Uruguay, el 4 a las 21. El día de la
 * fiesta, antes de empezar, el portal decía "Evento Concluido". Se probó rompiéndolo: con la
 * comparación vieja (`toDateString`) en hora de Uruguay, "hoy a las 19" da pasado.
 */
import { diaDelEvento } from '@/lib/fiesta/dia-del-evento';

// 5/10/2026 en Uruguay (UTC-3).
const uy = (dia: number, hora: number) => new Date(Date.UTC(2026, 9, dia, hora + 3, 0, 0));

describe('El día de la fiesta, en hora de Uruguay', () => {
  it('hoy a las 19, antes de empezar: es hoy, no pasó', () => {
    expect(diaDelEvento('2026-10-05', uy(5, 19))).toEqual({ esHoy: true, yaPaso: false });
  });
  it('a las 23, durante: es hoy', () => {
    expect(diaDelEvento('2026-10-05', uy(5, 23)).esHoy).toBe(true);
  });
  it('cruza la medianoche: a las 2 del día siguiente sigue siendo la fiesta', () => {
    expect(diaDelEvento('2026-10-05', uy(6, 2))).toEqual({ esHoy: true, yaPaso: false });
  });
  it('al día siguiente a las 10 ya pasó', () => {
    expect(diaDelEvento('2026-10-05', uy(6, 10))).toEqual({ esHoy: false, yaPaso: true });
  });
  it('ayer pasó y mañana falta', () => {
    expect(diaDelEvento('2026-10-04', uy(5, 12)).yaPaso).toBe(true);
    expect(diaDelEvento('2026-10-06', uy(5, 12))).toEqual({ esHoy: false, yaPaso: false });
  });
  it('sin fecha no inventa nada', () => {
    expect(diaDelEvento(undefined)).toEqual({ esHoy: false, yaPaso: false });
  });
});
