import { enlaceDeInvitadoDeMuestra } from '@/app/actions/fiesta/vista-de-muestra.actions';
import { buildAkDemoFiesta } from '@/lib/experience-ak/demo-fiesta-factory';

const mockVerifySession = jest.fn();
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: () => mockVerifySession(),
}));

const mockGetFiestaById = jest.fn();
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (id: string) => mockGetFiestaById(id),
}));

describe('El invitado de muestra abre (Orden 285 - Bloque 6)', () => {
  const fiestaDemo = {
    id: 'fiesta_test_123',
    invitados: [
      { id: 'guest_1', nombre: 'Invitado Con Token', guestAccessToken: 'token_secreto_abc' },
      { id: 'guest_2', nombre: 'Segundo Invitado' },
    ],
  };

  beforeEach(() => {
    mockVerifySession.mockReset();
    mockGetFiestaById.mockReset();
    mockGetFiestaById.mockResolvedValue(fiestaDemo);
  });

  it('con sesión de dueño devuelve una dirección con ?token= igual al guestAccessToken del invitado', async () => {
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { email: 'dueno@akproducciones.uy', role: 'admin', perfil: 'dueno' },
    });

    const res = await enlaceDeInvitadoDeMuestra('fiesta_test_123');
    expect(res.success).toBe(true);
    expect(res.url).toContain('/invitacion/fiesta_test_123/invitado/guest_1?token=token_secreto_abc');
  });

  it('con sesión de auditor devuelve la dirección con ?token=', async () => {
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { email: 'auditor@externo.test', role: 'admin', perfil: 'auditor' },
    });

    const res = await enlaceDeInvitadoDeMuestra('fiesta_test_123');
    expect(res.success).toBe(true);
    expect(res.url).toContain('?token=token_secreto_abc');
  });

  it('si ningún invitado tiene guestAccessToken devuelve la ruta de rsvp', async () => {
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { email: 'dueno@akproducciones.uy', role: 'admin', perfil: 'dueno' },
    });
    mockGetFiestaById.mockResolvedValue({
      id: 'fiesta_sin_token',
      invitados: [{ id: 'g1', nombre: 'Sin token' }],
    });

    const res = await enlaceDeInvitadoDeMuestra('fiesta_sin_token');
    expect(res.success).toBe(true);
    expect(res.url).toBe('/invitacion/fiesta_sin_token/rsvp');
  });

  it('con sesión de secretaria devuelve error', async () => {
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { email: 'secretaria@akproducciones.uy', role: 'secretaria', perfil: 'secretaria' },
    });

    const res = await enlaceDeInvitadoDeMuestra('fiesta_test_123');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/solo el dueño o auditor/i);
  });

  it('con sesión de personal devuelve error', async () => {
    mockVerifySession.mockResolvedValue({
      success: true,
      user: { email: 'mozo@akproducciones.uy', role: 'personal', perfil: 'personal' },
    });

    const res = await enlaceDeInvitadoDeMuestra('fiesta_test_123');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/solo el dueño o auditor/i);
  });

  it('los invitados del demo tienen guestAccessToken', () => {
    const demo = buildAkDemoFiesta('tecnologia-total');
    expect(Array.isArray(demo.invitados)).toBe(true);
    expect(demo.invitados.length).toBeGreaterThan(0);
    for (const inv of demo.invitados) {
      expect(typeof inv.guestAccessToken).toBe('string');
      expect(inv.guestAccessToken!.length).toBeGreaterThan(0);
    }
  });
});
