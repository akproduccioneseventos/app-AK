/**
 * La invitación no se puede compartir con los datos de la boda de ejemplo.
 *
 * El editor arranca de un ejemplo para que el equipo no empiece de una pantalla
 * en blanco. El control de antes de compartir miraba que los campos estuvieran
 * LLENOS, no que fueran de verdad: "Catedral de San Juan, Calle Falsa 123" pasaba
 * sin problema y la invitación podía salir con una calle que no existe.
 */
import { getDatosMinimosFaltantesInvitacion } from '@/lib/invitacion/datos-minimos';

const fiestaCompleta = {
  configuracion: {
    fechaEvento: '2026-11-15T00:00:00.000Z',
    horaInicio: '21:00',
    nombreLugar: 'Club Uruguay',
    direccionLugar: 'Uruguay 1234, Salto',
  },
} as any;

const invitacionVacia = {} as any;

describe('Compartir la invitación con los datos del ejemplo', () => {
  it('con todo cargado de verdad, deja compartir', () => {
    expect(getDatosMinimosFaltantesInvitacion(fiestaCompleta, invitacionVacia)).toEqual([]);
  });

  it('avisa si quedó la dirección de mentira del ejemplo', () => {
    const fiesta = {
      configuracion: { ...fiestaCompleta.configuracion, direccionLugar: 'Calle Falsa 123, Ciudad' },
    } as any;
    const faltantes = getDatosMinimosFaltantesInvitacion(fiesta, invitacionVacia);
    expect(faltantes.join(' ')).toMatch(/ejemplo/i);
    expect(faltantes.join(' ')).toMatch(/Calle Falsa/i);
  });

  it('avisa si quedó el salón del ejemplo', () => {
    const fiesta = {
      configuracion: { ...fiestaCompleta.configuracion, nombreLugar: 'Salón El Paraíso' },
    } as any;
    expect(getDatosMinimosFaltantesInvitacion(fiesta, invitacionVacia).join(' ')).toMatch(/ejemplo/i);
  });

  it('avisa si quedó el lugar de la ceremonia del ejemplo', () => {
    const invitacion = {
      detallesEvento: { ceremoniaReligiosa: { nombreLugar: 'Catedral de San Juan', direccionLugar: '' } },
    } as any;
    expect(getDatosMinimosFaltantesInvitacion(fiestaCompleta, invitacion).join(' ')).toMatch(/ejemplo/i);
  });

  it('avisa si quedaron las fotos traídas al azar de internet', () => {
    const invitacion = {
      secciones: [{ data: { imagenFondoUrl: 'https://picsum.photos/seed/welcomebg/1200/800' } }],
    } as any;
    expect(getDatosMinimosFaltantesInvitacion(fiestaCompleta, invitacion).join(' ')).toMatch(/fotos.*ejemplo/i);
  });

  it('sigue avisando lo de siempre: sin fecha no se comparte', () => {
    const fiesta = { configuracion: { ...fiestaCompleta.configuracion, fechaEvento: '' } } as any;
    expect(getDatosMinimosFaltantesInvitacion(fiesta, invitacionVacia).join(' ')).toMatch(/fecha/i);
  });
});
