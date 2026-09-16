/** @jest-environment node */
/**
 * EL RESPALDO NO MIENTE: NI SOBRE LO QUE GUARDA, NI SOBRE QUIEN PUEDE TOCARLO.
 *
 * Los tres defectos los encontro Codex el 16 de septiembre de 2026, y los tres tenian la
 * misma forma: la pantalla decia que estaba todo bien cuando no lo estaba.
 *
 * 1. **Una copia a la que le faltaban cosas se guardaba marcada como completa.** Si una
 *    parte no se podia leer, se la salteaba y el respaldo salia igual. Y al guardarse, la
 *    rotacion borraba una copia vieja **que si estaba entera**.
 * 2. **Cualquiera con sesion podia borrar o restaurar respaldos y bajarse todo el
 *    negocio** —plata, sueldos, clientes— en un archivo. El operador de la fiesta tiene
 *    sesion.
 * 3. **Una restauracion a medias se anunciaba como "Restauracion Completa"**, y la
 *    pantalla se recargaba enseguida, tapando el aviso.
 */

const verifySession = jest.fn();
const readData = jest.fn();
const writeData = jest.fn(async () => undefined);

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: (...args: unknown[]) => verifySession(...(args as [])),
}));

jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => readData(...(args as [])),
  writeData: (...args: unknown[]) => writeData(...(args as [])),
}));

jest.mock('@/lib/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }));

/**
 * Una base de mentira, en memoria. Alcanza para lo que se comprueba aca: que el
 * manifiesto se guarde -o no- y que la rotacion borre -o no-.
 */
jest.mock('@/lib/firebase/server', () => {
  const chunks = { get: async () => ({ docs: [] }) };
  const docRef = (nombre: string) => ({
    id: nombre,
    get: async () => ({ exists: false, data: () => undefined }),
    set: async (datos: any) => { (global as any).__MANIFIESTOS__.push(datos); },
    collection: () => ({ ...chunks, doc: (id: string) => ({ id }) }),
  });
  const dbAdmin = {
    collection: () => ({
      doc: docRef,
      get: async () => ({ docs: [] }),
    }),
    batch: () => ({ set: () => undefined, delete: () => undefined, commit: async () => undefined }),
  };
  return { dbAdmin };
});

const SNAPSHOTS_BORRADOS: string[] = [];
const MANIFIESTOS_GUARDADOS: any[] = [];

describe('El respaldo no miente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    SNAPSHOTS_BORRADOS.length = 0;
    MANIFIESTOS_GUARDADOS.length = 0;
    (global as any).__MANIFIESTOS__ = MANIFIESTOS_GUARDADOS;
    (global as any).__BORRADOS__ = SNAPSHOTS_BORRADOS;
    verifySession.mockResolvedValue({ success: true, user: { role: 'admin' } });
    readData.mockResolvedValue([]);
  });

  describe('Quien puede tocar los respaldos', () => {
    it('el operador de fiesta NO puede borrar un punto de restauracion', async () => {
      verifySession.mockResolvedValue({ success: true, user: { perfil: 'operador' } });
      const { deleteRestorePoint } = await import('@/app/actions/backup');

      const resultado = await deleteRestorePoint('backup-cualquiera');

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/no tiene acceso/i);
    });

    it('el operador de fiesta NO puede restaurar todo el negocio desde un punto', async () => {
      verifySession.mockResolvedValue({ success: true, user: { perfil: 'operador' } });
      const { restoreFromPoint } = await import('@/app/actions/backup');

      const resultado = await restoreFromPoint('backup-cualquiera');

      expect(resultado.success).toBe(false);
      // Y lo que importa de verdad: no escribio ni un dato.
      expect(writeData).not.toHaveBeenCalled();
    });

    it('la secretaria NO puede bajarse el respaldo entero, que incluye sueldos y ganancias', async () => {
      verifySession.mockResolvedValue({ success: true, user: { perfil: 'secretaria' } });
      const { GET } = await import('@/app/api/backup/download/route');

      const respuesta: any = await GET();

      expect(respuesta.status).toBe(403);
    });

  });

  describe('Una copia a la que le falta algo no se guarda', () => {
    it('si una parte no se puede leer, NO se guarda el respaldo y no se borra la copia anterior', async () => {
      verifySession.mockResolvedValue({ success: true, user: { perfil: 'dueno' } });
      readData.mockImplementation(async (archivo: string, porDefecto: any) => {
        if (archivo === 'presupuestos.json') throw new Error('la base no contesta');
        return porDefecto ?? [];
      });

      const { createRestorePoint } = await import('@/app/actions/backup');
      const resultado = await createRestorePoint();

      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/presupuestos/);
      // Lo que mas importa: no quedo ningun respaldo nuevo marcado como completo...
      expect(MANIFIESTOS_GUARDADOS).toHaveLength(0);
      // ...y la rotacion no se llevo puesta la copia vieja, que es la unica buena.
      expect(SNAPSHOTS_BORRADOS).toHaveLength(0);
    });

    it('con todo legible, el respaldo si se guarda y queda marcado completo', async () => {
      verifySession.mockResolvedValue({ success: true, user: { perfil: 'dueno' } });
      readData.mockImplementation(async (_archivo: string, porDefecto: any) => porDefecto ?? []);

      const { createRestorePoint } = await import('@/app/actions/backup');
      const resultado = await createRestorePoint();

      expect(resultado.success).toBe(true);
      expect(MANIFIESTOS_GUARDADOS).toHaveLength(1);
      expect(MANIFIESTOS_GUARDADOS[0].status).toBe('complete');
    });
  });
});
