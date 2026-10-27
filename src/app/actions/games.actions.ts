'use server';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateWithGeminiFallback, geminiModel } from '@/ai/genkit';

import { getFiestaById, saveFiesta } from '@/app/actions/fiesta-actual';
import { getFiestaById as getFiestaPublica } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { TriviaGame, type TriviaQuestion, PhotoMission, calculateLeaderboard } from '@/lib/games/game-engine';
import { requireAppSession } from '@/lib/auth/require-session';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import {
  SEGUNDOS_PARA_RESPONDER,
  dispositivoValido,
  puntosDeTrivia,
  resolverJugador,
  topCinco,
  type QuienJuega,
} from '@/lib/games/juegos-en-vivo';

/**
 * No existe un \updateFiestaById\ parcial: la fiesta se guarda entera con
 * \saveFiesta\, asi que se parte de la fiesta ya leida y se reemplaza solo el
 * campo correspondiente.
 */
export async function saveTriviaGame(fiestaId: string, game: TriviaGame): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return false;

  const result = await saveFiesta({
    ...fiesta,
    triviaGame: game,
  });
  return result.success;
}

export async function getTriviaGame(fiestaId: string): Promise<TriviaGame | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  return fiesta?.triviaGame || null;
}

export async function savePhotoMissions(fiestaId: string, missions: PhotoMission[]): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  if (!fiesta) return false;

  const result = await saveFiesta({
    ...fiesta,
    photoMissions: missions,
  });
  return result.success;
}

export async function getPhotoMissions(fiestaId: string): Promise<PhotoMission[] | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
  return fiesta?.photoMissions || null;
}

/**
 * TRIVIA EN VIVO, como Kahoot (13 de octubre de 2026): el celular muestra la pregunta que lanzó el
 * operador y manda SOLO qué opción tocó. Los puntos los calcula el servidor (100 por acertar, más
 * hasta 50 por rapidez), una respuesta por jugador y pregunta, y dentro de los 20 segundos desde
 * que se lanzó. No existe ninguna acción que reciba un puntaje: antes se podía sumar a mano.
 */
