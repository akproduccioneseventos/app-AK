/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ViewInvoicePage from '@/app/(app)/invoices/[id]/page';
import GestionDocumentalPage from '@/app/(app)/fiestas/nueva/gestion-documental/page';
import InvitadosPage from '@/app/(app)/fiestas/nueva/invitados/page';
import PantallasTotemPage from '@/components/panels/fiesta--pantallas-totem';
import TragosMasterPage from '@/components/panels/menus--tragos';

const mockInvoice = jest.fn();
const mockSettings = jest.fn();
const mockBudgets = jest.fn();
const mockToast = jest.fn();
const mockGetFiestaById = jest.fn();
const mockGetFiestaParaPantalla = jest.fn();
const mockGetCartaTragosMaster = jest.fn();

const stableRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const stableToast = { toast: mockToast };
const stableSearchParams = new URLSearchParams('fiestaId=qa-fiesta-ausente');

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

jest.mock('next/navigation', () => ({
  usePathname: () => '/fiestas/nueva/invitados',
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
  getFiestaParaPantalla: (...args: unknown[]) => mockGetFiestaParaPantalla(...args),
  getFiestas: jest.fn(async () => []),
  updateFiestaPartial: jest.fn(async () => ({ success: true })),
  updateCartaTragos: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: (...args: unknown[]) => mockGetFiestaById(...args),
  getFiestaParaPantalla: (...args: unknown[]) => mockGetFiestaParaPantalla(...args),
  addInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  updateInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  deleteInvitadoFiestaActual: jest.fn(async () => ({ success: true })),
  updateSocialGallerySettingsFiestaActual: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/carta-tragos-master.actions', () => ({
  getCartaTragosMaster: (...args: unknown[]) => mockGetCartaTragosMaster(...args),
  saveCartaTragosMaster: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/insumos', () => ({
  getInsumos: jest.fn(async () => []),
  saveInsumo: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/servicios-empresa', () => ({
  getServiciosEmpresa: jest.fn(async () => []),
  saveServicioEmpresa: jest.fn(async () => ({ success: true })),
}));

jest.mock('@/app/actions/sesion', () => ({
  getMisPermisos: jest.fn(async () => ({ permisos: [] })),
  esSesionDeSoloLectura: jest.fn(async () => false),
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
  mockGetFiestaParaPantalla.mockReset();
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

describe('Pantallas no quedan cargando para siempre ante dato ausente o falla (Orden 224 y 228)', () => {
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

  test('gestión documental (reemplazo con getFiestaParaPantalla tras consolidar carta-tragos en Orden 321): con carga rechazada muestra No se pudo cargar, y con fiesta ausente muestra Fiesta no encontrada', async () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(nextConfig).toContain("source: '/fiestas/nueva/carta-tragos'");
    expect(nextConfig).toContain("destination: '/fiestas/nueva'");

    mockGetFiestaParaPantalla.mockRejectedValueOnce(new Error('FALLO_RED'));
    await act(async () => {
      root.render(<GestionDocumentalPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('No se pudo cargar');

    mockGetFiestaParaPantalla.mockResolvedValueOnce({ fiesta: null, fallo: false });
    await act(async () => {
      root.unmount();
      root = createRoot(container);
      root.render(<GestionDocumentalPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });

  test('panel maestro de tragos: con carga rechazada deja de girar', async () => {
    mockGetCartaTragosMaster.mockRejectedValueOnce(new Error('FALLO_RED'));
    await act(async () => {
      root.render(<TragosMasterPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  test('gestión de invitados: con carga rechazada muestra No se pudo cargar, y con fiesta ausente muestra Fiesta no encontrada', async () => {
    mockGetFiestaParaPantalla.mockRejectedValueOnce(new Error('FALLO_RED'));
    await act(async () => {
      root.render(<InvitadosPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('No se pudo cargar');

    mockGetFiestaParaPantalla.mockResolvedValueOnce({ fiesta: null, fallo: false });
    await act(async () => {
      root.unmount();
      root = createRoot(container);
      root.render(<InvitadosPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });

  test('pantallas tótem: con carga rechazada muestra No se pudo cargar, y con fiesta ausente muestra Fiesta no encontrada', async () => {
    mockGetFiestaParaPantalla.mockRejectedValueOnce(new Error('FALLO_RED'));
    await act(async () => {
      root.render(<PantallasTotemPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('No se pudo cargar');

    mockGetFiestaParaPantalla.mockResolvedValueOnce({ fiesta: null, fallo: false });
    await act(async () => {
      root.unmount();
      root = createRoot(container);
      root.render(<PantallasTotemPage />);
      await Promise.resolve();
    });

    expect(container.querySelector('.animate-spin')).toBeNull();
    expect(container.textContent).toContain('Fiesta no encontrada');
  });
});
