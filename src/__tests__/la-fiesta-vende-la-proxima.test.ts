import { appendCommercialAttribution } from '@/lib/commercial/acquisition';
import { getAtraccionFiestasReport } from '@/app/actions/crm';

const mockFiestasData = [
  {
    id: 'fiesta_101',
    nombre: 'XV de Valentina',
    fecha: '2026-10-15',
    tipo: '15_anos',
  },
  {
    id: 'fiesta_102',
    nombre: 'Boda Camila y Lucas',
    fecha: '2026-11-20',
    tipo: 'boda',
  },
];

const mockLeadsData = [
  {
    id: 'lead_1',
    name: 'Micaela Rodriguez',
    createdAt: '2026-10-16T03:00:00.000Z',
    currentStageId: 'ganado',
    presupuestoId: 'pres_1',
    presupuestoEstado: 'Facturado',
    acquisition: {
      source: 'guest_portal',
      campaign: 'fotocabina',
      refFiestaId: 'fiesta_101',
    },
  },
  {
    id: 'lead_2',
    name: 'Joaquin Silva',
    createdAt: '2026-10-17T12:00:00.000Z',
    currentStageId: 'en_negociacion',
    presupuestoId: 'pres_2',
    acquisition: {
      source: 'guest_portal',
      campaign: 'galeria',
      refFiestaId: 'fiesta_101',
    },
  },
  {
    id: 'lead_3',
    name: 'Lucia Morales',
    createdAt: '2026-11-21T01:00:00.000Z',
    currentStageId: 'primer_contacto',
    acquisition: {
      source: 'guest_portal',
      campaign: 'album_publico',
      refFiestaId: 'fiesta_102',
    },
  },
];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn((filename: string, fallback: any) => {
    if (filename === 'crm-leads.json') {
      return Promise.resolve([
        {
          id: 'lead_1',
          name: 'Micaela Rodriguez',
          createdAt: '2026-10-16T03:00:00.000Z',
          currentStageId: 'ganado',
          presupuestoId: 'pres_1',
          presupuestoEstado: 'Facturado',
          acquisition: {
            source: 'guest_portal',
            campaign: 'fotocabina',
            refFiestaId: 'fiesta_101',
          },
        },
        {
          id: 'lead_2',
          name: 'Joaquin Silva',
          createdAt: '2026-10-17T12:00:00.000Z',
          currentStageId: 'en_negociacion',
          presupuestoId: 'pres_2',
          acquisition: {
            source: 'guest_portal',
            campaign: 'galeria',
            refFiestaId: 'fiesta_101',
          },
        },
        {
          id: 'lead_3',
          name: 'Lucia Morales',
          createdAt: '2026-11-21T01:00:00.000Z',
          currentStageId: 'primer_contacto',
          acquisition: {
            source: 'guest_portal',
            campaign: 'album_publico',
            refFiestaId: 'fiesta_102',
          },
        },
      ]);
    }
    return Promise.resolve(fallback);
  }),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn().mockResolvedValue([
    {
      id: 'fiesta_101',
      configuracion: {
        nombreEvento: 'XV de Valentina',
        fechaEvento: '2026-10-15',
        tipoCelebracion: '15_anos',
      },
    },
    {
      id: 'fiesta_102',
      configuracion: {
        nombreEvento: 'Boda Camila y Lucas',
        fechaEvento: '2026-11-20',
        tipoCelebracion: 'boda',
      },
    },
  ]),
}));

describe('Mejoras Tanda 1 — Que la fiesta venda la próxima', () => {
  describe('Atribución comercial en enlaces', () => {
    it('genera URLs con atribución para fotocabina', () => {
      const url = appendCommercialAttribution('/simulador-de-presupuesto', {
        source: 'guest_portal',
        campaign: 'fotocabina',
        refFiestaId: 'fiesta_101',
      });
      expect(url).toContain('source=guest_portal');
      expect(url).toContain('campaign=fotocabina');
      expect(url).toContain('refFiesta=fiesta_101');
    });

    it('genera URLs con atribución para galería y muro', () => {
      const urlGaleria = appendCommercialAttribution('/simulador-de-presupuesto', {
        source: 'guest_portal',
        campaign: 'galeria',
        refFiestaId: 'fiesta_101',
      });
      expect(urlGaleria).toContain('campaign=galeria');

      const urlMuro = appendCommercialAttribution('/simulador-de-presupuesto', {
        source: 'guest_portal',
        campaign: 'muro_social',
        refFiestaId: 'fiesta_101',
      });
      expect(urlMuro).toContain('campaign=muro_social');
    });

    it('genera URLs con atribución para álbum público', () => {
      const urlAlbum = appendCommercialAttribution('/simulador-de-presupuesto', {
        source: 'guest_portal',
        campaign: 'album_publico',
        refFiestaId: 'fiesta_102',
      });
      expect(urlAlbum).toContain('campaign=album_publico');
      expect(urlAlbum).toContain('refFiesta=fiesta_102');
    });
  });

  describe('Reporte de atracción de clientes por fiesta', () => {
    it('agrupa prospectos por fiesta y cuenta presupuestos y contrataciones', async () => {
      const report = await getAtraccionFiestasReport();
      expect(report.success).toBe(true);
      expect(report.totalProspectos).toBe(3);
      expect(report.totalPresupuestos).toBe(2);
      expect(report.totalContratados).toBe(1);
      expect(report.fiestasConAtraccion).toBe(2);

      const fiesta101 = report.data?.find((f) => f.fiestaId === 'fiesta_101');
      expect(fiesta101).toBeDefined();
      expect(fiesta101?.nombreFiesta).toBe('XV de Valentina');
      expect(fiesta101?.prospectosCount).toBe(2);
      expect(fiesta101?.presupuestosCount).toBe(2);
      expect(fiesta101?.contratadosCount).toBe(1);

      const fiesta102 = report.data?.find((f) => f.fiestaId === 'fiesta_102');
      expect(fiesta102).toBeDefined();
      expect(fiesta102?.nombreFiesta).toBe('Boda Camila y Lucas');
      expect(fiesta102?.prospectosCount).toBe(1);
      expect(fiesta102?.presupuestosCount).toBe(0);
      expect(fiesta102?.contratadosCount).toBe(0);
    });

    it('filtra correctamente por año', async () => {
      const report2026 = await getAtraccionFiestasReport(2026);
      expect(report2026.success).toBe(true);
      expect(report2026.data?.length).toBe(2);

      const report2025 = await getAtraccionFiestasReport(2025);
      expect(report2025.success).toBe(true);
      expect(report2025.data?.length).toBe(0);
    });
  });
});
