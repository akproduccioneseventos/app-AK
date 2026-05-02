import {
  buildLockedRsvpGroup,
  buildRsvpProGuest,
  buildRsvpProHelperText,
  canAddUnauthorizedCompanion,
  getRsvpProGroupGuests,
  getRsvpProSummary,
  requestRsvpCancellation,
  updateRsvpProGuest,
} from '@/lib/invitacion/rsvp-pro-control';

describe('RSVP Pro controlled invitation rules', () => {
  it('creates guests with plus-one disabled by default', () => {
    const guest = buildRsvpProGuest({ id: 'g1', fullName: ' Ana   Rodriguez ' });

    expect(guest.fullName).toBe('Ana Rodriguez');
    expect(guest.status).toBe('pendiente');
    expect(guest.allowPlusOne).toBe(false);
    expect(canAddUnauthorizedCompanion()).toBe(false);
  });

  it('confirms individual guests without adding companions', () => {
    const guests = [
      buildRsvpProGuest({ id: 'g1', fullName: 'Ana Rodriguez' }),
      buildRsvpProGuest({ id: 'g2', fullName: 'Juan Rodriguez' }),
    ];

    const result = updateRsvpProGuest(guests, {
      guestId: 'g1',
      status: 'confirmado',
      dietaryRestrictions: 'Sin gluten',
      songSuggestion: 'Una cancion',
      now: '2026-05-01T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.guests).toHaveLength(2);
    expect(result.guests[0].status).toBe('confirmado');
    expect(result.guests[0].dietaryRestrictions).toBe('Sin gluten');
    expect(result.guests[1].status).toBe('pendiente');
  });

  it('supports locked family groups already authorized by AK', () => {
    const guests = [
      buildRsvpProGuest({ id: 'g1', fullName: 'Ana Rodriguez', groupId: 'fam1' }),
      buildRsvpProGuest({ id: 'g2', fullName: 'Juan Rodriguez', groupId: 'fam1' }),
      buildRsvpProGuest({ id: 'g3', fullName: 'Sofia Perez' }),
    ];
    const group = buildLockedRsvpGroup({ id: 'fam1', label: 'Familia Rodriguez', guestIds: ['g1', 'g2', 'g2'] });

    expect(group.locked).toBe(true);
    expect(group.maxConfirmations).toBe(2);
    expect(getRsvpProGroupGuests(guests, group)).toHaveLength(2);
  });

  it('requests cancellation review by default', () => {
    const guests = [buildRsvpProGuest({ id: 'g1', fullName: 'Ana Rodriguez' })];
    const result = requestRsvpCancellation(guests, {
      guestId: 'g1',
      reason: 'No puede asistir',
      now: '2026-05-01T10:00:00.000Z',
    });

    expect(result.ok).toBe(true);
    expect(result.requiresOrganizerReview).toBe(true);
    expect(result.guests[0].status).toBe('cancelacion_solicitada');
  });

  it('summarizes RSVP statuses', () => {
    const guests = [
      { ...buildRsvpProGuest({ id: 'g1', fullName: 'Ana' }), status: 'confirmado' as const },
      { ...buildRsvpProGuest({ id: 'g2', fullName: 'Juan' }), status: 'no_asiste' as const },
      buildRsvpProGuest({ id: 'g3', fullName: 'Sofia' }),
    ];

    const summary = getRsvpProSummary(guests);
    expect(summary.total).toBe(3);
    expect(summary.confirmado).toBe(1);
    expect(summary.no_asiste).toBe(1);
    expect(summary.pendiente).toBe(1);
  });

  it('explains the no unauthorized companion rule', () => {
    expect(buildRsvpProHelperText()).toContain('No se permiten acompañantes libres');
  });
});
