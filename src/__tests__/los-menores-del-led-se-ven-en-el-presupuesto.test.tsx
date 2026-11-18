/** @jest-environment jsdom */
/**
 * Auditoría del 18/11/2026, R18-03: la Presentación LED pasa 10 menores como adolescentes y el campo "Niños y
 * Adolescentes" del presupuesto manual mostraba 0. Cambiarlo dejaba los 10 escondidos.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Paso1DatosEvento } from '@/components/presupuestos/paso-1-datos-evento';

jest.setTimeout(30000);

function montar(inicial: any) {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  let estado = inicial;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const setFormData = (f: any) => {
    estado = typeof f === 'function' ? f(estado) : f;
    root.render(<Paso1DatosEvento formData={estado} setFormData={setFormData as any} occupiedDates={[]} />);
  };
  return { host, root, setFormData, leer: () => estado };
}

it('50 adultos y 10 menores desde LED: el campo dice 10, el total 60; cambiarlo a 12 da 62 sin escondidos', async () => {
  const m = montar({ invitadosAdultos: 50, invitadosNinos: 0, invitadosAdolescentes: 10, invitadosCantidad: 60, eventoTipo: 'Cumpleaños infantil', clienteNombre: 'PRUEBA', serviciosSeleccionados: new Map() });
  await act(async () => m.setFormData((p: any) => p));
  const campo = m.host.querySelector('#invitadosNinos') as HTMLInputElement;
  expect(campo.value).toBe('10');
  expect(m.leer().invitadosCantidad).toBe(60);

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(campo, '12');
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(m.leer().invitadosNinos).toBe(12);
  expect(m.leer().invitadosAdolescentes).toBe(0);
  expect(m.leer().invitadosCantidad).toBe(62);
  await act(async () => m.root.unmount());
});
