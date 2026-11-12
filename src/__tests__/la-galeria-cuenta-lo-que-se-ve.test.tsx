import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { GallerySection } from '@/components/landing/GallerySection';

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  Reflect.deleteProperty(globalThis, 'IntersectionObserver');
});

describe('La galería cuenta lo que se ve (Orden 277)', () => {
  it('con 21 fotos el botón dice "12 de 21", y después de tocarlo ya no hay botón', async () => {
    const images = Array.from({ length: 21 }, (_, i) => ({
      id: `img-${i}`,
      src: `/media/test-${i}.jpg`,
      alt: `Foto de prueba ${i}`,
      category: 'General',
    }));

    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);

    await act(async () => {
      root.render(<GallerySection images={images} />);
    });

    const boton = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ver más fotos y videos')
    ) as HTMLButtonElement | undefined;

    expect(boton).toBeDefined();
    expect(boton?.textContent).toContain('12 de 21');

    await act(async () => {
      boton?.click();
    });

    const botonDespues = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ver más fotos y videos')
    );

    expect(botonDespues).toBeUndefined();

    act(() => {
      root.unmount();
    });
    host.remove();
  });
});
