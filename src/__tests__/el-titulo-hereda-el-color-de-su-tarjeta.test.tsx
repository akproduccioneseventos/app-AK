/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Card, CardTitle } from '@/components/ui/card';

let root: Root, container: HTMLDivElement;

beforeEach(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('El título hereda el color de su tarjeta (Orden 285 - Bloque 13)', () => {
  it('<Card className="bg-slate-900 text-white"><CardTitle>X</CardTitle></Card> no le pone al título ninguna clase text-foreground', async () => {
    await act(async () => {
      root.render(
        <Card className="bg-slate-900 text-white">
          <CardTitle>X</CardTitle>
        </Card>
      );
    });

    const cardTitle = container.querySelector('[data-slot="card-title"]');
    expect(cardTitle).not.toBeNull();
    expect(cardTitle?.className).not.toContain('text-foreground');
    expect(cardTitle?.textContent).toBe('X');
  });
});
