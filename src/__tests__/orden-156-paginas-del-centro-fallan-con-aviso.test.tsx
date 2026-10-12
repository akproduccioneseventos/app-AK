/**
 * Orden 156 (3 a 6 y 7, 8): cuando una accion de red falla, la pantalla lo dice, conserva lo que
 * ya tenia y permite reintentar; nunca dice "todo tranquilo" ni "revision completa" sin haber leido.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

const mockFollowups = jest.fn();
const mockCrearAvisos = jest.fn();
jest.mock('@/app/actions/commercial-intelligence', () => ({
  getCommercialFollowups: (...a: unknown[]) => mockFollowups(...a),
  createCommercialFollowupAlerts: (...a: unknown[]) => mockCrearAvisos(...a),
  generateAiCommercialFollowup: jest.fn(),
}));
const mockPostEvent = jest.fn();
jest.mock('@/app/actions/post-event-intelligence', () => ({
  getPostEventOpportunities: (...a: unknown[]) => mockPostEvent(...a),
  createPostEventPackage: jest.fn(),
  generateAiPostEventMaterial: jest.fn(),
}));
const mockRun = jest.fn();
jest.mock('@/app/actions/smart-automations', () => ({ runSmartAutomations: (...a: unknown[]) => mockRun(...a) }));
const mockTower = jest.fn();
jest.mock('@/app/actions/control-tower', () => ({ getControlTowerData: (...a: unknown[]) => mockTower(...a) }));
const mockScores = jest.fn();
jest.mock('@/app/actions/preparation-score', () => ({ getAllFiestasPreparationScores: (...a: unknown[]) => mockScores(...a) }));

async function pintar(ruta: string) {
  const Page = require(ruta).default;
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await act(async () => { await Promise.resolve(); });
  return {
    host,
    texto: () => host.textContent || '',
    boton: (t: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(t)) as HTMLButtonElement,
    alertas: () => Array.from(host.querySelectorAll('[role="alert"]')).map((a) => a.textContent || ''),
    limpiar: () => { act(() => root.unmount()); host.remove(); },
  };
}
async function click(b: HTMLButtonElement) {
  await act(async () => { b.click(); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => { jest.clearAllMocks(); jest.spyOn(console, 'error').mockImplementation(() => undefined); });
afterEach(() => { jest.restoreAllMocks(); });

const item = { id: 'lead_1', name: 'Ana Perez', source: 'crm', status: 'Nuevo', priority: 'alta', reason: 'Seguimiento hoy', href: '/x', suggestedMessage: 'Hola Ana' };

describe('seguimientos comerciales', () => {
  test('lectura caida: avisa, NO dice "Todo tranquilo", y Reintentar recupera', async () => {
    mockFollowups.mockRejectedValueOnce(new Error('red'));
    const r = await pintar('@/app/control-tower/comercial/page');
    expect(r.alertas().join(' ')).toContain('No se pudieron leer los seguimientos');
    expect(r.texto()).not.toContain('Todo tranquilo');
    mockFollowups.mockResolvedValueOnce({ success: true, data: [item] });
    await click(r.boton('Reintentar'));
    expect(r.alertas()).toHaveLength(0);
    expect(r.texto()).toContain('Ana Perez');
    r.limpiar();
  });

  test('lectura vacia confirmada si dice "Todo tranquilo"', async () => {
    mockFollowups.mockResolvedValueOnce({ success: true, data: [] });
    const r = await pintar('@/app/control-tower/comercial/page');
    expect(r.texto()).toContain('Todo tranquilo');
    expect(r.alertas()).toHaveLength(0);
    r.limpiar();
  });

  test('si el refresco falla se conservan los seguimientos que ya estaban', async () => {
    mockFollowups.mockResolvedValueOnce({ success: true, data: [item] });
    const r = await pintar('@/app/control-tower/comercial/page');
    mockFollowups.mockRejectedValueOnce(new Error('red'));
    mockCrearAvisos.mockRejectedValueOnce(new Error('red'));
    await click(r.boton('Crear avisos'));
    expect(r.texto()).toContain('Ana Perez');
    r.limpiar();
  });

  test('"Crear avisos" que falla: avisa, no muestra "Avisos creados"', async () => {
    mockFollowups.mockResolvedValueOnce({ success: true, data: [item] });
    const r = await pintar('@/app/control-tower/comercial/page');
    mockCrearAvisos.mockRejectedValueOnce(new Error('red'));
    await click(r.boton('Crear avisos'));
    expect(r.alertas().join(' ')).toContain('No se pudieron crear los avisos');
    expect(r.texto()).not.toContain('Avisos creados');
    expect(r.boton('Crear avisos').disabled).toBe(false);
    r.limpiar();
  });
});

describe('post-fiesta', () => {
  test('lectura caida: avisa, NO dice "No hay fiestas recientes", y Reintentar recupera', async () => {
    mockPostEvent.mockRejectedValueOnce(new Error('red'));
    const r = await pintar('@/app/control-tower/post-fiesta/page');
    expect(r.alertas().join(' ')).toContain('No se pudieron leer las fiestas recientes');
    expect(r.texto()).not.toContain('No hay fiestas recientes');
    mockPostEvent.mockResolvedValueOnce({ success: true, data: [] });
    await click(r.boton('Reintentar'));
    expect(r.alertas()).toHaveLength(0);
    expect(r.texto()).toContain('No hay fiestas recientes');
    r.limpiar();
  });
});

describe('automatizaciones', () => {
  test('revision que falla: avisa, no dice "Revision completa" y el boton se habilita para reintentar', async () => {
    const r = await pintar('@/app/control-tower/automatizaciones/page');
    mockRun.mockRejectedValueOnce(new Error('red'));
    await click(r.boton('Ejecutar revisión'));
    expect(r.alertas().join(' ')).toContain('La revisión no se pudo completar');
    expect(r.texto()).not.toContain('Revisión completa');
    expect(r.boton('Ejecutar revisión').disabled).toBe(false);
    mockRun.mockResolvedValueOnce({ success: true, created: 0, results: [] });
    await click(r.boton('Ejecutar revisión'));
    expect(r.alertas()).toHaveLength(0);
    expect(r.texto()).toContain('Avisos creados: 0');
    r.limpiar();
  });

  test('un aviso que no se creo figura como "Detectado", no "Aviso creado"', async () => {
    const r = await pintar('@/app/control-tower/automatizaciones/page');
    mockRun.mockResolvedValueOnce({ success: true, created: 0, results: [{ id: 'a', title: 'T', description: 'D', created: false }] });
    await click(r.boton('Ejecutar revisión'));
    expect(r.texto()).toContain('Detectado');
    expect(r.texto()).not.toContain('Aviso creado');
    r.limpiar();
  });
});

describe('Control Tower y Preparacion (pantallas del servidor)', () => {
  const html = async (ruta: string) => renderToStaticMarkup(await require(ruta).default());

  test('Control Tower con fiestas no leidas: alerta, KPI sin numero inventado, sin "Todo tranquilo"', async () => {
    mockTower.mockResolvedValue({ success: true, data: { fiestasNoSeLeyeron: true, items: [], kpis: { fiestasFuturas: 0 } } });
    const out = await html('@/app/control-tower/page');
    expect(out).toContain('No se pudieron leer las fiestas');
    expect(out).toContain('Reintentar');
    expect(out).not.toContain('Todo tranquilo');
    expect(out).toMatch(/Fiestas próximas<\/p><p[^>]*>—</);
  });

  test('Control Tower con lectura buena y sin pendientes si dice "Todo tranquilo" y el numero real', async () => {
    mockTower.mockResolvedValue({ success: true, data: { fiestasNoSeLeyeron: false, items: [], kpis: { fiestasFuturas: 0 } } });
    const out = await html('@/app/control-tower/page');
    expect(out).toContain('Todo tranquilo');
    expect(out).not.toContain('No se pudieron leer');
    expect(out).toMatch(/Fiestas próximas<\/p><p[^>]*>0</);
  });

  test('Preparacion con lectura caida: alerta y NO "No hay fiestas para revisar"', async () => {
    mockScores.mockResolvedValue({ success: false, error: 'x', data: [] });
    const out = await html('@/app/control-tower/preparacion/page');
    expect(out).toContain('No se pudieron leer las fiestas');
    expect(out).toContain('Reintentar');
    expect(out).not.toContain('No hay fiestas para revisar');
  });

  test('Preparacion con cero fiestas reales si dice "No hay fiestas para revisar"', async () => {
    mockScores.mockResolvedValue({ success: true, data: [] });
    const out = await html('@/app/control-tower/preparacion/page');
    expect(out).toContain('No hay fiestas para revisar');
    expect(out).not.toContain('No se pudieron leer');
  });
});
