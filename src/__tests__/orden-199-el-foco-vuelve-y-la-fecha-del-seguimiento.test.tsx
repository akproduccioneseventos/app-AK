/**
 * Orden 199 (Codex 155): el video de ayuda del simulador abría un visor sin llevar el foco adentro, no
 * cerraba con Escape y al cerrar dejaba el foco en la nada. La galería de la portada tenía lo mismo
 * con el foco.
 * Codex 159 (en la orden 193): el borrador de seguimiento al prospecto decía "7/8/2027" para una fiesta
 * del 8 de agosto, porque leía la fecha en hora de Greenwich.
 */
import fs from 'node:fs';
import path from 'node:path';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { VideoDeAyuda } from '@/components/ayuda/VideoDeAyuda';

jest.mock('@/app/actions/videos-de-ayuda', () => ({ getVideosDeAyuda: jest.fn(async () => []) }));

let borradores: Array<{ messageText: string }> = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string) =>
    archivo === 'presupuestos.json'
      ? [{
          id: 'p1',
          estado: 'Enviado',
          clienteNombre: 'Ana',
          clienteContacto: '099000000',
          eventoFecha: '2027-08-08',
          timestamp: new Date(Date.now() - 6 * 86_400_000).toISOString(),
        }]
      : []),
  writeData: jest.fn(async (archivo: string, datos: Array<{ messageText: string }>) => {
    if (archivo === 'scheduled-messages.json') borradores = datos;
  }),
}));

const esperarCuadro = () => act(async () => { await new Promise((r) => requestAnimationFrame(() => r(null))); });

describe('el visor del video de ayuda maneja el foco (orden 199)', () => {
  it('al abrir enfoca Cerrar, Escape cierra y el foco vuelve al botón que lo abrió', async () => {
    const lugar = document.createElement('div');
    document.body.appendChild(lugar);
    const raiz = createRoot(lugar);
    act(() => {
      raiz.render(React.createElement(VideoDeAyuda, {
        lugar: 'simulador',
        initialVideo: { lugar: 'simulador', videoId: 'abc123', titulo: 'Cómo se usa' } as never,
      }));
    });
    const abrir = lugar.querySelector<HTMLButtonElement>('button[aria-label^="¿Cómo se usa?"]')!;
    abrir.focus();
    act(() => { abrir.click(); });
    await esperarCuadro();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Cerrar video de ayuda');

    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); });
    expect(lugar.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(abrir);
    act(() => { raiz.unmount(); });
  });

  it('la galería de la portada guarda y devuelve el foco a la foto elegida', () => {
    const codigo = fs.readFileSync(path.join(process.cwd(), 'src/components/landing/GallerySection.tsx'), 'utf8');
    expect(codigo).toMatch(/previousFocusRef\.current = document\.activeElement/);
    expect(codigo).toMatch(/ref=\{closeButtonRef\}/);
    expect(codigo).toMatch(/previo\.focus\(\)/);
  });
});

describe('el seguimiento al prospecto dice el día de la fiesta (Codex 159)', () => {
  it('una fiesta del 8 de agosto sale como 8 de agosto, no el 7', async () => {
    const { ejecutarPerseguidorPresupuestos } = await import('@/lib/agentes/motor-agentes');
    borradores = [];
    await ejecutarPerseguidorPresupuestos(new Date());
    expect(borradores).toHaveLength(1);
    expect(borradores[0].messageText).toContain('8 de agosto de 2027');
    expect(borradores[0].messageText).not.toMatch(/7\/8\/2027/);
  });
});
