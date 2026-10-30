import { prepararPlanMultipaso, type DatosPlanMultipaso } from './planes-multipaso';
import { calcularHorariosDisponibles } from '@/lib/agenda/horarios-disponibles';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import type { CrmAppointment } from '@/types/crm';

jest.mock('@/lib/agenda/horarios-disponibles', () => ({
  calcularHorariosDisponibles: jest.fn(jest.requireActual('@/lib/agenda/horarios-disponibles').calcularHorariosDisponibles),
}));

const ahora = new Date('2026-10-29T12:00:00Z');
const fiesta: FiestaEnPlanificacion = {
  id: 'fiesta-1', presupuestoId: 'pres-1', personalAsignado: [], reuniones: [], tareas: [],
  configuracion: {
    nombreEvento: 'Boda Pérez', tipoCelebracion: 'Boda', fechaEvento: '2026-10-31',
    horaInicio: '20:00', horaFin: '23:00', nombreLugar: 'Salón', invitadosEstimados: 80,
    presupuestoEstimado: 0, notesAdicionales: '',
  },
  decoracion: { tema: 'Bosque', items: [{ id: 'd-1', name: 'Centro de mesa', quantity: 8 }] },
};
const presupuesto: Presupuesto = {
  id: 'pres-1', clienteNombre: 'Familia Pérez', clienteContacto: '59899111111',
  eventoTipo: 'Boda', eventoFecha: '2026-10-31', invitadosCantidad: 80,
  salonFiestas: 'Salón', itemsPresupuestados: [], costoTotalEstimado: 100,
  timestamp: '2026-10-01T12:00:00Z', estado: 'Enviado',
};
const cita: CrmAppointment = {
  id: 'cita-1', clienteNombre: 'Ana', clienteContacto: '59899222222',
  fechaHora: '2026-10-29T10:15:00-03:00', estado: 'Agendada', creadoEn: '2026-10-20T12:00:00Z',
};
const datos = (extras: Partial<DatosPlanMultipaso> = {}): DatosPlanMultipaso => ({
  ahora, fiestas: [fiesta], presupuestos: [presupuesto], citas: [],
  puedeVerAgenda: true, puedeVerPresupuestos: true, ...extras,
});
const pedido = 'Organizá reunión con los novios del evento "Boda Pérez" del sábado';

