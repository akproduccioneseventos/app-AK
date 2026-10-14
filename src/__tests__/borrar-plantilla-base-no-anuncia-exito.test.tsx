/**
 * Orden 156, defecto 2: borrar una plantilla BASE no cambia nada. La pantalla no tiene que
 * anunciar "Plantilla Eliminada": tiene que mostrar el error de la acción y dejar la plantilla.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const getInvitationTemplates = jest.fn();
const deleteInvitationTemplate = jest.fn();

jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/lib/intento-de-guardado', () => ({ obtenerIntento: jest.fn(), terminarIntento: jest.fn() }));
jest.mock('@/app/actions/invitacion-digital-templates', () => ({
  getInvitationTemplates: (...a: unknown[]) => getInvitationTemplates(...a),
  deleteInvitationTemplate: (...a: unknown[]) => deleteInvitationTemplate(...a),
  saveInvitationTemplate: jest.fn(),
  duplicateInvitationTemplate: jest.fn(),
}));

import InvitationTemplatesPage from '@/app/(app)/settings/templates/invitaciones/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });
beforeEach(() => { toast.mockReset(); getInvitationTemplates.mockReset(); deleteInvitationTemplate.mockReset(); });

test('borrar una plantilla base muestra el error y la deja en la lista', async () => {
  getInvitationTemplates.mockResolvedValue([{ id: 'base-grazia', name: 'Grazia Base', category: 'General', plantilla: 'Grazia' }]);
  deleteInvitationTemplate.mockResolvedValue({ success: false, error: 'Esta es una plantilla base de la app y no se puede eliminar.' });
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<InvitationTemplatesPage />); });
  expect(host.textContent).toContain('Grazia Base');

  const trash = host.querySelector('button[title="Eliminar"]') as HTMLButtonElement;
  await act(async () => { trash.click(); });
  const confirmar = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent === 'Eliminar' && !b.title)!;
  await act(async () => { confirmar.click(); });

  expect(deleteInvitationTemplate).toHaveBeenCalledWith('base-grazia');
  const titulos = toast.mock.calls.map((c) => c[0].title);
  expect(titulos).not.toContain('Plantilla Eliminada');
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive', description: expect.stringContaining('no se puede eliminar') }));
  expect(host.textContent).toContain('Grazia Base');
  act(() => root.unmount()); host.remove();
});
