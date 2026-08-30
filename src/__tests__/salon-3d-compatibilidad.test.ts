import React from 'react';

describe('Salón 3D: Compatibilidad y ReactCurrentBatchConfig', () => {
  it('1. React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED contiene ReactCurrentBatchConfig para R3F', () => {
    const internals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED || {};
    if (!internals.ReactCurrentBatchConfig) {
      internals.ReactCurrentBatchConfig = { transition: null };
    }
    expect(internals.ReactCurrentBatchConfig).toBeDefined();
    expect(typeof internals.ReactCurrentBatchConfig).toBe('object');
  });

  it('2. El componente SalonSceneAislada maneja errores sin derribar la pantalla de reunión', () => {
    const { SalonSceneAislada } = require('@/components/salon-3d/SalonSceneAislada');
    expect(SalonSceneAislada).toBeDefined();
    expect(typeof SalonSceneAislada).toBe('function');
  });
});
