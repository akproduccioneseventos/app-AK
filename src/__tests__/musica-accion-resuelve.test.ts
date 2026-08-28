/**
 * La acción que abre los enlaces de música, comprobada de verdad.
 *
 * Lo que importa acá son tres cosas, y las tres pasaron o casi pasaron en este
 * proyecto:
 *
 * 1. **Que pida sesión del equipo.** Sale a buscar afuera con la llave de
 *    Spotify de la empresa; sin candado, cualquiera desde internet le haría
 *    gastar consultas. El control de puertas abiertas la agarró sin candado
 *    apenas se escribió.
 * 2. **Que no invente.** Lo que no se pudo abrir tiene que volver en la lista de
 *    "no se pudo", con motivo, y no como una canción más.
 * 3. **Que si el servicio falla, la pantalla no se caiga** y el texto pegado no
 *    se pierda.
 */

const requireAppSession = jest.fn();
const resolverCancionesDeLaBandeja = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: (...args: unknown[]) => requireAppSession(...args),
}));

jest.mock('@/lib/musica/resolver-enlaces', () => ({
  resolverCancionesDeLaBandeja: (...args: unknown[]) => resolverCancionesDeLaBandeja(...args),
}));

import { resolverBandejaDeMusica } from '@/app/actions/musica';

describe('la acción que abre los enlaces de música', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireAppSession.mockResolvedValue(undefined);
    resolverCancionesDeLaBandeja.mockResolvedValue({ canciones: [], noSePudo: [] });
  });

  it('no deja pasar a nadie sin sesión del equipo', async () => {
    requireAppSession.mockRejectedValue(new Error('Sesion no autorizada.'));

    const resultado = await resolverBandejaDeMusica('https://open.spotify.com/playlist/abc123');

    expect(resultado.success).toBe(false);
    // Y no llegó a salir a buscar afuera: el candado corta antes.
    expect(resolverCancionesDeLaBandeja).not.toHaveBeenCalled();
  });

  it('le pasa al resolvedor lo que reconoció del texto pegado', async () => {
    await resolverBandejaDeMusica(
      'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M\nDespacito - Luis Fonsi',
    );

    expect(requireAppSession).toHaveBeenCalled();
    expect(resolverCancionesDeLaBandeja).toHaveBeenCalledTimes(1);

    const entradas = resolverCancionesDeLaBandeja.mock.calls[0][0] as Array<{ fuente: string }>;
    expect(entradas.length).toBeGreaterThanOrEqual(2);
    expect(entradas.map((e) => e.fuente)).toContain('spotify');
  });

  it('con texto vacío no sale a buscar nada', async () => {
    const resultado = await resolverBandejaDeMusica('   ');

    expect(resolverCancionesDeLaBandeja).not.toHaveBeenCalled();
    expect(resultado).toEqual({ success: true, resultado: { canciones: [], noSePudo: [] } });
  });

  it('devuelve lo que no se pudo abrir, con el motivo, sin inventar canciones', async () => {
    resolverCancionesDeLaBandeja.mockResolvedValue({
      canciones: [],
      noSePudo: [
        {
          entrada: 'https://open.spotify.com/playlist/privada',
          motivo: 'La lista esta en privado y no la podemos ver.',
        },
      ],
    });

    const resultado = await resolverBandejaDeMusica('https://open.spotify.com/playlist/privada');

    expect(resultado.success).toBe(true);
    if (!resultado.success) return;
    // Lo que no se pudo abrir NO aparece como una cancion mas.
    expect(resultado.resultado.canciones).toHaveLength(0);
    expect(resultado.resultado.noSePudo[0].motivo).toContain('privado');
  });

  it('si el servicio se cae, avisa en criollo y no pierde lo pegado', async () => {
    resolverCancionesDeLaBandeja.mockRejectedValue(new Error('ECONNRESET'));

    const resultado = await resolverBandejaDeMusica('https://youtu.be/abc123');

    expect(resultado.success).toBe(false);
    if (resultado.success) return;
    expect(resultado.error).toContain('no se perdió');
    // Nada de texto tecnico en pantalla.
    expect(resultado.error).not.toContain('ECONNRESET');
  });
});
