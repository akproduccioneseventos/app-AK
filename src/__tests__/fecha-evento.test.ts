import { formatEventDate, parseEventDate } from '@/lib/public-experience/event-date';

/**
 * Defecto real que motivó estas pruebas: varias pantallas mostraban "viernes 31
 * de julio" para una fiesta del sábado 1 de agosto, porque armaban la fecha con
 * `new Date("2026-08-01")`, que se lee como medianoche en Londres, y Uruguay
 * tiene tres horas menos. Encima el servidor y el celular del invitado podían
 * mostrar días distintos en la misma pantalla.
 *
 * `parseEventDate` ya resolvía esto; lo que faltaba era usarlo en todos lados.
 */
describe('fechas de eventos', () => {
  it('no corre la fiesta al día anterior', () => {
    const fecha = parseEventDate('2026-08-01');
    expect(fecha).not.toBeNull();
    expect(fecha!.getFullYear()).toBe(2026);
    expect(fecha!.getMonth()).toBe(7);
    expect(fecha!.getDate()).toBe(1);
  });

  it('escribe el día correcto en castellano', () => {
    const texto = formatEventDate('2026-08-01');
    expect(texto).toContain('1 de agosto');
    expect(texto).toContain('2026');
  });

  it('avisa cuando no hay fecha en vez de inventar una', () => {
    expect(formatEventDate('')).toBeNull();
    expect(formatEventDate(undefined)).toBeNull();
    expect(formatEventDate('no es una fecha')).toBeNull();
    expect(parseEventDate(undefined)).toBeNull();
  });
});
