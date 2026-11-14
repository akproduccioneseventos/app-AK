/** @jest-environment node */
jest.mock('server-only', () => ({}));
const redirect = jest.fn((url: string) => { throw new Error(`REDIRECT:${url}`); });
jest.mock('next/navigation', () => ({ redirect: (u: string) => redirect(u) }));
const verifySession = jest.fn();
jest.mock('@/lib/auth/session-token', () => ({ verifySession: () => verifySession() }));
const verifyPortalSession = jest.fn();
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: (id: string) => verifyPortalSession(id) }));

import { elPortalPideSesion } from '@/lib/portal/el-portal-pide-sesion';
import fs from 'fs';
import path from 'path';

describe('el portal del cliente pide sesión (pregunta 139)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sin ninguna sesión manda a la entrada del portal', async () => {
    verifySession.mockResolvedValue({ success: false });
    verifyPortalSession.mockResolvedValue(false);
    await expect(elPortalPideSesion('f1')).rejects.toThrow('REDIRECT:/portal?fiestaId=f1');
  });

  it('con la sesión del portal de esa fiesta deja pasar', async () => {
    verifySession.mockResolvedValue({ success: false });
    verifyPortalSession.mockResolvedValue(true);
    await expect(elPortalPideSesion('f1')).resolves.toBeUndefined();
    expect(verifyPortalSession).toHaveBeenCalledWith('f1');
  });

  it('con la sesión del equipo deja pasar', async () => {
    verifySession.mockResolvedValue({ success: true, user: { perfil: 'dueno' } });
    await expect(elPortalPideSesion('f1')).resolves.toBeUndefined();
  });

  it('sin fiesta en la dirección manda a la entrada', async () => {
    await expect(elPortalPideSesion(null)).rejects.toThrow('REDIRECT:/portal');
  });

  it('decoración, ideas, contrato y mesas pasan por el control', () => {
    const raiz = path.join(process.cwd(), 'src/app/portal');
    expect(fs.readFileSync(path.join(raiz, '[fiestaId]/layout.tsx'), 'utf8')).toContain('elPortalPideSesion(fiestaId)');
    expect(fs.readFileSync(path.join(raiz, 'mesas/page.tsx'), 'utf8')).toContain('elPortalPideSesion(fiestaId)');
  });
});
