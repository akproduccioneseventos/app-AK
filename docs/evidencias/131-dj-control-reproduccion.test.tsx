import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';

const mockCopy = (x: any) => JSON.parse(JSON.stringify(x));
let mockSong: any;
let mockRejectWrite = false;
const mockPermission = jest.fn();
const observations: any[] = [];
jest.mock('next/navigation', () => ({ useParams: () => ({ fiestaId: 'qa131-fiesta' }) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: { collection: () => ({ doc: () => ({
  get: async () => ({ exists: true, data: () => mockCopy(mockSong) }),
  update: async (delta: any) => { if (mockRejectWrite) throw new Error('QA131 storage no disponible'); mockSong = { ...mockSong, ...mockCopy(delta) }; },
}) }) } }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: (...args: any[]) => mockPermission(...args) }));
jest.mock('@/lib/auth/require-session', () => ({ hasAppSession: jest.fn(async () => false) }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({}));
jest.mock('@/lib/social-fiesta/content-review', () => ({ reviewSocialContent: jest.fn(), sanitizeSocialText: (s: string) => s }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/commercial/social-interaction-rate-limit', () => ({ enforceSocialInteractionRateLimit: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({ id: 'qa131-fiesta', configuracion: { nombreEvento: 'Fiesta ficticia QA131' }, invitados: [] })), saveFiesta: jest.fn(),
}));
jest.mock('@/components/fiesta/FiestaThermometer', () => ({ FiestaThermometer: () => null }));
jest.mock('framer-motion', () => ({ motion: { div: ({ children, initial, animate, exit, transition, ...props }: any) => <div {...props}>{children}</div> }, AnimatePresence: ({ children }: any) => children }));
jest.mock('@/app/actions/social-interactive', () => {
  const actual = jest.requireActual('@/app/actions/social-interactive');
  return { ...actual, getSongRequests: jest.fn(async () => [mockCopy(mockSong)]), voteSongRequest: jest.fn(async () => ({ success: true })) };
});
import DJPage from '@/app/evento/dj/[fiestaId]/page';
import { markSongPlayed } from '@/app/actions/social-interactive';

beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
beforeEach(() => {
  jest.clearAllMocks(); jest.useFakeTimers(); jest.setSystemTime(new Date('2026-10-15T16:00:00Z'));
  mockPermission.mockResolvedValue({}); mockRejectWrite = false;
  mockSong = { id: 'qa131-cancion', fiestaId: 'qa131-fiesta', song: 'Tema ficticio QA131', requestedBy: 'Invitado ficticio', votes: 3, played: false, timestamp: '2026-10-15T15:59:00Z' };
});
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  fs.writeFileSync('docs/evidencias/131-dj-observado.json', JSON.stringify({ applicationSourceSha: 'e8cd2c2b114bcda21d153cb406318cc1119d1dc5', scope: 'REAL_REACT_DJ_PAGE_REAL_MARK_ACTION_WITH_SYNTHETIC_FIRESTORE_AUTH_READ_DOUBLES_NOT_NATIVE_BROWSER', observations, realAccountsOrMessagesTouched: false }, null, 2) + '\n');
});
async function mount() {
  const host = document.body.appendChild(document.createElement('div')), root = createRoot(host);
  await act(async () => { root.render(<DJPage />); });
  return { host, close: () => { act(() => root.unmount()); host.remove(); } };
}
async function click(host: HTMLElement, label: string) {
  const button = host.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement | null;
  if (!button) throw new Error('QA131 boton visible no encontrado: ' + label);
  await act(async () => { button.click(); });
}
test('control: marcar pendiente cambia el estado persistido y desaparece de pendientes', async () => {
  const page = await mount();
  try {
    await click(page.host, 'Marcar como reproducida');
    observations.push({ case: 'marcar', persisted: mockCopy(mockSong), text: page.host.textContent });
    expect(mockSong.played).toBe(true);
    expect(page.host.textContent).toContain('No hay pedidos pendientes');
    expect(mockPermission).toHaveBeenCalled();
  } finally { page.close(); }
});
test('Marcar como no reproducida devuelve una cancion a pendientes y persiste tras recarga', async () => {
  mockSong.played = true;
  const page = await mount();
  let beforeReload: any;
  try {
    const all = Array.from(page.host.querySelectorAll('button')).find(b => b.textContent === 'Solo pendientes');
    if (!all) throw new Error('QA131 filtro de lista no encontrado');
    await act(async () => { all.click(); });
    await click(page.host, 'Marcar como no reproducida');
    beforeReload = { persisted: mockCopy(mockSong), text: page.host.textContent, remainsUnmarkButton: !!page.host.querySelector('button[aria-label="Marcar como no reproducida"]') };
  } finally { page.close(); }
  const reloaded = await mount();
  try {
    observations.push({ case: 'desmarcar', ...beforeReload, reloadText: reloaded.host.textContent });
    expect(mockSong.played).toBe(false);
    expect(reloaded.host.textContent).toContain('Tema ficticio QA131');
    expect(reloaded.host.querySelector('button[aria-label="Marcar como reproducida"]')).not.toBeNull();
  } finally { reloaded.close(); }
});
test('control: una cancion de otra fiesta no cambia aunque se conozca el id', async () => {
  mockSong.fiestaId = 'qa131-otra-fiesta';
  const result = await markSongPlayed('qa131-fiesta', mockSong.id);
  observations.push({ case: 'otra-fiesta', result, persisted: mockCopy(mockSong) });
  expect(result.success).toBe(false); expect(mockSong.played).toBe(false);
});
test('si falla guardar la marca, la pantalla informa el error y permite reintentar', async () => {
  mockRejectWrite = true;
  const page = await mount();
  try {
    await click(page.host, 'Marcar como reproducida');
    observations.push({ case: 'guardado-fallido', persisted: mockCopy(mockSong), text: page.host.textContent });
    expect(mockSong.played).toBe(false);
    expect(page.host.textContent).toMatch(/no (se )?pudo|no pudimos|error|reintent/i);
    expect((page.host.querySelector('button[aria-label="Marcar como reproducida"]') as HTMLButtonElement).disabled).toBe(false);
  } finally { page.close(); }
});
