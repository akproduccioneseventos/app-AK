/**
 * @jest-environment node
 */

const generateGeminiImage = jest.fn();
const requireAppSession = jest.fn();
const verifyPortalSession = jest.fn();
const hayPresupuestoParaIA = jest.fn();
const registrarConsumoIA = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: (...args: unknown[]) => requireAppSession(...args),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: (...args: unknown[]) => verifyPortalSession(...args),
}));

jest.mock('@/lib/ai/gemini-image', () => ({
  generateGeminiImage: (...args: unknown[]) => generateGeminiImage(...args),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: (...args: unknown[]) => hayPresupuestoParaIA(...args),
  registrarConsumoIA: (...args: unknown[]) => registrarConsumoIA(...args),
}));

let baseDeFiestas: Record<string, any> = {};

function clonarProfundo<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => {
    if (!baseDeFiestas[id]) return null;
    return clonarProfundo(baseDeFiestas[id]);
  }),
  saveFiesta: jest.fn(async (fiesta: any) => {
    baseDeFiestas[fiesta.id] = clonarProfundo(fiesta);
    return { success: true };
  }),
  updateFiestaPartial: jest.fn(async (id: string, partial: any) => {
    if (!baseDeFiestas[id]) return { success: false, error: 'No encontrada' };
    baseDeFiestas[id] = {
      ...baseDeFiestas[id],
      ...clonarProfundo(partial),
      decoracion: {
        ...(baseDeFiestas[id].decoracion || {}),
        ...(clonarProfundo(partial.decoracion) || {}),
      },
    };
    return { success: true, updatedData: clonarProfundo(baseDeFiestas[id]) };
  }),
}));

jest.mock('@/lib/fiesta/costos-interno', () => ({
  mutarCostosInterno: async () => ({ success: true }),
}));

jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  usuarioDelEquipo: jest.fn(async () => null),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => ({})),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn(async () => []),
}));

import {
  generarVisualizacionSalonAi,
  generarFotoDelSalonDesdeElPortal,
  generarVisualizacionSalonReunion,
} from '@/app/actions/fiesta/decoracion.actions';

