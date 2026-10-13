/**
 * Orden 154 (3): /empresa/redes-sociales no puede mostrar "No hay publicaciones" ni contadores en
 * cero cuando la lectura falló; muestra un aviso persistente con Reintentar (que sólo relee).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockPosts = jest.fn();
jest.mock('@/app/actions/social-media', () => ({
  getSocialPosts: (...a: unknown[]) => mockPosts(...a),
  deleteSocialPost: jest.fn(),
  generateDraftPostsFromPartyPhotos: jest.fn(),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaActual: jest.fn(async () => null),
  getHistorialFiestas: jest.fn(async () => []),
}));
const mockToastStable = { toast: jest.fn() };
jest.mock('@/hooks/use-toast', () => ({ useToast: () => mockToastStable }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children }: any) => <a href={href}>{children}</a> }));
const mockHistorialSync = jest.fn();
jest.mock('@/components/social-media/NewPostDialog', () => ({ NewPostDialog: () => null }));
jest.mock('@/components/social-media/SocialPostCard', () => ({ SocialPostCard: ({ post }: any) => <div>{post.title || post.id}</div> }));
jest.mock('@/components/social-media/SocialHistoryImportDialog', () => ({ SocialHistoryImportDialog: () => null }));
jest.mock('@/components/social-media/SocialHistoryPanel', () => ({
  SocialHistoryPanel: () => <button onClick={() => mockHistorialSync()}>Actualizar ahora</button>,
}));
jest.mock('@/components/social-media/SocialMediaCalendar', () => ({ SocialMediaCalendar: () => null }));

async function pintar() {
  const Page = require('@/app/(app)/empresa/redes-sociales/page').default;
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await act(async () => { await Promise.resolve(); });
  return {
    texto: () => host.textContent || '',
    boton: (t: string) => Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === t) as HTMLButtonElement,
    limpiar: () => { act(() => root.unmount()); host.remove(); },
  };
}

beforeEach(() => { mockPosts.mockReset(); mockHistorialSync.mockReset(); });

test('la lectura falla: aviso persistente, sin "No hay publicaciones" ni "Todos (0)"', async () => {
  mockPosts.mockRejectedValue(new Error('Failed to fetch'));
  const r = await pintar();
  expect(r.texto()).toContain('No pudimos leer las publicaciones');
  expect(r.boton('Reintentar')).toBeTruthy();
  expect(r.texto()).not.toContain('No hay publicaciones');
  expect(r.texto()).not.toContain('Todos (0)');
  r.limpiar();
});

test('vacío verdadero: dice que no hay publicaciones y no muestra aviso de error', async () => {
  mockPosts.mockResolvedValue([]);
  const r = await pintar();
  expect(r.texto()).toContain('No hay publicaciones');
  expect(r.texto()).toContain('Todos (0)');
  expect(r.texto()).not.toContain('No pudimos leer');
  expect(r.boton('Reintentar')).toBeUndefined();
  r.limpiar();
});

test('Reintentar vuelve a leer (no toca el historial/proveedores) y, si anda, quita el aviso', async () => {
  mockPosts.mockRejectedValueOnce(new Error('Failed to fetch'));
  const r = await pintar();
  expect(mockPosts).toHaveBeenCalledTimes(1);
  mockPosts.mockResolvedValueOnce([{ id: 'p1', title: 'Fiesta de Ana', platform: 'Instagram', status: 'Publicado' }]);
  await act(async () => { r.boton('Reintentar').click(); });
  await act(async () => { await Promise.resolve(); });
  expect(mockPosts).toHaveBeenCalledTimes(2);
  expect(mockHistorialSync).not.toHaveBeenCalled();
  expect(r.texto()).not.toContain('No pudimos leer');
  expect(r.texto()).toContain('Fiesta de Ana');
  r.limpiar();
});
