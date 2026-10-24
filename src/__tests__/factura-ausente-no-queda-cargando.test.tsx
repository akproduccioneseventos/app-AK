/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ViewInvoicePage from '@/app/(app)/invoices/[id]/page';
import CartaTragosPage from '@/app/(app)/fiestas/nueva/carta-tragos/page';
import InvitadosPage from '@/app/(app)/fiestas/nueva/invitados/page';
import PantallasTotemPage from '@/app/(app)/fiestas/nueva/pantallas-totem/page';

const mockInvoice = jest.fn();
const mockSettings = jest.fn();
const mockBudgets = jest.fn();
const mockToast = jest.fn();
const mockGetFiestaById = jest.fn();
const mockGetCartaTragosMaster = jest.fn();

const stableRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const stableToast = { toast: mockToast };
const stableSearchParams = new URLSearchParams('fiestaId=qa-fiesta-ausente');

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'qa-factura-ausente' }),
  useSearchParams: () => stableSearchParams,
  useRouter: () => stableRouter,
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => stableToast,
}));

jest.mock('@/app/actions/invoices', () => ({
  getInvoiceById: (...args: unknown[]) => mockInvoice(...args),
  addPaymentToInvoice: jest.fn(),
}));

jest.mock('@/app/actions/settings', () => ({
  getInvoiceTemplateSettings: (...args: unknown[]) => mockSettings(...args),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestos: (...args: unknown[]) => mockBudgets(...args),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  getFiestas: jest.fn(async () => []),
  updateFiestaPartial: jest.fn(async () => ({ success: true })),
  updateCartaTragos: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  addInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  updateInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  deleteInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  updateSocialGallerySettingsFiestaActual: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/carta-tragos-master.actions', () => ({
  getCartaTragosMaster: (...args: unknown[]) => mockGetCartaTragosMaster(...args),
}));

jest.mock('html2canvas', () => jest.fn());

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mockInvoice.mockReset();
  mockSettings.mockReset();
  mockBudgets.mockReset();
  mockToast.mockReset();
  mockGetFiestaById.mockReset();
  mockGetCartaTragosMaster.mockReset();

  mockSettings.mockResolvedValue({ companyName: 'AK Producciones' });
  mockBudgets.mockResolvedValue([]);
  mockGetCartaTragosMaster.mockResolvedValue([]);

  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });
  container.remove();
});

describe('Pantallas no quedan cargando para siempre ante dato ausente (Orden 224)', () => {
  test('factura ausente: al terminar la lectura sin factura deja de girar y muestra cartel', async () => {
    mockInvoice.mockResolvedValue(null);
    await act(async () => {
      root.render(<ViewInvoicePage />);
      await Promise.resolve();
    });

    expect(mockInvoice).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Factura no encontrada');
  });

  test('fiesta ausente en carta de tragos: deja de girar y muestra cartel', async () => {
    mockGetFiestaById.mockResolvedValue(null);
    await act(async () => {
      root.render(<CartaTragosPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });

  test('fiesta ausente en gestión de invitados: deja de girar y muestra cartel', async () => {
    mockGetFiestaById.mockResolvedValue(null);
    await act(async () => {
      root.render(<InvitadosPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });

  test('fiesta ausente en pantallas tótem: deja de girar y muestra cartel', async () => {
    mockGetFiestaById.mockResolvedValue(null);
    await act(async () => {
      root.render(<PantallasTotemPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });
});