describe('Orden 250 - Así va a quedar tu fiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseDeFiestas = {};
    requireAppSession.mockResolvedValue(undefined);
    verifyPortalSession.mockResolvedValue(true);
    hayPresupuestoParaIA.mockResolvedValue(true);
    registrarConsumoIA.mockResolvedValue(undefined);
  });

  it('(a) con capturaDel3d, la primera imagen que recibe generateGeminiImage es la captura 3D', async () => {
    const captura3d = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    baseDeFiestas['f1'] = {
      id: 'f1',
      configuracion: { nombreEvento: 'Fiesta de 15' },
      decoracion: {
        fotosGeneradasAi: [],
        salonPlanBackgroundImageUrl: 'https://storage.googleapis.com/test-bucket/plano.png',
        paletaColores: { primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff' },
        estiloDecoracion: 'moderno',
        colorCubremantel: 'dorado',
        colorGlobos: 'plateado',
        itemsDecoracion: [{ id: '1', nombre: 'Centro floral', categoria: 'Mesa' }],
      },
    };
    generateGeminiImage.mockResolvedValue('resultado-ia.jpg');

    const res = await generarVisualizacionSalonAi('f1', undefined, captura3d);

    expect(res.success).toBe(true);
    expect(generateGeminiImage).toHaveBeenCalledTimes(1);
    const llamada = generateGeminiImage.mock.calls[0][0];
    expect(llamada.images).toBeDefined();
    expect(llamada.images.length).toBeGreaterThanOrEqual(1);
    expect(llamada.images[0].contentType).toBe('image/png');
    expect(llamada.images[0].base64).toBe(captura3d.replace('data:image/png;base64,', ''));
    expect(llamada.prompt).toContain('fotografía realista del mismo salón, desde el mismo ángulo y con la misma disposición de mesas');
    expect(llamada.prompt).toContain('#ff0000');
    expect(llamada.prompt).toContain('Nada de personas, texto, logos ni marcas');
  });

  it('(b) sin presupuesto de IA, devuelve error y NO llama a generateGeminiImage', async () => {
    baseDeFiestas['f1'] = {
      id: 'f1',
      decoracion: { fotosGeneradasAi: [] },
    };
    hayPresupuestoParaIA.mockResolvedValue(false);

    const res = await generarVisualizacionSalonAi('f1');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Se llegó al tope de IA del mes.');
    expect(generateGeminiImage).not.toHaveBeenCalled();
  });

  it('(c) con imagen generada registra 1 consumo; si falla la IA, 0 consumos y no guarda nada', async () => {
    baseDeFiestas['f1'] = {
      id: 'f1',
      decoracion: { fotosGeneradasAi: [] },
    };

    // 1. Éxito:
    generateGeminiImage.mockResolvedValue('foto-ia-ok.jpg');
    const resOk = await generarVisualizacionSalonAi('f1');
    expect(resOk.success).toBe(true);
    expect(registrarConsumoIA).toHaveBeenCalledTimes(1);
    expect(registrarConsumoIA).toHaveBeenCalledWith('foto-del-salon');
    expect(baseDeFiestas['f1'].decoracion.fotosGeneradasAi).toContain('foto-ia-ok.jpg');

    registrarConsumoIA.mockClear();

    // 2. Falla de la IA:
    generateGeminiImage.mockRejectedValue(new Error('Gemini timeout'));
    const resFalla = await generarVisualizacionSalonAi('f1');
    expect(resFalla.success).toBe(false);
    expect(resFalla.error).toBe('No se pudo armar la foto. Probá de nuevo en un rato.');
    expect(registrarConsumoIA).not.toHaveBeenCalled();
    expect(baseDeFiestas['f1'].decoracion.fotosGeneradasAi).toHaveLength(1);
  });

  it('(d) sesión de portal de otra fiesta se rechaza', async () => {
    verifyPortalSession.mockResolvedValue(false);

    const res = await generarFotoDelSalonDesdeElPortal('fiesta-ajena');

    expect(res.success).toBe(false);
    expect(res.error).toBe('Sesión de portal no autorizada.');
    expect(generateGeminiImage).not.toHaveBeenCalled();
  });

  it('(e) equipo y cliente comparten el tope de 3: la cuarta se rechaza', async () => {
    verifyPortalSession.mockResolvedValue(true);
    baseDeFiestas['f1'] = {
      id: 'f1',
      decoracion: { fotosGeneradasAi: ['foto1.jpg', 'foto2.jpg'] },
    };
    generateGeminiImage.mockResolvedValue('foto3.jpg');

    // El cliente genera la 3ra:
    const resCliente = await generarFotoDelSalonDesdeElPortal('f1');
    expect(resCliente.success).toBe(true);
    expect(baseDeFiestas['f1'].decoracion.fotosGeneradasAi).toHaveLength(3);

    // El equipo intenta generar la 4ta:
    const resEquipo = await generarVisualizacionSalonAi('f1');
    expect(resEquipo.success).toBe(false);
    expect(resEquipo.error).toMatch(/tope de 3/i);
    expect(baseDeFiestas['f1'].decoracion.fotosGeneradasAi).toHaveLength(3);
  });

  it('(f) concurrencia: dos toques a la vez generan una sola si queda 1 cupo', async () => {
    verifyPortalSession.mockResolvedValue(true);
    baseDeFiestas['f1'] = {
      id: 'f1',
      decoracion: { fotosGeneradasAi: ['foto1.jpg', 'foto2.jpg'] },
    };

    generateGeminiImage.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('foto3.jpg'), 30)),
    );

    const [res1, res2] = await Promise.all([
      generarVisualizacionSalonAi('f1'),
      generarFotoDelSalonDesdeElPortal('f1'),
    ]);

    expect([res1.success, res2.success].filter(Boolean)).toHaveLength(1);
    const fallido = res1.success ? res2 : res1;
    expect(fallido.error).toMatch(/tope de 3/i);
    expect(generateGeminiImage).toHaveBeenCalledTimes(1);
    expect(baseDeFiestas['f1'].decoracion.fotosGeneradasAi).toHaveLength(3);
  });

  it('(g) generarVisualizacionSalonReunion también descuenta del tope mensual', async () => {
    // Sin presupuesto:
    hayPresupuestoParaIA.mockResolvedValue(false);
    const resSinPresupuesto = await generarVisualizacionSalonReunion({ tipoEvento: '15 Años' });
    expect(resSinPresupuesto.success).toBe(false);
    expect(resSinPresupuesto.error).toBe('Se llegó al tope de IA del mes.');
    expect(generateGeminiImage).not.toHaveBeenCalled();

    // Con presupuesto: genera 2 imágenes y llama registrarConsumoIA por cada una
    hayPresupuestoParaIA.mockResolvedValue(true);
    generateGeminiImage.mockResolvedValue('reunion.jpg');
    const resConPresupuesto = await generarVisualizacionSalonReunion({ tipoEvento: '15 Años' });
    expect(resConPresupuesto.success).toBe(true);
    expect(registrarConsumoIA).toHaveBeenCalledTimes(2);
    expect(registrarConsumoIA).toHaveBeenCalledWith('foto-del-salon');
  });
});
