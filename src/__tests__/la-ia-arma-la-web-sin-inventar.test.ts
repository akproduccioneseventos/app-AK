import { armarWebConIA } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { requireFiestaWriteAccess, getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { defaultInvitacionDigitalData } from '@/lib/invitacion-digital-defaults';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

jest.mock('@/ai/genkit', () => ({
  generateWithGeminiFallback: jest.fn(),
  getGeminiModelForAgent: jest.fn(() => 'googleai/gemini-flash-latest'),
}));

jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  getFiestaById: jest.fn(),
}));

describe('Orden 234 — La IA arma la web sin inventar', () => {
  let mockFiesta: FiestaEnPlanificacion;

  beforeEach(() => {
    jest.clearAllMocks();
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);
    (requireFiestaWriteAccess as jest.Mock).mockResolvedValue(undefined);

    (generateWithGeminiFallback as jest.Mock).mockResolvedValue({
      text: JSON.stringify({
        plantilla: 'XvModerna',
        cabecera: {
          protagonista1: 'Sofía',
          protagonista2: '',
          subtitulo: 'Mis 15 Años',
          paletaColores: {
            primary: '#d4a574',
            secondary: '#2d3748',
            accent: '#f7fafc',
          },
        },
        bienvenida: {
          titulo: '¡Mis 15 Años!',
          texto: 'Te espero para celebrar esta noche inolvidable juntos.',
        },
        historia: {
          titulo: 'Nuestra Historia',
          texto: '',
        },
        dressCode: {
          tipo: 'Elegante',
          texto: 'Dress code: Elegante',
        },
      }),
    });
  });

  // (a) Con fiesta "15 de Sofía, 12/12, Salón X", la salida tiene "Sofía" en protagonista1 y la plantilla es de XV
  it('(a) con fiesta "15 de Sofía, 12/12, Salón X", la salida tiene "Sofía" en protagonista1 y la plantilla es de XV', async () => {
    mockFiesta = {
      id: 'fiesta-sofia-15',
      configuracion: {
        nombreEvento: '15 de Sofía',
        tipoCelebracion: '15',
        fechaEvento: '2026-12-12',
        nombreLugar: 'Salón X',
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    const resultado = await armarWebConIA('fiesta-sofia-15');

    expect(resultado.success).toBe(true);
    expect(resultado.invitacionDigital).toBeDefined();
    expect(resultado.invitacionDigital?.cabecera.protagonista1).toBe('Sofía');
    expect(['XvModerna', 'XvClasica']).toContain(resultado.invitacionDigital?.plantilla);
  });

  // (b) Sin dirección en la entrada, la sección de ubicación queda visible: false
  it('(b) sin dirección en la entrada, la sección de ubicación queda visible: false', async () => {
    mockFiesta = {
      id: 'fiesta-sin-direccion',
      configuracion: {
        nombreEvento: '15 de Sofía',
        tipoCelebracion: '15',
        fechaEvento: '2026-12-12',
        nombreLugar: 'Salón X',
        // Sin direcciónLugar ni dirección de salón
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    const resultado = await armarWebConIA('fiesta-sin-direccion');

    expect(resultado.success).toBe(true);
    expect(resultado.invitacionDigital?.detallesEvento.visible).toBe(false);

    const seccionDetalles = resultado.invitacionDigital?.secciones.find(
      (s) => s.tipo === 'detallesEvento',
    );
    expect(seccionDetalles?.data.visible).toBe(false);
  });

  // (c) Un texto de bienvenida escrito a mano no cambia
  it('(c) un texto de bienvenida escrito a mano no cambia', async () => {
    const TEXTO_MANUAL = 'Bienvenidos a mi noche mágica escrita a mano por mí.';

    mockFiesta = {
      id: 'fiesta-con-texto-manual',
      configuracion: {
        nombreEvento: '15 de Sofía',
        tipoCelebracion: '15',
      } as any,
      invitacionDigital: {
        ...defaultInvitacionDigitalData,
        bienvenida: {
          ...defaultInvitacionDigitalData.bienvenida,
          texto: {
            text: TEXTO_MANUAL,
            style: { fontFamily: 'Inter', fontSize: '1rem', color: '#000' },
          },
        },
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    const resultado = await armarWebConIA('fiesta-con-texto-manual');

    expect(resultado.success).toBe(true);
    expect(resultado.invitacionDigital?.bienvenida.texto.text).toBe(TEXTO_MANUAL);
  });

  // (d) Con regalos.datosBancarios cargados, siguen idénticos
  it('(d) con regalos.datosBancarios cargados, siguen idénticos', async () => {
    const DATOS_BANCARIOS = 'BROU CA 123456789 - CI 1.234.567-8';

    mockFiesta = {
      id: 'fiesta-con-banco',
      configuracion: {
        nombreEvento: '15 de Sofía',
        tipoCelebracion: '15',
      } as any,
      invitacionDigital: {
        ...defaultInvitacionDigitalData,
        regalos: {
          ...defaultInvitacionDigitalData.regalos,
          datosBancarios: DATOS_BANCARIOS,
        },
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    // Llamada normal
    const resultado = await armarWebConIA('fiesta-con-banco');
    expect(resultado.success).toBe(true);
    expect(resultado.invitacionDigital?.regalos.datosBancarios).toBe(DATOS_BANCARIOS);

    // Incluso si se llama con rehacer: true, los datos bancarios jamás se tocan
    const resultadoRehacer = await armarWebConIA('fiesta-con-banco', { rehacer: true });
    expect(resultadoRehacer.success).toBe(true);
    expect(resultadoRehacer.invitacionDigital?.regalos.datosBancarios).toBe(DATOS_BANCARIOS);
  });

  // (e) Sin presupuesto de IA, devuelve success: false y no llama al modelo
  it('(e) sin presupuesto de IA, devuelve success: false y no llama al modelo', async () => {
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(false);

    mockFiesta = {
      id: 'fiesta-sin-presupuesto',
      configuracion: {
        nombreEvento: '15 de Sofía',
        tipoCelebracion: '15',
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    const resultado = await armarWebConIA('fiesta-sin-presupuesto');

    expect(resultado.success).toBe(false);
    expect(resultado.error).toMatch(/tope de IA del mes/i);
    expect(generateWithGeminiFallback).not.toHaveBeenCalled();
  });

  // (f) Una sesión de personal sin acceso de escritura es rechazada
  it('(f) una sesión de personal sin acceso de escritura es rechazada', async () => {
    (requireFiestaWriteAccess as jest.Mock).mockRejectedValueOnce(
      new Error('No autorizado para modificar este evento.'),
    );

    await expect(armarWebConIA('fiesta-no-autorizada')).rejects.toThrow(
      'No autorizado para modificar este evento.',
    );
  });
});
