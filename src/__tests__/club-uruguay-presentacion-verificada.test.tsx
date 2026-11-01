const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import ClubUruguayPage from '@/app/club-uruguay/page';
import type { Salon } from '@/types/salon';
import {
  CURATED_CLUB_URUGUAY_PHOTOS,
  dedupeSalonPhotos,
  getClubUruguayHeroPhoto,
  getDynamicSalonPhotos,
  HERO_CLUB_URUGUAY_PHOTO,
  type SalonPhoto,
} from '@/lib/salon-helper';
import { trackClubEvent } from '@/lib/analytics/club-uruguay-analytics';
import * as analyticsGa from '@/lib/analytics-ga';
import { MARKETING_CONSENT_STORAGE_KEY } from '@/lib/analytics/marketing-consent';

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

describe('Orden 248: Club Uruguay - Presentación verificada y auténtica', () => {
  beforeEach(() => {
    mockSalones = [];
    jest.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  describe('Procedencia de fotos y hero estable', () => {
    it('agregar o reordenar fotos maestras no desplaza el hero aprobado', () => {
      const fotosMaestrasDesordenadas: SalonPhoto[] = [
        {
          src: '/media/salones/foto-nueva-subida-01.jpg',
          alt: 'Foto nueva subida al maestro',
          title: 'Foto nueva',
          aprobada: true,
        },
        {
          src: '/media/salones/foto-nueva-subida-02.jpg',
          alt: 'Foto nueva subida al maestro 2',
          title: 'Foto nueva 2',
          aprobada: true,
        },
      ];

      const hero = getClubUruguayHeroPhoto(fotosMaestrasDesordenadas);
      expect(hero.src).toBe(HERO_CLUB_URUGUAY_PHOTO.src);
      expect(hero.src).toBe('/media/catalogo-servicios/salon-discoteca-ak-01.jpeg');
    });

    it('activo del catálogo general con título Club pero no aprobado no se atribuye', () => {
      // getDynamicSalonPhotos solo devuelve fotos aprobadas explícitamente
      const fotos = getDynamicSalonPhotos();
      const todasAprobadas = fotos.every((f) => f.aprobada === true);
      expect(todasAprobadas).toBe(true);

      const srcs = fotos.map((f) => f.src);
      expect(srcs).toContain('/media/catalogo-servicios/salon-discoteca-ak-01.jpeg');
      expect(srcs).toContain('/media/catalogo-servicios/discoteca-salon-ak-02.jpeg');
      expect(srcs).toContain('/media/catalogo-servicios/xv-pista-iluminada-01.jpeg');
      expect(srcs).not.toContain('/media/catalogo-servicios/glitter-bar-01.jpeg');
    });

    it('foto aprobada nueva sí entra al conjunto', () => {
      const nuevaFotoAprobada: SalonPhoto = {
        src: '/media/catalogo-servicios/nueva-foto-verificada.jpeg',
        alt: 'Nueva foto verificada de Club Uruguay',
        title: 'Montaje verificado',
        aprobada: true,
      };

      const fotos = getDynamicSalonPhotos([nuevaFotoAprobada]);
      expect(fotos.some((f) => f.src === nuevaFotoAprobada.src)).toBe(true);
    });

    it('dedupe correcto elimina URLs repetidas', () => {
      const fotosConDuplicados: SalonPhoto[] = [
        { src: '/media/foto-a.jpg', alt: 'A', title: 'A' },
        { src: '/media/foto-a.jpg', alt: 'A duplicada', title: 'A rep' },
        { src: '/media/foto-b.jpg', alt: 'B', title: 'B' },
      ];

      const unicas = dedupeSalonPhotos(fotosConDuplicados);
      expect(unicas).toHaveLength(2);
      expect(unicas.map((f) => f.src)).toEqual(['/media/foto-a.jpg', '/media/foto-b.jpg']);
    });

    it('falla del maestro o sin datos no vuelve a fotos genéricas ni genera 404', async () => {
      mockSalones = []; // Simula maestro vacío o timeout

      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      // Sigue mostrando las fotos aprobadas reales
      expect(html).toContain('Club Uruguay Salto');
      expect(html).toContain('salon-discoteca-ak-01.jpeg');
      expect(html).toContain('Uruguay 754');
    });
  });

  describe('Estructura narrativa comercial (7 bandas)', () => {
    beforeEach(() => {
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
    });

    it('muestra H1 literal Club Uruguay Salto y dirección Uruguay 754', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('Club Uruguay Salto');
      expect(html).toContain('Uruguay 754');
    });

    it('presenta los dos espacios comparables (Principal / Íntimo) con capacidades informadas 50/250 sin sumarlas', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('Salón Principal');
      expect(html).toContain('Espacio Íntimo');
      expect(html).toContain('250');
      expect(html).toContain('50');
      expect(html).toContain('Capacidad informada');
      // No debe sumar 50+250 como aforo simultáneo de 300
      expect(html).toContain('no constituyen una habilitación legal certificada ni se suman como aforo simultáneo de 300 invitados');
    });

    it('galería muestra captions descriptivos y registros reales de AK', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('Galería real de montajes en Club Uruguay');
      expect(html).toContain('Pista y discoteca');
      expect(html).toContain('Una fiesta en funcionamiento');
    });

    it('historia breve destaca el 150 aniversario en 2025 y mural sin año disputado', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('150 aniversario en 2025');
      expect(html).toContain('mural patrimonial');
    });

    it('distingue contratables con AK de instalaciones incluidas y mantiene visible la tecnología', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('Instalaciones incluidas del salón');
      expect(html).toContain('Servicios contratables con AK');
      // Tecnología visible sin esconder
      expect(html).toContain('Fotocabina QR');
      expect(html).toContain('Plataforma 360°');
      expect(html).toContain('Espejo Mágico');
    });

    it('mantiene la bonificación comercial del 50% en el alquiler del salón como decisión del dueño', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('50% de bonificación en el alquiler del salón');
      expect(html).toContain('/simulador-de-presupuesto?salon=club');
    });

    it('conserva compatibilidad con campos de estacionamiento y accesibilidad cargados en el maestro', async () => {
      const element = await ClubUruguayPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain('Estacionamiento');
      expect(html).toContain('Estacionamiento vigilado propio a 50 metros');
      expect(html).toContain('Accesibilidad');
      expect(html).toContain('Acceso por rampa y ascensor para personas con movilidad reducida');
    });
  });

  describe('Analítica con consentimiento y sin PII', () => {
    it('sin consentimiento de marketing no se envían eventos', () => {
      const trackSpy = jest.spyOn(analyticsGa, 'trackGaEvent');
      window.localStorage.removeItem(MARKETING_CONSENT_STORAGE_KEY);

      const dispatched = trackClubEvent('clickWhatsApp', { ubicacion: 'hero' });
      expect(dispatched).toBe(false);
      expect(trackSpy).not.toHaveBeenCalled();
    });

    it('con consentimiento aceptado registra evento con parámetros no personales (sin PII)', () => {
      const trackSpy = jest.spyOn(analyticsGa, 'trackGaEvent').mockImplementation(() => {});
      window.localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, 'accepted');

      const dispatched = trackClubEvent('clickWhatsApp', {
        ubicacion: 'hero',
        cta: 'coordinar_visita',
      });

      expect(dispatched).toBe(true);
      expect(trackSpy).toHaveBeenCalledWith(
        'clickWhatsApp',
        expect.objectContaining({
          category: 'ClubUruguay',
          salon: 'club-uruguay',
          ubicacion: 'hero',
          cta: 'coordinar_visita',
        })
      );

      // Verificar que NO contiene PII
      const callArgs = trackSpy.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('nombre');
      expect(callArgs).not.toHaveProperty('telefono');
      expect(callArgs).not.toHaveProperty('email');
      expect(callArgs).not.toHaveProperty('mensaje');
      expect(callArgs).not.toHaveProperty('fecha');

      trackSpy.mockRestore();
    });

    it('un clic en WhatsApp o Simulador no se etiqueta como reserva o cita confirmada', () => {
      const trackSpy = jest.spyOn(analyticsGa, 'trackGaEvent').mockImplementation(() => {});
      window.localStorage.setItem(MARKETING_CONSENT_STORAGE_KEY, 'accepted');

      trackClubEvent('clickWhatsApp', { cta: 'coordinar_visita' });
      const actionCalled = trackSpy.mock.calls[0][0];

      expect(actionCalled).toBe('clickWhatsApp');
      expect(actionCalled).not.toBe('citaConfirmada');
      expect(actionCalled).not.toBe('reservaConfirmada');

      trackSpy.mockRestore();
    });
  });
});
