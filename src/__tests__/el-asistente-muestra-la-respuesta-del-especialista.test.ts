import { filterVisibleMessages } from '@/components/multiagent/multiagent-widget';

describe('Orden 304 Bloque 1: El asistente muestra la respuesta del especialista', () => {
  it('mantiene visible la respuesta del especialista aunque su agentType sea distinto al activo', () => {
    const messages = [
      { id: '1', role: 'user', content: '¿Cómo viene la fiesta?', agentType: 'general' },
      { id: '2', role: 'assistant', content: 'Todo confirmado para el sábado.', agentType: 'fiesta', agentName: 'Agente de esta Fiesta' },
    ];

    const visibles = filterVisibleMessages(messages, null);
    expect(visibles).toHaveLength(2);
    expect(visibles[1].agentType).toBe('fiesta');
    expect(visibles[1].agentName).toBe('Agente de esta Fiesta');
  });

  it('filtra mensajes de otras fiestas cuando hay una fiestaId activa', () => {
    const messages = [
      { id: '1', role: 'assistant', content: 'De esta fiesta', agentType: 'fiesta', fiestaId: 'f1' },
      { id: '2', role: 'assistant', content: 'De otra fiesta', agentType: 'fiesta', fiestaId: 'f2' },
    ];

    const visibles = filterVisibleMessages(messages, 'f1');
    expect(visibles).toHaveLength(1);
    expect(visibles[0].id).toBe('1');
  });
});
