/**
 * Orden 372 B4 — La fecha de la fiesta se guarda como día ("AAAA-MM-DD") al moverla en agenda,
 * y el panel de personal muestra ese día con `parseUruguayDate` sin mostrar "Invalid Date".
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const saveFiestaMock = jest.fn();
const getFiestasMock = jest.fn();
const getFiestaByIdMock = jest.fn();
const toastMock = jest.fn();

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => React.createElement('a', { href, ...props }, children),
}));

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('fiestaId=f1'),
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock('@/components/ui/tab-host-shell', () => ({
  TabHostShell: ({ renderDefault }: any) => React.createElement(React.Fragment, null, renderDefault()),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: (...a: unknown[]) => getFiestasMock(...a),
  getHistorialFiestas: jest.fn(async () => []),
  saveFiesta: (...a: unknown[]) => saveFiestaMock(...a),
}));

jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requirePermisoAlguno: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(async () => [
    { id: 'e1', nombre: 'Carlos Gómez', telefono: '099111222', rolIds: ['r1'] },
  ]),
}));

jest.mock('@/app/actions/roles', () => ({
  getRoles: jest.fn(async () => [{ id: 'r1', nombre: 'Mozo', sueldoPorEvento: 2500 }]),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...a: unknown[]) => getFiestaByIdMock(...a),
  updatePersonalFiestaActual: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta/personal.actions', () => ({
  retryPersonalGoogleSync: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta/proponer-equipo.actions', () => ({
  obtenerPropuestaEquipoAction: jest.fn(async () => ({ success: true, propuesta: [] })),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
}));

jest.mock('@/app/actions/personal-fiestas', () => ({
  getFiestasByEmpleado: jest.fn(async () => []),
}));

jest.mock('@/app/actions/sesion', () => ({
  getMisPermisos: jest.fn(async () => ({ permisos: ['ADMINISTRACION', 'SUELDOS'] })),
  esSesionDeSoloLectura: jest.fn(async () => false),
}));

jest.mock('@/components/fiestas/observaciones-posfiesta', () => ({
  ObservacionesPosfiesta: () => React.createElement('div', null),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? React.createElement('div', { 'data-testid': 'dialog-open' }, children) : null),
  DialogContent: ({ children }: any) => React.createElement('div', null, children),
  DialogHeader: ({ children }: any) => React.createElement('div', null, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', null, children),
  DialogDescription: ({ children }: any) => React.createElement('p', null, children),
  DialogFooter: ({ children }: any) => React.createElement('div', null, children),
}));

import { updateFiestaDate } from '@/app/actions/agenda';
import PersonalPage from '@/components/fiestas/panels/personal';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

describe('Mover la fiesta guarda el día y personal lo muestra sin Invalid Date', () => {
  beforeEach(() => {
    saveFiestaMock.mockReset();
    getFiestasMock.mockReset();
    getFiestaByIdMock.mockReset();
    toastMock.mockReset();
  });

  it('mover una fiesta al 12/12 a las 22:00 guarda "2026-12-12"', async () => {
    getFiestasMock.mockResolvedValue([
      {
        id: 'f1',
        configuracion: {
          nombreEvento: 'Cumple de Sofía',
          // 22:00 del 10/12 en Uruguay = 01:00 UTC del 11/12
          fechaEvento: '2026-12-11T01:00:00.000Z',
        },
      },
    ]);
    saveFiestaMock.mockResolvedValue({ success: true });

    const res = await updateFiestaDate('f1', '2026-12-12');
    expect(res.success).toBe(true);
    expect(saveFiestaMock).toHaveBeenCalledTimes(1);
    const guardada = saveFiestaMock.mock.calls[0][0];
    expect(guardada.configuracion.fechaEvento).toBe('2026-12-12');
  });

  it('el panel de personal muestra el 12/12 tanto si llega "2026-12-12" como si llega ISO viejo', async () => {
    for (const fechaGuardada of ['2026-12-12', '2026-12-13T01:00:00.000Z']) {
      getFiestaByIdMock.mockResolvedValue({
        id: 'f1',
        configuracion: {
          nombreEvento: 'Cumple de Sofía',
          fechaEvento: fechaGuardada,
        },
        personalAsignado: [{ empleadoId: 'e1', rolId: 'r1', eventSalary: 2500 }],
      });

      const host = document.body.appendChild(document.createElement('div'));
      const root = createRoot(host);
      await act(async () => {
        root.render(React.createElement(PersonalPage));
      });
      await act(async () => {
        await Promise.resolve();
      });

      const btnWa = Array.from(host.querySelectorAll('button')).find((b) =>
        b.getAttribute('title')?.includes('WhatsApp') || b.textContent?.includes('WhatsApp'),
      );
      expect(btnWa).toBeDefined();

      await act(async () => {
        btnWa!.click();
      });

      const dialogText = host.textContent || '';
      const textarea = host.querySelector('textarea') as HTMLTextAreaElement | null;
      const mensaje = textarea?.value || dialogText;
      expect(mensaje).not.toContain('Invalid Date');
      expect(mensaje).toContain('12 de diciembre de 2026');

      act(() => root.unmount());
      host.remove();
    }
  });
});
