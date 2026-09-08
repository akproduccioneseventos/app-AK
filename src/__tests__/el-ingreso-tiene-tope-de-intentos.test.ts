/**
 * MATAFUEGO — Probar contraseñas no puede ser gratis.
 *
 * La pantalla de ingreso no tenía ningún tope: alguien podía dejar una máquina
 * probando claves toda la noche contra el correo del dueño —que está publicado en la
 * web— hasta acertar. No falla nada, no se ve nada, y un día se entra.
 *
 * Diez por minuto: una persona que se equivoca dos o tres veces entra igual; una
 * máquina no llega a ningún lado.
 */
import { loginUser } from '@/app/actions/auth';

const llamadas: Array<Record<string, unknown>> = [];
let topeAlcanzado = false;

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async (input: Record<string, unknown>) => {
    llamadas.push(input);
    if (topeAlcanzado) throw new Error('tope');
  }),
}));

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

describe('El ingreso tiene tope de intentos', () => {
  beforeEach(() => {
    llamadas.length = 0;
    topeAlcanzado = false;
  });

  it('cada intento pasa por el tope, contado por correo', async () => {
    await loginUser('alguien@ejemplo.com', 'lo-que-sea');

    expect(llamadas).toHaveLength(1);
    expect(llamadas[0].identity).toBe('alguien@ejemplo.com');
    expect(Number(llamadas[0].limit)).toBeLessThanOrEqual(10);
  });

  it('pasado el tope NO se sigue probando: se corta antes de mirar la contraseña', async () => {
    topeAlcanzado = true;

    const r = await loginUser('alguien@ejemplo.com', 'lo-que-sea');

    expect(r.success).toBe(false);
    expect(r.error?.toLowerCase()).toContain('intentos');
  });
});
