jest.setTimeout(25000);
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockGetPosts = jest.fn();
const mockGetEvent = jest.fn();
const mockGetPoll = jest.fn();
const mockGetDedications = jest.fn();
const mockGetChat = jest.fn();
const mockGetSongs = jest.fn();

jest.mock('next/navigation', () => ({ useParams: () => ({ fiestaId: 'muro-test' }) }));
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => 'div' }),
  AnimatePresence: ({ children }: any) => children,
}));
jest.mock('qrcode.react', () => ({ QRCodeSVG: () => null }));
jest.mock('lucide-react', () => new Proxy({}, { get: () => () => null }));
jest.mock('@/hooks/use-pantalla-prendida', () => ({ usePantallaPrendida: jest.fn() }));
jest.mock('@/components/entretenimiento/ReconnectingIndicator', () => ({ ReconnectingIndicator: ({ isReconnecting }: any) => isReconnecting ? <span>Reconectando prueba</span> : null }));
jest.mock('@/app/actions/social-gallery', () => ({
  getPublicSocialPosts: (...args: any[]) => mockGetPosts(...args),
  getPublicSocialEvent: (...args: any[]) => mockGetEvent(...args),
  getChatMessages: (...args: any[]) => mockGetChat(...args),
  getPublicInstagramFeedAction: jest.fn(async () => null),
}));
jest.mock('@/app/actions/social-interactive', () => ({
  getActivePoll: (...args: any[]) => mockGetPoll(...args),
  getDedications: (...args: any[]) => mockGetDedications(...args),
  getSongRequests: (...args: any[]) => mockGetSongs(...args),
}));
jest.mock('@/app/actions/settings', () => ({
  getCompanyInfoPublica: jest.fn(async () => null),
  getInvoiceTemplateSettings: jest.fn(async () => null),
}));
jest.mock('@/app/actions/social-connections', () => ({ getSocialConnectionsPublicas: jest.fn(async () => []) }));

import MuroEnVivoPage from '@/app/evento/muro-en-vivo/[fiestaId]/page';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

async function flush() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

describe('mural con lecturas secundarias lentas', () => {
  let root: ReturnType<typeof createRoot> | null = null;

  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    mockGetPosts.mockReset();
    mockGetEvent.mockReset();
    mockGetPoll.mockReset();
    mockGetDedications.mockReset();
    mockGetChat.mockReset();
    mockGetSongs.mockReset();
    mockGetEvent.mockResolvedValue({ configuracion: { nombreEvento: 'Fiesta prueba' } });
    mockGetPoll.mockResolvedValue(null);
    mockGetDedications.mockResolvedValue([]);
    mockGetChat.mockResolvedValue([]);
    mockGetSongs.mockResolvedValue([]);
    document.body.replaceChildren();
  });

  afterEach(() => {
    if (root) act(() => root?.unmount());
    root = null;
  });

  it('pinta fotos aprobadas sin esperar el chat y no duplica solicitudes', async () => {
    const stuckChat = deferred<any[]>();
    const foto = {
      id: 'foto-1', fiestaId: 'muro-test', imageUrl: 'https://img.test/foto.jpg',
      authorName: 'Invitada', timestamp: new Date().toISOString(), likes: 0, comments: [], moderationStatus: 'approved',
    };
    mockGetPosts.mockResolvedValue([foto]);
    mockGetChat.mockReturnValue(stuckChat.promise);

    await act(async () => {
      root = createRoot(document.body.appendChild(document.createElement('div')));
      root.render(<MuroEnVivoPage />);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
    expect(mockGetPosts).toHaveBeenCalledTimes(1);
    expect(document.querySelector('img[src="https://img.test/foto.jpg"]')).toBeTruthy();
    expect(document.body.textContent).not.toContain('Reconectando prueba');

    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(mockGetPosts).toHaveBeenCalledTimes(1);
    expect(mockGetChat).toHaveBeenCalledTimes(1);

    await act(async () => { root?.unmount(); root = null; });
    stuckChat.resolve([]);
  }, 10000);

  it('conserva fotos y chat previos ante falla primaria mientras otra consulta sigue pendiente', async () => {
    const stuckChat = deferred<any[]>();
    const foto = { id: 'foto-1', fiestaId: 'muro-test', imageUrl: 'https://img.test/foto.jpg', authorName: 'Invitada', timestamp: new Date().toISOString(), moderationStatus: 'approved' };
    mockGetPosts.mockResolvedValue([foto]);
    mockGetChat.mockResolvedValue([{ id: 'chat1', authorName: 'Ana', text: 'Mensaje anterior', timestamp: new Date().toISOString() }]);
    await act(async () => {
      root = createRoot(document.body.appendChild(document.createElement('div')));
      root.render(<MuroEnVivoPage />);
    });
    await flush();
    expect(document.body.textContent).toContain('Mensaje anterior');
    mockGetPosts.mockRejectedValue(new Error('lectura primaria caida'));
    mockGetChat.mockReturnValue(stuckChat.promise);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await flush();
    expect(document.body.textContent).toContain('Reconectando prueba');
    expect(document.body.textContent).toContain('Mensaje anterior');
    expect(document.querySelector('img[src="https://img.test/foto.jpg"]')).toBeTruthy();
    const llamadas = mockGetPosts.mock.calls.length;
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(mockGetPosts).toHaveBeenCalledTimes(llamadas);
    stuckChat.resolve([]);
    await flush();
  });
});
