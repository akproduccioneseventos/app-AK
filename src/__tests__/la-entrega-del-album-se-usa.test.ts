/**
 * Orden 290 - Bloque 3: La entrega del Ã¡lbum por Wfolio se usa.
 * Verifica la validaciÃ³n de URLs de Wfolio, que guarde enlaces vÃ¡lidos
 * y rechace enlaces que no son de Wfolio, y que con ?wfolioUrl= el campo se precarga.
 */

import { isValidWfolioUrl, buildWfolioDelivery, getAlbumDeliveryStatus } from '@/lib/social-fiesta/wfolio-album-delivery';
import { guardarAlbumWfolioAction } from '@/app/actions/fiesta/fiesta.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { perfil: 'dueno' } }),
}));

jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { CONTABILIDAD: 'contabilidad' },
  puede: jest.fn().mockReturnValue(true),
  perfilDe: jest.fn().mockReturnValue({ puede: () => true }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(true),
  readDataConDetalle: jest.fn().mockResolvedValue({ valor: [], huboFalla: false }),
}));

jest.mock('@/lib/data-service-firebase', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(true),
  readDataConDetalle: jest.fn().mockResolvedValue({ valor: [], huboFalla: false }),
}));

describe('Orden 290 - Bloque 3: Entrega del Ã¡lbum por Wfolio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ValidaciÃ³n de enlaces de Wfolio', () => {
    it('acepta enlaces vÃ¡lidos con dominio wfolio.com o wfolio.pro', () => {
      expect(isValidWfolioUrl('https://estudio.wfolio.com/boda-sofia')).toBe(true);
      expect(isValidWfolioUrl('https://wfolio.com/my/disk')).toBe(true);
      expect(isValidWfolioUrl('https://eventos.wfolio.pro/album-123')).toBe(true);
    });

    it('rechaza enlaces que no pertenecen a Wfolio', () => {
      expect(isValidWfolioUrl('')).toBe(false);
      expect(isValidWfolioUrl('https://drive.google.com/drive/folders/xyz')).toBe(false);
      expect(isValidWfolioUrl('https://example.com/fotos')).toBe(false);
      expect(isValidWfolioUrl('texto-cualquiera')).toBe(false);
    });
  });

  describe('Guardado de la entrega del Ã¡lbum', () => {
    it('rechaza guardar un enlace que no es de Wfolio', async () => {
      const resultado = await guardarAlbumWfolioAction('fiesta-123', 'https://drive.google.com/drive/xyz');
      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/wfolio\.com|wfolio\.pro/i);
    });

    it('rechaza si el enlace estÃ¡ vacÃ­o', async () => {
      const resultado = await guardarAlbumWfolioAction('fiesta-123', '   ');
      expect(resultado.success).toBe(false);
      expect(resultado.error).toMatch(/wfolio/i);
    });
  });

  describe('Precarga con query parameter ?wfolioUrl=', () => {
    it('con ?wfolioUrl= el campo aparece lleno y listo para guardar con un toque', () => {
      const searchParams = { wfolioUrl: 'https://fotos.wfolio.pro/los-15-de-mora' };
      const fiesta = {
        id: 'fiesta-789',
        clienteNombre: 'Mora Gomez',
        configuracion: { nombreEvento: 'Los 15 de Mora' },
        galeriaUrl: '',
      };

      // SimulaciÃ³n de la resoluciÃ³n de wfolio en CentroDeFiestaPage
      const wfolioUrlResuelto = (searchParams?.wfolioUrl || fiesta.galeriaUrl || '').trim();

      expect(wfolioUrlResuelto).toBe('https://fotos.wfolio.pro/los-15-de-mora');
      expect(isValidWfolioUrl(wfolioUrlResuelto)).toBe(true);

      const delivery = buildWfolioDelivery({
        fiestaId: fiesta.id,
        eventName: fiesta.configuracion.nombreEvento,
        clientName: fiesta.clienteNombre,
        wfolioUrl: wfolioUrlResuelto,
      });

      expect(delivery.wfolioUrl).toBe('https://fotos.wfolio.pro/los-15-de-mora');
      expect(delivery.status).toBe('entregado_cliente');
      expect(getAlbumDeliveryStatus({ delivery })).toBe('entregado_cliente');
    });
  });
});
