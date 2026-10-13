const dashboard = jest.fn();
const fiestas = jest.fn();
const presupuestos = jest.fn();
const leads = jest.fn();
const notifications = jest.fn();
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/dashboard', () => ({ getDashboardKpiData: (...args: unknown[]) => dashboard(...args) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: (...args: unknown[]) => fiestas(...args) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: (...args: unknown[]) => presupuestos(...args) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: (...args: unknown[]) => leads(...args) }));
jest.mock('@/app/actions/notifications', () => ({ getNotifications: (...args: unknown[]) => notifications(...args) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn() }));
import { getControlTowerData } from '@/app/actions/control-tower';
import { getAllFiestasPreparationScores } from '@/app/actions/preparation-score';

describe('las acciones no confunden lecturas fallidas con calma', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    dashboard.mockResolvedValue({ success: true, data: {} });
    for (const read of [fiestas, presupuestos, leads, notifications]) read.mockResolvedValue([]);
  });
  it.each([['fiestas', fiestas], ['presupuestos', presupuestos], ['leads', leads], ['notificaciones', notifications]])('rechaza la lectura fallida de %s', async (_name, read) => {
    (read as jest.Mock).mockRejectedValueOnce(new Error('lectura fallida'));
    expect((await getControlTowerData()).success).toBe(false);
  });
  it('no inventa indicadores cero cuando falla el dashboard', async () => {
    dashboard.mockResolvedValue({ success: false, error: 'sin datos' });
    expect((await getControlTowerData()).success).toBe(false);
  });
  it('acepta vacio genuino y preparación distingue un fallo del siguiente reintento', async () => {
    expect((await getControlTowerData()).success).toBe(true);
    fiestas.mockRejectedValueOnce(new Error('offline'));
    expect((await getAllFiestasPreparationScores()).success).toBe(false);
    expect(await getAllFiestasPreparationScores()).toEqual({ success: true, data: [] });
  });
});
