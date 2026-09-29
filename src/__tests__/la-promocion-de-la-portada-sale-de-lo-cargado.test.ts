/**
 * Orden 98 — Bloque 1: El regalo de la portada sale de la promoción que carga el dueño.
 * Comprueba:
 * - con una promo activa y vigente, getPromoActiva la devuelve;
 * - con fechaFin de ayer (en hora de Uruguay), devuelve null;
 * - con fechaInicio de mañana, null;
 * - renderizando CTASection con esa promo aparece su regalo;
 * - sin promo no aparece 'Regalo de Reserva' ni 'durante esta semana';
 * - falla si se vuelve a escribir el texto fijo.
 */

const { TextEncoder, TextDecoder } = require('util');
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import React from 'react';
import fs from 'fs';
import path from 'path';
import { getPromoActiva } from '@/app/actions/promos';
import { CTASection } from '@/components/landing/CTASection';
import type { PromoActiva } from '@/types/promo';

const { renderToStaticMarkup } = require('react-dom/server');

let mockPromos: PromoActiva[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_archivo: string, porDefecto: unknown) => {
    return mockPromos ?? porDefecto;
  }),
  writeData: jest.fn(async () => undefined),
}));

const stripMotionProps = (props: any) => {
  const { whileHover, whileTap, initial, animate, exit, transition, ...rest } = props;
  return rest;
};

// Mock framer-motion para que renderToString no tenga problemas con animaciones en servidor de prueba
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => React.createElement('div', stripMotionProps(props), children),
    h2: ({ children, ...props }: any) => React.createElement('h2', stripMotionProps(props), children),
    p: ({ children, ...props }: any) => React.createElement('p', stripMotionProps(props), children),
    a: ({ children, ...props }: any) => React.createElement('a', stripMotionProps(props), children),
    span: ({ children, ...props }: any) => React.createElement('span', stripMotionProps(props), children),
  },
  useReducedMotion: () => false,
}));

describe('Orden 98 Bloque 1: Promoción configurable en la portada', () => {
  beforeEach(() => {
    mockPromos = [];
    jest.clearAllMocks();
  });

  describe('lógica de vigencia en getPromoActiva con fecha de Uruguay', () => {
    // 2026-10-15 a las 23:30 UTC = 2026-10-15 a las 20:30 en Uruguay (UTC-3)
    const fechaBase = new Date('2026-10-15T23:30:00.000Z');

    it('devuelve la promo si está activa, mostrarEnLanding es true y hoy cae dentro de fechaInicio y fechaFin', async () => {
      mockPromos = [
        {
          id: 'p1',
          titulo: 'Promo Primavera',
          regalo: 'Plataforma 360°',
          fechaInicio: '2026-10-01',
          fechaFin: '2026-10-20',
          activa: true,
          mostrarEnLanding: true,
          creadoEn: '2026-10-01',
          actualizadoEn: '2026-10-01',
        },
      ];

      const res = await getPromoActiva(fechaBase);
      expect(res).not.toBeNull();
      expect(res?.titulo).toBe('Promo Primavera');
      expect(res?.regalo).toBe('Plataforma 360°');
    });

    it('devuelve null si la fechaFin fue ayer en hora uruguaya', async () => {
      mockPromos = [
        {
          id: 'p-vencida',
          titulo: 'Promo Pasada',
          regalo: 'Chopera de Cerveza',
          fechaInicio: '2026-10-01',
          fechaFin: '2026-10-14', // ayer en Uruguay
          activa: true,
          mostrarEnLanding: true,
          creadoEn: '2026-10-01',
          actualizadoEn: '2026-10-01',
        },
      ];

      const res = await getPromoActiva(fechaBase);
      expect(res).toBeNull();
    });

    it('devuelve null si la fechaInicio es mañana en hora uruguaya', async () => {
      mockPromos = [
        {
          id: 'p-futura',
          titulo: 'Promo Noviembre',
          regalo: 'Show de Luces Láser',
          fechaInicio: '2026-10-16', // mañana en Uruguay
          fechaFin: '2026-10-31',
          activa: true,
          mostrarEnLanding: true,
          creadoEn: '2026-10-01',
          actualizadoEn: '2026-10-01',
        },
      ];

      const res = await getPromoActiva(fechaBase);
      expect(res).toBeNull();
    });
  });

  describe('renderizado de CTASection', () => {
    it('con promo activa aparece su regalo y su título', () => {
      const promo: PromoActiva = {
        id: 'promo-prueba',
        titulo: '¡Promo Exclusiva Octubre!',
        regalo: 'Cabina de Fotos Glitz',
        fechaInicio: '2026-10-01',
        fechaFin: '2026-10-25',
        activa: true,
        mostrarEnLanding: true,
        creadoEn: '2026-10-01',
        actualizadoEn: '2026-10-01',
      };

      const html = renderToStaticMarkup(React.createElement(CTASection, { promo }));
      expect(html).toContain('¡Promo Exclusiva Octubre!');
      expect(html).toContain('Cabina de Fotos Glitz');
      expect(html).toContain('25 de octubre');
    });

    it('sin promo NO aparece el recuadro ni texto fijo como "durante esta semana"', () => {
      const htmlSinPromo = renderToStaticMarkup(React.createElement(CTASection, { promo: null }));
      expect(htmlSinPromo).not.toContain('Regalo de Reserva');
      expect(htmlSinPromo).not.toContain('durante esta semana');
    });

    it('el archivo CTASection.tsx no tiene texto fijo escrito a mano ("durante esta semana")', () => {
      const codigo = fs.readFileSync(
        path.join(process.cwd(), 'src/components/landing/CTASection.tsx'),
        'utf-8'
      );
      expect(codigo).not.toContain('durante esta semana');
      expect(codigo).toContain('promo');
    });
  });
});