export async function responderTrivia(
  fiestaId: string,
  optionId: string,
  quien: QuienJuega,
): Promise<{ success: boolean; error?: string; yaRespondida?: boolean; fueraDeTiempo?: boolean }> {
  try {
    const tieneCredencial = Boolean(quien?.guestId && quien?.guestAccessToken);
    const dispositivo = dispositivoValido(quien?.dispositivoId);
    if (!tieneCredencial && !dispositivo) {
      return { success: false, error: 'Abrí la invitación desde tu enlace para jugar.' };
    }
    if (typeof optionId !== 'string' || !optionId) return { success: false, error: 'Opción no válida.' };
    await enforcePublicRateLimit({
      scope: 'social-trivia-respuesta',
      identity: fiestaId,
      limit: 600,
      windowMs: 60_000,
    });
    await enforcePublicRateLimit({
      scope: 'social-trivia-respuesta-telefono',
      identity: `${fiestaId}:${tieneCredencial ? quien.guestId : dispositivo}`,
      limit: 10,
      windowMs: 60_000,
      ignoreClientAddress: true,
    });

    let resultado: { yaRespondida?: boolean; fueraDeTiempo?: boolean } = {};
    const guardado = await actualizarFiesta(fiestaId, (fresca) => {
      resultado = {};
      const activeGame = fresca.socialGallerySettings?.activeGame;
      if (!activeGame || activeGame.type !== 'trivia') throw new Error('No hay una trivia en juego.');
      if (activeGame.isFinished || activeGame.respuestaRevelada) throw new Error('Esta pregunta ya cerró.');
      if (!(activeGame.options || []).some((o) => o.id === optionId)) throw new Error('Opción no válida.');
      const jugador = resolverJugador(fresca, quien);
      if (!jugador) throw new Error('Abrí la invitación desde tu enlace para jugar.');

      const milisegundos = Date.now() - Date.parse(activeGame.launchedAt);
      if (!Number.isFinite(milisegundos)) throw new Error('No hay una trivia en juego.');
      if (milisegundos > SEGUNDOS_PARA_RESPONDER * 1000) {
        resultado = { fueraDeTiempo: true };
        return fresca;
      }

      const triviaGame = fresca.triviaGame || {
        id: `trivia_${fiestaId}`,
        fiestaId,
        title: 'Trivia de la Fiesta',
        questions: [],
        createdAt: new Date().toISOString(),
        status: 'active' as const,
        participants: [],
      };
      const participants = [...(triviaGame.participants || [])];
      const indice = participants.findIndex((p) => p.guestId === jugador.clave);
      const previo = indice >= 0 ? participants[indice] : undefined;
      if (previo?.answers?.some((a) => a.questionId === activeGame.launchedAt)) {
        resultado = { yaRespondida: true };
        return fresca;
      }
      const acerto = Boolean(activeGame.correctOptionId) && optionId === activeGame.correctOptionId;
      const puntos = puntosDeTrivia(acerto, milisegundos);
      const respuesta = {
        questionId: activeGame.launchedAt,
        answerId: optionId,
        correct: acerto,
        answeredAt: new Date().toISOString(),
        puntos,
      };
      const nuevo = {
        guestId: jugador.clave,
        guestName: jugador.nombre,
        ...(jugador.mesa || previo?.tableNumber ? { tableNumber: jugador.mesa || previo?.tableNumber } : {}),
        score: (previo?.score || 0) + puntos,
        answers: [...(previo?.answers || []), respuesta],
      };
      if (indice >= 0) participants[indice] = nuevo;
      else participants.push(nuevo);
      return { ...fresca, triviaGame: { ...triviaGame, participants } };
    }, { publicRsvp: true });

    if (!guardado.success) return { success: false, error: guardado.error || 'No se pudo guardar tu respuesta.' };
    return { success: true, ...resultado };
  } catch (err: any) {
    return { success: false, error: err.message || 'No se pudo guardar tu respuesta.' };
  }
}

/**
 * Lo que el celular muestra de SU progreso, leído del servidor (no de memoria): lo que contestó en la
 * pregunta en pantalla, su puntaje de trivia y las misiones de fotos que ya cumplió.
 */
