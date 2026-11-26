/**
 * @jest-environment jsdom
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SocialMediaCalendar } from '@/components/social-media/SocialMediaCalendar';
import type { SocialPost } from '@/types/social-media';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
});
afterAll(() => {
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT');
});

describe('El calendario de redes usa el día civil de Uruguay (Orden 375 B11)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-15T15:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('agrupa un posteo de las 22:30 UY (01:30 UTC del día siguiente) en el día 15 y no en el 16', async () => {
    const postNocheUy: SocialPost = {
      id: 'post-uy-noche',
      platform: 'Instagram',
      status: 'Programado',
      text: 'Post nocturno hora Uruguay',
      publishDate: '2026-11-16T01:30:00.000Z',
      createdAt: '2026-11-15T10:00:00.000Z',
      updatedAt: '2026-11-15T10:00:00.000Z',
    };

    const host = document.body.appendChild(document.createElement('div'));
    const root = createRoot(host);
    try {
      await act(async () => {
        root.render(React.createElement(SocialMediaCalendar, { posts: [postNocheUy] }));
      });

      const botones = Array.from(host.querySelectorAll<HTMLButtonElement>('button'));
      const botonDia16 = botones.find((b) => b.textContent?.trim() === '16');
      const botonDia15 = botones.find((b) => b.textContent?.trim() === '15');
      expect(botonDia15).toBeTruthy();
      expect(botonDia16).toBeTruthy();

      await act(async () => {
        botonDia16!.click();
      });
      expect(document.body.textContent).not.toContain('Post nocturno hora Uruguay');

      await act(async () => {
        botonDia15!.click();
      });
      expect(document.body.textContent).toContain('Post nocturno hora Uruguay');
    } finally {
      act(() => root.unmount());
      host.remove();
    }
  });
});
