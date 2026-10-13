/** @jest-environment node */
/**
 * TRIVIA EN VIVO Y MISIONES DE FOTOS CON PUNTOS DE VERDAD (13 de octubre de 2026).
 *
 * Pantallas que tocan: el celular del invitado `/evento/social/[fiestaId]`, la pantalla gigante
 * `/evento/muro-en-vivo/[fiestaId]` y el panel del operador `/fiestas/nueva/muro-social`.
 *
 * Se prueba el RESULTADO con las acciones reales y una base de mentira que devuelve COPIAS en cada
 * lectura y atiende de a una transacción (error 11: con la misma lista en memoria estas pruebas no
 * podrían fallar nunca).
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 5));

let fiesta: any;
let turno: Promise<unknown> = Promise.resolve();
let permisoNoche = true;

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((_id: string, cambiar: (f: any) => any) => {
    const r = turno.then(async () => {
      try {
        const nueva = await cambiar(copia(fiesta));
        await esperar();
        fiesta = copia(nueva);
        return { success: true, updatedFiesta: copia(fiesta) };
      } catch (e: any) { return { success: false, error: e.message }; }
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({ getFiestaById: jest.fn(async () => copia(fiesta)), saveFiesta: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => copia(fiesta)), saveFiesta: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => {
    if (!permisoNoche) throw new Error('No tenés permiso para esto.');
    return copia(fiesta);
  }),
}));
const topes: Array<{ scope: string; identity: string; limit: number; ignoreClientAddress?: boolean }> = [];
jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn(async (input: any) => { topes.push(input); }),
}));

import { responderTrivia, terminarTrivia, revelarRespuestaTrivia, getMiProgresoDeJuegos } from '@/app/actions/games.actions';
import * as gamesActions from '@/app/actions/games.actions';
import { sumarMisionDeFoto } from '@/lib/games/misiones-fotos';
import { ocultarRespuestaCorrecta, toPublicSocialEvent } from '@/lib/social-fiesta/public-event';
import { puntosDeTrivia } from '@/lib/games/juegos-en-vivo';

const lanzadaHace = (ms: number) => new Date(Date.now() - ms).toISOString();

function fiestaConTrivia(hace = 2000, extra: any = {}) {
  return {
    id: 'f1',
    configuracion: { nombreEvento: 'Quince de Ana', fechaEvento: '2026-11-01' },
    invitados: [
      { id: 'g1', nombre: 'Sofía Pérez', guestAccessToken: 'tok1', tableNumber: '4' },
      { id: 'g2', nombre: 'Mateo Gómez', guestAccessToken: 'tok2', tableNumber: '4' },
      { id: 'g3', nombre: 'Lucía Ríos', guestAccessToken: 'tok3', tableNumber: '7' },
    ],
    socialGallerySettings: {
      enabled: true,
      activeGame: {
        type: 'trivia', title: '¿Dónde nació Ana?', launchedAt: lanzadaHace(hace),
        options: [{ id: 'opt_0', text: 'Salto' }, { id: 'opt_1', text: 'Paysandú' }, { id: 'opt_2', text: 'Rivera' }],
        correctOptionId: 'opt_0', respuestaRevelada: false,
        ...extra,
      },
    },
  };
}

const sofia = { guestId: 'g1', guestAccessToken: 'tok1' };
const mateo = { guestId: 'g2', guestAccessToken: 'tok2' };
const puntosDe = (clave: string) => fiesta.triviaGame?.participants?.find((p: any) => p.guestId === clave)?.score;

beforeEach(() => {
  fiesta = fiestaConTrivia();
  turno = Promise.resolve();
  permisoNoche = true;
  topes.length = 0;
});

describe('responder la trivia', () => {
  it('acierta rápido: suma entre 100 y 150, calculado por el servidor', async () => {
    const r = await responderTrivia('f1', 'opt_0', sofia);
    expect(r.success).toBe(true);
    const puntos = puntosDe('g1');
    expect(puntos).toBeGreaterThanOrEqual(100);
    expect(puntos).toBeLessThanOrEqual(150);
    // Más rápido, más puntos: a los 2 s son más que a los 14 s.
    fiesta = fiestaConTrivia(14000);
    await responderTrivia('f1', 'opt_0', mateo);
    expect(puntosDe('g2')).toBeLessThan(puntos);
    expect(puntosDe('g2')).toBeGreaterThanOrEqual(100);
  });

  it('el bono por rapidez es lineal sobre 15 segundos', () => {
    expect(puntosDeTrivia(true, 0)).toBe(150);
    expect(puntosDeTrivia(true, 7500)).toBe(125);
    expect(puntosDeTrivia(true, 15000)).toBe(100);
    expect(puntosDeTrivia(true, 19000)).toBe(100);
    expect(puntosDeTrivia(false, 0)).toBe(0);
  });

  it('erra: 0 puntos, pero la respuesta queda anotada', async () => {
    await responderTrivia('f1', 'opt_1', sofia);
    expect(puntosDe('g1')).toBe(0);
    expect(fiesta.triviaGame.participants[0].answers).toHaveLength(1);
  });

  it('el mismo participante respondiendo dos veces la misma pregunta suma una sola vez', async () => {
    await responderTrivia('f1', 'opt_0', sofia);
    const primera = puntosDe('g1');
    const segunda = await responderTrivia('f1', 'opt_0', sofia);
    expect(segunda.yaRespondida).toBe(true);
    // Ni cambiando de opción ni reintentando se suma otra vez.
    await responderTrivia('f1', 'opt_1', sofia);
    expect(puntosDe('g1')).toBe(primera);
    expect(fiesta.triviaGame.participants[0].answers).toHaveLength(1);
  });

  it('fuera de los 20 segundos no suma ni queda anotado', async () => {
    fiesta = fiestaConTrivia(25000);
    const r = await responderTrivia('f1', 'opt_0', sofia);
    expect(r.success).toBe(true);
    expect(r.fueraDeTiempo).toBe(true);
    expect(fiesta.triviaGame).toBeUndefined();
  });

  it('dos participantes a la vez: los dos quedan con sus puntos', async () => {
    const [a, b] = await Promise.all([responderTrivia('f1', 'opt_0', sofia), responderTrivia('f1', 'opt_0', mateo)]);
    expect(a.success && b.success).toBe(true);
    expect(fiesta.triviaGame.participants.map((p: any) => p.guestId).sort()).toEqual(['g1', 'g2']);
    expect(puntosDe('g1')).toBeGreaterThanOrEqual(100);
    expect(puntosDe('g2')).toBeGreaterThanOrEqual(100);
  });

  it('el invitado con mesa suma a su mesa; un teléfono sin invitación juega por su id de teléfono', async () => {
    await responderTrivia('f1', 'opt_0', sofia);
    expect(fiesta.triviaGame.participants[0].tableNumber).toBe('4');
    const r = await responderTrivia('f1', 'opt_0', { dispositivoId: 'telefono-0001', nombre: 'Tía Marta' });
    expect(r.success).toBe(true);
    expect(puntosDe('d:telefono-0001')).toBeGreaterThanOrEqual(100);
  });

  it('sin credencial ni teléfono válido se rechaza con un cartel claro', async () => {
    const r = await responderTrivia('f1', 'opt_0', {});
    expect(r.success).toBe(false);
    expect(r.error).toBe('Abrí la invitación desde tu enlace para jugar.');
    const falsa = await responderTrivia('f1', 'opt_0', { guestId: 'g1', guestAccessToken: 'falsa' });
    expect(falsa.success).toBe(false);
    expect(fiesta.triviaGame).toBeUndefined();
    const raro = await responderTrivia('f1', 'opt_0', { dispositivoId: '../../x' });
    expect(raro.success).toBe(false);
  });

  it('sin trivia en pantalla, o con una pregunta ya revelada, no suma', async () => {
    fiesta = fiestaConTrivia(2000, { type: 'siONo' });
    expect((await responderTrivia('f1', 'opt_0', sofia)).success).toBe(false);
    fiesta = fiestaConTrivia(2000, { respuestaRevelada: true });
    expect((await responderTrivia('f1', 'opt_0', sofia)).success).toBe(false);
    fiesta = fiestaConTrivia();
    expect((await responderTrivia('f1', 'no_existe', sofia)).success).toBe(false);
    expect(fiesta.triviaGame).toBeUndefined();
  });

  it('cada pregunta nueva se puede responder una vez, y el puntaje se acumula', async () => {
    await responderTrivia('f1', 'opt_0', sofia);
    const primera = puntosDe('g1');
    fiesta.socialGallerySettings.activeGame = { ...fiesta.socialGallerySettings.activeGame, launchedAt: lanzadaHace(1000) };
    await responderTrivia('f1', 'opt_0', sofia);
    expect(puntosDe('g1')).toBeGreaterThan(primera);
  });

  it('los topes: red alta y 10 por minuto por teléfono sin mirar la red', async () => {
    await responderTrivia('f1', 'opt_0', sofia);
    expect(topes.find((t) => t.scope === 'social-trivia-respuesta')!.limit).toBeGreaterThanOrEqual(600);
    const tel = topes.find((t) => t.scope === 'social-trivia-respuesta-telefono')!;
    expect(tel.limit).toBe(10);
    expect(tel.ignoreClientAddress).toBe(true);
  });

  it('nadie puede mandar puntos: ninguna acción recibe un puntaje', () => {
    expect((gamesActions as any).submitTriviaScore).toBeUndefined();
    expect(responderTrivia.length).toBe(3); // (fiestaId, optionId, quien): nada de puntos
  });
});

describe('el servidor no manda la respuesta correcta antes de revelarla', () => {
  it('lo que reciben celulares y pantalla gigante no trae correctOptionId hasta que se revela', () => {
    const publico = toPublicSocialEvent(fiestaConTrivia() as any);
    expect(publico.socialGallerySettings?.activeGame?.correctOptionId).toBeUndefined();
    const revelada = toPublicSocialEvent(fiestaConTrivia(2000, { respuestaRevelada: true }) as any);
    expect(revelada.socialGallerySettings?.activeGame?.correctOptionId).toBe('opt_0');
    expect(ocultarRespuestaCorrecta({ type: 'siONo', title: 'x', launchedAt: 'y', correctOptionId: 'a' })?.correctOptionId).toBe('a');
  });

  it('revelar cierra la pregunta: lo que llegue tarde ya no suma', async () => {
    await revelarRespuestaTrivia('f1');
    expect(fiesta.socialGallerySettings.activeGame.respuestaRevelada).toBe(true);
    expect((await responderTrivia('f1', 'opt_0', sofia)).success).toBe(false);
    permisoNoche = false;
    fiesta.socialGallerySettings.activeGame.respuestaRevelada = false;
    expect((await revelarRespuestaTrivia('f1')).success).toBe(false);
    expect(fiesta.socialGallerySettings.activeGame.respuestaRevelada).toBe(false);
  });
});

describe('terminar la trivia', () => {
  it('sin permiso de la noche rechaza y no toca nada', async () => {
    await responderTrivia('f1', 'opt_0', sofia);
    permisoNoche = false;
    const r = await terminarTrivia('f1');
    expect(r.success).toBe(false);
    expect(fiesta.socialGallerySettings.activeGame.isFinished).toBeUndefined();
  });

  it('con permiso: queda terminada, con podio por mesa y top 5 individual ordenado', async () => {
    fiesta.invitados.push(
      { id: 'g4', nombre: 'Ana', guestAccessToken: 't4' }, { id: 'g5', nombre: 'Beto Ruiz Díaz', guestAccessToken: 't5' },
      { id: 'g6', nombre: 'Cleo', guestAccessToken: 't6' }, { id: 'g7', nombre: 'Dani', guestAccessToken: 't7' },
    );
    // g1 y g2 (mesa 4) aciertan; g3 (mesa 7) acierta tarde; el resto erra o acierta.
    await responderTrivia('f1', 'opt_0', sofia);
    await responderTrivia('f1', 'opt_0', mateo);
    fiesta.triviaGame.participants.push(
      { guestId: 'g3', guestName: 'Lucía Ríos', tableNumber: '7', score: 90, answers: [] },
      { guestId: 'g4', guestName: 'Ana', score: 400, answers: [] },
      { guestId: 'g5', guestName: 'Beto Ruiz Díaz', score: 300, answers: [] },
      { guestId: 'g6', guestName: 'Cleo', score: 200, answers: [] },
      { guestId: 'g7', guestName: 'Dani', score: 0, answers: [] },
    );
    const r = await terminarTrivia('f1');
    expect(r.success).toBe(true);
    const juego = fiesta.socialGallerySettings.activeGame;
    expect(juego.isFinished).toBe(true);
    expect(juego.respuestaRevelada).toBe(true);
    expect(juego.topJugadores).toHaveLength(5);
    const puntos = juego.topJugadores.map((j: any) => j.puntos);
    expect(puntos).toEqual([...puntos].sort((a, b) => b - a));
    expect(juego.topJugadores[0]).toEqual({ nombre: 'Ana', puntos: 400 });
    expect(juego.topJugadores[1].nombre).toBe('Beto D.'); // nombre corto: el podio no muestra apellidos
    expect(juego.tableLeaderboard[0].tableNumber).toBe('4'); // sumaron Sofía y Mateo
  });

  it('sin una trivia en pantalla da un error claro', async () => {
    fiesta = fiestaConTrivia(2000, { type: 'siONo' });
    const r = await terminarTrivia('f1');
    expect(r.success).toBe(false);
  });
});

describe('lo que el celular lee de su progreso', () => {
  it('trae lo que el servidor tiene anotado, no lo que el celular recuerde', async () => {
    await responderTrivia('f1', 'opt_1', sofia);
    const p = await getMiProgresoDeJuegos('f1', sofia);
    expect(p.trivia.respuesta).toEqual({ optionId: 'opt_1', puntos: 0 });
    expect(p.trivia.lanzada).toBe(fiesta.socialGallerySettings.activeGame.launchedAt);
    const otro = await getMiProgresoDeJuegos('f1', mateo);
    expect(otro.trivia.respuesta).toBeUndefined();
    const intruso = await getMiProgresoDeJuegos('f1', { guestId: 'g1', guestAccessToken: 'falsa' });
    expect(intruso.trivia.puntos).toBe(0);
  });
});

describe('misiones de fotos', () => {
  it('cumplir una misión suma sus puntos una sola vez', async () => {
    const a = await sumarMisionDeFoto('f1', 'mision:m1', sofia);
    expect(a).toEqual({ sumo: true, puntos: 100 });
    const b = await sumarMisionDeFoto('f1', 'mision:m1', sofia);
    expect(b.sumo).toBe(false);
    await sumarMisionDeFoto('f1', 'mision:m2', sofia);
    expect(fiesta.misionesFotos.g1).toEqual({ nombre: 'Sofía Pérez', misiones: ['m1', 'm2'], puntos: 150 });
  });

  it('una misión que no existe no suma', async () => {
    const r = await sumarMisionDeFoto('f1', 'mision:inventada', sofia);
    expect(r.sumo).toBe(false);
    expect(fiesta.misionesFotos).toBeUndefined();
  });

  it('usa las misiones de la fiesta si las tiene (y no las de por defecto)', async () => {
    fiesta.photoMissions = [{ id: 'propia', title: 'Foto con el abuelo', description: 'x', emoji: '👴', points: 40 }];
    expect((await sumarMisionDeFoto('f1', 'mision:m1', sofia)).sumo).toBe(false);
    expect((await sumarMisionDeFoto('f1', 'mision:propia', sofia)).puntos).toBe(40);
  });

  it('sin enlace válido ni teléfono, o con otra etiqueta, no suma', async () => {
    expect((await sumarMisionDeFoto('f1', 'mision:m1', { guestId: 'g1', guestAccessToken: 'falsa' })).sumo).toBe(false);
    expect((await sumarMisionDeFoto('f1', 'recuerdo', sofia)).sumo).toBe(false);
    expect((await sumarMisionDeFoto('f1', undefined, sofia)).sumo).toBe(false);
    expect(fiesta.misionesFotos).toBeUndefined();
  });

  it('dos misiones a la vez del mismo invitado: las dos quedan', async () => {
    await Promise.all([sumarMisionDeFoto('f1', 'mision:m1', sofia), sumarMisionDeFoto('f1', 'mision:m2', sofia)]);
    expect(fiesta.misionesFotos.g1.misiones.sort()).toEqual(['m1', 'm2']);
    expect(fiesta.misionesFotos.g1.puntos).toBe(150);
  });

  it('el progreso del celular trae las misiones cumplidas desde el servidor', async () => {
    await sumarMisionDeFoto('f1', 'mision:m3', sofia);
    const p = await getMiProgresoDeJuegos('f1', sofia);
    expect(p.misiones).toEqual({ cumplidas: ['m3'], puntos: 80 });
  });

  it('el ranking público muestra nombre corto y puntos, nada más', async () => {
    await sumarMisionDeFoto('f1', 'mision:m4', sofia);
    await sumarMisionDeFoto('f1', 'mision:m1', mateo);
    const publico = toPublicSocialEvent(fiesta as any);
    expect(publico.rankingJuegos?.cazadores).toEqual([{ nombre: 'Sofía P.', puntos: 150 }, { nombre: 'Mateo G.', puntos: 100 }]);
  });
});
