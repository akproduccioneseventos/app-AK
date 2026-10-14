/**
 * Orden 156, defectos 3 a 6: si la acción falla (devuelve success:false o tira por la red), la
 * pantalla no puede decir "Todo tranquilo" / "No hay fiestas recientes" ni callar el fallo:
 * muestra un error persistente con Reintentar, separado del vacío confirmado.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const getCommercialFollowups = jest.fn();
const createCommercialFollowupAlerts = jest.fn();
const getPostEventOpportunities = jest.fn();
const runSmartAutomations = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('@/app/actions/commercial-intelligence', () => ({
  getCommercialFollowups: (...a: unknown[]) => getCommercialFollowups(...a),
  createCommercialFollowupAlerts: (...a: unknown[]) => createCommercialFollowupAlerts(...a),
  generateAiCommercialFollowup: jest.fn(),
}));
jest.mock('@/app/actions/post-event-intelligence', () => ({
  getPostEventOpportunities: (...a: unknown[]) => getPostEventOpportunities(...a),
  createPostEventPackage: jest.fn(),
  generateAiPostEventMaterial: jest.fn(),
}));
jest.mock('@/app/actions/smart-automations', () => ({ runSmartAutomations: (...a: unknown[]) => runSmartAutomations(...a) }));

import Comercial from '@/app/control-tower/comercial/page';
import PostFiesta from '@/app/control-tower/post-fiesta/page';
import Automatizaciones from '@/app/control-tower/automatizaciones/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });
beforeEach(() => { [getCommercialFollowups, createCommercialFollowupAlerts, getPostEventOpportunities, runSmartAutomations].forEach((m) => m.mockReset()); });

async function montar(C: React.ComponentType) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<C />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}
const boton = (host: HTMLElement, texto: string) =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(texto))!;

const fallas: Array<[string, () => Promise<any>]> = [
  ['success:false', () => Promise.resolve({ success: false, data: [], results: [], created: 0, total: 0 })],
  ['excepción de red', () => Promise.reject(new Error('Failed to fetch'))],
];

describe.each(fallas)('con %s', (_n, falla) => {
  test('comercial: error con Reintentar y sin "Todo tranquilo"; reintentar recupera', async () => {
    getCommercialFollowups.mockImplementationOnce(falla);
    const { host, cerrar } = await montar(Comercial);
    expect(host.textContent).toContain('No se pudieron leer los seguimientos');
    expect(host.textContent).not.toContain('Todo tranquilo');
    getCommercialFollowups.mockResolvedValueOnce({ success: true, data: [] });
    await act(async () => { boton(host, 'Reintentar').click(); });
    expect(host.textContent).toContain('Todo tranquilo');
    expect(host.textContent).not.toContain('No se pudieron leer');
    cerrar();
  });

  test('post-fiesta: error con Reintentar y sin "No hay fiestas recientes"', async () => {
    getPostEventOpportunities.mockImplementationOnce(falla);
    const { host, cerrar } = await montar(PostFiesta);
    expect(host.textContent).toContain('No se pudieron leer las fiestas recientes');
    expect(host.textContent).not.toContain('No hay fiestas recientes');
    expect(boton(host, 'Reintentar')).toBeTruthy();
    cerrar();
  });

  test('automatizaciones: avisa que la revisión no se completó y no dice "Revisión completa"', async () => {
    runSmartAutomations.mockImplementationOnce(falla);
    const { host, cerrar } = await montar(Automatizaciones);
    await act(async () => { boton(host, 'Ejecutar revisión').click(); });
    expect(host.textContent).toContain('La revisión no se pudo completar');
    expect(host.textContent).not.toContain('Revisión completa');
    expect((boton(host, 'Ejecutar revisión') as HTMLButtonElement).disabled).toBe(false);
    cerrar();
  });

  test('comercial: "Crear avisos" fallido informa el error y no dice "Avisos creados"', async () => {
    getCommercialFollowups.mockResolvedValue({ success: true, data: [] });
    createCommercialFollowupAlerts.mockImplementationOnce(falla);
    const { host, cerrar } = await montar(Comercial);
    await act(async () => { boton(host, 'Crear avisos').click(); });
    expect(host.textContent).toContain('No se pudieron crear los avisos');
    expect(host.textContent).not.toContain('Avisos creados');
    cerrar();
  });
});
