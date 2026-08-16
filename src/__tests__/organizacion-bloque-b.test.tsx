import { calculateFiestaPreparationScore } from '@/lib/fiesta/preparation-score';

describe('Organización Bloque B — Tablero Central y Próximo Paso Sugerido', () => {
  const mockFiesta = {
    id: 'fiesta-demo-123',
    configuracion: {
      nombreEvento: 'Boda Camila & Mateo',
      fechaEvento: '2026-11-20',
      nombreLugar: 'Château Lacustre',
      clienteId: 'cli-001',
      invitadosEstimados: 150,
    },
    invitados: [
      { id: 'inv-1', nombre: 'Juan Pérez', confirmado: true },
      { id: 'inv-2', nombre: 'Maria López', confirmado: false },
    ],
    tareas: [
      { id: 't1', texto: 'Confirmar DJ', completada: true },
      { id: 't2', texto: 'Elegir flores', completada: false },
      { id: 't3', texto: 'Abonar seña', completada: false },
    ],
  };

  test('calcula el avance general con barra de preparación y nivel adecuado', () => {
    const scoreResult = calculateFiestaPreparationScore(mockFiesta);
    expect(scoreResult.score).toBeGreaterThan(0);
    expect(scoreResult.score).toBeLessThanOrEqual(100);
    expect(['alta', 'media', 'inicial']).toContain(scoreResult.level);
    expect(scoreResult.checks.length).toBe(10);
  });

  test('identifica el próximo paso sugerido (módulo más urgente pendiente)', () => {
    const scoreResult = calculateFiestaPreparationScore(mockFiesta);
    expect(scoreResult.importantPending.length).toBeGreaterThan(0);
    const urgentNext = scoreResult.importantPending[0];
    expect(urgentNext.completed).toBe(false);
    expect(urgentNext.label).toBeDefined();
    expect(urgentNext.href).toContain('fiestaId=fiesta-demo-123');
  });

  test('si todas las áreas están completas, importantePending queda vacío', () => {
    const completeFiesta = {
      ...mockFiesta,
      menuAsignadoId: 'menu-1',
      decoracion: { zonasDiseno: [{ id: 'z1' }] },
      musica: { cancionVals: 'Vals 1' },
      personalAsignado: [{ empleadoId: 'emp-1' }],
      presupuestoId: 'pres-1',
      tareas: [{ id: 't1', completada: true }],
      clientPortalSettings: { enabled: true },
    };
    const scoreResult = calculateFiestaPreparationScore(completeFiesta);
    expect(scoreResult.score).toBe(100);
    expect(scoreResult.importantPending.length).toBe(0);
  });
});
