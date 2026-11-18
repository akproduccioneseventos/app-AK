/**
 * Auditoría del 18/11/2026, N26: con un menú asignado y SIN presupuesto, la lista de compras salía vacía. El arreglo
 * del 17/11 sumaba el menú, pero adentro del bloque que sólo corre si hay presupuesto, y su prueba buscaba el nombre
 * del campo en el archivo: daba verde con la lista vacía. Ésta abre la pantalla y mira que el ingrediente aparezca.
 */
/** @jest-environment jsdom */
import React, { act } from 'react';

jest.setTimeout(30000);
import { createRoot } from 'react-dom/client';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('fiestaId=f1'),
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  usePathname: () => '/fiestas/nueva/catering/lista-compras',
}));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/components/fiestas/observaciones-posfiesta', () => ({ ObservacionesPosfiesta: () => null }));
jest.mock('@/app/actions/fiesta/catering.actions', () => ({ updateShoppingListStatus: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: jest.fn(async () => null) }));
jest.mock('@/app/actions/insumos', () => ({ getInsumos: jest.fn(async () => []) }));
jest.mock('@/app/actions/menus-catering', () => ({
  getMenus: jest.fn(async () => [{
    id: 'menu_1',
    name: 'Menú de prueba',
    items: [{
      id: 'dish_1',
      name: 'Pollo al horno',
      ingredients: [{ name: 'Pechuga de pollo', quantityPerPerson: 0.3, unit: 'kg', costoUnitario: 200, origenId: 'ins_1' }],
    }],
  }]),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'f1',
    menuAsignadoId: 'menu_1',
    configuracion: { nombreFiesta: 'Fiesta sin presupuesto', invitadosEstimados: 50, fechaEvento: '2026-12-06' },
  })),
}));

import ListaDeComprasPage from '@/app/(app)/fiestas/nueva/catering/lista-compras/page';

it('una fiesta con menú asignado y sin presupuesto tiene sus compras', async () => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<ListaDeComprasPage />);
  });
  for (let i = 0; i < 400 && !/Pechuga de pollo/i.test(host.textContent || ''); i++) {
    await act(async () => { await new Promise(r => setTimeout(r, 50)); });
  }
  expect(host.textContent).toMatch(/Pechuga de pollo/i);
  await act(async () => root.unmount());
});
