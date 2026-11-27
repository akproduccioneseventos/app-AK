import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const marcarResumenVistoMock = jest.fn();
const toastMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams('tab=hoy'),
}));

jest.mock('@/app/actions/asistente-proactivo.actions', () => ({
  getBandejaAsistenteAction: jest.fn().mockResolvedValue({
    success: true,
    usuarioNombre: 'Dueño',
    esDuenio: true,
    propuestas: [],
    resumen: {
      id: 'res_1',
      generadoEn: '2026-11-26T08:00:00.000Z',
      resumenTexto: 'Novedades del día para revisar',
      itemsConteo: 1,
      visto: false,
    },
    settings: { metasMes: '' },
  }),
  aceptarPropuestaAction: jest.fn().mockResolvedValue({ success: true }),
  posponerPropuestaAction: jest.fn().mockResolvedValue({ success: true }),
  descartarPropuestaAction: jest.fn().mockResolvedValue({ success: true }),
  tomarPropuestaAction: jest.fn().mockResolvedValue({ success: true }),
  marcarResumenVistoAction: (...args: any[]) => marcarResumenVistoMock(...args),
  guardarMetaMesAction: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/tareas-automaticas.actions', () => ({
  getEstadoTareasAutomaticas: jest.fn().mockResolvedValue([]),
  getEstadoDespertadorAction: jest.fn().mockResolvedValue({ activo: false }),
  ejecutarTareaManual: jest.fn().mockResolvedValue({ success: true }),
  dispararTareasVencidasDeFondo: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/agentes-autonomos', () => ({
  getAgentesConfig: jest.fn().mockResolvedValue({}),
  toggleAgente: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/app/actions/multiagent', () => ({
  sendMultiAgentMessage: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock('@/components/multiagent/multiagent-widget', () => ({
  MultiAgentWidget: () => null,
}));

jest.mock('@/components/marketing/gasto-ia-card', () => ({
  GastoIaCard: () => null,
}));

import { AsistenteBandejaInner } from '@/app/(app)/asistente/asistente-client';

describe('Orden 360: resumen visto se guarda de verdad', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    jest.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('si marcarResumenVistoAction devuelve success: false, avisa error, no muestra "Resumen visto" y deja la tarjeta', async () => {
    marcarResumenVistoMock.mockResolvedValue({ success: false, error: 'Sin conexión' });

    const root = createRoot(container);
    await act(async () => {
      root.render(React.createElement(AsistenteBandejaInner));
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(container.textContent).toContain('Mientras no estabas');
    const buttons = Array.from(container.querySelectorAll('button'));
    const boton = buttons.find((b) => /^Visto$/i.test((b.textContent || '').trim()));
    expect(boton).toBeDefined();

    await act(async () => {
      boton!.click();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(marcarResumenVistoMock).toHaveBeenCalledWith('res_1');
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
    expect(toastMock).not.toHaveBeenCalledWith(expect.objectContaining({ title: 'Resumen visto' }));
    expect(container.textContent).toContain('Mientras no estabas');

    await act(async () => {
      root.unmount();
    });
  }, 15_000);
});
