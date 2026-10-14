/**
 * El asistente flotante (ContextualAssistantIndicator) no tapa el botón "Generar Presupuesto Formal"
 * del configurador de reunión. Se prueba el RESULTADO: con un botón Guardar justo donde estaría la
 * tarjeta, la posición que termina aplicada en pantalla no se superpone con él; sin obstáculos, la
 * tarjeta queda donde el equipo la dejó. Además se comprueba que ese botón llama a handleSaveBudget
 * (guardar una sola vez) en el código de la pantalla.
 */
import React, { act } from 'react';
import fs from 'fs';
import path from 'path';
import { createRoot } from 'react-dom/client';

jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
jest.mock('next/navigation', () => ({ usePathname: () => '/empresa/configurador-reunion' }));
jest.mock('@/hooks/use-es-vista-del-cliente', () => ({ useEsVistaDelCliente: () => false }));

import { ContextualAssistantIndicator } from '@/components/assistant/contextual-assistant-indicator';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
});
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

const TARJETA = { width: 250, height: 80 };
let rectOriginal: typeof Element.prototype.getBoundingClientRect;
let clientRectsOriginal: typeof Element.prototype.getClientRects;
let rafOriginal: typeof requestAnimationFrame;

beforeEach(() => {
  rectOriginal = Element.prototype.getBoundingClientRect;
  clientRectsOriginal = Element.prototype.getClientRects;
  rafOriginal = globalThis.requestAnimationFrame;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => { cb(0); return 1; }) as typeof requestAnimationFrame;
  Element.prototype.getClientRects = (() => [{}]) as unknown as typeof Element.prototype.getClientRects;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const data = this.getAttribute('data-rect');
    if (data) {
      const [top, right, bottom, left] = data.split(',').map(Number);
      return { top, right, bottom, left, width: right - left, height: bottom - top, x: left, y: top, toJSON() {} } as DOMRect;
    }
    if (this.className?.toString().includes('fixed')) {
      const s = (this as HTMLElement).style;
      const bottom = window.innerHeight - parseFloat(s.bottom || '0');
      const right = window.innerWidth - parseFloat(s.right || '0');
      return { top: bottom - TARJETA.height, right, bottom, left: right - TARJETA.width, ...TARJETA, x: 0, y: 0, toJSON() {} } as DOMRect;
    }
    return { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, x: 0, y: 0, toJSON() {} } as DOMRect;
  };
  window.localStorage.clear();
});
afterEach(() => {
  Element.prototype.getBoundingClientRect = rectOriginal;
  Element.prototype.getClientRects = clientRectsOriginal;
  globalThis.requestAnimationFrame = rafOriginal;
});

async function montar(botonGuardar?: string) {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => {
    root.render(
      <>
        {botonGuardar && <button data-rect={botonGuardar}>Generar Presupuesto Formal</button>}
        <ContextualAssistantIndicator />
      </>,
    );
  });
  const tarjeta = host.querySelector('div.fixed') as HTMLElement;
  return { tarjeta, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

const rectDe = (t: HTMLElement) => {
  const bottom = window.innerHeight - parseFloat(t.style.bottom);
  const right = window.innerWidth - parseFloat(t.style.right);
  return { top: bottom - TARJETA.height, bottom, right, left: right - TARJETA.width };
};
const seSuperponen = (a: { top: number; right: number; bottom: number; left: number }, b: typeof a) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test('con el botón Guardar justo debajo de la tarjeta, la tarjeta se corre y no lo tapa', async () => {
  // La tarjeta preferida ocupa (viewport 1024x768): left 758..1008, top 528..608.
  const guardar = { top: 540, right: 990, bottom: 580, left: 800 };
  const { tarjeta, cerrar } = await montar(`${guardar.top},${guardar.right},${guardar.bottom},${guardar.left}`);
  expect(seSuperponen(rectDe(tarjeta), guardar)).toBe(false);
  cerrar();
});

test('sin ningún control en el camino, la tarjeta queda donde la dejó el equipo', async () => {
  const { tarjeta, cerrar } = await montar();
  expect(tarjeta.style.bottom).toBe('160px');
  expect(tarjeta.style.right).toBe('16px');
  cerrar();
});

test('el botón Generar Presupuesto Formal de la pantalla llama a handleSaveBudget y guarda una sola vez', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/empresa/configurador-reunion/page.tsx'), 'utf8');
  expect(fuente).toMatch(/onClick=\{handleSaveBudget\}[\s\S]{0,500}Generar Presupuesto Formal/);
  expect(fuente).toMatch(/if \(guardadoEnCurso\.current\) return;/);
});
