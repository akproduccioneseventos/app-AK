/**
 * @jest-environment jsdom
 *
 * Orden 169 - Bloque 4: Barrido de pantallas que decían "listo" sin mirar el resultado.
 * Rutas: /empresa/presencia-digital y /admin/carga-historicos
 */

import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// --- Mocks comunes ---
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));

// --- Mocks para Presencia Digital ---
const mockMarcarResenaAction = jest.fn();
jest.mock('@/app/actions/presencia-digital-auto', () => ({
  marcarResenaSolicitadaAction: (...args: unknown[]) => mockMarcarResenaAction(...args),
  getFiestasSeguimientoResenasAction: jest.fn().mockResolvedValue({ success: true, data: { fiestas: [], pedidas: 0, pendientes: 2 } }),
  getDirectoriosAltasAction: jest.fn().mockResolvedValue({ success: true, data: { items: [], total: 0 } }),
  toggleDirectorioItemAction: jest.fn(),
  triggerAutoGeneracionSemanalAction: jest.fn(),
}));

jest.mock('@/app/actions/presencia-digital', () => ({
  publishApprovedSocialPost: jest.fn(),
  createPostFromDailySuggestion: jest.fn(),
  getNetworkAttributionReport: jest.fn(),
  getWebsiteAnalyticsData: jest.fn(),
  getAjustesRespuestasAction: jest.fn(async () => ({ comentarios: true, mensajesDirectos: true })),
  setAjustesRespuestasAction: jest.fn(async () => ({ success: true })),
  leerBandejaUnicaAction: jest.fn(async () => []),
}));

jest.mock('@/app/actions/comentarios-redes', () => ({
  getSocialCommentsDashboardAction: jest.fn().mockResolvedValue({ success: true, data: null }),
  triggerCommentsSyncAction: jest.fn(),
  restoreHiddenCommentAction: jest.fn(),
  hideCommentAction: jest.fn(),
  publishCommentAsTestimonialAction: jest.fn(),
}));

jest.mock('@/components/google-business-profile', () => ({
  GoogleBusinessProfileWidget: () => null,
}));

// --- Mocks para CRM ---
const mockRecordWhatsAppOpened = jest.fn();
jest.mock('@/app/actions/crm', () => ({
  recordWhatsAppOpened: (...args: unknown[]) => mockRecordWhatsAppOpened(...args),
  updateCrmLeadField: jest.fn(),
  scheduleCrmMeeting: jest.fn(),
  deleteCrmLead: jest.fn(),
}));

// --- Mocks para Históricos ---
const mockSaveFiesta = jest.fn();
const mockCreateNotification = jest.fn();
const mockSavePresupuesto = jest.fn();
const mockSaveInvoice = jest.fn();

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  saveFiesta: (...args: unknown[]) => mockSaveFiesta(...args),
  getFiestaById: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  savePresupuesto: (...args: unknown[]) => mockSavePresupuesto(...args),
}));

jest.mock('@/app/actions/invoices', () => ({
  saveInvoice: (...args: unknown[]) => mockSaveInvoice(...args),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://storage.fake/contrato.pdf'),
}));

jest.mock('@/app/actions/customers', () => ({
  saveCustomer: jest.fn().mockResolvedValue({ success: true, id: 'cust_1' }),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  requirePermisoAlguno: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  requireAppSession: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(true),
  createDataItem: jest.fn().mockResolvedValue(true),
  mutateDataItem: jest.fn().mockResolvedValue(true),
}));

