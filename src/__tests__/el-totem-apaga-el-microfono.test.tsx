jest.setTimeout(20000);
/**
 * El tótem abría el micrófono con "Activar audio" y no lo apagaba nunca (ni cerraba el contexto de
 * audio). Ahora: se guarda la señal, se apaga al salir de la pantalla, si se activa dos veces se
 * apaga la primera, y si se sale mientras el navegador todavía pide el permiso, la señal que llega
 * después se apaga en vez de quedar prendida.
 *
 * Probado rompiendo: sin `apagarAudio()` en el cleanup, o sin la bandera de desmontado, los tres
 * casos se ponen en rojo (stop() nunca se llama).
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'f1', totemId: 't1' }),
  useSearchParams: () => new URLSearchParams(''),
}));
jest.mock('next/image', () => ({ __esModule: true, default: () => null }));
jest.mock('qrcode.react', () => ({ QRCodeSVG: () => null }));
jest.mock('framer-motion', () => {
  const R = require('react');
  const tag = (t: string) => R.forwardRef(({ children, initial, animate, exit, transition, whileHover, whileTap, layout, ...resto }: any, ref: any) =>
    R.createElement(t, { ...resto, ref }, children));
  return {
    AnimatePresence: ({ children }: any) => children,
    useReducedMotion: () => true,
    motion: new Proxy({}, { get: (_o, t: string) => tag(t) }),
  };
});
jest.mock('@/hooks/use-pantalla-prendida', () => ({ usePantallaPrendida: () => undefined }));
jest.mock('@/app/actions/fiesta/entretenimiento.actions', () => ({
  getEntertainmentLaunchToken: jest.fn(async () => ({ success: false })),
}));
jest.mock('@/app/actions/social-gallery', () => ({
  getPublicSocialEvent: jest.fn(async () => ({
    id: 'f1',
    configuracion: { nombreEvento: 'Fiesta' },
    socialGallerySettings: {
      totemScreens: [{ id: 't1', enabled: true, title: 'Hola', audioReactive: true, showQr: false, layout: 'portrait', backgroundMode: 'aurora', accentColor: '#dc2626' }],
    },
  })),
  getPublicSocialPosts: jest.fn(async () => []),
}));

import TotemPublicPage from '@/app/evento/totem/[fiestaId]/[totemId]/page';

const pistas = () => {
  const stop = jest.fn();
  return { stop, stream: { getTracks: () => [{ stop }] } as unknown as MediaStream };
};

let contextos: { close: jest.Mock }[] = [];
beforeEach(() => {
  contextos = [];
  (window as any).AudioContext = function () {
    const c = {
      state: 'running',
      close: jest.fn(async () => undefined),
      createMediaStreamSource: () => ({ connect: () => undefined }),
      createAnalyser: () => ({ fftSize: 0, frequencyBinCount: 4, getByteFrequencyData: () => undefined }),
    };
    contextos.push(c);
    return c;
  };
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

async function montar() {
  const cont = document.createElement('div');
  document.body.appendChild(cont);
  const r = createRoot(cont);
  await act(async () => { r.render(<TotemPublicPage />); });
  await act(async () => { await Promise.resolve(); });
  const boton = Array.from(cont.querySelectorAll('button')).find((b) => /Activar audio/i.test(b.textContent || ''));
  return { r, boton: boton as HTMLButtonElement | undefined };
}

it('al salir de la pantalla apaga el micrófono y cierra el contexto de audio', async () => {
  const a = pistas();
  (navigator as any).mediaDevices = { getUserMedia: jest.fn(async () => a.stream) };
  const { r, boton } = await montar();
  expect(boton).toBeDefined();
  await act(async () => { boton!.click(); });
  expect(a.stop).not.toHaveBeenCalled();
  await act(async () => { r.unmount(); });
  expect(a.stop).toHaveBeenCalledTimes(1);
  expect(contextos[0].close).toHaveBeenCalled();
});

it('si se activa dos veces, apaga la primera señal antes de abrir otra', async () => {
  const a = pistas();
  const b = pistas();
  const getUserMedia = jest.fn().mockResolvedValueOnce(a.stream).mockResolvedValueOnce(b.stream);
  (navigator as any).mediaDevices = { getUserMedia };
  const { r, boton } = await montar();
  await act(async () => { boton!.click(); });
  await act(async () => { boton!.click(); });
  expect(a.stop).toHaveBeenCalledTimes(1);
  expect(b.stop).not.toHaveBeenCalled();
  await act(async () => { r.unmount(); });
  expect(b.stop).toHaveBeenCalledTimes(1);
});

it('si se sale mientras el navegador pide el permiso, la señal que llega después se apaga', async () => {
  const a = pistas();
  let darPermiso!: (s: MediaStream) => void;
  (navigator as any).mediaDevices = { getUserMedia: jest.fn(() => new Promise<MediaStream>((ok) => { darPermiso = ok; })) };
  const { r, boton } = await montar();
  await act(async () => { boton!.click(); });
  await act(async () => { r.unmount(); });
  await act(async () => { darPermiso(a.stream); await Promise.resolve(); });
  expect(a.stop).toHaveBeenCalledTimes(1);
  expect(contextos).toHaveLength(0);
});
