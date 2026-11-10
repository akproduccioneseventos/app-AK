import { tragoSeOfreceEnLaFecha, mergeMasterTragosWithFiesta } from '@/lib/carta-tragos-master';
import type { Trago } from '@/types/fiesta';

describe('los tragos salen según la temporada', () => {
  const tragoVerano: Trago = {
    id: 'trago-verano',
    nombre: 'Caipirinha de Verano',
    activo: true,
    meses: [12, 1, 2, 3],
  };

  const tragoInvierno: Trago = {
    id: 'trago-invierno',
    nombre: 'Café Irlandés',
    activo: true,
    meses: [6, 7, 8, 9],
  };

  const tragoInactivo: Trago = {
    id: 'trago-inactivo',
    nombre: 'Mojito Cancelado',
    activo: false,
    meses: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  };

  const tragoTodoElAno: Trago = {
    id: 'trago-clasico',
    nombre: 'Fernet Clásico',
    activo: true,
  };

  it('un trago de verano no sale en julio y sí en enero', () => {
    expect(tragoSeOfreceEnLaFecha(tragoVerano, '2026-07-15')).toBe(false);
    expect(tragoSeOfreceEnLaFecha(tragoVerano, '2026-01-20')).toBe(true);
  });

  it('un trago con activo: false no sale nunca', () => {
    expect(tragoSeOfreceEnLaFecha(tragoInactivo, '2026-01-15')).toBe(false);
    expect(tragoSeOfreceEnLaFecha(tragoInactivo, '2026-07-15')).toBe(false);
    expect(tragoSeOfreceEnLaFecha(tragoInactivo)).toBe(false);
  });

  it('fecha "2027-01-01" es mes 1, no diciembre (sin desfasaje horario)', () => {
    expect(tragoSeOfreceEnLaFecha(tragoVerano, '2027-01-01')).toBe(true);
    expect(tragoSeOfreceEnLaFecha(tragoInvierno, '2027-01-01')).toBe(false);
  });

  it('sin fecha se ofrece todo lo activo', () => {
    expect(tragoSeOfreceEnLaFecha(tragoVerano)).toBe(true);
    expect(tragoSeOfreceEnLaFecha(tragoTodoElAno)).toBe(true);
  });

  it('mergeMasterTragosWithFiesta no agrega un trago fuera de temporada', () => {
    const master = [tragoVerano, tragoInvierno, tragoTodoElAno];
    const fiesta: Trago[] = [];

    const resultadoJulio = mergeMasterTragosWithFiesta(master, fiesta, '2026-07-10');
    expect(resultadoJulio.some((t) => t.id === 'trago-verano')).toBe(false);
    expect(resultadoJulio.some((t) => t.id === 'trago-invierno')).toBe(true);
    expect(resultadoJulio.some((t) => t.id === 'trago-clasico')).toBe(true);

    const resultadoEnero = mergeMasterTragosWithFiesta(master, fiesta, '2026-01-10');
    expect(resultadoEnero.some((t) => t.id === 'trago-verano')).toBe(true);
    expect(resultadoEnero.some((t) => t.id === 'trago-invierno')).toBe(false);
    expect(resultadoEnero.some((t) => t.id === 'trago-clasico')).toBe(true);
  });

  it('un trago que la fiesta ya tenía sale igual aunque sea fuera de temporada', () => {
    const master = [tragoVerano, tragoInvierno];
    // La fiesta eligió explícitamente el trago de verano aunque su fiesta sea en julio
    const fiesta: Trago[] = [
      {
        ...tragoVerano,
        nombre: 'Caipirinha Especial de Fiesta',
      },
    ];

    const resultado = mergeMasterTragosWithFiesta(master, fiesta, '2026-07-15');
    const encontrado = resultado.find((t) => t.id === 'trago-verano');
    expect(encontrado).toBeDefined();
    expect(encontrado?.nombre).toBe('Caipirinha Especial de Fiesta');
  });
});
