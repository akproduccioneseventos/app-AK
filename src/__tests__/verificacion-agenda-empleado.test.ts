import { evaluarAgendaEmpleado, getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';

const empleadoId = 'empleado-1';

function crearFiesta(
  id: string,
  fechaEvento: string,
  horaInicio: string,
  horaFin: string,
  asignado = true,
) {
  return {
    id,
    configuracion: {
      nombreEvento: `Evento ${id}`,
      fechaEvento,
      horaInicio,
      horaFin,
    },
    personalAsignado: asignado ? [{ empleadoId }] : [],
  };
}

describe('verificación de agenda de empleado', () => {
  it('calcula una fiesta nocturna sobre dos fechas usando hora de Uruguay', () => {
    const range = getFiestaTimeRange(crearFiesta('noche', '2026-11-20', '21:00', '04:00'));

    expect(range).not.toBeNull();
    expect(range!.endMs - range!.startMs).toBe(7 * 60 * 60 * 1000);
  });

  it.each([
    ['sin hora de inicio', '', '04:00'],
    ['sin hora de fin', '21:00', ''],
    ['hora inválida', '25:00', '04:00'],
  ])('no inventa un rango para %s', (_caso, horaInicio, horaFin) => {
    expect(getFiestaTimeRange(crearFiesta('incompleta', '2026-11-20', horaInicio, horaFin))).toBeNull();
  });

  it('rechaza una fecha calendario inválida', () => {
    expect(getFiestaTimeRange(crearFiesta('invalida', '2026-02-30', '21:00', '04:00'))).toBeNull();
  });

  it('no interpreta horas iguales como un bloqueo artificial de 24 horas', () => {
    expect(getFiestaTimeRange(crearFiesta('sin-duracion', '2026-11-20', '21:00', '21:00'))).toBeNull();
  });

  it('detecta solapamiento confirmado el mismo día', () => {
    const target = crearFiesta('target', '2026-11-20', '21:00', '04:00', false);
    const otra = crearFiesta('otra', '2026-11-20', '22:00', '03:00');

    const result = evaluarAgendaEmpleado([otra], empleadoId, target, target.id);

    expect(result.solapadas.map(item => item.nombreEvento)).toEqual(['Evento otra']);
    expect(result.mismoDiaNoSolapado).toHaveLength(0);
  });

  it('permite eventos contiguos cuyo límite es la misma hora', () => {
    const target = crearFiesta('target', '2026-11-20', '18:00', '21:00', false);
    const otra = crearFiesta('otra', '2026-11-20', '21:00', '04:00');

    const result = evaluarAgendaEmpleado([otra], empleadoId, target, target.id);

    expect(result.solapadas).toHaveLength(0);
    expect(result.mismoDiaNoSolapado).toHaveLength(1);
  });

  it('detecta un evento del día anterior que termina durante el evento objetivo', () => {
    const target = crearFiesta('target', '2026-11-21', '02:00', '06:00', false);
    const anterior = crearFiesta('anterior', '2026-11-20', '21:00', '04:00');

    const result = evaluarAgendaEmpleado([anterior], empleadoId, target, target.id);

    expect(result.solapadas).toHaveLength(1);
  });

  it('detecta un evento del día siguiente dentro de una fiesta que cruza medianoche', () => {
    const target = crearFiesta('target', '2026-11-20', '21:00', '04:00', false);
    const siguiente = crearFiesta('siguiente', '2026-11-21', '02:00', '06:00');

    const result = evaluarAgendaEmpleado([siguiente], empleadoId, target, target.id);

    expect(result.solapadas).toHaveLength(1);
  });

  it('advierte sin bloquear cuando falta confirmar un horario del mismo día', () => {
    const target = crearFiesta('target', '2026-11-20', '21:00', '04:00', false);
    const incompleta = crearFiesta('incompleta', '2026-11-20', '', '');

    const result = evaluarAgendaEmpleado([incompleta], empleadoId, target, target.id);

    expect(result.solapadas).toHaveLength(0);
    expect(result.horarioSinConfirmar).toHaveLength(1);
  });

  it('excluye la fiesta que se está editando y otros empleados', () => {
    const target = crearFiesta('target', '2026-11-20', '21:00', '04:00');
    const ajena = {
      ...crearFiesta('ajena', '2026-11-20', '22:00', '03:00'),
      personalAsignado: [{ empleadoId: 'empleado-2' }],
    };

    const result = evaluarAgendaEmpleado([target, ajena], empleadoId, target, target.id);

    expect(result.solapadas).toHaveLength(0);
    expect(result.mismoDiaNoSolapado).toHaveLength(0);
    expect(result.horarioSinConfirmar).toHaveLength(0);
  });
});
