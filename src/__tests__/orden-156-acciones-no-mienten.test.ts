/**
 * @jest-environment node
 *
 * Orden 156 (2, 7, 8, 9): las acciones no anuncian exito si no cambio nada, una lectura caida de
 * fiestas no se disfraza de "cero fiestas", y solo se cuenta como creado un aviso nuevo de verdad.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  // Sesión del dueño: el permiso de las plantillas lo prueba barrido-de-permisos-personal-y-operador.
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { perfil: 'dueno' } }),
}));

// --- plantillas ---
const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockDeleteDataItem = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readData: (...a: unknown[]) => mockReadData(...a),
  writeData: (...a: unknown[]) => mockWriteData(...a),
  deleteDataItem: (...a: unknown[]) => mockDeleteDataItem(...a),
}));

// --- control tower / preparacion / avisos ---
const mockGetAllFiestas = jest.fn();
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: (...a: unknown[]) => mockGetAllFiestas(...a),
  getFiestaById: jest.fn(),
}));
jest.mock('@/app/actions/dashboard', () => ({
  getDashboardKpiData: jest.fn().mockResolvedValue({ success: true, data: { fiestasFuturas: 3 } }),
}));
const mockGetPresupuestos = jest.fn();
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: (...a: unknown[]) => mockGetPresupuestos(...a) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: jest.fn().mockResolvedValue([]) }));
jest.mock('@/app/actions/notifications', () => ({ getNotifications: jest.fn().mockResolvedValue([]) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/lib/fiesta/preparation-score', () => ({ calculateFiestaPreparationScore: jest.fn(() => ({ score: 50 })) }));
const mockCreateNotification = jest.fn();
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: (...a: unknown[]) => mockCreateNotification(...a) }));
jest.mock('@/ai/genkit', () => ({ generateWithGeminiFallback: jest.fn(), getGeminiModelForAgent: jest.fn() }));
jest.mock('@/lib/ai/consumo-servidor', () => ({ hayPresupuestoParaIA: jest.fn(), registrarConsumoIA: jest.fn() }));

import { deleteInvitationTemplate } from '@/app/actions/invitacion-digital-templates';
import { getControlTowerData } from '@/app/actions/control-tower';
import { getAllFiestasPreparationScores } from '@/app/actions/preparation-score';
import { runSmartAutomations } from '@/app/actions/smart-automations';
import { createCommercialFollowupAlerts } from '@/app/actions/commercial-intelligence';

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAllFiestas.mockResolvedValue([]);
  mockGetPresupuestos.mockResolvedValue([]);
  mockDeleteDataItem.mockResolvedValue(true);
});

describe('borrar plantilla de invitacion', () => {
  test('una plantilla base (no guardada) NO anuncia exito ni escribe nada', async () => {
    const { getInvitationTemplates } = await import('@/app/actions/invitacion-digital-templates');
    mockReadData.mockResolvedValue([]);
    const base = (await getInvitationTemplates())[0]; // existe como base, no esta guardada
    const r = await deleteInvitationTemplate(base.id);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/base/i);
    expect(mockWriteData).not.toHaveBeenCalled();
    expect(mockDeleteDataItem).not.toHaveBeenCalled();
  });

  test('una plantilla propia guardada si se borra', async () => {
    const { getInvitationTemplates } = await import('@/app/actions/invitacion-digital-templates');
    mockReadData.mockResolvedValue([]);
    const base = (await getInvitationTemplates())[0];
    // La base editada queda guardada: ahi si hay algo que sacar.
    mockReadData.mockResolvedValue([{ ...base }]);
    const r = await deleteInvitationTemplate(base.id);
    expect(r.success).toBe(true);
    expect(mockDeleteDataItem).toHaveBeenCalledWith('invitacion-digital-templates.json', 'invitacion_digital_templates', base.id);
    expect(mockWriteData).not.toHaveBeenCalled();
  });
});

describe('lectura de fiestas caida', () => {
  test('Control Tower marca que las fiestas no se leyeron', async () => {
    mockGetAllFiestas.mockRejectedValue(new Error('proveedor caido'));
    const r = await getControlTowerData();
    expect(r.data.fiestasNoSeLeyeron).toBe(true);
  });

  test('Control Tower con fiestas leidas (aunque no haya ninguna) no marca fallo', async () => {
    mockGetAllFiestas.mockResolvedValue([]);
    const r = await getControlTowerData();
    expect(r.data.fiestasNoSeLeyeron).toBe(false);
  });

  test('Preparacion devuelve error, no exito con lista vacia', async () => {
    mockGetAllFiestas.mockRejectedValue(new Error('proveedor caido'));
    const r = await getAllFiestasPreparationScores();
    expect(r.success).toBe(false);
  });

  test('Preparacion con cero fiestas reales sigue siendo exito vacio', async () => {
    mockGetAllFiestas.mockResolvedValue([]);
    const r = await getAllFiestasPreparationScores();
    expect(r).toMatchObject({ success: true, data: [] });
  });
});

describe('contador de avisos creados', () => {
  const presupuestoViejo = () => ({
    id: 'p1', estado: 'Enviado', clienteNombre: 'Ana',
    timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
  });

  test('aviso silenciado por preferencias (success sin notification): no se cuenta', async () => {
    mockGetPresupuestos.mockResolvedValue([presupuestoViejo()]);
    mockCreateNotification.mockResolvedValue({ success: true, notification: undefined, isDuplicate: false });
    const r = await runSmartAutomations();
    expect(r.results).toHaveLength(1);
    expect(r.results[0].created).toBe(false);
    expect(r.created).toBe(0);
  });

  test('aviso repetido (isDuplicate): no se cuenta', async () => {
    mockGetPresupuestos.mockResolvedValue([presupuestoViejo()]);
    mockCreateNotification.mockResolvedValue({ success: true, notification: { id: 'n1' }, isDuplicate: true });
    const r = await runSmartAutomations();
    expect(r.created).toBe(0);
  });

  test('aviso nuevo de verdad: se cuenta', async () => {
    mockGetPresupuestos.mockResolvedValue([presupuestoViejo()]);
    mockCreateNotification.mockResolvedValue({ success: true, notification: { id: 'n1' }, isDuplicate: false });
    const r = await runSmartAutomations();
    expect(r.created).toBe(1);
    expect(r.results[0].created).toBe(true);
  });

  test('"Crear avisos" comerciales: silenciado no cuenta como creado', async () => {
    mockGetPresupuestos.mockResolvedValue([presupuestoViejo()]);
    mockCreateNotification.mockResolvedValue({ success: true, notification: undefined });
    const r = await createCommercialFollowupAlerts();
    expect(r.total).toBeGreaterThan(0);
    expect(r.created).toBe(0);
  });

  test('"Crear avisos" comerciales: uno nuevo si cuenta', async () => {
    mockGetPresupuestos.mockResolvedValue([presupuestoViejo()]);
    mockCreateNotification.mockResolvedValue({ success: true, notification: { id: 'n9', entidadRelacionadaId: 'x' } });
    const r = await createCommercialFollowupAlerts();
    expect(r.created).toBe(1);
  });
});
