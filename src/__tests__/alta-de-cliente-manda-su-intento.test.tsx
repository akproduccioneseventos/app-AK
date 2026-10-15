/**
 * /customers/new: al crear, el botón manda a `saveCustomer` una identidad de intento. Si la primera
 * respuesta falla y la persona vuelve a tocar "Guardar", el reintento lleva EL MISMO id (el servidor
 * reconoce que es el mismo cliente y no crea otro). Sólo un guardado exitoso cierra el intento.
 * Pantalla: /customers/new
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const push = jest.fn();
const saveCustomer = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/app/actions/customers', () => ({ saveCustomer: (...a: unknown[]) => saveCustomer(...a) }));

import NuevoClientePage from '@/app/(app)/customers/new/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

function escribir(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<NuevoClientePage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

beforeEach(() => { toast.mockReset(); push.mockReset(); saveCustomer.mockReset(); window.sessionStorage.clear(); });

test('el reintento tras una falla lleva el mismo idIntento, y al guardar se cierra el intento', async () => {
  saveCustomer
    .mockResolvedValueOnce({ success: false, error: 'sin señal' })
    .mockResolvedValueOnce({ success: true, id: 'c1' });
  const { host, cerrar } = await montar();
  await act(async () => { escribir(host.querySelector('#customer-name') as HTMLInputElement, 'Ana García'); });
  const boton = () => host.querySelector('button[type="submit"]') as HTMLButtonElement;

  await act(async () => { boton().click(); });
  expect(saveCustomer).toHaveBeenCalledTimes(1);
  expect(saveCustomer).toHaveBeenLastCalledWith(expect.any(FormData), { idIntento: expect.any(String) });
  const primero = saveCustomer.mock.calls[0][1].idIntento;
  expect(primero.length).toBeGreaterThan(0);
  expect(push).not.toHaveBeenCalled();
  expect(window.sessionStorage.getItem('ak-intento-v1:cliente-nuevo')).toContain(primero);

  await act(async () => { boton().click(); });
  expect(saveCustomer).toHaveBeenCalledTimes(2);
  expect(saveCustomer.mock.calls[1][1]).toEqual({ idIntento: primero });
  expect(push).toHaveBeenCalledWith('/customers');
  // Con éxito se cierra el intento: el próximo cliente arranca con otro id.
  expect(window.sessionStorage.getItem('ak-intento-v1:cliente-nuevo')).toBeNull();
  cerrar();
});
