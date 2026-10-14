/**
 * /settings/sincronizaciones:
 * - si la primera lectura falla NO se anuncia "0 plataformas / 0 conectadas": hay un error con
 *   "Reintentar", que al andar muestra las conexiones;
 * - si un "Actualizar" falla después de una lectura buena, se conservan las conexiones y se avisa
 *   que pueden estar desactualizadas;
 * - el historial de Instagram distingue no iniciado / parcial / fallido / completo y NUNCA dice
 *   "en curso" (el servidor no expone ninguna operación activa).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const getEstadoConexiones = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock('@/components/settings/LimpiarAgenda', () => ({ LimpiarAgenda: () => null }));
jest.mock('@/app/actions/conexiones-estado.actions', () => ({
  getEstadoConexiones: (...a: unknown[]) => getEstadoConexiones(...a),
  probarConexionInstagramAction: jest.fn(),
}));
jest.mock('@/app/actions/social-history', () => ({ sincronizarHistorialRedesAction: jest.fn() }));

import SincronizacionesPage from '@/app/(app)/settings/sincronizaciones/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

const conexion = (id: string, nombre: string, extra = {}) => ({
  id, nombre, categoria: 'Redes', estado: 'conectada', detalle: 'ok', queSePierdeSiFalta: 'nada', ...extra,
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<SincronizacionesPage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

const boton = (host: HTMLElement, texto: string) =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto) as HTMLButtonElement | undefined;

let consola: jest.SpyInstance;
beforeEach(() => {
  getEstadoConexiones.mockReset();
  consola = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => consola.mockRestore());

test('primera lectura fallida: error con Reintentar y sin contadores en cero', async () => {
  getEstadoConexiones.mockRejectedValueOnce(new Error('Failed to fetch'));
  const { host, cerrar } = await montar();
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('No pudimos leer el estado de las conexiones');
  expect(host.textContent).not.toContain('Leyendo el estado');
  expect(host.textContent).not.toMatch(/Conectadas/i);

  getEstadoConexiones.mockResolvedValue([conexion('whatsapp', 'WhatsApp Negocio')]);
  await act(async () => { boton(host, 'Reintentar')!.click(); });
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.textContent).toContain('WhatsApp Negocio');
  cerrar();
});

test('Actualizar fallido tras una lectura buena: conserva las conexiones y avisa que pueden estar viejas', async () => {
  getEstadoConexiones.mockResolvedValueOnce([conexion('whatsapp', 'WhatsApp Negocio'), conexion('google-calendar', 'Google Calendar')]);
  const { host, cerrar } = await montar();
  expect(host.textContent).toContain('Google Calendar');

  getEstadoConexiones.mockRejectedValue(new Error('Failed to fetch'));
  await act(async () => { boton(host, 'Actualizar')!.click(); });
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('lo que ves puede estar desactualizado');
  expect(host.textContent).toContain('WhatsApp Negocio');
  expect(host.textContent).toContain('Google Calendar');
  cerrar();
});

describe('historial de Instagram', () => {
  const textoDelHistorial = async (historial?: Record<string, unknown>) => {
    getEstadoConexiones.mockResolvedValue([conexion('instagram', 'Instagram', { historial })]);
    const { host, cerrar } = await montar();
    const texto = host.textContent || '';
    cerrar();
    return texto;
  };

  test('sin ningún intento: "todavía no se sincronizó", nunca "en curso"', async () => {
    const t = await textoDelHistorial({ totalPublicaciones: 0, completo: false });
    expect(t).toContain('Todavía no se sincronizó el historial');
    expect(t).not.toMatch(/en curso/i);
  });

  test('con un intento sin terminar: parcial, con la cantidad traída', async () => {
    const t = await textoDelHistorial({ totalPublicaciones: 12, completo: false, ultimaSincronizacion: '2026-10-01T10:00:00.000Z' });
    expect(t).toContain('Historial parcial: 12 publicaciones traídas');
    expect(t).not.toMatch(/en curso/i);
  });

  test('con error: dice que falló y el motivo', async () => {
    const t = await textoDelHistorial({ totalPublicaciones: 0, completo: false, error: 'Token vencido' });
    expect(t).toContain('La última sincronización falló');
    expect(t).toContain('Token vencido');
    expect(t).not.toMatch(/en curso/i);
  });

  test('completo: Historial completo', async () => {
    const t = await textoDelHistorial({ totalPublicaciones: 80, completo: true, ultimaSincronizacion: '2026-10-01T10:00:00.000Z' });
    expect(t).toContain('Historial completo');
  });
});
