import { buildSimulatorAdvisorFallback } from '@/lib/simulator-ai-advisor';

const packages = [
  { id: 'base', name: 'Base', includedServices: ['DJ'], price: 100000 },
  { id: 'pulse', name: 'Pulse', includedServices: ['DJ', 'Luces'], price: 150000, recommended: true },
  { id: 'total', name: 'Total', includedServices: ['DJ', 'Luces', 'Foto'], price: 220000 },
];

describe('simulator AI advisor fallback', () => {
  it('recommends the featured middle package for a standard event', () => {
    const result = buildSimulatorAdvisorFallback({
      eventType: 'Cumpleanos',
      guests: 80,
      durationHours: 5,
      hasVenue: true,
      packages,
    });

    expect(result.recommendedPackageId).toBe('pulse');
    expect(result.response).toContain('Pulse');
    expect(result.source).toBe('rules');
  });

  it('scales to the largest package for a large event', () => {
    const result = buildSimulatorAdvisorFallback({
      eventType: 'Boda',
      guests: 150,
      durationHours: 6,
      hasVenue: false,
      packages,
    });

    expect(result.recommendedPackageId).toBe('total');
  });

  it('answers inclusion questions with configured services only', () => {
    const result = buildSimulatorAdvisorFallback({
      question: 'Que incluye el paquete?',
      eventType: 'Cumpleanos',
      guests: 80,
      durationHours: 5,
      hasVenue: true,
      selectedPackageId: 'pulse',
      packages,
    });

    expect(result.response).toContain('DJ, Luces');
    expect(result.response).not.toContain('Foto');
  });

  it('treats convenience questions as recommendations', () => {
    const result = buildSimulatorAdvisorFallback({
      question: 'Que paquete me conviene para 80 personas?',
      eventType: 'Cumpleanos',
      guests: 80,
      durationHours: 5,
      hasVenue: true,
      packages,
    });

    expect(result.recommendedPackageId).toBe('pulse');
    expect(result.response).toContain('te recomiendo Pulse');
  });
});
