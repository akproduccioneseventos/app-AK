import {
  enqueueOfflineAction,
  loadOfflineQueue,
  dequeueOfflineAction,
  getPendingOfflineActions,
  flushOfflineQueue,
} from '@/lib/offline/offline-action-queue';

describe('Bloque D — Respaldo sin internet en la fiesta (Offline Queue)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('encola acciones offline y las recupera correctamente', () => {
    const action = enqueueOfflineAction({
      id: 'photo_1',
      type: 'muro_foto',
      fiestaId: 'fiesta_123',
      payload: { photoUrl: 'data:image/jpeg;base64,...', caption: 'En la fiesta!' },
    });

    expect(action.id).toBe('photo_1');
    const pending = loadOfflineQueue();
    expect(pending).toHaveLength(1);
    expect(pending[0].payload.caption).toBe('En la fiesta!');
  });

  it('evita duplicados si se encola la misma acción con el mismo id', () => {
    enqueueOfflineAction({
      id: 'checkin_guest_99',
      type: 'recepcion_checkin',
      fiestaId: 'fiesta_123',
      payload: { guestId: 'guest_99', estado: 'presente' },
    });

    enqueueOfflineAction({
      id: 'checkin_guest_99',
      type: 'recepcion_checkin',
      fiestaId: 'fiesta_123',
      payload: { guestId: 'guest_99', estado: 'presente' },
    });

    const pending = loadOfflineQueue();
    expect(pending).toHaveLength(1);
  });

  it('procesa la cola y elimina los elementos exitosos', async () => {
    enqueueOfflineAction({
      id: 'bar_order_1',
      type: 'barra_pedido',
      fiestaId: 'fiesta_123',
      payload: { drink: 'Fernet', table: 4 },
    });

    enqueueOfflineAction({
      id: 'bar_order_2',
      type: 'barra_pedido',
      fiestaId: 'fiesta_123',
      payload: { drink: 'Mojito', table: 2 },
    });

    const result = await flushOfflineQueue(async (action) => {
      if (action.id === 'bar_order_1') return { success: true };
      return { success: false, error: 'Servidor ocupado' };
    });

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(1);

    const remaining = loadOfflineQueue();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('bar_order_2');
    expect(remaining[0].retryCount).toBe(1);
  });

  it('filtra pendientes por fiestaId', () => {
    enqueueOfflineAction({
      id: 'p1',
      type: 'muro_foto',
      fiestaId: 'fiesta_A',
      payload: {},
    });
    enqueueOfflineAction({
      id: 'p2',
      type: 'muro_foto',
      fiestaId: 'fiesta_B',
      payload: {},
    });

    const pendingA = getPendingOfflineActions('fiesta_A');
    expect(pendingA).toHaveLength(1);
    expect(pendingA[0].id).toBe('p1');
  });
});
