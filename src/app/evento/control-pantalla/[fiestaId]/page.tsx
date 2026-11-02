'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Megaphone,
  Trophy,
  HelpCircle,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Video,
  Eye,
  EyeOff,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import {
  obtenerEstadoControlPantalla,
  nextScreenItem,
  prevScreenItem,
  playScreenPlaylist,
  pauseScreenPlaylist,
  goToScreenItem,
  updateLedMessage,
  launchGame,
  clearActiveGame,
  startSorteoSpinOnScreen,
  triggerSorteoWinner,
  getMuroParticipantesForSorteo,
} from '@/app/actions/fiesta/screen-mode.actions';
import { getSocialPosts, moderateSocialPost } from '@/app/actions/social-gallery';
import { terminarTrivia, revelarRespuestaTrivia } from '@/app/actions/games.actions';
import { AvisoDeDatos } from '@/components/privacidad/AvisoDeDatos';
import type { ActiveGameData, ScreenPlaylistItem } from '@/types/fiesta';
import type { SocialGalleryPost } from '@/types/social-gallery';

const FRASES_RAPIDAS = [
  '¡A la pista!',
  '¡Se viene el vals!',
  '¡Brindis!',
  'Sacate una foto en la cabina',
];

export default function ControlPantallaPage() {
  const params = useParams();
  const fiestaId = (params?.fiestaId as string) || '';

  // Permisos y carga inicial
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estado en vivo de la pantalla
  const [fiestaNombre, setFiestaNombre] = useState('Fiesta');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentItem, setCurrentItem] = useState<{ id: string; title: string; type: string } | null>(null);
  const [playlist, setPlaylist] = useState<ScreenPlaylistItem[]>([]);
  const [ledMarqueeText, setLedMarqueeText] = useState('');
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
  const [activeSorteoWinner, setActiveSorteoWinner] = useState<string | null>(null);

  // Últimas fotos
  const [ultimasFotos, setUltimasFotos] = useState<SocialGalleryPost[]>([]);

  // Anuncio rápido
  const [anuncioTexto, setAnuncioTexto] = useState('');

  // Estados de acción y fallas
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [sorteoSpinning, setSorteoSpinning] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mostrarFeedback = (msg: string) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setFeedbackMessage(msg);
    feedbackTimeoutRef.current = setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Carga periódica de fotos aprobadas
  const refrescarFotos = useCallback(async () => {
    if (!fiestaId) return;
    try {
      const posts = await getSocialPosts(fiestaId);
      const aprobadas = posts
        .filter((p) => (p.moderationStatus ?? 'approved') === 'approved')
        .slice(0, 6);
      setUltimasFotos(aprobadas);
    } catch {
      // Si falla la lectura de fotos no bloquea el control de pantalla
    }
  }, [fiestaId]);

  // Carga periódica del estado de la pantalla (cada 2 segundos)
  const refrescarEstado = useCallback(async (silencioso = true) => {
    if (!fiestaId) return;
    try {
      const estado = await obtenerEstadoControlPantalla(fiestaId);
      if (!estado.authorized) {
        setAuthorized(false);
        setAuthError(estado.error || 'Acceso no autorizado. Se requieren permisos de noche.');
        return;
      }
      setAuthorized(true);
      if (estado.fiestaNombre) setFiestaNombre(estado.fiestaNombre);
      if (estado.isPlaying !== undefined) setIsPlaying(estado.isPlaying);
      if (estado.currentItem) setCurrentItem(estado.currentItem);
      if (estado.playlist) setPlaylist(estado.playlist);
      if (estado.ledMarqueeText !== undefined) setLedMarqueeText(estado.ledMarqueeText);
      setActiveGame(estado.activeGame ?? null);
      setActiveSorteoWinner(estado.activeSorteoWinner ?? null);
    } catch {
      if (!silencioso) {
        setErrorMessage('No llegó a la pantalla. Probá de nuevo');
      }
    } finally {
      setLoadingInitial(false);
    }
  }, [fiestaId]);

  // Intervalo cada 2 segundos para reflejar en tiempo real qué se ve
  useEffect(() => {
    refrescarEstado(false);
    refrescarFotos();

    const intervalEstado = setInterval(() => {
      refrescarEstado(true);
    }, 2000);

    const intervalFotos = setInterval(() => {
      refrescarFotos();
    }, 5000);

    return () => {
      clearInterval(intervalEstado);
      clearInterval(intervalFotos);
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, [refrescarEstado, refrescarFotos]);

  // Ejecutor de acciones con manejo de fallas y rollback
  const ejecutarAccion = async (
    accion: () => Promise<{ success: boolean; error?: string }>,
    optimista?: () => void,
    revertir?: () => void
  ) => {
    setErrorMessage(null);
    setAccionEnCurso(true);
    if (optimista) optimista();

    try {
      const res = await accion();
      if (!res.success) {
        if (revertir) revertir();
        setErrorMessage('No llegó a la pantalla. Probá de nuevo');
      } else {
        await refrescarEstado(true);
      }
    } catch {
      if (revertir) revertir();
      setErrorMessage('No llegó a la pantalla. Probá de nuevo');
    } finally {
      setAccionEnCurso(false);
    }
  };

  // Botones de la barra fija
  const handleAnterior = () => {
    ejecutarAccion(() => prevScreenItem(fiestaId));
  };

  const handlePausarSeguir = () => {
    const estadoPrevio = isPlaying;
    ejecutarAccion(
      () => (estadoPrevio ? pauseScreenPlaylist(fiestaId) : playScreenPlaylist(fiestaId)),
      () => setIsPlaying(!estadoPrevio),
      () => setIsPlaying(estadoPrevio)
    );
  };

  const handleSiguiente = () => {
    ejecutarAccion(() => nextScreenItem(fiestaId));
  };

  // Botones de un toque: Fotos del muro y Video
  const handleMostrarFotos = () => {
    const itemMural = playlist.find(
      (i) => i.type === 'mural' || i.title.toLowerCase().includes('mural') || i.title.toLowerCase().includes('foto')
    );
    const itemId = itemMural?.id || 'item_mural';
    ejecutarAccion(() => goToScreenItem(fiestaId, itemId));
    mostrarFeedback('Fotos del muro en pantalla');
  };

  const handlePonerVideo = () => {
    const itemVideo = playlist.find(
      (i) => i.type === 'video' || i.title.toLowerCase().includes('video')
    );
    const itemId = itemVideo?.id || 'item_video';
    ejecutarAccion(() => goToScreenItem(fiestaId, itemId));
    mostrarFeedback('Video en pantalla');
  };

  // Anuncio rápido
  const handleEnviarAnuncio = (textoParaMandar?: string) => {
    const texto = (textoParaMandar !== undefined ? textoParaMandar : anuncioTexto).trim();
    if (!texto) return;

    const textoPrevio = ledMarqueeText;
    ejecutarAccion(
      () => updateLedMessage(fiestaId, texto),
      () => {
        setLedMarqueeText(texto);
        setAnuncioTexto('');
      },
      () => setLedMarqueeText(textoPrevio)
    );
    mostrarFeedback('Anuncio enviado a la pantalla');
  };

  const handleBorrarAnuncio = () => {
    const textoPrevio = ledMarqueeText;
    ejecutarAccion(
      () => updateLedMessage(fiestaId, ''),
      () => setLedMarqueeText(''),
      () => setLedMarqueeText(textoPrevio)
    );
  };

  // Trivia
  const handleLanzarTrivia = () => {
    const triviaData: Omit<ActiveGameData, 'launchedAt'> = {
      type: 'trivia',
      title: 'TRIVIA DE LA FIESTA 🧠',
      subtitle: '¡Respondé en tu celular!',
      options: [
        { id: 'opt_0', text: 'Opción 1' },
        { id: 'opt_1', text: 'Opción 2' },
        { id: 'opt_2', text: 'Opción 3' },
        { id: 'opt_3', text: 'Opción 4' },
      ],
      correctOptionId: 'opt_0',
    };

    ejecutarAccion(
      () => launchGame(fiestaId, triviaData),
      () => setActiveGame({ ...triviaData, launchedAt: new Date().toISOString() }),
      () => setActiveGame(null)
    );
    mostrarFeedback('Trivia lanzada a la pantalla');
  };

  const handleRevelarRespuestaTrivia = () => {
    ejecutarAccion(() => revelarRespuestaTrivia(fiestaId));
  };

  const handleTerminarJuego = () => {
    ejecutarAccion(async () => {
      if (activeGame?.type === 'trivia') {
        await terminarTrivia(fiestaId);
      }
      return clearActiveGame(fiestaId);
    }, () => setActiveGame(null));
    mostrarFeedback('Juego terminado');
  };

  // Sorteo
  const handleSorteo = async () => {
    if (sorteoSpinning) return;
    setErrorMessage(null);
    setSorteoSpinning(true);

    try {
      // 1. Inicia giro de la ruleta en la pantalla
      const resGiro = await startSorteoSpinOnScreen(fiestaId);
      if (!resGiro.success) {
        setErrorMessage('No llegó a la pantalla. Probá de nuevo');
        setSorteoSpinning(false);
        return;
      }

      mostrarFeedback('¡Girando ruleta en pantalla! 🎡');

      // 2. Obtiene participantes reales o fallback
      let candidatos: string[] = [];
      try {
        const partRes = await getMuroParticipantesForSorteo(fiestaId);
        if (partRes.success && partRes.participantes && partRes.participantes.length > 0) {
          candidatos = partRes.participantes;
        }
      } catch {
        // fallback
      }

      if (candidatos.length === 0) {
        if (ultimasFotos.length > 0) {
          candidatos = Array.from(new Set(ultimasFotos.map((f) => f.authorName).filter(Boolean)));
        }
      }

      if (candidatos.length === 0) {
        candidatos = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6'];
      }

      const ganadorElegido = candidatos[Math.floor(Math.random() * candidatos.length)];

      // 3. Tras 4 segundos de suspense, revela el ganador en pantalla
      setTimeout(async () => {
        try {
          const resGanador = await triggerSorteoWinner(fiestaId, ganadorElegido);
          if (!resGanador.success) {
            setErrorMessage('No llegó a la pantalla. Probá de nuevo');
          } else {
            setActiveSorteoWinner(ganadorElegido);
            mostrarFeedback(`¡Ganador: ${ganadorElegido}! 🏆`);
          }
        } catch {
          setErrorMessage('No llegó a la pantalla. Probá de nuevo');
        } finally {
          setSorteoSpinning(false);
          await refrescarEstado(true);
        }
      }, 4000);
    } catch {
      setErrorMessage('No llegó a la pantalla. Probá de nuevo');
      setSorteoSpinning(false);
    }
  };

  // Ocultar foto
  const handleOcultarFoto = (fotoId: string) => {
    const fotoAEliminar = ultimasFotos.find((f) => f.id === fotoId);
    if (!fotoAEliminar) return;

    // Optimista
    setUltimasFotos((prev) => prev.filter((f) => f.id !== fotoId));

    ejecutarAccion(
      () => moderateSocialPost(fotoId, 'hidden', 'Control Remoto Celular'),
      undefined,
      () => {
        // Rollback: restaurar foto
        setUltimasFotos((prev) => [fotoAEliminar, ...prev]);
      }
    );
    mostrarFeedback('Foto ocultada');
  };

  // Pantalla de carga
  if (loadingInitial) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center overflow-x-hidden">
        <Loader2 className="w-12 h-12 text-amber-400 animate-spin mb-4" />
        <h1 className="text-xl font-bold">Cargando control de pantalla...</h1>
        <p className="text-sm text-slate-400 mt-2">Conectando con la pantalla del evento</p>
      </main>
    );
  }

  // Pantalla de acceso no autorizado
  if (authorized === false) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center overflow-x-hidden">
        <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 max-w-sm w-full space-y-4 shadow-2xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto" />
          <h1 className="text-2xl font-black text-white">Acceso no autorizado</h1>
          <p className="text-base text-slate-300 font-medium">
            {authError || 'Se requieren permisos de noche.'}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="w-full min-h-[56px] flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-base"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden pb-36 select-none">
      {/* Contenedor central optimizado para celular con una sola mano */}
      <div className="w-full max-w-md mx-auto px-4 py-4 space-y-5 overflow-x-hidden">

        {/* Encabezado superior */}
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs uppercase tracking-wider text-amber-400 font-black flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Control Remoto
            </span>
            <h1 className="text-xl font-black truncate text-white">{fiestaNombre}</h1>
          </div>
          <button
            onClick={() => {
              refrescarEstado(false);
              refrescarFotos();
            }}
            className="p-3 text-slate-400 hover:text-white rounded-xl active:scale-95"
            aria-label="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${accionEnCurso ? 'animate-spin' : ''}`} />
          </button>
        </header>

        {/* Cartel grande de falla si no llegó a la pantalla */}
        {errorMessage && (
          <div
            role="alert"
            className="bg-rose-600 border-2 border-rose-400 text-white font-black text-lg p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 shrink-0 text-white" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white hover:bg-rose-700 p-2 rounded-xl text-lg font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Notificación de confirmación exitosa */}
        {feedbackMessage && !errorMessage && (
          <div className="bg-emerald-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* ARRIBA: QUÉ SE VE AHORA EN LA PANTALLA (refrescado cada 2s) */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-bold tracking-wider">
            <span className="flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-amber-400" />
              En la pantalla gigante
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}
              />
              <span className={isPlaying ? 'text-emerald-400' : 'text-amber-400'}>
                {isPlaying ? 'Reproduciendo' : 'En pausa'}
              </span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-semibold mb-1">Ítem en curso</p>
            <p className="text-xl font-black text-white truncate">
              {currentItem?.title || 'Mural de fotos'}
            </p>
          </div>

          {/* Anuncio activo en la pantalla si existe */}
          {ledMarqueeText ? (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3.5 py-2.5 gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs font-bold text-amber-300 truncate">
                  Cartel LED: &quot;{ledMarqueeText}&quot;
                </p>
              </div>
              <button
                onClick={handleBorrarAnuncio}
                className="text-xs text-amber-400 hover:text-white font-bold px-2 py-1 rounded bg-amber-500/20"
              >
                Quitar
              </button>
            </div>
          ) : null}

          {/* Dinámica activa si hay */}
          {activeGame && (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-2xl px-3.5 py-2.5 gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-green-400 truncate">
                  🎮 {activeGame.title}
                </p>
              </div>
              <button
                onClick={handleTerminarJuego}
                className="text-xs text-rose-400 hover:text-white font-bold px-2 py-1 rounded bg-rose-500/20"
              >
                Detener
              </button>
            </div>
          )}

          {activeSorteoWinner && (
            <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-2xl px-3.5 py-2.5 text-center">
              <p className="text-xs font-bold text-fuchsia-400">
                🏆 Ganador sorteo: <span className="text-white font-black text-sm">{activeSorteoWinner}</span>
              </p>
            </div>
          )}
        </section>

        {/* BOTONES GRANDES DE UN TOQUE (Muro y Video) */}
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold px-1">
            Accesos directos
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMostrarFotos}
              className="min-h-[56px] w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2.5 px-3 py-3 shadow-lg shadow-violet-600/20 active:scale-95 transition-all"
            >
              <ImageIcon className="w-5 h-5 shrink-0" />
              <span className="text-center leading-tight">Mostrar fotos del muro</span>
            </button>

            <button
              onClick={handlePonerVideo}
              className="min-h-[56px] w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2.5 px-3 py-3 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
            >
              <Video className="w-5 h-5 shrink-0" />
              <span className="text-center leading-tight">Poner el video</span>
            </button>
          </div>
        </section>

        {/* ANUNCIO RÁPIDO */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Anuncio rápido</h2>
          </div>

          <div className="space-y-2.5">
            <input
              type="text"
              value={anuncioTexto}
              onChange={(e) => setAnuncioTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEnviarAnuncio();
              }}
              placeholder="Escribí el texto del anuncio..."
              className="w-full min-h-[56px] bg-slate-950 border-2 border-slate-700 focus:border-amber-400 text-white placeholder-slate-500 px-4 rounded-2xl text-base font-medium outline-none transition-colors"
            />

            <button
              onClick={() => handleEnviarAnuncio()}
              disabled={!anuncioTexto.trim()}
              className="w-full min-h-[56px] bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Megaphone className="w-5 h-5" />
              Mandar a la pantalla
            </button>
          </div>

          {/* 4 FRASES LISTAS DE UN TOQUE */}
          <div className="pt-2">
            <p className="text-xs text-slate-400 font-bold mb-2">Frases listas de un toque:</p>
            <div className="grid grid-cols-2 gap-2">
              {FRASES_RAPIDAS.map((frase) => (
                <button
                  key={frase}
                  onClick={() => {
                    setAnuncioTexto(frase);
                    handleEnviarAnuncio(frase);
                  }}
                  className="min-h-[56px] w-full bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-white font-bold text-sm rounded-xl px-3 py-2 flex items-center justify-center text-center leading-snug active:scale-95 transition-all"
                >
                  {frase}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center opacity-70 scale-90">
            <AvisoDeDatos para="invitado" />
          </div>
        </section>

        {/* JUEGOS Y SORTEO */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Juegos y sorteo
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleLanzarTrivia}
              className="min-h-[56px] w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 px-3 py-3 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <HelpCircle className="w-5 h-5 shrink-0" />
              <span>Lanzar trivia</span>
            </button>

            <button
              onClick={handleTerminarJuego}
              className="min-h-[56px] w-full bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white font-black text-base rounded-2xl flex items-center justify-center gap-2 px-3 py-3 shadow-lg shadow-rose-700/20 active:scale-95 transition-all"
            >
              <span>Terminar juego</span>
            </button>
          </div>

          {/* Si hay trivia activa, botón para mostrar respuesta */}
          {activeGame?.type === 'trivia' && !activeGame.respuestaRevelada && (
            <button
              onClick={handleRevelarRespuestaTrivia}
              className="min-h-[56px] w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            >
              <span>Mostrar respuesta correcta</span>
            </button>
          )}

          {/* Botón de Sorteo */}
          <button
            onClick={handleSorteo}
            disabled={sorteoSpinning}
            className="min-h-[56px] w-full bg-fuchsia-600 hover:bg-fuchsia-500 active:bg-fuchsia-700 disabled:opacity-50 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 px-4 py-3 shadow-lg shadow-fuchsia-600/20 active:scale-95 transition-all"
          >
            {sorteoSpinning ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>¡Girando en pantalla! 🎡</span>
              </>
            ) : (
              <>
                <Trophy className="w-6 h-6" />
                <span>Girar y mostrar ganador</span>
              </>
            )}
          </button>
        </section>

        {/* ÚLTIMAS FOTOS */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-400" />
              Últimas fotos ({ultimasFotos.length})
            </h2>
            <button
              onClick={refrescarFotos}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refrescar
            </button>
          </div>

          {ultimasFotos.length === 0 ? (
            <div className="bg-slate-950/60 rounded-2xl p-6 text-center text-slate-400 text-sm">
              No hay fotos aprobadas en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ultimasFotos.map((foto) => (
                <div
                  key={foto.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between p-2 space-y-2"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.imageUrl}
                      alt={foto.authorName || 'Foto'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5">
                      <p className="text-[11px] font-bold text-white truncate">
                        {foto.authorName || 'Invitado'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOcultarFoto(foto.id)}
                    className="min-h-[44px] w-full bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <EyeOff className="w-4 h-4" />
                    Ocultar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enlace visible a moderación completa */}
          <div className="pt-2">
            <Link
              href={`/evento/moderacion/${fiestaId}`}
              className="min-h-[56px] w-full border-2 border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-base rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <span>Ir a moderación completa</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>

      {/* BARRA FIJA ABAJO */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 border-t border-slate-800 p-3 pb-safe backdrop-blur-md">
        <div className="w-full max-w-md mx-auto grid grid-cols-3 gap-2">
          {/* Botón Anterior */}
          <button
            onClick={handleAnterior}
            className="min-h-[56px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            aria-label="Anterior"
          >
            <SkipBack className="w-5 h-5 shrink-0" />
            <span>Anterior</span>
          </button>

          {/* Botón Pausar / Seguir */}
          <button
            onClick={handlePausarSeguir}
            className={`min-h-[56px] font-black text-sm sm:text-base rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
            aria-label={isPlaying ? 'Pausar' : 'Seguir'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5 shrink-0 fill-current" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 shrink-0 fill-current" />
                <span>Seguir</span>
              </>
            )}
          </button>

          {/* Botón Siguiente */}
          <button
            onClick={handleSiguiente}
            className="min-h-[56px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md"
            aria-label="Siguiente"
          >
            <span>Siguiente</span>
            <SkipForward className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </footer>
    </div>
  );
}
