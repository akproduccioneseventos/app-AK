import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const commercialRead = jest.fn();
const commercialCreate = jest.fn();
const postRead = jest.fn();
const automationRun = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));
jest.mock('@/app/actions/commercial-intelligence', () => ({
  getCommercialFollowups: (...args: unknown[]) => commercialRead(...args),
  createCommercialFollowupAlerts: (...args: unknown[]) => commercialCreate(...args),
  generateAiCommercialFollowup: jest.fn(),
}));
jest.mock('@/app/actions/post-event-intelligence', () => ({
  getPostEventOpportunities: (...args: unknown[]) => postRead(...args),
  createPostEventPackage: jest.fn(),
  generateAiPostEventMaterial: jest.fn(),
}));
jest.mock('@/app/actions/smart-automations', () => ({ runSmartAutomations: (...args: unknown[]) => automationRun(...args) }));

import CommercialPage from '@/app/control-tower/comercial/page';
import PostEventPage from '@/app/control-tower/post-fiesta/page';
import AutomationsPage from '@/app/control-tower/automatizaciones/page';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('Control tower: fallos visibles y recuperables', () => {
  let root: Root | undefined;
  let host: HTMLDivElement;
  async function mount(Component: React.ComponentType) {
    host = document.body.appendChild(document.createElement('div'));
    root = createRoot(host);
    const mounted = root;
    await act(async () => { mounted.render(<Component />); });
  }
  async function click(text: string) {
    const button = Array.from(host!.querySelectorAll('button')).find((item) => item.textContent?.includes(text));
    if (!button) throw new Error('Missing button: ' + text);
    await act(async () => { button.click(); });
  }
  afterEach(() => {
    if (root) { const mounted = root; act(() => mounted.unmount()); }
    root = undefined;
    host?.remove();
    document.body.replaceChildren();
    jest.resetAllMocks();
  });

  it('commercial read failure is not calm-empty and retry recovers', async () => {
    commercialRead.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: [] });
    await mount(CommercialPage);
    expect(host.textContent).toContain('No se pudieron cargar los seguimientos');
    expect(host.textContent).not.toContain('Todo tranquilo');
    await click('Reintentar');
    expect(commercialRead).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('Todo tranquilo');
  });

  it('post-event read failure is not empty and retry recovers', async () => {
    postRead.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ data: [] });
    await mount(PostEventPage);
    expect(host.textContent).toContain('No se pudieron cargar las fiestas');
    expect(host.textContent).not.toContain('No hay fiestas recientes');
    await click('Reintentar');
    expect(postRead).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('No hay fiestas recientes');
  });

  it('automation failure is shown and button can recover', async () => {
    automationRun.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ created: 0, results: [] });
    await mount(AutomationsPage);
    await click('Ejecutar revisión inteligente');
    expect(host.textContent).toContain('No se pudo ejecutar la revisión inteligente');
    await click('Ejecutar revisión inteligente');
    expect(automationRun).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('Revisión completa');
  });

  it('commercial alert creation failure is shown and button can recover', async () => {
    commercialRead.mockResolvedValue({ data: [] });
    commercialCreate.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ created: 0, total: 0 });
    await mount(CommercialPage);
    await click('Crear avisos');
    expect(host.textContent).toContain('No se pudieron crear los avisos');
    await click('Crear avisos');
    expect(commercialCreate).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain('Avisos creados: 0');
  });
});
