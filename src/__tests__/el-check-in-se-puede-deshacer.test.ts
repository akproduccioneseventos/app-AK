let invitadosMem = [
  { id: 'g1', nombre: 'Ana Pérez', checkedIn: true, checkInTimestamp: '2026-11-18T10:00:00Z' },
];

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'f1', invitados: invitadosMem })),
  saveFiesta: jest.fn(async () => ({ success: true })),
  requireFiestaWriteAccess: jest.fn(async () => ({ userId: 'u1', role: 'admin' })),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_fiestaId: string, fn: (d: any) => any) => {
    const next = fn({ invitados: invitadosMem });
    invitadosMem = next.invitados;
    return { success: true };
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

import { checkInGuest, undoCheckInGuest } from '@/app/actions/fiesta/invitados.actions';

describe('Orden 319 N20: el check-in se puede deshacer', () => {
  it('undoCheckInGuest vuelve checkedIn a false y permite volver a marcar ingreso', async () => {
    const resUndo = await undoCheckInGuest('f1', 'g1');
    expect(resUndo.success).toBe(true);
    expect(resUndo.invitado?.checkedIn).toBe(false);

    const resCheck = await checkInGuest('f1', 'g1');
    expect(resCheck.success).toBe(true);
    expect(resCheck.invitado?.checkedIn).toBe(true);
  });
});
