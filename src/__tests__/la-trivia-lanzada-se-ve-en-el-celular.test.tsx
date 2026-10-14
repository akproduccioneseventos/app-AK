/**
 * La pantalla del celular del invitado (`/evento/social/[fiestaId]`) con una trivia lanzada desde el
 * panel del operador (`/fiestas/nueva/muro-social`) muestra LA pregunta lanzada, con sus opciones, y
 * NO las cinco preguntas fijas que traía antes. Un toque manda sólo la opción elegida (nunca puntos).
 * La pantalla gigante (`/evento/muro-en-vivo/[fiestaId]`) comparte el mismo dato del servidor.
 */
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

const responderTrivia = jest.fn();
const getMiProgresoDeJuegos = jest.fn();
const getPublicSocialEvent = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ fiestaId: 'f1' }),
  useSearchParams: () => new URLSearchParams('guestId=g1&token=tok1&section=game'),
}));
jest.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: jest.fn() }) }));
jest.mock('@/app/actions/games.actions', () => ({
  responderTrivia: (...a: unknown[]) => responderTrivia(...a),
  getMiProgresoDeJuegos: (...a: unknown[]) => getMiProgresoDeJuegos(...a),
}));
jest.mock('@/app/actions/social-gallery', () => ({
  addChatMessage: jest.fn(), addCommentToPost: jest.fn(), addLikeToPost: jest.fn(),
  getChatMessages: jest.fn(async () => []),
  getPublicSocialEvent: (...a: unknown[]) => getPublicSocialEvent(...a),
  getPublicSocialPosts: jest.fn(async () => []),
  uploadSocialPost: jest.fn(),
}));
jest.mock('@/app/actions/social-interactive', () => ({
  addDedication: jest.fn(), addSongRequest: jest.fn(), getActivePoll: jest.fn(async () => null),
  getPublicDedications: jest.fn(async () => []), getSongRequests: jest.fn(async () => []),
  uploadDedicationAudio: jest.fn(), votePoll: jest.fn(), voteSongRequest: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/screen-mode.actions', () => ({ voteActiveGameOption: jest.fn() }));
jest.mock('@/app/actions/public-guest-portal', () => ({ getPublicGuestPortalData: jest.fn(async () => ({ guest: { nombre: 'Sofía Pérez' } })) }));
jest.mock('@/components/legal/AvisoDeDatos', () => ({ AvisoDeDatos: () => null }));
jest.mock('@/components/public/QuinceaneraLeadPrompt', () => ({ QuinceaneraLeadPrompt: () => null }));
jest.mock('@/components/social-wall/PostEventMemoryHub', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/entertainment/FaceGalleryStrip', () => ({ FaceGalleryStrip: () => null }));
jest.mock('@/components/social-wall/PaparazziOverlay', () => ({ PaparazziOverlay: () => null }));
jest.mock('@/components/invitacion/SpotifySongSearch', () => ({ SpotifySongSearch: () => null }));
jest.mock('@/components/ayuda/VideoDeAyuda', () => ({ VideoDeAyuda: () => null }));

import SocialEventPage from '@/app/evento/social/[fiestaId]/page';

beforeAll(() => {
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  window.history.replaceState({}, '', '/evento/social/f1?guestId=g1&token=tok1&section=game');
});
afterAll(() => { Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'); });

let LANZADA = new Date().toISOString();
const eventoConTrivia = (extra: any = {}) => ({
  id: 'f1',
  configuracion: { nombreEvento: 'Quince de Ana', fechaEvento: '2026-11-01' },
  socialGallerySettings: {
    enabled: true,
    activeGame: {
      type: 'trivia', title: '¿En qué año nació el abuelo de Ana?', subtitle: 'Pista: fue en invierno',
      launchedAt: LANZADA,
      options: [{ id: 'opt_0', text: '1950' }, { id: 'opt_1', text: '1948' }, { id: 'opt_2', text: '1955' }],
      ...extra,
    },
  },
});

async function montar() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<SocialEventPage />); });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}

beforeEach(() => {
  LANZADA = new Date().toISOString();
  responderTrivia.mockReset().mockResolvedValue({ success: true });
  getMiProgresoDeJuegos.mockReset().mockResolvedValue({ trivia: { puntos: 0 }, misiones: { cumplidas: [], puntos: 0 } });
  getPublicSocialEvent.mockReset().mockResolvedValue(eventoConTrivia());
});

test('muestra la pregunta que lanzó el operador y no las preguntas fijas', async () => {
  const { host, cerrar } = await montar();
  const texto = host.textContent || '';
  expect(texto).toContain('¿En qué año nació el abuelo de Ana?');
  for (const opcion of ['1950', '1948', '1955']) expect(texto).toContain(opcion);
  // Las cinco preguntas fijas de antes (game-engine) no aparecen.
  expect(texto).not.toContain('¿Quién va a ser el último en irse?');
  expect(texto).not.toContain('Los padres');
  cerrar();
});

test('un toque manda sólo la opción elegida y la pantalla dice "Respuesta enviada"', async () => {
  const { host, cerrar } = await montar();
  const boton = Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.includes('1948'))!;
  getMiProgresoDeJuegos.mockResolvedValue({
    trivia: { puntos: 0, lanzada: LANZADA, respuesta: { optionId: 'opt_1', puntos: 0 } },
    misiones: { cumplidas: [], puntos: 0 },
  });
  await act(async () => { boton.click(); });
  expect(responderTrivia).toHaveBeenCalledTimes(1);
  const [fiestaId, optionId, quien] = responderTrivia.mock.calls[0];
  expect(fiestaId).toBe('f1');
  expect(optionId).toBe('opt_1');
  expect(Object.keys(quien).sort()).toEqual(['dispositivoId', 'guestAccessToken', 'guestId', 'nombre'].sort());
  expect(host.textContent).toContain('Respuesta enviada');
  cerrar();
});

test('cuando la pantalla revela la respuesta, dice si acertó y el puntaje', async () => {
  const evento = eventoConTrivia({ correctOptionId: 'opt_0', respuestaRevelada: true });
  getPublicSocialEvent.mockResolvedValue(evento);
  getMiProgresoDeJuegos.mockResolvedValue({
    trivia: { puntos: 140, lanzada: LANZADA, respuesta: { optionId: 'opt_0', puntos: 140 } },
    misiones: { cumplidas: [], puntos: 0 },
  });
  const { host, cerrar } = await montar();
  expect(host.textContent).toContain('¡Acertaste! +140 puntos');
  expect(host.textContent).toContain('Tu puntaje: 140');
  cerrar();
});

test('misiones: muestra las de la fiesta y marca como cumplida la que el servidor tiene anotada', async () => {
  window.history.replaceState({}, '', '/evento/social/f1?guestId=g1&token=tok1&section=missions');
  getPublicSocialEvent.mockResolvedValue({
    ...eventoConTrivia(),
    photoMissions: [
      { id: 'a', title: 'Foto con el abuelo', description: 'Con el abuelo de Ana', emoji: '👴', points: 40 },
      { id: 'b', title: 'Brindis en la pista', description: 'Chin chin', emoji: '🥂', points: 60 },
    ],
  });
  getMiProgresoDeJuegos.mockResolvedValue({ trivia: { puntos: 0 }, misiones: { cumplidas: ['b'], puntos: 60 } });
  const { host, cerrar } = await montar();
  const texto = host.textContent || '';
  expect(texto).toContain('Foto con el abuelo');
  expect(texto).not.toContain('Selfie con los festejados'); // las de por defecto no se mezclan
  expect(texto).toContain('Tus puntos: 60');
  const botones = Array.from(host.querySelectorAll('button')).filter((b) => /Completada|Sacar la foto/.test(b.textContent || ''));
  expect(botones.map((b) => b.textContent)).toEqual(['Sacar la foto', 'Completada']);
  expect(botones[1].hasAttribute('disabled')).toBe(true);
  cerrar();
});
