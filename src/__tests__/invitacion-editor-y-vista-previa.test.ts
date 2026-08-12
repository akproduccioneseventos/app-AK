import { getDatosMinimosFaltantesInvitacion } from '@/lib/invitacion/datos-minimos';
import type { FiestaEnPlanificacion, InvitacionDigitalData } from '@/types/fiesta';

describe('Editor de Invitaciones y Vista Previa', () => {
  it('detecta los datos minimos faltantes en la invitacion en criollo', () => {
    const fiestaIncompleta: Partial<FiestaEnPlanificacion> = {
      configuracion: {
        nombreEvento: 'Prueba',
        tipoCelebracion: 'Boda',
        fechaEvento: '',
        horaInicio: '',
        salonFiestas: '',
      } as any,
    };

    const invitacionDataIncompleta: Partial<InvitacionDigitalData> = {
      detallesEvento: {
        ceremoniaReligiosa: { visible: false, titulo: '', fecha: '', hora: '', nombreLugar: '', direccionLugar: '' },
        ceremoniaCivil: { visible: false, titulo: '', fecha: '', hora: '', nombreLugar: '', direccionLugar: '' },
        celebracion: { visible: false, titulo: '', fecha: '', hora: '', nombreLugar: '', direccionLugar: '' },
      },
    };

    const faltantes = getDatosMinimosFaltantesInvitacion(
      fiestaIncompleta as FiestaEnPlanificacion,
      invitacionDataIncompleta as InvitacionDigitalData
    );

    expect(faltantes).toContain('Falta la fecha del evento.');
    expect(faltantes).toContain('Falta la hora de inicio.');
    expect(faltantes).toContain('Falta el nombre del salón o lugar.');
    expect(faltantes).toContain('Falta la dirección de la celebración. Sin eso el invitado no sabe adónde ir.');
  });

  it('no reporta faltantes cuando la fiesta tiene fecha, hora, salon y direccion', () => {
    const fiestaCompleta: Partial<FiestaEnPlanificacion> = {
      configuracion: {
        nombreEvento: 'Boda Juan y Ana',
        tipoCelebracion: 'Boda',
        fechaEvento: '2026-12-15',
        horaInicio: '21:00',
        salonFiestas: 'Salón Club Uruguay',
      } as any,
    };

    const invitacionDataCompleta: Partial<InvitacionDigitalData> = {
      detallesEvento: {
        ceremoniaReligiosa: { visible: false, titulo: '', fecha: '', hora: '', nombreLugar: '', direccionLugar: '' },
        ceremoniaCivil: { visible: false, titulo: '', fecha: '', hora: '', nombreLugar: '', direccionLugar: '' },
        celebracion: { visible: true, titulo: 'Fiesta', fecha: '2026-12-15', hora: '21:00', nombreLugar: 'Salón Club Uruguay', direccionLugar: 'Uruguay 1234' },
      },
    };

    const faltantes = getDatosMinimosFaltantesInvitacion(
      fiestaCompleta as FiestaEnPlanificacion,
      invitacionDataCompleta as InvitacionDigitalData
    );

    expect(faltantes.length).toBe(0);
  });
});
