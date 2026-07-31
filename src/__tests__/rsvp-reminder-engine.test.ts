import { getPendingRsvpGuests, generateRsvpMessage, buildRsvpReminders } from '../lib/rsvp/rsvp-reminder-engine';
import { Invitado, FiestaEnPlanificacion } from '@/types/fiesta';

describe('rsvp-reminder-engine', () => {
  it('getPendingRsvpGuests filters correctly', () => {
    const invitados: Partial<Invitado>[] = [
      { id: '1', nombre: 'Juan', rsvp: 'Pendiente', contacto: '123456789' },
      { id: '2', nombre: 'Ana', rsvp: 'Confirmado', contacto: '987654321' },
      { id: '3', nombre: 'Pedro', rsvp: 'Pendiente' } // No contact
    ];

    const result = getPendingRsvpGuests(invitados as Invitado[]);
    expect(result).toHaveLength(1);
    expect(result[0].nombre).toBe('Juan');
  });

  it('generateRsvpMessage includes guest name and event name', () => {
    const message = generateRsvpMessage('Maria', 'Boda de Juan y Ana', '2023-12-01', 'http://link.com', 5);
    expect(message).toContain('Maria');
    expect(message).toContain('Boda de Juan y Ana');
    expect(message).toContain('5');
    expect(message).toContain('http://link.com');
  });

  it('buildRsvpReminders returns correct count', () => {
    const fiesta: Partial<FiestaEnPlanificacion> = {
      id: 'fiesta-1',
      nombre: 'Mi Fiesta',
      fecha: '2023-12-01T00:00:00Z',
      invitados: [
        { id: '1', nombre: 'Juan', rsvp: 'Pendiente', contacto: '123456789', guestAccessToken: 'token1' } as Invitado,
        { id: '2', nombre: 'Ana', rsvp: 'Confirmado', contacto: '987654321', guestAccessToken: 'token2' } as Invitado
      ]
    };

    const result = buildRsvpReminders(fiesta as FiestaEnPlanificacion, 'http://localhost:3000');
    expect(result).toHaveLength(1);
    expect(result[0].guestName).toBe('Juan');
  });
});
