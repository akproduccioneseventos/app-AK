import {
  buildAkOperatorImplementationChecklist,
  getAkOperatorExperiencePreset,
  getAkOperatorExperienceStyle,
  getAkOperatorPriorityMap,
  getAkOperatorVisualZones,
} from '@/lib/design/ak-operator-experience-presets';

describe('AK operator and live wall experience presets', () => {
  it('defines live wall and internal premium presets', () => {
    expect(getAkOperatorExperiencePreset('liveWallStage').surface).toBe('liveWall');
    expect(getAkOperatorExperiencePreset('internalMissionControl').layout).toBe('command-center');
    expect(getAkOperatorExperiencePreset('crmPipeline').layout).toBe('pipeline');
  });

  it('builds visual style for operator surfaces', () => {
    const result = getAkOperatorExperienceStyle('liveWallStage');
    expect(result.theme.tone).toBe('neon');
    expect(result.style['--ak-premium-hero-gradient']).toContain('linear-gradient');
  });

  it('orders zones by priority', () => {
    const zones = getAkOperatorVisualZones('moderationControl');
    expect(zones[0].id).toBe('pending');
  });

  it('builds implementation checklist and priority map', () => {
    const checklist = buildAkOperatorImplementationChecklist('eventPlanner');
    expect(checklist[0]).toContain('Planificador Visual');
    expect(checklist.some(item => item.startsWith('Regla:'))).toBe(true);

    const map = getAkOperatorPriorityMap();
    expect(map.liveWallStage).toBe('Foto o video destacado');
  });
});
