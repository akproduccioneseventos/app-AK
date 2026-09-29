const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import ClubUruguayPage from '@/app/club-uruguay/page';
import type { Salon } from '@/types/salon';

const { renderToStaticMarkup } = require('react-dom/server');

let mockSalones: Salon[] = [];

jest.mock('@/app/actions/salones', () => ({
  getSalonesPublicos: jest.fn(async () => mockSalones),
}));

jest.mock('@/components/landing/LandingNav', () => ({
  LandingNav: () => React.createElement('div', { 'data-testid': 'landing-nav' }),
}));

jest.mock('@/components/public-footer', () => ({
  PublicFooter: () => React.createElement('div', { 'data-testid': 'public-footer' }),
}));

describe('Orden 96 Bloque 10: Estacionamiento y accesibilidad en la página del salón', () => {
  beforeEach(() => {
    mockSalones = [];
    jest.clearAllMocks();
  });

  it('con un salón con estacionamiento cargado, la página muestra ese texto y el título Estacionamiento', async () => {
    mockSalones = [
      {
        id: 'salon_club_uruguay',
        nombre: 'Club Uruguay',
        direccion: 'Uruguay 754, Salto',
        googleMapsUrl: 'https://maps.google.com/?q=Club+Uruguay+Salto',
        capacidad: 250,
        esClubUruguay: true,
        estacionamiento: 'Estacionamiento vigilado propio a 50 metros',
        accesibilidad: 'Acceso por rampa y ascensor para personas con movilidad reducida',
      },
    ];

    const element = await ClubUruguayPage();
    const html = renderToStaticMarkup(element);

    expect(html).toContain('Estacionamiento');
    expect(html).toContain('Estacionamiento vigilado propio a 50 metros');
    expect(html).toContain('Accesibilidad');
    expect(html).toContain('Acceso por rampa y ascensor para personas con movilidad reducida');
  });

  it('sin el dato cargado, no aparece la palabra Estacionamiento ni Accesibilidad', async () => {
    mockSalones = [
      {
        id: 'salon_club_uruguay',
        nombre: 'Club Uruguay',
        direccion: 'Uruguay 754, Salto',
        googleMapsUrl: 'https://maps.google.com/?q=Club+Uruguay+Salto',
        capacidad: 250,
        esClubUruguay: true,
      },
    ];

    const element = await ClubUruguayPage();
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain('Estacionamiento');
    expect(html).not.toContain('Accesibilidad');
  });
});
