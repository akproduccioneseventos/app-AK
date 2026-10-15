/**
 * /settings/promos: al crear una promo, el botón manda a `savePromo` una identidad de intento. Si la
 * primera respuesta falla y se vuelve a tocar "Crear promo", el reintento lleva EL MISMO id.
 * Pantalla: /settings/promos
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const savePromo = jest.fn();

jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/app/actions/promos', () => ({
  getPromos: jest.fn().mockResolvedValue([]),
  savePromo: (...a: unknown[]) => savePromo(...a),
  togglePromo: jest.fn(),
  deletePromo: jest.fn(),
}));
jest.mock('@/app/actions/cupones', () => ({ getCupones: jest.fn().mockResolvedValue([]) }));

import PromosAdminPage from '@/app/(app)/settings/promos/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

function escribir(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(el, valor);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

const botonCon = (texto: string) =>
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(texto)) as HTMLButtonElement;

beforeEach(() => { toast.mockReset(); savePromo.mockReset(); window.sessionStorage.clear(); });

test('el reintento tras una falla lleva el mismo idIntento, y al guardar se cierra el intento', async () => {
  savePromo
    .mockResolvedValueOnce({ success: false, error: 'sin señal' })
    .mockResolvedValueOnce({ success: true });
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<PromosAdminPage />); });
  await act(async () => { botonCon('Nueva Promo').click(); });
  const campoTitulo = Array.from(document.querySelectorAll('label')).find((l) => l.textContent?.includes('Título'))!
    .parentElement!.querySelector('input') as HTMLInputElement;
  expect(campoTitulo).toBeTruthy();
  await act(async () => { escribir(campoTitulo, 'Promo de primavera'); });

  await act(async () => { botonCon('Crear promo').click(); });
  expect(savePromo).toHaveBeenCalledTimes(1);
  expect(savePromo).toHaveBeenLastCalledWith(expect.objectContaining({ titulo: 'Promo de primavera' }), { idIntento: expect.any(String) });
  const primero = savePromo.mock.calls[0][1].idIntento;
  expect(primero.length).toBeGreaterThan(0);
  expect(window.sessionStorage.getItem('ak-intento-v1:promo-nueva')).toContain(primero);

  await act(async () => { botonCon('Crear promo').click(); });
  expect(savePromo).toHaveBeenCalledTimes(2);
  expect(savePromo.mock.calls[1][1]).toEqual({ idIntento: primero });
  expect(window.sessionStorage.getItem('ak-intento-v1:promo-nueva')).toBeNull();
  act(() => root.unmount()); host.remove();
});
