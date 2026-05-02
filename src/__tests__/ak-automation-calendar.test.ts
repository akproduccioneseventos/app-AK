import {
  buildAkAutomationPlan,
  buildAkSoftSellingDisclaimer,
  buildOperatorChecklistFromAutomation,
  getAutomationItemsForDate,
} from '@/lib/social-fiesta/ak-automation-calendar';

describe('AK social automation calendar', () => {
  it('builds a plan with base items and challenge prompts', () => {
    const plan = buildAkAutomationPlan({
      fiestaId: 'fiesta_1',
      eventName: 'Los 15 de Sofia',
      eventDate: '2026-06-01T22:00:00.000Z',
      preset: 'xv',
    });

    expect(plan.items.length).toBeGreaterThan(5);
    expect(plan.items.some(item => item.title === 'La fiesta ya empezó en la previa')).toBe(true);
    expect(plan.items.some(item => item.title === 'Selfie con la quinceañera')).toBe(true);
  });

  it('finds items scheduled for a specific date', () => {
    const plan = buildAkAutomationPlan({
      fiestaId: 'fiesta_1',
      eventName: 'Evento',
      eventDate: '2026-06-01T22:00:00.000Z',
      preset: 'general',
    });

    const items = getAutomationItemsForDate({ plan, now: '2026-05-02T10:00:00.000Z' });
    expect(items.some(item => item.title === 'Tip AK de organización')).toBe(true);
  });

  it('builds operator checklist and disclaimer', () => {
    const plan = buildAkAutomationPlan({
      fiestaId: 'fiesta_1',
      eventName: 'Evento',
      eventDate: '2026-06-01T22:00:00.000Z',
      preset: 'cumpleanos',
    });

    const checklist = buildOperatorChecklistFromAutomation(plan);
    expect(checklist.length).toBe(plan.items.length);
    expect(checklist[0]).toContain('días:');
    expect(buildAkSoftSellingDisclaimer()).toContain('sin vender');
  });
});
