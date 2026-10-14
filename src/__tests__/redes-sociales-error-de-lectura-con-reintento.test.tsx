/**
 * /empresa/redes-sociales: si falla la lectura de publicaciones, la pantalla lo dice de forma
 * persistente (no alcanza con el aviso que se cierra) y ofrece "Reintentar", que vuelve a leer
 * SOLO la lista de la app (getSocialPosts). Un vacío verdadero NO muestra error.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const getSocialPosts = jest.fn();
const getFiestaActual = jest.fn();
const getHistorialFiestas = jest.fn();
const deleteSocialPost = jest.fn();
const generateDraft = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/app/actions/social-media', () => ({
  getSocialPosts: (...a: unknown[]) => getSocialPosts(...a),
  deleteSocialPost: (...a: unknown[]) => deleteSocialPost(...a),
  generateDraftPostsFromPartyPhotos: (...a: unknown[]) => generateDraft(...a),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaActual: (...a: unknown[]) => getFiestaActual(...a),
  getHistorialFiestas: (...a: unknown[]) => getHistorialFiestas(...a),
}));
jest.mock('@/components/social-media/NewPostDialog', () => ({
  NewPostDialog: ({ onPostCreated }: { onPostCreated?: () => void }) => (
    <button data-testid="refrescar" onClick={() => onPostCreated?.()}>refrescar</button>
  ),
}));
jest.mock('@/components/social-media/SocialPostCard', () => ({
  SocialPostCard: ({ post }: { post: { id: string; content?: string } }) => <div data-testid="post">{post.id}</div>,
}));
jest.mock('@/components/social-media/SocialHistoryImportDialog', () => ({ SocialHistoryImportDialog: () => null }));
jest.mock('@/components/social-media/SocialHistoryPanel', () => ({ SocialHistoryPanel: () => null }));
jest.mock('@/components/social-media/SocialMediaCalendar', () => ({ SocialMediaCalendar: () => null }));

import SocialMediaPage from '@/app/(app)/empresa/redes-sociales/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<SocialMediaPage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

const reintentar = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Reintentar') as HTMLButtonElement | undefined;

beforeEach(() => {
  [toast, getSocialPosts, getFiestaActual, getHistorialFiestas, deleteSocialPost, generateDraft].forEach((m) => m.mockReset());
  getFiestaActual.mockResolvedValue(null);
  getHistorialFiestas.mockResolvedValue([]);
});

test('si falla la lectura queda un error persistente y NO "cero publicaciones" como si fuera real', async () => {
  getSocialPosts.mockRejectedValue(new Error('Failed to fetch'));
  const { host, cerrar } = await montar();
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('No pudimos leer las publicaciones');
  expect(host.textContent).toContain('No se pudieron leer las publicaciones');
  expect(host.textContent).not.toContain('Todos (0)');
  expect(host.textContent).not.toContain('No hay publicaciones que coincidan');
  cerrar();
});

test('Reintentar vuelve a leer la lista y, si anda, desaparece el error y se ven las publicaciones', async () => {
  getSocialPosts.mockRejectedValueOnce(new Error('Failed to fetch'));
  const { host, cerrar } = await montar();
  getSocialPosts.mockResolvedValue([{ id: 'p1', platform: 'Instagram', status: 'Publicado' }]);
  await act(async () => { reintentar(host)!.click(); });
  expect(getSocialPosts).toHaveBeenCalledTimes(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelectorAll('[data-testid="post"]').length).toBe(1);
  expect(host.textContent).toContain('Todos (1)');
  cerrar();
});

test('un vacío verdadero no muestra error ni botón de reintentar', async () => {
  getSocialPosts.mockResolvedValue([]);
  const { host, cerrar } = await montar();
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(reintentar(host)).toBeUndefined();
  expect(host.textContent).toContain('Todos (0)');
  expect(host.textContent).toContain('No hay publicaciones que coincidan');
  cerrar();
});

test('un refresco fallido con datos previos los conserva y avisa que pueden estar viejos', async () => {
  getSocialPosts.mockResolvedValueOnce([{ id: 'p1', platform: 'Instagram', status: 'Publicado' }]);
  const { host, cerrar } = await montar();
  expect(host.querySelectorAll('[data-testid="post"]').length).toBe(1);
  getSocialPosts.mockRejectedValue(new Error('Failed to fetch'));
  await act(async () => { (host.querySelector('[data-testid="refrescar"]') as HTMLButtonElement).click(); });
  expect(host.querySelector('[role="alert"]')?.textContent).toContain('puede estar desactualizado');
  expect(host.querySelectorAll('[data-testid="post"]').length).toBe(1);
  cerrar();
});
