import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockToast = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/watermarked-image', () => ({ WatermarkedImage: () => null }));
jest.mock('@/app/actions/settings', () => ({ getInvoiceTemplateSettings: jest.fn(async () => ({ logoUrl: null })) }));
jest.mock('@/app/actions/customers', () => ({ getCustomers: jest.fn(async () => []) }));
jest.mock('@/app/actions/proveedores', () => ({ getProveedores: jest.fn(async () => []) }));
jest.mock('@/app/actions/activos-fijos', () => ({ getActivosFijos: jest.fn(async () => []) }));
jest.mock('@/app/actions/insumos', () => ({ getInsumos: jest.fn(async () => []) }));
jest.mock('@/app/actions/servicios-empresa', () => ({ getServiciosEmpresa: jest.fn(async () => []) }));
jest.mock('@/app/actions/menus-catering', () => ({ getMenus: jest.fn(async () => []) }));
jest.mock('@/app/actions/reposteria.actions', () => ({ getReposteriaMasterTemplate: jest.fn(async () => ({ categorias: [] })) }));
jest.mock('@/app/actions/bebidas.actions', () => ({ getBebidasMasterTemplate: jest.fn(async () => ({ categorias: [] })) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
jest.mock('@/app/actions/reportes', () => ({
  getProfitAndLossData: jest.fn(async () => ({
    success: true,
    data: {
      nombreEvento: 'Fiesta ficticia QA130',
      ingresos: { total: 0, detalle: [] },
      costos: { total: 0, detalle: [] },
      gananciaNeta: 0,
      margen: 0,
    },
  })),
}));
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (k: string) => (k === 'fiestaId' ? 'fiesta-qa-130' : null) }),
}));

import Clientes from '@/app/(app)/customers/reporte/page';
import Proveedores from '@/app/(app)/proveedores/reporte/page';
import Activos from '@/app/(app)/empresa/activos-fijos/reporte/page';
import Insumos from '@/app/(app)/empresa/insumos/reporte/page';
import Servicios from '@/app/(app)/empresa/servicios/reporte/page';
import Menus from '@/app/(app)/empresa/menus/reporte/page';
import Presupuestos from '@/app/(app)/presupuestos/reporte/page';
import ReporteFiesta from '@/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page';

const paginas: Array<[string, React.ComponentType]> = [
  ['clientes', Clientes],
  ['proveedores', Proveedores],
  ['activos', Activos],
  ['insumos', Insumos],
  ['servicios', Servicios],
  ['menus', Menus],
  ['presupuestos', Presupuestos],
  ['fiesta', ReporteFiesta],
];

const errores: any[] = [];
const mockShare = jest.fn();
let mockOpen: jest.SpyInstance;
let quietConsole: jest.SpyInstance;
const originales = new Map<string, PropertyDescriptor | undefined>();

function capturarError(event: ErrorEvent) {
  errores.push({ message: event.message, name: event.error?.name });
  event.preventDefault();
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  for (const key of ['share', 'canShare']) {
    originales.set(key, Object.getOwnPropertyDescriptor(navigator, key));
  }
  window.addEventListener('error', capturarError);
});

afterAll(() => {
  window.removeEventListener('error', capturarError);
  for (const [key, value] of originales) {
    if (value) Object.defineProperty(navigator, key, value);
    else Reflect.deleteProperty(navigator, key);
  }
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  jest.clearAllMocks();
  errores.length = 0;
  mockShare.mockResolvedValue(undefined);
  mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
  quietConsole = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  mockOpen.mockRestore();
  quietConsole.mockRestore();
});

function api(share: any, canShare: any) {
  Object.defineProperty(navigator, 'share', { configurable: true, value: share });
  Object.defineProperty(navigator, 'canShare', { configurable: true, value: canShare });
}

async function probar(C: React.ComponentType) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  try {
    await act(async () => {
      root.render(<C />);
    });
    const button = Array.from(host.querySelectorAll('button')).find(b =>
      /compartir/i.test(b.textContent || '')
    );
    expect(button).toBeTruthy();
    await act(async () => {
      button!.click();
    });
  } finally {
    act(() => root.unmount());
    host.remove();
  }
}

describe.each(paginas)('reporte %s compartir seguro', (nombre, C) => {
  test('control: sin Web Share usa WhatsApp y no produce error', async () => {
    api(undefined, undefined);
    await probar(C);
    expect(errores).toHaveLength(0);
    expect(mockShare).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('https://wa.me/'), '_blank');
  });

  test('control: con canShare=true usa compartir nativo', async () => {
    api(mockShare, () => true);
    await probar(C);
    expect(errores).toHaveLength(0);
    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();
  });

  test('con share pero sin canShare usa el nativo sin TypeError', async () => {
    api(mockShare, undefined);
    await probar(C);
    expect(errores).toHaveLength(0);
    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();
  });

  test('AbortError al compartir nativamente no abre WhatsApp ni muestra error', async () => {
    const abortErr = new Error('AbortError');
    abortErr.name = 'AbortError';
    mockShare.mockRejectedValue(abortErr);
    api(mockShare, () => true);
    await probar(C);
    expect(errores).toHaveLength(0);
    expect(mockShare).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();
  });
});

