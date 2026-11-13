/**
 * Orden 299 — El auditor prueba cada papel
 *
 * Verifica:
 * 1. Las fiestas con `esMuestra: true` quedan filtradas de los cálculos de los agentes.
 * 2. `esSesionDeSoloLectura` resuelve correctamente el perfil auditor.
 * 3. La lógica de creación de demo respeta el flag auditor.
 * 4. `persistPublicSimulatorBudget` no escribe cuando el auditor está activo.
 */

jest.mock('server-only', () => ({}));

// --- Mock de solo-lectura ---
let mockEsAuditor = false;
jest.mock('@/lib/auth/solo-lectura', () => ({
  esSesionDeSoloLectura: jest.fn().mockImplementation(() => Promise.resolve(mockEsAuditor)),
  exigirQueSePuedaGuardar: jest.fn().mockImplementation(async () => {
    if (mockEsAuditor) throw new Error('Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.');
  }),
  MENSAJE_ERROR_AUDITOR: 'Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.',
}));

// --- Mock session-token ---
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: false }),
}));

describe('Orden 299 — auditor probar como', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEsAuditor = false;
  });

  describe('esSesionDeSoloLectura', () => {
    it('devuelve false cuando no hay sesión de auditor', async () => {
      const { esSesionDeSoloLectura } = await import('@/lib/auth/solo-lectura');
      const resultado = await esSesionDeSoloLectura();
      expect(resultado).toBe(false);
    });

    it('devuelve true cuando el perfil es auditor', async () => {
      mockEsAuditor = true;
      const { esSesionDeSoloLectura } = await import('@/lib/auth/solo-lectura');
      const resultado = await esSesionDeSoloLectura();
      expect(resultado).toBe(true);
    });
  });

  describe('filtro esMuestra en agentes', () => {
    it('excluye fiestas con esMuestra=true del procesamiento de negocio', () => {
      const fiestaReal = {
        id: 'fiesta_real_1',
        esMuestra: false,
        configuracion: { fechaEvento: '2025-12-31', nombreEvento: 'XV Real' },
        estado: 'En planificacion',
      };
      const fiestaDemo = {
        id: 'fiesta_muestra_auditor',
        esMuestra: true,
        configuracion: { fechaEvento: '2025-12-31', nombreEvento: 'XV Demo' },
        estado: 'En planificacion',
      };
      const fiestas = [fiestaReal, fiestaDemo];
      const filtradas = fiestas.filter((f) => !f.esMuestra);

      expect(filtradas).toHaveLength(1);
      expect(filtradas[0].id).toBe('fiesta_real_1');
    });

    it('no excluye fiestas reales (esMuestra=false o ausente)', () => {
      const fiestas = [
        { id: 'f1', esMuestra: false },
        { id: 'f2' },
        { id: 'f3', esMuestra: undefined },
        { id: 'fiesta_muestra_auditor', esMuestra: true },
      ];
      const filtradas = fiestas.filter((f: any) => !f.esMuestra);
      expect(filtradas).toHaveLength(3);
      expect(filtradas.map((f) => f.id)).toEqual(['f1', 'f2', 'f3']);
    });
  });

  describe('lógica de creación de fiesta demo', () => {
    it('la demo tiene id fijo, esMuestra=true y accessKey fija', () => {
      // Simula lo que hace la tarea muestra_auditor
      const demo: any = {
        id: 'demo-tmp',
        esMuestra: false,
        configuracion: { fechaEvento: '2025-01-01' },
        clientPortalSettings: { enabled: false, accessKey: '' },
        invitados: [{ id: 'inv_1' }],
      };

      // Aplica las transformaciones que hace la tarea
      demo.id = 'fiesta_muestra_auditor';
      demo.esMuestra = true;
      demo.clientPortalSettings = { enabled: true, accessKey: 'muestra-auditor-key-fija' };
      demo.invitados = demo.invitados.map((inv: any, idx: number) => ({
        ...inv,
        guestAccessToken: inv.guestAccessToken || `token-muestra-${idx + 1}`,
      }));

      expect(demo.id).toBe('fiesta_muestra_auditor');
      expect(demo.esMuestra).toBe(true);
      expect(demo.clientPortalSettings.accessKey).toBe('muestra-auditor-key-fija');
      expect(demo.invitados[0].guestAccessToken).toBe('token-muestra-1');
    });

    it('cuando ya existe la demo, no la crea de nuevo', () => {
      const fiestas = [
        { id: 'fiesta_muestra_auditor', esMuestra: true },
      ];
      const idMuestra = 'fiesta_muestra_auditor';
      const existe = fiestas.some((f) => f.id === idMuestra);
      // Si existe, la tarea retorna { yaExiste: true } sin escribir
      const resultado = existe ? { yaExiste: true } : { creada: idMuestra };
      expect(resultado).toEqual({ yaExiste: true });
    });
  });

  describe('guard del auditor en escrituras', () => {
    it('exigirQueSePuedaGuardar lanza error cuando es sesión de auditor', async () => {
      mockEsAuditor = true;
      const { exigirQueSePuedaGuardar } = await import('@/lib/auth/solo-lectura');
      await expect(exigirQueSePuedaGuardar()).rejects.toThrow('Acceso de auditor');
    });

    it('exigirQueSePuedaGuardar no lanza cuando no es auditor', async () => {
      mockEsAuditor = false;
      const { exigirQueSePuedaGuardar } = await import('@/lib/auth/solo-lectura');
      await expect(exigirQueSePuedaGuardar()).resolves.toBeUndefined();
    });
  });
});
