import {
  buildPortalLedProImplementationChecklist,
  buildPortalLedProNavigation,
  buildPortalLedProVisualModel,
  getPortalLedProVisualSection,
} from '@/lib/commercial/portal-led-pro-visual-model';

describe('Portal LED Pro visual model', () => {
  it('builds ordered commercial sections', () => {
    const model = buildPortalLedProVisualModel();

    expect(model.title).toContain('Portal Comercial LED');
    expect(model.sections[0].id).toBe('hero');
    expect(model.sections.at(-1)?.id).toBe('closing');
  });

  it('includes technology highlights from technology showcase', () => {
    const model = buildPortalLedProVisualModel();

    expect(model.technologyHighlights.length).toBeGreaterThan(5);
    expect(model.technologyHighlights.some(item => item.title.includes('Portal Cliente'))).toBe(true);
  });

  it('returns section and navigation', () => {
    expect(getPortalLedProVisualSection('technology')?.title).toBe('Tecnología AK');
    expect(buildPortalLedProNavigation().some(item => item.id === 'menus')).toBe(true);
  });

  it('builds implementation checklist', () => {
    const checklist = buildPortalLedProImplementationChecklist();

    expect(checklist.length).toBeGreaterThan(10);
    expect(checklist.join(' ')).toContain('pantalla grande');
  });
});
