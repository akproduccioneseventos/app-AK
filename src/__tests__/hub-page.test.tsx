import React from 'react';
import { render } from '@testing-library/react';
import HubPage, { metadata } from '@/app/hub/page';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('lucide-react', () => new Proxy({}, { get: () => () => <span data-testid="icon" /> }));

describe('Pantalla /hub - Centro de Control 4 Puertas', () => {
  it('define el titulo y descripcion oficial en los metadatos', () => {
    expect(metadata.title).toContain('Hub Maestro 4 Puertas');
    expect(metadata.description).toContain('Centro de control unificado');
  });

  it('renderiza las 4 puertas maestras con sus enlaces respectivos', () => {
    const { container } = render(<HubPage />);
    const texto = container.textContent || '';

    expect(texto).toContain('Centro de Control 4 Puertas');
    expect(texto).toContain('Ventas y Captación');
    expect(texto).toContain('Portal de la Familia');
    expect(texto).toContain('Noche del Evento');
    expect(texto).toContain('Cabina de Mando');

    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });
});