// Imports de componentes y acciones
import { PresenciaDigitalClient } from '@/app/(app)/empresa/presencia-digital/presencia-digital-client';
import { CrmLeadCard } from '@/components/crm/CrmLeadCard';
import { processHistoricRecord } from '@/app/actions/historicos';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Orden 169 - Bloque 4: Pantallas que dicen listo sin mirar', () => {
  describe('4a. Pedido de reseña en /empresa/presencia-digital', () => {
    test('si marcarResenaSolicitadaAction falla, la fiesta sigue pendiente y no cambian los contadores', async () => {
      mockMarcarResenaAction.mockResolvedValueOnce({ success: false, error: 'Error de red' });

      const initialResenas = {
        pedidas: 0,
        pendientes: 1,
        tasaRespuesta: 0,
        fiestas: [
          {
            id: 'fiesta_1',
            nombreEvento: 'Boda Ana',
            fechaEvento: '2026-10-01',
            clienteNombre: 'Ana',
            clienteTelefono: '099123456',
            reviewRequested: false,
            whatsappUrl: 'https://wa.me/59899123456?text=test',
          },
        ],
      };

      const { getFiestasSeguimientoResenasAction } = require('@/app/actions/presencia-digital-auto');
      getFiestasSeguimientoResenasAction.mockResolvedValue({ success: true, data: initialResenas });

      const initialData: any = {
        connectedNetworks: [],
        scheduledPosts: [],
        kpis: {
          totalFollowers: 100,
          engagementRate: 5,
          totalPosts30d: 10,
          totalAudienceReach: 500,
        },
        commentsSummary: { totalCount: 0, pendingReviewCount: 0, sentimentStats: {} },
      };

      const host = document.body.appendChild(document.createElement('div'));
      const root = createRoot(host);

      await act(async () => {
        root.render(<PresenciaDigitalClient initialData={initialData} initialPosts={[]} />);
      });
      await act(async () => {
        await Promise.resolve();
      });

      const botonPedir = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Pedir por WhatsApp'));
      if (botonPedir) {
        window.open = jest.fn();
        await act(async () => {
          botonPedir.click();
        });
        await act(async () => {
          await Promise.resolve();
        });

        const llamadasToast = mockToast.mock.calls.map(c => c[0]?.description || '');
        expect(llamadasToast.some(desc => desc.includes('no se pudo anotar que pediste la reseña'))).toBe(true);
        expect(host.textContent).toContain('Pendiente de pedir');
        expect(host.textContent).not.toContain('✓ Solicitud enviada');
      }

      act(() => root.unmount());
      host.remove();
    });
  });

  describe('4b. WhatsApp al prospecto (CRM)', () => {
    test('si recordWhatsAppOpened falla, el toast avisa que no se pudo anotar en la ficha y no dice Se registró', async () => {
      mockRecordWhatsAppOpened.mockResolvedValueOnce({ success: false, error: 'Base caída' });

      const lead = {
        id: 'lead_abc',
        name: 'Carlos Gomez',
        phone: '099888777',
        status: 'Nuevo' as const,
        stageId: 'stage_1',
        createdAt: new Date().toISOString(),
      };

      const host = document.body.appendChild(document.createElement('div'));
      const root = createRoot(host);

      await act(async () => {
        root.render(
          <CrmLeadCard
            lead={lead}
            isDragDisabled={false}
            onUpdateField={jest.fn()}
            onDelete={jest.fn()}
          />
        );
      });

      // El botón de WhatsApp
      const botonWa = host.querySelector('button[title*="WhatsApp"], button[aria-label*="WhatsApp"]') ||
                      Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('WhatsApp') || b.querySelector('svg'));

      expect(botonWa).toBeDefined();

      // Abrimos WhatsApp
      window.open = jest.fn();
      await act(async () => {
        (botonWa as HTMLButtonElement).click();
      });
      await act(async () => {
        await Promise.resolve();
      });

      // Verificamos que el toast no dijo "Se registró como mensaje preparado" sino el aviso de falla
      const llamadasToast = mockToast.mock.calls.map(c => c[0]?.description || '');
      expect(llamadasToast.some(desc => desc.includes('pero no se pudo anotar en la ficha'))).toBe(true);
      expect(llamadasToast.some(desc => desc.includes('Se registró como mensaje preparado, no como enviado.'))).toBe(false);

      act(() => root.unmount());
      host.remove();
    });
  });

  describe('4c. Carga de evento histórico en /admin/carga-historicos', () => {
    test('si saveFiesta falla, la acción devuelve success: false, no se crea notificación y no se borran presupuesto ni factura', async () => {
      mockSavePresupuesto.mockResolvedValueOnce({ success: true, id: 'pres_hist_1' });
      mockSaveInvoice.mockResolvedValueOnce({ success: true, id: 'inv_hist_1' });
      mockSaveFiesta.mockResolvedValueOnce({ success: false, error: 'Falla al guardar fiesta' });

      const fakeFile = {
        name: 'contrato.pdf',
        type: 'application/pdf',
        size: 100,
        arrayBuffer: async () => new ArrayBuffer(8),
      };

      const fd = new FormData();
      fd.append('clienteNombre', 'Cliente Histórico');
      fd.append('eventoFecha', '2024-05-10T00:00:00.000Z');
      fd.append('montoTotal', '50000');
      fd.append('contractFile', fakeFile as any);

      const resultado = await processHistoricRecord(fd);

      expect(resultado.success).toBe(false);
      expect(resultado.error).toBe('Se guardaron el presupuesto y la factura, pero no la fiesta. No vuelvas a cargarlo: avisale al administrador.');
      expect(mockCreateNotification).not.toHaveBeenCalled();
    });
  });
});

