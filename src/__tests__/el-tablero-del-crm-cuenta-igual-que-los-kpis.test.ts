/**
 * Orden 292 — Bloque 3: El tablero del CRM cuenta igual que los KPIs.
 *
 * getCrmBoardData y getCrmKpiData deben calcular activos, embudo (pipeline) y
 * tasa de conversión usando las mismas funciones idsDeEtapaGanadora e idsDeEtapaPerdida,
 * respetando las etapas personalizadas configuradas en el embudo.
 */

const mockStages = [
  { id: 'etapa_contacto', name: 'Primer Contacto', order: 1 },
  { id: 'etapa_propuesta', name: 'Propuesta Enviada', order: 2 },
  { id: 'etapa_ganada_custom', name: 'Contrato Firmado', order: 3, isConversionStage: true },
  { id: 'etapa_perdida_custom', name: 'No Contrató', order: 4 },
];

const mockPresupuestos = [
  { id: 'p_activo', totalConDescuento: 100, costoTotalEstimado: 100 },
  { id: 'p_ganado', totalConDescuento: 200, costoTotalEstimado: 200 },
  { id: 'p_perdido', totalConDescuento: 300, costoTotalEstimado: 300 },
];

const mockLeads = [
  { id: 'l1', name: 'Lead Activo', currentStageId: 'etapa_propuesta', presupuestoId: 'p_activo' },
  { id: 'l2', name: 'Lead Ganado', currentStageId: 'etapa_ganada_custom', presupuestoId: 'p_ganado' },
  { id: 'l3', name: 'Lead Perdido', currentStageId: 'etapa_perdida_custom', presupuestoId: 'p_perdido' },
];

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => {
    if (file === 'crm-stages.json') return mockStages;
    if (file === 'crm-leads.json') return mockLeads;
    if (file === 'presupuestos.json') return mockPresupuestos;
    return fallback;
  }),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => {}),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { id: 'u1', username: 'admin', role: 'admin' } })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true, user: { id: 'u1', username: 'admin', role: 'admin' } })),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({
    success: true,
    user: { id: 'u1', username: 'admin', role: 'admin', permissions: ['*'] },
  }),
}));

jest.mock('@/lib/fiesta/leer-fiestas', () => ({
  leerFiestasCrudas: jest.fn().mockResolvedValue([]),
}));

import { getCrmBoardData, getCrmKpiData } from '@/app/actions/crm';

describe('Bloque 3 — El tablero del CRM cuenta igual que los indicadores', () => {
  it('con etapas personalizadas, ambas funciones dan 1 activo, embudo 100 y conversión 50%', async () => {
    const resKpi = await getCrmKpiData();
    const resBoard = await getCrmBoardData();

    expect(resKpi.success).toBe(true);
    expect(resBoard.success).toBe(true);

    const kpi = resKpi.data!;
    const boardKpi = resBoard.data!.kpis;

    // Activos: solo l1 está en etapa activa
    expect(kpi.activeLeads).toBe(1);
    expect(boardKpi.activeLeads).toBe(1);

    // Embudo (pipelineValue): 100 (solo el presupuesto del activo)
    expect(kpi.pipelineValue).toBe(100);
    expect(boardKpi.pipelineValue).toBe(100);

    // Ganados y perdidos
    expect(kpi.wonLeads).toBe(1);
    expect(boardKpi.wonLeads).toBe(1);
    expect(kpi.lostLeads).toBe(1);
    expect(boardKpi.lostLeads).toBe(1);

    // Conversión: 1 ganado / (1 ganado + 1 perdido) = 50%
    expect(kpi.conversionRate).toBe(50);
    expect(boardKpi.conversionRate).toBe(50);
  });
});
