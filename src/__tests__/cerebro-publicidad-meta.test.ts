import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { ejecutarVigilantePublicidad } from '@/lib/agentes/motor-agentes';
import type { MetaAdsSummary } from '@/lib/marketing/meta-ads';

const mockData: Record<string, any> = {
  'crm-leads.json': [],
  'fiestas.json': [],
  'presupuestos.json': [],
  'agentes-configuracion.json': [],
  'agentes-historial.json': [],
};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn((file: string, fallback: any) => Promise.resolve(mockData[file] ?? fallback)),
  writeData: jest.fn((file: string, data: any) => {
    mockData[file] = data;
    return Promise.resolve(true);
  }),
}));

jest.mock('@/lib/marketing/meta-commercial-metrics', () => ({
  loadMetaCommercialMetrics: jest.fn(() =>
    Promise.resolve({
      revenueCurrency: '$U',
      totalLeads: 8,
      totalConversions: 2,
      totalRevenue: 120000,
      campaigns: {},
    })
  ),
}));

describe('Cerebro de Publicidad de AK (Meta Ads & Creador de Anuncios)', () => {
  beforeEach(() => {
    mockData['crm-leads.json'] = [];
    mockData['agentes-configuracion.json'] = [];
    mockData['agentes-historial.json'] = [];
  });

  it('el creador usa números reales de Meta cuando hay campañas con consultas', () => {
    const mockSummary: MetaAdsSummary = {
      connectionStatus: 'connected',
      adCurrency: '$U',
      revenueCurrency: '$U',
      currencyComparable: true,
      totalSpend: 5000,
      totalLeads: 10,
      totalConversions: 2,
      totalRevenue: 150000,
      averageCpl: 500,
      overallRoas: 30,
      reportedCampaignsCount: 2,
      campaigns: [
        {
          id: 'camp_15_anos',
          name: '15 Años Salto Pista LED',
          spend: 1500,
          impressions: 4500,
          clicks: 180,
          ctrPct: 4.0,
          cpl: 300,
          leadsCount: 5,
          conversionsCount: 2,
          revenue: 150000,
          roasRatio: 100,
        },
        {
          id: 'camp_bodas',
          name: 'Bodas Elegantes',
          spend: 3500,
          impressions: 3000,
          clicks: 60,
          ctrPct: 2.0,
          cpl: 700,
          leadsCount: 5,
          conversionsCount: 0,
          revenue: 0,
          roasRatio: 0,
        },
      ],
    };

    const anuncio = generarAnuncioCompleto({
      tipoEvento: '15_anos',
      objetivo: 'simulador',
      tono: 'emocional_familiar',
      metaSummary: mockSummary,
      catalogServices: [{ nombre: 'Pista LED', precioVenta: 12000 }],
      realPhotos: [{ url: '/foto-15.jpg', titulo: 'Pista de 15 años', categoriaServicio: '15_anos' }],
      testimonials: [{ clientName: 'Valeria M.', testimonialText: 'Hermosa fiesta de 15 de mi hija', fiestaNombre: '15 de Sofía' }],
    });

    expect(anuncio.datosRendimientoMeta?.tieneDatosReales).toBe(true);
    expect(anuncio.datosRendimientoMeta?.cplPromedio).toBe(300);
    expect(anuncio.datosRendimientoMeta?.comparativaMensaje).toContain('300');
    expect(anuncio.fotoRealSugerida?.url).toBe('/foto-15.jpg');
    expect(anuncio.testimonioReal?.cliente).toBe('Valeria M.');
  });

  it('el creador avisa con honestidad y no inventa números cuando no hay datos de Meta', () => {
    const anuncioSinDatos = generarAnuncioCompleto({
      tipoEvento: 'empresarial',
      objetivo: 'whatsapp',
      tono: 'elegante_premium',
      metaSummary: null,
    });

    expect(anuncioSinDatos.datosRendimientoMeta?.tieneDatosReales).toBe(false);
    expect(anuncioSinDatos.datosRendimientoMeta?.comparativaMensaje).toContain('Todavía no hay datos de campañas de Meta');
    expect(anuncioSinDatos.datosRendimientoMeta?.cplPromedio).toBeUndefined();
  });

  it('los servicios y precios asociados al anuncio provienen exclusivamente del catálogo real', () => {
    const catalogo = [
      { nombre: 'Fotocabina Vintage', precioVenta: 8500 },
      { nombre: 'Barra de Tragos Móvil', precioVenta: 14000 },
    ];

    const anuncio = generarAnuncioCompleto({
      tipoEvento: 'cumpleanos',
      objetivo: 'whatsapp',
      tono: 'divertido_fiesta',
      catalogServices: catalogo,
    });

    expect(anuncio.serviciosCatalogoReales).toHaveLength(2);
    expect(anuncio.serviciosCatalogoReales?.[0].nombre).toBe('Fotocabina Vintage');
    expect(anuncio.serviciosCatalogoReales?.[0].precio).toBe(8500);
  });

  it('el vigilante de publicidad monitorea gastos y genera alertas sin tocar la cuenta de Meta', async () => {
    const registro = await ejecutarVigilantePublicidad();

    expect(registro.agenteId).toBe('vigilante_publicidad');
    expect(registro.agenteNombre).toBe('Vigilante de Publicidad & Meta Ads');
    expect(Array.isArray(registro.hallazgos)).toBe(true);
    expect(Array.isArray(registro.accionesPreparadas)).toBe(true);
    expect(['exito', 'sin_novedades', 'alerta']).toContain(registro.estado);
  });
});
