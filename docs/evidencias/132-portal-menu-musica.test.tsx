import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';

const fiestaId = 'qa132-fiesta-ficticia';
const accessKey = 'llave-ficticia-132';
const mockParams = { id: fiestaId, fiestaId };
const mockRouter = { replace: jest.fn(), back: jest.fn() };
const mockToast = jest.fn();
const mockVerify = jest.fn(async (id: string) => id === fiestaId);
const mockSetCookie = jest.fn(async () => undefined);
const mockGetSongRequests = jest.fn(async () => []);
const mockMarkSongPlayed = jest.fn();
const mockVoteSongRequest = jest.fn();
const mockRawRead = jest.fn();
const mockToastRows: unknown[] = [];
const observations: Record<string, unknown>[] = [];
const database = new Map<string, any>();
const mockIssuedSessions = new Map<string, string>();
let failNextSave = false;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

jest.mock('next/navigation', () => ({ useParams: () => mockParams, useRouter: () => mockRouter }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: (...args: unknown[]) => mockToast(...args) }) }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: (...args: any[]) => mockVerify(...args), setPortalSessionCookie: (...args: any[]) => mockSetCookie(...args) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: (...args: any[]) => mockRawRead(...args) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: async (id: string) => clone(database.get(id) ?? null),
  saveFiesta: async (fiesta: any) => {
    if (failNextSave) { failNextSave = false; return { success: false, error: 'Fallo ficticio QA132 al persistir.' }; }
    database.set(fiesta.id, clone(fiesta));
    return { success: true, fiesta: clone(fiesta) };
  },
  getFiestas: async () => [...database.values()].map(clone),
}));
jest.mock('@/app/actions/presupuestos', () => ({ addPagoToPresupuesto: jest.fn(), getPresupuestoById: jest.fn(), updatePresupuesto: jest.fn() }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyClientPaymentApproved: jest.fn(), notifyClientPaymentRejected: jest.fn(), notifyClientPaymentSubmitted: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermiso: jest.fn(), requirePermisoAlguno: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/social-interactive', () => ({ getSongRequests: (...args: any[]) => mockGetSongRequests(...args), markSongPlayed: (...args: any[]) => mockMarkSongPlayed(...args), voteSongRequest: (...args: any[]) => mockVoteSongRequest(...args) }));
jest.mock('@/components/fiesta/FiestaThermometer', () => ({ FiestaThermometer: () => null }));
jest.mock('framer-motion', () => ({ motion: new Proxy({}, { get: () => 'div' }), AnimatePresence: ({ children }: any) => children }));

import MenuPage from '@/app/portal-cliente/[id]/menu/page';
import MusicPage from '@/app/portal-cliente/[id]/musica/page';
import DJPage from '@/app/evento/dj/[fiestaId]/page';
import { getFiestaForPortalSession, initializePortalSession, saveListaMusica, saveMenuSeleccion } from '@/app/actions/fiesta/portal.actions';
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';

beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  fs.writeFileSync('docs/evidencias/132-portal-observado.json', JSON.stringify({
    applicationSourceSha: 'd10f332a17241de5a4705a560336585853073a76',
    scope: 'REAL_PORTAL_PAGES_AND_ACTIONS_WITH_COPIED_IN_MEMORY_FIESTA_COOKIE_SESSION_AND_NOTIFICATION_DOUBLES_NOT_NEXT_BROWSER_OR_REAL_AUTH',
    observations, realAccountsOrMessagesTouched: false,
  }, null, 2) + '\n');
});
beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  database.clear();
  failNextSave = false;
  mockToastRows.length = 0;
  mockIssuedSessions.clear();
  mockRawRead.mockImplementation(async (id: string) => clone(database.get(id) ?? null));
  mockVerify.mockImplementation(async (id: string) => mockIssuedSessions.get(id) === database.get(id)?.clientPortalSettings?.accessKey && mockIssuedSessions.has(id));
  mockSetCookie.mockImplementation(async (id: string, key: string) => { mockIssuedSessions.set(id, key); });
  mockGetSongRequests.mockResolvedValue([]);
  sessionStorage.setItem(`portal_auth_${fiestaId}`, accessKey);
  database.set(fiestaId, {
    id: fiestaId,
    configuracion: { nombreEvento: 'Fiesta ficticia QA132' },
    clientPortalSettings: { enabled: true, accessKey },
    menuMesa: { entrada: 'Bruschetta ficticia', platoPrincipal: 'Pasta ficticia' },
    menuSeleccionPortal: { restriccionesAlimentarias: 'Sin gluten original QA132' },
    listaMusicaPortal: { imprescindibles: ['Tema inicial QA132'], siEsPosible: [], noQuiero: [] },
  });
});
afterEach(() => sessionStorage.clear());

