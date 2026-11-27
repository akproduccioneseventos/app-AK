const mockStore: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'admin' } }),
}));
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updater: (f: any) => any) => {
    const copiaActual = JSON.parse(JSON.stringify(mockStore[fiestaId] || { id: fiestaId, invitados: [] }));
    const nueva = updater(copiaActual);
    mockStore[fiestaId] = JSON.parse(JSON.stringify(nueva));
    return { success: true, updatedFiesta: JSON.parse(JSON.stringify(nueva)) };
  }),
}));

import { addInvitado, updateInvitado, deleteInvitado } from '@/app/actions/fiesta/invitados.actions';

describe('Orden 359: editar un invitado no pisa lo de otro y no filtra la lista', () => {
  beforeEach(() => {
    mockStore['f_inv_359'] = {
      id: 'f_inv_359',
      configuracion: { nombreEvento: 'Fiesta 359', presupuestoInterno: 999999 },
      invitados: [
        {
          id: 'inv_1',
          nombre: 'Lucía',
          categoria: 'Adulto',
          rsvp: 'Confirmado',
          checkedIn: true,
          partySize: 2,
          telefono: '099000111',
          guestAccessToken: 'tok_secreto_1',
        },
        {
          id: 'inv_2',
          nombre: 'Martín',
          categoria: 'Adulto',
          rsvp: 'Pendiente',
          checkedIn: false,
          partySize: 1,
        },
      ],
      videosParaInvitados: [{ id: 'v1', invitadoIds: ['inv_1', 'inv_2'], url: 'https://v' }],
    };
  });

  it('editar el teléfono con una copia vieja no borra la credencial ni los demás datos guardados en el medio', async () => {
    const copiaVieja: any = {
      id: 'inv_1',
      nombre: 'Lucía',
      categoria: 'Adulto',
      rsvp: 'Confirmado',
      checkedIn: true,
      partySize: 2,
      telefono: '099888777',
    };
    const res = await updateInvitado('f_inv_359', copiaVieja);
    expect(res.success).toBe(true);
    expect(mockStore['f_inv_359'].invitados[0].guestAccessToken).toBe('tok_secreto_1');
    expect(mockStore['f_inv_359'].invitados[0].telefono).toBe('099888777');
    expect((res as any).updatedFiesta).toBeUndefined();
  });

  it('editar un invitado que otro borró devuelve error claro', async () => {
    const res = await updateInvitado('f_inv_359', { id: 'inv_borrado', nombre: 'X', categoria: 'Adulto', rsvp: 'Pendiente' });
    expect(res.success).toBe(false);
    expect(res.error).toContain('lo borró otra persona');
  });

  it('addInvitado y deleteInvitado no devuelven la fiesta entera ni la lista de otros invitados', async () => {
    const added: any = await addInvitado('f_inv_359', { nombre: 'Sofía', categoria: 'Adulto', rsvp: 'Pendiente' });
    expect(added.success).toBe(true);
    expect(added.updatedFiesta).toBeUndefined();
    expect(added.invitado?.nombre).toBe('Sofía');

    const deleted: any = await deleteInvitado('f_inv_359', 'inv_2');
    expect(deleted.success).toBe(true);
    expect(deleted.updatedFiesta).toBeUndefined();
    expect(mockStore['f_inv_359'].videosParaInvitados[0].invitadoIds).toEqual(['inv_1']);
  });
});
