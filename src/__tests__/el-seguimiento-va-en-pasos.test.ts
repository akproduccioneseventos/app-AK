/**
 * El seguimiento de prospectos en varios pasos (días 2, 7 y 15).
 * Comprueba que:
 * - Día 2 manda paso 1
 * - Día 7 manda paso 2 y no repite paso 1
 * - Si contestó en el medio (lastInboundAt), no manda nada más
 * - Apagado no manda nada
 */

const enviados: Array<{ leadId: string; phone: string; paso?: number }> = [];
const escrituras: Record<string, unknown> = {};
let archivos: Record<string, unknown> = {};

jest.mock('server-only', () => ({}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: unknown) =>
    archivo in archivos ? archivos[archivo] : porDefecto,
  ),
  writeData: jest.fn(async (archivo: string, datos: unknown) => {
    escrituras[archivo] = datos;
  }),
}));

jest.mock('@/lib/marketing/whatsapp-remarketing', () => ({
  processUnbookedLeadsRemarketing: jest.fn(
    async (candidatos: Array<{ id: string; phone: string; paso?: number }>) => {
      enviados.push(...candidatos);
      return {
        processedCount: candidatos.length,
        sentCount: candidatos.length,
        failedCount: 0,
        skippedCount: 0,
        details: candidatos.map((c) => ({ leadId: c.id, phone: c.phone, success: true })),
      };
    },
  ),
}));

const AHORA = new Date('2026-08-15T12:00:00.000Z');
const haceDias = (dias: number) =>
  new Date(AHORA.getTime() - dias * 24 * 60 * 60 * 1000).toISOString();

describe('el seguimiento de prospectos va en pasos (2, 7 y 15 días)', () => {
  beforeEach(() => {
    enviados.length = 0;
    for (const clave of Object.keys(escrituras)) delete escrituras[clave];
    archivos = {};
    jest.resetModules();
  });

  it('apagado no manda nada', async () => {
    archivos['marketing-recontacto.json'] = { activo: false };
    archivos['crm-leads.json'] = [
      {
        id: 'l-apagado',
        name: 'Carlos',
        phone: '099111222',
        createdAt: haceDias(3),
        updatedAt: haceDias(3),
        currentStageId: 's1',
        marketingConsent: true,
      },
    ];

    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');
    const res = await correrRecontactoAutomatico(AHORA);

    expect(enviados).toEqual([]);
    expect(res.enviados).toBe(0);
    expect(res.corrio).toBe(false);
  });

  it('a los 2 días manda el paso 1', async () => {
    archivos['marketing-recontacto.json'] = { activo: true };
    archivos['crm-leads.json'] = [
      {
        id: 'l-paso-1',
        name: 'Lucía',
        phone: '099333444',
        createdAt: haceDias(2.5),
        updatedAt: haceDias(2.5),
        currentStageId: 's1',
        marketingConsent: true,
      },
    ];

    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');
    const res = await correrRecontactoAutomatico(AHORA);

    expect(res.enviados).toBe(1);
    expect(enviados[0].paso).toBe(1);
    const guardados = escrituras['crm-leads.json'] as Array<{
      id: string;
      recontactosEnviados?: Array<{ paso: number; at: string }>;
    }>;
    expect(guardados[0].recontactosEnviados).toEqual([
      { paso: 1, at: AHORA.toISOString() },
    ]);
  });

  it('a los 7 días manda el paso 2 y no repite el paso 1', async () => {
    archivos['marketing-recontacto.json'] = { activo: true };
    archivos['crm-leads.json'] = [
      {
        id: 'l-paso-2',
        name: 'Martín',
        phone: '099555666',
        createdAt: haceDias(7.5),
        updatedAt: haceDias(5),
        currentStageId: 's1',
        marketingConsent: true,
        recontactoAutomaticoAt: haceDias(5.5),
        recontactosEnviados: [{ paso: 1, at: haceDias(5.5) }],
      },
    ];

    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');
    const res = await correrRecontactoAutomatico(AHORA);

    expect(res.enviados).toBe(1);
    expect(enviados[0].paso).toBe(2);
    const guardados = escrituras['crm-leads.json'] as Array<{
      id: string;
      recontactosEnviados?: Array<{ paso: number; at: string }>;
    }>;
    expect(guardados[0].recontactosEnviados).toHaveLength(2);
    expect(guardados[0].recontactosEnviados?.[1]).toEqual({
      paso: 2,
      at: AHORA.toISOString(),
    });
  });

  it('si el cliente contestó en el medio (lastInboundAt), no manda nada más', async () => {
    archivos['marketing-recontacto.json'] = { activo: true };
    archivos['crm-leads.json'] = [
      {
        id: 'l-respondio',
        name: 'Valeria',
        phone: '099777888',
        createdAt: haceDias(8),
        updatedAt: haceDias(4),
        currentStageId: 's1',
        marketingConsent: true,
        recontactoAutomaticoAt: haceDias(6),
        recontactosEnviados: [{ paso: 1, at: haceDias(6) }],
        lastInboundAt: haceDias(4), // Contestó hace 4 días
      },
    ];

    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');
    const res = await correrRecontactoAutomatico(AHORA);

    expect(enviados).toEqual([]);
    expect(res.enviados).toBe(0);
  });
});
