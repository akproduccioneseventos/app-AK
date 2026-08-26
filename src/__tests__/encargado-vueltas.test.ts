import {
  seleccionarEspecialistas,
  MAX_ESPECIALISTAS_POR_PEDIDO,
  MAX_VUELTAS_POR_PEDIDO,
  ejecutarEncargado,
} from '@/lib/multiagent/encargado';

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn().mockResolvedValue(true),
  registrarConsumoIA: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn().mockResolvedValue({
    text: JSON.stringify({
      accion: 'terminar',
      argumentos: { resumen: 'Boda de Sofía guardada y presupuesto comprobado.' },
      pensamiento: 'Armé el presupuesto de Sofía y lo confirmé en la base.',
    }),
  }),
}));

describe('Bloque 7: El Encargado trabaja en vueltas agénticas', () => {
  it('respeta el tope estricto de máximo 3 especialistas por pedido', () => {
    expect(MAX_ESPECIALISTAS_POR_PEDIDO).toBe(3);

    // Mensaje que toca todos los temas posibles (fiesta, contable, comercial, marketing, secretaria)
    const seleccionados = seleccionarEspecialistas(
      '¿Cómo viene el sábado? Revisá los mozos de la fiesta, los pagos de la cuota, mandale mensaje a los prospectos y publicá en instagram agendando reunión.'
    );

    expect(seleccionados.length).toBeLessThanOrEqual(3);
  });

  it('respeta el límite de máximo 5 vueltas por pedido', () => {
    expect(MAX_VUELTAS_POR_PEDIDO).toBe(5);
  });

  it('si no hay presupuesto de IA, avisa en criollo y no se apaga en silencio', async () => {
    const { hayPresupuestoParaIA } = require('@/lib/ai/consumo-servidor');
    hayPresupuestoParaIA.mockResolvedValueOnce(false);

    const resultado = await ejecutarEncargado({
      message: 'Armá el presupuesto de la boda de Sofía',
      history: [],
    });

    expect(resultado.success).toBe(true);
    expect(resultado.response).toContain('este mes ya usé todo lo que tengo asignado');
    expect(resultado.vueltasRealizadas).toBe(0);
  });

  it('ejecuta en vueltas y devuelve los pasos realizados al dueño', async () => {
    const resultado = await ejecutarEncargado({
      message: 'Armá el presupuesto de la boda de Sofía para 120 personas con paquete oro',
      history: [],
    });

    expect(resultado.success).toBe(true);
    expect(resultado.agentName).toBe('Encargado General AK');
    expect(resultado.vueltasRealizadas).toBeGreaterThanOrEqual(1);
    expect(resultado.vueltasRealizadas).toBeLessThanOrEqual(5);
  });
});
