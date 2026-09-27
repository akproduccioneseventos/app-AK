/**
 * @jest-environment node
 *
 * MATAFUEGO — `/api/health` dice qué código está publicado (orden 92, Codex). Que la portada
 * conteste no dice qué versión atiende. La compilación graba el commit en `NEXT_PUBLIC_AK_VERSION`
 * (`scripts/build-next-with-memory.mjs`); esta prueba mira que la respuesta lo muestre, y que sin él
 * diga "desconocida" en vez de inventar.
 */
jest.mock('@/lib/firebase/firestore', () => ({ checkFirestoreConnection: async () => false }));

describe('La salud dice qué versión atiende', () => {
  const antes = process.env.NEXT_PUBLIC_AK_VERSION;
  afterEach(() => {
    if (antes === undefined) delete process.env.NEXT_PUBLIC_AK_VERSION;
    else process.env.NEXT_PUBLIC_AK_VERSION = antes;
    jest.resetModules();
  });

  it('muestra el commit grabado en la compilación', async () => {
    process.env.NEXT_PUBLIC_AK_VERSION = 'abc1234 · compilada 2026-09-27T00:00:00Z';
    const { GET } = require('@/app/api/health/route');
    const cuerpo = await (await GET()).json();
    expect(cuerpo.version).toBe('abc1234 · compilada 2026-09-27T00:00:00Z');
  });

  it('sin versión grabada dice "desconocida"', async () => {
    delete process.env.NEXT_PUBLIC_AK_VERSION;
    const { GET } = require('@/app/api/health/route');
    const cuerpo = await (await GET()).json();
    expect(cuerpo.version).toBe('desconocida');
  });

  it('la compilación graba el commit', () => {
    const script = require('node:fs').readFileSync('scripts/build-next-with-memory.mjs', 'utf8');
    expect(script).toMatch(/NEXT_PUBLIC_AK_VERSION: version/);
  });
});
