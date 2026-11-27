/**
 * Orden 371 B1 — Las fechas del equipo no se corren un día en Uruguay:
 * - Calendario: una cita de las 23:30 del 26/11 se edita y guarda en el 26/11.
 * - Fotografía: la entrega estimada desde el 08/08/2027 con parseUruguayDate no retrocede al día anterior.
 * - Clientes: el mismo día de la fiesta a las 23:30 en Uruguay sigue figurando como "Actual".
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { hoyEnUruguay, parseUruguayDate } from '@/lib/utils';

const toastMock = jest.fn();
const getCalendarEventsMock = jest.fn();
const getAppointmentsMock = jest.fn();
const updateAppointmentMock = jest.fn();
const getFiestaByIdMock = jest.fn();
const getPresupuestoByIdMock = jest.fn();
const updateFotografiaMock = jest.fn();
const getCustomersConDetalleMock = jest.fn();
const getAllFiestasMock = jest.fn();

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

jest.mock('@/app/actions/agenda', () => ({
  getCalendarEvents: (...a: unknown[]) => getCalendarEventsMock(...a),
  getAppointments: (...a: unknown[]) => getAppointmentsMock(...a),
  updateFiestaDate: jest.fn(async () => ({ success: true })),
  createAppointment: jest.fn(async () => ({ success: true })),
  updateAppointmentStatus: jest.fn(async () => ({ success: true })),
  updateAppointment: (...a: unknown[]) => updateAppointmentMock(...a),
  cancelAppointment: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/lib/intento-de-guardado', () => ({
  obtenerIntento: jest.fn(async () => 'intento-1'),
  terminarIntento: jest.fn(async () => undefined),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...a: unknown[]) => getFiestaByIdMock(...a),
  updateFotografiaYFilmacionFiestaActual: (...a: unknown[]) => updateFotografiaMock(...a),
}));

jest.mock('@/app/actions/accesos-personal', () => ({
  verifyAccesoPersonalToken: jest.fn(async () => ({ authorized: true, isExternalProvider: false })),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: (...a: unknown[]) => getPresupuestoByIdMock(...a),
}));

jest.mock('@/app/actions/customers', () => ({
  getCustomersConDetalle: (...a: unknown[]) => getCustomersConDetalleMock(...a),
  deleteCustomer: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getAllFiestas: (...a: unknown[]) => getAllFiestasMock(...a),
}));

jest.mock('@/components/date-picker-demo', () => ({
  DatePickerDemo: ({ selectedDate }: any) =>
    React.createElement('span', { 'data-testid': 'date-picker-val' }, selectedDate ? hoyEnUruguay(selectedDate) : ''),
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: any) => (open ? React.createElement('div', { 'data-testid': 'dialog-open' }, children) : null),
  DialogContent: ({ children }: any) => React.createElement('div', null, children),
  DialogHeader: ({ children }: any) => React.createElement('div', null, children),
  DialogTitle: ({ children }: any) => React.createElement('h2', null, children),
  DialogDescription: ({ children }: any) => React.createElement('p', null, children),
  DialogFooter: ({ children }: any) => React.createElement('div', null, children),
  DialogTrigger: ({ children }: any) => React.createElement('div', null, children),
  DialogClose: ({ children }: any) => React.createElement('div', null, children),
}));

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogAction: ({ children, ...p }: any) => React.createElement('button', p, children),
  AlertDialogCancel: ({ children, ...p }: any) => React.createElement('button', p, children),
  AlertDialogContent: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogDescription: ({ children }: any) => React.createElement('p', null, children),
  AlertDialogFooter: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogHeader: ({ children }: any) => React.createElement('div', null, children),
  AlertDialogTitle: ({ children }: any) => React.createElement('h2', null, children),
  AlertDialogTrigger: ({ children }: any) => React.createElement('div', null, children),
}));

import CalendarioPage from '@/app/(app)/calendario/page';
import FotografiaPage from '@/components/fiestas/panels/fotografia';
import CustomersPage from '@/app/(app)/customers/page';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

async function montar(component: React.ReactElement) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(component);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return {
    host,
    cerrar: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

describe('Las fechas del equipo no se corren en Uruguay', () => {
  beforeEach(() => {
    toastMock.mockReset();
    getCalendarEventsMock.mockReset();
    getAppointmentsMock.mockReset();
    updateAppointmentMock.mockReset();
    getFiestaByIdMock.mockReset();
    getPresupuestoByIdMock.mockReset();
    updateFotografiaMock.mockReset();
    getCustomersConDetalleMock.mockReset();
    getAllFiestasMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('una cita de las 23:30 del 26/11 se edita y guarda en el 26/11', async () => {
    getCalendarEventsMock.mockResolvedValue([]);
    // 23:30 del 26/11/2026 en Uruguay = 02:30 UTC del 27/11/2026
    getAppointmentsMock.mockResolvedValue([
      {
        id: 'cita-1',
        clienteNombre: 'Lucía Pérez',
        clienteContacto: '099123456',
        eventoTipo: 'Boda',
        fechaHora: '2026-11-27T02:30:00.000Z',
        estado: 'Agendada',
        lugar: 'A coordinar',
        notas: '',
      },
    ]);
    updateAppointmentMock.mockResolvedValue({ success: true });

    const { host, cerrar } = await montar(React.createElement(CalendarioPage));
    const btnReprogramar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Reprogramar'),
    );
    expect(btnReprogramar).toBeDefined();

    await act(async () => {
      btnReprogramar!.click();
    });

    const inputFecha = host.querySelector('#cita-fecha') as HTMLInputElement;
    const inputHora = host.querySelector('#cita-hora') as HTMLInputElement;
    expect(inputFecha.value).toBe('2026-11-26');
    expect(inputHora.value).toBe('23:30');

    const btnGuardar = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Guardar cambios'),
    );
    expect(btnGuardar).toBeDefined();

    await act(async () => {
      btnGuardar!.click();
    });

    expect(updateAppointmentMock).toHaveBeenCalledTimes(1);
    const payload = updateAppointmentMock.mock.calls[0][1];
    expect(hoyEnUruguay(new Date(payload.fechaHora))).toBe('2026-11-26');
    cerrar();
  });

  it('la entrega de fotos de una fiesta del 08/08/2027 con parseUruguayDate cae el 07/09/2027 (30 días) y 28/08/2027 (20 días)', async () => {
    const base = parseUruguayDate('2027-08-08');
    const entrega30 = parseUruguayDate(hoyEnUruguay(base));
    entrega30.setDate(entrega30.getDate() + 30);
    expect(hoyEnUruguay(entrega30)).toBe('2027-09-07');

    getFiestaByIdMock.mockResolvedValue({
      id: 'f1',
      presupuestoId: 'p1',
      configuracion: { fechaEvento: '2027-08-08', nombreEvento: 'Boda Ana' },
      fotografiaYFilmacion: { servicios: [], notasGenerales: '' },
    });
    getPresupuestoByIdMock.mockResolvedValue({
      id: 'p1',
      itemsPresupuestados: [
        {
          idServicioCatalogo: 's-foto',
          nombreServicio: 'Fotografía de Fiesta',
          categoriaServicio: 'Servicio de fotografía',
          cantidad: 1,
        },
      ],
    });
    updateFotografiaMock.mockResolvedValue({ success: true });

    const { host, cerrar } = await montar(React.createElement(FotografiaPage));
    expect(host.textContent).toContain('28 de agosto de 2027');
    cerrar();
  });

  it('el mismo día de la fiesta a las 23:30 en Uruguay, el cliente sigue figurando como Actual', async () => {
    jest.useFakeTimers();
    // 23:30 del 26/11/2026 en Uruguay = 02:30 UTC del 27/11/2026
    jest.setSystemTime(new Date('2026-11-27T02:30:00.000Z'));

    getCustomersConDetalleMock.mockResolvedValue({
      customers: [
        {
          id: 'c1',
          name: 'Martín Silva',
          estadoCliente: 'Antiguo',
          partyDate: '2026-11-26',
        },
      ],
      huboFalla: false,
    });
    getAllFiestasMock.mockResolvedValue([
      {
        id: 'f1',
        configuracion: {
          clienteId: 'c1',
          fechaEvento: '2026-11-26',
          nombreEvento: 'Cumple Martín',
        },
      },
    ]);

    const { host, cerrar } = await montar(React.createElement(CustomersPage));
    expect(host.textContent).toContain('Clientes con Eventos Futuros o Activos (1)');
    expect(host.textContent).not.toContain('Clientes Antiguos (1)');
    cerrar();
  });
});
