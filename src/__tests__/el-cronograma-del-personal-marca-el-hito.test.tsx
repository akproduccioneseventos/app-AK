/**
 * La pantalla /evento/staff/[fiestaId]/cronograma marca un hito del programa con
 * `marcarHitoPrograma` (sólo viaja el hito y su estado, no la fiesta entera del navegador).
 *
 * Se comprueba el resultado: el botón "Marcar Listo" llama a la acción con la fiesta, el hito y
 * `true`; el hito siguiente pasa a ser el actual; y si la acción falla, se vuelve a leer la fiesta
 * y se avisa, en vez de dejar el hito marcado como si se hubiera guardado.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const toast = jest.fn();
const getFiestaById = jest.fn();
const marcarHitoPrograma = jest.fn();

jest.mock('next/navigation', () => ({ useParams: () => ({ fiestaId: 'f1' }) }));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast }) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: (...a: unknown[]) => getFiestaById(...a) }));
jest.mock('@/app/actions/fiesta/itinerario.actions', () => ({
  marcarHitoPrograma: (...a: unknown[]) => marcarHitoPrograma(...a),
}));

import StaffCronogramaPage from '@/app/evento/staff/[fiestaId]/cronograma/page';

beforeAll(() => { Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }); });
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

const fiesta = () => ({
  id: 'f1',
  configuracion: { nombreEvento: 'Quince de Ana' },
  programa: [
    { id: 'h1', titulo: 'Entrada de la quinceañera', hora: '22:00', completado: false },
    { id: 'h2', titulo: 'Vals', hora: '23:00', completado: false },
  ],
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<StaffCronogramaPage />); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

const botonListo = (host: HTMLElement) =>
  Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('Marcar Listo'))!;

beforeEach(() => { toast.mockReset(); getFiestaById.mockReset(); marcarHitoPrograma.mockReset(); });

test('marcar listo guarda sólo ese hito y el siguiente pasa a ser el actual', async () => {
  getFiestaById.mockResolvedValue(fiesta());
  marcarHitoPrograma.mockResolvedValue({
    success: true,
    updatedData: [
      { id: 'h1', titulo: 'Entrada de la quinceañera', hora: '22:00', completado: true },
      { id: 'h2', titulo: 'Vals', hora: '23:00', completado: false },
    ],
  });
  const { host, cerrar } = await montar();
  expect(host.textContent).toContain('Entrada de la quinceañera');

  await act(async () => { botonListo(host).click(); });

  expect(marcarHitoPrograma).toHaveBeenCalledWith('f1', 'h1', true);
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: '¡Hito completado!' }));
  // El botón de "Marcar Listo" ahora es del Vals: el hito marcado salió del lugar de "Ahora".
  const tarjetaActual = botonListo(host).closest('div[class*="rounded"]')?.parentElement?.parentElement;
  expect(tarjetaActual?.textContent).toContain('Vals');
  cerrar();
});

test('si no se pudo guardar, vuelve a leer la fiesta y avisa', async () => {
  getFiestaById.mockResolvedValue(fiesta());
  marcarHitoPrograma.mockResolvedValue({ success: false, error: 'Sin permiso' });
  const { host, cerrar } = await montar();

  await act(async () => { botonListo(host).click(); });

  expect(getFiestaById).toHaveBeenCalledTimes(2);
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'No se pudo guardar', variant: 'destructive' }));
  cerrar();
});
