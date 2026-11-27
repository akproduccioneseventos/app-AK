/** @jest-environment node */

jest.mock('server-only', () => ({}));

const mockStore: Record<string, any> = {};
const mockWriteData = jest.fn(async (file: string, data: any) => {
  mockStore[file] = JSON.parse(JSON.stringify(data));
});
const mockMutateDataItem = jest.fn(async (file: string, _col: string, id: string, fn: (actual: any) => any) => {
  const lista: any[] = Array.isArray(mockStore[file]) ? mockStore[file] : [];
  const idx = lista.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  const actualizado = fn(JSON.parse(JSON.stringify(lista[idx])));
  if (!actualizado) return null;
  lista[idx] = actualizado;
  mockStore[file] = lista;
  return actualizado;
});

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) =>
    file in mockStore ? JSON.parse(JSON.stringify(mockStore[file])) : def,
  ),
  writeData: (...args: any[]) => (mockWriteData as any)(...args),
  mutateDataItem: (...args: any[]) => (mockMutateDataItem as any)(...args),
}));

const mockRemarketing = jest.fn();
jest.mock('@/lib/marketing/whatsapp-remarketing', () => ({
  processUnbookedLeadsRemarketing: (...args: any[]) => mockRemarketing(...args),
}));

const mockCreateNotification = jest.fn(async () => ({ success: true }));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: (...args: any[]) => mockCreateNotification(...args),
}));

jest.mock('@/lib/blog-ai-generator', () => ({
  generateBlogPostAndSocialDraft: jest.fn(),
}));

jest.mock('@/app/actions/social-media', () => ({
  syncInstagramPosts: jest.fn().mockResolvedValue({ success: true, photosCount: 0, videosCount: 0, plannerCount: 0 }),
}));

import { correrRecontactoAutomatico } from '@/lib/marketing/recontacto-automatico';
import { runMarketingAutomation } from '@/lib/marketing-automation';

const AHORA = new Date('2026-11-26T15:00:00.000Z');
const HACE_TRES_DIAS = new Date(AHORA.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

describe('Orden 367 B1.2 & Orden 372 B2.4 — El recontacto no pisa prospectos ni miente si falló todo', () => {
  beforeEach(() => {
    for (const k of Object.keys(mockStore)) delete mockStore[k];
    jest.clearAllMocks();
    mockStore['marketing-recontacto.json'] = { activo: true };
  });

  it('guarda de a un prospecto con mutateDataItem sin pisar lastInboundAt ni prospectos nuevos', async () => {
    mockStore['crm-leads.json'] = [
      {
        id: 'lead-1',
        name: 'Laura Gómez',
        phone: '099111222',
        createdAt: HACE_TRES_DIAS,
        updatedAt: HACE_TRES_DIAS,
        currentStageId: 's1',
        marketingConsent: true,
      },
    ];

    // Mientras se manda el WhatsApp, el prospecto responde (lastInboundAt) y entra lead-2 en la base
    mockRemarketing.mockImplementationOnce(async (candidatos: any[]) => {
      mockStore['crm-leads.json'][0].lastInboundAt = '2026-11-26T14:59:50.000Z';
      mockStore['crm-leads.json'].push({
        id: 'lead-2',
        name: 'Nuevo Concurrente',
        phone: '099888999',
        createdAt: AHORA.toISOString(),
        updatedAt: AHORA.toISOString(),
        currentStageId: 's1',
      });
      return {
        processedCount: candidatos.length,
        sentCount: 1,
        failedCount: 0,
        skippedCount: 0,
        details: [{ leadId: 'lead-1', phone: '099111222', success: true }],
      };
    });

    const res = await correrRecontactoAutomatico(AHORA);

    expect(res.corrio).toBe(true);
    expect(res.enviados).toBe(1);
    expect(mockMutateDataItem).toHaveBeenCalledTimes(1);
    expect(mockMutateDataItem).toHaveBeenCalledWith(
      'crm-leads.json',
      'prospectos',
      'lead-1',
      expect.any(Function),
    );
    expect(mockWriteData).not.toHaveBeenCalledWith('crm-leads.json', expect.anything());

    const leadsEnBase = mockStore['crm-leads.json'];
    expect(leadsEnBase).toHaveLength(2);
    expect(leadsEnBase[0].lastInboundAt).toBe('2026-11-26T14:59:50.000Z');
    expect(leadsEnBase[0].recontactoAutomaticoAt).toBe(AHORA.toISOString());
    expect(leadsEnBase[0].lastContactedAt).toBe(AHORA.toISOString());
    expect(leadsEnBase[0].lastContactMethod).toBe('whatsapp');
    expect(leadsEnBase[1].id).toBe('lead-2');
  });

  it('si había elegibles y enviados === 0, devuelve corrio: false, avisa al dueño y no marca lastRecontactoAt', async () => {
    mockStore['crm-leads.json'] = [
      {
        id: 'lead-err',
        name: 'Carlos Ruiz',
        phone: '099333444',
        createdAt: HACE_TRES_DIAS,
        updatedAt: HACE_TRES_DIAS,
        currentStageId: 's1',
        marketingConsent: true,
      },
    ];
    mockStore['marketing-automation-state.json'] = {
      lastSeoRunAt: AHORA.toISOString(),
      lastInstagramSyncAt: AHORA.toISOString(),
    };

    mockRemarketing.mockResolvedValue({
      processedCount: 1,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 1,
      details: [{ leadId: 'lead-err', phone: '099333444', success: false, error: 'Sin credenciales WhatsApp' }],
    });

    const resRecontacto = await correrRecontactoAutomatico(AHORA);
    expect(resRecontacto.corrio).toBe(false);
    expect(resRecontacto.elegidos).toBe(1);
    expect(resRecontacto.enviados).toBe(0);
    expect(resRecontacto.motivo).toContain('Sin credenciales WhatsApp');
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        rolDestino: 'admin',
        tipo: 'alerta',
      }),
    );

    const resAuto = await runMarketingAutomation({
      source: 'cron',
      includeSeo: false,
      includeInstagram: false,
      includeRecontacto: true,
    });
    expect(resAuto.success).toBe(false);
    expect(mockStore['marketing-automation-state.json']?.lastRecontactoAt).toBeUndefined();
  });
});
