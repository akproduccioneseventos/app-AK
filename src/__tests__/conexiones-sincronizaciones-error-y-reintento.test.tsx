/**
 * Orden 154 (1 y 2): /settings/sincronizaciones no puede decir "0 conectadas" cuando la lectura
 * falló, y el historial de Instagram dice lo que de verdad pasó (nada de "en curso" inventado).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockEstado = jest.fn();
jest.mock('@/app/actions/conexiones-estado.actions', () => ({
  getEstadoConexiones: (...a: unknown[]) => mockEstado(...a),
  probarConexionInstagramAction: jest.fn(),
}));
jest.mock('@/app/actions/social-history', () => ({ sincronizarHistorialRedesAction: jest.fn() }));
jest.mock('@/components/settings/LimpiarAgenda', () => ({ LimpiarAgenda: () => null }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));

const con = (o: any) => ({ id: 'x', nombre: 'Algo', categoria: 'c', estado: 'conectada', detalle: 'ok', queSePierdeSiFalta: 'nada', ...o });
const ig = (historial: any) => con({ id: 'instagram', nombre: 'Instagram', estado: 'falta-configurarla', historial });

async function pintar() {
  const Page = require('@/app/(app)/settings/sincronizaciones/page').default;
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await act(async () => { await Promise.resolve(); });
  return {
    host,
    texto: () => host.textContent || '',
    boton: (t: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes(t)) as HTMLButtonElement,
    limpiar: () => { act(() => root.unmount()); host.remove(); },
  };
}
async function click(b: HTMLButtonElement) {
  await act(async () => { b.click(); });
  await act(async () => { await Promise.resolve(); });
}

beforeEach(() => { mockEstado.mockReset(); jest.spyOn(console, 'error').mockImplementation(() => undefined); });
afterEach(() => { jest.restoreAllMocks(); });

describe('lectura de conexiones que falla', () => {
  test('primera carga falla: aviso + Reintentar y NO muestra contadores en cero', async () => {
    mockEstado.mockRejectedValue(new Error('corte'));
    const r = await pintar();
    expect(r.texto()).toContain('No pudimos leer el estado de las conexiones');
    expect(r.boton('Reintentar')).toBeTruthy();
    expect(r.texto()).not.toContain('TOTAL PLATAFORMAS');
    expect(r.texto()).not.toContain('CONECTADAS');
    r.limpiar();
  });

  test('refresco falla con datos previos: se conservan y se avisa que pueden estar viejos', async () => {
    mockEstado.mockResolvedValueOnce([con({ id: 'a', nombre: 'Alfa' }), con({ id: 'b', nombre: 'Beta' })]);
    const r = await pintar();
    expect(r.texto()).toContain('Alfa');
    expect(r.texto()).not.toContain('No se pudo actualizar');
    mockEstado.mockRejectedValueOnce(new Error('corte'));
    await click(r.boton('Actualizar'));
    expect(r.texto()).toContain('Alfa');
    expect(r.texto()).toContain('Beta');
    expect(r.texto()).toContain('No se pudo actualizar; lo que ves puede estar desactualizado');
    r.limpiar();
  });

  test('reintento exitoso: desaparece el aviso y aparecen los datos', async () => {
    mockEstado.mockRejectedValueOnce(new Error('corte'));
    const r = await pintar();
    mockEstado.mockResolvedValueOnce([con({ id: 'a', nombre: 'Alfa' })]);
    await click(r.boton('Reintentar'));
    expect(r.texto()).not.toContain('No pudimos leer');
    expect(r.texto()).not.toContain('desactualizado');
    expect(r.texto()).toContain('Alfa');
    expect(r.texto()).toContain('TOTAL PLATAFORMAS');
    r.limpiar();
  });
});

describe('historial de Instagram', () => {
  const texto = async (h: any) => { mockEstado.mockResolvedValue([ig(h)]); const r = await pintar(); const t = r.texto(); r.limpiar(); return t; };

  test('sin intento registrado: todavía no se sincronizó (y no dice "en curso")', async () => {
    const t = await texto({ totalPublicaciones: 0, completo: false });
    expect(t).toContain('Todavía no se sincronizó el historial');
    expect(t).not.toContain('en curso');
  });
  test('con error: la última sincronización falló, con el motivo', async () => {
    const t = await texto({ totalPublicaciones: 3, completo: false, error: 'token vencido', ultimaSincronizacion: '2026-10-01T00:00:00Z' });
    expect(t).toContain('La última sincronización falló');
    expect(t).toContain('token vencido');
    expect(t).not.toContain('en curso');
  });
  test('parcial: hubo intento, sin error, no completo', async () => {
    const t = await texto({ totalPublicaciones: 7, completo: false, ultimaSincronizacion: '2026-10-01T00:00:00Z' });
    expect(t).toContain('Historial parcial: 7 publicaciones traídas');
    expect(t).not.toContain('en curso');
  });
  test('completo: como antes', async () => {
    const t = await texto({ totalPublicaciones: 40, completo: true, ultimaSincronizacion: '2026-10-01T00:00:00Z' });
    expect(t).toContain('Historial completo');
    expect(t).not.toContain('en curso');
  });
});
