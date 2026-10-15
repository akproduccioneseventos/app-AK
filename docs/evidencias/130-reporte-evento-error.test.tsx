import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
let mockId: string | null;
const mockParams = { get: (key: string) => key === 'fiestaId' ? mockId : null };
const mockReporte = jest.fn(), mockToast = jest.fn();
const rows: any[] = [];
jest.mock('next/navigation', () => ({ useSearchParams: () => mockParams }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => <a href={href}>{children}</a> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/watermarked-image', () => ({ WatermarkedImage: () => null }));
jest.mock('@/app/actions/settings', () => ({ getInvoiceTemplateSettings: jest.fn(async () => ({ logoUrl: null })) }));
jest.mock('@/app/actions/reportes', () => ({ getProfitAndLossData: (...args: any[]) => mockReporte(...args) }));
import Page from '@/app/(app)/fiestas/nueva/gestion-costos-rentabilidad/reporte/page';

beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  fs.writeFileSync('docs/evidencias/130-reporte-evento-observado.json', JSON.stringify({
    applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    scope: 'REAL_REACT_EVENT_REPORT_WITH_QUERY_AND_ACTION_RESPONSE_DOUBLES_NOT_NATIVE_BROWSER', rows,
    realMoneyOrAccountsTouched: false,
  }, null, 2) + '\n');
});
beforeEach(() => {
  jest.clearAllMocks(); mockId = 'qa130-fiesta-ficticia';
  mockReporte.mockResolvedValue({ success: true, data: { nombreEvento: 'Fiesta ficticia QA130',
    ingresos: { total: 0, detalle: [] }, costos: { total: 0, detalle: [] }, gananciaNeta: 0, margen: 0 } });
});
async function montar(caso: string) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  rows.push({ caso, fiestaId: mockId, text: host.textContent, toastCalls: mockToast.mock.calls, reportCalls: mockReporte.mock.calls });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

test('control: sin fiesta pide elegir y no consulta el reporte', async () => {
  mockId = null; const { host, cerrar } = await montar('sin-id');
  try { expect(host.textContent).toContain('Elegí una fiesta'); expect(mockReporte).not.toHaveBeenCalled(); }
  finally { cerrar(); }
});
test('control: una fiesta elegida con reporte vacio valido muestra el reporte', async () => {
  const { host, cerrar } = await montar('id-y-reporte-validos');
  try { expect(host.textContent).toContain('Reporte Financiero de Evento'); expect(host.textContent).toContain('Fiesta ficticia QA130'); expect(host.textContent).not.toContain('Elegí una fiesta'); }
  finally { cerrar(); }
});
test.each([
  ['error-devuelto', () => Promise.resolve({ success: false, error: 'QA130 no se pudo leer el reporte' })],
  ['error-de-red', () => Promise.reject(new Error('QA130 red no disponible'))],
])('una fiesta YA elegida con %s no se disfraza de falta de seleccion', async (caso, falla) => {
  mockReporte.mockImplementation(falla); const { host, cerrar } = await montar(caso);
  try {
    expect(mockReporte.mock.calls[0][1]).toEqual({ fiestaId: 'qa130-fiesta-ficticia' });
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    expect(host.textContent).not.toContain('Elegí una fiesta');
    expect(/error|no.{0,25}(pud|carg)|reintent/i.test(host.textContent || '')).toBe(true);
  } finally { cerrar(); }
});
