import { getInvitationReadiness } from '@/lib/invitacion/invitation-readiness';

describe('getInvitationReadiness', () => {
  it('approves a complete invitation', () => {
    const result = getInvitationReadiness({
      title: 'Fiesta de Vana',
      eventDate: '2099-04-10',
      venue: 'AK Eventos',
      rsvpEnabled: true,
      whatsappShareEnabled: true,
      calendarEnabled: true,
      qrEnabled: true,
    });

    expect(result.readyToShare).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('blocks sharing when date and venue are missing', () => {
    const result = getInvitationReadiness({
      title: 'Cumple',
      rsvpEnabled: true,
      whatsappShareEnabled: true,
    });

    expect(result.readyToShare).toBe(false);
    expect(result.missing).toContain('fecha');
    expect(result.missing).toContain('lugar');
  });
});
