import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';

let mockFiesta: any;
let mockPerderRespuesta = false;
const mockParams = { tokenId: 'qa129-token-ficticio' };
const mockToast = jest.fn();
const copy = (value: any) => JSON.parse(JSON.stringify(value));
jest.mock('next/navigation', () => ({ useParams: () => mockParams }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
jest.mock('@/components/company-logo', () => ({ CompanyLogo: () => null }));
jest.mock('@/components/public-footer', () => ({ PublicFooter: () => null }));
jest.mock('@/components/legal/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_path: string, fallback: any) => fallback), writeData: jest.fn() }));
jest.mock('@/app/actions/accesos-personal', () => ({ getAccesoById: jest.fn(async () => ({
  id: 'qa129-token-ficticio', fiestaId: 'qa129-fiesta', empleadoId: 'qa129-empleado',
  nombreAcceso: 'Persona ficticia QA129', permisos: [], fechaCreacion: '2026-10-14T12:00:00Z',
})) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => copy(mockFiesta)) }));
jest.mock('@/app/actions/roles', () => ({ getRolesPublicos: jest.fn(async () => [{ id: 'qa129-rol', nombre: 'Operador ficticio' }]) }));
jest.mock('@/app/actions/settings', () => ({ getAjustesLlegadaPersonal: jest.fn(async () => ({ llegadaConUbicacion: false, radioMetros: 300 })) }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn(async (_id: string, cambiar: any) => {
  mockFiesta = copy(await cambiar(copy(mockFiesta))); return { success: true, updatedFiesta: copy(mockFiesta) };
}) }));
jest.mock('@/app/actions/accesos-personal-view', () => {
  const actual = jest.requireActual('@/app/actions/accesos-personal-view');
  return { ...actual, registrarLlegadaPersonal: async (...args: any[]) => {
    const result = await actual.registrarLlegadaPersonal(...args);
    if (mockPerderRespuesta && result.success) { mockPerderRespuesta = false; throw new Error('QA129 respuesta perdida DESPUES del guardado'); }
    return result;
  } };
});
import Page from '@/app/acceso-personal/[tokenId]/page';

const inicial = '2026-10-15T23:00:00.000Z';
const tarde = '2026-10-15T23:05:00.000Z';
beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
afterAll(() => Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));
beforeEach(() => {
  jest.clearAllMocks(); jest.useFakeTimers(); jest.setSystemTime(new Date(inicial));
  mockPerderRespuesta = false;
  mockFiesta = { id: 'qa129-fiesta', configuracion: { nombreEvento: 'Fiesta ficticia QA129', nombreLugar: 'Salon ficticio' },
    personalAsignado: [{ empleadoId: 'qa129-empleado', rolId: 'qa129-rol' }], programa: [] };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_ok: any, error: any) => error({ code: 1 }) } });
});
afterEach(() => { jest.useRealTimers(); Reflect.deleteProperty(navigator, 'geolocation'); });
async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}
async function llegar(host: HTMLElement) {
  const b = Array.from(host.querySelectorAll('button')).find(n => n.textContent?.trim() === 'Llegué');
  if (!b) throw new Error('No se encontro el boton real Llegue');
  await act(async () => { b.click(); });
}
const hora = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

test('control: llegada sin corte muestra la hora que quedo guardada', async () => {
  const { host, cerrar } = await montar();
  try {
    await llegar(host);
    expect(mockFiesta.personalAsignado[0].checkInTimestamp).toBe(inicial);
    expect(host.textContent).toContain(`Llegada registrada: ${hora(inicial)}`);
  } finally { cerrar(); }
});

test('tras perder respuesta y reintentar, muestra la hora ORIGINAL que el servidor preserva', async () => {
  mockPerderRespuesta = true;
  const first = await montar();
  let textoReintento = '';
  try {
    await llegar(first.host);
    expect(mockFiesta.personalAsignado[0].checkInTimestamp).toBe(inicial);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error' }));
    jest.setSystemTime(new Date(tarde));
    await llegar(first.host);
    expect(mockFiesta.personalAsignado[0].checkInTimestamp).toBe(inicial);
    textoReintento = first.host.textContent || '';
  } finally { first.cerrar(); }
  const recarga = await montar();
  try {
    const textoRecarga = recarga.host.textContent || '';
    fs.writeFileSync('docs/evidencias/131-retest166-personal-llegada-observado.json', JSON.stringify({
      applicationSourceSha: 'e8cd2c2b114bcda21d153cb406318cc1119d1dc5',
      scope: 'REAL_REACT_PAGE_REAL_VIEW_REAL_ARRIVAL_ACTION_WITH_DATA_AUTH_GPS_DOUBLES_NOT_NATIVE_BROWSER',
      injected: 'Respuesta perdida despues del primer guardado; reintento cinco minutos despues',
      persistedTimestamp: mockFiesta.personalAsignado[0].checkInTimestamp,
      expectedVisibleTime: hora(inicial), retryVisibleTime: hora(tarde), textoReintento, textoRecarga,
      realAccountsOrCoordinatesTouched: false,
    }, null, 2) + '\n');
    expect(textoRecarga).toContain(`Llegada registrada: ${hora(inicial)}`);
    expect(textoReintento).toContain(`Llegada registrada: ${hora(inicial)}`);
  } finally { recarga.cerrar(); }
});
