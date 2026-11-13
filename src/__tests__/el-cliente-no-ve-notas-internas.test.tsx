/** @jest-environment jsdom */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ClubUruguayInteractive } from '@/components/club-uruguay/ClubUruguayInteractive';

jest.mock('@/lib/analytics/club-uruguay-analytics', () => ({
  trackClubEvent: jest.fn(),
}));

describe('Orden 296: el cliente no ve notas internas en Club Uruguay', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(() => {
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renderiza ClubUruguayInteractive con una foto sin descripción y sin notas internas', async () => {
    await act(async () => {
      root.render(
        <ClubUruguayInteractive
          photos={[
            {
              src: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
              alt: 'Club Uruguay, vista 1',
              title: 'El salón',
              description: undefined,
              aprobada: true,
            },
          ]}
          whatsappNumber="59899123456"
        />,
      );
    });

    const texto = container.textContent || '';
    expect(texto).not.toMatch(/módulo maestro/i);
    expect(texto).not.toMatch(/Por confirmar/i);
    expect(texto).toContain('Se coordina:');
  });

  it('no incluye frases de trabajo interno ni aniversario en presente en club-uruguay/page.tsx ni en page.tsx', () => {
    const clubPagePath = path.join(process.cwd(), 'src/app/club-uruguay/page.tsx');
    const homePagePath = path.join(process.cwd(), 'src/app/page.tsx');

    const clubPage = fs.readFileSync(clubPagePath, 'utf8');
    const homePage = fs.readFileSync(homePagePath, 'utf8');

    expect(clubPage).not.toContain('módulo maestro');
    expect(clubPage).not.toContain('Condición comercial del dueño');
    expect(clubPage).not.toContain('cuentas regresivas inventadas');
    expect(clubPage).not.toContain('no habilitación legal');
    expect(clubPage).not.toContain('conmemora su sesquicentenario');
    expect(clubPage).toContain('Beneficio con AK Producciones');
    expect(clubPage).toContain('en 2025 cumplió 150 años');

    expect(homePage).not.toContain('módulo maestro');
  });
});
