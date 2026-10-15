import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const mockParams = { id: 'qa130-fiesta-ficticia' };
const mockRouter = { replace: jest.fn(), back: jest.fn() };
const mockPosts = jest.fn();
const mockDedications = jest.fn();
const mockSession = jest.fn();
let mockFiesta: any;

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => mockRouter,
}));
jest.mock('@/app/actions/fiesta/portal.actions', () => ({
  initializePortalSession: (...args: any[]) => mockSession(...args),
  getFiestaForPortalSession: jest.fn(async () =>
    jest.requireActual('@/lib/client-portal/public-fiesta').mapFiestaToClientPortal(mockFiesta)
  ),
}));
jest.mock('@/app/actions/social-gallery', () => ({
  getSocialPosts: (...args: any[]) => mockPosts(...args),
}));
jest.mock('@/app/actions/social-interactive', () => ({
  getDedications: (...args: any[]) => mockDedications(...args),
}));
jest.mock('@/components/album/TuVideoDeLaFiestaModal', () => ({
  TuVideoDeLaFiestaModal: () => null,
}));

import Page from '@/app/portal-cliente/[id]/fotos-video/page';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});

afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('portal_auth_qa130-fiesta-ficticia', 'llave-ficticia-solo-jsdom');
  mockSession.mockResolvedValue({ success: true });
  mockPosts.mockResolvedValue([]);
  mockDedications.mockResolvedValue([]);
  mockFiesta = {
    id: mockParams.id,
    configuracion: { nombreEvento: 'Fiesta ficticia QA130' },
    modulosContratados: { muroSocial: true },
    socialGallerySettings: { showDedications: true },
    fotografiaYFilmacion: {
      servicios: [
        {
          id: 'entrega-qa130',
          nombre: 'Album ficticio QA130',
          estado: 'Entregado completo',
          linkEntrega: 'https://example.invalid/qa130-album',
        },
      ],
    },
  };
});

afterEach(() => sessionStorage.clear());

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(<Page />);
  });
  return {
    host,
    cerrar: () => {
      act(() => root.unmount());
      host.remove();
    },
  };
}

const errorVisible = (host: HTMLElement) =>
  /(no.{0,35}(pud|carg|dispon)|error|reintent|pendiente de cargar)/i.test(host.textContent || '');

const foto = {
  id: 'foto-qa130',
  imageUrl: 'https://example.invalid/qa130-foto.jpg',
  mediaType: 'image',
  source: 'invitado',
  timestamp: '2026-10-15T12:00:00Z',
};

const dedicatoria = {
  id: 'audio-qa130',
  authorName: 'Invitado ficticio QA130',
  message: 'Audio ficticio',
  audioUrl: 'https://example.invalid/qa130-audio.webm',
  timestamp: '2026-10-15T12:00:00Z',
};

describe('portal fotos y audios con manejo de error', () => {
  test('control: un vacio comprobado muestra cero fotos y conserva entrega oficial', async () => {
    const { host, cerrar } = await montar();
    try {
      expect(host.textContent).toContain('0 fotos compartidas en el muro');
      expect(host.querySelector('a[href="https://example.invalid/qa130-album"]')).not.toBeNull();
      expect(errorVisible(host)).toBe(false);
    } finally {
      cerrar();
    }
  });

  test('control: con fotos y audios reales se muestran ambos', async () => {
    mockPosts.mockResolvedValue([foto]);
    mockDedications.mockResolvedValue([dedicatoria]);
    const { host, cerrar } = await montar();
    try {
      expect(host.textContent).toContain('1 fotos compartidas en el muro');
      expect(host.textContent).toContain('Invitado ficticio QA130');
      expect(host.querySelector('audio')).not.toBeNull();
    } finally {
      cerrar();
    }
  });

  test('si falla leer fotos, no presenta cero confirmado sin un aviso de error y permite reintentar', async () => {
    mockPosts.mockRejectedValue(new Error('QA130 no se pudieron leer las fotos'));
    mockDedications.mockResolvedValue([dedicatoria]);
    const { host, cerrar } = await montar();
    try {
      expect(errorVisible(host)).toBe(true);
      expect(host.textContent).not.toContain('0 fotos compartidas en el muro');
      expect(host.textContent).toContain('No pudimos cargar las fotos ahora. Reintentar.');
    } finally {
      cerrar();
    }
  });

  test('si falla leer audios, informa el error con reintento en vez de esconder la seccion', async () => {
    mockPosts.mockResolvedValue([foto]);
    mockDedications.mockRejectedValue(new Error('QA130 no se pudieron leer los audios'));
    const { host, cerrar } = await montar();
    try {
      expect(errorVisible(host)).toBe(true);
      expect(host.textContent).toContain('No pudimos cargar los audios ahora. Reintentar.');
    } finally {
      cerrar();
    }
  });

  test('control: sesion invalida no muestra las entregas oficiales', async () => {
    mockSession.mockResolvedValue({ success: false });
    const { host, cerrar } = await montar();
    try {
      expect(host.textContent).toContain('La sesión del portal venció');
      expect(host.querySelector('a[href="https://example.invalid/qa130-album"]')).toBeNull();
      expect(sessionStorage.getItem('portal_auth_qa130-fiesta-ficticia')).toBeNull();
    } finally {
      cerrar();
    }
  });
});