describe('prepararPlanMultipaso', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reutiliza el selector real y prepara tres pasos, candidato y mensaje concreto sin reservar', () => {
    const result = prepararPlanMultipaso(pedido, datos());
    expect(calcularHorariosDisponibles).toHaveBeenCalledWith([], 7, ahora);
    expect(result).toMatchObject({ plan: {
      pasos: expect.any(Array),
      horarioCandidato: { datetimeIso: '2026-10-29T13:00:00.000Z', duracionMinutos: 30, googleVerificado: false },
      borrador: { telefono: '59899111111', presupuestoId: 'pres-1', texto: expect.stringContaining('2026-10-29 a las 10:00') },
    } });
    if (!result || !('plan' in result)) throw new Error('Falta plan');
    expect(result.plan.pasos).toHaveLength(3);
    expect(result.plan.pasos[0]).toMatch(/horario candidato.*agenda interna.*confirmar disponibilidad Google/);
    expect(result.plan.pasos[2]).toMatch(/Centro de mesa.*cantidad 8/);
    expect(result.plan.borrador?.texto).toMatch(/No está reservado/);
  });

  test('evita citas parcialmente solapadas, fiestas y reuniones de todas las fiestas', () => {
    const otra: FiestaEnPlanificacion = {
      ...fiesta, id: 'otra-fiesta',
      configuracion: { ...fiesta.configuracion, nombreEvento: 'Cumpleaños Ana', fechaEvento: '2026-10-30', horaInicio: '09:00', horaFin: '10:30' },
      reuniones: [{ id: 'r-1', titulo: 'Coordinación', fecha: '2026-10-30', hora: '10:45', notas: '' }],
    };
    expect(prepararPlanMultipaso(pedido, datos({ citas: [cita], fiestas: [fiesta, otra] })))
      .toMatchObject({ plan: { horarioCandidato: { datetimeIso: '2026-10-31T13:00:00.000Z' } } });
  });

  test('respeta fiestas que terminan al día siguiente y permite el límite exacto sin solape', () => {
    const trasnoche = { ...fiesta, id: 'trasnoche', configuracion: { ...fiesta.configuracion, fechaEvento: '2026-10-28', horaInicio: '20:00', horaFin: '11:00' } };
    expect(prepararPlanMultipaso(pedido, datos({ fiestas: [fiesta, trasnoche] })))
      .toMatchObject({ plan: { horarioCandidato: { datetimeIso: '2026-10-29T14:00:00.000Z' } } });
  });

  test.each([
    { fallaCitas: true }, { citas: undefined },
    { citas: [{ ...cita, fechaHora: '2026-10-29' }] },
    { fiestas: [{ ...fiesta, configuracion: { ...fiesta.configuracion, horaFin: '' } }] },
    { fiestas: [{ ...fiesta, reuniones: [{ id: 'r-1', titulo: 'Sin hora', fecha: '2026-10-30', notas: '' }] }] },
  ] satisfies Partial<DatosPlanMultipaso>[])('pregunta ante agenda incompleta o fallida: %j', (extra) => {
    expect(prepararPlanMultipaso(pedido, datos(extra))).toMatchObject({ pregunta: expect.any(String) });
  });

  test('ignora citas canceladas y pide alternativas si no queda ningún hueco en siete días', () => {
    expect(prepararPlanMultipaso(pedido, datos({ citas: [{ ...cita, estado: 'Cancelada' }] })))
      .toMatchObject({ plan: { horarioCandidato: { datetimeIso: '2026-10-29T13:00:00.000Z' } } });
    const ocupadas = Array.from({ length: 8 }, (_, i) => ({ ...cita, id: `ocupada-${i}`, fechaHora: new Date(ahora.getTime() + i * 86_400_000).toISOString() }));
    expect(prepararPlanMultipaso(pedido, datos({ citas: ocupadas }))).toMatchObject({ pregunta: expect.stringMatching(/siete días/) });
  });

  test.each([
    { puedeVerAgenda: false }, { puedeVerPresupuestos: false }, { fallaPresupuestos: true },
    { presupuestos: [{ ...presupuesto, clienteContacto: '' }] }, { presupuestos: [] },
  ] satisfies Partial<DatosPlanMultipaso>[])('sin acceso/contacto real pregunta, no inventa borrador: %j', (extra) => {
    expect(prepararPlanMultipaso(pedido, datos(extra))).toMatchObject({ pregunta: expect.any(String) });
  });

  test('sábado es el día de Uruguay, incluido hoy; ID y fecha deben coincidir', () => {
    const sabado = new Date('2026-11-01T01:00:00Z'); // Sábado 31, 22:00 de Uruguay.
    expect(prepararPlanMultipaso('Organizá reunión con cliente del evento id fiesta-1 del sábado', datos({ ahora: sabado })))
      .toMatchObject({ plan: { fiestaId: 'fiesta-1' } });
    expect(prepararPlanMultipaso('Organizá reunión con cliente del evento id inexistente del sábado', datos()))
      .toMatchObject({ pregunta: expect.any(String) });
    expect(prepararPlanMultipaso('Organizá reunión con los novios del sábado', datos()))
      .toMatchObject({ plan: { fiestaId: 'fiesta-1' } });
    expect(prepararPlanMultipaso('Organizá reunión con los novios del sábado', datos({ fiestas: [fiesta, { ...fiesta, id: 'otra-boda' }] })))
      .toMatchObject({ pregunta: expect.stringMatching(/más de una coincidencia/) });
  });

  test('semana de fiesta no nupcial no necesita citas ni consulta financiera', () => {
    const cumple = { ...fiesta, configuracion: { ...fiesta.configuracion, nombreEvento: 'Cumpleaños Ana', tipoCelebracion: 'Cumpleaños' } };
    expect(prepararPlanMultipaso('Prepará la semana del evento "Cumpleaños Ana"', datos({ fiestas: [cumple], puedeVerPresupuestos: false, citas: undefined })))
      .toMatchObject({ plan: { tipo: 'preparar_semana_fiesta', pasos: expect.arrayContaining([expect.stringMatching(/omitido por permisos financieros/)]) } });
    expect(calcularHorariosDisponibles).not.toHaveBeenCalled();
  });

  test('seguimiento respeta cliente exacto, estado/cola y no trata creación como fecha de envío', () => {
    const ana = { ...presupuesto, id: 'pres-ana', clienteNombre: 'Ana', clienteContacto: '59899333333' };
    const result = prepararPlanMultipaso('Prepará seguimiento del cliente "Ana"', datos({ presupuestos: [presupuesto, ana] }));
    expect(result).toMatchObject({ plan: { borrador: { telefono: '59899333333', presupuestoId: 'pres-ana' } } });
    expect(JSON.stringify(result)).toMatch(/antigüedad no verificada/);
    expect(prepararPlanMultipaso('Prepará seguimiento del cliente "Ana"', datos({ presupuestos: [ana], telefonosConMensajePendiente: ['59899333333'] })))
      .toMatchObject({ pregunta: expect.any(String) });
    expect(prepararPlanMultipaso('Perseguí presupuestos sin respuesta', datos({ presupuestos: [{ ...presupuesto, estado: 'Borrador' }] })))
      .toMatchObject({ pregunta: expect.any(String) });
  });
});
