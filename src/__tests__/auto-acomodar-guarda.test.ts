import { autoAssignTables } from '@/app/actions/salon-ia.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'test', role: 'admin' } }),
}));

describe('Auto-acomodar guarda con capacidad real (Orden 375 Bloque 5)', () => {
  it('respeta la capacidad real configurada en la mesa', async () => {
    const invitados = [
      { id: 'i1', nombre: 'Juan', partySize: 4, rsvp: 'Confirmado' },
      { id: 'i2', nombre: 'Ana', partySize: 4, rsvp: 'Confirmado' },
    ];
    const tables = [
      { id: 't1', name: 'Mesa 1', width: 100, height: 100, category: 'Mesa', seats: 4 } as any,
    ];

    const res = await autoAssignTables(invitados, tables);
    expect(res.success).toBe(true);
    const asignadosMesa1 = res.updatedInvitados.filter(i => i.tableNumber === 'Mesa 1');
    expect(asignadosMesa1.length).toBe(1);
  });
});
