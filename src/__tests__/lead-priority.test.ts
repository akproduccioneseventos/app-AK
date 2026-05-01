import { getLeadPriority } from '@/lib/crm/lead-priority';

describe('getLeadPriority', () => {
  it('marks high value close events as urgent', () => {
    const result = getLeadPriority({
      estimatedValue: 7000,
      eventDate: '2026-05-10',
      lastContactAt: '2026-04-20',
      stage: 'nuevo',
    }, new Date('2026-05-01'));

    expect(result.level).toBe('urgent');
    expect(result.reasons).toContain('Evento muy cercano.');
  });

  it('marks cold leads with no urgency as low', () => {
    const result = getLeadPriority({
      estimatedValue: 0,
      eventDate: '2099-01-01',
      lastContactAt: '2026-05-01',
      stage: 'perdido',
    }, new Date('2026-05-01'));

    expect(result.level).toBe('low');
  });

  it('adds a reason when last contact is missing', () => {
    const result = getLeadPriority({ estimatedValue: 1000 });
    expect(result.reasons).toContain('No hay ultimo contacto registrado.');
  });
});
