import { createHash } from 'node:crypto';
import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { guardarAnuncio } from './creador-anuncios';
import { requirePermiso } from '@/lib/auth/require-session';
import { readData, writeData } from '@/lib/data-service';

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getPublicWhatsAppNumber: jest.fn().mockResolvedValue('59898355530'),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

const mockedRequirePermiso = jest.mocked(requirePermiso);
const mockedReadData = jest.mocked(readData);
const mockedWriteData = jest.mocked(writeData);

describe('acciones del creador de anuncios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedReadData.mockResolvedValue([]);
    mockedWriteData.mockResolvedValue(undefined);
  });

  it('guarda cada biblioteca en un archivo aislado por usuario', async () => {
    mockedRequirePermiso.mockResolvedValue({ ok: true, user: { userId: 'usuario-a', role: 'admin' } });
    const anuncio = generarAnuncioCompleto({
      tipoEvento: 'bodas',
      objetivo: 'simulador',
      tono: 'elegante_premium',
    });

    const result = await guardarAnuncio(anuncio);
    const hash = createHash('sha256').update('usuario-a').digest('hex').slice(0, 20);

    expect(result.success).toBe(true);
    expect(mockedReadData).toHaveBeenCalledWith(`anuncios-guardados-${hash}.json`, []);
    expect(mockedWriteData).toHaveBeenCalledWith(
      `anuncios-guardados-${hash}.json`,
      expect.arrayContaining([expect.objectContaining({ id: anuncio.id })]),
    );
  });

  it('no guarda si el usuario no tiene permiso comercial', async () => {
    mockedRequirePermiso.mockResolvedValue({ ok: false, error: 'Sin acceso' });
    const anuncio = generarAnuncioCompleto({
      tipoEvento: '15_anos',
      objetivo: 'simulador',
      tono: 'emocional_familiar',
    });

    await expect(guardarAnuncio(anuncio)).resolves.toEqual({ success: false, error: 'Sin acceso' });
    expect(mockedWriteData).not.toHaveBeenCalled();
  });
});