async function mount(Page: React.ComponentType, label: string) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  observations.push({ caso: label, visibleText: host.textContent, toast: clone(mockToast.mock.calls),
    sessionCalls: clone(mockSetCookie.mock.calls), savedFiesta: clone(database.get(fiestaId)),
    menuPayloads: clone((saveMenuSeleccion as jest.Mock).mock?.calls ?? []),
    musicPayloads: clone((saveListaMusica as jest.Mock).mock?.calls ?? []) });
  return { host, close: () => { act(() => root.unmount()); host.remove(); } };
}

async function flush() { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); }
async function changeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function addByEnter(input: HTMLInputElement, value: string) {
  await changeValue(input, value);
  await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); });
}
function record(label: string, host: HTMLElement, extra: Record<string, unknown> = {}) {
  observations.push({ caso: label, visibleText: host.textContent, toasts: clone(mockToast.mock.calls),
    cookieCalls: clone(mockSetCookie.mock.calls), savedFiesta: clone(database.get(fiestaId)), ...extra });
}

test('sesión válida inicializa cookie solo tras validar la clave y el mapper entrega los campos de cliente', async () => {
  const result = await initializePortalSession(fiestaId, accessKey);
  const dto = await getFiestaForPortalSession(fiestaId);
  expect(result.success).toBe(true);
  expect(mockSetCookie).toHaveBeenCalledWith(fiestaId, accessKey);
  expect(dto).toEqual(mapFiestaToClientPortal(database.get(fiestaId)));
  expect(dto?.menuSeleccionPortal?.restriccionesAlimentarias).toBe('Sin gluten original QA132');
  record('sesion-valida-mapper', document.body, { result, dto: clone(dto) });
});

test('menú: editar y confirmar persiste la restricción tras desmontar y volver a montar', async () => {
  const first = await mount(MenuPage, 'menu-edicion');
  try {
    await flush();
    const input = first.host.querySelector('textarea#restricciones') as HTMLTextAreaElement;
    expect(input.value).toBe('Sin gluten original QA132');
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set; setter?.call(input, 'Alergia ficticia a nueces QA132'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { (Array.from(first.host.querySelectorAll('button')).find(b => b.textContent?.includes('Confirmar selección')) as HTMLButtonElement).click(); });
    expect(database.get(fiestaId).menuSeleccionPortal).toMatchObject({ restriccionesAlimentarias: 'Alergia ficticia a nueces QA132', confirmado: true });
    record('menu-guardado', first.host, { campo: input.value });
  } finally { first.close(); }
  const second = await mount(MenuPage, 'menu-remontado');
  try {
    await flush();
    expect((second.host.querySelector('textarea#restricciones') as HTMLTextAreaElement).value).toBe('Alergia ficticia a nueces QA132');
    expect(second.host.textContent).toContain('Confirmado el');
    record('menu-remontado', second.host);
  } finally { second.close(); }
});

