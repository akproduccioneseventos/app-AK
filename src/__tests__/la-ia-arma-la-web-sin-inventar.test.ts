import { armarWebConIA, crearTresPropuestasDeWeb, elegirPropuestaDeWeb } from '@/app/actions/fiesta/armar-web-con-ia.actions';
import { generateWithGeminiFallback } from '@/ai/genkit';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { requireFiestaWriteAccess, getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { createNotification } from '@/lib/notifications/create-notification';
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
  saveFiesta: jest.fn(async (f: any) => ({ success: true, fiesta: f })),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => true),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({
  aprenderDeLoAprobado: jest.fn(async () => []),
  getPlantillasMasElegidas: jest.fn(async () => []),
}));

describe('Orden 234 — La IA arma la web sin inventar', () => {
  let mockFiesta: FiestaEnPlanificacion;

  beforeEach(() => {
    jest.clearAllMocks();
    (hayPresupuestoParaIA as jest.Mock).mockResolvedValue(true);
    (requireFiestaWriteAccess as jest.Mock).mockResolvedValue(undefined);
    (saveFiesta as jest.Mock).mockImplementation(async (f: any) => ({ success: true, fiesta: f }));
    (verifyPortalSession as jest.Mock).mockResolvedValue(true);
    (createNotification as jest.Mock).mockResolvedValue({ success: true });

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

  // Bloque 5 — Tres versiones para que elija la quinceañera
  it('con la IA simulada salen 3 versiones con plantillas distintas', async () => {
    mockFiesta = {
      id: 'fiesta-quince-3versiones',
      configuracion: {
        nombreEvento: '15 de Camila',
        tipoCelebracion: '15',
        fechaEvento: '2026-12-15',
        nombreLugar: 'Salón Las Violetas',
        direccionLugar: 'Av. Rivera 1234',
      } as any,
    } as FiestaEnPlanificacion;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    const resultado = await crearTresPropuestasDeWeb('fiesta-quince-3versiones', '#ec4899');

    expect(resultado.success).toBe(true);
    expect(resultado.propuestas).toBeDefined();
    expect(resultado.propuestas).toHaveLength(3);

    // Tres plantillas distintas de las 8
    const plantillas = resultado.propuestas!.map((p) => p.invitacionDigital.plantilla);
    expect(new Set(plantillas).size).toBe(3);

    // Tres paletas armadas a partir del color elegido (análoga, contraste y suave)
    const paletas = resultado.propuestas!.map((p) => p.paletaTipo);
    expect(paletas).toEqual(['analoga', 'contraste', 'suave']);

    // Textos con tono distinto (clásico, moderno y divertido)
    const tonos = resultado.propuestas!.map((p) => p.tono);
    expect(tonos).toEqual(['clasico', 'moderno', 'divertido']);
  });

  it('elegir con sesión de portal de otra fiesta se rechaza', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValueOnce(false);
    (requireFiestaWriteAccess as jest.Mock).mockRejectedValueOnce(
      new Error('No autorizado para modificar este evento.'),
    );

    await expect(elegirPropuestaDeWeb('otra-fiesta-ajena', 'prop-1')).rejects.toThrow(
      'No autorizado para modificar este evento.',
    );
  });

  it('elegir un id que no existe se rechaza', async () => {
    mockFiesta = {
      id: 'fiesta-con-propuestas',
      propuestasDeWeb: [
        {
          id: 'prop-real-1',
          invitacionDigital: { ...defaultInvitacionDigitalData },
          creadaEn: new Date().toISOString(),
          paletaTipo: 'analoga',
          tono: 'clasico',
        },
      ],
    } as any;

    (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);

    await expect(
      elegirPropuestaDeWeb('fiesta-con-propuestas', 'id-que-no-existe'),
    ).rejects.toThrow(/no existe|no se encontr/i);
  });

  it('la web publicada no cambia hasta elegir', async () => {
    const webOriginal = {
      ...defaultInvitacionDigitalData,
      cabecera: {
        ...defaultInvitacionDigitalData.cabecera,
        protagonista1: 'Web Publicada Original',
      },
    };

    let fiestaEstado: FiestaEnPlanificacion = {
      id: 'fiesta-elegir-web',
      configuracion: {
        nombreEvento: '15 de Valentina',
        tipoCelebracion: '15',
        fechaEvento: '2026-11-20',
      } as any,
      invitacionDigital: webOriginal,
    } as any;

    (getFiestaById as jest.Mock).mockImplementation(async () => fiestaEstado);
    (saveFiesta as jest.Mock).mockImplementation(async (actualizada: FiestaEnPlanificacion) => {
      fiestaEstado = actualizada;
      return { success: true, fiesta: actualizada };
    });

    // 1. Generar las 3 propuestas
    const resPropuestas = await crearTresPropuestasDeWeb('fiesta-elegir-web', '#ec4899');
    expect(resPropuestas.success).toBe(true);
    expect(resPropuestas.propuestas).toHaveLength(3);

    // 2. Comprobar que la web publicada (invitacionDigital) NO cambió al generar propuestas
    expect(fiestaEstado.invitacionDigital).toEqual(webOriginal);
    expect(fiestaEstado.invitacionDigital?.cabecera.protagonista1).toBe('Web Publicada Original');
    expect(fiestaEstado.propuestasDeWeb).toHaveLength(3);

    // 3. Elegir una de las propuestas
    const propuestaElegida = resPropuestas.propuestas![1];
    const resElegir = await elegirPropuestaDeWeb('fiesta-elegir-web', propuestaElegida.id);
    expect(resElegir.success).toBe(true);

    // 4. Ahora sí la web publicada cambió a la propuesta elegida
    // Mezcla: lo escrito a mano (protagonista) queda; el resto sale de la propuesta.
    expect(fiestaEstado.invitacionDigital?.cabecera.protagonista1).toBe('Web Publicada Original');
    expect(fiestaEstado.invitacionDigital?.plantilla).toEqual(propuestaElegida.invitacionDigital.plantilla);
    expect(fiestaEstado.propuestaDeWebElegida).toBe(propuestaElegida.id);
    expect(createNotification).toHaveBeenCalled();
  });

  it('elegir una propuesta conserva los datos bancarios y los regalos cargados', async () => {
    const propuesta: any = {
      id: 'p1',
      invitacionDigital: {
        ...defaultInvitacionDigitalData,
        regalos: { ...defaultInvitacionDigitalData.regalos, datosBancarios: '', items: [] },
      },
    };
    let estado: any = {
      id: 'f-banco',
      configuracion: { nombreEvento: 'X', tipoCelebracion: '15', fechaEvento: '2026-11-20' },
      invitacionDigital: {
        ...defaultInvitacionDigitalData,
        regalos: {
          ...defaultInvitacionDigitalData.regalos,
          datosBancarios: 'BROU 001-123456-7',
          items: [{ id: 'g1', nombre: 'Reloj' }],
        },
      },
      propuestasDeWeb: [propuesta],
    };
    (getFiestaById as jest.Mock).mockImplementation(async () => estado);
    (saveFiesta as jest.Mock).mockImplementation(async (f: any) => {
      estado = f;
      return { success: true, fiesta: f };
    });
    const res = await elegirPropuestaDeWeb('f-banco', 'p1');
    expect(res.success).toBe(true);
    expect(estado.invitacionDigital.regalos.datosBancarios).toBe('BROU 001-123456-7');
    expect(estado.invitacionDigital.regalos.items).toHaveLength(1);
  });
});
