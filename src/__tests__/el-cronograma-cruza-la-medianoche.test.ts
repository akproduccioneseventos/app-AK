import { ordenarPorHoraDelEvento } from '@/lib/fiesta/orden-del-cronograma';

describe('el cronograma cruza la medianoche (A18-06)', () => {
  const programa = [
    { hora: '04:00', nombre: 'Cierre' },
    { hora: '18:00', nombre: 'Llegada' },
    { hora: '', nombre: 'Sin hora' },
    { hora: '01:00', nombre: 'Torta' },
    { hora: '21:30', nombre: 'Entrada' },
  ];

  it('con la hora de inicio, lo de después de medianoche va al final', () => {
    expect(ordenarPorHoraDelEvento(programa, '18:00').map((p) => p.nombre)).toEqual([
      'Llegada', 'Entrada', 'Torta', 'Cierre', 'Sin hora',
    ]);
  });

  it('una fiesta de día (12:00) no se desordena', () => {
    const mediodia = [{ hora: '16:00', n: 'c' }, { hora: '12:00', n: 'a' }, { hora: '13:30', n: 'b' }];
    expect(ordenarPorHoraDelEvento(mediodia, '12:00').map((p) => p.n)).toEqual(['a', 'b', 'c']);
  });

  it('la hoja del evento y el itinerario ya no ordenan las horas como texto', () => {
    const fs = require('fs');
    const hoja = fs.readFileSync('src/components/fiestas/panels/orden-de-evento.tsx', 'utf8');
    expect(hoja).toContain('ordenarPorHoraDelEvento(');
    expect(hoja).not.toMatch(/\.hora \|\| ''\)\.localeCompare/);

    const itinerario = fs.readFileSync('src/components/fiestas/panels/itinerario.tsx', 'utf8');
    expect(itinerario).toContain('ordenarPorHoraDelEvento(');
    expect(itinerario).not.toMatch(/\.hora\.localeCompare/);
  });
});
