/**
 * @jest-environment node
 *
 * MATAFUEGO (13/10/2026) - La agenda y los recordatorios cuentan en hora de Uruguay.
 *
 * El servidor corre en hora de Greenwich (3 horas adelante). El horario de la reunion del
 * simulador se armaba con `new Date(anio, mes, dia, hh, mm)`: el prospecto elegia 10:00 y quedaba
 * 07:00 en la agenda. Y los recordatorios a los invitados / los semaforos contaban los dias con
 * el "hoy" de Greenwich: desde las 21:00 de Uruguay ya era mañana.
 * Reloj falso a las 22:30 de Uruguay (01:30 de Greenwich del dia siguiente).
 * Probado rompiendolo: con `new Date(anio, mes, diaMes, hh, mm)` las de horarios se ponen en rojo.
 */
jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({ abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true })), respuestaDeLaTarea: (_puerta: unknown, cuerpo: unknown) => cuerpo }));
const marcarCorrida = jest.fn(async () => undefined);
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: (...a: any[]) => (marcarCorrida as any)(...a) }));
const leerFiestasCrudas = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: (...a: any[]) => leerFiestasCrudas(...a) }));
const guardados: any[] = [];
jest.mock('@/app/actions/scheduled-messages', () => ({
  saveScheduledMessage: jest.fn(async (m: any) => { guardados.push(m); return { success: true }; }),
}));

import fs from 'fs';
import path from 'path';
import { calcularHorariosDisponibles } from '@/lib/agenda/horarios-disponibles';
import { isEventInActiveWindow } from '@/lib/experience-ak/post-event-utils';
import { GET as recordatorioGET } from '@/app/api/cron/recordatorio-a-los-invitados/route';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('el horario de la reunion es de Uruguay', () => {
  afterEach(() => jest.useRealTimers());

  it('a las 22:30 del martes, lo primero que se ofrece es el miercoles 10:00 de Uruguay (13:00 UTC)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T01:30:00Z')); // martes 13 22:30 en Uruguay
    const dias = calcularHorariosDisponibles([], 14);
    expect(dias[0].date).toBe('2026-10-14');
    expect(dias[0].dayName).toBe('Miércoles');
    expect(dias[0].slots[0].time).toBe('10:00');
    expect(dias[0].slots[0].datetimeIso).toBe('2026-10-14T13:00:00.000Z');
  });

  it('a las 17:30 del martes, el de las 18:00 todavia se ofrece (no "ya paso" por hora de Greenwich)', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-13T20:30:00Z')); // martes 17:30 en Uruguay
    const dias = calcularHorariosDisponibles([], 14);
    expect(dias[0].date).toBe('2026-10-13');
    expect(dias[0].slots.map((s) => s.time)).toEqual(['18:00']);
    expect(dias[0].slots[0].datetimeIso).toBe('2026-10-13T21:00:00.000Z');
  });

  it('una cita ya agendada a las 10:00 de Uruguay ocupa ese horario', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T01:30:00Z'));
    const dias = calcularHorariosDisponibles([{ id: 'c1', estado: 'Agendada', fechaHora: '2026-10-14T13:00:00.000Z' } as any], 14);
    expect(dias[0].slots.map((s) => s.time)).not.toContain('10:00');
    expect(dias[0].slots.map((s) => s.time)).toContain('11:00');
  });

  it('el sabado se ofrecen sus tres horarios de Uruguay', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T01:30:00Z'));
    const sabado = calcularHorariosDisponibles([], 14).find((d) => d.dayName === 'Sábado')!;
    expect(sabado.slots.map((s) => s.datetimeIso.slice(11, 16))).toEqual(['13:00', '14:00', '15:00']);
  });
});

describe('los dias que faltan son los de Uruguay', () => {
  afterEach(() => jest.useRealTimers());

  it('la ventana posterior a la fiesta: el dia de la fiesta a las 22:30 son 0 dias, no 1', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T01:30:00Z'));
    expect(isEventInActiveWindow('2026-10-13').daysDifference).toBe(0);
    expect(isEventInActiveWindow('2026-10-15').daysDifference).toBe(-2);
  });

  it('el recordatorio "faltan 2 dias" sale cuando faltan 2 dias en Uruguay, aunque en Greenwich sea otro dia', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T01:30:00Z')); // en Uruguay: martes 13
    guardados.length = 0;
    leerFiestasCrudas.mockResolvedValue([{
      id: 'f1',
      configuracion: { fechaEvento: '2026-10-15', nombreEvento: 'XV de Ana', horaInicio: '21:00', nombreLugar: 'Club' },
      invitados: [{ id: 'i1', nombre: 'Luis', rsvp: 'Confirmado', contacto: '099123456' }],
    }]);
    const res = await recordatorioGET(new Request('http://x/api/cron/recordatorio-a-los-invitados'));
    expect(res.status).toBe(200);
    expect(guardados).toHaveLength(1);
    expect(guardados[0].messageText).toContain('Faltan solo 2 días');
  });

  it('el semaforo y las reglas automaticas no usan la hora del servidor para contar dias', () => {
    for (const archivo of ['src/lib/fiesta-progress.ts', 'src/lib/automatizaciones-engine.ts', 'src/lib/experience-ak/post-event-utils.ts', 'src/app/api/cron/recordatorio-a-los-invitados/route.ts']) {
      const codigo = leer(archivo);
      expect(codigo).toContain('diasHastaEnUruguay');
      expect(codigo).not.toMatch(/setHours\(0, 0, 0, 0\)/);
    }
  });
});
