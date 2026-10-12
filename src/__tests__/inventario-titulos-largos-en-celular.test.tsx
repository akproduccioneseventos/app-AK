/**
 * Orden 158: el nombre largo de un activo o un insumo no puede ensanchar la pagina en el celular.
 * En Jest no hay layout, asi que se mira lo que lo impide: el titulo puede achicarse (min-w-0),
 * parte palabras largas (break-words / overflow-wrap:anywhere), la fila envuelve (flex-wrap) y
 * Guardar Cambios vive en su propia fila (el pie), fuera de la fila del titulo.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const NOMBRE_LARGO = 'Equipo-de-sonido-profesional-con-consola-digital-de-32-canales-XL';

const mockParams = { id: 'x1' };
const mockRouter = { push: jest.fn() };
jest.mock('next/navigation', () => ({ useParams: () => mockParams, useRouter: () => mockRouter }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a> }));
const mockToast = jest.fn(); // estable: la pantalla lo usa como dependencia de su carga
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mockToast }) }));
const item = { id: 'x1', nombre: NOMBRE_LARGO, categoria: 'Audio', unidad: 'unidad', cantidadDisponible: 2.5, valorUnitarioEstimado: 10 };
jest.mock('@/app/actions/insumos', () => ({ getInsumoById: async () => item, saveInsumo: jest.fn(), deleteInsumo: jest.fn() }));
jest.mock('@/app/actions/activos-fijos', () => ({
  getActivoFijoById: async () => item, saveActivoFijo: jest.fn(), deleteActivoFijo: jest.fn(), registrarMantenimientoDeEquipo: jest.fn(),
}));
jest.mock('@/app/actions/gastos', () => ({ saveGastoGeneral: jest.fn() }));
jest.mock('@/app/actions/fiesta/assets.actions', () => ({ uploadPublicPageAsset: jest.fn() }));

async function pintar(ruta: string) {
  const Page = require(ruta).default;
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<Page />); });
  await act(async () => { await Promise.resolve(); });
  return { host, limpiar: () => { act(() => root.unmount()); host.remove(); } };
}

const pantallas: Array<[string, string]> = [
  ['activo fijo', '@/app/(app)/empresa/activos-fijos/[id]/editar/page'],
  ['insumo', '@/app/(app)/empresa/insumos/[id]/editar/page'],
];

describe.each(pantallas)('editor de %s con titulo largo', (_nombre, ruta) => {
  test('el titulo se puede achicar y parte palabras largas', async () => {
    const r = await pintar(ruta);
    const h1 = r.host.querySelector('h1') as HTMLElement;
    expect(h1.textContent).toContain(NOMBRE_LARGO);
    const clases = (el: Element | null) => (el?.getAttribute('class') || '');
    expect(clases(h1)).toMatch(/\bmin-w-0\b/);
    expect(clases(h1)).toMatch(/break-words|overflow-wrap:anywhere|\btruncate\b/);
    // El contenedor del titulo tambien tiene que poder achicarse (si no, el h1 no encoge).
    expect(clases(h1.parentElement)).toMatch(/\bmin-w-0\b/);
    r.limpiar();
  });

  test('la fila del titulo envuelve y Volver no se achica ni empuja', async () => {
    const r = await pintar(ruta);
    const h1 = r.host.querySelector('h1') as HTMLElement;
    const fila = h1.parentElement!.parentElement!;
    expect(fila.getAttribute('class')).toMatch(/\bflex-wrap\b/);
    const volver = Array.from(fila.querySelectorAll('a')).find((a) => a.textContent?.includes('Volver'));
    expect(volver).toBeTruthy();
    expect(volver!.getAttribute('class')).toMatch(/\bshrink-0\b/);
    r.limpiar();
  });

  test('Guardar Cambios queda fuera de la fila del titulo', async () => {
    const r = await pintar(ruta);
    const h1 = r.host.querySelector('h1') as HTMLElement;
    const fila = h1.parentElement!.parentElement!;
    const guardar = Array.from(r.host.querySelectorAll('button')).find((b) => b.textContent?.includes('Guardar Cambios'));
    expect(guardar).toBeTruthy();
    expect(fila.contains(guardar!)).toBe(false);
    r.limpiar();
  });
});
