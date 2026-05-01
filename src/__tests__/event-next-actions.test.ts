import { getEventNextActions } from '@/lib/events/event-next-actions';

describe('getEventNextActions', () => {
  it('returns no actions for a complete event', () => {
    const actions = getEventNextActions({
      hasSignedContract: true,
      balanceDue: 0,
      pendingRsvps: 0,
      overdueTasks: 0,
      missingVendors: 0,
    });

    expect(actions).toEqual([]);
  });

  it('prioritizes overdue tasks first', () => {
    const actions = getEventNextActions({
      hasSignedContract: false,
      balanceDue: 500,
      overdueTasks: 2,
      eventDate: '2099-01-15',
    });

    expect(actions[0].id).toBe('tasks');
    expect(actions[0].priority).toBe('urgent');
  });

  it('raises urgency when the event is close', () => {
    const actions = getEventNextActions({
      hasSignedContract: false,
      eventDate: '2026-05-03',
    }, new Date('2026-05-01'));

    expect(actions[0].priority).toBe('urgent');
  });
});
