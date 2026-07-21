import { toPublicGuestStatsInput } from './public-guest-stats';

describe('toPublicGuestStatsInput', () => {
  it('keeps only the fields required for aggregate guest statistics', () => {
    const result = toPublicGuestStatsInput([{
      id: 'guest-1',
      nombre: 'Invitada privada',
      alergias: 'Dato sensible',
      mesaId: 'mesa-4',
      rsvp: 'Confirmado',
      partySize: 3,
    }]);

    expect(result).toEqual([{ rsvp: 'Confirmado', partySize: 3 }]);
    expect(result[0]).not.toHaveProperty('nombre');
    expect(result[0]).not.toHaveProperty('alergias');
    expect(result[0]).not.toHaveProperty('mesaId');
  });

  it('normalizes invalid records without exposing their original content', () => {
    expect(toPublicGuestStatsInput([null, { rsvp: 12, partySize: 100 }])).toEqual([
      { rsvp: 'pendiente', partySize: 1 },
      { rsvp: 'pendiente', partySize: 20 },
    ]);
  });
});
