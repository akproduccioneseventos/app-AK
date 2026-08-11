import { getFiestaTimeRange } from '@/app/actions/empleados';

describe('verificación de agenda de empleado (solapamiento de horarios)', () => {
  it('detecta correctamente cuando dos fiestas del mismo día se solapan en horario', () => {
    const fiesta1 = {
      configuracion: {
        fechaEvento: '2026-11-20',
        horaInicio: '21:00',
        horaFin: '04:00',
      },
    };
    const fiesta2Solapada = {
      configuracion: {
        fechaEvento: '2026-11-20',
        horaInicio: '22:00',
        horaFin: '03:00',
      },
    };

    const range1 = getFiestaTimeRange(fiesta1);
    const range2 = getFiestaTimeRange(fiesta2Solapada);

    const solapa = range1.startMs < range2.endMs && range2.startMs < range1.endMs;
    expect(solapa).toBe(true);
  });

  it('no marca solapamiento si son el mismo día pero en horarios distintos', () => {
    const fiestaTarde = {
      configuracion: {
        fechaEvento: '2026-11-20',
        horaInicio: '14:00',
        horaFin: '18:00',
      },
    };
    const fiestaNoche = {
      configuracion: {
        fechaEvento: '2026-11-20',
        horaInicio: '21:00',
        horaFin: '04:00',
      },
    };

    const rangeTarde = getFiestaTimeRange(fiestaTarde);
    const rangeNoche = getFiestaTimeRange(fiestaNoche);

    const solapa = rangeTarde.startMs < rangeNoche.endMs && rangeNoche.startMs < rangeTarde.endMs;
    expect(solapa).toBe(false);
  });
});
