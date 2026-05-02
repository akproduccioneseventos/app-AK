import {
  isLikelyDialogueInsteadOfService,
  isNonServiceBudgetLine,
  sanitizeImportedBudgetServices,
} from '@/lib/assistant/operative-budget-import';

describe('operative budget import helpers', () => {
  it('rejects conversational text as service names', () => {
    expect(isLikelyDialogueInsteadOfService('Aqui te dejo el presupuesto creado para Maria. Quedo listo para revisar.')).toBe(true);
    expect(isLikelyDialogueInsteadOfService('Voy a crear el presupuesto para el cliente')).toBe(true);
    expect(isLikelyDialogueInsteadOfService('Discoteca')).toBe(false);
  });

  it('rejects total and metadata lines as services', () => {
    expect(isNonServiceBudgetLine('Total')).toBe(true);
    expect(isNonServiceBudgetLine('Subtotal: 50000')).toBe(true);
    expect(isNonServiceBudgetLine('Cliente: Maria')).toBe(true);
    expect(isNonServiceBudgetLine('Fotografia')).toBe(false);
  });

  it('sanitizes imported budget services', () => {
    const services = sanitizeImportedBudgetServices([
      { nombre: 'Aqui te dejo el presupuesto creado para Maria. Quedo listo.', precioUnitario: 1 },
      { nombre: 'Total', precioUnitario: 50000 },
      { nombre: 'Discoteca', cantidad: 1, precioUnitario: 18000, servicioCatalogoId: 'svc_1' },
      { nombre: 'Fotografia y video', cantidad: 1, precio: 25000 },
      { nombre: 'Servicio sin precio', cantidad: 1, precioUnitario: 0 },
    ]);

    expect(services).toHaveLength(2);
    expect(services[0]).toMatchObject({
      nombre: 'Discoteca',
      precioUnitario: 18000,
      servicioCatalogoId: 'svc_1',
      coincidenciaCatalogo: 'probable',
      requiereRevision: false,
    });
    expect(services[1]).toMatchObject({
      nombre: 'Fotografia y video',
      precioUnitario: 25000,
      categoria: 'Servicios importados',
      coincidenciaCatalogo: 'sin_coincidencia',
      requiereRevision: true,
    });
  });
});
