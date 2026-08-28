/**
 * LA PUERTA DE ENTRADA, PROBADA DE VERDAD
 *
 * El dueño se quedó afuera de su propia app: no entraba ni con la contraseña ni
 * con el correo. Se arregló, pero **no había una sola prueba que nombrara la
 * función de entrar**. Por eso se pudo romper sin que nadie se enterara hasta que
 * lo intentó él.
 *
 * Estas pruebas no miran que la pantalla abra: comprueban el RESULTADO de
 * intentar entrar en las cuatro situaciones que importan, incluida la que lo
 * dejó afuera.
 */

const docFalso = { get: jest.fn(), set: jest.fn() };
const baseFalsa = {
  collection: jest.fn(() => ({ doc: jest.fn(() => docFalso) })),
};

let hayBase = true;

jest.mock('@/lib/firebase/server', () => ({
  get dbAdmin() {
    return hayBase ? baseFalsa : null;
  },
  verifyIdToken: jest.fn(),
}));

jest.mock('@/lib/auth/session-token', () => ({
  writeSessionCookie: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/google-workspace', () => ({
  ensureFreshGoogleAccount: jest.fn(),
  sendGoogleGmailMessage: jest.fn(),
}));

/** Arma lo que devuelve la base cuando se le pide el documento de acceso. */
function laBaseDevuelve(datos: Record<string, unknown> | null) {
  docFalso.get.mockResolvedValue({
    exists: datos !== null,
    data: () => datos,
  });
}

describe('Entrar a la app', () => {
  const entorno = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    hayBase = true;
    process.env = { ...entorno };
    laBaseDevuelve(null);
  });

  afterAll(() => {
    process.env = entorno;
  });

  it('la clave de emergencia abre aunque la base esté caída', async () => {
    process.env.APP_PASSWORD = 'la-de-emergencia';
    hayBase = false;

    const { loginWithPassword } = await import('@/app/actions/simple-auth');
    const resultado = await loginWithPassword('la-de-emergencia');

    expect(resultado.success).toBe(true);
  });

  it('sin base NO dice "contraseña incorrecta": dice que la base no responde', async () => {
    // Esto es exactamente lo que lo dejó afuera. La app le decía que su clave
    // estaba mal, él volvía a probar, y a los cinco intentos quedaba bloqueado
    // quince minutos por un problema que nunca fue suyo.
    delete process.env.APP_PASSWORD;
    hayBase = false;

    const { loginWithPassword } = await import('@/app/actions/simple-auth');
    const resultado = await loginWithPassword('la que sea');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/base de datos no esta respondiendo/i);
    expect(resultado.error).not.toMatch(/incorrecta/i);
  });

  it('si la base no contesta nunca, igual responde y no se cuelga', async () => {
    // Antes el botón giraba veinticinco segundos y el navegador cortaba solo.
    delete process.env.APP_PASSWORD;
    docFalso.get.mockReturnValue(new Promise(() => {})); // no contesta jamás

    jest.useFakeTimers();
    const { loginWithPassword } = await import('@/app/actions/simple-auth');
    const enCurso = loginWithPassword('la que sea');
    await jest.advanceTimersByTimeAsync(9000);
    const resultado = await enCurso;
    jest.useRealTimers();

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/base/i);
    expect(resultado.error).not.toMatch(/incorrecta/i);
  });

  it('con la base sana, la contraseña guardada abre y una equivocada no', async () => {
    delete process.env.APP_PASSWORD;
    laBaseDevuelve({ password: 'la-verdadera' });

    const { loginWithPassword } = await import('@/app/actions/simple-auth');

    expect((await loginWithPassword('la-verdadera')).success).toBe(true);

    laBaseDevuelve({ password: 'la-verdadera' });
    const conLaEquivocada = await loginWithPassword('cualquier-otra');
    expect(conLaEquivocada.success).toBe(false);
  });
});
