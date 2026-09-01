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
}));
jest.mock('@/app/actions/fiesta/costos.actions', () => ({ updateGestionCostos: jest.fn() }));
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
