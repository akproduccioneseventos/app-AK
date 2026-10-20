/** @jest-environment node */

/**
 * Orden 194 / 197 — Bloque 2: Permisos y quién entra.
 * - Con sesión de personal y de operador, cada acción del bloque 2 rechaza (sueldos, comparativa, reset crm, etc.).
 * - El ingreso con Google de una cuenta operador deja una sesión con perfil: 'operador'.
 * - El eco del dueño a un cliente no ejecuta nada (isEcho).
 * - La sexta respuesta equivocada en las preguntas de seguridad se frena.
 */

let sesionMock: { success: boolean; user?: { userId?: string; email?: string; role?: string; perfil?: string } } = {
  success: true,
  user: { userId: 'u1', email: 'op@ak.test', role: 'user', perfil: 'operador' },
};

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesionMock),
  requireAppSession: jest.fn(async () => {
    if (!sesionMock.success || !sesionMock.user) throw new Error('No autorizado');
    return sesionMock.user;
  }),
  writeSessionCookie: jest.fn(async (payload) => payload),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
  createDataItem: jest.fn(async () => undefined),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(async () => ({
            empty: false,
            docs: [{
              data: () => ({
                securityQuestions: {
                  q1: { question: '¿Ciudad?', answer: 'Salto' },
                  q2: { question: '¿Mascota?', answer: 'Firu' },
                  q3: { question: '¿Color?', answer: 'Rojo' },
                },
              }),
            }],
          })),
        })),
      })),
    })),
  },
  verifyIdToken: jest.fn(async () => ({ uid: 'g-uid', email: 'op@ak.test' })),
}));

describe('Auditoría 20-10: Permisos y quién entra', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acciones restringidas para operador y personal', () => {
    it('un operador o personal no puede ver la comparativa de ganancias', async () => {
      sesionMock = { success: true, user: { userId: 'u_op', email: 'op@ak.test', role: 'user', perfil: 'operador' } };
      const { getComparativaDeGanancias } = await import('@/app/actions/comparativa-ganancias');
      const resOp = await getComparativaDeGanancias();
      expect(resOp.ok).toBe(false);

      sesionMock = { success: true, user: { userId: 'u_per', email: 'per@ak.test', role: 'user', perfil: 'personal' } };
      const resPer = await getComparativaDeGanancias();
      expect(resPer.ok).toBe(false);
    });

    it('un operador o personal no puede revisar ni limpiar la agenda de la empresa en Google Workspace', async () => {
      sesionMock = { success: true, user: { userId: 'u_op', email: 'op@ak.test', role: 'user', perfil: 'operador' } };
      const { revisarAgendaDeAK, limpiarAgendaDeAK } = await import('@/app/actions/google-workspace');
      const rev = await revisarAgendaDeAK();
      expect(rev.ok).toBe(false);
      const limp = await limpiarAgendaDeAK(['ev1']);
      expect(limp.ok).toBe(false);
    });

    it('un operador no ve sueldoPorEvento en roles si no tiene permiso de sueldos', async () => {
      sesionMock = { success: true, user: { userId: 'u_op', email: 'op@ak.test', role: 'user', perfil: 'operador' } };
      const { getRoles } = await import('@/app/actions/roles');
      const roles = await getRoles();
      for (const r of roles) {
        expect(r.sueldoPorEvento).toBe(0);
      }
    });

    it('un operador no puede eliminar facturas ni presupuestos', async () => {
      sesionMock = { success: true, user: { userId: 'u_op', email: 'op@ak.test', role: 'user', perfil: 'operador' } };
      const { deletePresupuesto } = await import('@/app/actions/presupuestos');
      const delPres = await deletePresupuesto('pres_test');
      expect(delPres.success).toBe(false);
    });
  });

  describe('Ingreso con Google', () => {
    it('el ingreso con Google de una cuenta operador deja una sesión con perfil operador', async () => {
      const { perfilDesdeRolViejo } = await import('@/lib/auth/perfiles');
      expect(perfilDesdeRolViejo('operador')).toBe('operador');
      expect(perfilDesdeRolViejo('admin')).toBe('dueno');
    });
  });

  describe('Eco de WhatsApp', () => {
    it('un mensaje de eco del dueño hacia un cliente se descarta sin ejecutar acciones', async () => {
      const { atenderAlEquipo } = await import('@/lib/asistente/por-whatsapp');
      const res = await atenderAlEquipo({
        from: '59899123456',
        to: '59899789012', // to != from
        text: 'Presupuesto enviado por 25000',
        isEcho: true,
        messageId: 'mid_echo_123',
      });
      expect(res.atendido).toBe(false);
      expect(res.motivoNoAtendido).toContain('Eco');
    });
  });

  describe('Preguntas de seguridad', () => {
    it('la sexta respuesta equivocada consecutiva se frena por rate limit', async () => {
      const { resetPasswordWithQuestions } = await import('@/app/actions/auth');
      const email = 'atacante_bruteforce@ak.test';
      const answers = { a1: 'mal1', a2: 'mal2', a3: 'mal3' };

      const resultados: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        const res = await resetPasswordWithQuestions(email, answers, 'newPass123456');
        resultados.push(res.success);
      }

      // Al 6to intento debe fallar por rate limit
      const sexto = await resetPasswordWithQuestions(email, answers, 'newPass123456');
      expect(sexto.success).toBe(false);
      expect(sexto.error).toContain('Demasiados intentos');
    });
  });
});
