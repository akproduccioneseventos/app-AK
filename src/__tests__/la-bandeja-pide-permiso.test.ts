/** @jest-environment node */

let permisoSimulado = { ok: false, error: 'Acceso denegado' };

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => permisoSimulado),
}));

const mockLeerBandejaUnica = jest.fn(async () => [
  { id: '1', texto: 'Hola', remitente: 'Cliente', canal: 'instagram', fecha: '2026-10-22' },
]);
jest.mock('@/lib/mensajes/bandeja-unica', () => ({
  leerBandejaUnica: () => mockLeerBandejaUnica(),
}));

const mockSetAjustes = jest.fn(async () => ({ success: true }));
const mockGetAjustes = jest.fn(async () => ({ comentarios: true, mensajesDirectos: false }));
jest.mock('@/lib/social-media/comments-backfill', () => ({
  setAjustesRespuestasComentarios: (...args: any[]) => mockSetAjustes(...args),
  getAjustesRespuestasComentarios: () => mockGetAjustes(),
}));

import {
  leerBandejaUnicaAction,
  getAjustesRespuestasAction,
  setAjustesRespuestasAction,
} from '@/app/actions/presencia-digital';

describe('La bandeja pide permiso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('con requirePermiso en false, la bandeja da [] y setAjustes no llama al guardado', async () => {
    permisoSimulado = { ok: false, error: 'Sin permiso de CRM' };

    const bandeja = await leerBandejaUnicaAction();
    expect(bandeja).toEqual([]);
    expect(mockLeerBandejaUnica).not.toHaveBeenCalled();

    const resAjustes = await setAjustesRespuestasAction({ comentarios: true });
    expect(resAjustes.success).toBe(false);
    expect(resAjustes.error).toBe('Sin permiso de CRM');
    expect(mockSetAjustes).not.toHaveBeenCalled();
  });

  test('con requirePermiso en true, las dos llamadas llegan a destino', async () => {
    permisoSimulado = { ok: true, error: undefined as any };

    const bandeja = await leerBandejaUnicaAction();
    expect(bandeja).toHaveLength(1);
    expect(mockLeerBandejaUnica).toHaveBeenCalledTimes(1);

    const resAjustes = await setAjustesRespuestasAction({ comentarios: true });
    expect(resAjustes.success).toBe(true);
    expect(mockSetAjustes).toHaveBeenCalledWith({ comentarios: true });
  });
});
