/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  EVENT_TIMEZONE,
  parseEventDate,
  parseEventDateTimeUruguay,
} from '@/lib/public-experience/event-date';
import { defaultInvitacionConfig } from '@/lib/invitacion-config-defaults';
import { InvitacionPublicaClient } from '@/app/invitacion/[fiestaId]/invitacion-publica-client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@/app/actions/fiesta/invitados.actions', () => ({
  submitPublicRsvp: jest.fn(async () => ({ success: true })),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => React.createElement('img', { alt: props.alt ?? '', ...props }),
}));

jest.mock('@/components/ui/imagen-con-respaldo', () => ({
  ImagenConRespaldo: (props: any) => React.createElement('img', { alt: props.alt ?? '', ...props }),
}));

jest.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag: string) => {
        return ({
          children,
          initial,
          animate,
          exit,
          transition,
          whileInView,
          viewport,
          whileHover,
          whileTap,
          variants,
          ...props
        }: any) => React.createElement(tag, props, children);
      },
    },
  ),
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
  useMotionValue: () => ({ get: () => 0, set: () => {} }),
  useTransform: () => ({ get: () => 0 }),
}));

jest.mock('@/components/invitacion/SplashScreen', () => ({
  SplashScreen: () => null,
}));

jest.mock('@/components/invitacion/xv-theme-effects', () => ({
  XVThemeEffects: () => null,
}));

jest.mock('@/components/invitacion/EventParticles', () => ({
  EventParticles: () => null,
}));

describe('Orden 335 — Bloque 6: La cuenta regresiva usa la hora en America/Montevideo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('parseEventDate y parseEventDateTimeUruguay arman el instante exacto en America/Montevideo', () => {
    expect(EVENT_TIMEZONE).toBe('America/Montevideo');

    // 23 de noviembre de 2026 a las 21:00 en Uruguay (UTC-3) = 2026-11-24T00:00:00.000Z
    const targetFromParse = parseEventDate('2026-11-23', '21:00');
    const targetUruguay = parseEventDateTimeUruguay('2026-11-23', '21:00');
    expect(targetFromParse?.toISOString()).toBe('2026-11-24T00:00:00.000Z');
    expect(targetUruguay?.toISOString()).toBe('2026-11-24T00:00:00.000Z');

    // A las 20:59 hora de Uruguay falta exactamente 1 minuto (60.000 ms)
    const uy2059 = new Date('2026-11-23T23:59:00.000Z').getTime();
    expect(targetUruguay!.getTime() - uy2059).toBe(60_000);

    // A las 21:00 hora de Uruguay llega exactamente a 0
    const uy2100 = new Date('2026-11-24T00:00:00.000Z').getTime();
    expect(targetUruguay!.getTime() - uy2100).toBe(0);
  });

  it('en el día del evento a las 20:59 cuenta 1 minuto y a las 21:00 pasa a 0 / ¡Es hoy!', async () => {
    // 20:59 en America/Montevideo del 2026-11-23
    jest.setSystemTime(new Date('2026-11-23T23:59:00.000Z'));

    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    const config = {
      ...defaultInvitacionConfig,
      nombreHomenajeada: 'Valentina',
      fechaEvento: '2026-11-23',
      horaEvento: '21:00',
      contadorActivo: true,
    };

    await act(async () => {
      root = createRoot(container);
      root.render(
        React.createElement(InvitacionPublicaClient, {
          config,
          fiestaId: 'fiesta-hora-uy',
          horaEvento: '21:00',
          isEditorMode: true,
        }),
      );
    });

    const textoAntes = container.textContent || '';
    expect(textoAntes).not.toContain('Esta fiesta ya se realizó');
    expect(textoAntes).toContain('01');
    expect(textoAntes).toContain('minutos');

    // Avanzar 60 segundos hasta las 21:00 en America/Montevideo
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    const textoEnHora = container.textContent || '';
    expect(textoEnHora).toContain('¡Es hoy!');
    expect(textoEnHora).not.toContain('01minutos');
    expect(textoEnHora).not.toContain('Esta fiesta ya se realizó');

    await act(async () => {
      root?.unmount();
    });
    container.remove();
  });
});
