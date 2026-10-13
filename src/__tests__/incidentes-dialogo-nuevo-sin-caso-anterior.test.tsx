/**
 * Orden 157: despues de guardar una incidencia, "Nueva Incidencia" abre el formulario SIN el
 * texto del caso ya guardado. Si el guardado falla, el borrador se conserva para reintentar.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('fiestaId=fiesta_77') }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
const mockGet = jest.fn();
const mockCreate = jest.fn();
jest.mock('@/app/actions/incidents', () => ({
  getIncidentes: (...a: unknown[]) => mockGet(...a),
  createIncidente: (...a: unknown[]) => mockCreate(...a),
  addActualizacionIncidente: jest.fn(),
  resolverIncidente: jest.fn(),
}));

let host: HTMLElement;
let root: ReturnType<typeof createRoot>;

async function esperar() { await act(async () => { await Promise.resolve(); }); }
const porPlaceholder = (p: string) => document.body.querySelector(`[placeholder="${p}"]`) as HTMLInputElement | HTMLTextAreaElement | null;
const boton = (t: string) => Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes(t)) as HTMLButtonElement;

async function escribir(el: HTMLInputElement | HTMLTextAreaElement, valor: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  await act(async () => {
    setter.call(el, valor);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function click(b: HTMLButtonElement) {
  await act(async () => { b.click(); });
  await esperar();
}
async function abrirNueva() {
  await click(boton('Nueva Incidencia'));
  expect(porPlaceholder('Título del incidente')).not.toBeNull();
}
async function completar(titulo: string, descripcion: string) {
  await escribir(porPlaceholder('Título del incidente')!, titulo);
  await escribir(porPlaceholder('Describí el incidente...')!, descripcion);
  await escribir(porPlaceholder('Pasos a seguir para resolver...')!, `plan de ${titulo}`);
  await escribir(porPlaceholder('Notas de seguimiento...')!, `seguimiento de ${titulo}`);
  await escribir(porPlaceholder('Nombre del responsable')!, 'Marta');
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  mockGet.mockResolvedValue([]);
  const Page = require('@/app/(app)/incidentes/page').default;
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await esperar();
});
afterEach(() => { act(() => root.unmount()); host.remove(); document.body.innerHTML = ''; jest.restoreAllMocks(); });

test('guardar A y abrir Nueva Incidencia: titulo, descripcion, plan y seguimiento vienen vacios; el evento sigue', async () => {
  mockCreate.mockResolvedValue({ success: true });
  await abrirNueva();
  await completar('Corte de luz', 'Se corto la luz en el salon');
  await click(boton('Registrar Incidente'));
  expect(mockCreate).toHaveBeenCalledTimes(1);

  await abrirNueva();
  expect(porPlaceholder('Título del incidente')!.value).toBe('');
  expect(porPlaceholder('Describí el incidente...')!.value).toBe('');
  expect(porPlaceholder('Pasos a seguir para resolver...')!.value).toBe('');
  expect(porPlaceholder('Notas de seguimiento...')!.value).toBe('');
  expect(porPlaceholder('fiesta_1234...')!.value).toBe('fiesta_77');
});

test('el caso B se guarda con SUS datos, no con los de A', async () => {
  mockCreate.mockResolvedValue({ success: true });
  await abrirNueva();
  await completar('Caso A', 'descripcion A');
  await click(boton('Registrar Incidente'));
  await abrirNueva();
  await completar('Caso B', 'descripcion B');
  await click(boton('Registrar Incidente'));
  expect(mockCreate).toHaveBeenCalledTimes(2);
  expect(mockCreate.mock.calls[1][0]).toMatchObject({ titulo: 'Caso B', descripcion: 'descripcion B', planAccion: 'plan de Caso B', fiestaId: 'fiesta_77' });
});

test('si el guardado falla, el borrador se conserva y el reintento guarda una sola vez', async () => {
  mockCreate.mockResolvedValueOnce({ success: false, error: 'sin red' });
  await abrirNueva();
  await completar('Caso A', 'descripcion A');
  await click(boton('Registrar Incidente'));
  expect(porPlaceholder('Título del incidente')!.value).toBe('Caso A');
  expect(porPlaceholder('Describí el incidente...')!.value).toBe('descripcion A');

  mockCreate.mockResolvedValueOnce({ success: true });
  await click(boton('Registrar Incidente'));
  expect(mockCreate).toHaveBeenCalledTimes(2);
  await abrirNueva();
  expect(porPlaceholder('Título del incidente')!.value).toBe('');
});
