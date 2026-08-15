import { savePromo } from '@/app/actions/promos';

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
}));

describe('Gestión de Promociones - Validación de Fechas (Bloque E)', () => {
  const mockReadData = require('@/lib/data-service').readData;
  const mockWriteData = require('@/lib/data-service').writeData;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const basePromoData = {
    activa: true,
    titulo: 'Promo Primavera 2026',
    subtitulo: 'Descuento especial',
    descripcion: 'Contratá tu fiesta y recibí beneficios',
    regalo: 'Mesa de dulces',
    whatsappMensaje: 'Hola, quiero la promo',
    ctaTexto: 'Quiero mi promo',
    mostrarCountdown: true,
    mostrarEnLanding: true,
    mostrarEnSimulador: false,
    posicion: 'floating-bottom' as const,
  };

  it('rechaza guardar una promoción sin fecha de inicio', async () => {
    const res = await savePromo({
      ...basePromoData,
      fechaInicio: '',
      fechaFin: '2026-10-31',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fecha de inicio.*obligatoria/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('rechaza guardar una promoción sin fecha de fin', async () => {
    const res = await savePromo({
      ...basePromoData,
      fechaInicio: '2026-10-01',
      fechaFin: '',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fecha de fin.*obligatoria/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('rechaza guardar una promoción si la fecha de fin es anterior a la fecha de inicio', async () => {
    const res = await savePromo({
      ...basePromoData,
      fechaInicio: '2026-10-15',
      fechaFin: '2026-10-10',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fecha de fin no puede ser anterior/i);
    expect(mockWriteData).not.toHaveBeenCalled();
  });

  it('guarda exitosamente una promoción cuando las fechas son válidas', async () => {
    mockReadData.mockResolvedValue([]);
    mockWriteData.mockResolvedValue(undefined);

    const res = await savePromo({
      ...basePromoData,
      fechaInicio: '2026-10-01',
      fechaFin: '2026-10-31',
    });

    expect(res.success).toBe(true);
    expect(res.promo).toBeDefined();
    expect(res.promo?.fechaInicio).toBe('2026-10-01');
    expect(res.promo?.fechaFin).toBe('2026-10-31');
    expect(mockWriteData).toHaveBeenCalled();
  });
});
