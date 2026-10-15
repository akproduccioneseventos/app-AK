/**
 * Alta de insumo: el botón de crear manda a `saveInsumo` una identidad de intento. Si la primera respuesta
 * falla y se vuelve a tocar el botón, el reintento lleva EL MISMO id; con éxito se cierra el intento.
 * Pantalla: /empresa/insumos/nuevo
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const push = jest.fn();
const saveInsumo = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/app/actions/insumos', () => ({ saveInsumo: (...a: unknown[]) => saveInsumo(...a) }));


import NuevoInsumoPage from '@/app/(app)/empresa/insumos/nuevo/page';

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
  await act(async () => { root.render(<NuevoInsumoPage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

beforeEach(() => { toast.mockReset(); push.mockReset(); saveInsumo.mockReset(); window.sessionStorage.clear(); });

test('el reintento tras una falla lleva el mismo idIntento, y al guardar se cierra el intento', async () => {
  saveInsumo
    .mockResolvedValueOnce({ success: false, error: 'sin señal' })
    .mockResolvedValueOnce({ success: true, id: 'x1' });
  const { host, cerrar } = await montar();
  await act(async () => { escribir(host.querySelector('#item-nombre') as HTMLInputElement, 'Ítem de prueba'); });
  const boton = () => host.querySelector('button[type="submit"]') as HTMLButtonElement;

  await act(async () => { boton().click(); });
  expect(saveInsumo).toHaveBeenCalledTimes(1);
  expect(saveInsumo).toHaveBeenLastCalledWith(expect.objectContaining({ nombre: 'Ítem de prueba' }), { idIntento: expect.any(String) });
  const primero = saveInsumo.mock.calls[0][1].idIntento;
  expect(primero.length).toBeGreaterThan(0);
  expect(push).not.toHaveBeenCalled();
  expect(window.sessionStorage.getItem('ak-intento-v1:insumo-nuevo')).toContain(primero);

  await act(async () => { boton().click(); });
  expect(saveInsumo).toHaveBeenCalledTimes(2);
  expect(saveInsumo.mock.calls[1][1]).toEqual({ idIntento: primero });
  expect(push).toHaveBeenCalledWith('/empresa/insumos');
  expect(window.sessionStorage.getItem('ak-intento-v1:insumo-nuevo')).toBeNull();
  cerrar();
});
