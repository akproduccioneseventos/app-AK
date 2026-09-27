/**
 * MATAFUEGO — Las pantallas de las estaciones no se apagan solas (27 de septiembre de 2026).
 *
 * Ninguna estación pedía mantener la pantalla prendida: en una tablet o notebook se oscurecía entre
 * invitado e invitado, y una grabación larga podía cortarse. Se prueba el pedido, que se vuelva a
 * pedir al volver a la pestaña (el navegador lo suelta al cambiarla), que se suelte al salir, y que
 * cada pantalla de estación lo use.
 *
 * Se probó rompiéndolo: sacando el pedido al volver a la pestaña, se pone en rojo.
 */
import fs from 'node:fs';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { usePantallaPrendida } from '@/hooks/use-pantalla-prendida';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

/** Monta el pedido en un componente de mentira y devuelve cómo desmontarlo. */
function renderHook(usar: () => void) {
  const Prueba = () => { usar(); return null; };
  const raiz = createRoot(document.createElement('div'));
  act(() => { raiz.render(React.createElement(Prueba)); });
  return { unmount: () => act(() => { raiz.unmount(); }) };
}

describe('Las estaciones no apagan la pantalla', () => {
  let pedidos = 0;
  let soltados = 0;
  beforeEach(() => {
    pedidos = 0;
    soltados = 0;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request: jest.fn(async () => { pedidos++; return { release: async () => { soltados++; } }; }) },
    });
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('pide mantener la pantalla prendida, lo vuelve a pedir al volver a la pestaña y lo suelta al salir', async () => {
    const { unmount } = renderHook(() => usePantallaPrendida());
    await Promise.resolve();
    expect(pedidos).toBe(1);
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();
    expect(pedidos).toBe(2);
    unmount();
    await Promise.resolve();
    expect(soltados).toBeGreaterThanOrEqual(1);
  });

  it('si el navegador no lo soporta, no rompe nada', () => {
    delete (navigator as any).wakeLock;
    expect(() => renderHook(() => usePantallaPrendida())).not.toThrow();
  });

  it('cada pantalla de estación lo usa', () => {
    const pantallas = [
      'fotocabina/[fiestaId]', 'touchpix/[fiestaId]', 'plataforma-360/[fiestaId]', 'bogue/[fiestaId]',
      'espejo-magico/[fiestaId]', 'buzon/[fiestaId]', 'barra/[fiestaId]', 'barra/[fiestaId]/barman',
      'muro-en-vivo/[fiestaId]', 'totem/[fiestaId]/[totemId]', 'impresion/[fiestaId]', 'en-vivo/[fiestaId]',
    ];
    const sinPedido = pantallas.filter((p) => !/usePantallaPrendida\(\)/.test(fs.readFileSync(`src/app/evento/${p}/page.tsx`, 'utf8')));
    expect(sinPedido).toEqual([]);
  });
});
