/**
 * La decoracion del cliente: que no gaste de mas y que su opinion se guarde.
 *
 * Estas dos acciones son nuevas y **tocan plata**: cada imagen del salon
 * decorado que genera la inteligencia artificial **se paga por unidad**. Por eso
 * la orden 24 pidio un tope de tres por fiesta.
 *
 * Lo que se comprueba aca es el RESULTADO, no que el codigo exista:
 *
 * 1. Con tres imagenes ya generadas, **no se llama al servicio que se paga**.
 *    Que devuelva un aviso no alcanza: si igual llama, el gasto ya se hizo.
 * 2. La opinion del cliente sobre su decoracion **queda guardada**, con la fecha.
 *    Un boton que el cliente toca y no guarda nada es peor que no tenerlo.
 */

const generateGeminiImage = jest.fn();
const getFiestaById = jest.fn();
const saveFiesta = jest.fn();

jest.mock('@/lib/ai/gemini-image', () => ({
  generateGeminiImage: (...args: unknown[]) => generateGeminiImage(...args),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: unknown[]) => getFiestaById(...args),
  saveFiesta: (...args: unknown[]) => saveFiesta(...args),
  updateFiestaPartial: jest.fn(async (id: string, partial: any) => {
    saveFiesta({ id, ...partial });
    return { success: true };
  }),
}));
// Desde el 9 de septiembre de 2026 guardar la decoracion **siempre** sincroniza los
// gastos -tambien cuando no queda ningun elemento- y mira el resultado. Sin este
// mock devolviendo que si, el guardado contesta que no, que es justo lo que se pidio.
jest.mock('@/app/actions/fiesta/costos.actions', () => ({
  updateGestionCostos: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));

import {
  enviarOpinionDecoracion,
  generarVisualizacionSalonAi,
} from '@/app/actions/fiesta/decoracion.actions';

function fiestaCon(decoracion: Record<string, unknown>) {
  return {
    id: 'fiesta-de-prueba',
    configuracion: { nombreEvento: 'Los 15 de Valentina' },
    decoracion,
  };
}

describe('la decoracion no gasta de mas', () => {
  beforeEach(() => {
    generateGeminiImage.mockReset();
    getFiestaById.mockReset();
    saveFiesta.mockReset();
    saveFiesta.mockResolvedValue({ success: true });
  });

  it('con tres imagenes ya generadas NO llama al servicio que se paga', async () => {
    getFiestaById.mockResolvedValue(
      fiestaCon({ fotosGeneradasAi: ['una.jpg', 'dos.jpg', 'tres.jpg'] }),
    );

    const resultado = await generarVisualizacionSalonAi('fiesta-de-prueba');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/tope/i);
    // Lo que de verdad importa: no se gasto una imagen.
    expect(generateGeminiImage).not.toHaveBeenCalled();
  });

  it('con menos de tres, genera una sola y la guarda', async () => {
    getFiestaById.mockResolvedValue(fiestaCon({ fotosGeneradasAi: ['una.jpg'] }));
    generateGeminiImage.mockResolvedValue('nueva.jpg');

    const resultado = await generarVisualizacionSalonAi('fiesta-de-prueba');

    expect(resultado.success).toBe(true);
    expect(generateGeminiImage).toHaveBeenCalledTimes(1);
    expect(saveFiesta).toHaveBeenCalled();
  });

  /**
   * EL DEFECTO QUE ENCONTRO CODEX EL 10 DE SEPTIEMBRE DE 2026.
   *
   * Con dos imagenes ya generadas queda lugar para UNA. Si el boton se toca dos
   * veces seguidas, los dos pedidos contaban las mismas dos, los dos pasaban el
   * tope y **se pagaban dos generaciones**. La prueba falla si se saca el turno.
   */
  it('dos pedidos a la vez con un solo lugar libre pagan UNA sola imagen', async () => {
    const fotos = ['una.jpg', 'dos.jpg'];
    // La lista crece a medida que se guarda, igual que en la base.
    getFiestaById.mockImplementation(async () => fiestaCon({ fotosGeneradasAi: [...fotos] }));
    saveFiesta.mockImplementation(async (guardado: any) => {
      const nuevas = guardado?.decoracion?.fotosGeneradasAi;
      if (Array.isArray(nuevas)) fotos.splice(0, fotos.length, ...nuevas);
      return { success: true };
    });
    // El generador tarda: sin turno, el segundo pedido entra mientras el primero
    // todavia no guardo.
    generateGeminiImage.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('nueva.jpg'), 20)),
    );

    const [a, b] = await Promise.all([
      generarVisualizacionSalonAi('fiesta-de-prueba'),
      generarVisualizacionSalonAi('fiesta-de-prueba'),
    ]);

    expect(generateGeminiImage).toHaveBeenCalledTimes(1);
    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
    const rechazado = a.success ? b : a;
    expect(rechazado.error).toMatch(/tope/i);
    expect(fotos).toHaveLength(3);
  });

  /**
   * La paleta que edita el equipo se guarda en `paletaColores`. La imagen leia
   * solo `colorPalette` -la vieja- y salia con colores que ya nadie eligio.
   */
  it('la imagen usa la paleta que edito el equipo, no la vieja', async () => {
    getFiestaById.mockResolvedValue(
      fiestaCon({
        fotosGeneradasAi: [],
        paletaColores: { primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff' },
        colorPalette: { primary: '#111111', secondary: '#222222', accent: '#333333' },
      }),
    );
    generateGeminiImage.mockResolvedValue('nueva.jpg');

    await generarVisualizacionSalonAi('fiesta-de-prueba');

    const prompt = generateGeminiImage.mock.calls[0]?.[0]?.prompt as string;
    expect(prompt).toContain('#ff0000');
    expect(prompt).not.toContain('#111111');
  });

  it('la opinion del cliente sobre su decoracion queda guardada, con la fecha', async () => {
    getFiestaById.mockResolvedValue(fiestaCon({ estiloDecoracion: 'elegante' }));

    const resultado = await enviarOpinionDecoracion('fiesta-de-prueba', false, 'Prefiero mas flores');

    expect(resultado.success).toBe(true);
    const guardado = saveFiesta.mock.calls[0]?.[0];
    const opinion = guardado?.decoracion?.opinionCliente;
    expect(opinion).toBeDefined();
    expect(opinion.leGusta).toBe(false);
    expect(opinion.comentario).toBe('Prefiero mas flores');
    expect(typeof opinion.fecha).toBe('string');
  });
});
