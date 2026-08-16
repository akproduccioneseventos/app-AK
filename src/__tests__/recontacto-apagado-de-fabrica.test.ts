/**
 * El recontacto manda WhatsApp a clientes reales. Estas pruebas cuidan lo único
 * que no se puede deshacer: que no salga un mensaje sin que el dueño lo haya
 * prendido a propósito.
 */

const enviados: unknown[] = [];
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
  processUnbookedLeadsRemarketing: jest.fn(async (candidatos: { id: string; phone: string }[]) => {
    enviados.push(...candidatos);
    return {
      processedCount: candidatos.length,
      sentCount: candidatos.length,
      failedCount: 0,
      skippedCount: 0,
      details: candidatos.map((c) => ({ leadId: c.id, phone: c.phone, success: true })),
    };
  }),
}));

const AHORA = new Date('2026-08-12T12:00:00.000Z');
const HACE_TRES_DIAS = new Date(AHORA.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

const LEAD_QUE_CALIFICA = {
  id: 'l1',
  name: 'Ana Pérez',
  phone: '099123456',
  createdAt: HACE_TRES_DIAS,
  updatedAt: HACE_TRES_DIAS,
  currentStageId: 's1',
  partyType: 'Casamiento',
  marketingConsent: true,
};

describe('el recontacto automático viene apagado', () => {
  beforeEach(() => {
    enviados.length = 0;
    for (const clave of Object.keys(escrituras)) delete escrituras[clave];
    archivos = { 'crm-leads.json': [LEAD_QUE_CALIFICA] };
    jest.resetModules();
  });

  it('sin haberlo prendido no manda NINGÚN mensaje, aunque haya a quién', async () => {
    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');

    const resultado = await correrRecontactoAutomatico(AHORA);

    expect(enviados).toEqual([]);
    expect(resultado.enviados).toBe(0);
    expect(resultado.corrio).toBe(false);
    expect(resultado.motivo).toBe('el recontacto automatico esta apagado');
  });

  it('un archivo de ajustes a medio escribir tampoco lo prende', async () => {
    archivos['marketing-recontacto.json'] = { activo: 'si' };
    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');

    await correrRecontactoAutomatico(AHORA);

    expect(enviados).toEqual([]);
  });

  it('prendido a propósito sí le escribe, y lo anota para no repetir', async () => {
    archivos['marketing-recontacto.json'] = { activo: true };
    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');

    const resultado = await correrRecontactoAutomatico(AHORA);

    expect(resultado.enviados).toBe(1);
    const guardados = escrituras['crm-leads.json'] as { recontactoAutomaticoAt?: string }[];
    expect(guardados[0].recontactoAutomaticoAt).toBe(AHORA.toISOString());
  });

  it('al que ya se le escribió no se le escribe de nuevo', async () => {
    archivos['marketing-recontacto.json'] = { activo: true };
    archivos['crm-leads.json'] = [
      { ...LEAD_QUE_CALIFICA, recontactoAutomaticoAt: '2026-08-01T00:00:00.000Z' },
    ];
    const { correrRecontactoAutomatico } = await import('@/lib/marketing/recontacto-automatico');

    const resultado = await correrRecontactoAutomatico(AHORA);

    expect(enviados).toEqual([]);
    expect(resultado.enviados).toBe(0);
  });
});
