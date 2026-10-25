/** @jest-environment node */
/**
 * UNA REUNION QUE YA NO EXISTE NO PUEDE DECIR QUE SE GUARDO.
 *
 * **Lo encontro Codex el 19 de septiembre de 2026.** Al editar una reunion se recorria la lista
 * cambiando la que coincidiera. Si otra persona la habia borrado mientras esta estaba abierta,
 * **no coincidia ninguna, no se cambiaba nada, y la pantalla decia que se guardo**.
 *
 * Y habia algo peor: se disparaba la sincronizacion con el calendario, asi que al cliente le
 * podia llegar el aviso de **una reunion que ya no existe**.
 */

let fiestaGuardada: any = null;
const actualizarFiesta = jest.fn(async (_id: string, fn: (f: any) => any) => {
  try {
    const nueva = await fn(JSON.parse(JSON.stringify(fiestaGuardada)));
    fiestaGuardada = nueva;
    return { success: true, updatedFiesta: nueva };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
});
const syncReunionToGoogleWorkspace = jest.fn(async () => ({ success: true }));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { role: 'admin' } })),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: (...a: unknown[]) => actualizarFiesta(...(a as [string, (f: any) => any])),
}));

jest.mock('@/app/actions/google-workspace-extended', () => ({
  syncReunionToGoogleWorkspace: (...a: unknown[]) => syncReunionToGoogleWorkspace(...(a as [])),
}));

const REUNION = { id: 'r1', fiestaId: 'f1', titulo: 'Reunion de cierre', fecha: '2026-10-01' } as any;

describe('Una reunion borrada no dice que se guardo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('si otro la borro mientras la editaban, avisa y NO le manda nada al calendario', async () => {
    // La fiesta ya no tiene esa reunion: la borraron hace un minuto desde otra pantalla.
    fiestaGuardada = { id: 'f1', reuniones: [] };
    const { updateReunion } = await import('@/app/actions/fiesta/reuniones.actions');

    const resultado = await updateReunion({ ...REUNION, titulo: 'Titulo editado' });

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/ya no existe|borro/i);
    expect(syncReunionToGoogleWorkspace).not.toHaveBeenCalled();
  });

  it('si la reunion esta, se guarda y se sincroniza como siempre', async () => {
    fiestaGuardada = { id: 'f1', reuniones: [REUNION] };
    const { updateReunion } = await import('@/app/actions/fiesta/reuniones.actions');

    const resultado = await updateReunion({ ...REUNION, titulo: 'Titulo editado' });

    expect(resultado.success).toBe(true);
    expect(fiestaGuardada.reuniones[0].titulo).toBe('Titulo editado');
    expect(syncReunionToGoogleWorkspace).toHaveBeenCalledTimes(1);
  });
});
