import fs from 'fs';
import path from 'path';
import { sincronizarDescripcionMenu } from '@/lib/catering/sincronizar-menu';
import type { FullMenu } from '@/types/catering';

describe('Orden 310 - Bloque 4: Conteos dinámicos del catálogo de catering', () => {
  it('sincronizarDescripcionMenu calcula el conteo exacto de items.length para entradas y principales', () => {
    const menuEntradas: FullMenu = {
      id: 'menu_entradas_maestro',
      name: 'Catálogo Maestro de Entradas',
      description: 'Selección completa de las 99 entradas disponibles.',
      items: [
        { id: 'e1', name: 'Entrada 1', type: 'Entrada' },
        { id: 'e2', name: 'Entrada 2', type: 'Entrada' },
        { id: 'e3', name: 'Entrada 3', type: 'Entrada' },
      ],
    };

    const sincEntradas = sincronizarDescripcionMenu(menuEntradas);
    expect(sincEntradas.description).toBe('Selección completa de las 3 entradas disponibles.');

    const menuPrincipales: FullMenu = {
      id: 'menu_principales_maestro',
      name: 'Catálogo Maestro de Platos Principales',
      description: 'Selección desactualizada de las 99 opciones principales.',
      items: [
        { id: 'p1', name: 'Plato 1', type: 'Plato Principal' },
        { id: 'p2', name: 'Plato 2', type: 'Plato Principal' },
      ],
    };

    const sincPrincipales = sincronizarDescripcionMenu(menuPrincipales);
    expect(sincPrincipales.description).toBe('Selección completa de las 2 opciones principales.');
  });
});

describe('Orden 310 - Bloque 5: Textos internos que ve el cliente', () => {
  it('no contiene "Firebase" en la página de post-fiesta del cliente', () => {
    const postFiestaCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/post-fiesta/[fiestaId]/page.tsx'),
      'utf-8',
    );
    expect(postFiestaCode).not.toMatch(/firebase/i);
  });

  it('no contiene la nota interna de venta en la portada de presentación LED', () => {
    const portadaCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/presentacion-led/slides/portada-slide.tsx'),
      'utf-8',
    );
    expect(portadaCode).not.toContain('sin aspecto de catalogo interno');
    expect(portadaCode).not.toContain('Pensado para vender');
  });

  it('la invitación del invitado no contiene "AK está preparando esta sección"', () => {
    const invitacionCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx'),
      'utf-8',
    );
    expect(invitacionCode).not.toContain('AK está preparando esta sección');
    expect(invitacionCode).not.toContain('AK esta preparando esta seccion');
  });

  it('la página de logística del invitado no contiene textos internos de "AK todavia no cargo..."', () => {
    const logisticaCode = fs.readFileSync(
      path.join(process.cwd(), 'src/app/evento/logistica/[fiestaId]/page.tsx'),
      'utf-8',
    );
    expect(logisticaCode).not.toContain('AK todavia no cargo');
    expect(logisticaCode).not.toContain('AK todavía no cargó');
  });
});
