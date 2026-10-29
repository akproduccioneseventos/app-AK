const imagenGenerada = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
let fiesta: any;

jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn() }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true) }));
jest.mock('@/lib/ai/consumo-servidor', () => ({
  hayPresupuestoParaIA: jest.fn(async () => true),
  registrarConsumoIA: jest.fn(async () => undefined),
}));
jest.mock('@/lib/ai/gemini-image', () => ({ generateGeminiImage: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorageWithDownloadToken: jest.fn(async () => 'https://firebasestorage.googleapis.com/v0/b/test/o/salon.png?alt=media&token=opaque'),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, update: (actual: any) => any) => {
    try {
      fiesta = await update(fiesta);
      return { success: true, updatedFiesta: fiesta };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }),
}));

import { generateGeminiImage } from '@/lib/ai/gemini-image';
import { uploadToStorageWithDownloadToken } from '@/lib/firebase/storage';
import { generarFotoDelSalonDesdeElPortal } from '@/app/actions/fiesta/decoracion.actions';

describe('foto del salón desde el portal del cliente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fiesta = { id: 'fiesta-1', decoracion: { fotosGeneradasAi: [], salonElements: [{ id: 'mesa' }] } };
    (generateGeminiImage as jest.Mock).mockResolvedValue(imagenGenerada);
  });

  test('usa una captura 3D válida y persiste una URL de imagen utilizable, no el base64 crudo', async () => {
    const captura = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    const result = await generarFotoDelSalonDesdeElPortal('fiesta-1', captura);

    expect(generateGeminiImage).toHaveBeenCalledWith(expect.objectContaining({
      images: [expect.objectContaining({ contentType: 'image/png', base64: expect.stringContaining('iVBORw0KGgo') })],
    }));
    expect(uploadToStorageWithDownloadToken).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.stringMatching(/^salon-ai\/fiesta-1\/.+\.png$/),
      'image/png',
    );
    expect(result).toEqual(expect.objectContaining({ success: true, imageUrl: expect.stringMatching(/^https:\/\/firebasestorage\.googleapis\.com\//) }));
    expect(fiesta.decoracion.fotosGeneradasAi).toEqual([result.imageUrl]);
    expect(fiesta.decoracion.fotosGeneradasAi[0]).not.toBe(imagenGenerada);
  });

  test('rechaza la petición antes de consumir IA si la captura aún no está lista', async () => {
    const result = await generarFotoDelSalonDesdeElPortal('fiesta-1');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/vista 3D todavía no está lista/i);
    expect(generateGeminiImage).not.toHaveBeenCalled();
  });

  test('no reemplaza fallos del proveedor por una URL falsa', async () => {
    (generateGeminiImage as jest.Mock).mockResolvedValue(null);
    const result = await generarFotoDelSalonDesdeElPortal(
      'fiesta-1',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB',
    );

    expect(result.success).toBe(false);
    expect(result.imageUrl).toBeUndefined();
    expect(uploadToStorageWithDownloadToken).not.toHaveBeenCalled();
    expect(fiesta.decoracion.fotosSalonAiPendientes).toEqual([]);
  });
});
