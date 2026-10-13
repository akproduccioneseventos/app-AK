import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const mockTowerRead = jest.fn();
const mockPreparationRead = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
jest.mock('@/app/actions/control-tower', () => ({ getControlTowerData: (...args: unknown[]) => mockTowerRead(...args) }));
jest.mock('@/app/actions/preparation-score', () => ({ getAllFiestasPreparationScores: (...args: unknown[]) => mockPreparationRead(...args) }));

import ControlTowerPage from '@/app/control-tower/page';
import PreparationScoresPage from '@/app/control-tower/preparacion/page';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const towerEmpty = { success: true as const, data: { kpis: { fiestasFuturas: 0, prospectosActivos: 0, presupuestosPendientes: 0, totalPendiente: 'UYU 0', notificacionesNoLeidas: 0, proximoEvento: null }, items: [], priorityScore: 0, generatedAt: '2026-10-12T00:00:00.000Z' } };
const towerWithItem = { success: true as const, data: { ...towerEmpty.data, items: [{ id: 'old-item', title: 'Prioridad anterior', description: 'Dato que ya se había cargado.', href: '/control-tower', priority: 'media' as const, area: 'agenda' as const }] } };
const preparationEmpty = { success: true as const, data: [] };
const preparationWithEvent = { success: true as const, data: [{ fiestaId: 'fixture-1', nombreEvento: 'Evento visible', fechaEvento: null, score: { score: 70, level: 'alta' as const, label: 'En buen camino', summary: 'Resumen de prueba', importantPending: [] } }] };

describe('Control Tower: error de lectura, conservación y reintento', () => {
  let roots: Root[] = [];
  let hosts: HTMLDivElement[] = [];
  const text = () => document.body.textContent || '';

  async function mount(Component: React.ComponentType) {
    const host = document.body.appendChild(document.createElement('div'));
    hosts.push(host);
    const root = createRoot(host);
    roots.push(root);
    await act(async () => { root.render(<Component />); });
  }

  async function click(label: string) {
    const button = Array.from(document.querySelectorAll('button')).find(item => item.textContent?.includes(label));
    if (!button) throw new Error(`Falta el botón ${label}`);
    await act(async () => { button.click(); });
  }

  beforeEach(() => { jest.clearAllMocks(); });
  afterEach(() => {
    for (const root of roots) act(() => root.unmount());
    roots = [];
    for (const host of hosts) host.remove();
    hosts = [];
    document.body.replaceChildren();
  });

  it('conserva prioridades anteriores si falla el refresco y el reintento recupera', async () => {
    mockTowerRead.mockResolvedValueOnce(towerWithItem).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(towerEmpty);
    await mount(ControlTowerPage);
    expect(text()).toContain('Prioridad anterior');

    await click('Actualizar');
    expect(text()).toContain('No se pudieron cargar');
    expect(text()).toContain('Prioridad anterior');
    await click('Reintentar');
    expect(mockTowerRead).toHaveBeenCalledTimes(3);
    expect(text()).toContain('Todo tranquilo por ahora');
  });

  it('preparación distingue vacío genuino del error inicial y el reintento recupera', async () => {
    mockPreparationRead.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(preparationEmpty);
    await mount(PreparationScoresPage);
    expect(text()).toContain('No se pudieron cargar las fiestas');
    expect(text()).not.toContain('No hay fiestas para revisar');

    await click('Reintentar');
    expect(mockPreparationRead).toHaveBeenCalledTimes(2);
    expect(text()).toContain('No hay fiestas para revisar');
  });

  it('un refresco fallido de preparación conserva los datos anteriores hasta recuperarse', async () => {
    mockPreparationRead.mockResolvedValueOnce(preparationWithEvent).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(preparationEmpty);
    await mount(PreparationScoresPage);
    expect(text()).toContain('Evento visible');

    await click('Actualizar');
    expect(text()).toContain('No se pudieron cargar las fiestas');
    expect(text()).toContain('Evento visible');

    await click('Reintentar');
    expect(mockPreparationRead).toHaveBeenCalledTimes(3);
    expect(text()).toContain('No hay fiestas para revisar');
    expect(text()).not.toContain('Evento visible');
  });

  it('un fallo inicial del dashboard nunca presenta indicadores como ceros', async () => {
    mockTowerRead.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(towerEmpty);
    await mount(ControlTowerPage);
    expect(text()).toContain('No se pudieron cargar');
    expect(text()).not.toContain('Todo tranquilo por ahora');
    expect(text()).not.toContain('Fiestas próximas');

    await click('Reintentar');
    expect(text()).toContain('Todo tranquilo por ahora');
  });
});
