const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import PrivacidadPage from '@/app/privacidad/page';
import { PublicFooter } from '@/components/public-footer';
import { getCompanyInfoPublica } from '@/app/actions/settings';

const { renderToStaticMarkup } = require('react-dom/server');

jest.mock('@/app/actions/settings', () => ({
  getCompanyInfoPublica: jest.fn(),
}));

describe('Orden 101 - Bloque 7: Pie de página y Privacidad según la Ley 18.331', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('la página de privacidad incluye 18.331, URCDP, 5 días hábiles, Meta y el teléfono dinámico', async () => {
    const telefonoPrueba = '099 888 777';
    (getCompanyInfoPublica as jest.Mock).mockResolvedValueOnce({
      telefono: telefonoPrueba,
      email: 'contacto@akproducciones.uy',
    });

    const jsx = await PrivacidadPage();
    const html = renderToStaticMarkup(jsx);

    expect(html).toContain('18.331');
    expect(html).toContain('URCDP');
    expect(html).toContain('5 días hábiles');
    expect(html).toContain('Meta');
    expect(html).toContain(telefonoPrueba);
    expect(html).toContain('22037268001');

    // No debe contener afirmaciones no autorizadas
    expect(html.toLowerCase()).not.toContain('garantiza');
    expect(html.toLowerCase()).not.toContain('inscripta');
  });

  it('el pie de página muestra Ley 18.331 con enlace a /privacidad', () => {
    const html = renderToStaticMarkup(React.createElement(PublicFooter));

    expect(html).toContain('Ley 18.331');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('Protección de Datos Personales');
  });
});
