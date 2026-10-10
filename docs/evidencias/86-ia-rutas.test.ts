// REAL server action and REAL permission guard; storage/motor replaced to avoid effects.
import { toggleAgente, ejecutarAgenteManual } from '@/app/actions/agentes-autonomos';
import { verifySession } from '@/lib/auth/session-token';
import { puede, PERMISOS } from '@/lib/auth/perfiles';
import { guardarConfiguracionAgentes, ejecutarVigilantePublicidad } from '@/lib/agentes/motor-agentes';
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
jest.mock('@/lib/agentes/motor-agentes', () => ({
  getConfiguracionAgentes: jest.fn(async () => [{ id: 'vigilante_fiestas', activo: true }]),
  guardarConfiguracionAgentes: jest.fn(async () => {}),
  ejecutarVigilantePublicidad: jest.fn(async () => ({ agenteId: 'vigilante_publicidad', estado: 'sin_novedades' })),
}));
describe('acciones reales de agentes', () => {
  beforeEach(() => jest.clearAllMocks());
  test('personal sin administracion no apaga un agente', async () => {
    const user = { userId: 'personal-a86', role: 'user', perfil: 'personal' };
    (verifySession as jest.Mock).mockResolvedValue({ success: true, user });
    expect(puede(user, PERMISOS.ADMINISTRACION)).toBe(false);
    let result;
    try { result = await toggleAgente('vigilante_fiestas', false); } catch { result = { success: false }; }
    expect(guardarConfiguracionAgentes).not.toHaveBeenCalled();
    expect(result?.success).toBe(false);
  });
  test('el boton individual del agente de publicidad ejecuta su motor', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ success: true, user: { role: 'admin', perfil: 'administrador' } });
    const result = await ejecutarAgenteManual('vigilante_publicidad');
    expect(result.success).toBe(true);
    expect(ejecutarVigilantePublicidad).toHaveBeenCalledTimes(1);
  });
});
