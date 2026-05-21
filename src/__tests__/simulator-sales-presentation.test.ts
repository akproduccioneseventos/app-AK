import {
  buildSimulatorSalesChatMessages,
  buildSimulatorValuePropositionSummary,
  getSimulatorSalesSteps,
  SIMULATOR_SALES_PRESENTATION,
  shouldShowPriceAfterSalesPresentation,
} from '@/lib/commercial/simulator-sales-presentation';

describe('simulator sales presentation', () => {
  it('orders sales steps before price', () => {
    const steps = getSimulatorSalesSteps();

    expect(steps[0].id).toBe('dolor_cliente');
    expect(steps.at(-1)?.id).toBe('precio_referencia');
  });

  it('builds assistant messages with AK value before price', () => {
    const messages = buildSimulatorSalesChatMessages('Sofia');

    expect(messages[0]).toContain('Sofia');
    expect(messages.join(' ')).toContain('fiesta ordenada');
    expect(messages.join(' ')).toContain('organización integral');
    expect(messages.join(' ')).toContain('invitación digital');
  });

  it('builds value proposition summary', () => {
    const summary = buildSimulatorValuePropositionSummary();

    expect(summary).toContain('Un solo equipo');
    expect(summary).toContain('Tecnología AK');
    expect(summary).not.toContain('Precio de referencia');
  });

  it('declares required value steps before showing price', () => {
    expect(SIMULATOR_SALES_PRESENTATION.requiredBeforePriceStepIds).toEqual([
      'dolor_cliente',
      'servicio_integral',
      'beneficios_ak',
      'tecnologia_ak',
      'prueba_valor',
    ]);
    expect(SIMULATOR_SALES_PRESENTATION.commercialPromise).toContain('tecnología propia');
  });

  it('does not show price until core sales steps are completed', () => {
    expect(shouldShowPriceAfterSalesPresentation(['dolor_cliente'])).toBe(false);
    expect(shouldShowPriceAfterSalesPresentation([
      'dolor_cliente',
      'servicio_integral',
      'beneficios_ak',
      'tecnologia_ak',
      'prueba_valor',
    ])).toBe(true);
  });
});