test('error de guardado del menú deja el borrador visible e informa el error', async () => {
  failNextSave = true;
  const { host, close } = await mount(MenuPage, 'menu-fallo-guardado');
  try {
    await flush();
    const input = host.querySelector('textarea#restricciones') as HTMLTextAreaElement;
    await act(async () => { const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set; setter?.call(input, 'Borrador sin persistir QA132'); input.dispatchEvent(new Event('input', { bubbles: true })); });
    await act(async () => { (Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Confirmar selección')) as HTMLButtonElement).click(); });
    expect(input.value).toBe('Borrador sin persistir QA132');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', description: 'Fallo ficticio QA132 al persistir.', variant: 'destructive' }));
    expect(database.get(fiestaId).menuSeleccionPortal.restriccionesAlimentarias).toBe('Sin gluten original QA132');
    record('menu-fallo-guardado', host);
  } finally { close(); }
});

test.each([
  ['sesion-invalida', async () => mockVerify.mockResolvedValue(false)],
  ['evento-cruzado', async () => mockVerify.mockImplementation(async (id: string) => id === 'otro-evento-132')],
])('%s no expone controles ni permite mutación', async (label, configure) => {
  await configure();
  const before = clone(database.get(fiestaId));
  const { host, close } = await mount(MenuPage, label);
  try {
    await flush();
    expect(host.textContent).toContain('La sesión del portal venció o no corresponde a este evento.');
    expect(host.querySelector('textarea, button')).toBeNull();
    expect(database.get(fiestaId)).toEqual(before);
    record(label, host);
  } finally { close(); }
});

test('música: agrega por Enter y botón, elimina, guarda categorías y conserva tras recarga', async () => {
  const { host, close } = await mount(MusicPage, 'musica-edicion');
  try {
    await flush();
    const inputs = Array.from(host.querySelectorAll('input')) as HTMLInputElement[];
    await addByEnter(inputs[0], 'Artista - Enter QA132');
    await changeValue(inputs[1], 'Artista - Botón QA132');
    await act(async () => { (inputs[1].parentElement?.querySelector('button') as HTMLButtonElement).click(); });
    await addByEnter(inputs[2], 'Artista - Vetada QA132');
    expect(host.textContent).toContain('Artista - Enter QA132');
    expect(host.textContent).toContain('Artista - Botón QA132');
    const original = Array.from(host.querySelectorAll('span')).find(s => s.textContent === 'Tema inicial QA132');
    await act(async () => { (original?.parentElement?.querySelector('button') as HTMLButtonElement).click(); });
    await act(async () => { (Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Guardar')) as HTMLButtonElement).click(); });
    expect(database.get(fiestaId).listaMusicaPortal.imprescindibles).toEqual(['Artista - Enter QA132']);
    expect(database.get(fiestaId).listaMusicaPortal.siEsPosible).toEqual(['Artista - Botón QA132']);
    expect(database.get(fiestaId).listaMusicaPortal.noQuiero).toEqual(['Artista - Vetada QA132']);
    record('musica-guardada', host);
  } finally { close(); }
  const reloaded = await mount(MusicPage, 'musica-recarga');
  try {
    await flush();
    expect(reloaded.host.textContent).toContain('Artista - Botón QA132');
    expect(reloaded.host.textContent).toContain('Artista - Enter QA132');
    record('musica-recarga', reloaded.host);
  } finally { reloaded.close(); }
});

test('error de guardado musical conserva el borrador e informa el error', async () => {
  failNextSave = true;
  const { host, close } = await mount(MusicPage, 'musica-fallo-guardado');
  try {
    await flush();
    const input = host.querySelector('input') as HTMLInputElement;
    await addByEnter(input, 'Borrador música QA132');
    await act(async () => { (Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Guardar')) as HTMLButtonElement).click(); });
    expect(host.textContent).toContain('Borrador música QA132');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', description: 'Fallo ficticio QA132 al persistir.', variant: 'destructive' }));
    expect(database.get(fiestaId).listaMusicaPortal.siEsPosible).not.toContain('Borrador música QA132');
    record('musica-fallo-guardado', host);
  } finally { close(); }
});

test('el DJ muestra la canción "Si es posible" persistida por el portal con solicitudes vacías', async () => {
  const portal = await mount(MusicPage, 'musica-opcional-al-dj');
  try {
    const optionalInput = portal.host.querySelectorAll('input')[1] as HTMLInputElement;
    await addByEnter(optionalInput, 'Canción opcional QA132');
    await act(async () => { (Array.from(portal.host.querySelectorAll('button')).find(b => b.textContent?.includes('Guardar')) as HTMLButtonElement).click(); });
    expect(database.get(fiestaId).listaMusicaPortal.siEsPosible).toContain('Canción opcional QA132');
    record('opcional-guardada-portal', portal.host);
  } finally { portal.close(); }
  const { host, close } = await mount(DJPage, 'dj-cancion-opcional');
  try {
    await flush();
    expect(mockGetSongRequests).toHaveBeenCalledWith(fiestaId);
    record('dj-cancion-opcional', host, { songRequests: clone(mockGetSongRequests.mock.results.map(r => r.value)) });
    expect(host.textContent).toContain('Canción opcional QA132');
  } finally { close(); }
});

test('control: clave incorrecta no emite sesion ni permite leer el DTO', async () => {
  const result = await initializePortalSession(fiestaId, 'clave-ficticia-incorrecta');
  expect(result.success).toBe(false);
  expect(mockSetCookie).not.toHaveBeenCalled();
  expect(await getFiestaForPortalSession(fiestaId)).toBeNull();
  record('clave-incorrecta', document.body, { result });
});