export async function getMiProgresoDeJuegos(
  fiestaId: string,
  quien: QuienJuega,
): Promise<{
  trivia: { puntos: number; lanzada?: string; respuesta?: { optionId: string; puntos: number } };
  misiones: { cumplidas: string[]; puntos: number };
}> {
  const vacio = { trivia: { puntos: 0 }, misiones: { cumplidas: [] as string[], puntos: 0 } };
  try {
    const fiesta = await getFiestaPublica(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return vacio;
    const jugador = resolverJugador(fiesta, quien);
    if (!jugador) return vacio;
    const yo = (fiesta.triviaGame?.participants || []).find((p) => p.guestId === jugador.clave);
    const lanzada = fiesta.socialGallerySettings?.activeGame?.launchedAt;
    const respondida = lanzada ? yo?.answers?.find((a) => a.questionId === lanzada) : undefined;
    const mision = fiesta.misionesFotos?.[jugador.clave];
    return {
      trivia: {
        puntos: yo?.score || 0,
        ...(lanzada ? { lanzada } : {}),
        ...(respondida ? { respuesta: { optionId: respondida.answerId, puntos: respondida.puntos || 0 } } : {}),
      },
      misiones: { cumplidas: mision?.misiones || [], puntos: mision?.puntos || 0 },
    };
  } catch {
    return vacio;
  }
}

/** El operador muestra la respuesta correcta: desde ahí la pregunta cierra y ya no se suma. */
export async function revelarRespuestaTrivia(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const guardado = await actualizarFiesta(fiestaId, (fresca) => {
      const activeGame = fresca.socialGallerySettings?.activeGame;
      if (!activeGame || activeGame.type !== 'trivia') throw new Error('No hay una trivia en pantalla.');
      if (!activeGame.correctOptionId) throw new Error('Esta pregunta no tiene respuesta correcta cargada.');
      return {
        ...fresca,
        socialGallerySettings: { ...(fresca.socialGallerySettings as any), activeGame: { ...activeGame, respuestaRevelada: true } },
      };
    }, { publicRsvp: true });
    return guardado.success ? { success: true } : { success: false, error: guardado.error || 'No se pudo revelar la respuesta.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'No se pudo revelar la respuesta.' };
  }
}

/** Termina la trivia: deja el podio por mesa y el top 5 individual para la pantalla gigante. */
export async function terminarTrivia(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const guardado = await actualizarFiesta(fiestaId, (fresca) => {
      const activeGame = fresca.socialGallerySettings?.activeGame;
      if (!activeGame || activeGame.type !== 'trivia') throw new Error('No hay una trivia en pantalla.');
      const participantes = fresca.triviaGame?.participants || [];
      return {
        ...fresca,
        socialGallerySettings: {
          ...(fresca.socialGallerySettings as any),
          activeGame: {
            ...activeGame,
            isFinished: true,
            respuestaRevelada: true,
            tableLeaderboard: calculateLeaderboard(participantes).tableLeaderboard,
            topJugadores: topCinco(participantes.map((p) => ({ nombre: p.guestName, puntos: p.score }))),
          },
        },
      };
    }, { publicRsvp: true });
    return guardado.success ? { success: true } : { success: false, error: guardado.error || 'No se pudo terminar la trivia.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'No se pudo terminar la trivia.' };
  }
}


/**
 * Genera automáticamente una trivia divertida de 5 preguntas usando IA Gemini.
 * Requiere presupuesto de IA y la confirmación posterior del equipo antes de jugar.
 */
export async function generarTriviaConIa(
  fiestaId: string
): Promise<{ success: boolean; trivia?: TriviaGame; error?: string }> {
  await requireAppSession();
  try {
    await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    const canUseAI = await hayPresupuestoParaIA().catch(() => false);
    if (!canUseAI) {
      return { success: false, error: 'Tope de IA agotado para este período.' };
    }

    const fiesta = await getFiestaById(fiestaId, LECTURA_COMPLETA);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada.' };

    const nombre = fiesta.configuracion?.nombreEvento || fiesta.configuracion?.clienteNombre || 'la fiesta';
    const historia = (fiesta as any).historia || (fiesta.configuracion as any)?.observaciones || '';

    let preguntas: TriviaQuestion[] = [];

    try {
      const prompt = `Generá 5 preguntas divertidas de trivia para una fiesta llamada "${nombre}". ${
        historia
          ? `Datos e historia del cliente: ${historia}.`
          : 'No hay datos personales cargados, generá preguntas de cultura general de fiestas, baile, música y tradiciones de celebraciones.'
      }
Respondé ÚNICAMENTE un array JSON con 5 objetos con el formato:
[
  {
    "id": "q1",
    "question": "¿...",
    "options": [
      { "id": "a", "text": "...", "emoji": "🎉" },
      { "id": "b", "text": "...", "emoji": "💃" },
      { "id": "c", "text": "...", "emoji": "🎵" },
      { "id": "d", "text": "...", "emoji": "🥂" }
    ],
    "correctOptionId": "a"
  }
]`;

      const response = await generateWithGeminiFallback({
        model: geminiModel,
        prompt,
      });

      await registrarConsumoIA('trivia-ia');

      const jsonMatch = response.text?.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        preguntas = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback a preguntas de cultura general de fiestas
    }

    if (!preguntas || preguntas.length === 0) {
      preguntas = [
        {
          id: 'q1',
          question: '¿Cuál es el clásico tema que nunca puede faltar en el vals de una fiesta?',
          options: [
            { id: 'a', text: 'Danubio Azul', emoji: '🎻' },
            { id: 'b', text: 'Cumbia tropical', emoji: '🥁' },
            { id: 'c', text: 'Rock and roll', emoji: '🎸' },
            { id: 'd', text: 'Reggaetón', emoji: '📻' },
          ],
          correctOptionId: 'a',
        },
        {
          id: 'q2',
          question: '¿A qué hora suele servirse el tradicional postre o torta principal?',
          options: [
            { id: 'a', text: 'Al inicio', emoji: '🕒' },
            { id: 'b', text: 'En la mitad de la noche', emoji: '🎂' },
            { id: 'c', text: 'Antes del amanecer', emoji: '🌅' },
            { id: 'd', text: 'En la recepción', emoji: '🍸' },
          ],
          correctOptionId: 'b',
        },
        {
          id: 'q3',
          question: '¿Qué canción suele abrir la tanda de baile más prendida?',
          options: [
            { id: 'a', text: 'Música clásica', emoji: '🎼' },
            { id: 'b', text: 'Cumbia retro o hits del momento', emoji: '💃' },
            { id: 'c', text: 'Jazz instrumental', emoji: '🎷' },
            { id: 'd', text: 'Tango tradicional', emoji: '🎩' },
          ],
          correctOptionId: 'b',
        },
        {
          id: 'q4',
          question: '¿Qué bebida clásica suele brindar toda la mesa a la medianoche?',
          options: [
            { id: 'a', text: 'Champagne o Espumante', emoji: '🥂' },
            { id: 'b', text: 'Agua mineral', emoji: '💧' },
            { id: 'c', text: 'Café', emoji: '☕' },
            { id: 'd', text: 'Té verde', emoji: '🍵' },
          ],
          correctOptionId: 'a',
        },
        {
          id: 'q5',
          question: '¿Qué estación interactiva es la más concurrida para llevarse fotos impresas?',
          options: [
            { id: 'a', text: 'La Fotocabina AK', emoji: '📸' },
            { id: 'b', text: 'El guardarropa', emoji: '🧥' },
            { id: 'c', text: 'El estacionamiento', emoji: '🚗' },
            { id: 'd', text: 'La cocina', emoji: '🍳' },
          ],
          correctOptionId: 'a',
        },
      ];
    }

    const nuevaTrivia: TriviaGame = {
      id: `trivia_${fiestaId}_${Date.now()}`,
      fiestaId,
      title: `Trivia de la Noche - ${nombre}`,
      questions: preguntas,
      createdAt: new Date().toISOString(),
      status: 'draft',
      confirmadaPorEquipo: false,
    };

    const guardado = await saveFiesta({
      ...fiesta,
      triviaGame: nuevaTrivia,
    });
    if (!guardado.success) {
      return { success: false, error: guardado.error || 'No se pudo guardar la trivia.' };
    }

    return { success: true, trivia: nuevaTrivia };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al generar trivia con IA.' };
  }
}

export async function confirmarTrivia(
  fiestaId: string,
  preguntas?: TriviaQuestion[]
): Promise<{ success: boolean; trivia?: TriviaGame; error?: string }> {
  await requireAppSession();
  try {
    const fiesta = await requireEventPermission(fiestaId, PERMISOS.NOCHE);
    if (!fiesta.triviaGame) {
      return { success: false, error: 'No hay trivia para confirmar.' };
    }

    const triviaActualizada: TriviaGame = {
      ...fiesta.triviaGame,
      questions: preguntas || fiesta.triviaGame.questions,
      confirmadaPorEquipo: true,
      status: 'active',
    };

    const res = await saveFiesta({
      ...fiesta,
      triviaGame: triviaActualizada,
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Error al confirmar la trivia.' };
    }

    return { success: true, trivia: triviaActualizada };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al confirmar la trivia.' };
  }
}
