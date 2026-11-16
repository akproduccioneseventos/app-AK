/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { InvitacionPublicaClient } from '@/app/invitacion/[fiestaId]/invitacion-publica-client';
import { defaultInvitacionConfig } from '@/lib/invitacion-config-defaults';
import type { InvitacionDigitalConfig } from '@/types/fiesta';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

jest.mock('@/components/ui/imagen-con-respaldo', () => ({
  ImagenConRespaldo: (props: any) => <img {...props} />,
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({ children, ...props }: any) => {
          const Tag = tag as any;
          return <Tag {...props}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => ({ get: () => 0 }),
}));

jest.mock('@/components/invitacion/SplashScreen', () => ({
  SplashScreen: () => null,
}));

jest.mock('@/components/invitacion/xv-theme-effects', () => ({
  XVThemeEffects: () => null,
}));

jest.mock('@/app/actions/fiesta/invitados.actions', () => ({
  submitPublicRsvp: jest.fn(),
}));

describe('Orden 290 - Bloque 2: La invitación no muestra secciones vacías ni repite placeholders', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.pause = jest.fn();
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

  it('con 3 secciones inactivas y 1 activa, el texto preparando no aparece', async () => {
    // 3 secciones inactivas (cronograma, ubicacion, dressCode) y 1 activa (bienvenida con texto)
    const configConUnaActiva: InvitacionDigitalConfig = {
      ...defaultInvitacionConfig,
      textoBienvenida: '¡Bienvenidos a nuestra fiesta!',
      contadorActivo: false,
      fechaEvento: '',
      nombreSalon: '',
      direccionSalon: '',
      linkMaps: '',
      mostrarDressCode: false,
      dressCode: { tipo: 'formal' },
      galeriaFotos: [],
      regalos: { tipo: 'ninguno' },
      rsvpActivo: false,
      portalSocialActivo: false,
      hitos: [],
      hospedajes: [],
      cronograma: [],
      sectionsConfig: [
        { id: 'cronograma', visible: false, order: 4 },
        { id: 'ubicacion', visible: false, order: 5 },
        { id: 'dressCode', visible: false, order: 6 },
        { id: 'faq', visible: false, order: 14 },
      ],
    };

    await act(async () => {
      root.render(
        <InvitacionPublicaClient
          config={configConUnaActiva}
          fiestaId="fiesta-prueba-1"
          isEditorMode={true}
        />
      );
    });

    const texto = container.textContent || '';
    expect(texto).toContain('¡Bienvenidos a nuestra fiesta!');
    // El texto 'preparando' no debe aparecer cuando hay al menos una sección activa
    expect(texto).not.toMatch(/preparando/i);
    expect(texto).not.toMatch(/AK está preparando esta sección/i);
  });

  it('con todas las secciones del medio inactivas, el texto preparando aparece una sola vez y con tildes', async () => {
    const configTodasInactivas: InvitacionDigitalConfig = {
      ...defaultInvitacionConfig,
      textoBienvenida: '',
      contadorActivo: false,
      fechaEvento: '',
      nombreSalon: '',
      direccionSalon: '',
      linkMaps: '',
      mostrarDressCode: false,
      dressCode: { tipo: 'formal' },
      galeriaFotos: [],
      regalos: { tipo: 'ninguno' },
      rsvpActivo: false,
      portalSocialActivo: false,
      hitos: [],
      hospedajes: [],
      cronograma: [],
      sectionsConfig: [
        { id: 'bienvenida', visible: false, order: 2 },
        { id: 'contador', visible: false, order: 3 },
        { id: 'cronograma', visible: false, order: 4 },
        { id: 'ubicacion', visible: false, order: 5 },
        { id: 'dressCode', visible: false, order: 6 },
        { id: 'galeria', visible: false, order: 7 },
        { id: 'regalos', visible: false, order: 8 },
        { id: 'rsvp', visible: false, order: 9 },
        { id: 'muroSocial', visible: false, order: 10 },
        { id: 'historia', visible: false, order: 13 },
        { id: 'faq', visible: false, order: 14 },
        { id: 'logistica', visible: false, order: 15 },
      ],
    };

    await act(async () => {
      root.render(
        <InvitacionPublicaClient
          config={configTodasInactivas}
          fiestaId="fiesta-prueba-2"
          isEditorMode={true}
        />
      );
    });

    const texto = container.textContent || '';
    // Aparece una sola vez
    const coincidencias = texto.match(/AK está preparando esta sección/g) || [];
    expect(coincidencias).toHaveLength(1);

    // No debe haber texto sin tilde
    expect(texto).not.toContain('AK esta preparando esta seccion');
  });
});
