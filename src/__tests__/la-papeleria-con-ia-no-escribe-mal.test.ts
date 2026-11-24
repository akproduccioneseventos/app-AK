/** @jest-environment node */
import sharp from 'sharp';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  updateFiestaPartial: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorageWithDownloadToken: jest.fn(),
}));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenuById: jest.fn(async () => null),
}));
jest.mock('@/app/actions/settings', () => ({
  getCompanyInfo: jest.fn(async () => null),
  getInvoiceTemplateSettings: jest.fn(async () => null),
}));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => false),
  reservarConsumoIA: jest.fn(async () => null),
  registrarConsumoIA: jest.fn(async () => undefined),
  anotarFalloIA: jest.fn(async () => undefined),
}));

import {
  disenarPiezaConIA,
  detectarEsEmpresa,
  armarPromptPapeleria,
  extraerDatosRealesFiesta,
} from '@/lib/papeleria/disenar-con-ia';
import {
  disenarPapeleriaConIAAction,
  guardarPapeleriaIAAction,
  quitarPapeleriaIAAction,
} from '@/app/actions/fiesta/papeleria-ia.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { requirePermiso } from '@/lib/auth/require-session';
import { getFiestaById, updateFiestaPartial } from '@/app/actions/fiesta/fiesta.actions';
import { uploadToStorageWithDownloadToken } from '@/lib/firebase/storage';

describe('Orden 341 - Acciones de Papelería con IA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disenarPapeleriaConIAAction valida permisos, lee la fiesta completa y corta por tope', async () => {
    (requirePermiso as jest.Mock).mockResolvedValueOnce({ ok: false, error: 'No autorizado' });
    const resNoAuth = await disenarPapeleriaConIAAction({ fiestaId: 'fiesta-123', pieza: 'cartaTragos' });
    expect(resNoAuth.ok).toBe(false);

    (requirePermiso as jest.Mock).mockResolvedValueOnce({ ok: true, user: {} });
    (getFiestaById as jest.Mock).mockResolvedValueOnce({
      id: 'fiesta-123',
      nombre: '15 de Camila',
      configuracion: { nombreEvento: 'Fiesta Test' },
    });

    const resAuth = await disenarPapeleriaConIAAction({ fiestaId: 'fiesta-123', pieza: 'cartaTragos' });
    expect(getFiestaById).toHaveBeenCalledWith('fiesta-123', LECTURA_COMPLETA);
    expect(resAuth.ok).toBe(false);
    expect(resAuth.topeAlcanzado).toBe(true);
  });

  it('guardarPapeleriaIAAction sube la imagen a Storage y guarda papeleriaIA.cartaTragos', async () => {
    (requirePermiso as jest.Mock).mockResolvedValueOnce({ ok: true, user: {} });
    (getFiestaById as jest.Mock).mockResolvedValueOnce({ id: 'fiesta-123' });
    (uploadToStorageWithDownloadToken as jest.Mock).mockResolvedValueOnce('https://storage.url/img.png');
    (updateFiestaPartial as jest.Mock).mockResolvedValueOnce({ success: true });

    const res = await guardarPapeleriaIAAction({
      fiestaId: 'fiesta-123',
      pieza: 'cartaTragos',
      imageDataUrl: 'data:image/png;base64,' + Buffer.from('img').toString('base64'),
    });

    expect(res.success).toBe(true);
    expect(res.url).toBe('https://storage.url/img.png');
    expect(updateFiestaPartial).toHaveBeenCalledWith(
      'fiesta-123',
      expect.objectContaining({
        papeleriaIA: expect.objectContaining({
          cartaTragos: expect.objectContaining({ url: 'https://storage.url/img.png' }),
        }),
      }),
    );
  });

  it('quitarPapeleriaIAAction elimina la pieza y actualiza papeleriaIA', async () => {
    (requirePermiso as jest.Mock).mockResolvedValueOnce({ ok: true, user: {} });
    (getFiestaById as jest.Mock).mockResolvedValueOnce({
      id: 'fiesta-123',
      papeleriaIA: { cartaTragos: { url: 'https://x.png' } },
    });
    (updateFiestaPartial as jest.Mock).mockResolvedValueOnce({ success: true });

    const res = await quitarPapeleriaIAAction({ fiestaId: 'fiesta-123', pieza: 'cartaTragos' });

    expect(res.success).toBe(true);
    expect(updateFiestaPartial).toHaveBeenCalledWith('fiesta-123', { papeleriaIA: {} });
  });
});

