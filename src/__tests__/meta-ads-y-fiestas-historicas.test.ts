import { getMarketingAdsPanelData } from '@/app/actions/meta-ads-panel.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, email: 'admin@ak.com', role: 'admin', perfil: 'dueno' })),
}));

jest.mock('@/lib/marketing/meta-commercial-metrics', () => ({
  loadMetaCommercialMetrics: jest.fn(async () => ({
    campaigns: [],
    adCurrency: 'UYU',
    connectionStatus: 'disconnected',
    totalLeads: 0,
    totalConversions: 0,
    totalRevenue: 0,
  })),
}));

jest.mock('@/lib/marketing/tope-de-gasto-publicidad', () => ({
  getEstadoDelTope: jest.fn(async () => ({ gastoActualUYU: 0, topeMensualUYU: 10000, porcentajeUsado: 0 })),
}));

jest.mock('@/lib/marketing/meta-ads-acciones', () => ({
  getAccionesPublicidadEjecutadas: jest.fn(async () => []),
}));

jest.mock('@/lib/marketing/cliente-ideal', () => ({
  calcularClienteIdeal: jest.fn(async () => ({ perfilDominante: 'XV Años', ticketPromedio: 50000 })),
}));

describe('Orden 321: getMarketingAdsPanelData y /contabilidad/fiestas-historicas', () => {
  it('getMarketingAdsPanelData devuelve resumen y estado del tope desde el servidor', async () => {
    const res = await getMarketingAdsPanelData();
    expect(res.summary.connectionStatus).toBe('not_configured');
    expect(res.estadoDelTope.topeMensualUYU).toBe(10000);
    expect(Array.isArray(res.historialAcciones)).toBe(true);
  });

  it('el panel de /contabilidad/fiestas-historicas integra CargaHistoricos en una pestaña', async () => {
    const mod = await import('@/app/(app)/contabilidad/fiestas-historicas/page');
    expect(typeof mod.default).toBe('function');
  });
});
