import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';
import { getBarPedidosListos } from '@/app/actions/fiesta/barra-tecnologica.actions';
import PantallaTragoListoPage from '@/app/evento/barra/[fiestaId]/listo/page';

const mockParams = { fiestaId: 'qa132-bar-fiesta-ficticia' };
const mockGetBarPedidosListos = jest.fn();
const mockUsePantallaPrendida = jest.fn();
const observations: Array<Record<string, unknown>> = [];
const observationPath = path.join(process.cwd(), 'docs/evidencias/132-barra-listos-observado.json');
const originalSetInterval = globalThis.setInterval;
const originalClearInterval = globalThis.clearInterval;

jest.mock('next/navigation', () => ({ useParams: () => mockParams }));
jest.mock('@/hooks/use-pantalla-prendida', () => ({ usePantallaPrendida: () => mockUsePantallaPrendida() }));
jest.mock('@/app/actions/fiesta/barra-tecnologica.actions', () => ({
  getBarPedidosListos: (...args: unknown[]) => mockGetBarPedidosListos(...args),
}));
jest.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => 'div' }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import { getBarPedidosListos as mockedProvider } from '@/app/actions/fiesta/barra-tecnologica.actions';

const readyOrder = (id: string, guestName: string, drinkName: string) => ({
  id,
  guestName,
  drinkName,
  tableNumber: 'Mesa QA',
  status: 'listo',
});

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mount(label: string) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => root.render(<PantallaTragoListoPage />));
  const capture = (state: string) => observations.push({
    caso: label,
    estado: state,
    textoVisibleReal: host.textContent,
    providerCalls: mockGetBarPedidosListos.mock.calls.length,
  });
  return {
    host,
    capture,
    close: async () => {
      await act(async () => root.unmount());
      host.remove();
    },
  };
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  jest.useFakeTimers();
});

afterAll(() => {
  fs.writeFileSync(observationPath, `${JSON.stringify({
    applicationSourceSha: 'd10f332a17241de5a4705a560336585853073a76',
    scope: 'Pagina real con accion getBarPedidosListos simulada; sin autenticacion ni hardware real.',
    cases: observations,
  }, null, 2)}\n`, 'utf8');
  jest.useRealTimers();
  globalThis.setInterval = originalSetInterval;
  globalThis.clearInterval = originalClearInterval;
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetBarPedidosListos.mockReset();
});

afterEach(() => {
  jest.clearAllTimers();
  document.body.replaceChildren();
});

test('lista vacía confirmada comunica espera legítima', async () => {
  mockGetBarPedidosListos.mockResolvedValue({ success: true, orders: [], eventName: 'Fiesta QA ficticia' });
  const page = await mount('vacio-legitimo');
  try {
    await flush();
    page.capture('respuesta-vacia-success');
    expect(page.host.textContent).toContain('Los tragos se están preparando');
    expect(page.host.textContent).toContain('En instantes vas a ver tu nombre');
    expect(mockUsePantallaPrendida).toHaveBeenCalled();
  } finally {
    await page.close();
  }
});

test('pedido listo muestra nombre y bebida', async () => {
  mockGetBarPedidosListos.mockResolvedValue({
    success: true,
    orders: [readyOrder('qa132-ord-0042', 'Invitada Ficticia QA', 'Limonada QA')],
    eventName: 'Fiesta QA ficticia',
  });
  const page = await mount('pedido-listo');
  try {
    await flush();
    page.capture('pedido-visible');
    expect(page.host.textContent).toContain('Invitada Ficticia QA');
    expect(page.host.textContent).toContain('Limonada QA');
    expect(page.host.textContent).toContain('Listo para retirar');
    expect(page.host.textContent).not.toContain('Los tragos se están preparando');
  } finally {
    await page.close();
  }
});

test('respuesta inicial success false anuncia que no se pudieron cargar los pedidos', async () => {
  mockGetBarPedidosListos.mockResolvedValue({ success: false, error: 'Error ficticio QA132' });
  const page = await mount('respuesta-inicial-fallida');
  try {
    await flush();
    page.capture('success-false-sin-aviso-es-fallo');
    expect(page.host.textContent).toMatch(/no se pudieron cargar|error al cargar|problema de conexión/i);
    expect(page.host.textContent).not.toContain('Los tragos se están preparando');
  } finally {
    await page.close();
  }
});

test('rechazo inicial anuncia que no se pudieron cargar los pedidos', async () => {
  mockGetBarPedidosListos.mockRejectedValue(new Error('Rechazo sintético QA132'));
  const page = await mount('rechazo-inicial');
  try {
    await flush();
    page.capture('rechazo-sin-aviso-es-fallo');
    expect(page.host.textContent).toMatch(/no se pudieron cargar|error al cargar|problema de conexión/i);
    expect(page.host.textContent).not.toContain('Los tragos se están preparando');
  } finally {
    await page.close();
  }
});

test('fallo de sondeo tras mostrar pedidos comunica que la lista puede estar desactualizada', async () => {
  mockGetBarPedidosListos
    .mockResolvedValueOnce({ success: true, orders: [readyOrder('qa132-ord-0042', 'Invitada Ficticia QA', 'Limonada QA')] })
    .mockRejectedValueOnce(new Error('Corte sintético QA132 durante sondeo'));
  const page = await mount('fallo-sondeo-tras-listos');
  try {
    await flush();
    page.capture('carga-inicial');
    expect(page.host.textContent).toContain('Invitada Ficticia QA');
    await act(async () => { await jest.advanceTimersByTimeAsync(2500); });
    page.capture('despues-de-sondeo-fallido');
    expect(mockGetBarPedidosListos).toHaveBeenCalledTimes(2);
    expect(page.host.textContent).toMatch(/no se pudo actualizar|lista desactualizada|problema de conexión|sin conexión/i);
    expect(page.host.textContent).toContain('Invitada Ficticia QA');
    expect(page.host.textContent).not.toContain('Los tragos se están preparando');
  } finally {
    await page.close();
  }
});

test('sondeo sano posterior al fallo reemplaza la lista por los pedidos nuevos', async () => {
  mockGetBarPedidosListos
    .mockResolvedValueOnce({ success: true, orders: [readyOrder('qa132-ord-0042', 'Invitada Anterior QA', 'Limonada QA')] })
    .mockRejectedValueOnce(new Error('Corte sintético QA132 durante sondeo'))
    .mockResolvedValueOnce({ success: true, orders: [readyOrder('qa132-ord-0043', 'Invitado Nuevo QA', 'Agua saborizada QA')] });
  const page = await mount('recuperacion-posterior');
  try {
    await flush();
    page.capture('carga-inicial');
    expect(page.host.textContent).toContain('Invitada Anterior QA');
    await act(async () => { await jest.advanceTimersByTimeAsync(2500); });
    page.capture('despues-de-sondeo-fallido');
    await act(async () => { await jest.advanceTimersByTimeAsync(2500); });
    page.capture('despues-de-recuperacion');
    expect(mockGetBarPedidosListos).toHaveBeenCalledTimes(3);
    expect(page.host.textContent).toContain('Invitado Nuevo QA');
    expect(page.host.textContent).toContain('Agua saborizada QA');
    expect(page.host.textContent).not.toContain('Invitada Anterior QA');
  } finally {
    await page.close();
  }
});
