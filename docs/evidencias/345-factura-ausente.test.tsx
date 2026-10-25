/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ViewInvoicePage from '@/app/(app)/invoices/[id]/page';

const mockInvoice = jest.fn();
const mockSettings = jest.fn();
const mockBudgets = jest.fn();
const mockToast = jest.fn();
jest.mock('next/navigation', () => ({ useParams: () => ({ id: 'qa345-missing' }), useRouter: () => ({}) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/app/actions/invoices', () => ({ getInvoiceById: (...args: unknown[]) => mockInvoice(...args), addPaymentToInvoice: jest.fn() }));
jest.mock('@/app/actions/settings', () => ({ getInvoiceTemplateSettings: (...args: unknown[]) => mockSettings(...args) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: (...args: unknown[]) => mockBudgets(...args) }));

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  mockInvoice.mockReset(); mockSettings.mockReset(); mockBudgets.mockReset(); mockToast.mockReset();
  mockSettings.mockResolvedValue({ companyName: 'AK QA' });
  mockBudgets.mockResolvedValue([]);
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

test('control: mientras la lectura sigue pendiente se muestra carga', async () => {
  mockInvoice.mockImplementation(() => new Promise(() => {}));
  await act(async () => { root.render(<ViewInvoicePage />); });
  expect(mockInvoice).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.animate-spin')).not.toBeNull();
});

test('si la lectura termina sin factura no debe seguir cargando para siempre', async () => {
  mockInvoice.mockResolvedValue(null);
  await act(async () => { root.render(<ViewInvoicePage />); await Promise.resolve(); });
  expect(mockInvoice).toHaveBeenCalledTimes(1);
  expect(mockSettings).toHaveBeenCalledTimes(1);
  expect(mockBudgets).toHaveBeenCalledTimes(1);
  expect(mockToast).not.toHaveBeenCalled();
  expect(container.querySelector('.animate-spin')).toBeNull();
});