describe('Orden 341 - La papelería con IA no escribe mal', () => {
  let mockPngBuffer: Buffer;

  beforeAll(async () => {
    mockPngBuffer = await sharp({
      create: {
        width: 1200,
        height: 1800,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  it('Test 1: Falla 3 veces los textos requeridos (ej. Mojito Clásico), devuelve usarPlantillaConFondo y aviso de error', async () => {
    let llamadasPedir = 0;
    const pedirImagenFn = jest.fn(async () => {
      llamadasPedir++;
      return {
        ok: true,
        base64: mockPngBuffer.toString('base64'),
        anchoPx: 1200,
        altoPx: 1800,
        modelo: 'gemini-3.1-flash-image',
        topeAlcanzado: false,
      };
    });

    const leerImagenFn = jest.fn(async () => ({
      ok: true,
      texto: 'Solo Aperol Spritz',
      modelo: 'googleai/gemini-4-hydrogen',
      topeAlcanzado: false,
    }));
    const hayPresupuestoFn = jest.fn(async () => true);

    const fiesta = {
      configuracion: {
        nombreEvento: '15 de Zaira',
        nombreAgasajado: 'Zaira',
        tipoCelebracion: 'Cumpleaños 15',
        primaryColor: '#ff00ff',
      },
      cartaTragos: {
        items: [
          { id: '1', nombre: 'Mojito Clásico' },
          { id: '2', nombre: 'Aperol Spritz' },
        ],
      },
    };

    const res = await disenarPiezaConIA({
      fiesta,
      pieza: 'cartaTragos',
      hayPresupuestoFn,
      pedirImagenFn,
      leerImagenFn,
    });

    expect(llamadasPedir).toBe(3);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.usarPlantillaConFondo).toBe(true);
      expect(res.mejorFondoBase64).toBeDefined();
      expect(res.aviso).toContain('La IA no escribió bien estos textos');
      expect(res.aviso).toContain('Mojito');
    }
  });

  it('Test 2: Falla la primera vez el OCR y acierta en el segundo intento, devuelve ok: true y 2 intentos', async () => {
    let llamadasPedir = 0;
    const pedirImagenFn = jest.fn(async () => {
      llamadasPedir++;
      return {
        ok: true,
        base64: mockPngBuffer.toString('base64'),
        anchoPx: 1200,
        altoPx: 1800,
        modelo: 'gemini-3.1-flash-image',
        topeAlcanzado: false,
      };
    });

    const leerImagenFn = jest.fn(async () => {
      if (llamadasPedir === 1) {
        return {
          ok: true,
          texto: 'Solo vino',
          modelo: 'googleai/gemini-4-hydrogen',
          topeAlcanzado: false,
        };
      }
      return {
        ok: true,
        texto: 'Zaira - Mojito Clásico y Aperol Spritz',
        modelo: 'googleai/gemini-4-hydrogen',
        topeAlcanzado: false,
      };
    });
    const hayPresupuestoFn = jest.fn(async () => true);

    const fiesta = {
      configuracion: {
        nombreEvento: '15 de Zaira',
        nombreAgasajado: 'Zaira',
        tipoCelebracion: 'Cumpleaños 15',
        primaryColor: '#ff00ff',
      },
      cartaTragos: {
        items: [
          { id: '1', nombre: 'Mojito Clásico' },
          { id: '2', nombre: 'Aperol Spritz' },
        ],
      },
    };

    const res = await disenarPiezaConIA({
      fiesta,
      pieza: 'cartaTragos',
      hayPresupuestoFn,
      pedirImagenFn,
      leerImagenFn,
    });

    expect(res.ok).toBe(true);
    expect(llamadasPedir).toBe(2);
  });

  it('Test 3: Tope agotado', async () => {
    let llamadasPedir = 0;
    const pedirImagenFn = jest.fn(async () => {
      llamadasPedir++;
      return {
        ok: true,
        base64: mockPngBuffer.toString('base64'),
        anchoPx: 1200,
        altoPx: 1800,
        modelo: 'gemini-3.1-flash-image',
        topeAlcanzado: false,
      };
    });
    const leerImagenFn = jest.fn(async () => ({
      ok: true,
      texto: '',
      modelo: 'googleai/gemini-4-hydrogen',
      topeAlcanzado: false,
    }));
    const hayPresupuestoFn = jest.fn(async () => false);

    const fiesta = {
      configuracion: {
        nombreEvento: '15 de Zaira',
        nombreAgasajado: 'Zaira',
        tipoCelebracion: 'Cumpleaños 15',
      },
    };

    const res = await disenarPiezaConIA({
      fiesta,
      pieza: 'cartaTragos',
      hayPresupuestoFn,
      pedirImagenFn,
      leerImagenFn,
    });

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.topeAlcanzado).toBe(true);
      expect(res.error).toBe('Se llegó al tope de IA del mes');
    }
    expect(llamadasPedir).toBe(0);
  });

  it('Test 4: Evento empresa', async () => {
    const fiesta = {
      configuracion: {
        nombreEvento: 'Día del Funcionario Postal',
        nombreAgasajado: 'Correo Uruguayo',
        tipoCelebracion: 'Corporativo',
      },
    };

    expect(detectarEsEmpresa(fiesta)).toBe(true);
    const datos = extraerDatosRealesFiesta(fiesta, 'afiche');
    const prompt = armarPromptPapeleria(datos, 'afiche');
    expect(prompt).toContain('Correo Uruguayo');
    expect(prompt).toMatch(/EVENTO CORPORATIVO\/INSTITUCIONAL/i);
    expect(prompt).toMatch(/Prohibido agregar flores de quinceañera/i);
    expect(prompt).toMatch(/Prohibido poner precios/i);
    expect(prompt.toLowerCase()).not.toContain('mis 15 años');

    const pedirImagenFn = jest.fn(async () => ({
      ok: true,
      base64: mockPngBuffer.toString('base64'),
      anchoPx: 1200,
      altoPx: 1800,
      modelo: 'gemini-3.1-flash-image',
      topeAlcanzado: false,
    }));
    const leerImagenFn = jest.fn(async () => ({
      ok: true,
      texto: 'Correo Uruguayo Corporativo Día del Funcionario Postal',
      modelo: 'googleai/gemini-4-hydrogen',
      topeAlcanzado: false,
    }));
    const hayPresupuestoFn = jest.fn(async () => true);

    const res = await disenarPiezaConIA({
      fiesta,
      pieza: 'afiche',
      hayPresupuestoFn,
      pedirImagenFn,
      leerImagenFn,
    });

    expect(res.ok).toBe(true);
  });
});
