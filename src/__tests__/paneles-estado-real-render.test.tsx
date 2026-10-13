import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
const tower = jest.fn(), prep = jest.fn(), google = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
jest.mock('@/app/actions/control-tower', () => ({ getControlTowerData: (...args: unknown[]) => tower(...args) }));
jest.mock('@/app/actions/preparation-score', () => ({ getAllFiestasPreparationScores: (...args: unknown[]) => prep(...args) }));
jest.mock('@/app/actions/google-workspace', () => ({ getGoogleWorkspaceDashboard: (...args: unknown[]) => google(...args), syncAllFiestasToGoogleWorkspace: jest.fn(), syncFiestaAndNotifyStaff: jest.fn() }));
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyGuestsWithCalendarLinks: jest.fn() }));
import TowerPage from '@/app/control-tower/page';
import PrepPage from '@/app/control-tower/preparacion/page';
import GooglePage from '@/app/(app)/settings/google-workspace/page';
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement, root: Root;
async function mount(Component: React.ComponentType) {
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  await act(async () => { root.render(<Component />); });
}
async function click(label: string) {
  const button = [...host.querySelectorAll('button')].find(b => b.textContent?.includes(label));
  if (!button) throw new Error('Missing button: ' + label);
  await act(async () => button.click());
}
afterEach(() => { if (root) act(() => root.unmount()); host?.remove(); jest.resetAllMocks(); });
describe('paneles muestran el estado real con reintento', () => {
  it('torre falla sin ceros, reintenta y conserva la última lista si falla actualizar', async () => {
    tower.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ success: true, data: { kpis: {}, items: [{ id: 'i1', title: 'Pendiente real', description: 'Dato anterior', href: '/alertas', priority: 'alta', area: 'sistema' }] } }).mockRejectedValueOnce(new Error('offline'));
    await mount(TowerPage);
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.textContent).not.toContain('Todo tranquilo');
    expect(host.textContent).not.toContain('Fiestas próximas');
    await click('Reintentar');
    expect(host.textContent).toContain('Pendiente real');
    await click('Actualizar');
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    expect(host.textContent).toContain('Pendiente real');
  });
  it('preparacion no anuncia vacio ante fallo y reintenta', async () => {
    prep.mockResolvedValueOnce({ success: false, error: 'No se pudieron cargar las fiestas.' }).mockResolvedValueOnce({ success: true, data: [] });
    await mount(PrepPage);
    expect(host.textContent).not.toContain('No hay fiestas para revisar');
    await click('Reintentar');
    expect(host.textContent).toContain('No hay fiestas para revisar');
  });
  it.each(['needs_reconnect', 'error'])('Google %s no es conectado y conserva empleados con problemas', async status => {
    google.mockResolvedValue({ configured: true, missingConfig: [], companyAccount: { status, email: 'qa@example.invalid', lastError: 'Permiso retirado' }, connectedEmployees: [{ id: 'a', email: 'ok@example.invalid', status: 'connected' }, { id: 'b', email: 'error@example.invalid', status: 'error' }], employeeCount: 2, contactsEnabled: false });
    await mount(GooglePage);
    expect(host.textContent).toContain('1/2');
    expect(host.textContent).toContain('50% del equipo');
    expect(host.textContent).toContain('Permiso retirado');
    expect(host.textContent).toContain('error@example.invalid');
    const sync = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Sincronizar fiestas'));
    expect(sync?.disabled).toBe(true);
  });
  it('cuenta conectada no depende de OAuth configurado y un fallo de lectura admite reintento', async () => {
    google.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ configured: false, missingConfig: ['OAuth'], companyAccount: { status: 'connected', email: 'sa@example.invalid' }, connectedEmployees: [], employeeCount: 0 });
    await mount(GooglePage);
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
    await click('Reintentar');
    const sync = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Sincronizar fiestas'));
    expect(sync?.disabled).toBe(false);
    expect(host.textContent).toContain('Conectada');
  });
});
